import { useEffect, useState, useCallback, useRef } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import { useCanvas } from '../../contexts/ModernCanvasContext';
import UnifiedShape from './UnifiedShape';
import ShapeTransformer from './ShapeTransformer';
import CanvasControls from './CanvasControls';
import CursorLayer from './CursorLayer';
import PropertiesPanel from './PropertiesPanel';
// InteractionGuide moved to Navbar
import AIChat from '../AI/AIChat';
import Grid from './Grid';
import { usePresence } from '../../hooks/usePresence';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  MIN_ZOOM, 
  MAX_ZOOM,
  DEFAULT_ZOOM 
} from '../../utils/constants';

function Canvas({ showGrid: propShowGrid, snapToGrid: propSnapToGrid }) {
  const {
    shapes,
    selectedId,
    selectedIds,
    stageRef,
    stageScale,
    stagePosition,
    updateStageTransform,
    clearSelection,
    selectAllShapes,
    addShape,
    isDrawingMode,
    currentDrawingPath,
    isDrawing,
    startDrawing,
    addDrawingPoint,
    finishDrawing,
    cancelDrawing,
    toggleDrawingMode,
    bringToFront,
    sendToBack,
    moveForward,
    moveBackward
  } = useCanvas();

  // Presence tracking (users & cursors)
  const {
    userCursors,
    updateCursor,
    updateCursorFromEvent,
    isActive: isPresenceActive
  } = usePresence();

  // Use regular user cursors (now includes drag position updates)
  const allCursors = userCursors;

  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef(null);
  
  // Use grid state from props (passed from App)
  const showGrid = propShowGrid ?? true;
  const snapToGrid = propSnapToGrid ?? false;
  
  // Middle mouse button panning state
  const [isMiddlePanning, setIsMiddlePanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  
  // Removed drag-to-select functionality (single-select only)

  // Update container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setContainerSize({ 
          width: clientWidth, 
          height: clientHeight 
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle keyboard shortcuts for drawing mode and selection
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC key to exit drawing mode or cancel current drawing
      if (e.key === 'Escape') {
        if (isDrawing) {
          cancelDrawing();
        } else if (isDrawingMode) {
          toggleDrawingMode();
        }
      }
      
      // Ctrl+A to select all shapes
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault(); // Prevent browser's select all
        selectAllShapes();
      }
      
      // Layer management shortcuts (only when shapes are selected)
      if (selectedIds.length > 0) {
        // Ctrl+Shift+] to bring to front
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === ']') {
          e.preventDefault();
          bringToFront();
        }
        
        // Ctrl+Shift+[ to send to back
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '[') {
          e.preventDefault();
          sendToBack();
        }
        
        // Ctrl+] to move forward
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === ']') {
          e.preventDefault();
          moveForward();
        }
        
        // Ctrl+[ to move backward
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === '[') {
          e.preventDefault();
          moveBackward();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawingMode, isDrawing, cancelDrawing, toggleDrawingMode, selectAllShapes, selectedIds, bringToFront, sendToBack, moveForward, moveBackward]);

  // Handle global mouse up for middle button panning (in case mouse is released outside canvas)
  useEffect(() => {
    const handleGlobalMouseUp = (e) => {
      if (e.button === 1 && isMiddlePanning) {
        setIsMiddlePanning(false);
      }
    };

    const handleGlobalMouseMove = (e) => {
      if (isMiddlePanning && stageRef.current) {
        const stage = stageRef.current;
        const currentPoint = { x: e.clientX, y: e.clientY };
        
        // Calculate movement delta
        const deltaX = currentPoint.x - lastPanPoint.x;
        const deltaY = currentPoint.y - lastPanPoint.y;
        
        // Update stage position
        const currentPos = stage.position();
        const newPos = {
          x: currentPos.x + deltaX,
          y: currentPos.y + deltaY
        };
        
        // No constraints for infinite canvas
        const constrainedPos = newPos;
        
        stage.position(constrainedPos);
        updateStageTransform(stageScale, constrainedPos);
        
        // Update last pan point
        setLastPanPoint(currentPoint);
      }
    };

    if (isMiddlePanning) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
    }, [isMiddlePanning, lastPanPoint, containerSize, stageScale, updateStageTransform]);

  // Removed getShapesInRect function (no longer needed without multi-select)

  // Handle canvas click (deselect shapes when clicking empty area)
  const handleStageClick = useCallback((e) => {
    // More comprehensive empty area detection
    const isStage = e.target === e.target.getStage();
    const isLayer = e.target.nodeType === 'Layer';
    const isBackground = e.target.getClassName() === 'Layer' || e.target.constructor.name === 'Layer';
    const clickedOnEmpty = isStage || isLayer || isBackground;
    
    // Additional check: if target has no shape-related class names
    const targetClasses = e.target.getClassName ? e.target.getClassName() : '';
    const isShapeElement = targetClasses.includes('Shape') || targetClasses.includes('Rect') || 
                           targetClasses.includes('Circle') || targetClasses.includes('Ellipse') || targetClasses.includes('Line') ||
                           targetClasses.includes('Text') || targetClasses.includes('Group');
    
    const shouldClearSelection = (clickedOnEmpty || !isShapeElement);
    
    if (shouldClearSelection && selectedIds.length > 0) {
      console.log('🔍 Canvas click - clearing selection (target:', e.target.constructor.name, ')');
      clearSelection();
    }
  }, [clearSelection, selectedIds]);


  // Handle zoom (mouse wheel)
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    // Calculate zoom direction and amount
    const zoomAmount = e.evt.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(oldScale * zoomAmount, MIN_ZOOM), MAX_ZOOM);
    
    // Calculate new position to zoom toward cursor
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    // No constraints for infinite canvas
    const constrainedPos = newPos;

    stage.scale({ x: newScale, y: newScale });
    stage.position(constrainedPos);
    
    updateStageTransform(newScale, constrainedPos);
    stage.batchDraw();
  }, [containerSize, stageRef, updateStageTransform]);

  // Handle mouse move (for cursor tracking, panning, and drawing)
  const handleMouseMove = useCallback((e) => {
    if (isPresenceActive && stageRef.current) {
      updateCursorFromEvent(e.evt, stageRef.current);
    }

    // Handle drawing mode
    if (isDrawing && stageRef.current) {
      const stage = stageRef.current;
      
      // Get mouse coordinates relative to stage container
      const rect = stage.container().getBoundingClientRect();
      const x = e.evt.clientX - rect.left;
      const y = e.evt.clientY - rect.top;
      
      // Transform to canvas coordinates using direct calculation (more reliable than getPointerPosition)
      const stagePos = stage.position();
      const stageScale = stage.scaleX();
      const canvasPos = {
        x: (x - stagePos.x) / stageScale,
        y: (y - stagePos.y) / stageScale
      };
      
      // Validate coordinates before adding
      if (isFinite(canvasPos.x) && isFinite(canvasPos.y) && !isNaN(canvasPos.x) && !isNaN(canvasPos.y)) {
        addDrawingPoint(canvasPos);
      }
    }

    // Handle middle mouse button panning
    if (isMiddlePanning && stageRef.current) {
      const stage = stageRef.current;
      const currentPoint = { x: e.evt.clientX, y: e.evt.clientY };
      
      // Calculate movement delta
      const deltaX = currentPoint.x - lastPanPoint.x;
      const deltaY = currentPoint.y - lastPanPoint.y;
      
      // Update stage position
      const currentPos = stage.position();
      const newPos = {
        x: currentPos.x + deltaX,
        y: currentPos.y + deltaY
      };
      
      // No constraints for infinite canvas
      const constrainedPos = newPos;
      
      stage.position(constrainedPos);
      updateStageTransform(stageScale, constrainedPos);
      
      // Update last pan point
      setLastPanPoint(currentPoint);
    }

    // Removed drag-to-select rectangle handling (multi-select disabled)
  }, [updateCursorFromEvent, isPresenceActive, isDrawing, addDrawingPoint, isMiddlePanning, lastPanPoint, stageScale, updateStageTransform]);

  // Handle mouse down for panning, drawing, and drag-to-select
  const handleMouseDown = useCallback((e) => {
    // Check for middle mouse button (button 1) - panning
    if (e.evt.button === 1) {
      e.evt.preventDefault(); // Prevent default middle click behavior
      setIsMiddlePanning(true);
      setLastPanPoint({ x: e.evt.clientX, y: e.evt.clientY });
      return;
    }

    // Handle drawing mode (left mouse button)
    if (e.evt.button === 0 && isDrawingMode && stageRef.current) {
      e.evt.preventDefault();
      const stage = stageRef.current;
      
      // Get mouse coordinates relative to stage container
      const rect = stage.container().getBoundingClientRect();
      const x = e.evt.clientX - rect.left;
      const y = e.evt.clientY - rect.top;
      
      // Transform to canvas coordinates using direct calculation (more reliable than getPointerPosition)
      const stagePos = stage.position();
      const stageScale = stage.scaleX();
      const canvasPos = {
        x: (x - stagePos.x) / stageScale,
        y: (y - stagePos.y) / stageScale
      };
      
      // Validate coordinates before starting drawing
      if (isFinite(canvasPos.x) && isFinite(canvasPos.y) && !isNaN(canvasPos.x) && !isNaN(canvasPos.y)) {
        startDrawing(canvasPos);
      }
      return;
    }

    // Removed drag-to-select functionality (single-select only)
  }, [stageRef, isDrawingMode, startDrawing, stageScale]);

  // Handle mouse up for panning and drawing
  const handleMouseUp = useCallback((e) => {
    // Check for middle mouse button (button 1) - end panning
    if (e.evt.button === 1) {
      setIsMiddlePanning(false);
      return;
    }

    // Handle drawing mode (left mouse button) - finish drawing
    if (e.evt.button === 0 && isDrawing) {
      finishDrawing();
      return;
    }
  }, [isDrawing, finishDrawing]);


  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-gray-100 border-2 border-gray-300 rounded-lg overflow-hidden relative"
      style={{ 
        cursor: isMiddlePanning ? 'grabbing' : 
                isDrawingMode ? 'crosshair' : 
                'default' 
      }}
    >
      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
        draggable={false}
        onClick={handleStageClick}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {/* Background Layer - Coordinate Grid */}
        <Layer>          
          {showGrid && (
            <Grid 
              key={`grid-${stageScale}-${stagePosition.x}-${stagePosition.y}`} // Force re-render
              stageWidth={containerSize.width}
              stageHeight={containerSize.height}
              stageScale={stageScale}
              stagePosition={stagePosition}
              snapToGrid={snapToGrid}
            />
          )}
        </Layer>

         {/* Shapes Layer */}
         <Layer>
           {shapes
             .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)) // Sort by z-index (lowest to highest)
             .map((shape) => (
               <UnifiedShape 
                 key={shape.id} 
                 shape={shape} 
                 isSelected={selectedIds.includes(shape.id)}
                 updateCursor={updateCursor}
                 snapToGrid={snapToGrid}
               />
             ))}
           
          {/* Drawing Preview - Show current drawing path while drawing */}
          {isDrawing && currentDrawingPath.length >= 4 && (
            <Line
              points={currentDrawingPath}
              stroke="#8B5CF6"
              strokeWidth={3}
              closed={false}
              globalCompositeOperation="source-over"
              perfectDrawEnabled={false}
              listening={false}
            />
          )}

          {/* Shape Transformer - Provides resize/rotation handles for selected shapes */}
          <ShapeTransformer />
        </Layer>
      </Stage>

      {/* Cursor Layer */}
      <CursorLayer cursors={allCursors} isVisible={isPresenceActive} />

      {/* Canvas Controls */}
      <CanvasControls />

      {/* Interaction Guide moved to Navbar */}


      {/* Properties Panel */}
      <PropertiesPanel />

      {/* AI Chat moved to OnlineUsers component */}

      {/* Instructions */}
      {shapes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
          <div className="text-center bg-white bg-opacity-90 rounded-lg p-4 sm:p-6 border border-gray-200 max-w-sm sm:max-w-md">
            <div className="text-gray-600 mb-2 text-sm sm:text-base">
              🎨 Canvas Ready
            </div>
            <div className="text-xs sm:text-sm text-gray-500">
              • Use left toolbar to add shapes<br/>
              • Left-click & drag to move shapes<br/>
              • Right-click to delete shapes<br/>
              • Select shapes to edit properties<br/>
              • <span className="text-purple-600 font-medium">🤖 Try the AI assistant!</span><br/>
              <span className="hidden sm:inline">• Scroll to zoom • Middle-click to pan</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Canvas;