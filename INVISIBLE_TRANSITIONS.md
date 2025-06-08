# Invisible Transitions Feature Implementation

## Overview

Invisible transitions are special transition types in Petri nets, typically used for modeling internal logic or control flow, not representing actual business activities. In PNML files, these transitions are usually marked as `activity="$invisible$"`.

## Implemented Features

### 1. Automatic Detection of Invisible Transitions

- **Detection Logic**: `transition.label is None`
- **Data Source**: When PM4Py parses PNML, invisible transitions have their `label` set to `None`
- **Name Retrieval**: Display name obtained from `transition.properties['trans_name_tag']`

### 2. Data Flow Processing

#### Backend Processing

1. **Data Model** (`backend/app/models/petri_net.py`)

   - Added `isInvisible: Optional[bool] = False` field

2. **PM4Py Service** (`backend/app/services/pm4py_service.py`)
   - Detect invisible transitions: `is_invisible = transition.label is None`
   - Correctly obtain names: priority order `label` → `properties['trans_name_tag']` → `transition_id`
   - Set `isInvisible` flag in NodeData

#### Frontend Processing

3. **Layout Service** (`frontend/src/services/layoutService.js`)

   - Pass `isInvisible` information to React components

4. **TransitionNode Component** (`frontend/src/components/TransitionNode.jsx`)
   - Receive `isInvisible` property
   - Apply special CSS class `invisibleTransition`

### 3. Visual Effects

#### Normal Transitions

- White background
- Black border
- Black text

#### Invisible Transitions

- **Black background** (#333)
- **Black border** (#333)
- **White text**
- On hover: Dark gray background (#555)

## Testing Verification

### Test Cases

```xml
<!-- Normal Transition -->
<transition id="n5">
    <name><text>Attended_lecture</text></name>
</transition>

<!-- Invisible Transitions -->
<transition id="n7">
    <name><text>tau from tree1</text></name>
    <toolspecific tool="ProM" version="6.4" activity="$invisible$"/>
</transition>
```

### Expected Results

- **n5**: White background, displays "Attended_lecture"
- **n7**: Black background, white text, displays "tau from tree1"

## Technical Details

### PM4Py Object Properties

```python
# Normal transition
transition.name = "n5"
transition.label = "Attended_lecture"
transition.properties = {'trans_name_tag': 'Attended_lecture'}

# Invisible transition
transition.name = "n7"
transition.label = None  # Key identifier
transition.properties = {'trans_name_tag': 'tau from tree1'}
```

### CSS Style Implementation

```css
.invisibleTransition .transitionRect {
  background: #333;
  border-color: #333;
  color: white;
}

.invisibleTransition .transitionId {
  color: white;
}

.invisibleTransition .transitionName {
  color: white;
  background: rgba(51, 51, 51, 0.9);
  border-color: #333;
}
```

## Statistics

The application automatically counts:

- `visible_transitions`: Number of normal transitions
- `invisible_transitions`: Number of invisible transitions

This information is displayed in the Toolbar component to help users understand the Petri net structure.

## Use Cases

Invisible transitions are commonly used for:

1. **Control Flow Modeling**: Representing internal logic transitions
2. **Synchronization Points**: Coordinating multiple parallel branches
3. **Abstraction**: Hiding implementation details, focusing on main business processes
4. **Model Simplification**: Converting between different abstraction levels

Through special visual representation, users can clearly distinguish between business activities and internal control logic.
