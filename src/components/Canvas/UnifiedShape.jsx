import { useCallback, useRef, useEffect } from 'react';
import { Rect, Circle, Ellipse, Line, Text, Group, Shape } from 'react-konva';
import { useCanvas } from '../../contexts/ModernCanvasContext';
import { SHAPE_TYPES } from '../../utils/constants';
import { snapPointToGrid, shouldSnapToGrid } from '../../utils/gridSnapping';

/**
 * Generate control handles for smooth curve between anchor points
 * @param {Array} anchorPoints - Array of anchor points [{x, y}, ...]
 * @param {number} smoothing - Smoothing factor (0 = sharp, 1 = very smooth)
 * @returns {Array} Array of control point pairs for each segment
 */
function generateControlHandles(anchorPoints, smoothing = 0.3) {
  if (!anchorPoints || anchorPoints.length < 2) {
    return [];
  }

  const controlHandles = [];
  
  for (let i = 0; i < anchorPoints.length - 1; i++) {
    const current = anchorPoints[i];
    const next = anchorPoints[i + 1];
    
    // Get surrounding points for tangent calculation
    const prev = i > 0 ? anchorPoints[i - 1] : null;
    const afterNext = i < anchorPoints.length - 2 ? anchorPoints[i + 2] : null;
    
    // Calculate tangent vectors
    let tangent1, tangent2;
    
    if (prev) {
      // Use the vector from previous to next point
      tangent1 = {
        x: (next.x - prev.x) * smoothing,
        y: (next.y - prev.y) * smoothing
      };
    } else {
      // First point: use vector to next point
      tangent1 = {
        x: (next.x - current.x) * smoothing,
        y: (next.y - current.y) * smoothing
      };
    }
    
    if (afterNext) {
      // Use the vector from current to after next point
      tangent2 = {
        x: (afterNext.x - current.x) * smoothing,
        y: (afterNext.y - current.y) * smoothing
      };
    } else {
      // Last point: use vector from current point
      tangent2 = {
        x: (next.x - current.x) * smoothing,
        y: (next.y - current.y) * smoothing
      };
    }
    
    // Generate control points for this segment
    const control1 = {
      x: current.x + tangent1.x,
      y: current.y + tangent1.y
    };
    
    const control2 = {
      x: next.x - tangent2.x,
      y: next.y - tangent2.y
    };
    
    controlHandles.push([control1, control2]);
  }
  
  return controlHandles;
}

/**
 * Generate points for multi-segment bezier curve
 * @param {Array} anchorPoints - Array of anchor points [{x, y}, ...]
 * @param {number} smoothing - Smoothing factor for auto-generated control handles
 * @param {number} segments - Number of segments per curve section
 * @returns {Array} Array of points [x1, y1, x2, y2, ...]
 */
function generateMultiBezierPoints(anchorPoints, smoothing = 0.3, segments = 25) {
  if (!anchorPoints || anchorPoints.length < 2) {
    return [0, 0, 100, 0]; // Fallback to simple line
  }

  if (anchorPoints.length === 2) {
    // Simple line for 2 points
    return [anchorPoints[0].x, anchorPoints[0].y, anchorPoints[1].x, anchorPoints[1].y];
  }

  const controlHandles = generateControlHandles(anchorPoints, smoothing);
  const allPoints = [];

  // Generate bezier curve for each segment
  for (let i = 0; i < anchorPoints.length - 1; i++) {
    const p0 = anchorPoints[i];
    const p3 = anchorPoints[i + 1];
    const [p1, p2] = controlHandles[i];

    // Generate curve points for this segment
    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;
      const t2 = t * t;
      const t3 = t2 * t;

      // Cubic bezier formula: P(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
      const x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x;
      const y = mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y;

      // Skip duplicate points at segment connections (except for first segment)
      if (i === 0 || j > 0) {
        allPoints.push(x, y);
      }
    }
  }

  return allPoints;
}

/**
 * Calculate triangle centroid for proper rotation center
 * @param {Array} points - Array of triangle points [x1, y1, x2, y2, x3, y3]
 * @returns {Object} Centroid coordinates {x, y}
 */
