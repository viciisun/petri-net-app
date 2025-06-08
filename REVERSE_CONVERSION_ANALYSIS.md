# Frontend Store → PM4Py Objects → PNML Export Detailed Analysis

## Reverse Conversion Process Overview

```
Frontend Zustand Store → PetriNetData → PM4Py Objects → PNML String
     ↓                    ↓              ↓            ↓
React Flow Format      JSON Transfer Format    Python Objects     XML File
```

## Complete Data Conversion Chain

### 1. Frontend Data Collection (Header.jsx)

```javascript
// Collect complete state from Zustand Store
const handlePnmlExport = async () => {
  const petriNetData = {
    nodes: nodes, // React Flow node array
    edges: edges, // React Flow edge array
    statistics: statistics, // Statistics information
    networkId: networkId, // Network ID
    networkName: networkName, // Network name
  };

  // Send to backend
  const { blob, filename } = await apiService.exportPnml(petriNetData);
};
```

### 2. API Transfer Layer (apiService.js)

```javascript
async exportPnml(petriNetData) {
  const response = await fetch(`${this.baseURL}/api/export-pnml`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(petriNetData), // Serialize to JSON
  });

  const blob = await response.blob(); // Receive PNML file
  return { blob, filename };
}
```

### 3. Backend API Reception (petri_net.py)

```python
@router.post("/export-pnml")
async def export_pnml(request: Request):
    # Receive JSON data
    body = await request.json()

    # Convert to Pydantic model
    petri_net_data = PetriNetData(**body)

    # Call PM4Py service for export
    pnml_content = pm4py_service.export_to_pnml_string(petri_net_data)

    # Return XML file
    return Response(content=pnml_content, media_type="application/xml")
```

## Core Conversion Logic (\_rebuild_pm4py_objects)

### Step 1: Create PM4Py Network Objects

```python
def _rebuild_pm4py_objects(self, petri_net_data: PetriNetData):
    # Create new Petri net
    net = PetriNet(petri_net_data.networkId or "exported_net")

    # Set network name
    if petri_net_data.networkName:
        net._PetriNet__name = petri_net_data.networkName
```

### Step 2: Convert Place Nodes

```python
place_objects = {}

for node in petri_net_data.nodes:
    if node.type == "place":
        # Create PM4Py Place object
        place = PetriNet.Place(node.id)

        # Save name to properties (if different from ID)
        if node.data.name and node.data.name != node.id:
            if not hasattr(place, 'properties') or place.properties is None:
                place.properties = {}
            place.properties["place_name_tag"] = node.data.name

        net.places.add(place)
        place_objects[node.id] = place  # Establish mapping relationship
```

**Data Mapping Relationship**:

```
Frontend Place Node              PM4Py Place Object
├── id: "n1"              →     Place.name = "n1"
├── data.name: "source 1" →     Place.properties["place_name_tag"] = "source 1"
├── data.tokens: 1        →     initial_marking[place] = 1
└── data.isFinalMarking   →     final_marking[place] = 1
```

### Step 3: Convert Transition Nodes

```python
transition_objects = {}

for node in petri_net_data.nodes:
    if node.type == "transition":
        if hasattr(node.data, 'isInvisible') and node.data.isInvisible:
            # Invisible transition: label=None
            transition = PetriNet.Transition(node.id, None)
            # Name stored in properties
            if node.data.name and node.data.name != node.id:
                if not hasattr(transition, 'properties'):
                    transition.properties = {}
                transition.properties["trans_name_tag"] = node.data.name
        else:
            # Visible transition: use name as label
            label = node.data.name if node.data.name else node.id
            transition = PetriNet.Transition(node.id, label)

        net.transitions.add(transition)
        transition_objects[node.id] = transition
```

**Data Mapping Relationship**:

```
Frontend Transition Node          PM4Py Transition Object
├── id: "n5"                →     Transition.name = "n5"
├── data.name: "Activity"   →     Transition.label = "Activity" (visible)
├── data.isInvisible: true  →     Transition.label = None (invisible)
└── data.name (invisible)   →     Transition.properties["trans_name_tag"]
```

### Step 4: Convert Arc Connections

