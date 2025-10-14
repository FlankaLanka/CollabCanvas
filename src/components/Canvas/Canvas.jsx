import { useEffect, useState, useCallback, useRef } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { useCanvas } from '../../contexts/CanvasContext';
import Shape from './Shape';
import CursorLayer from './CursorLayer';
import UserNamesList from './UserNamesList';
import PropertiesPanel from './PropertiesPanel';
import InteractionGuide from './InteractionGuide';
import { usePresence } from '../../hooks/usePresence';
import { useDragCursors } from '../../hooks/useDragCursors';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  MIN_ZOOM, 
  MAX_ZOOM,
  DEFAULT_ZOOM 
} from '../../utils/constants';

function Canvas() {
  const {
    shapes,
    selectedId,
    stageRef,
    stageScale,
    stagePosition,
    syncStatus,
    syncLoading,
    updateStageTransform,
    clearSelection,
    addShape
  } = useCanvas();

  // Presence tracking (users & cursors)
  const {
    userCursors,
    updateCursorFromEvent,
    isActive: isPresenceActive
  } = usePresence();

  // Drag cursors (when users are dragging shapes)
  const { dragCursors } = useDragCursors();

  // Combine regular cursors with drag cursors
  const allCursors = [...userCursors, ...dragCursors];

  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef(null);
  
  // Middle mouse button panning state
  const [isMiddlePanning, setIsMiddlePanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

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

  // Handle canvas click (deselect shapes when clicking empty area)
  const handleStageClick = useCallback((e) => {
    // Check if we clicked on the stage itself (not on a shape)
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      clearSelection();
    }
  }, [clearSelection]);


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

  // Handle mouse move (for cursor tracking and middle button panning)
  const handleMouseMove = useCallback((e) => {
    if (isPresenceActive && stageRef.current) {
      updateCursorFromEvent(e.evt, stageRef.current);
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
  }, [updateCursorFromEvent, isPresenceActive, isMiddlePanning, lastPanPoint, containerSize, stageScale, updateStageTransform]);

  // Handle mouse down for middle button panning
  const handleMouseDown = useCallback((e) => {
    // Check for middle mouse button (button 1)
    if (e.evt.button === 1) {
      e.evt.preventDefault(); // Prevent default middle click behavior
      setIsMiddlePanning(true);
      setLastPanPoint({ x: e.evt.clientX, y: e.evt.clientY });
    }
  }, []);

  // Handle mouse up for middle button panning
  const handleMouseUp = useCallback((e) => {
    // Check for middle mouse button (button 1)
    if (e.evt.button === 1) {
      setIsMiddlePanning(false);
    }
  }, []);


  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-gray-100 border-2 border-gray-300 rounded-lg overflow-hidden relative"
      style={{ cursor: isMiddlePanning ? 'grabbing' : 'default' }}
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
        {/* Background Layer - Infinite canvas, no fixed background */}
        <Layer>          
          {/* Optional: Grid lines could be added here for infinite canvas */}
        </Layer>

        {/* Shapes Layer */}
        <Layer>
          {shapes.map((shape) => (
            <Shape 
              key={shape.id} 
              shape={shape} 
              isSelected={shape.id === selectedId}
            />
          ))}
        </Layer>
      </Stage>

      {/* Cursor Layer */}
      <CursorLayer cursors={allCursors} isVisible={isPresenceActive} />

      {/* Interaction Guide */}
      <InteractionGuide />

      {/* UI Overlay */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded px-3 py-2 text-sm text-gray-600 border border-gray-300">
        <div>Zoom: {Math.round(stageScale * 100)}%</div>
        <div>Shapes: {shapes.length}</div>
        <div className="flex items-center text-xs mt-1">
          <SyncStatusIndicator status={syncStatus} loading={syncLoading} />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Use left toolbar to add shapes
        </div>
      </div>

      {/* User Names List */}
      <UserNamesList />

      {/* Properties Panel */}
      <PropertiesPanel />

      {/* Instructions */}
      {shapes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center bg-white bg-opacity-90 rounded-lg p-6 border border-gray-200">
            <div className="text-gray-600 mb-2">
              🎨 Canvas Ready
            </div>
            <div className="text-sm text-gray-500">
              • Use left toolbar to add rectangles, circles & triangles<br/>
              • Left-click & drag to move shapes<br/>
              • Right-click to delete shapes<br/>
              • Select shapes to edit colors & size<br/>
              • Scroll to zoom • Middle-click to pan canvas
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sync Status Indicator Component
function SyncStatusIndicator({ status, loading }) {
  if (loading) {
    return (
      <div className="flex items-center">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-2"></div>
        <span className="text-blue-600">Connecting...</span>
      </div>
    );
  }

  switch (status) {
    case 'connected':
      return (
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
          <span className="text-green-600">Real-time sync</span>
        </div>
      );
    case 'error':
      return (
        <div className="flex items-center">
          <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
          <span className="text-red-600">Sync error</span>
        </div>
      );
    case 'offline':
      return (
        <div className="flex items-center">
          <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
          <span className="text-gray-500">Offline mode</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center">
          <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
          <span className="text-yellow-600">Local mode</span>
        </div>
      );
  }
}

export default Canvas;