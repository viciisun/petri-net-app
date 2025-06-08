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
    const attachPoints = data?.attachPoints || 4;
    const maxPoints = Math.min(Math.max(attachPoints, 4), 12);
    const points = [];

    // Use data.type for node type determination
    const nodeType = data?.type;

    if (nodeType === NodeType.PLACE) {
      // Circle positions - 4 cardinal directions first, then fill in between
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
    } else if (nodeType === NodeType.TRANSITION) {
      // Rectangle positions - prioritize cardinal directions
      const centerX = position.x + 50; // 100px width / 2
      const centerY = position.y + 30; // 60px height / 2
      const halfWidth = 50;
      const halfHeight = 30;

      if (maxPoints === 4) {
        points.push(
          { id: 'point-0', x: centerX, y: centerY - halfHeight, angle: 270, used: false }, // top
          { id: 'point-1', x: centerX + halfWidth, y: centerY, angle: 0, used: false }, // right
          { id: 'point-2', x: centerX, y: centerY + halfHeight, angle: 90, used: false }, // bottom
          { id: 'point-3', x: centerX - halfWidth, y: centerY, angle: 180, used: false } // left
        );
      } else {
        // Start with cardinal directions, then add more points
        const cardinalPoints = [
          { id: 'point-0', x: centerX, y: centerY - halfHeight, angle: 270, used: false }, // top
          { id: 'point-1', x: centerX + halfWidth, y: centerY, angle: 0, used: false }, // right
          { id: 'point-2', x: centerX, y: centerY + halfHeight, angle: 90, used: false }, // bottom
          { id: 'point-3', x: centerX - halfWidth, y: centerY, angle: 180, used: false } // left
        ];
        
        points.push(...cardinalPoints);
        
        // Add additional points if needed
        for (let i = 4; i < maxPoints; i++) {
          const angle = (i - 4) * 360 / (maxPoints - 4) + 45; // Start at 45 degrees offset
          const radian = (angle * Math.PI) / 180;
          
          // Place on rectangle perimeter
          let x, y;
          if (angle >= 315 || angle < 45) { // right side
            x = centerX + halfWidth;
            y = centerY + (halfHeight * Math.tan(radian));
          } else if (angle >= 45 && angle < 135) { // bottom side
            x = centerX + (halfWidth / Math.tan(radian));
            y = centerY + halfHeight;
          } else if (angle >= 135 && angle < 225) { // left side
            x = centerX - halfWidth;
            y = centerY - (halfHeight * Math.tan(radian));
          } else { // top side
            x = centerX - (halfWidth / Math.tan(radian));
            y = centerY - halfHeight;
          }
          
          points.push({ id: `point-${i}`, x, y, angle, used: false });
        }
      }
    } else {
      // Fallback: create 4 cardinal direction points
      const centerX = position.x + 40;
      const centerY = position.y + 40;
      
      points.push(
        { id: 'point-0', x: centerX, y: centerY - 40, angle: 270, used: false }, // top
        { id: 'point-1', x: centerX + 40, y: centerY, angle: 0, used: false }, // right
        { id: 'point-2', x: centerX, y: centerY + 40, angle: 90, used: false }, // bottom
        { id: 'point-3', x: centerX - 40, y: centerY, angle: 180, used: false } // left
      );
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
      const attachPoints = this.getAttachPointPositions(node);
      nodeMap.set(node.id, {
        ...node,
        attachPoints: attachPoints,
        maxAttachPoints: attachPoints.length,  // Store the actual number of attach points
        currentAttachPointCount: attachPoints.length
      });
    });

    // Process edges sequentially to maintain used state across all edges
    const processedEdges = [];
    
    edges.forEach((edge, index) => {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      if (!sourceNode || !targetNode) {
        processedEdges.push({
          ...edge,
          sourceHandle: 'source-point-0',
          targetHandle: 'target-point-0',
          animated: true,
          reconnectable: true,
          markerEnd: {
            type: MarkerType.Arrow,
            width: '15',
            height: '15',
            color: '#333'
          },
          style: {
            stroke: '#333',
            strokeWidth: '2'
          }
        });
        return;
      }

      // Find the best available attach points
      let bestResult = this.findBestAttachPoints(sourceNode, targetNode, edge);
      
      // If no unused points found and we haven't reached the limit, try to expand
      if (!bestResult.found && sourceNode.currentAttachPointCount < 12) {
        const newCount = Math.min(sourceNode.currentAttachPointCount + 4, 12);
        sourceNode.attachPoints = this.expandAttachPoints(sourceNode, newCount);
        sourceNode.currentAttachPointCount = newCount;
        sourceNode.maxAttachPoints = newCount;
        bestResult = this.findBestAttachPoints(sourceNode, targetNode, edge);
      }
      
      if (!bestResult.found && targetNode.currentAttachPointCount < 12) {
        const newCount = Math.min(targetNode.currentAttachPointCount + 4, 12);
        targetNode.attachPoints = this.expandAttachPoints(targetNode, newCount);
        targetNode.currentAttachPointCount = newCount;
        targetNode.maxAttachPoints = newCount;
        bestResult = this.findBestAttachPoints(sourceNode, targetNode, edge);
      }
      
      // If still no unused points, allow reusing points (find least used)
      if (!bestResult.found) {
        bestResult = this.findLeastUsedAttachPoints(sourceNode, targetNode, edge);
      }

      // Validate that the selected handles exist within the node's attach point range
      const sourcePointIndex = parseInt(bestResult.sourceHandle.split('-').pop());
      const targetPointIndex = parseInt(bestResult.targetHandle.split('-').pop());
      
      if (sourcePointIndex >= sourceNode.maxAttachPoints) {
        console.warn(`Source handle ${bestResult.sourceHandle} exceeds available points (${sourceNode.maxAttachPoints}) for node ${edge.source}`);
        bestResult.sourceHandle = `source-point-${sourceNode.maxAttachPoints - 1}`;
        bestResult.sourcePoint = sourceNode.attachPoints[sourceNode.maxAttachPoints - 1];
      }
      
      if (targetPointIndex >= targetNode.maxAttachPoints) {
        console.warn(`Target handle ${bestResult.targetHandle} exceeds available points (${targetNode.maxAttachPoints}) for node ${edge.target}`);
        bestResult.targetHandle = `target-point-${targetNode.maxAttachPoints - 1}`;
        bestResult.targetPoint = targetNode.attachPoints[targetNode.maxAttachPoints - 1];
      }

      // Mark the selected points as used
      if (bestResult.sourcePoint) {
        bestResult.sourcePoint.used = true;
        bestResult.sourcePoint.usageCount = (bestResult.sourcePoint.usageCount || 0) + 1;
      }
      if (bestResult.targetPoint) {
        bestResult.targetPoint.used = true;
        bestResult.targetPoint.usageCount = (bestResult.targetPoint.usageCount || 0) + 1;
      }

      processedEdges.push({
        ...edge,
        sourceHandle: bestResult.sourceHandle,
        targetHandle: bestResult.targetHandle,
        animated: true,
        reconnectable: true,
        markerEnd: {
          type: MarkerType.Arrow,
          width: '15',
          height: '15',
          color: '#333'
        },
        style: {
          stroke: '#333',
          strokeWidth: '2'
        }
      });
    });

    return processedEdges;
  }

  /**
   * Find the best unused attach points between source and target nodes
   */
  static findBestAttachPoints(sourceNode, targetNode, edge) {
    let bestDistance = Infinity;
    let bestSourceHandle = 'source-point-0';
    let bestTargetHandle = 'target-point-0';
    let bestSourcePoint = null;
    let bestTargetPoint = null;
    let found = false;

    sourceNode.attachPoints.forEach(sourcePoint => {
      if (sourcePoint.used) {
        return;
      }
      
      targetNode.attachPoints.forEach(targetPoint => {
        if (targetPoint.used) {
          return;
        }
        
        const distance = this.calculateDistance(sourcePoint, targetPoint);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestSourceHandle = `source-${sourcePoint.id}`;
          bestTargetHandle = `target-${targetPoint.id}`;
          bestSourcePoint = sourcePoint;
          bestTargetPoint = targetPoint;
          found = true;
        }
      });
    });

    return {
      found,
      sourceHandle: bestSourceHandle,
      targetHandle: bestTargetHandle,
      sourcePoint: bestSourcePoint,
      targetPoint: bestTargetPoint,
      distance: bestDistance
    };
  }

  /**
   * Find the least used attach points when all points are used
   */
  static findLeastUsedAttachPoints(sourceNode, targetNode, edge) {
    let bestDistance = Infinity;
    let bestSourceHandle = 'source-point-0';
    let bestTargetHandle = 'target-point-0';
    let bestSourcePoint = null;
    let bestTargetPoint = null;
    let minUsageSum = Infinity;

    sourceNode.attachPoints.forEach(sourcePoint => {
      targetNode.attachPoints.forEach(targetPoint => {
        const sourceUsage = sourcePoint.usageCount || 0;
        const targetUsage = targetPoint.usageCount || 0;
        const usageSum = sourceUsage + targetUsage;
        const distance = this.calculateDistance(sourcePoint, targetPoint);
        
        // Prefer points with lower usage, then shorter distance
        if (usageSum < minUsageSum || (usageSum === minUsageSum && distance < bestDistance)) {
          bestDistance = distance;
          bestSourceHandle = `source-${sourcePoint.id}`;
          bestTargetHandle = `target-${targetPoint.id}`;
          bestSourcePoint = sourcePoint;
          bestTargetPoint = targetPoint;
          minUsageSum = usageSum;
        }
      });
    });

    return {
      found: true,
      sourceHandle: bestSourceHandle,
      targetHandle: bestTargetHandle,
      sourcePoint: bestSourcePoint,
      targetPoint: bestTargetPoint,
      distance: bestDistance
    };
  }

  /**
   * Expand attach points for a node to the specified count
   */
  static expandAttachPoints(node, newCount) {
    const { position } = node;
    const nodeType = node.type;
    const maxPoints = Math.min(newCount, 12);
    const points = [];

    if (nodeType === NodeType.PLACE) {
      // Circle positions
      const centerX = position.x + 40;
      const centerY = position.y + 40;
      const radius = 40;

      for (let i = 0; i < maxPoints; i++) {
        const angle = (i * 360) / maxPoints;
        const radian = (angle * Math.PI) / 180;
        const x = centerX + radius * Math.cos(radian);
        const y = centerY + radius * Math.sin(radian);
        
        // Preserve existing usage data if point exists
        const existingPoint = node.attachPoints.find(p => p.id === `point-${i}`);
        points.push({ 
          id: `point-${i}`, 
          x, 
          y, 
          angle,
          used: existingPoint?.used || false,
          usageCount: existingPoint?.usageCount || 0
        });
      }
    } else if (nodeType === NodeType.TRANSITION) {
      // Rectangle positions
      const centerX = position.x + 50;
      const centerY = position.y + 30;
      const halfWidth = 50;
      const halfHeight = 30;

      // Always start with cardinal directions
      const cardinalPoints = [
        { id: 'point-0', x: centerX, y: centerY - halfHeight, angle: 270 }, // top
        { id: 'point-1', x: centerX + halfWidth, y: centerY, angle: 0 }, // right
        { id: 'point-2', x: centerX, y: centerY + halfHeight, angle: 90 }, // bottom
        { id: 'point-3', x: centerX - halfWidth, y: centerY, angle: 180 } // left
      ];
      
      cardinalPoints.forEach(point => {
        const existingPoint = node.attachPoints.find(p => p.id === point.id);
        points.push({
          ...point,
          used: existingPoint?.used || false,
          usageCount: existingPoint?.usageCount || 0
        });
      });
      
      // Add additional points if needed
      for (let i = 4; i < maxPoints; i++) {
        const angle = (i - 4) * 360 / (maxPoints - 4) + 45;
        const radian = (angle * Math.PI) / 180;
        
        let x, y;
        if (angle >= 315 || angle < 45) {
          x = centerX + halfWidth;
          y = centerY + (halfHeight * Math.tan(radian));
        } else if (angle >= 45 && angle < 135) {
          x = centerX + (halfWidth / Math.tan(radian));
          y = centerY + halfHeight;
        } else if (angle >= 135 && angle < 225) {
          x = centerX - halfWidth;
          y = centerY - (halfHeight * Math.tan(radian));
        } else {
          x = centerX - (halfWidth / Math.tan(radian));
          y = centerY - halfHeight;
        }
        
        const existingPoint = node.attachPoints.find(p => p.id === `point-${i}`);
        points.push({ 
          id: `point-${i}`, 
          x, 
          y, 
          angle, 
          used: existingPoint?.used || false,
          usageCount: existingPoint?.usageCount || 0
        });
      }
    }

    return points;
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
   * Analyze node connectivity and determine required attach points
   * @param {Array} nodes - Array of nodes
   * @param {Array} edges - Array of edges
   * @returns {Map} - Map of nodeId to required attach points count
   */
  static analyzeNodeConnectivity(nodes, edges) {
    const nodeConnections = new Map();
    
    // Initialize connection count for all nodes
    nodes.forEach(node => {
      nodeConnections.set(node.id, { incoming: 0, outgoing: 0, total: 0 });
    });
    
    // Count connections for each node
    edges.forEach(edge => {
      const sourceConnections = nodeConnections.get(edge.source);
      const targetConnections = nodeConnections.get(edge.target);
      
      if (sourceConnections) {
        sourceConnections.outgoing++;
        sourceConnections.total++;
      }
      
      if (targetConnections) {
        targetConnections.incoming++;
        targetConnections.total++;
      }
    });
    
    // Calculate required attach points for each node
    const requiredAttachPoints = new Map();
    nodeConnections.forEach((connections, nodeId) => {
      // Start with minimum 4 points, then scale up based on connections
      let required = Math.max(4, connections.total);
      
      // Round up to nearest multiple of 4 for better distribution
      required = Math.ceil(required / 4) * 4;
      
      // Cap at 12 points maximum
      required = Math.min(required, 12);
      
      requiredAttachPoints.set(nodeId, required);
    });
    
    return requiredAttachPoints;
  }

  /**
   * Apply layout to nodes and edges from backend API
   * @param {Array} nodes - Nodes from backend API
   * @param {Array} edges - Edges from backend API
   * @param {string} direction - Layout direction ('horizontal' or 'vertical')
   * @returns {{nodes: Array, edges: Array}} - Layouted nodes and edges
   */
  static applyLayout(nodes, edges, direction = 'horizontal') {
    // Analyze node connectivity to determine required attach points
    const requiredAttachPoints = this.analyzeNodeConnectivity(nodes, edges);
    
    // Convert backend format to React Flow format with enhanced node data
    const reactFlowNodes = nodes.map(node => {
      const requiredPoints = requiredAttachPoints.get(node.id) || 4;
      
      return {
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
          attachPoints: requiredPoints  // Use calculated required points
        }
      };
    });

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