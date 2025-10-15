import { useState, useCallback } from 'react';
import { useCanvas } from '../../contexts/ModernCanvasContext';
import { SHAPE_TYPES } from '../../utils/constants';

/**
 * LayerPanel - Visual layer management interface
 * 
 * Features:
 * - Shows all shapes as layers sorted by z-index
 * - Visual thumbnails and shape names
 * - Layer visibility toggles
 * - Drag-and-drop reordering
 * - Layer operations (bring to front, send to back, etc.)
 * - Selection indicator for active layers
 */
function LayerPanel() {
  const {
    shapes,
    selectedIds,
    selectShape,
    toggleShapeSelection,
    bringToFront,
    sendToBack,
    moveForward,
    moveBackward,
    updateShape
  } = useCanvas();

  const [isVisible, setIsVisible] = useState(false);
  const [draggedLayer, setDraggedLayer] = useState(null);

  // Sort shapes by z-index (highest first for layer panel display)
  const sortedShapes = shapes.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

  // Toggle panel visibility
  const togglePanel = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  // Get shape type icon
  const getShapeIcon = useCallback((shapeType) => {
    switch (shapeType) {
      case SHAPE_TYPES.RECTANGLE:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        );
      case SHAPE_TYPES.CIRCLE:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="9" />
          </svg>
        );
      case SHAPE_TYPES.TRIANGLE:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12,2 22,20 2,20" />
          </svg>
        );
      case SHAPE_TYPES.LINE:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="7" y1="17" x2="17" y2="7" />
          </svg>
        );
      case SHAPE_TYPES.TEXT:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4,7 4,4 20,4 20,7" />
            <line x1="9" y1="20" x2="15" y2="20" />
            <line x1="12" y1="4" x2="12" y2="20" />
          </svg>
        );
      case SHAPE_TYPES.TEXT_INPUT:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="3" />
          </svg>
        );
    }
  }, []);

  // Get display name for shape
  const getShapeName = useCallback((shape) => {
    const typeName = shape.type.charAt(0).toUpperCase() + shape.type.slice(1);
    if (shape.type === SHAPE_TYPES.TEXT || shape.type === SHAPE_TYPES.TEXT_INPUT) {
      const text = shape.text || 'Text';
      return text.length > 20 ? text.substring(0, 20) + '...' : text;
    }
    return `${typeName} ${shape.id.slice(-6)}`;
  }, []);

  // Handle layer click
  const handleLayerClick = useCallback((e, shapeId) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      toggleShapeSelection(shapeId);
    } else {
      selectShape(shapeId);
    }
  }, [selectShape, toggleShapeSelection]);

  // Handle drag start
  const handleDragStart = useCallback((e, shape) => {
    setDraggedLayer(shape);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop (reorder layers)
  const handleDrop = useCallback(async (e, targetShape) => {
    e.preventDefault();
    if (!draggedLayer || draggedLayer.id === targetShape.id) {
      setDraggedLayer(null);
      return;
    }

    const targetZ = targetShape.zIndex || 0;
    await updateShape(draggedLayer.id, { zIndex: targetZ });
    
    console.log('🔄 Reordered layer:', draggedLayer.id, 'to z-index:', targetZ);
    setDraggedLayer(null);
  }, [draggedLayer, updateShape]);

  // Toggle shape visibility (using opacity)
  const toggleVisibility = useCallback(async (shapeId, currentlyVisible) => {
    await updateShape(shapeId, { 
      opacity: currentlyVisible ? 0.1 : 1,
      listening: !currentlyVisible // Make invisible shapes non-interactive
    });
  }, [updateShape]);

  if (!isVisible) {
    return (
      <button
        onClick={togglePanel}
        className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-white border border-gray-300 rounded-lg p-2 shadow-lg hover:shadow-xl transition-all z-10"
        title="Show Layer Panel"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <rect x="7" y="7" width="10" height="10" rx="1" />
          <rect x="11" y="11" width="2" height="2" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 w-72 bg-white border border-gray-300 rounded-lg shadow-xl z-10 max-h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">Layers</h3>
        <div className="flex items-center space-x-1">
          {/* Layer operations */}
          <button
            onClick={bringToFront}
            disabled={selectedIds.length === 0}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Bring to Front"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="17,11 21,7 17,3" />
              <line x1="21" y1="7" x2="9" y2="7" />
              <polyline points="13,21 9,17 13,13" />
              <line x1="9" y1="17" x2="21" y2="17" />
            </svg>
          </button>
          <button
            onClick={sendToBack}
            disabled={selectedIds.length === 0}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send to Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="7,13 3,17 7,21" />
              <line x1="3" y1="17" x2="15" y2="17" />
              <polyline points="11,3 15,7 11,11" />
              <line x1="15" y1="7" x2="3" y2="7" />
            </svg>
          </button>
          <button
            onClick={togglePanel}
            className="p-1 rounded hover:bg-gray-100"
            title="Hide Layer Panel"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sortedShapes.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No shapes on canvas
          </div>
        ) : (
          sortedShapes.map((shape) => {
            const isSelected = selectedIds.includes(shape.id);
            const isVisible = (shape.opacity || 1) > 0.5;
            
            return (
              <div
                key={shape.id}
                draggable
                onDragStart={(e) => handleDragStart(e, shape)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, shape)}
                onClick={(e) => handleLayerClick(e, shape.id)}
                className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-blue-100 border border-blue-300' 
                    : 'hover:bg-gray-50 border border-transparent'
                } ${draggedLayer?.id === shape.id ? 'opacity-50' : ''}`}
              >
                {/* Shape icon */}
                <div 
                  className="mr-2 text-gray-600"
                  style={{ color: shape.fill || shape.stroke || '#6B7280' }}
                >
                  {getShapeIcon(shape.type)}
                </div>

                {/* Shape name */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {getShapeName(shape)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Layer {shape.zIndex || 0}
                  </div>
                </div>

                {/* Visibility toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(shape.id, isVisible);
                  }}
                  className="p-1 rounded hover:bg-gray-200"
                  title={isVisible ? 'Hide Layer' : 'Show Layer'}
                >
                  {isVisible ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s3-7 11-7 11 7 11 7-3 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer with layer count */}
      <div className="p-2 border-t border-gray-200 text-xs text-gray-500 text-center">
        {sortedShapes.length} layer{sortedShapes.length !== 1 ? 's' : ''}
        {selectedIds.length > 0 && ` • ${selectedIds.length} selected`}
      </div>
    </div>
  );
}

export default LayerPanel;
