import dagre from '@dagrejs/dagre';
import { MarkerType } from '@xyflow/react';
import { NodeType, EdgeType, LayoutDirection } from '../types';

class LayoutService {

  /**
   * Calculate distance between two points
   */
  static calculateDistance(point1, point2) {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
  }

  /**
   * Get attach point positions for a node
   */
  static getAttachPointPositions(node) {
    const { position, data } = node;
    const attachPoints = data.attachPoints || 4;
    const maxPoints = Math.min(Math.max(attachPoints, 4), 12);
    const points = [];

    if (data.type === NodeType.PLACE) {
      // Circle positions
      const centerX = position.x + 40; // 80px width / 2
      const centerY = position.y + 40; // 80px height / 2
      const radius = 40;

      for (let i = 0; i < maxPoints; i++) {
        const angle = (i * 360) / maxPoints;
        const radian = (angle * Math.PI) / 180;
        const x = centerX + radius * Math.cos(radian);
        const y = centerY + radius * Math.sin(radian);
        points.push({ 
          id: `point-${i}`, 
          x, 
          y, 
          angle,
          used: false 
        });
      }
    } else if (data.type === NodeType.TRANSITION) {
      // Rectangle positions
      const centerX = position.x + 50; // 100px width / 2
      const centerY = position.y + 20; // 40px height / 2 (in 60px container)
      const halfWidth = 50;
      const halfHeight = 20;

      if (maxPoints === 4) {
        points.push(
          { id: 'point-0', x: centerX, y: centerY - halfHeight, angle: 270, used: false }, // top
          { id: 'point-1', x: centerX + halfWidth, y: centerY, angle: 0, used: false }, // right
          { id: 'point-2', x: centerX, y: centerY + halfHeight, angle: 90, used: false }, // bottom
          { id: 'point-3', x: centerX - halfWidth, y: centerY, angle: 180, used: false } // left
        );
      } else {
        // More complex distribution for other point counts
        // Implementation similar to the component logic
        for (let i = 0; i < maxPoints; i++) {
          const ratio = i / maxPoints;
          const perimeter = 2 * (halfWidth * 2 + halfHeight * 2);
          const distance = ratio * perimeter;
          
          let x, y, angle;
          if (distance <= halfWidth * 2) {
            x = centerX - halfWidth + distance;
            y = centerY - halfHeight;
            angle = 270;
          } else if (distance <= halfWidth * 2 + halfHeight * 2) {
            x = centerX + halfWidth;
            y = centerY - halfHeight + (distance - halfWidth * 2);
            angle = 0;
          } else if (distance <= halfWidth * 4 + halfHeight * 2) {
            x = centerX + halfWidth - (distance - halfWidth * 2 - halfHeight * 2);
            y = centerY + halfHeight;
            angle = 90;
          } else {
            x = centerX - halfWidth;
            y = centerY + halfHeight - (distance - halfWidth * 4 - halfHeight * 2);
            angle = 180;
          }
          
          points.push({ id: `point-${i}`, x, y, angle, used: false });
        }
      }
    }

    return points;
  }

  /**
   * Find optimal connection handles for edges to minimize distance and avoid overlapping
   * @param {Array} edges - Array of edges
   * @param {Array} nodes - Array of nodes
   * @returns {Array} - Edges with assigned handles
   */
  static assignConnectionHandles(edges, nodes) {
    // Create a map of node positions and attach points
    const nodeMap = new Map();
    nodes.forEach(node => {
      nodeMap.set(node.id, {
        ...node,
        attachPoints: this.getAttachPointPositions(node)
      });
    });

    return edges.map((edge, index) => {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      if (!sourceNode || !targetNode) {
        return {
          ...edge,
          sourceHandle: 'source-point-0',
          targetHandle: 'target-point-0',
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
        };
      }

      // Find the closest unused attach points
      let bestDistance = Infinity;
      let bestSourceHandle = 'source-point-0';
      let bestTargetHandle = 'target-point-0';

      sourceNode.attachPoints.forEach(sourcePoint => {
        if (sourcePoint.used) return;
        
        targetNode.attachPoints.forEach(targetPoint => {
          if (targetPoint.used) return;
          
          const distance = this.calculateDistance(sourcePoint, targetPoint);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestSourceHandle = `source-${sourcePoint.id}`;
            bestTargetHandle = `target-${targetPoint.id}`;
          }
        });
      });

      // Mark the selected points as used
      const sourcePoint = sourceNode.attachPoints.find(p => `source-${p.id}` === bestSourceHandle);
      const targetPoint = targetNode.attachPoints.find(p => `target-${p.id}` === bestTargetHandle);
      if (sourcePoint) sourcePoint.used = true;
      if (targetPoint) targetPoint.used = true;

      return {
        ...edge,
        sourceHandle: bestSourceHandle,
        targetHandle: bestTargetHandle,
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
      };
    });
  }

  /**
   * Apply Dagre layout to nodes and edges
   * @param {Array} nodes - React Flow nodes
   * @param {Array} edges - React Flow edges
   * @param {string} direction - Layout direction ('horizontal' or 'vertical')
   * @returns {{nodes: Array, edges: Array}} - Layouted nodes and edges
   */
  static applyDagreLayout(nodes, edges, direction = 'horizontal') {
    const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    
    const nodeWidth = 120;
    const nodeHeight = 100;
    const isHorizontal = direction === 'horizontal';
    const dagreDirection = isHorizontal ? 'LR' : 'TB';

    dagreGraph.setGraph({ 
      rankdir: dagreDirection,
      nodesep: isHorizontal ? 80 : 60,
      ranksep: isHorizontal ? 150 : 120,
      marginx: 50,
      marginy: 50
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
        if (isHorizontal) {
          x = 50;
          y = isolatedIndex * (nodeHeight + 50) + 300;
        } else {
          x = isolatedIndex * (nodeWidth + 50) + 300;
          y = 50;
        }
      }
      
      return {
        ...node,
        targetPosition: isHorizontal ? 'left' : 'top',
        sourcePosition: isHorizontal ? 'right' : 'bottom',
        position: { x, y },
      };
    });

    // Apply intelligent connection handle assignment
    const edgesWithHandles = this.assignConnectionHandles(edges, layoutedNodes);

    return { nodes: layoutedNodes, edges: edgesWithHandles };
    }



  /**
   * Apply layout to nodes and edges from backend API
   * @param {Array} nodes - Nodes from backend API
   * @param {Array} edges - Edges from backend API
   * @param {string} direction - Layout direction ('horizontal' or 'vertical')
   * @returns {{nodes: Array, edges: Array}} - Layouted nodes and edges
   */
  static applyLayout(nodes, edges, direction = 'horizontal') {
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
        isInvisible: node.data?.isInvisible || false,
        attachPoints: node.data?.attachPoints || 4
      }
    }));

    // Apply Dagre layout with specified direction
    return this.applyDagreLayout(reactFlowNodes, edges, direction);
  }

  /**
   * Re-layout existing nodes and edges with different direction
   * @param {Array} nodes - Current React Flow nodes
   * @param {Array} edges - Current React Flow edges
   * @param {string} direction - New layout direction ('horizontal' or 'vertical')
   * @returns {{nodes: Array, edges: Array}} - Re-layouted nodes and edges
   */
  static relayoutNodes(nodes, edges, direction = 'horizontal') {
    return this.applyDagreLayout(nodes, edges, direction);
  }
}

export default LayoutService; 