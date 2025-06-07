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
        print(f"❌ APNML文件不存在: {apnml_file}")
        return False
    
    try:
        # Prepare file for upload
        with open(apnml_file, 'rb') as f:
            files = {'file': ('student_learning_process.apnml', f, 'application/xml')}
            
            # Make API request
            response = requests.post(url, files=files)
            
        if response.status_code == 200:
            data = response.json()
            print('✅ APNML API导入成功!')
            print(f'消息: {data.get("message", "N/A")}')
            print(f'Petri网ID: {data.get("petri_net_id", "N/A")}')
            
            # Check data structure
            if 'data' in data:
                petri_data = data['data']
                print(f'网络名称: {petri_data.get("networkName", "N/A")}')
                print(f'网络ID: {petri_data.get("networkId", "N/A")}')
                print(f'节点数量: {len(petri_data.get("nodes", []))}')
                print(f'边数量: {len(petri_data.get("edges", []))}')
                
                # Print some node details
                nodes = petri_data.get("nodes", [])
                places = [n for n in nodes if n.get("type") == "place"]
                transitions = [n for n in nodes if n.get("type") == "transition"]
                
                print(f'Places: {len(places)}')
                print(f'Transitions: {len(transitions)}')
                
                # Show first few nodes
                print('\n=== 前几个节点 ===')
                for i, node in enumerate(nodes[:4]):
                    print(f'  {i+1}. {node.get("data", {}).get("name", "N/A")} ({node.get("type", "N/A")})')
                
            return True
            
        else:
            print(f'❌ API请求失败: {response.status_code}')
            print(f'错误信息: {response.text}')
            return False
            
    except requests.exceptions.ConnectionError:
        print('❌ 无法连接到服务器。请确保后端服务器正在运行 (http://localhost:8000)')
        return False
    except Exception as e:
        print(f'❌ 测试失败: {e}')
        return False

if __name__ == "__main__":
    print("测试APNML API导入功能...")
    test_apnml_api() 