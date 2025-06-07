import { Handle, Position } from '@xyflow/react';
import styles from './TransitionNode.module.css';

const TransitionNode = ({ data, isConnectable, selected }) => {
  const { id, label, name, isInvisible = false, attachPoints = 4 } = data;

  const nodeClass = `${styles.transitionNode} ${
    isInvisible ? styles.invisibleTransition : ''
  } ${selected ? styles.selected : ''}`;

  // Generate handles based on attachPoints - positioned around the rectangle only
  const generateHandles = () => {
    const maxPoints = Math.min(Math.max(attachPoints, 4), 12);
    const handles = [];
    
         // Rectangle dimensions - actual size of the transition rectangle (100px x 40px)
     // Node container is 100px wide x 60px tall, rectangle is 100px x 40px at top
     const rectHalfWidthPercent = 50; // 50% of 100px container width
     const rectHalfHeightPercent = 33.33; // 20px out of 60px container height
     const centerX = 50; // 50% center horizontally
     const centerY = 33.33; // 33.33% down (since rectangle is 40px tall in 60px container)
    
    // Define positions based on number of points
    const positions = [];
    
         if (maxPoints === 4) {
       // 4 points: top, right, bottom, left (centered)
       positions.push(
         { x: centerX, y: centerY - rectHalfHeightPercent, position: Position.Top },     // top center
         { x: centerX + rectHalfWidthPercent, y: centerY, position: Position.Right },    // right center
         { x: centerX, y: centerY + rectHalfHeightPercent, position: Position.Bottom },  // bottom center
         { x: centerX - rectHalfWidthPercent, y: centerY, position: Position.Left }      // left center
       );
     } else if (maxPoints === 6) {
       // 6 points: top(2), right(1), bottom(2), left(1)
       positions.push(
         { x: centerX - rectHalfWidthPercent/2, y: centerY - rectHalfHeightPercent, position: Position.Top },
         { x: centerX + rectHalfWidthPercent/2, y: centerY - rectHalfHeightPercent, position: Position.Top },
         { x: centerX + rectHalfWidthPercent, y: centerY, position: Position.Right },
         { x: centerX + rectHalfWidthPercent/2, y: centerY + rectHalfHeightPercent, position: Position.Bottom },
         { x: centerX - rectHalfWidthPercent/2, y: centerY + rectHalfHeightPercent, position: Position.Bottom },
         { x: centerX - rectHalfWidthPercent, y: centerY, position: Position.Left }
       );
     } else if (maxPoints === 8) {
       // 8 points: top(2), right(2), bottom(2), left(2)
       positions.push(
         { x: centerX - rectHalfWidthPercent/2, y: centerY - rectHalfHeightPercent, position: Position.Top },
         { x: centerX + rectHalfWidthPercent/2, y: centerY - rectHalfHeightPercent, position: Position.Top },
         { x: centerX + rectHalfWidthPercent, y: centerY - rectHalfHeightPercent/2, position: Position.Right },
         { x: centerX + rectHalfWidthPercent, y: centerY + rectHalfHeightPercent/2, position: Position.Right },
         { x: centerX + rectHalfWidthPercent/2, y: centerY + rectHalfHeightPercent, position: Position.Bottom },
         { x: centerX - rectHalfWidthPercent/2, y: centerY + rectHalfHeightPercent, position: Position.Bottom },
         { x: centerX - rectHalfWidthPercent, y: centerY + rectHalfHeightPercent/2, position: Position.Left },
         { x: centerX - rectHalfWidthPercent, y: centerY - rectHalfHeightPercent/2, position: Position.Left }
       );
     } else {
       // For other numbers, distribute evenly around perimeter
       for (let i = 0; i < maxPoints; i++) {
         const ratio = i / maxPoints;
         const perimeter = 2 * (rectHalfWidthPercent * 2 + rectHalfHeightPercent * 2);
         const distance = ratio * perimeter;
         
         let x, y, position;
         
         if (distance <= rectHalfWidthPercent * 2) {
           // Top edge
           x = centerX - rectHalfWidthPercent + distance;
           y = centerY - rectHalfHeightPercent;
           position = Position.Top;
         } else if (distance <= rectHalfWidthPercent * 2 + rectHalfHeightPercent * 2) {
           // Right edge
           x = centerX + rectHalfWidthPercent;
           y = centerY - rectHalfHeightPercent + (distance - rectHalfWidthPercent * 2);
           position = Position.Right;
         } else if (distance <= rectHalfWidthPercent * 4 + rectHalfHeightPercent * 2) {
           // Bottom edge
           x = centerX + rectHalfWidthPercent - (distance - rectHalfWidthPercent * 2 - rectHalfHeightPercent * 2);
           y = centerY + rectHalfHeightPercent;
           position = Position.Bottom;
         } else {
           // Left edge
           x = centerX - rectHalfWidthPercent;
           y = centerY + rectHalfHeightPercent - (distance - rectHalfWidthPercent * 4 - rectHalfHeightPercent * 2);
           position = Position.Left;
         }
         
         positions.push({ x, y, position });
       }
     }
    
    // Create handles for each position
    positions.forEach((pos, index) => {
      const handleId = `point-${index}`;
      const style = {
        left: `${pos.x}%`,
        top: `${pos.y}%`,
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
            position={pos.position}
            id={`target-${handleId}`}
        isConnectable={isConnectable}
        className={styles.handle}
            style={style}
      />
      <Handle
        type="source"
            position={pos.position}
            id={`source-${handleId}`}
        isConnectable={isConnectable}
            className={styles.sourceHandle}
            style={style}
          />
        </div>
      );
    });
    
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