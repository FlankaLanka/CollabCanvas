import { useCallback } from 'react';
import { useCanvas } from '../contexts/ModernCanvasContext';
import { SHAPE_TYPES, DEFAULT_SHAPE_PROPS } from '../utils/constants';

function Toolbar({ showGrid, setShowGrid, snapToGrid, setSnapToGrid }) {
  const { 
    addShape, 
    deleteAllShapes, 
    shapes, 
    stageRef,
    isDrawingMode,
    toggleDrawingMode
  } = useCanvas();

  // Get viewport center position
  const getViewportCenter = useCallback(() => {
    if (!stageRef.current) {
      return { x: 400, y: 300 }; // Fallback center
    }

    const stage = stageRef.current;
    const container = stage.container();
    if (!container) {
      return { x: 400, y: 300 }; // Fallback center
    }

    // Get container dimensions
    const containerRect = container.getBoundingClientRect();
    const containerCenterX = containerRect.width / 2;
    const containerCenterY = containerRect.height / 2;

    // Convert screen coordinates to canvas coordinates (consistent with other transformations)
    const stagePos = stage.position(); // Get current position directly from stage
    const currentStageScale = stage.scaleX(); // Get current scale directly from stage
    
    const canvasX = (containerCenterX - stagePos.x) / currentStageScale;
    const canvasY = (containerCenterY - stagePos.y) / currentStageScale;

    // Add small random offset to avoid overlapping shapes
    const offset = 20;
    const randomX = (Math.random() - 0.5) * offset;
    const randomY = (Math.random() - 0.5) * offset;

    console.log('🎯 Viewport center calculated:', {
      containerSize: { width: containerRect.width, height: containerRect.height },
      containerCenter: { x: containerCenterX, y: containerCenterY },
      stagePos: stagePos,
      stageScale: currentStageScale,
      canvasCenter: { x: canvasX, y: canvasY },
      finalCenter: { x: canvasX + randomX, y: canvasY + randomY }
    });

    return {
      x: canvasX + randomX,
      y: canvasY + randomY
    };
  }, [stageRef]);

  // Create a rectangle
  const handleAddRectangle = useCallback(() => {
    const center = getViewportCenter();
    const defaults = DEFAULT_SHAPE_PROPS[SHAPE_TYPES.RECTANGLE];
    
    addShape({
      type: SHAPE_TYPES.RECTANGLE,
      x: center.x - defaults.width / 2, // Center the shape
      y: center.y - defaults.height / 2,
      width: defaults.width,
      height: defaults.height,
      fill: defaults.fill
    });
  }, [addShape, getViewportCenter]);

  // Create a circle
  const handleAddCircle = useCallback(() => {
    const center = getViewportCenter();
    const defaults = DEFAULT_SHAPE_PROPS[SHAPE_TYPES.CIRCLE];
    
    addShape({
      type: SHAPE_TYPES.CIRCLE,
      x: center.x, // Circle is now center-positioned (no offset needed)
      y: center.y,
      radiusX: defaults.radiusX,
      radiusY: defaults.radiusY,
      fill: defaults.fill
    });
  }, [addShape, getViewportCenter]);

  // Create a triangle
  const handleAddTriangle = useCallback(() => {
    const center = getViewportCenter();
    const defaults = DEFAULT_SHAPE_PROPS[SHAPE_TYPES.TRIANGLE];
    
    addShape({
      type: SHAPE_TYPES.TRIANGLE,
      x: center.x, // Triangle points are relative to x,y
      y: center.y,
      points: defaults.points,
      fill: defaults.fill,
      closed: defaults.closed
    });
  }, [addShape, getViewportCenter]);

  // Create a bezier curve
  const handleAddBezierCurve = useCallback(() => {
    const center = getViewportCenter();
    const defaults = DEFAULT_SHAPE_PROPS[SHAPE_TYPES.BEZIER_CURVE];
    
    addShape({
      type: SHAPE_TYPES.BEZIER_CURVE,
      x: center.x, // Position at center (anchor points are now centered around 0,0)
      y: center.y,
      anchorPoints: defaults.anchorPoints, // Use default centered anchor points
      stroke: defaults.stroke,
      strokeWidth: defaults.strokeWidth,
      fill: defaults.fill,
      lineCap: defaults.lineCap,
      lineJoin: defaults.lineJoin,
      smoothing: defaults.smoothing,
      editable: defaults.editable,
      showAnchorPoints: false // Start with anchor points hidden
    });
  }, [addShape, getViewportCenter]);

  // Toggle drawing mode for freeform line drawing
  const handleToggleDrawing = useCallback(() => {
    toggleDrawingMode();
  }, [toggleDrawingMode]);

  // Create a text element
  const handleAddText = useCallback(() => {
    const center = getViewportCenter();
    const defaults = DEFAULT_SHAPE_PROPS[SHAPE_TYPES.TEXT];
    
    addShape({
      type: SHAPE_TYPES.TEXT,
      x: center.x - (defaults.width / 2), // Center the text
      y: center.y - 20, // Approximate text height
      text: defaults.text,
      fontSize: defaults.fontSize,
      fontFamily: defaults.fontFamily,
      fill: defaults.fill,
      width: defaults.width,
      height: defaults.height,
      align: defaults.align,
      verticalAlign: defaults.verticalAlign,
      padding: defaults.padding,
      editable: defaults.editable
    });
  }, [addShape, getViewportCenter]);

  // Create a text input
  const handleAddTextInput = useCallback(() => {
    const center = getViewportCenter();
    const defaults = DEFAULT_SHAPE_PROPS[SHAPE_TYPES.TEXT_INPUT];
    
    addShape({
      type: SHAPE_TYPES.TEXT_INPUT,
      x: center.x - (defaults.width / 2), // Center the input
      y: center.y - (defaults.height / 2),
      text: defaults.text,
      fontSize: defaults.fontSize,
      fontFamily: defaults.fontFamily,
      fill: defaults.fill,
      width: defaults.width,
      height: defaults.height,
      align: defaults.align,
      verticalAlign: defaults.verticalAlign,
      padding: defaults.padding,
      editable: defaults.editable,
      background: defaults.background,
      borderColor: defaults.borderColor,
      borderWidth: defaults.borderWidth,
      cornerRadius: defaults.cornerRadius
    });
  }, [addShape, getViewportCenter]);

  // Delete all shapes (with confirmation)
  const handleDeleteAll = useCallback(async () => {
    if (shapes.length === 0) {
      return; // No shapes to delete
    }

    // Confirmation dialog for destructive action
    const confirmed = window.confirm(
      `Are you sure you want to delete all ${shapes.length} shape${shapes.length > 1 ? 's' : ''}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAllShapes();
      console.log('🗑️ All shapes deleted by user action');
    } catch (error) {
      console.error('❌ Error deleting all shapes:', error);
      alert('Failed to delete shapes. Please try again.');
    }
  }, [shapes.length, deleteAllShapes]);

  const tools = [
    {
      name: 'Rectangle',
      action: handleAddRectangle,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        </svg>
      )
    },
    {
      name: 'Circle',
      action: handleAddCircle,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      )
    },
    {
      name: 'Triangle',
      action: handleAddTriangle,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12,2 22,20 2,20"/>
        </svg>
      )
    },
    {
      name: isDrawingMode ? 'Exit Drawing Mode' : 'Draw Lines',
      action: handleToggleDrawing,
      active: isDrawingMode,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <line x1="3" y1="12" x2="21" y2="12"/>
        </svg>
      )
    },
    {
      name: 'Bezier Curve',
      action: handleAddBezierCurve,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12C3 12 6 2 12 12C18 22 21 12 21 12"/>
        </svg>
      )
    },
    {
      name: 'Text',
      action: handleAddText,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4,7 4,4 20,4 20,7"/>
          <line x1="9" y1="20" x2="15" y2="20"/>
          <line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
      )
    },
    {
      name: 'Text Input',
      action: handleAddTextInput,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="6" width="18" height="12" rx="2" ry="2"/>
          <line x1="7" y1="10" x2="7" y2="14"/>
          <line x1="11" y1="10" x2="11" y2="14"/>
          <line x1="15" y1="10" x2="17" y2="10"/>
        </svg>
      )
    }
  ];

  // Control actions (destructive actions separated)
  const controlActions = [
    {
      name: 'Delete All Shapes',
      action: handleDeleteAll,
      disabled: shapes.length === 0,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3,6 5,6 21,6"/>
          <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
      )
    }
  ];

  return (
    <div className="w-14 sm:w-16 lg:w-20 bg-gray-50 border-r border-gray-300 flex flex-col items-center py-4 sm:py-6 space-y-3 sm:space-y-4">
      {/* Shape creation tools */}
      {tools.map((tool) => (
        <button
          key={tool.name}
          onClick={tool.action}
          className={`w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 border rounded-lg flex items-center justify-center transition-colors shadow-sm hover:shadow-md ${
            tool.active 
              ? 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200 hover:border-blue-400' 
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
          }`}
          title={tool.name}
        >
          <div className="w-4 h-4 sm:w-5 sm:h-5">
            {tool.icon}
          </div>
        </button>
      ))}

      {/* Separator line */}
      {controlActions.some(action => !action.disabled) && (
        <div className="w-8 border-t border-gray-300 my-2"></div>
      )}

      {/* Control actions (destructive) */}
      {controlActions.map((action) => (
        <button
          key={action.name}
          onClick={action.action}
          disabled={action.disabled}
          className={`w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 border rounded-lg flex items-center justify-center transition-colors shadow-sm ${
            action.disabled 
              ? 'bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 hover:shadow-md'
          }`}
          title={action.disabled ? `${action.name} (No shapes to delete)` : action.name}
        >
          <div className="w-4 h-4 sm:w-5 sm:h-5">
            {action.icon}
          </div>
        </button>
      ))}

      {/* Canvas Settings Section */}
      <div className="mt-4 pt-4 border-t border-gray-300">
        <div className="text-xs font-medium text-gray-700 mb-3 text-center">Canvas</div>
        
        {/* Grid Toggle */}
        <div className="mb-3">
          <label className="flex items-center space-x-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Grid</span>
          </label>
        </div>
        
        {/* Snap to Grid Toggle */}
        <div className="mb-2">
          <label className="flex items-center space-x-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-gray-700">Snap</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default Toolbar
