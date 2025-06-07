import dagre from '@dagrejs/dagre';
import ELK from 'elkjs/lib/elk.bundled.js';
import { NodeType, EdgeType, LayoutType } from '../types';

class LayoutService {
  static elk = new ELK();

  /**
   * Get optimal connection handles for edges to avoid overlapping
   * @param {Array} edges - Array of edges
   * @param {Array} nodes - Array of nodes
   * @returns {Array} - Edges with assigned handles
   */
  static assignConnectionHandles(edges, nodes) {
    // Track handle usage for each node
    const nodeHandles = {};
    nodes.forEach(node => {
      nodeHandles[node.id] = {
        source: { top: 0, right: 0, bottom: 0, left: 0 },
        target: { top: 0, right: 0, bottom: 0, left: 0 }
      };
    });

    return edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return edge;

      // Calculate relative positions to determine best handles
      const sourcePos = sourceNode.position;
      const targetPos = targetNode.position;
      
      const deltaX = targetPos.x - sourcePos.x;
      const deltaY = targetPos.y - sourcePos.y;

      let sourceHandle, targetHandle;

      // Determine source handle based on direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal connection preferred
        sourceHandle = deltaX > 0 ? 'right' : 'left';
        targetHandle = deltaX > 0 ? 'left' : 'right';
      } else {
        // Vertical connection preferred
        sourceHandle = deltaY > 0 ? 'bottom' : 'top';
        targetHandle = deltaY > 0 ? 'top' : 'bottom';
      }

      // Check if handles are available, if not use alternatives
      const sourceHandles = nodeHandles[edge.source].source;
      const targetHandles = nodeHandles[edge.target].target;

      // Find least used handle for source
      if (sourceHandles[sourceHandle] >= 2) {
        const alternatives = ['top', 'right', 'bottom', 'left'];
        sourceHandle = alternatives.reduce((best, current) => 
          sourceHandles[current] < sourceHandles[best] ? current : best
        );
      }

      // Find least used handle for target
      if (targetHandles[targetHandle] >= 2) {
        const alternatives = ['top', 'right', 'bottom', 'left'];
        targetHandle = alternatives.reduce((best, current) => 
          targetHandles[current] < targetHandles[best] ? current : best
        );
      }

      // Update usage counters
      sourceHandles[sourceHandle]++;
      targetHandles[targetHandle]++;

