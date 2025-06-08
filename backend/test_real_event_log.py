#!/usr/bin/env python3

import pandas as pd
import pm4py
from app.services.petri_net_service import PetriNetService

def test_real_event_log():
    """Test real Event Log file"""
    print("Testing real Event Log file...")
    
    try:
        # Read real Event Log file
        df = pd.read_csv('../frontend/public/Event_Log.csv')
        print('Real Event Log file:')
        print(f'Shape: {df.shape}')
        print(f'Columns: {list(df.columns)}')
        print(f'Sample data:')
        print(df.head())
        
        # Format and discover Petri net
        log_df = pm4py.format_dataframe(df, 
                                       case_id='people_id',
                                       activity_key='concept:name', 
                                       timestamp_key='datetime')
        
        print(f'\nFormatted Event Log:')
        print(f'Number of events: {len(log_df)}')
        print(f'Number of cases: {log_df["case:concept:name"].nunique()}')
        print(f'Unique activities: {log_df["concept:name"].nunique()}')
        print(f'Activities: {sorted(log_df["concept:name"].unique())}')
        
        net, initial_marking, final_marking = pm4py.discover_petri_net_inductive(log_df)
        print(f'\nPetri Net discovered from real data:')
        print(f'Places: {len(net.places)}')
        print(f'Transitions: {len(net.transitions)}')
        print(f'Arcs: {len(net.arcs)}')
        
        # Convert to frontend format
        petri_net_service = PetriNetService()
        petri_net_data = petri_net_service.convert_pm4py_to_frontend(
            net, initial_marking, final_marking
        )
        
        print(f'\nConversion to frontend format:')
        print(f'Network ID: {petri_net_data.networkId}')
        print(f'Nodes: {len(petri_net_data.nodes)}')
        print(f'Edges: {len(petri_net_data.edges)}')
        
        print(f'\nPlace nodes:')
        for node in petri_net_data.nodes:
            if node.type == "place":
                print(f'  - {node.data.name}: tokens={node.data.tokens}, initial={node.data.isInitialMarking}, final={node.data.isFinalMarking}')
        
        print(f'\nTransition nodes:')
        for node in petri_net_data.nodes:
            if node.type == "transition":
                print(f'  - {node.data.label} (invisible: {node.data.isInvisible})')
        
        print("\nReal Event Log test passed!")
        
    except Exception as e:
        print(f"Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_real_event_log() 