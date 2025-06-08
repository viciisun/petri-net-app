#!/usr/bin/env python3

import pandas as pd
import pm4py
from app.services.petri_net_service import PetriNetService
import tempfile
import os

def test_event_log_import():
    """Test Event Log import functionality"""
    print("Testing Event Log import functionality...")
    
    # Create test data
    test_data = {
        'people_id': ['student1', 'student1', 'student1', 'student2', 'student2', 'student2'],
        'event_id': [1, 2, 3, 4, 5, 6],
        'datetime': ['2023-01-01 09:00:00', '2023-01-01 10:00:00', '2023-01-01 11:00:00',
                    '2023-01-02 09:00:00', '2023-01-02 10:00:00', '2023-01-02 11:00:00'],
        'concept:name': ['Enrolled', 'Attended_lecture', 'Presented_Exam', 
                        'Enrolled', 'Attended_lecture', 'Presented_Exam'],
        'sex': ['M', 'M', 'M', 'F', 'F', 'F'],
        'occupation': ['Student', 'Student', 'Student', 'Student', 'Student', 'Student']
    }
    
    df = pd.DataFrame(test_data)
    
    # Save as temporary CSV file
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv') as temp_file:
        df.to_csv(temp_file.name, index=False)
        temp_file_path = temp_file.name
    
    try:
        print(f"Created test CSV file: {temp_file_path}")
        print(f"Data shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
        print(f"Sample data:\n{df.head()}")
        
        # Use pandas to read CSV, then format with PM4Py
        print("\n--- Testing PM4Py Event Log reading ---")
        df_read = pd.read_csv(temp_file_path)
        
        # Format DataFrame for PM4Py
        log_df = pm4py.format_dataframe(df_read, 
                                       case_id='people_id',
                                       activity_key='concept:name', 
                                       timestamp_key='datetime')
        
        print(f"Event Log DataFrame formatted successfully!")
        print(f"Formatted columns: {list(log_df.columns)}")
        print(f"Number of events: {len(log_df)}")
        print(f"Number of cases: {log_df['case:concept:name'].nunique()}")
        
        # Discover Petri net
        print("\n--- Testing Petri Net discovery ---")
        net, initial_marking, final_marking = pm4py.discover_petri_net_inductive(log_df)
        
        print(f"Petri Net discovered successfully!")
        print(f"Places: {len(net.places)}")
        print(f"Transitions: {len(net.transitions)}")
        print(f"Arcs: {len(net.arcs)}")
        
        print("\nPlaces:")
        for place in net.places:
            tokens = initial_marking.get(place, 0)
            is_final = place in final_marking
            print(f"  - {place.name}: tokens={tokens}, final={is_final}")
        
        print("\nTransitions:")
        for transition in net.transitions:
            print(f"  - {transition.name} (label: {transition.label})")
        
        # Test conversion to frontend format
        print("\n--- Testing conversion to frontend format ---")
        petri_net_service = PetriNetService()
        petri_net_data = petri_net_service.convert_pm4py_to_frontend(
            net, initial_marking, final_marking
        )
        
        print(f"Conversion successful!")
        print(f"Network ID: {petri_net_data.networkId}")
        print(f"Network Name: {petri_net_data.networkName}")
        print(f"Nodes: {len(petri_net_data.nodes)}")
        print(f"Edges: {len(petri_net_data.edges)}")
        
        print("\nNodes:")
        for node in petri_net_data.nodes:
            print(f"  - {node.id} ({node.type}): {node.data}")
        
        print("\nEdges:")
        for edge in petri_net_data.edges:
            print(f"  - {edge.id}: {edge.source} -> {edge.target}")
        
        print("\nStatistics:")
        for key, value in petri_net_data.statistics.items():
            print(f"  - {key}: {value}")
        
        print("\nAll tests passed!")
        
    except Exception as e:
        print(f"Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
            print(f"Cleaned up temporary file: {temp_file_path}")

def test_column_detection():
    """Test column detection functionality"""
    print("\n--- Testing column detection ---")
    
    # Create test data
    test_data = {
        'people_id': ['student1', 'student2', 'student3'],
        'event_id': [1, 2, 3],
        'datetime': ['2023-01-01 09:00:00', '2023-01-02 09:00:00', '2023-01-03 09:00:00'],
        'concept:name': ['Enrolled', 'Attended_lecture', 'Presented_Exam'],
        'sex': ['M', 'F', 'M'],
        'occupation': ['Student', 'Student', 'Student']
    }
    
    df = pd.DataFrame(test_data)
    
    # Analyze column characteristics
    statistics = {
        "unique_values_per_column": {},
        "null_counts": {},
        "potential_case_id_columns": [],
        "potential_activity_columns": [],
        "potential_timestamp_columns": []
    }
    
    for col in df.columns:
        unique_count = df[col].nunique()
        null_count = df[col].isnull().sum()
        
        statistics["unique_values_per_column"][col] = unique_count
        statistics["null_counts"][col] = int(null_count)
        
        col_lower = col.lower()
        
        # Case ID candidate columns
        if any(keyword in col_lower for keyword in ['id', 'case', 'people', 'customer', 'patient']):
            statistics["potential_case_id_columns"].append(col)
        
        # Activity candidate columns
        if any(keyword in col_lower for keyword in ['activity', 'concept:name', 'event', 'task', 'action']):
            statistics["potential_activity_columns"].append(col)
        
        # Timestamp candidate columns
        if any(keyword in col_lower for keyword in ['time', 'date', 'timestamp', 'datetime']):
            statistics["potential_timestamp_columns"].append(col)
    
    print("Column detection results:")
    print(f"Potential Case ID columns: {statistics['potential_case_id_columns']}")
    print(f"Potential Activity columns: {statistics['potential_activity_columns']}")
    print(f"Potential Timestamp columns: {statistics['potential_timestamp_columns']}")
    print(f"Unique values per column: {statistics['unique_values_per_column']}")

if __name__ == "__main__":
    test_event_log_import()
    test_column_detection() 