import { useMemo } from 'react';
import UserCursor from './UserCursor';
import { useCanvas } from '../../contexts/CanvasContext';

/**
 * Cursor Layer Component - Renders all user cursors
 */
function CursorLayer({ cursors, isVisible = true }) {
  const { stageRef, stageScale, stagePosition } = useCanvas();

  // Convert canvas coordinates to screen coordinates for each cursor
  const screenCursors = useMemo(() => {
    if (!cursors || cursors.length === 0) return [];

    return cursors.map(cursor => {
      // Convert canvas coordinates to screen coordinates
      const screenX = (cursor.canvasX || cursor.x) * stageScale + stagePosition.x;
      const screenY = (cursor.canvasY || cursor.y) * stageScale + stagePosition.y;

      return {
        ...cursor,
        x: screenX,
        y: screenY
      };
    });
  }, [cursors, stageScale, stagePosition]);

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
