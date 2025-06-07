#!/usr/bin/env python3
"""
Test script to verify PM4Py PNML export functionality
"""

import pm4py
from pm4py.objects.petri_net.obj import PetriNet, Marking
from pm4py.objects.petri_net.exporter import exporter as pnml_exporter
import tempfile
import os

def test_pnml_export():
    """Test PM4Py PNML export functionality"""
    
    # Create a simple Petri net for testing
    net = PetriNet("test_net")
    
    # Add places
    source = PetriNet.Place("source")
    sink = PetriNet.Place("sink")
    p1 = PetriNet.Place("p1")
    
    net.places.add(source)
    net.places.add(sink)
    net.places.add(p1)
    
    # Add transitions
    t1 = PetriNet.Transition("t1", "Task 1")
    t2 = PetriNet.Transition("t2", "Task 2")
    
    net.transitions.add(t1)
    net.transitions.add(t2)
    
    # Add arcs
    pm4py.objects.petri_net.utils.petri_utils.add_arc_from_to(source, t1, net)
    pm4py.objects.petri_net.utils.petri_utils.add_arc_from_to(t1, p1, net)
    pm4py.objects.petri_net.utils.petri_utils.add_arc_from_to(p1, t2, net)
    pm4py.objects.petri_net.utils.petri_utils.add_arc_from_to(t2, sink, net)
    
    # Create markings
    initial_marking = Marking()
    initial_marking[source] = 1
    
    final_marking = Marking()
    final_marking[sink] = 1
    
    print("Created test Petri net:")
    print(f"Places: {len(net.places)}")
    print(f"Transitions: {len(net.transitions)}")
    print(f"Arcs: {len(net.arcs)}")
    
    # Test export to file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.pnml', delete=False) as temp_file:
        temp_file_path = temp_file.name
    
    try:
        # Export using PM4Py
        pnml_exporter.apply(net, initial_marking, temp_file_path, final_marking=final_marking)
        print(f"Successfully exported PNML to: {temp_file_path}")
        
        # Read the file content
        with open(temp_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print(f"PNML file size: {len(content)} characters")
        print("PNML content preview:")
        print(content[:500] + "..." if len(content) > 500 else content)
        
        # Test export as string
        pnml_string = pnml_exporter.serialize(net, initial_marking, final_marking=final_marking)
        print(f"\nString export size: {len(pnml_string)} bytes")
        
        # Verify we can re-import the exported file
        net_imported, initial_imported, final_imported = pm4py.read_pnml(temp_file_path)
        print(f"\nRe-imported successfully:")
        print(f"Places: {len(net_imported.places)}")
        print(f"Transitions: {len(net_imported.transitions)}")
        print(f"Arcs: {len(net_imported.arcs)}")
        
        return True
        
    except Exception as e:
        print(f"Error during export: {e}")
        return False
    finally:
        # Clean up
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

if __name__ == "__main__":
    print("Testing PM4Py PNML export functionality...")
    success = test_pnml_export()
    print(f"\nTest {'PASSED' if success else 'FAILED'}") 