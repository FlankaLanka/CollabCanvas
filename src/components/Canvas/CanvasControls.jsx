import { useCallback } from 'react';
import { useCanvas } from '../../contexts/ModernCanvasContext';
import { MIN_ZOOM, MAX_ZOOM, DEFAULT_ZOOM } from '../../utils/constants';

function CanvasControls() {
  const {
    stageRef,
    stageScale,
    stagePosition,
    updateStageTransform,
    deleteSelectedShapes,
    selectedId,
    shapes
  } = useCanvas();

  // Zoom In
  const handleZoomIn = useCallback(() => {
    if (!stageRef.current) return;
    
    const stage = stageRef.current;
    const newScale = Math.min(stageScale * 1.2, MAX_ZOOM);
    
    // Zoom to center
    const containerRect = stage.container().getBoundingClientRect();
    const center = {
      x: containerRect.width / 2,
      y: containerRect.height / 2
    };

    const mousePointTo = {
      x: (center.x - stage.x()) / stageScale,
      y: (center.y - stage.y()) / stageScale,
    };

    const newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
    updateStageTransform(newScale, newPos);
    stage.batchDraw();
  }, [stageRef, stageScale, updateStageTransform]);

  // Zoom Out
  const handleZoomOut = useCallback(() => {
    if (!stageRef.current) return;
    
    const stage = stageRef.current;
    const newScale = Math.max(stageScale * 0.8, MIN_ZOOM);
    
    // Zoom to center
    const containerRect = stage.container().getBoundingClientRect();
    const center = {
      x: containerRect.width / 2,
      y: containerRect.height / 2
    };

    const mousePointTo = {
      x: (center.x - stage.x()) / stageScale,
      y: (center.y - stage.y()) / stageScale,
    };

    const newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
    updateStageTransform(newScale, newPos);
    stage.batchDraw();
  }, [stageRef, stageScale, updateStageTransform]);

  // Reset View
  const handleResetView = useCallback(() => {
    if (!stageRef.current) return;
    
    const stage = stageRef.current;
    const newScale = DEFAULT_ZOOM;
    const newPos = { x: 0, y: 0 };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
    updateStageTransform(newScale, newPos);
    stage.batchDraw();
  }, [stageRef, updateStageTransform]);


  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-2 space-y-2 z-10">
      {/* Zoom Controls */}
      <div className="flex flex-col space-y-1">
        <button
          onClick={handleZoomIn}
          disabled={stageScale >= MAX_ZOOM}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Zoom In"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        
        <button
          onClick={handleZoomOut}
          disabled={stageScale <= MIN_ZOOM}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Zoom Out"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>

        <button
          onClick={handleResetView}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="Reset View"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        
        {/* Grid and snapping controls moved to Properties Panel */}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Delete Control */}
      {selectedId && (
        <div className="flex flex-col space-y-1">
          <button
            onClick={deleteSelectedShapes}
            className="p-2 rounded hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
            title="Delete Selected Shape"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500 pt-1 border-t border-gray-200">
        <div>Shapes: {shapes.length}</div>
        {selectedId && (
          <div className="text-blue-600">Shape selected</div>
        )}
      </div>
    </div>
  );
}

export default CanvasControls;