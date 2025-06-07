import React from 'react';
import usePetriNetStore from '../store/petriNetStore';
import styles from './ToolsPanel.module.css';

const AddNodePanel = () => {
  const { addNode } = usePetriNetStore();

  const handleAddPlace = () => {
    addNode('place');
  };

  const handleAddTransition = () => {
    addNode('transition');
  };

  return (
    <div className={styles.addNodePanel}>
      <button
        className={styles.addButton}
        onClick={handleAddPlace}
        title="Place"
      >
        <span className={styles.buttonIcon}>○</span>
        <span className={styles.buttonText}>Place</span>
      </button>
      
      <button
        className={styles.addButton}
        onClick={handleAddTransition}
        title="Transition"
      >
        <span className={`${styles.buttonIcon} ${styles.transitionIcon}`}>▭</span>
        <span className={styles.buttonText}>Transition</span>
      </button>
    </div>
  );
};

export default AddNodePanel; 