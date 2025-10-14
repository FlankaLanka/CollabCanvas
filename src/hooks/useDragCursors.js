import { useState, useEffect } from 'react';
import { subscribeToDragStates } from '../services/realtimeShapes';

/**
 * Hook for tracking cursors during drag operations
 * Shows other users' cursors when they're dragging shapes
 */
export function useDragCursors() {
  const [dragCursors, setDragCursors] = useState([]);

  useEffect(() => {
    console.log('👆 Setting up drag cursor subscription');
    
    const unsubscribe = subscribeToDragStates((dragStates) => {
      const cursors = dragStates
        .filter(state => state.isDragging && state.cursorX !== undefined && state.cursorY !== undefined)
        .map(state => ({
          userId: state.draggedBy,
          displayName: null, // No label for drag cursors - regular cursors show user names
          x: state.cursorX,
          y: state.cursorY,
          isDragging: true,
          shapeId: state.shapeId,
          timestamp: state.timestamp,
          color: '#FF6B6B' // Special color for drag cursors
        }));
      
      setDragCursors(cursors);
    });

    return () => {
      console.log('🧹 Cleaning up drag cursor subscription');
      unsubscribe();
    };
  }, []);

  return {
    dragCursors,
    isActive: dragCursors.length > 0
  };
}

export default useDragCursors;
