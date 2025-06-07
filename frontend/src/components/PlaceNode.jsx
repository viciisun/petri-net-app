import { Handle, Position } from '@xyflow/react';
import styles from './PlaceNode.module.css';

const PlaceNode = ({ data, isConnectable, selected }) => {
  const { 
    id, 
    label, 
    name, 
    tokens = 0, 
    isInitialMarking = false, 
    isFinalMarking = false,
    attachPoints = 4
  } = data;

  const nodeClass = `${styles.placeNode} ${
    isInitialMarking ? styles.initialMarking : ''
  } ${isFinalMarking ? styles.finalMarking : ''} ${
    selected ? styles.selected : ''
  }`;

  // Generate handles based on attachPoints - positioned around the circle only
  const generateHandles = () => {
    const maxPoints = Math.min(Math.max(attachPoints, 4), 12);
    const handles = [];
    
    for (let i = 0; i < maxPoints; i++) {
      const angle = (i * 360) / maxPoints;
      const radian = (angle * Math.PI) / 180;
      
      // Calculate position on circle circumference
      // The circle is 80px diameter in an 80px wide container
      // Circle center is at 50% horizontally, 40px from top (50% of 80px height)
      const radiusPercent = 50; // 50% of container width to reach edge
      const centerX = 50; // 50% center horizontally
      const centerY = 50; // 50% of the circle area (40px from top of 80px circle)
      
      const x = centerX + (radiusPercent * Math.cos(radian));
      const y = centerY + (radiusPercent * Math.sin(radian));
      
      // Determine which edge this handle should be associated with
      let position;
      if (angle >= 315 || angle < 45) position = Position.Right;
      else if (angle >= 45 && angle < 135) position = Position.Bottom;
      else if (angle >= 135 && angle < 225) position = Position.Left;
      else position = Position.Top;
      
      const handleId = `point-${i}`;
      const style = {
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        width: '8px',
        height: '8px',
        background: '#ff9500',
        border: '2px solid #fff',
        borderRadius: '50%',
        opacity: 0,
        transition: 'opacity 0.2s ease',
        pointerEvents: 'all',
        zIndex: 10
      };
      
      handles.push(
        <div key={handleId}>
      <Handle
            type="target"
            position={position}
            id={`target-${handleId}`}
        isConnectable={isConnectable}
        className={styles.handle}
            style={style}
      />
      <Handle
        type="source"
            position={position}
            id={`source-${handleId}`}
        isConnectable={isConnectable}
            className={styles.sourceHandle}
            style={style}
          />
        </div>
      );
    }
    
    return handles;
  };

  return (
    <div 
      className={nodeClass}
      onMouseEnter={(e) => {
        // Show handles on hover
        const handles = e.currentTarget.querySelectorAll('.react-flow__handle');
        handles.forEach(handle => {
          handle.style.opacity = '1';
        });
      }}
      onMouseLeave={(e) => {
        // Hide handles when not hovering
        const handles = e.currentTarget.querySelectorAll('.react-flow__handle');
        handles.forEach(handle => {
          handle.style.opacity = '0';
        });
      }}
    >
      {generateHandles()}
      
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