import { create } from 'zustand';
import { LayoutType } from '../types';
import apiService from '../services/apiService';

const usePetriNetStore = create((set, get) => ({
  // State
  nodes: [],
  edges: [],
  currentLayout: LayoutType.DAGRE,
  isLoading: false,
  error: null,
  currentPetriNetId: null,
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
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  setNodesAndEdges: (nodes, edges) => set({ nodes, edges }),
  
  setCurrentLayout: (layout) => set({ currentLayout: layout }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  updateStatistics: (stats) => set({ statistics: stats }),

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
    currentLayout: LayoutType.DAGRE,
    isLoading: false,
    error: null,
    currentPetriNetId: null,
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