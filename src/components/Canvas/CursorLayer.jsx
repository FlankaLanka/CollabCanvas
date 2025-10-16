import { useMemo, useRef, useEffect } from 'react';
import UserCursor from './UserCursor';
import { useCanvas } from '../../contexts/ModernCanvasContext';

/**
 * Cursor Layer Component - Renders all user cursors with optimized coordinate transformations
 */
function CursorLayer({ cursors, isVisible = true }) {
  const { stageRef, stageScale, stagePosition } = useCanvas();
  
  // Track stage transform changes to optimize re-renders
  const lastTransformRef = useRef({ scale: 1, x: 0, y: 0 });
  const transformKey = `${stageScale}-${stagePosition.x}-${stagePosition.y}`;

  // Update transform tracking
  useEffect(() => {
    lastTransformRef.current = { 
      scale: stageScale, 
      x: stagePosition.x, 
      y: stagePosition.y 
    };
  }, [stageScale, stagePosition.x, stagePosition.y]);

  // Convert canvas coordinates to screen coordinates for each cursor
  const screenCursors = useMemo(() => {
    if (!cursors || cursors.length === 0) return [];

    return cursors.map(cursor => {
      // Convert canvas coordinates to screen coordinates with pixel-perfect positioning
      const screenX = Math.round((cursor.canvasX || cursor.x) * stageScale + stagePosition.x);
      const screenY = Math.round((cursor.canvasY || cursor.y) * stageScale + stagePosition.y);

      return {
        ...cursor,
        x: screenX,
        y: screenY
      };
    });
  }, [cursors, transformKey]); // Use transformKey for efficient memoization

  if (!isVisible || !screenCursors || screenCursors.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {screenCursors.map((cursor) => (
        <UserCursor
          key={cursor.userId}
          cursor={cursor}
          isVisible={isVisible}
        />
      ))}
    </div>
  );
}

export default CursorLayer;
