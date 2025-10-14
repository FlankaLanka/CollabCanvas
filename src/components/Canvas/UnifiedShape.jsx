import { useCallback, useRef, useEffect } from 'react';
import { Rect, Circle, Line, Text, Group } from 'react-konva';
import { useCanvas } from '../../contexts/ModernCanvasContext';
import { SHAPE_TYPES } from '../../utils/constants';

/**
 * Unified Shape Component - Works with all interaction models
 * - Click = Select (new model) or toggle multi-select (old model)
 * - Drag = Immediate drag on mouse move with database sync
 * - Right-click = Delete
 * - Global mouse tracking prevents desync
 * 
 * NOTE: updateCursor is passed as prop from Canvas component to avoid
 * each shape managing its own presence lifecycle (which would cause
 * users to be removed from presence when shapes are deleted)
 */
function UnifiedShape({ shape, isSelected, updateCursor }) {
  const { 
    selectShape,
    deleteShape,
    startDrag,
    updateDragPositions,
    endDrag,
    isDragging,
    stageRef
  } = useCanvas();

  // Interaction state - reliable drag tracking
  const isMouseDown = useRef(false);
  const mouseDownPos = useRef(null);
  const dragActive = useRef(false);
  const hasMoved = useRef(false);
  
  const MOVE_THRESHOLD = 3; // 3px movement to start drag

  // Handle mouse down (select and prepare for drag)
  const handleMouseDown = useCallback((e) => {
    if (e.evt.button !== 0) return; // Only left mouse button
    
    e.cancelBubble = true;
    e.evt.stopPropagation();
    
    const stage = stageRef.current;
    if (!stage) {
      console.log('❌ No stage ref available');
      return;
    }

    const pointer = stage.getPointerPosition();
    if (!pointer) {
      console.log('❌ No pointer position available');
      return;
    }
    
    const stageTransform = stage.getAbsoluteTransform().invert();
    const canvasPos = stageTransform.point(pointer);
    
    // Set mouse state
    isMouseDown.current = true;
    mouseDownPos.current = canvasPos;
    dragActive.current = false;
    hasMoved.current = false;

    // Always single select (multi-select disabled)
    selectShape(shape.id);
    
    console.log('🖱️ Mouse down on shape:', shape.id, 'at position:', canvasPos);
    console.log('🔧 Mouse state set - ready for drag');
  }, [shape.id, selectShape, stageRef]);

  // Handle mouse move (start drag when threshold exceeded)
  const handleMouseMove = useCallback((e) => {
    if (!isMouseDown.current || !mouseDownPos.current) {
      return;
    }
    
    console.log('🏃 Mouse move detected on shape:', shape.id);
    
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const stageTransform = stage.getAbsoluteTransform().invert();
    const currentPos = stageTransform.point(pointer);
    
    // Calculate movement distance
    const deltaX = currentPos.x - mouseDownPos.current.x;
    const deltaY = currentPos.y - mouseDownPos.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    console.log('📏 Movement distance:', distance, 'threshold:', MOVE_THRESHOLD);
    
    // Start drag immediately when threshold exceeded
    if (distance > MOVE_THRESHOLD && !dragActive.current && !isDragging) {
      console.log('🚀 Attempting to start drag...');
      dragActive.current = true;
      hasMoved.current = true;
      
      const success = startDrag(mouseDownPos.current);
      if (success) {
        console.log('✅ Drag started successfully for shape:', shape.id);
      } else {
        console.log('❌ Failed to start drag for shape:', shape.id);
      }
    }
    
    // Update drag positions if drag is active
    if (dragActive.current && isDragging) {
      console.log('🎯 Updating drag positions:', currentPos);
      updateDragPositions(currentPos);
    }
  }, [stageRef, startDrag, updateDragPositions, isDragging, shape.id]);

  // Handle mouse up (end drag or complete selection)
  const handleMouseUp = useCallback((e) => {
    e.cancelBubble = true;
    
    // End drag if it was active - THIS SYNCS TO DATABASE
    if (dragActive.current && isDragging) {
      endDrag(); // This calls the database sync!
      console.log('✅ Drag ended and synced to database for shape:', shape.id);
    }
    
    // Reset all mouse state
    isMouseDown.current = false;
    dragActive.current = false;
    mouseDownPos.current = null;
    hasMoved.current = false;
  }, [endDrag, isDragging, shape.id]);

  // CRITICAL: Global mouse event handlers prevent desync
  useEffect(() => {
    const handleGlobalMouseUp = (e) => {
      if (isMouseDown.current) {
        // End drag if it was active - DATABASE SYNC HAPPENS HERE TOO
        if (dragActive.current && isDragging) {
          endDrag();
          console.log('✅ Global drag ended and synced to database for shape:', shape.id);
        }
        
        // Reset all state
        isMouseDown.current = false;
        dragActive.current = false;
        mouseDownPos.current = null;
        hasMoved.current = false;
      }
    };

    const handleGlobalMouseMove = (e) => {
      if (!isMouseDown.current || !mouseDownPos.current || !stageRef.current) return;
      
      const stage = stageRef.current;
      const rect = stage.container().getBoundingClientRect();
      
      // Convert screen coordinates to canvas coordinates
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      
      const stageTransform = stage.getAbsoluteTransform().invert();
      const currentPos = stageTransform.point({ x: clientX, y: clientY });
      
      // Calculate movement distance
      const deltaX = currentPos.x - mouseDownPos.current.x;
      const deltaY = currentPos.y - mouseDownPos.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Start drag immediately when threshold exceeded
      if (distance > MOVE_THRESHOLD && !dragActive.current && !isDragging) {
        dragActive.current = true;
        hasMoved.current = true;
        
        const success = startDrag(mouseDownPos.current);
        if (success) {
          console.log('🎯 Global drag started for shape:', shape.id);
        }
      }
      
      // Update drag positions if drag is active
      if (dragActive.current && isDragging) {
        updateDragPositions(currentPos);
      }
    };

    // Add global listeners only when mouse is down on this shape
    if (isMouseDown.current) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, stageRef, startDrag, updateDragPositions, endDrag, shape.id]);

  // Handle right-click deletion
  const handleContextMenu = useCallback((e) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
    
    deleteShape(shape.id);
    console.log('🗑️ Shape deleted via right-click:', shape.id);
  }, [deleteShape, shape.id]);

  // Get shape styles based on selection state
  const getShapeStyles = useCallback(() => {
    const baseStyles = {
      fill: shape.fill
    };

    if (isSelected) {
      return {
        ...baseStyles,
        stroke: '#3B82F6',
        strokeWidth: 3,
        shadowColor: 'rgba(59, 130, 246, 0.3)',
        shadowBlur: 10,
        shadowOffset: { x: 0, y: 0 }
      };
    }

    return baseStyles;
  }, [shape.fill, isSelected]);

  // Determine cursor style based on state
  const getCursor = useCallback(() => {
    if (dragActive.current && isDragging) return 'grabbing';
    if (isSelected) return 'grab';
    return 'pointer';
  }, [isSelected, isDragging]);

  // Common props for all shapes
  const commonProps = {
    x: shape.x,
    y: shape.y,
    rotation: shape.rotation || 0,
    scaleX: shape.scaleX || 1,
    scaleY: shape.scaleY || 1,
    
    // Offset for rotation (center of shape)
    offsetX: shape.type === SHAPE_TYPES.RECTANGLE ? (shape.width || 100) / 2 : 
             shape.type === SHAPE_TYPES.CIRCLE ? 0 :
             shape.type === SHAPE_TYPES.TEXT || shape.type === SHAPE_TYPES.TEXT_INPUT ? (shape.width || 200) / 2 : 0,
    offsetY: shape.type === SHAPE_TYPES.RECTANGLE ? (shape.height || 100) / 2 : 
             shape.type === SHAPE_TYPES.CIRCLE ? 0 :
             shape.type === SHAPE_TYPES.TEXT_INPUT ? (shape.height || 40) / 2 : 0,
    
    ...getShapeStyles(),
    
    // SIMPLIFIED DRAG: Use Konva's built-in drag with our handlers
    draggable: true, // Enable Konva dragging for simplicity
    onMouseDown: handleMouseDown,
    onContextMenu: handleContextMenu,
    
    // Konva drag events with cursor sync
    onDragStart: (e) => {
      console.log('🚀 Konva drag start for shape:', shape.id);
      const pos = e.target.position();
      
      // Start drag tracking
      startDrag(pos);
      
      // Update user cursor to show at drag position
      if (updateCursor && stageRef.current) {
        const stage = stageRef.current;
        const stagePos = stage.position();
        const stageScale = stage.scaleX();
        const screenX = pos.x * stageScale + stagePos.x;
        const screenY = pos.y * stageScale + stagePos.y;
        updateCursor(screenX, screenY, pos.x, pos.y);
      }
    },
    onDragMove: (e) => {
      console.log('🎯 Konva drag move for shape:', shape.id);
      const pos = e.target.position();
      
      // Update positions
      updateDragPositions(pos);
      
      // Update user cursor to follow drag position
      if (updateCursor && stageRef.current) {
        const stage = stageRef.current;
        const stagePos = stage.position();
        const stageScale = stage.scaleX();
        const screenX = pos.x * stageScale + stagePos.x;
        const screenY = pos.y * stageScale + stagePos.y;
        updateCursor(screenX, screenY, pos.x, pos.y);
      }
    },
    onDragEnd: (e) => {
      console.log('✅ Konva drag end for shape:', shape.id);
      
      // End drag tracking
      endDrag();
      
      // Final cursor position update
      const pos = e.target.position();
      if (updateCursor && stageRef.current) {
        const stage = stageRef.current;
        const stagePos = stage.position();
        const stageScale = stage.scaleX();
        const screenX = pos.x * stageScale + stagePos.x;
        const screenY = pos.y * stageScale + stagePos.y;
        updateCursor(screenX, screenY, pos.x, pos.y);
      }
    },
    
    name: `shape-${shape.id}`,
    id: shape.id,
    perfectDrawEnabled: false,
    listening: true,
    cursor: getCursor()
  };

  // Render different shapes based on type
  switch (shape.type) {
    case SHAPE_TYPES.RECTANGLE:
      return (
        <Rect
          {...commonProps}
          width={shape.width || 100}
          height={shape.height || 100}
        />
      );
    
    case SHAPE_TYPES.CIRCLE:
      return (
        <Circle
          {...commonProps}
          radius={shape.radius || 50}
        />
      );
    
    case SHAPE_TYPES.TRIANGLE:
      return (
        <Line
          {...commonProps}
          points={shape.points || [0, -40, -35, 30, 35, 30]}
          closed={shape.closed !== false}
        />
      );
    
    case SHAPE_TYPES.TEXT:
      return (
        <Group {...commonProps}>
          <Text
            x={0}
            y={0}
            text={shape.text || 'Text'}
            fontSize={shape.fontSize || 20}
            fontFamily={shape.fontFamily || 'Arial, sans-serif'}
            fill={shape.fill || '#1F2937'}
            width={shape.width || 200}
            height={shape.height || 'auto'}
            align={shape.align || 'left'}
            verticalAlign={shape.verticalAlign || 'top'}
            padding={shape.padding || 8}
            wrap="word"
          />
        </Group>
      );
    
    case SHAPE_TYPES.TEXT_INPUT:
      return (
        <Group {...commonProps}>
          <Rect
            x={0}
            y={0}
            width={shape.width || 250}
            height={shape.height || 40}
            fill={shape.background || '#FFFFFF'}
            stroke={shape.borderColor || '#D1D5DB'}
            strokeWidth={shape.borderWidth || 1}
            cornerRadius={shape.cornerRadius || 6}
          />
          <Text
            x={shape.padding || 12}
            y={(shape.height || 40) / 2 - (shape.fontSize || 16) / 2}
            text={shape.text || 'Input Field'}
            fontSize={shape.fontSize || 16}
            fontFamily={shape.fontFamily || 'Arial, sans-serif'}
            fill={shape.fill || '#1F2937'}
            width={(shape.width || 250) - (shape.padding || 12) * 2}
            height={shape.fontSize || 16}
            align={shape.align || 'left'}
            verticalAlign="middle"
            ellipsis={true}
          />
        </Group>
      );
    
    default:
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

export default UnifiedShape;
