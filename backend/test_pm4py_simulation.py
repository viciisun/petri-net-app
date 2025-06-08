#!/usr/bin/env python3

import pm4py
from pm4py.objects.petri_net.obj import PetriNet, Marking
from pm4py.objects.petri_net.utils import petri_utils

def test_pm4py_simulation():
    """Test PM4Py simulation capabilities"""
    print("Testing PM4Py simulation capabilities...")
    print(f"PM4Py version: {pm4py.__version__}")
    
    # Create a simple Petri net
    net = PetriNet('test_net')
    source = PetriNet.Place('source')
    sink = PetriNet.Place('sink')
    transition = PetriNet.Transition('activity_A', 'Activity A')
    
    net.places.add(source)
    net.places.add(sink)
    net.transitions.add(transition)
    
    # Add arcs
    petri_utils.add_arc_from_to(source, transition, net)
    petri_utils.add_arc_from_to(transition, sink, net)
    
    # Create markings
    initial_marking = Marking()
    initial_marking[source] = 1
    final_marking = Marking()
    final_marking[sink] = 1
    
    print("Petri net created successfully")
    
    # Test simulation using play_out
    try:
        print("\nTesting pm4py.play_out()...")
        simulated_log = pm4py.play_out(net, initial_marking, final_marking, 
                                      no_traces=5, max_trace_length=10)
        print(f"Simulation successful! Generated {len(simulated_log)} traces")
        
        for i, trace in enumerate(simulated_log):
            activities = [event["concept:name"] for event in trace]
            print(f"Trace {i+1}: {activities}")
            
        return True, simulated_log
        
    except Exception as e:
        print(f"Simulation error: {e}")
        return False, None

def test_csv_reading():
    """Test PM4Py CSV reading capabilities"""
    print("\nTesting PM4Py CSV reading capabilities...")
    
    # Check available CSV functions
    csv_functions = [func for func in dir(pm4py) if 'csv' in func.lower()]
    print(f"Available CSV functions: {csv_functions}")
    
    # Check if read_csv exists
    if hasattr(pm4py, 'read_csv'):
        print("✓ pm4py.read_csv() is available")
        return True
    else:
        print("✗ pm4py.read_csv() is not available")
        return False

def test_process_discovery():
    """Test PM4Py process discovery capabilities"""
    print("\nTesting PM4Py process discovery capabilities...")
    
    discovery_functions = [func for func in dir(pm4py) if 'discover' in func.lower()]
    print(f"Available discovery functions: {discovery_functions}")
    
    # Check key discovery functions
    key_functions = [
        'discover_petri_net_inductive',
        'discover_petri_net_alpha', 
        'discover_petri_net_heuristics'
    ]
    
    available_functions = []
    for func in key_functions:
        if hasattr(pm4py, func):
            available_functions.append(func)
            print(f"✓ pm4py.{func}() is available")
        else:
            print(f"✗ pm4py.{func}() is not available")
    
    return len(available_functions) > 0

if __name__ == "__main__":
    print("=" * 50)
    print("PM4Py Capabilities Test")
    print("=" * 50)
    
    # Test simulation
    sim_success, sim_log = test_pm4py_simulation()
    
    # Test CSV reading
    csv_success = test_csv_reading()
    
    # Test process discovery
    discovery_success = test_process_discovery()
    
    print("\n" + "=" * 50)
    print("Test Results Summary:")
    print(f"✓ Simulation: {'PASS' if sim_success else 'FAIL'}")
    print(f"✓ CSV Reading: {'PASS' if csv_success else 'FAIL'}")
    print(f"✓ Process Discovery: {'PASS' if discovery_success else 'FAIL'}")
    print("=" * 50)
    
    if sim_success and csv_success and discovery_success:
        print("All tests passed! PM4Py is ready for Event Log import functionality.")
    else:
        print("Some tests failed. Check PM4Py installation.") 