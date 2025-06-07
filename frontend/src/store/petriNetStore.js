import { create } from 'zustand';
import apiService from '../services/apiService';

const usePetriNetStore = create((set, get) => ({
  // State
  nodes: [],
  edges: [],
  layoutDirection: 'horizontal', // 'horizontal' or 'vertical'
  isLoading: false,
  error: null,
  currentPetriNetId: null,
  networkId: null,
  networkName: '',
  selectedElement: null,
  statistics: {
    places: 0,
    transitions: 0,
    arcs: 0,
    tokens: 0,
    visible_transitions: 0,
    invisible_transitions: 0,
    has_initial_marking: false,
    has_final_marking: false,
    is_sound: false
  },

  // Actions
  setNodes: (nodes) => {
    const statistics = get().calculateStatistics(nodes, get().edges);
    set({ nodes, statistics });
  },
  setEdges: (edges) => {
    const statistics = get().calculateStatistics(get().nodes, edges);
    set({ edges, statistics });
  },
  
  setNodesAndEdges: (nodes, edges) => {
    const statistics = get().calculateStatistics(nodes, edges);
    set({ nodes, edges, statistics });
  },
  
  setLayoutDirection: (direction) => set({ layoutDirection: direction }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  updateStatistics: (stats) => set({ statistics: stats }),

  setNetworkInfo: (networkId, networkName) => set({ networkId, networkName }),

  setSelectedElement: (element) => set({ selectedElement: element }),

  updateNetworkName: (name) => set({ networkName: name }),

  updateNetworkId: (id) => set({ networkId: id }),

  // Update node and related edges when node ID changes
  updateNodeId: (oldId, newId) => {
    const { nodes, edges } = get();
    
    // Check if new ID already exists
    if (nodes.some(node => node.id === newId && node.id !== oldId)) {
      throw new Error(`Node with ID "${newId}" already exists`);
    }
    
    // Update node
    const updatedNodes = nodes.map(node => 
      node.id === oldId 
        ? { ...node, id: newId, data: { ...node.data, id: newId, label: newId } }
        : node
    );
    
    // Update related edges
    const updatedEdges = edges.map(edge => {
      const newSource = edge.source === oldId ? newId : edge.source;
      const newTarget = edge.target === oldId ? newId : edge.target;
      
      // Only update if this edge is connected to the changed node
      if (edge.source === oldId || edge.target === oldId) {
        return {
          ...edge,
          source: newSource,
          target: newTarget,
          id: `${newSource}-${newTarget}`
        };
      }
      
      return edge;
    });
    
    set({ nodes: updatedNodes, edges: updatedEdges });
  },

  // Add new node at fixed position (top-left corner)
  addNode: (nodeType) => {
    const { nodes } = get();
    
    // Generate unique ID
    const prefix = nodeType === 'place' ? 'new_place' : 'new_trans';
    let counter = 1;
    let nodeId = `${prefix}_${counter}`;
    
    // Check for existing IDs and increment counter
    while (nodes.some(node => node.id === nodeId)) {
      counter++;
      nodeId = `${prefix}_${counter}`;
    }
    
    // Create new node at fixed position (top-left corner with some margin)
    const newNode = {
      id: nodeId,
      type: nodeType,
      position: { x: 100, y: 100 }, // Fixed position in top-left area
      data: {
        id: nodeId,
        label: nodeId,
        name: nodeId,
        type: nodeType,
        tokens: nodeType === 'place' ? 0 : undefined,
        isInitialMarking: false,
        isFinalMarking: false,
        isInvisible: nodeType === 'transition' ? false : undefined,
        attachPoints: 4
      }
    };

    // Add to nodes
    const updatedNodes = [...nodes, newNode];
    const statistics = get().calculateStatistics(updatedNodes, get().edges);
    set({ nodes: updatedNodes, statistics, selectedElement: { type: 'node', id: nodeId } });
  },

  // API Actions
  uploadPnmlFile: async (file) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.uploadPnmlFile(file);
      
      if (response.success && response.data) {
        set({
          nodes: response.data.nodes,
          edges: response.data.edges,
          statistics: response.data.statistics,
          networkId: response.data.networkId,
          networkName: response.data.networkName,
          currentPetriNetId: response.petri_net_id,
          isLoading: false,
          error: null
        });
        return response;
      } else {
        throw new Error(response.message || 'Failed to upload file');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Failed to upload file', 
        isLoading: false 
      });
      throw error;
    }
  },

  loadPetriNet: async (petriNetId) => {
    set({ isLoading: true, error: null });
    
    try {
      const data = await apiService.getPetriNet(petriNetId);
      set({
        nodes: data.nodes,
        edges: data.edges,
        statistics: data.statistics,
        currentPetriNetId: petriNetId,
        isLoading: false,
        error: null
      });
      return data;
    } catch (error) {
      set({ 
        error: error.message || 'Failed to load Petri net', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  reset: () => set({
    nodes: [],
    edges: [],
    layoutDirection: 'horizontal',
    isLoading: false,
    error: null,
    currentPetriNetId: null,
    networkId: null,
    networkName: '',
    selectedElement: null,
    statistics: {
      places: 0,
      transitions: 0,
      arcs: 0,
      tokens: 0,
      visible_transitions: 0,
      invisible_transitions: 0,
      has_initial_marking: false,
      has_final_marking: false,
      is_sound: false
    }
  }),

  // Calculate statistics from current nodes and edges
  calculateStatistics: (nodes, edges) => {
    const places = nodes.filter(node => node.data?.type === 'place' || node.type === 'place');
    const transitions = nodes.filter(node => node.data?.type === 'transition' || node.type === 'transition');
    
    const totalTokens = places.reduce((sum, place) => sum + (place.data?.tokens || 0), 0);
    const visibleTransitions = transitions.filter(t => !t.data?.isInvisible).length;
    const invisibleTransitions = transitions.filter(t => t.data?.isInvisible).length;
    
    const hasInitialMarking = places.some(place => (place.data?.tokens || 0) > 0);
    const hasFinalMarking = places.some(place => place.data?.isFinalMarking);
    
    return {
      places: places.length,
      transitions: transitions.length,
      arcs: edges.length,
      tokens: totalTokens,
      visible_transitions: visibleTransitions,
      invisible_transitions: invisibleTransitions,
      has_initial_marking: hasInitialMarking,
      has_final_marking: hasFinalMarking,
      is_sound: hasInitialMarking && hasFinalMarking // Simplified soundness check
    };
  },

  // Computed getters
  getNodeById: (id) => {
    const { nodes } = get();
    return nodes.find(node => node.id === id);
  },

  getEdgeById: (id) => {
    const { edges } = get();
    return edges.find(edge => edge.id === id);
  }
}));

export default usePetriNetStore; 