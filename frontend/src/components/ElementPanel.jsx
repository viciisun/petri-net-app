import React, { useState, useEffect } from 'react';
import usePetriNetStore from '../store/petriNetStore';
import styles from './ElementPanel.module.css';

const ElementPanel = () => {
  const { selectedElement, nodes, edges, setNodes, setEdges, updateNodeId, setSelectedElement } = usePetriNetStore();
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (selectedElement) {
      if (selectedElement.type === 'node') {
        const node = nodes.find(n => n.id === selectedElement.id);
        if (node) {
          const data = {
            id: node.id,
            name: node.data.name,
            tokens: node.data.tokens || 0,
            attachPoints: node.data.attachPoints || 4,
            isInvisible: node.data.isInvisible || false,
            isFinalMarking: node.data.isFinalMarking || false
          };
          setFormData(data);
          setOriginalData(data);
          setHasChanges(false);
        }
      } else if (selectedElement.type === 'edge') {
        const edge = edges.find(e => e.id === selectedElement.id);
        if (edge) {
          const data = {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            weight: edge.weight || 1
          };
          setFormData(data);
          setOriginalData(data);
          setHasChanges(false);
        }
      }
    }
  }, [selectedElement, nodes, edges]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Check for changes whenever formData updates
  useEffect(() => {
    const hasDataChanged = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(hasDataChanged);
  }, [formData, originalData]);

  const handleSave = () => {
    if (!selectedElement || !hasChanges) return;

    if (selectedElement.type === 'node') {
      try {
        const targetNodeId = formData.id !== selectedElement.id ? formData.id : selectedElement.id;
        
        // If ID changed, use updateNodeId to handle edge updates
        if (formData.id !== selectedElement.id) {
          updateNodeId(selectedElement.id, formData.id);
          // Update selectedElement to reflect the new ID
          setSelectedElement({ type: 'node', id: formData.id });
        }

        // Get the current state after potential ID update
        const currentNodes = usePetriNetStore.getState().nodes;
        
        // Update other node properties
        const updatedNodes = currentNodes.map(node => {
          if (node.id === targetNodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                name: formData.name,
                tokens: parseInt(formData.tokens) || 0,
                attachPoints: parseInt(formData.attachPoints) || 4,
                isInvisible: formData.isInvisible,
                isInitialMarking: (parseInt(formData.tokens) || 0) > 0,
                isFinalMarking: formData.isFinalMarking
              }
            };
          }
          return node;
        });
        setNodes(updatedNodes);
      } catch (error) {
        alert(error.message);
        return;
      }
    } else if (selectedElement.type === 'edge') {
      const updatedEdges = edges.map(edge => {
        if (edge.id === selectedElement.id) {
          return {
            ...edge,
            weight: parseInt(formData.weight) || 1
          };
        }
        return edge;
      });
      setEdges(updatedEdges);
    }

    // Reset change tracking
    setOriginalData({ ...formData });
    setHasChanges(false);
  };

  if (!selectedElement) {
    return (
      <div className={styles.elementPanel}>
        <div className={styles.noSelection}>
          No element selected
        </div>
      </div>
    );
  }

  const renderNodeForm = () => {
    const node = nodes.find(n => n.id === selectedElement.id);
    if (!node) return null;

    const isPlace = node.data.type === 'place';

    return (
      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>ID</label>
          <input
            type="text"
            value={formData.id || ''}
            onChange={(e) => handleInputChange('id', e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Name</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={styles.input}
          />
        </div>

        {isPlace && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Tokens</label>
            <input
              type="number"
              min="0"
              value={formData.tokens || 0}
              onChange={(e) => handleInputChange('tokens', e.target.value)}
              className={styles.input}
            />
          </div>
        )}

        {isPlace && (
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isFinalMarking || false}
                onChange={(e) => handleInputChange('isFinalMarking', e.target.checked)}
                className={styles.checkbox}
              />
              Final Marking
            </label>
          </div>
        )}

        {!isPlace && (
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isInvisible || false}
                onChange={(e) => handleInputChange('isInvisible', e.target.checked)}
                className={styles.checkbox}
              />
              Invisible Transition
            </label>
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label}>Attach Points</label>
          <input
            type="number"
            min="1"
            max="12"
            value={formData.attachPoints || 4}
            onChange={(e) => handleInputChange('attachPoints', e.target.value)}
            className={styles.input}
          />
        </div>

        {isPlace && (
          <div className={styles.readOnlyGroup}>
            <div className={styles.readOnlyItem}>
              <span className={styles.label}>Initial Marking:</span>
              <span className={styles.value}>
                {(parseInt(formData.tokens) || 0) > 0 ? 'Yes' : 'No'}
              </span>
            </div>
            <div className={styles.readOnlyItem}>
              <span className={styles.label}>Final Marking:</span>
              <span className={styles.value}>
                {node.data.isFinalMarking ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        )}

        <button 
          onClick={handleSave} 
          className={`${styles.saveButton} ${!hasChanges ? styles.disabled : ''}`}
          disabled={!hasChanges}
        >
          Save Changes
        </button>
      </div>
    );
  };

  const renderEdgeForm = () => {
    return (
      <div className={styles.form}>
        <div className={styles.readOnlyGroup}>
          <div className={styles.readOnlyItem}>
            <span className={styles.label}>ID:</span>
            <span className={styles.value}>{formData.id}</span>
          </div>
          <div className={styles.readOnlyItem}>
            <span className={styles.label}>Source:</span>
            <span className={styles.value}>{formData.source}</span>
          </div>
          <div className={styles.readOnlyItem}>
            <span className={styles.label}>Target:</span>
            <span className={styles.value}>{formData.target}</span>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Weight</label>
          <input
            type="number"
            min="1"
            value={formData.weight || 1}
            onChange={(e) => handleInputChange('weight', e.target.value)}
            className={styles.input}
          />
        </div>

        <button 
          onClick={handleSave} 
          className={`${styles.saveButton} ${!hasChanges ? styles.disabled : ''}`}
          disabled={!hasChanges}
        >
          Save Changes
        </button>
      </div>
    );
  };

  return (
    <div className={styles.elementPanel}>
      {selectedElement.type === 'node' ? renderNodeForm() : renderEdgeForm()}
    </div>
  );
};

export default ElementPanel; 