function getTriangleCentroid(points) {
  if (!points || points.length < 6) return { x: 0, y: 0 };
  const x = (points[0] + points[2] + points[4]) / 3;
  const y = (points[1] + points[3] + points[5]) / 3;
  return { x, y };
}

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
function UnifiedShape({ shape, isSelected, updateCursor, snapToGrid = false }) {
  const { 
    selectShape,
    toggleShapeSelection,
    addToSelection,
    deleteShape,
    updateShape,
    startDrag,
    updateDragPositions,
    endDrag,
    isDragging,
    isTransforming,
    setTransformMode,
    updateBezierPoint,
    syncBezierPoints,
    removeBezierPoint,
    stageRef,
    stageScale
  } = useCanvas();

  // Interaction state - reliable drag tracking
  const isMouseDown = useRef(false);
  const mouseDownPos = useRef(null);
  const dragActive = useRef(false);
  const hasMoved = useRef(false);
  
  const MOVE_THRESHOLD = 3; // 3px movement to start drag

  // Helper function to update cursor from drag events with correct coordinates
  const updateCursorFromDragEvent = useCallback((event, stage) => {
    if (!updateCursor || !stage) return;
    
    // Get screen coordinates from the actual mouse event
    const rect = stage.container().getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    
    // Convert to canvas coordinates
    const stagePos = stage.position();
    const stageScale = stage.scaleX();
    const canvasX = (screenX - stagePos.x) / stageScale;
    const canvasY = (screenY - stagePos.y) / stageScale;
    
    // Update cursor with both screen and canvas coordinates
    updateCursor(screenX, screenY, canvasX, canvasY);
    
    console.log('🎯 Updated cursor during drag:', {
      screen: { x: screenX, y: screenY },
      canvas: { x: canvasX, y: canvasY }
    });
  }, [updateCursor]);

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

    // Handle selection based on modifier keys and current selection state
    const isCtrlPressed = e.evt.ctrlKey || e.evt.metaKey; // Ctrl on Windows/Linux, Cmd on Mac
    const isShiftPressed = e.evt.shiftKey;
    
    console.log('🖱️ Mouse down on shape:', {
      shapeId: shape.id,
      shapeType: shape.type,
      isSelected,
      isCtrlPressed,
      isShiftPressed,
      position: canvasPos
    });
    
    // NEW LOGIC: Preserve multi-select when clicking already-selected shapes
    if (isSelected) {
      // Shape is already selected - preserve selection for dragging
      if (isCtrlPressed) {
        // Ctrl+click on selected shape: Remove from selection
        console.log('🔄 Ctrl+click on selected shape - toggling selection');
        toggleShapeSelection(shape.id);
      } else if (isShiftPressed) {
        // Shift+click on selected shape: Keep in selection (no change)
        console.log('🔄 Shift+click on selected shape - keeping selection');
        // This allows dragging the group while maintaining selection
      } else {
        console.log('🔄 Regular click on selected shape - preserving multi-select');
      }
      // Regular click on selected shape: Keep selection (preserve multi-select)
    } else {
      // Shape is NOT selected - apply normal selection logic
      if (isCtrlPressed) {
        // Ctrl+click: Add to selection (additive)
        console.log('➕ Ctrl+click - adding to selection');
        addToSelection(shape.id);
      } else if (isShiftPressed) {
        // Shift+click: Add to selection (additive)
        console.log('➕ Shift+click - adding to selection');
        addToSelection(shape.id);
      } else {
        // Regular click: Single select (clears other selections)
        console.log('🎯 Regular click - single select');
        selectShape(shape.id);
      }
    }
    
    console.log('🔧 Mouse state set - ready for drag');
  }, [shape.id, selectShape, toggleShapeSelection, addToSelection, stageRef, isSelected, shape.type]);

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
      
      const success = startDrag(shape.id);
      if (success) {
        console.log('✅ Drag started successfully for shape:', shape.id);
      } else {
        console.log('❌ Failed to start drag for shape:', shape.id);
      }
    }
    
    // Update drag positions if drag is active
    if (dragActive.current && isDragging) {
      console.log('🎯 Updating drag positions:', currentPos);
      updateDragPositions(shape.id, currentPos);
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
        
        const success = startDrag(shape.id);
        if (success) {
          console.log('🎯 Global drag started for shape:', shape.id);
        }
      }
      
      // Update drag positions if drag is active
      if (dragActive.current && isDragging) {
        updateDragPositions(shape.id, currentPos);
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
    const baseStyles = shape.type === SHAPE_TYPES.LINE ? {
      stroke: shape.stroke || shape.fill, // Lines use stroke instead of fill
      strokeWidth: shape.strokeWidth || 3
    } : {
      fill: shape.fill
    };

    if (isSelected) {
      return {
        ...baseStyles,
        stroke: '#3B82F6',
        strokeWidth: shape.type === SHAPE_TYPES.LINE ? Math.max((shape.strokeWidth || 3) + 2, 5) : 3,
        shadowColor: 'rgba(59, 130, 246, 0.3)',
        shadowBlur: 10,
        shadowOffset: { x: 0, y: 0 }
      };
    }

    return baseStyles;
  }, [shape.fill, shape.stroke, shape.strokeWidth, shape.type, isSelected]);

  // Determine cursor style based on state
  const getCursor = useCallback(() => {
    if (dragActive.current && isDragging) return 'grabbing';
    if (isSelected) return 'grab';
    return 'pointer';
  }, [isSelected, isDragging]);

  // Common props for all shapes
  const rotationDegrees = shape.rotation || 0;
  
  // Calculate triangle centroid for proper rotation center
  const triangleCentroid = shape.type === SHAPE_TYPES.TRIANGLE 
    ? getTriangleCentroid(shape.points || [0, -40, -35, 30, 35, 30])
    : { x: 0, y: 0 };
  
  // Debug rotation
  if (shape.rotation && shape.rotation !== 0) {
    console.log('🎯 Shape rotation:', {
      shapeId: shape.id,
      storedDegrees: shape.rotation,
      rotationDegrees: rotationDegrees,
      shouldBe45Deg: shape.rotation === 45,
      trianglePoints: shape.points,
      triangleCentroid: triangleCentroid,
      expected90Deg: shape.rotation === 90 ? 'Should point RIGHT' : 'Not 90 degrees'
    });
  }
  
  const commonProps = {
    x: shape.x,
    y: shape.y,
    rotation: rotationDegrees, // Use degrees directly
    scaleX: shape.scaleX || 1,
    scaleY: shape.scaleY || 1,
    
    // Offset for rotation (center of shape)
    offsetX: shape.type === SHAPE_TYPES.RECTANGLE ? (shape.width || 100) / 2 : 
             shape.type === SHAPE_TYPES.CIRCLE ? 0 : // Circles are already center-positioned in Konva
             shape.type === SHAPE_TYPES.LINE ? 0 : // Lines use their points for positioning
             shape.type === SHAPE_TYPES.BEZIER_CURVE ? 0 : // Bezier curves are now centered around (0,0)
             shape.type === SHAPE_TYPES.TRIANGLE ? triangleCentroid.x : // Triangle rotates around centroid
             shape.type === SHAPE_TYPES.TEXT || shape.type === SHAPE_TYPES.TEXT_INPUT ? (shape.width || 200) / 2 : 0,
    offsetY: shape.type === SHAPE_TYPES.RECTANGLE ? (shape.height || 100) / 2 : 
             shape.type === SHAPE_TYPES.CIRCLE ? 0 : // Circles are already center-positioned in Konva
             shape.type === SHAPE_TYPES.LINE ? 0 : // Lines use their points for positioning
             shape.type === SHAPE_TYPES.BEZIER_CURVE ? 0 : // Bezier curves are now centered around (0,0)
             shape.type === SHAPE_TYPES.TRIANGLE ? triangleCentroid.y : // Triangle rotates around centroid
             shape.type === SHAPE_TYPES.TEXT_INPUT ? (shape.height || 40) / 2 : 0,
    
    ...getShapeStyles(),
    
    // SIMPLIFIED DRAG: Use Konva's built-in drag with our handlers
    draggable: !isTransforming, // Disable dragging during transform to prevent conflicts
    onMouseDown: handleMouseDown,
    onContextMenu: handleContextMenu,
    
    // Konva drag events with cursor sync
    onDragStart: (e) => {
      console.log('🚀 Konva drag start for shape:', shape.id);
      
      // Start drag tracking
      startDrag(shape.id);
      
      // Update user cursor using the actual mouse event for accurate coordinates
      if (updateCursor && stageRef.current && e.evt) {
        updateCursorFromDragEvent(e.evt, stageRef.current);
      }
    },
    onDragMove: (e) => {
      console.log('🎯 Konva drag move for shape:', shape.id);
      let pos = e.target.position();
      
      // Apply grid snapping if enabled
      if (shouldSnapToGrid(snapToGrid)) {
        const snappedPos = snapPointToGrid(pos, stageScale);
        pos = snappedPos;
        e.target.position(pos);
      }
      
      // Update positions
      updateDragPositions(shape.id, pos);
      
      // Update user cursor using the actual mouse event for accurate coordinates
      if (updateCursor && stageRef.current && e.evt) {
        updateCursorFromDragEvent(e.evt, stageRef.current);
      }
    },
    onDragEnd: (e) => {
      console.log('✅ Konva drag end for shape:', shape.id);
      
      // End drag tracking
      endDrag();
      
      // Final cursor position update using actual mouse event
      if (updateCursor && stageRef.current && e.evt) {
        updateCursorFromDragEvent(e.evt, stageRef.current);
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
        <Ellipse
          {...commonProps}
          radiusX={shape.radiusX || 50}
          radiusY={shape.radiusY || 50}
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
    
    case SHAPE_TYPES.LINE:
      return (
        <Line
          {...commonProps}
          points={shape.points || [-50, 0, 50, 0]}
          stroke={shape.stroke || commonProps.fill}
          strokeWidth={shape.strokeWidth || 3}
          fill={null} // Lines don't have fill
          closed={false}
        />
      );
    
    case SHAPE_TYPES.TEXT:
      return (
        <Group {...commonProps}>
          <Text
            x={(shape.width || 200) / 2}
            y={(shape.height || 'auto') === 'auto' ? 0 : (shape.height || 40) / 2}
            text={shape.text || 'Text'}
            fontSize={shape.fontSize || 20}
            fontFamily={shape.fontFamily || 'Arial, sans-serif'}
            fill={shape.fill || '#1F2937'}
            width={shape.width || 200}
            height={shape.height || 'auto'}
            align={shape.align || 'center'}
            verticalAlign={shape.verticalAlign || 'middle'}
            padding={shape.padding || 8}
            wrap="word"
            offsetX={shape.width ? shape.width / 2 : 100}
            offsetY={shape.height && shape.height !== 'auto' ? shape.height / 2 : 0}
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
    
    case SHAPE_TYPES.BEZIER_CURVE:
      const anchorPoints = shape.anchorPoints || [
        { x: -75, y: 0 },     // Start anchor point (left)
        { x: 0, y: -50 },     // Middle anchor point (center, up)  
        { x: 75, y: 0 }       // End anchor point (right)
      ];
      
      const bezierPoints = generateMultiBezierPoints(anchorPoints, shape.smoothing || 0.3);
      
      return (
        <Group {...commonProps}>
          {/* Main bezier curve */}
          <Line
            points={bezierPoints}
            stroke={shape.stroke || '#8B5CF6'}
            strokeWidth={shape.strokeWidth || 3}
            fill={null}
            closed={false}
            lineCap={shape.lineCap || 'round'}
            lineJoin={shape.lineJoin || 'round'}
            tension={0} // We handle our own curve generation
            onDblClick={(e) => {
              e.cancelBubble = true;
              // Toggle anchor point visibility on double-click
              updateShape(shape.id, { 
                showAnchorPoints: !shape.showAnchorPoints 
              });
            }}
          />
          
          {/* Anchor points (visible when selected and editing) */}
          {isSelected && shape.showAnchorPoints && anchorPoints.map((point, index) => (
            <Circle
              key={`anchor-${index}`}
              x={point.x}
              y={point.y}
              radius={8}
              fill="#3B82F6"
              stroke="#FFFFFF"
              strokeWidth={3}
              draggable={true}
              onDragStart={(e) => {
                e.cancelBubble = true;
                // Prevent shape dragging when dragging anchor points
                setTransformMode(true);
                
                // Update cursor position during anchor point drag
                if (updateCursor && stageRef.current && e.evt) {
                  updateCursorFromDragEvent(e.evt, stageRef.current);
                }
              }}
              onDragMove={(e) => {
                e.cancelBubble = true;
                // Get current anchor point position
                let newPosition = { x: e.target.x(), y: e.target.y() };
                
                // Apply grid snapping if enabled (anchor points are always user-initiated)
                if (shouldSnapToGrid(snapToGrid)) {
                  const snappedPos = snapPointToGrid(newPosition, stageScale);
                  newPosition = snappedPos;
                  e.target.position(snappedPos);
                }
                
                // Update anchor point position in real-time
                updateBezierPoint(shape.id, index, newPosition);
                
                // Update cursor position during anchor point drag
                if (updateCursor && stageRef.current && e.evt) {
                  updateCursorFromDragEvent(e.evt, stageRef.current);
                }
              }}
              onDragEnd={(e) => {
                e.cancelBubble = true;
                // Sync final anchor point positions to database
                syncBezierPoints(shape.id);
                // Re-enable shape dragging
                setTransformMode(false);
                
                // Final cursor position update
                if (updateCursor && stageRef.current && e.evt) {
                  updateCursorFromDragEvent(e.evt, stageRef.current);
                }
              }}
              onMouseEnter={(e) => {
                e.target.getStage().container().style.cursor = 'pointer';
              }}
              onMouseLeave={(e) => {
                e.target.getStage().container().style.cursor = 'default';
              }}
              onClick={(e) => {
                e.cancelBubble = true;
                // Prevent selecting the main shape when clicking anchor points
              }}
              onContextMenu={(e) => {
                e.evt.preventDefault();
                e.cancelBubble = true;
                
                // Right-click to delete anchor point (minimum 2 points)
                if (anchorPoints.length > 2) {
                  removeBezierPoint(shape.id, index);
                }
              }}
            />
          ))}
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