```python
for edge in petri_net_data.edges:
    # Get source and target objects
    source_obj = place_objects.get(edge.source) or transition_objects.get(edge.source)
    target_obj = place_objects.get(edge.target) or transition_objects.get(edge.target)

    if source_obj and target_obj:
        # Use PM4Py tools to create arc
        arc = petri_utils.add_arc_from_to(source_obj, target_obj, net)

        # Set weight (if not default value 1)
        if hasattr(edge, 'weight') and edge.weight and edge.weight != 1:
            arc.weight = edge.weight
```

**Data Mapping Relationship**:

```
Frontend Edge                PM4Py Arc Object
├── id: "n1-n5"        →     Arc.id (auto-generated)
├── source: "n1"       →     Arc.source = place_objects["n1"]
├── target: "n5"       →     Arc.target = transition_objects["n5"]
└── weight: 2          →     Arc.weight = 2
```

### Step 5: Create Marking Objects

```python
# Initial marking
initial_marking = Marking()
for node in petri_net_data.nodes:
    if node.type == "place" and hasattr(node.data, 'tokens') and node.data.tokens > 0:
        place_obj = place_objects[node.id]
        initial_marking[place_obj] = node.data.tokens

# Final marking
final_marking = Marking()
for node in petri_net_data.nodes:
    if (node.type == "place" and
        hasattr(node.data, 'isFinalMarking') and
        node.data.isFinalMarking):
        place_obj = place_objects[node.id]
        final_marking[place_obj] = 1  # Standard convention is 1 token
```

## PM4Py Export Process

### Final Export Call

```python
def export_to_pnml_string(self, petri_net_data: PetriNetData) -> str:
    # Rebuild PM4Py objects
    net, initial_marking, final_marking = self._rebuild_pm4py_objects(petri_net_data)

    # Use PM4Py exporter
    pnml_string = pnml_exporter.serialize(net, initial_marking, final_marking=final_marking)

    # Ensure string format return
    if isinstance(pnml_string, bytes):
        pnml_string = pnml_string.decode('utf-8')

    return pnml_string
```

## Data Fidelity Analysis

### Completely Preserved Information

- **Node ID and Names**: Completely preserved
- **Network Structure**: All connection relationships
- **Token Distribution**: Initial and final markings
- **Transition Types**: Visible/invisible states
- **Arc Weights**: Non-default weights
- **Network Metadata**: ID and names

### Processing During Conversion

- **Position Information**: Frontend layout info not exported to PNML (compliant with standard)
- **Connection Points**: React Flow specific handle info not exported
- **UI State**: Selection state, styles etc. not exported
- **Statistics**: Dynamically calculated, not stored in PNML

### Special Case Handling

- **Invisible Transitions**: `label=None` + properties store names
- **Names Different from ID**: Use properties tags for storage
- **Default Weights**: Weight of 1 not explicitly set
- **Empty Markings**: Places without tokens not in marking

## Key Technical Points

### 1. Object Mapping Management

```python
place_objects = {}      # ID → PM4Py Place objects
transition_objects = {} # ID → PM4Py Transition objects
```

Ensure correct object references when creating arcs.

### 2. Properties System

PM4Py uses properties dictionary to store extended information:

```python
place.properties = {"place_name_tag": "display_name"}
transition.properties = {"trans_name_tag": "activity_name"}
```

### 3. Marking Objects

PM4Py Marking is a dictionary type:

```python
Marking = Dict[Place, int]  # Place object → token count
```

### 4. Type Safety

Use Pydantic models to ensure correct data types:

```python
petri_net_data = PetriNetData(**body)  # Automatic validation and conversion
```

## Summary

The core of the reverse conversion process is **data structure mapping**:

1. **Frontend React Flow Format** → **Standardized JSON Format** → **PM4Py Python Objects** → **PNML XML Format**

2. **Key Mapping Relationships**:

   - React Flow nodes → PM4Py Place/Transition
   - React Flow edges → PM4Py Arc
   - Frontend token state → PM4Py Marking
   - Frontend properties → PM4Py Properties

3. **Data Integrity**: All core Petri net information is completely preserved, UI-specific information is properly filtered

4. **Standard Compatibility**: Exported PNML fully complies with standards and can be imported by other tools

This design ensures a complete data flow from user interaction to standard format export, maintaining both flexibility and compatibility.
