#!/usr/bin/env python3
"""
Test script to verify PM4Py can import APNML files
"""

import pm4py
from pm4py.objects.petri_net.importer import importer as pnml_importer
import os

def test_apnml_import():
    """Test APNML file import functionality"""
    
    # APNML file path
    apnml_file = "frontend/public/complex-sample.apnml"
    
    # Check if file exists
    if not os.path.exists(apnml_file):
        print(f"APNML file does not exist: {apnml_file}")
        return
    
    try:
        # Try to import APNML file
        net, initial_marking, final_marking = pm4py.read_pnml(apnml_file)
        
        print('APNML file imported successfully!')
        print(f'Network name: {net.name}')
        print(f'Number of places: {len(net.places)}')
        print(f'Number of transitions: {len(net.transitions)}')
        print(f'Number of arcs: {len(net.arcs)}')
        
        print(f'Initial marking: {initial_marking}')
        print(f'Final marking: {final_marking}')
        
        # Print some detailed information
        print("\nPlaces:")
        for place in net.places:
            print(f"  - {place.name}")
        
        print("\nTransitions:")
        for transition in net.transitions:
            print(f"  - {transition.name} (label: {transition.label})")
        
        print("\nArcs:")
        for arc in net.arcs:
            print(f"  - {arc.source.name} -> {arc.target.name}")
            
    except Exception as e:
        print(f'Import failed: {e}')

if __name__ == "__main__":
    test_apnml_import() 