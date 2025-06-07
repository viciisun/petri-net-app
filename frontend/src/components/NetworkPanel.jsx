import React, { useState } from 'react';
import usePetriNetStore from '../store/petriNetStore';
import styles from './NetworkPanel.module.css';

const NetworkPanel = () => {
  const { 
    networkId, 
    networkName, 
    statistics, 
    updateNetworkName,
    updateNetworkId 
  } = usePetriNetStore();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingId, setIsEditingId] = useState(false);
  const [tempName, setTempName] = useState(networkName || '');
  const [tempId, setTempId] = useState(networkId || '');

  const handleNameEdit = () => {
    setTempName(networkName || '');
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    updateNetworkName(tempName);
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setTempName(networkName || '');
    setIsEditingName(false);
  };

  const handleIdEdit = () => {
    setTempId(networkId || '');
    setIsEditingId(true);
  };

  const handleIdSave = () => {
    updateNetworkId(tempId);
    setIsEditingId(false);
  };

  const handleIdCancel = () => {
    setTempId(networkId || '');
    setIsEditingId(false);
  };

  const handleNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

  const handleIdKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleIdSave();
    } else if (e.key === 'Escape') {
      handleIdCancel();
    }
  };

  return (
    <div className={styles.networkPanel}>
      {/* Network Information */}
      <div className={styles.networkInfo}>
        <div className={styles.infoItem}>
          <span className={styles.label}>ID:</span>
          {isEditingId ? (
            <div className={styles.editContainer}>
              <input
                type="text"
                value={tempId}
                onChange={(e) => setTempId(e.target.value)}
                onKeyDown={handleIdKeyPress}
                onBlur={handleIdSave}
                className={styles.nameInput}
                autoFocus
              />
              <div className={styles.editButtons}>
                <button 
                  onClick={handleIdSave}
                  className={styles.saveBtn}
                  title="Save"
                >
                  ✓
                </button>
                <button 
                  onClick={handleIdCancel}
                  className={styles.cancelBtn}
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.nameContainer}>
              <span className={styles.value}>{networkId || 'N/A'}</span>
              <button 
                onClick={handleIdEdit}
                className={styles.editBtn}
                title="Edit ID"
              >
                ✎
              </button>
            </div>
          )}
        </div>
        
        <div className={styles.infoItem}>
          <span className={styles.label}>Name:</span>
          {isEditingName ? (
            <div className={styles.editContainer}>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={handleNameKeyPress}
                onBlur={handleNameSave}
                className={styles.nameInput}
                autoFocus
              />
              <div className={styles.editButtons}>
                <button 
                  onClick={handleNameSave}
                  className={styles.saveBtn}
                  title="Save"
                >
                  ✓
                </button>
                <button 
                  onClick={handleNameCancel}
                  className={styles.cancelBtn}
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.nameContainer}>
              <span className={styles.value}>{networkName || 'Unnamed Network'}</span>
              <button 
                onClick={handleNameEdit}
                className={styles.editBtn}
                title="Edit name"
              >
                ✎
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Network Properties */}
      <div className={styles.detailsSection}>
        
        {/* Statistics */}
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Places:</span>
            <span className={styles.statValue}>{statistics.places}</span>
          </div>
          
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Transitions:</span>
            <span className={styles.statValue}>{statistics.transitions}</span>
          </div>
          
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Arcs:</span>
            <span className={styles.statValue}>{statistics.arcs}</span>
          </div>
          
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Tokens:</span>
            <span className={styles.statValue}>{statistics.tokens}</span>
          </div>
          
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Visible Trans:</span>
            <span className={styles.statValue}>{statistics.visible_transitions}</span>
          </div>
          
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Invisible Trans:</span>
            <span className={styles.statValue}>{statistics.invisible_transitions}</span>
          </div>
        </div>
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Initial Marking:</span>
            <span className={`${styles.detailValue} ${
              statistics.has_initial_marking ? styles.positive : styles.negative
            }`}>
              {statistics.has_initial_marking ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Final Marking:</span>
            <span className={`${styles.detailValue} ${
              statistics.has_final_marking ? styles.positive : styles.negative
            }`}>
              {statistics.has_final_marking ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Soundness:</span>
            <span className={`${styles.detailValue} ${
              statistics.is_sound ? styles.positive : styles.negative
            }`}>
              {statistics.is_sound ? 'Sound' : 'Not Sound'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkPanel; 