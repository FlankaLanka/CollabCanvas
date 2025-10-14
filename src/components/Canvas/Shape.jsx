import { useCallback, useRef } from 'react';
import { Rect, Circle, Line } from 'react-konva';
import { useCanvas } from '../../contexts/CanvasContext';
import { CANVAS_WIDTH, CANVAS_HEIGHT, SHAPE_TYPES } from '../../utils/constants';
import { throttledUpdateShapePosition, setShapeDragState } from '../../services/realtimeShapes';
import { usePresence } from '../../hooks/usePresence';

/**
 * Shape Component - Renders individual shapes on the canvas
 * Supports: rectangles, circles, and triangles
 */
function Shape({ shape, isSelected }) {
  const { 
    updateShape, 
    selectShape,
    deleteShape,
    stageRef,
    stageScale,
    stagePosition
  } = useCanvas();

  const { updateCursorFromEvent, isActive: isPresenceActive } = usePresence();

  // For real-time sync during drag
  const lastSyncTime = useRef(0);
  const isDragging = useRef(false);

  // Handle shape click (selection only - no deselection)
  const handleClick = useCallback((e) => {
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation();
    }
    
    // Only select if not already selected (no deselection on click)
    if (!isSelected) {
      selectShape(shape.id);
    }
  }, [selectShape, shape.id, isSelected]);

  // Handle right-click (context menu) to delete shape
  const handleContextMenu = useCallback((e) => {
    e.evt.preventDefault(); // Prevent browser context menu
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation();
    }
    
    // Delete the shape
    try {
      deleteShape(shape.id);
      console.log('🗑️ Shape deleted via right-click:', shape.id);
    } catch (error) {
      console.error('❌ Error deleting shape:', error);
    }
  }, [deleteShape, shape.id]);

  // Handle shape drag start
  const handleDragStart = useCallback(async (e) => {
    const node = e.target;
    const stage = node.getStage();
    
    // Prevent event bubbling to stage
    e.cancelBubble = true;
    if (e.evt) {
      e.evt.stopPropagation();
    }

    isDragging.current = true;

    // Set cursor to grabbing during drag
    if (stage && stage.container()) {
      stage.container().style.cursor = 'grabbing';
    }
    
    console.log('🔒 Drag start for shape:', shape.id);
    
    // Auto-select shape when dragging starts
    if (!isSelected) {
      selectShape(shape.id);
    }

    // Set drag state for other users and track cursor
    if (isPresenceActive && stageRef.current) {
      const pointer = stage.getPointerPosition();
      if (pointer) {
        const stageTransform = stage.getAbsoluteTransform().invert();
        const canvasPos = stageTransform.point(pointer);
        
        // Update cursor position and set drag state
        updateCursorFromEvent(e.evt, stage);
        await setShapeDragState(shape.id, true, { x: canvasPos.x, y: canvasPos.y });
      }
    }
  }, [selectShape, shape.id, isSelected, isPresenceActive, stageRef, updateCursorFromEvent]);

  // Handle shape drag move (ultra-high-frequency real-time sync)
  const handleDragMove = useCallback((e) => {
    const node = e.target;
    const stage = node.getStage();
    const newPos = node.position();

    // High-frequency position updates (60fps)
    throttledUpdateShapePosition(shape.id, newPos);
    
    // Update cursor position during drag
    if (isPresenceActive && stage) {
      updateCursorFromEvent(e.evt, stage);
      
      // Update drag state with cursor position
      const pointer = stage.getPointerPosition();
      if (pointer) {
        const stageTransform = stage.getAbsoluteTransform().invert();
        const canvasPos = stageTransform.point(pointer);
        
        // Fire-and-forget drag state update
        setShapeDragState(shape.id, true, { x: canvasPos.x, y: canvasPos.y }).catch(error => {
          console.error('❌ Error updating drag state:', error);
        });
      }
    }

    // Still do occasional Firestore sync for persistence (reduced frequency)
    const now = Date.now();
    if (now - lastSyncTime.current > 500) {
      updateShape(shape.id, newPos).catch(error => {
        console.error('❌ Error syncing to Firestore:', error);
      });
      lastSyncTime.current = now;
    }
  }, [shape.id, isPresenceActive, updateCursorFromEvent, updateShape]);

  // Handle shape drag end (final sync)
  const handleDragEnd = useCallback(async (e) => {
    const node = e.target;
    const stage = node.getStage();
    const newPos = node.position();

    isDragging.current = false;

    // No constraints for infinite canvas
    const constrainedPos = newPos;

    try {
      // Final position sync to both Realtime DB and Firestore
      await Promise.all([
        throttledUpdateShapePosition(shape.id, constrainedPos),
        updateShape(shape.id, constrainedPos)
      ]);
      
      // Clear drag state
      await setShapeDragState(shape.id, false);
      
      console.log('📦 Shape final position synced:', shape.id, constrainedPos);
    } catch (error) {
      console.error('❌ Error updating final shape position:', error);
    }

    // Reset cursor to default
    if (stage && stage.container()) {
      stage.container().style.cursor = 'default';
    }
  }, [updateShape, shape.id]);

  // Get shape styles based on state
  const getShapeStyles = useCallback(() => {
    const baseStyles = {
      fill: shape.fill
    };

    // Selected state - add blue stroke for selection indicator
    if (isSelected) {
      return {
        ...baseStyles,
        stroke: '#3B82F6', // Blue selection indicator
        strokeWidth: 3,
        shadowColor: 'rgba(59, 130, 246, 0.3)',
        shadowBlur: 10,
        shadowOffset: { x: 0, y: 0 }
      };
    }

    // Normal state - no stroke
    return baseStyles;
  }, [shape, isSelected]);

  // Determine cursor style
  const getCursor = useCallback(() => {
    if (isSelected) return 'grab';
    return 'pointer';
  }, [isSelected]);

  // Common props for all shapes
  const commonProps = {
    // Position
    x: shape.x,
    y: shape.y,
    rotation: shape.rotation || 0,
    scaleX: shape.scaleX || 1,
    scaleY: shape.scaleY || 1,
    
    // Styles
    ...getShapeStyles(),
    
    // Interaction
    draggable: true, // Enable Konva's built-in dragging
    onClick: handleClick,
    onContextMenu: handleContextMenu,
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
    
    // Accessibility
    name: `shape-${shape.id}`,
    id: shape.id,
    
    // Performance
    perfectDrawEnabled: false,
    listening: true,
    
    // Cursor
    cursor: getCursor()
  };

  // Render different shapes based on type
  switch (shape.type) {
    case SHAPE_TYPES.RECTANGLE:
      return (
        <Rect
          {...commonProps}
          width={shape.width}
          height={shape.height}
        />
      );
    
    case SHAPE_TYPES.CIRCLE:
      return (
        <Circle
          {...commonProps}
          radius={shape.radius}
        />
      );
    
    case SHAPE_TYPES.TRIANGLE:
      return (
        <Line
          {...commonProps}
          points={shape.points}
          closed={shape.closed !== false} // Default to true for triangles
        />
      );
    
    default:
      // Fallback to rectangle for unknown types
      console.warn('Unknown shape type:', shape.type, 'falling back to rectangle');
      return (
        <Rect
          {...commonProps}
          width={shape.width || 100}
          height={shape.height || 100}
        />
      );
  }
}

export default Shape;