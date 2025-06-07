import React from 'react';
import usePetriNetStore from '../store/petriNetStore';
import AddNodePanel from './ToolsPanel';
import ElementPanel from './ElementPanel';
import NetworkPanel from './NetworkPanel';
import styles from './Toolbar.module.css';

const Toolbar = () => {
  const { nodes, edges, statistics, currentPetriNetId, isLoading } = usePetriNetStore();

  return (
    <div className={styles.toolbar}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Add Node</h3>
        <AddNodePanel />
            </div>
            
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Element Properties</h3>
        <ElementPanel />
      </div>

        <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Network Properties</h3>
        <NetworkPanel />
            </div>
            


      {isLoading && (
        <div className={styles.section}>
          <div className={styles.loadingIndicator}>
            <div className={styles.spinner}></div>
            <span>Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar; 