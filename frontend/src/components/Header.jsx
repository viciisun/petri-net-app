import React, { useRef } from 'react';
import usePetriNetStore from '../store/petriNetStore';
import LayoutService from '../services/layoutService';
import { LayoutType } from '../types';
import styles from './Header.module.css';

const Header = () => {
  const fileInputRef = useRef(null);
  const {
    nodes,
    edges,
    currentLayout,
    isLoading,
    error,
    setNodesAndEdges,
    setCurrentLayout,
    setLoading,
    setError,
    clearError,
    uploadPnmlFile
  } = usePetriNetStore();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Upload file to backend and get parsed data
      const response = await uploadPnmlFile(file);
      
      // Apply layout to the nodes received from backend
      if (response.success && response.data) {
        const { nodes: newNodes, edges: newEdges } = await LayoutService.applyLayout(
          response.data.nodes,
          response.data.edges,
          currentLayout
        );
        
        setNodesAndEdges(newNodes, newEdges);
      }
      
    } catch (err) {
      console.error('Import failed:', err);
      // Error is already handled in the store
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLayoutChange = async (newLayout) => {
    if (newLayout === currentLayout || nodes.length === 0) return;

    setLoading(true);
    clearError();

    try {
      const { nodes: layoutedNodes, edges: layoutedEdges } = await LayoutService.relayoutNodes(
        nodes,
        edges,
        newLayout
      );
      
      setNodesAndEdges(layoutedNodes, layoutedEdges);
      setCurrentLayout(newLayout);
    } catch (err) {
      setError(`Layout failed: ${err.message}`);
      console.error('Layout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>Petri Net Visualizer</h1>
      </div>

      <div className={styles.right}>
        {error && (
          <div className={styles.error}>
            <span>Error: {error}</span>
            <button onClick={clearError} className={styles.closeButton}>×</button>
          </div>
        )}

        {nodes.length > 0 && (
          <div className={styles.layoutControls}>
            <label className={styles.label}>Layout:</label>
            <div className={styles.buttonGroup}>
              <button
                onClick={() => handleLayoutChange(LayoutType.DAGRE)}
                disabled={isLoading}
                className={`${styles.button} ${
                  currentLayout === LayoutType.DAGRE ? styles.activeButton : styles.secondaryButton
                }`}
              >
                Dagre
              </button>
              <button
                onClick={() => handleLayoutChange(LayoutType.ELKJS)}
                disabled={isLoading}
                className={`${styles.button} ${
                  currentLayout === LayoutType.ELKJS ? styles.activeButton : styles.secondaryButton
                }`}
              >
                Elkjs
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleImportClick}
          disabled={isLoading}
          className={`${styles.button} ${styles.primaryButton}`}
        >
          {isLoading ? 'Importing...' : 'Import PNML'}
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pnml,.xml"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    </header>
  );
};

export default Header; 