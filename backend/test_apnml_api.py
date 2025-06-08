#!/usr/bin/env python3
"""
Test script to verify APNML import API endpoint
"""

import requests
import json
import os

def test_apnml_api():
    """Test the APNML import API endpoint"""
    
    # API endpoint
    url = "http://localhost:8000/api/upload-pnml"
    
    # APNML file path
    apnml_file = '../frontend/public/student_learning_process (1).apnml'
    
    if not os.path.exists(apnml_file):
        print(f"APNML file does not exist: {apnml_file}")
        return False
    
    try:
        # Prepare file for upload
        with open(apnml_file, 'rb') as f:
            files = {'file': ('student_learning_process.apnml', f, 'application/xml')}
            
            # Make API request
            response = requests.post(url, files=files)
            
        if response.status_code == 200:
            data = response.json()
            print('APNML API import successful!')
            print(f'Message: {data.get("message", "N/A")}')
            print(f'Petri Net ID: {data.get("petri_net_id", "N/A")}')
            
            petri_data = data.get('petri_net', {})
            print(f'Network Name: {petri_data.get("networkName", "N/A")}')
            print(f'Network ID: {petri_data.get("networkId", "N/A")}')
            print(f'Node Count: {len(petri_data.get("nodes", []))}')
            print(f'Edge Count: {len(petri_data.get("edges", []))}')
            
            # Show first few nodes for verification
            nodes = petri_data.get('nodes', [])
            if nodes:
                print('\n=== First Few Nodes ===')
                for i, node in enumerate(nodes[:4]):
                    print(f'  {i+1}. {node.get("data", {}).get("name", "N/A")} ({node.get("type", "N/A")})')
            
            return True
            
        else:
            print(f'API request failed: {response.status_code}')
            print(f'Error Message: {response.text}')
            return False
            
    except requests.exceptions.ConnectionError:
        print('Unable to connect to server. Please ensure backend server is running (http://localhost:8000)')
        return False
    except Exception as e:
        print(f'Test failed: {e}')
        return False

if __name__ == "__main__":
    print("Testing APNML API import functionality...")
    test_apnml_api() 