import { Handle, Position } from '@xyflow/react';
import styles from './PlaceNode.module.css';

const PlaceNode = ({ data, isConnectable }) => {
  const { 
    id, 
    label, 
    name, 
    tokens = 0, 
    isInitialMarking = false, 
    isFinalMarking = false 
  } = data;

  const nodeClass = `${styles.placeNode} ${
    isInitialMarking ? styles.initialMarking : ''
  } ${isFinalMarking ? styles.finalMarking : ''}`;

  return (
    <div className={nodeClass}>
      {/* Target handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        isConnectable={isConnectable}
        className={styles.handle}
      />
      
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        isConnectable={isConnectable}
        className={styles.handle}
      />
      
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        isConnectable={isConnectable}
        className={styles.handle}
      />
      
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        isConnectable={isConnectable}
        className={styles.handle}
      />

      {/* Source handles */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        isConnectable={isConnectable}
        className={styles.sourceHandle}
      />
      
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        isConnectable={isConnectable}
        className={styles.sourceHandle}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        isConnectable={isConnectable}
        className={styles.sourceHandle}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        isConnectable={isConnectable}
        className={styles.sourceHandle}
      />
      
      <div className={styles.placeCircle}>
        {/* ID displayed inside the circle */}
        <div className={styles.placeId}>{id}</div>
        
        {/* Tokens display */}
        {tokens > 0 && (
          <div className={styles.tokens}>
            {tokens <= 5 ? (
              // Show individual dots for small numbers
              Array.from({ length: tokens }, (_, i) => (
                <div key={i} className={styles.token} />
              ))
            ) : (
              // Show number for larger amounts
              <div className={styles.tokenCount}>{tokens}</div>
            )}
          </div>
        )}
      </div>
      
      {/* Name displayed below the circle */}
      <div className={styles.placeName}>{name || label}</div>
    </div>
  );
};

export default PlaceNode; 