import React, { useRef, useState, useEffect } from 'react';
import usePetriNetStore from '../store/petriNetStore';
import LayoutService from '../services/layoutService';
import apiService from '../services/apiService';
import EventLogImportDialog from './EventLogImportDialog';
import styles from './Header.module.css';

const Header = () => {
  const fileInputRef = useRef(null);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showEventLogDialog, setShowEventLogDialog] = useState(false);
  
  const {
    nodes,
    edges,
    layoutDirection,
    isLoading,
    error,
    networkId,
    networkName,
    statistics,
    setNodesAndEdges,
    setLayoutDirection,
    setLoading,
    setError,
    clearError,
    uploadPnmlFile
  } = usePetriNetStore();

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(`.${styles.dropdownContainer}`)) {
        setShowImportMenu(false);
        setShowSaveMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleImportClick = () => {
    setShowImportMenu(!showImportMenu);
    setShowSaveMenu(false);
  };

  const handleSaveClick = () => {
    setShowSaveMenu(!showSaveMenu);
    setShowImportMenu(false);
  };

  const handlePnmlImportClick = () => {
    // Set file input to accept only PNML files
    fileInputRef.current.accept = '.pnml,.xml';
    fileInputRef.current?.click();
    setShowImportMenu(false);
  };

  const handleApnmlImportClick = () => {
    // Set file input to accept only APNML files
    fileInputRef.current.accept = '.apnml';
    fileInputRef.current?.click();
    setShowImportMenu(false);
  };

  const handleEventLogImportClick = () => {
    setShowEventLogDialog(true);
    setShowImportMenu(false);
  };

  const handleImageExport = async (format) => {
    try {
      // Get the React Flow viewport element
      const reactFlowElement = document.querySelector('.react-flow__viewport');
      if (!reactFlowElement) {
        alert('No Petri net to export');
        return;
      }

      // Use html2canvas for image export
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(reactFlowElement, {
        backgroundColor: '#fafafa',
        scale: 2, // Higher quality
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `petri-net.${format}`;
      link.href = canvas.toDataURL(`image/${format}`);
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
    setShowSaveMenu(false);
  };

  const handlePnmlExport = async () => {
    try {
      if (nodes.length === 0) {
        alert('No Petri net to export');
        setShowSaveMenu(false);
        return;
      }

      setLoading(true);
      
      // Prepare data for export
      const petriNetData = {
        nodes: nodes,
        edges: edges,
        statistics: statistics,
        networkId: networkId,
        networkName: networkName
      };

      // Call API to export PNML
      const { blob, filename } = await apiService.exportPnml(petriNetData);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('PNML export failed:', error);
      setError(`PNML export failed: ${error.message}`);
    } finally {
      setLoading(false);
      setShowSaveMenu(false);
    }
  };

  const handleEventLogExport = async () => {
    try {
      if (nodes.length === 0) {
        alert('No Petri net to export');
        setShowSaveMenu(false);
        return;
      }

      setLoading(true);
      
      // Prepare data for export
      const petriNetData = {
        nodes: nodes,
        edges: edges,
        statistics: statistics,
        networkId: networkId,
        networkName: networkName
      };

      // Default configuration for Event Log export
      const config = {
        no_traces: 100,
        max_trace_length: 50
      };

      // Call API to export Event Log
      const { blob, filename } = await apiService.exportEventLog(petriNetData, config);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Event Log export failed:', error);
      setError(`Event Log export failed: ${error.message}`);
    } finally {
      setLoading(false);
      setShowSaveMenu(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Upload file to backend and get parsed data
      const response = await uploadPnmlFile(file);
      
      // Apply layout to the nodes received from backend
      if (response.success && response.data) {
        console.log('Original edges from backend:', response.data.edges);
        
        const { nodes: newNodes, edges: newEdges } = LayoutService.applyLayout(
          response.data.nodes,
          response.data.edges,
          layoutDirection
        );
        
        console.log('Processed edges after layout:', newEdges);
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

  const handleLayoutDirectionChange = (newDirection) => {
    if (newDirection === layoutDirection || nodes.length === 0) return;

    setLoading(true);
    clearError();

    try {
      const { nodes: layoutedNodes, edges: layoutedEdges } = LayoutService.relayoutNodes(
        nodes,
        edges,
        newDirection
      );
      
      setNodesAndEdges(layoutedNodes, layoutedEdges);
      setLayoutDirection(newDirection);
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
                onClick={() => handleLayoutDirectionChange('horizontal')}
                disabled={isLoading}
                className={`${styles.button} ${
                  layoutDirection === 'horizontal' ? styles.activeButton : styles.secondaryButton
                }`}
              >
                Horizontal
              </button>
              <button
                onClick={() => handleLayoutDirectionChange('vertical')}
                disabled={isLoading}
                className={`${styles.button} ${
                  layoutDirection === 'vertical' ? styles.activeButton : styles.secondaryButton
                }`}
              >
                Vertical
              </button>
            </div>
          </div>
        )}

        <div className={styles.dropdownContainer}>
        <button
          onClick={handleImportClick}
          disabled={isLoading}
            className={`${styles.button} ${styles.primaryButton} ${showImportMenu ? styles.active : ''}`}
        >
            Import
            <span className={styles.dropdownArrow}>▼</span>
          </button>
          
          {showImportMenu && (
            <div className={styles.dropdownMenu}>
              <button
                onClick={handlePnmlImportClick}
                className={styles.dropdownItem}
                disabled={isLoading}
              >
                <span className={styles.itemIcon}></span>
                PNML Model
              </button>
              <button
                onClick={handleApnmlImportClick}
                className={styles.dropdownItem}
                disabled={isLoading}
              >
                <span className={styles.itemIcon}></span>
                APNML Model
              </button>
              <button
                onClick={handleEventLogImportClick}
                className={styles.dropdownItem}
                disabled={isLoading}
              >
                <span className={styles.itemIcon}></span>
                Event Log File
              </button>
            </div>
          )}
        </div>

        <div className={styles.dropdownContainer}>
          <button
            onClick={handleSaveClick}
            disabled={isLoading || nodes.length === 0}
            className={`${styles.button} ${styles.secondaryButton} ${showSaveMenu ? styles.active : ''}`}
          >
            Save
            <span className={styles.dropdownArrow}>▼</span>
          </button>
          
          {showSaveMenu && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownSection}>
                <div className={styles.sectionTitle}>Image Formats</div>
                <button
                  onClick={() => handleImageExport('png')}
                  className={styles.dropdownItem}
                >
                  <span className={styles.itemIcon}></span>
                  PNG Image
                </button>
                <button
                  onClick={() => handleImageExport('jpeg')}
                  className={styles.dropdownItem}
                >
                  <span className={styles.itemIcon}></span>
                  JPEG Image
                </button>
              </div>
              <div className={styles.dropdownDivider}></div>
              <button
                onClick={handlePnmlExport}
                className={styles.dropdownItem}
                disabled={isLoading || nodes.length === 0}
              >
                <span className={styles.itemIcon}></span>
                PNML Model
        </button>
              <button
                onClick={handleEventLogExport}
                className={styles.dropdownItem}
                disabled={isLoading || nodes.length === 0}
              >
                <span className={styles.itemIcon}></span>
                Event Log
              </button>
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pnml,.apnml,.xml"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
      
      <EventLogImportDialog 
        isOpen={showEventLogDialog}
        onClose={() => setShowEventLogDialog(false)}
      />
    </header>
  );
};

export default Header; 