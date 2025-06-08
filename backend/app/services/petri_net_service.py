from typing import Dict, List, Any, Tuple
import pm4py
from pm4py.objects.petri_net.obj import PetriNet, Marking
from ..models.petri_net import PetriNetData, NodeData, EdgeData, Node, Edge, Position
import uuid

class PetriNetService:
    """Handle Petri net related business logic"""
    
    def convert_pm4py_to_frontend(
        self, 
        net: PetriNet, 
        initial_marking: Marking, 
        final_marking: Marking
    ) -> PetriNetData:
        """Convert PM4Py Petri net objects to frontend format"""
        
        nodes = []
        edges = []
        
        # Create ID mapping for each place and transition
        element_to_id = {}
        
        # Process Places
        for place in net.places:
            place_id = f"place_{place.name}" if place.name else f"place_{id(place)}"
            element_to_id[place] = place_id
            
            # Determine number of tokens
            tokens = 0
            is_initial = place in initial_marking
            is_final = place in final_marking
            
            if is_initial:
                tokens = initial_marking[place]
            
            # Calculate position (simple grid layout)
            position = self._calculate_place_position(place, len(nodes))
            
            # Create NodeData
            node_data = NodeData(
                id=place_id,
                type="place",
                label=place.name or f"Place {len(nodes) + 1}",
                name=place.name or f"Place {len(nodes) + 1}",
                tokens=tokens,
                isInitialMarking=is_initial,
                isFinalMarking=is_final,
                attachPoints=4
            )
            
            # Create Node
            node = Node(
                id=place_id,
                type="place",
                position=Position(x=position["x"], y=position["y"]),
                data=node_data
            )
            nodes.append(node)
        
        # Process Transitions
        for transition in net.transitions:
            transition_id = f"transition_{transition.name}" if transition.name else f"transition_{id(transition)}"
            element_to_id[transition] = transition_id
            
            # Calculate position
            position = self._calculate_transition_position(transition, len(nodes))
            
            # Check if it's an invisible transition
            is_invisible = transition.label is None or transition.label == ""
            
            # Create NodeData
            node_data = NodeData(
                id=transition_id,
                type="transition",
                label=transition.label or transition.name or f"Transition {len(nodes) + 1}",
                name=transition.name or f"Transition {len(nodes) + 1}",
                isInvisible=is_invisible,
                attachPoints=4
            )
            
            # Create Node
            node = Node(
                id=transition_id,
                type="transition",
                position=Position(x=position["x"], y=position["y"]),
                data=node_data
            )
            nodes.append(node)
        
        # Process Arcs (Edges)
        for arc in net.arcs:
            source_id = element_to_id.get(arc.source)
            target_id = element_to_id.get(arc.target)
            
            if source_id and target_id:
                edge_id = f"{source_id}-{target_id}"
                
                # Determine connection points
                source_handle = "source-point-0"
                target_handle = "target-point-0"
                
                # Create EdgeData
                edge_data = EdgeData(weight=getattr(arc, 'weight', 1))
                
                # Create Edge
                edge = Edge(
                    id=edge_id,
                    source=source_id,
                    target=target_id,
                    sourceHandle=source_handle,
                    targetHandle=target_handle,
                    markerEnd={"type": "arrow"},
                    style={"stroke": "#333"},
                    data=edge_data
                )
                edges.append(edge)
        
        # Create PetriNetData object
        petri_net_data = PetriNetData(
            networkId=str(uuid.uuid4()),
            networkName="Discovered Petri Net",
            nodes=nodes,
            edges=edges,
            statistics={
                "places": len([n for n in nodes if n.type == "place"]),
                "transitions": len([n for n in nodes if n.type == "transition"]),
                "arcs": len(edges),
                "initial_places": len([n for n in nodes if n.type == "place" and n.data.isInitialMarking]),
                "final_places": len([n for n in nodes if n.type == "place" and n.data.isFinalMarking])
            },
            selectedElement=None,
            metadata={}
        )
        
        return petri_net_data
    
    def _calculate_place_position(self, place: PetriNet.Place, index: int) -> Dict[str, float]:
        """Calculate position for Place nodes"""
        # Simple grid layout
        cols = 4
        row = index // cols
        col = index % cols
        
        x = col * 200 + 100
        y = row * 150 + 100
        
        return {"x": float(x), "y": float(y)}
    
    def _calculate_transition_position(self, transition: PetriNet.Transition, index: int) -> Dict[str, float]:
        """Calculate position for Transition nodes"""
        # Simple grid layout, offset from places
        cols = 4
        row = index // cols
        col = index % cols
        
        x = col * 200 + 200  # Offset from places
        y = row * 150 + 150
        
        return {"x": float(x), "y": float(y)}
    
    def convert_frontend_to_pm4py(self, petri_net_data: PetriNetData) -> Tuple[PetriNet, Marking, Marking]:
        """Convert frontend format to PM4Py Petri net objects (for export functionality)"""
        
        net = PetriNet(petri_net_data.networkName or "Petri Net")
        initial_marking = Marking()
        final_marking = Marking()
        
        # Create ID to object mapping
        id_to_element = {}
        
        # Create Places
        for node in petri_net_data.nodes:
            if node.type == "place":
                place = PetriNet.Place(node.data.name)
                net.places.add(place)
                id_to_element[node.id] = place
                
                # Set marking
                if node.data.isInitialMarking:
                    initial_marking[place] = node.data.tokens or 0
                
                if node.data.isFinalMarking:
                    final_marking[place] = 1
        
        # Create Transitions
        for node in petri_net_data.nodes:
            if node.type == "transition":
                transition_name = node.data.name
                transition_label = None if node.data.isInvisible else node.data.label
                
                transition = PetriNet.Transition(transition_name, transition_label)
                net.transitions.add(transition)
                id_to_element[node.id] = transition
        
        # Create Arcs
        for edge in petri_net_data.edges:
            source = id_to_element.get(edge.source)
            target = id_to_element.get(edge.target)
            
            if source and target:
                from pm4py.objects.petri_net.utils import petri_utils
                petri_utils.add_arc_from_to(source, target, net, weight=edge.data.weight if edge.data else 1)
        
        return net, initial_marking, final_marking 