      return {
        ...edge,
        sourceHandle,
        targetHandle,
        type: 'smoothstep',
        animated: false,
        markerEnd: {
          type: 'arrowclosed',
          width: 20,
          height: 20,
          color: '#333'
        },
        style: {
          stroke: '#333',
          strokeWidth: 2
        }
      };
    });
  }

  /**
   * Apply Dagre layout to nodes and edges
   * @param {Array} nodes - React Flow nodes
   * @param {Array} edges - React Flow edges
   * @param {string} direction - Layout direction (TB, LR)
   * @returns {{nodes: Array, edges: Array}} - Layouted nodes and edges
   */
  static applyDagreLayout(nodes, edges, direction = 'LR') {
    const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    
    const nodeWidth = 120;
    const nodeHeight = 100; // Increased for name display
    const isHorizontal = direction === 'LR';

    dagreGraph.setGraph({ 
      rankdir: direction,
      nodesep: 50,
      ranksep: 100
    });

    // Add all nodes to dagre (including isolated ones)
    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    // Add edges to dagre
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    // Calculate layout
    dagre.layout(dagreGraph);

    // Apply positions to nodes
    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      
      // Handle isolated nodes that might not have been positioned by dagre
      let x, y;
      if (nodeWithPosition) {
        x = nodeWithPosition.x - nodeWidth / 2;
        y = nodeWithPosition.y - nodeHeight / 2;
      } else {
        // Position isolated nodes separately
        const isolatedIndex = nodes.findIndex(n => n.id === node.id);
        x = isHorizontal ? 50 : isolatedIndex * (nodeWidth + 50);
        y = isHorizontal ? isolatedIndex * (nodeHeight + 50) + 200 : 50;
      }
      
      return {
        ...node,
        targetPosition: isHorizontal ? 'left' : 'top',
        sourcePosition: isHorizontal ? 'right' : 'bottom',
        position: { x, y },
      };
    });

    return { nodes: layoutedNodes, edges };
  }

  /**
   * Apply Elkjs layout to nodes and edges
   * @param {Array} nodes - React Flow nodes
   * @param {Array} edges - React Flow edges
   * @returns {Promise<{nodes: Array, edges: Array}>} - Layouted nodes and edges
   */
  static async applyElkjsLayout(nodes, edges) {
    const elkNodes = nodes.map((node) => ({
      id: node.id,
      width: 120,
      height: 100, // Increased for name display
      // Add ports for better edge routing
      ports: [
        { id: `${node.id}_top`, properties: { side: 'NORTH' } },
        { id: `${node.id}_bottom`, properties: { side: 'SOUTH' } },
        { id: `${node.id}_left`, properties: { side: 'WEST' } },
        { id: `${node.id}_right`, properties: { side: 'EAST' } }
      ]
    }));

    const elkEdges = edges.map((edge) => ({
      id: edge.id,
      sources: [`${edge.source}_right`],
      targets: [`${edge.target}_left`]
    }));

    const elkGraph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.spacing.nodeNode': '50',
        'elk.layered.spacing.nodeNodeBetweenLayers': '100',
        'org.eclipse.elk.portConstraints': 'FIXED_ORDER',
        'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES'
      },
      children: elkNodes,
      edges: elkEdges
    };

    try {
      const layoutedGraph = await this.elk.layout(elkGraph);
      
      // Apply positions to nodes
      const layoutedNodes = nodes.map((node, index) => {
        const elkNode = layoutedGraph.children.find(n => n.id === node.id);
        
        // Handle isolated nodes that might not have been positioned by elkjs
        let x, y;
        if (elkNode) {
          x = elkNode.x;
          y = elkNode.y;
        } else {
          // Position isolated nodes separately
          x = 50;
          y = index * 120 + 200;
        }
        
        return {
          ...node,
          position: { x, y },
          sourcePosition: 'right',
          targetPosition: 'left'
        };
      });

      return { nodes: layoutedNodes, edges };
    } catch (error) {
      console.warn('Elkjs layout failed, falling back to Dagre:', error);
      return this.applyDagreLayout(nodes, edges, 'LR');
    }
  }

  /**
   * Apply layout to nodes and edges from backend API
   * @param {Array} nodes - Nodes from backend API
   * @param {Array} edges - Edges from backend API
   * @param {string} layoutType - Layout type to apply
   * @returns {Promise<{nodes: Array, edges: Array}>} - Layouted nodes and edges
   */
  static async applyLayout(nodes, edges, layoutType = LayoutType.DAGRE) {
    // Convert backend format to React Flow format with enhanced node data
    const reactFlowNodes = nodes.map(node => ({
      ...node,
      type: node.type || (node.data?.type === 'place' ? NodeType.PLACE : NodeType.TRANSITION),
      position: node.position || { x: 0, y: 0 },
      data: {
        ...node.data,
        id: node.id,
        label: node.data?.label || node.id,
        name: node.data?.name || node.data?.label || node.id,
        tokens: node.data?.tokens || 0,
        isInitialMarking: node.data?.isInitialMarking || false,
        isFinalMarking: node.data?.isFinalMarking || false,
        isInvisible: node.data?.isInvisible || false
      }
    }));

    // Apply the requested layout first
    let layoutResult;
    if (layoutType === LayoutType.ELKJS) {
      layoutResult = await this.applyElkjsLayout(reactFlowNodes, edges);
    } else {
      layoutResult = this.applyDagreLayout(reactFlowNodes, edges, 'LR');
    }

    // Assign smart connection handles to edges
    const edgesWithHandles = this.assignConnectionHandles(layoutResult.edges, layoutResult.nodes);

    return {
      nodes: layoutResult.nodes,
      edges: edgesWithHandles
    };
  }

  /**
   * Re-layout existing nodes and edges with different layout type
   * @param {Array} nodes - Current React Flow nodes
   * @param {Array} edges - Current React Flow edges
   * @param {string} layoutType - New layout type
   * @returns {Promise<{nodes: Array, edges: Array}>} - Re-layouted nodes and edges
   */
  static async relayoutNodes(nodes, edges, layoutType) {
    if (layoutType === LayoutType.ELKJS) {
      return await this.applyElkjsLayout(nodes, edges);
    } else {
      return this.applyDagreLayout(nodes, edges, 'LR');
    }
  }
}

export default LayoutService; 