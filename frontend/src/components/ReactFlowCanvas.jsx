import React, { useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import PlaceNode from './PlaceNode';
import TransitionNode from './TransitionNode';
import usePetriNetStore from '../store/petriNetStore';
import { NodeType } from '../types';
import styles from './ReactFlowCanvas.module.css';

const nodeTypes = {
  [NodeType.PLACE]: PlaceNode,
  [NodeType.TRANSITION]: TransitionNode,
};

const ReactFlowCanvas = () => {
  const { nodes, edges, setNodes, setEdges } = usePetriNetStore();
  
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState(nodes);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState(edges);

  // Update React Flow state when store changes
  React.useEffect(() => {
    setReactFlowNodes(nodes);
  }, [nodes, setReactFlowNodes]);

  React.useEffect(() => {
    setReactFlowEdges(edges);
  }, [edges, setReactFlowEdges]);

  // Handle new connections (for future interactivity)
  const onConnect = useCallback(
    (params) =>
      setReactFlowEdges((eds) =>
        addEdge({ 
          ...params, 
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#333'
          },
          style: {
            stroke: '#333',
            strokeWidth: 2
          }
        }, eds)
      ),
    [setReactFlowEdges]
  );

  // Handle node changes and sync back to store
  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      // Optionally sync position changes back to store
      // This would be useful for saving layouts
    },
    [onNodesChange]
  );

  // Handle edge changes and sync back to store
  const handleEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
      // Optionally sync changes back to store
    },
    [onEdgesChange]
  );

  return (
    <div className={styles.canvasContainer}>
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        className={styles.reactFlow}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#333'
          },
          style: {
            stroke: '#333',
            strokeWidth: 2
          }
        }}
      >
        <Background 
          variant="dots" 
          gap={20} 
          size={1} 
          color="#e0e0e0"
        />
        <Controls 
          position="top-left"
          showZoom={true}
          showFitView={true}
          showInteractive={false}
        />
        <MiniMap 
          position="bottom-right"
          nodeStrokeColor="#333"
          nodeColor="#fff"
          nodeBorderRadius={2}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
};

export default ReactFlowCanvas; 