import tempfile
import os
import xml.etree.ElementTree as ET
from typing import Dict, List, Any, Tuple
import pm4py
from pm4py.objects.petri_net.obj import PetriNet, Marking
from pm4py.objects.petri_net.utils import petri_utils
from pm4py.objects.petri_net.exporter import exporter as pnml_exporter
from pm4py.algo.simulation.playout.petri_net import algorithm as playout_algorithm
import pandas as pd
from datetime import datetime, timedelta
from ..models.petri_net import Node, Edge, NodeData, Position, PetriNetData, EdgeData

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
            
            # Extract network information from PNML
            network_id, network_name = self._extract_network_info(temp_file_path, net)
            
            # Extract arc information from PNML
            arc_ids = self._extract_arc_info(temp_file_path)
            
            # Convert to React Flow format
            nodes, edges = self._convert_to_react_flow(net, initial_marking, final_marking, arc_ids)
            
            # Calculate statistics
            statistics = self._calculate_statistics(net, initial_marking, final_marking)
            
            return PetriNetData(
                nodes=nodes,
                edges=edges,
                statistics=statistics,
                networkId=network_id,
                networkName=network_name
            )
            
        except Exception as e:
            raise Exception(f"Failed to parse PNML file: {str(e)}")
        finally:
            # Clean up temporary file
            if temp_file_path and os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                if temp_file_path in self.temp_files:
                    self.temp_files.remove(temp_file_path)
    
    def _extract_network_info(self, pnml_file_path: str, net: PetriNet) -> Tuple[str, str]:
        """Extract network ID and name from PNML file"""
        try:
            tree = ET.parse(pnml_file_path)
            root = tree.getroot()
            
            # Find the net element
            net_element = root.find('.//{http://www.pnml.org/version-2009/grammar/pnml}net')
            if net_element is not None:
                network_id = net_element.get('id', 'net1')
                
                # Find the name element
                name_element = net_element.find('.//{http://www.pnml.org/version-2009/grammar/pnml}name/{http://www.pnml.org/version-2009/grammar/pnml}text')
                network_name = name_element.text if name_element is not None else network_id
                
                return network_id, network_name
        except Exception as e:
            print(f"Error extracting network info: {e}")
        
        # Fallback to PM4Py attributes
        network_id = getattr(net, 'name', None) or 'net1'
        network_name = getattr(net, 'properties', {}).get('name', network_id) if hasattr(net, 'properties') else network_id
        return network_id, network_name
    
    def _extract_arc_info(self, pnml_file_path: str) -> Dict[str, str]:
        """Extract arc IDs from PNML file"""
        arc_ids = {}
        try:
            tree = ET.parse(pnml_file_path)
            root = tree.getroot()
            
            # Find all arc elements
            for arc_element in root.findall('.//{http://www.pnml.org/version-2009/grammar/pnml}arc'):
                arc_id = arc_element.get('id')
                source = arc_element.get('source')
                target = arc_element.get('target')
                if arc_id and source and target:
                    arc_ids[f"{source}-{target}"] = arc_id
        except Exception as e:
            print(f"Error extracting arc info: {e}")
        
        return arc_ids
    
    def _convert_to_react_flow(self, net: PetriNet, initial_marking: Marking, final_marking: Marking, arc_ids: Dict[str, str]) -> Tuple[List[Node], List[Edge]]:
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
                    id=place_id,
                    type="place",
                    label=place_id,
                    name=place_name,
                    tokens=tokens,
                    isInitialMarking=is_initial_marking,
                    isFinalMarking=is_final_marking,
                    attachPoints=4
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
                    id=transition_id,
                    type="transition",
                    label=transition_id,
                    name=transition_name,
                    isInvisible=is_invisible,
                    attachPoints=4
                )
            )
            nodes.append(node)
        
        # Convert arcs to edges
        for arc in net.arcs:
            source_id = arc.source.name  # Source node ID
            target_id = arc.target.name  # Target node ID
            
            # Use original arc ID from PNML if available, otherwise generate one
            arc_key = f"{source_id}-{target_id}"
            edge_id = arc_ids.get(arc_key, arc_key)
            
            # Get weight from arc properties if available
            weight = 1
            if hasattr(arc, 'weight') and arc.weight:
                weight = arc.weight
            elif hasattr(arc, 'properties') and arc.properties:
                weight = arc.properties.get('weight', 1)
            
            edge = Edge(
                id=edge_id,
                source=source_id,
                target=target_id,
                data=EdgeData(weight=weight)
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
    
    def export_to_pnml_string(self, petri_net_data: PetriNetData) -> str:
        """Export PetriNetData to PNML string format"""
        try:
            # Rebuild PM4Py objects from frontend data
            net, initial_marking, final_marking = self._rebuild_pm4py_objects(petri_net_data)
            
            # Export to PNML string
            pnml_string = pnml_exporter.serialize(net, initial_marking, final_marking=final_marking)
            
            # Convert bytes to string if necessary
            if isinstance(pnml_string, bytes):
                pnml_string = pnml_string.decode('utf-8')
            
            return pnml_string
            
        except Exception as e:
            raise Exception(f"Failed to export PNML: {str(e)}")
    
    def _rebuild_pm4py_objects(self, petri_net_data: PetriNetData) -> Tuple[PetriNet, Marking, Marking]:
        """Rebuild PM4Py objects from frontend PetriNetData"""
        
        # Create new Petri net
        net = PetriNet(petri_net_data.networkId or "exported_net")
        
        # Set network name (PM4Py uses the name parameter in constructor)
        if petri_net_data.networkName and petri_net_data.networkName != net.name:
            # PM4Py PetriNet name is set in constructor, properties is read-only
            net._PetriNet__name = petri_net_data.networkName
        
        # Create place objects mapping
        place_objects = {}
        
        # Add places
        for node in petri_net_data.nodes:
            if node.type == "place":
                place = PetriNet.Place(node.id)
                
                # Add place name as property if different from ID
                if node.data.name and node.data.name != node.id:
                    if not hasattr(place, 'properties') or place.properties is None:
                        place.properties = {}
                    place.properties["place_name_tag"] = node.data.name
                
                net.places.add(place)
                place_objects[node.id] = place
        
        # Create transition objects mapping
        transition_objects = {}
        
        # Add transitions
        for node in petri_net_data.nodes:
            if node.type == "transition":
                # Handle invisible transitions
                if hasattr(node.data, 'isInvisible') and node.data.isInvisible:
                    # Invisible transition: no label
                    transition = PetriNet.Transition(node.id, None)
                    # Store name in properties
                    if node.data.name and node.data.name != node.id:
                        if not hasattr(transition, 'properties') or transition.properties is None:
                            transition.properties = {}
                        transition.properties["trans_name_tag"] = node.data.name
                else:
                    # Normal transition: use name as label
                    label = node.data.name if node.data.name else node.id
                    transition = PetriNet.Transition(node.id, label)
                
                net.transitions.add(transition)
                transition_objects[node.id] = transition
        
        # Add arcs
        for edge in petri_net_data.edges:
            source_obj = place_objects.get(edge.source) or transition_objects.get(edge.source)
            target_obj = place_objects.get(edge.target) or transition_objects.get(edge.target)
            
            if source_obj and target_obj:
                arc = petri_utils.add_arc_from_to(source_obj, target_obj, net)
                # Set weight if specified
                if edge.data and hasattr(edge.data, 'weight') and edge.data.weight and edge.data.weight != 1:
                    arc.weight = edge.data.weight
        
        # Create initial marking
        initial_marking = Marking()
        for node in petri_net_data.nodes:
            if node.type == "place" and hasattr(node.data, 'tokens') and node.data.tokens is not None and node.data.tokens > 0:
                place_obj = place_objects[node.id]
                initial_marking[place_obj] = node.data.tokens
        
        # Create final marking
        final_marking = Marking()
        for node in petri_net_data.nodes:
            if (node.type == "place" and 
                hasattr(node.data, 'isFinalMarking') and 
                node.data.isFinalMarking):
                place_obj = place_objects[node.id]
                # Set to 1 token for final marking (standard convention)
                final_marking[place_obj] = 1
        
        return net, initial_marking, final_marking

    def cleanup(self):
        """Clean up any remaining temporary files"""
        for temp_file in self.temp_files:
            if os.path.exists(temp_file):
                os.unlink(temp_file)
        self.temp_files.clear()

    def export_to_event_log(self, petri_net_data: PetriNetData, config: Dict[str, Any] = None) -> str:
        """Export PetriNetData to Event Log CSV string"""
        try:
            # Default configuration
            default_config = {
                'no_traces': 100,
                'max_trace_length': 50,
                'case_id_key': 'case:concept:name',
                'activity_key': 'concept:name',
                'timestamp_key': 'time:timestamp',
                'initial_timestamp': datetime.now()
            }
            
            # Merge with user config
            if config:
                default_config.update(config)
            
            # Rebuild PM4Py objects from frontend data
            net, initial_marking, final_marking = self._rebuild_pm4py_objects(petri_net_data)
            
            # Prepare parameters for PM4Py simulation
            parameters = {
                playout_algorithm.Variants.BASIC_PLAYOUT.value.Parameters.NO_TRACES: default_config['no_traces'],
                playout_algorithm.Variants.BASIC_PLAYOUT.value.Parameters.MAX_TRACE_LENGTH: default_config['max_trace_length'],
                playout_algorithm.Variants.BASIC_PLAYOUT.value.Parameters.CASE_ID_KEY: default_config['case_id_key'],
                playout_algorithm.Variants.BASIC_PLAYOUT.value.Parameters.ACTIVITY_KEY: default_config['activity_key'],
                playout_algorithm.Variants.BASIC_PLAYOUT.value.Parameters.TIMESTAMP_KEY: default_config['timestamp_key'],
                playout_algorithm.Variants.BASIC_PLAYOUT.value.Parameters.INITIAL_TIMESTAMP: int(default_config['initial_timestamp'].timestamp())
            }
            
            # Generate Event Log using PM4Py simulation
            event_log = playout_algorithm.apply(
                net, 
                initial_marking, 
                final_marking, 
                parameters=parameters
            )
            
            # Convert PM4Py EventLog to pandas DataFrame
            events_data = []
            for trace in event_log:
                case_id = trace.attributes.get(default_config['case_id_key'], f"case_{len(events_data)}")
                
                for event in trace:
                    event_data = {
                        'case_id': case_id,
                        'activity': event.get(default_config['activity_key'], 'Unknown'),
                        'timestamp': event.get(default_config['timestamp_key'], datetime.now()),
                        'lifecycle': event.get('lifecycle:transition', 'complete')
                    }
                    
                    # Add any additional event attributes
                    for key, value in event.items():
                        if key not in [default_config['activity_key'], default_config['timestamp_key'], 'lifecycle:transition']:
                            event_data[key] = value
                    
                    events_data.append(event_data)
            
            # Create DataFrame
            df = pd.DataFrame(events_data)
            
            # Sort by timestamp
            if not df.empty:
                df = df.sort_values('timestamp')
                df = df.reset_index(drop=True)
            
            # Convert to CSV string
            csv_string = df.to_csv(index=False)
            
            return csv_string
            
        except Exception as e:
            raise Exception(f"Failed to export Event Log: {str(e)}") 