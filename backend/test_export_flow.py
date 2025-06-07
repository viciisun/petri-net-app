#!/usr/bin/env python3
"""
Test script to verify the complete PNML export flow
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.pm4py_service import PM4PyService
from app.models.petri_net import PetriNetData, Node, Edge, NodeData, Position
import json

def create_test_petri_net_data():
    """Create test PetriNetData for export testing"""
    
    # Create nodes
    nodes = [
        Node(
            id="start",
            type="place",
            position=Position(x=100, y=100),
            data=NodeData(
                label="start",
                name="Start Place",
                type="place",
                tokens=1,
                isInitialMarking=True,
                isFinalMarking=False,
                attachPoints=4
            )
        ),
        Node(
            id="task1",
            type="transition",
            position=Position(x=200, y=100),
            data=NodeData(
                label="task1",
                name="Task 1",
                type="transition",
                isInvisible=False,
                attachPoints=4
            )
        ),
        Node(
            id="middle",
            type="place",
            position=Position(x=300, y=100),
            data=NodeData(
                label="middle",
                name="Middle Place",
                type="place",
                tokens=0,
                isInitialMarking=False,
                isFinalMarking=False,
                attachPoints=4
            )
        ),
        Node(
            id="task2",
            type="transition",
            position=Position(x=400, y=100),
            data=NodeData(
                label="task2",
                name="Task 2",
                type="transition",
                isInvisible=True,  # Test invisible transition
                attachPoints=4
            )
        ),
        Node(
            id="end",
            type="place",
            position=Position(x=500, y=100),
            data=NodeData(
                label="end",
                name="End Place",
                type="place",
                tokens=0,
                isInitialMarking=False,
                isFinalMarking=True,
                attachPoints=4
            )
        )
    ]
    
    # Create edges
    edges = [
        Edge(id="arc1", source="start", target="task1", weight=1),
        Edge(id="arc2", source="task1", target="middle", weight=1),
        Edge(id="arc3", source="middle", target="task2", weight=2),  # Test weight
        Edge(id="arc4", source="task2", target="end", weight=1)
    ]
    
    # Create statistics
    statistics = {
        "places": 3,
        "transitions": 2,
        "arcs": 4,
        "tokens": 1,
        "visible_transitions": 1,
        "invisible_transitions": 1,
        "has_initial_marking": True,
        "has_final_marking": True,
        "is_sound": True
    }
    
    return PetriNetData(
        nodes=nodes,
        edges=edges,
        statistics=statistics,
        networkId="test_net",
        networkName="Test Petri Net"
    )

def test_export_flow():
    """Test the complete export flow"""
    
    print("Testing PNML export flow...")
    
    # Create service instance
    service = PM4PyService()
    
    # Create test data
    test_data = create_test_petri_net_data()
    
    print(f"Created test data:")
    print(f"- Network: {test_data.networkName} (ID: {test_data.networkId})")
    print(f"- Nodes: {len(test_data.nodes)}")
    print(f"- Edges: {len(test_data.edges)}")
    
    try:
        # Test export
        pnml_content = service.export_to_pnml_string(test_data)
        
        print(f"\nExport successful!")
        print(f"PNML content length: {len(pnml_content)} characters")
        
        # Show preview
        print("\nPNML content preview:")
        lines = pnml_content.split('\n')
        for i, line in enumerate(lines[:20]):  # Show first 20 lines
            print(f"{i+1:2d}: {line}")
        
        if len(lines) > 20:
            print(f"... ({len(lines) - 20} more lines)")
        
        # Verify content contains expected elements
        checks = [
            ('Network ID', f'id="{test_data.networkId}"' in pnml_content or f'id="{test_data.networkName}"' in pnml_content),
            ('Network Name', test_data.networkName in pnml_content),
            ('Start place', 'id="start"' in pnml_content),
            ('End place', 'id="end"' in pnml_content),
            ('Task 1', 'id="task1"' in pnml_content),
            ('Task 2', 'id="task2"' in pnml_content),
            ('Initial marking', '<initialMarking>' in pnml_content),
            ('Final marking', '<finalmarkings>' in pnml_content or 'finalMarking' in pnml_content),
            ('Arc weights', 'weight' in pnml_content or '2' in pnml_content)
        ]
        
        print(f"\nContent verification:")
        all_passed = True
        for check_name, passed in checks:
            status = "✓" if passed else "✗"
            print(f"  {status} {check_name}")
            if not passed:
                all_passed = False
        
        return all_passed
        
    except Exception as e:
        print(f"Export failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_export_flow()
    print(f"\nTest {'PASSED' if success else 'FAILED'}") 