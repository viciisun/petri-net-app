#!/usr/bin/env python3
"""
Test script to verify PM4Py can import APNML files
"""

import pm4py
from pm4py.objects.petri_net.importer import importer as pnml_importer
import os

def test_apnml_import():
    """Test importing APNML file using PM4Py"""
    apnml_file = '../frontend/public/student_learning_process (1).apnml'
    
    if not os.path.exists(apnml_file):
        print(f"❌ APNML文件不存在: {apnml_file}")
        return False
    
    try:
        # 尝试导入APNML文件
        net, initial_marking, final_marking = pnml_importer.apply(apnml_file)
        
        print('✅ APNML文件导入成功!')
        print(f'网络名称: {net.name}')
        print(f'Places数量: {len(net.places)}')
        print(f'Transitions数量: {len(net.transitions)}')
        print(f'Arcs数量: {len(net.arcs)}')
        print(f'Initial marking: {initial_marking}')
        print(f'Final marking: {final_marking}')
        
        # 打印一些详细信息
        print('\n=== Places ===')
        for place in net.places:
            print(f'  {place.name} (id: {place})')
            
        print('\n=== Transitions ===')
        for transition in net.transitions:
            activity = getattr(transition, 'label', 'None')
            print(f'  {transition.name} (activity: {activity})')
            
        return True
        
    except Exception as e:
        print(f'❌ 导入失败: {e}')
        return False

if __name__ == "__main__":
    test_apnml_import() 