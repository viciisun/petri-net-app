import { Handle, Position } from '@xyflow/react';
import styles from './TransitionNode.module.css';

const TransitionNode = ({ data, isConnectable }) => {
  const { id, label, name, isInvisible = false } = data;

  const nodeClass = `${styles.transitionNode} ${
    isInvisible ? styles.invisibleTransition : ''
  }`;

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
      
      <div className={styles.transitionRect}>
        {/* ID displayed inside the rectangle */}
        <div className={styles.transitionId}>{id}</div>
      </div>
      
      {/* Name displayed below the rectangle */}
      <div className={styles.transitionName}>{name || label}</div>
    </div>
  );
};

export default TransitionNode; 