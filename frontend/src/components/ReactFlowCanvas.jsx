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
  getIncomers,
  getOutgoers,
  getConnectedEdges,
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
  const { nodes, edges, setNodes, setEdges, setSelectedElement, selectedElement } = usePetriNetStore();

  // Validate connection according to Petri net bipartite graph rules
  const isValidConnection = useCallback((source, target) => {
    // Prevent self-loops
    if (source === target) {
      return false;
    }

    // Find source and target nodes
    const sourceNode = nodes.find(node => node.id === source);
    const targetNode = nodes.find(node => node.id === target);

    if (!sourceNode || !targetNode) {
      return false;
    }

    // Check bipartite graph constraint: Place ↔ Transition only
    const sourceType = sourceNode.data?.type || sourceNode.type;
    const targetType = targetNode.data?.type || targetNode.type;

    if (sourceType === targetType) {
      return false;
    }

    // Check for duplicate edges
    const edgeExists = edges.some(edge => 
      edge.source === source && edge.target === target
    );

    if (edgeExists) {
      return false;
    }

    return true;
  }, [nodes, edges]);
  
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState(nodes);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState(edges);

  // Update React Flow state when store changes
  React.useEffect(() => {
    const nodesWithSelection = nodes.map(node => ({
      ...node,
      selected: selectedElement?.type === 'node' && selectedElement?.id === node.id
    }));
    setReactFlowNodes(nodesWithSelection);
  }, [nodes, selectedElement, setReactFlowNodes]);

  React.useEffect(() => {
    const edgesWithSelection = edges.map(edge => {
      const isSelected = selectedElement?.type === 'edge' && selectedElement?.id === edge.id;
      return {
        ...edge,
        selected: isSelected,
        style: {
          ...edge.style,
          stroke: isSelected ? '#007bff' : '#333',
          strokeWidth: isSelected ? 3 : 2,
        },
        markerEnd: {
          ...edge.markerEnd,
          color: isSelected ? '#007bff' : '#333'
        },
        className: isSelected ? 'selected-edge' : ''
      };
    });
    setReactFlowEdges(edgesWithSelection);
  }, [edges, selectedElement, setReactFlowEdges]);

  // Handle new connections
  const onConnect = useCallback(
    (params) => {
      const newEdge = { 
        ...params, 
        id: `${params.source}-${params.target}`,
        markerEnd: {
          type: MarkerType.Arrow,
          width: 15,
          height: 15,
          color: '#333'
        },
        style: {
          stroke: '#333',
          strokeWidth: 2
        },
        animated: true,
        reconnectable: true
      };
      
      // Update React Flow state
      setReactFlowEdges((eds) => addEdge(newEdge, eds));
      
      // Update store
      setEdges([...edges, newEdge]);
    },
    [setReactFlowEdges, edges, setEdges]
  );

  // Handle edge reconnection
  const onReconnect = useCallback(
    (oldEdge, newConnection) => {
      const newEdge = {
        ...oldEdge,
        ...newConnection,
        id: `${newConnection.source}-${newConnection.target}`,
      };

      // Update React Flow state
      setReactFlowEdges((eds) => {
        const edgeIndex = eds.findIndex((e) => e.id === oldEdge.id);
        if (edgeIndex !== -1) {
          eds[edgeIndex] = newEdge;
        }
        return [...eds];
      });

      // Update store
      const updatedEdges = edges.map(edge => 
        edge.id === oldEdge.id ? newEdge : edge
      );
      setEdges(updatedEdges);

      // Update selected element if the reconnected edge was selected
      if (selectedElement?.type === 'edge' && selectedElement?.id === oldEdge.id) {
        setSelectedElement({ type: 'edge', id: newEdge.id });
      }
    },
    [setReactFlowEdges, edges, setEdges, selectedElement, setSelectedElement]
  );

  // Handle node changes and sync back to store
  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      
      // Sync position changes back to store
      const positionChanges = changes.filter(change => change.type === 'position' && change.position);
      if (positionChanges.length > 0) {
        const updatedNodes = nodes.map(node => {
          const positionChange = positionChanges.find(change => change.id === node.id);
          if (positionChange) {
            return { ...node, position: positionChange.position };
          }
          return node;
        });
        setNodes(updatedNodes);
      }
    },
    [onNodesChange, nodes, setNodes]
  );

  // Handle edge changes and sync back to store
  const handleEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
      
      // Sync edge changes back to store
      const removeChanges = changes.filter(change => change.type === 'remove');
      if (removeChanges.length > 0) {
        const removedIds = removeChanges.map(change => change.id);
        const updatedEdges = edges.filter(edge => !removedIds.includes(edge.id));
        setEdges(updatedEdges);
      }
    },
    [onEdgesChange, edges, setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (event, node) => {
      setSelectedElement({ type: 'node', id: node.id });
    },
    [setSelectedElement]
  );

  // Handle edge selection
  const onEdgeClick = useCallback(
    (event, edge) => {
      setSelectedElement({ type: 'edge', id: edge.id });
    },
    [setSelectedElement]
  );

  // Handle node deletion with auto-reconnection for middle nodes
  const onNodesDelete = useCallback(
    (deleted) => {
      setReactFlowEdges((currentEdges) => {
        return deleted.reduce((acc, node) => {
          const incomers = getIncomers(node, reactFlowNodes, currentEdges);
          const outgoers = getOutgoers(node, reactFlowNodes, currentEdges);
          const connectedEdges = getConnectedEdges([node], currentEdges);

          const remainingEdges = acc.filter(
            (edge) => !connectedEdges.includes(edge),
          );

          // Only auto-reconnect if there's exactly one outgoing connection
          // This prevents unwanted connections when deleting nodes with multiple exits
          if (outgoers.length === 1) {
            const createdEdges = incomers.flatMap(({ id: source }) =>
              outgoers.map(({ id: target }) => ({
                id: `${source}->${target}`,
                source,
                target,
                animated: true,
                reconnectable: true,
                markerEnd: {
                  type: MarkerType.Arrow,
                  width: 15,
                  height: 15,
                  color: '#333'
                },
                style: {
                  stroke: '#333',
                  strokeWidth: 2
                }
              })),
            );
            return [...remainingEdges, ...createdEdges];
          }

          return remainingEdges;
        }, currentEdges);
      });

      // Also update the store
      const updatedNodes = nodes.filter(node => !deleted.some(deletedNode => deletedNode.id === node.id));
      setNodes(updatedNodes);
      
      // Update edges in store to match React Flow state
      setReactFlowEdges((currentEdges) => {
        const updatedEdges = currentEdges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          animated: edge.animated,
          reconnectable: edge.reconnectable,
          markerEnd: edge.markerEnd,
          style: edge.style
        }));
        setEdges(updatedEdges);
        return currentEdges;
      });
      
      // Clear selection if deleted node was selected
      if (selectedElement?.type === 'node' && deleted.some(deletedNode => deletedNode.id === selectedElement.id)) {
        setSelectedElement(null);
      }
    },
    [reactFlowNodes, nodes, setNodes, selectedElement, setSelectedElement, setReactFlowEdges]
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(
    (event) => {
      setSelectedElement(null);
    },
    [setSelectedElement]
  );

  return (
    <div className={styles.canvasContainer}>
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodesDelete={onNodesDelete}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.Bezier}
        isValidConnection={(connection) => isValidConnection(connection.source, connection.target)}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        className={styles.reactFlow}
        defaultEdgeOptions={{
          animated: true,
          reconnectable: true,
          markerEnd: {
            type: MarkerType.Arrow,
            width: 15,
            height: 15,
            color: '#333'
          },
          style: {
            stroke: '#333',
            strokeWidth: 2
          }
        }}
      >
        <Background 
          variant="lines" 
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