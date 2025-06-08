# Frontend Petri Net Data Structure Detailed Analysis

## Overall Architecture

The frontend Petri net is based on **React Flow**, using **Zustand** for state management, with data structures organized into the following layers:

```
Zustand Store (Global State)
├── nodes: Array<ReactFlowNode>     // Node array
├── edges: Array<ReactFlowEdge>     // Edge array
├── statistics: Statistics          // Statistics information
├── networkId: string              // Network ID
├── networkName: string            // Network name
└── selectedElement: Element       // Currently selected element
```

## Node Data Structure

### Place Node Structure

```javascript
{
  id: "n1",                    // Unique identifier
  type: "place",               // Node type
  position: { x: 100, y: 200 }, // Position on canvas
  data: {
    id: "n1",                  // Data ID (usually same as node ID)
    label: "source 1",         // Display label
    name: "source 1",          // Node name
    type: "place",             // Data type
    tokens: 1,                 // Current token count
    isInitialMarking: true,    // Whether it's initial marking
    isFinalMarking: false,     // Whether it's final marking
    attachPoints: 4            // Number of connection points
  }
}
```

### Transition Node Structure

```javascript
{
  id: "n5",                    // Unique identifier
  type: "transition",          // Node type
  position: { x: 300, y: 200 }, // Position on canvas
  data: {
    id: "n5",                  // Data ID
    label: "Attended_lecture", // Display label
    name: "Attended_lecture",  // Node name
    type: "transition",        // Data type
    isInvisible: false,        // Whether it's invisible transition
    attachPoints: 4            // Number of connection points
  }
}
```

## Edge Data Structure

```javascript
{
  id: "n1-n5",                // Edge ID (usually source-target format)
  source: "n1",               // Source node ID
  target: "n5",               // Target node ID
  sourceHandle: "source-point-0", // Source connection point ID
  targetHandle: "target-point-2", // Target connection point ID
  markerEnd: {                // Arrow marker
    type: "arrow",
    width: 15,
    height: 15,
    color: "#333"
  },
  style: {                    // Style
    stroke: "#333",
    strokeWidth: 2
  },
  animated: true,             // Whether animated
  reconnectable: true,        // Whether reconnectable
  data: {                     // Edge data
    weight: 1,                // Weight (default 1)
    type: "normal"            // Edge type
  }
}
```

## Statistics Information Structure

```javascript
{
  places: 4,                  // Number of places
  transitions: 4,             // Number of transitions
  arcs: 8,                    // Number of arcs
  tokens: 1,                  // Total token count
  visible_transitions: 2,     // Number of visible transitions
  invisible_transitions: 2,   // Number of invisible transitions
  has_initial_marking: true,  // Whether has initial marking
  has_final_marking: true,    // Whether has final marking
  is_sound: true             // Whether is sound network
}
```

## Selected Element Structure

```javascript
// Selected node
{
  type: "node",
  id: "n1"
}

// Selected edge
{
  type: "edge",
  id: "n1-n5"
}
```

## Data Flow Process

### 1. Import Process

```
PNML/APNML File → Backend Parsing → PetriNetData → Frontend Conversion → ReactFlow Format
```

### 2. Frontend Data Conversion

Data returned from backend is converted to ReactFlow compatible format:

```javascript
// Backend data format
{
  nodes: [
    {
      id: "n1",
      data: { name: "source 1", type: "place", tokens: 1 },
      position: { x: 6.25, y: 71.5 }
    }
  ],
  edges: [
    {
      id: "arc11",
      source: "n1",
      target: "n5",
      data: { weight: 1 }
    }
  ]
}

// Converted to frontend format (handled in LayoutService)
{
  nodes: [
    {
      id: "n1",
      type: "place",
      position: { x: 100, y: 200 }, // Re-layout
      data: {
        id: "n1",
        label: "source 1",
        name: "source 1",
        type: "place",
        tokens: 1,
        isInitialMarking: true,
        attachPoints: 4
      }
    }
  ],
  edges: [
    {
      id: "n1-n5",
      source: "n1",
      target: "n5",
      markerEnd: { type: "arrow" },
      style: { stroke: "#333" },
      data: { weight: 1 }
    }
  ]
}
```

## Rendering Layers

### 1. ReactFlow Canvas Layer

- Responsible for overall layout and interaction
- Handles dragging, zooming, connecting operations
- Manages selection state

### 2. Node Component Layer

- **PlaceNode**: Renders circular place nodes
  - Displays ID, name, tokens
  - Handles initial/final marking styles
  - Generates connection point handles
- **TransitionNode**: Renders rectangular transition nodes
  - Displays ID, name
  - Handles visible/invisible styles
  - Generates connection point handles

### 3. Connection Point System

Each node has multiple connection points (handles):

- **attachPoints**: Controls number of connection points (4-12)
- **Dynamic generation**: Evenly distributed based on node shape
- **Bidirectional handles**: Each point is both source and target

## Key Features

### 1. Bidirectional Data Binding

- Zustand Store ↔ ReactFlow State
- Automatic position change synchronization
- Real-time selection state updates

### 2. Type Safety

- Strict node type checking
- Petri net rule validation (place ↔ transition)
- Prevention of duplicate connections and self-loops

### 3. Dynamic Computation

- Automatic statistics updates
- Automatic layout adjustment
- Dynamic connection point generation

### 4. State Management

- Centralized global state management
- Operation history support
- Error state handling

## Data Persistence

### 1. Export Formats

Frontend data can be exported as:

- **PNML Format**: Standard Petri net exchange format
- **Image Format**: PNG/JPEG screenshots
- **JSON Format**: Complete state data

### 2. Data Integrity

- Maintains all original properties
- Supports extended properties
- Compatible with standard formats

## Summary

The frontend Petri net data structure design has the following characteristics:

1. **Clear Hierarchy**: Store → ReactFlow → Components
2. **Type Safety**: Strict data type definitions
3. **Highly Extensible**: Supports custom properties and components
4. **Performance Optimized**: Incremental updates and state synchronization
5. **User Friendly**: Intuitive interaction and visual feedback

This design maintains the mathematical rigor of Petri nets while providing good user experience and developer experience.
