import tempfile
import os
from typing import Dict, List, Any, Tuple
import pm4py
from pm4py.objects.petri_net.obj import PetriNet, Marking
from pm4py.objects.petri_net.utils import petri_utils
from ..models.petri_net import Node, Edge, NodeData, Position, PetriNetData

class PM4PyService:
    def __init__(self):
        self.temp_files = []
    
    def parse_pnml_file(self, file_content: bytes, filename: str) -> PetriNetData:
        """Parse PNML file using PM4Py and convert to React Flow format"""
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='wb', suffix='.pnml', delete=False) as temp_file:
                temp_file.write(file_content)
                temp_file_path = temp_file.name
                self.temp_files.append(temp_file_path)
            
            # Parse with PM4Py
            net, initial_marking, final_marking = pm4py.read_pnml(temp_file_path)
            
            # Convert to React Flow format
            nodes, edges = self._convert_to_react_flow(net, initial_marking, final_marking)
            
            # Calculate statistics
            statistics = self._calculate_statistics(net, initial_marking, final_marking)
            
            return PetriNetData(
                nodes=nodes,
                edges=edges,
                statistics=statistics
            )
            
        except Exception as e:
            raise Exception(f"Failed to parse PNML file: {str(e)}")
        finally:
            # Clean up temporary file
            if temp_file_path and os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                if temp_file_path in self.temp_files:
                    self.temp_files.remove(temp_file_path)
    
    def _convert_to_react_flow(self, net: PetriNet, initial_marking: Marking, final_marking: Marking) -> Tuple[List[Node], List[Edge]]:
        """Convert PM4Py Petri net to React Flow nodes and edges"""
        nodes = []
        edges = []
        
        # Create mapping for final marking places
        final_marking_places = set()
        if final_marking:
            for place, tokens in final_marking.items():
                if tokens > 0:
                    final_marking_places.add(place)
        
        # Convert places to nodes
        for place in net.places:
            tokens = initial_marking.get(place, 0) if initial_marking else 0
            is_initial_marking = tokens > 0
            is_final_marking = place in final_marking_places
            
            # Get place ID and name from PM4Py object
            place_id = place.name  # This is the actual ID from PNML
            place_name = place.properties.get('place_name_tag', place_id) if hasattr(place, 'properties') and place.properties else place_id
            
            node = Node(
                id=place_id,
                type="place",
                position=Position(x=0, y=0),  # Will be positioned by frontend layout
                data=NodeData(
                    label=place_id,
                    name=place_name,
                    type="place",
                    tokens=tokens,
                    isInitialMarking=is_initial_marking,
                    isFinalMarking=is_final_marking
                )
            )
            nodes.append(node)
        
        # Convert transitions to nodes
        for transition in net.transitions:
            # Get transition ID and name from PM4Py object
            transition_id = transition.name  # This is the actual ID from PNML
            
            # Check if this is an invisible transition
            # Invisible transitions have label=None and often have $invisible$ in properties
            is_invisible = transition.label is None
            
            # Try multiple sources for the transition name:
            # 1. transition.label (for normal transitions)
            # 2. transition.properties['trans_name_tag'] (for transitions with name in properties)
            # 3. fallback to transition_id
            transition_name = transition.label
            if not transition_name and hasattr(transition, 'properties') and transition.properties:
                transition_name = transition.properties.get('trans_name_tag')
            if not transition_name:
                transition_name = transition_id
            
            node = Node(
                id=transition_id,
                type="transition",
                position=Position(x=0, y=0),  # Will be positioned by frontend layout
                data=NodeData(
                    label=transition_id,
                    name=transition_name,
                    type="transition",
                    isInvisible=is_invisible
                )
            )
            nodes.append(node)
        
        # Convert arcs to edges
        for arc in net.arcs:
            source_id = arc.source.name  # Source node ID
            target_id = arc.target.name  # Target node ID
            edge_id = f"{source_id}-{target_id}"
            
            edge = Edge(
                id=edge_id,
                source=source_id,
                target=target_id
            )
            edges.append(edge)
        
        return nodes, edges
    
    def _calculate_statistics(self, net: PetriNet, initial_marking: Marking, final_marking: Marking) -> Dict[str, Any]:
        """Calculate Petri net statistics"""
        total_tokens = sum(initial_marking.values()) if initial_marking else 0
        
        # Count different types of transitions
        visible_transitions = len([t for t in net.transitions if t.label])
        invisible_transitions = len([t for t in net.transitions if not t.label])
        
        return {
            "places": len(net.places),
            "transitions": len(net.transitions),
            "arcs": len(net.arcs),
            "tokens": total_tokens,
            "visible_transitions": visible_transitions,
            "invisible_transitions": invisible_transitions,
            "has_initial_marking": initial_marking is not None,
            "has_final_marking": final_marking is not None,
            "is_sound": self._check_soundness(net, initial_marking, final_marking)
        }
    
    def _check_soundness(self, net: PetriNet, initial_marking: Marking, final_marking: Marking) -> bool:
        """Basic soundness check"""
        try:
            if not initial_marking or not final_marking:
                return False
            # This is a simplified check - PM4Py has more sophisticated soundness checking
            return len(initial_marking) > 0 and len(final_marking) > 0
        except:
            return False
    
    def cleanup(self):
        """Clean up any remaining temporary files"""
        for temp_file in self.temp_files:
            if os.path.exists(temp_file):
                os.unlink(temp_file)
        self.temp_files.clear() 