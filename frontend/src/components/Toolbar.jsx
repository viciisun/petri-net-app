import React from 'react';
import usePetriNetStore from '../store/petriNetStore';
import styles from './Toolbar.module.css';

const Toolbar = () => {
  const { nodes, edges, statistics, currentPetriNetId, isLoading } = usePetriNetStore();

  return (
    <div className={styles.toolbar}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Network Statistics</h3>
        
        {nodes.length > 0 ? (
          <div className={styles.statsContainer}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{statistics.places}</div>
              <div className={styles.statLabel}>Places</div>
            </div>
            
            <div className={styles.statItem}>
              <div className={styles.statValue}>{statistics.transitions}</div>
              <div className={styles.statLabel}>Transitions</div>
            </div>
            
            <div className={styles.statItem}>
              <div className={styles.statValue}>{statistics.arcs}</div>
              <div className={styles.statLabel}>Arcs</div>
            </div>
            
            <div className={styles.statItem}>
              <div className={styles.statValue}>{statistics.places + statistics.transitions}</div>
              <div className={styles.statLabel}>Total Nodes</div>
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No Petri net loaded</p>
            <p className={styles.hint}>Import a PNML file to see statistics</p>
          </div>
        )}
      </div>

      {nodes.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Network Details</h3>
          
          <div className={styles.detailsContainer}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Total tokens:</span>
              <span className={styles.detailValue}>{statistics.tokens}</span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Visible transitions:</span>
              <span className={styles.detailValue}>{statistics.visible_transitions}</span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Invisible transitions:</span>
              <span className={styles.detailValue}>{statistics.invisible_transitions}</span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Has initial marking:</span>
              <span className={styles.detailValue}>
                {statistics.has_initial_marking ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Has final marking:</span>
              <span className={styles.detailValue}>
                {statistics.has_final_marking ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Is sound:</span>
              <span className={styles.detailValue}>
                {statistics.is_sound ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Network ID:</span>
              <span className={styles.detailValue}>
                {currentPetriNetId ? currentPetriNetId.substring(0, 8) + '...' : 'None'}
              </span>
            </div>
          </div>
        </div>
      )}

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