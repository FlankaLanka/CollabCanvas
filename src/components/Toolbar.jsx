import { useCallback } from 'react';
import { useCanvas } from '../contexts/CanvasContext';
import { SHAPE_TYPES, DEFAULT_SHAPE_PROPS } from '../utils/constants';

function Toolbar() {
  const { addShape, stageRef, stageScale, stagePosition } = useCanvas();

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

    // Convert screen coordinates to canvas coordinates
    const canvasX = (containerCenterX - stagePosition.x) / stageScale;
    const canvasY = (containerCenterY - stagePosition.y) / stageScale;

    // Add small random offset to avoid overlapping shapes
    const offset = 20;
    const randomX = (Math.random() - 0.5) * offset;
    const randomY = (Math.random() - 0.5) * offset;

    return {
      x: canvasX + randomX,
      y: canvasY + randomY
    };
  }, [stageRef, stageScale, stagePosition]);

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
      x: center.x - defaults.radius, // Center the shape (x,y is top-left for circles in Konva)
      y: center.y - defaults.radius,
      radius: defaults.radius,
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
    }
  ];

  return (
    <div className="w-20 bg-gray-50 border-r border-gray-300 flex flex-col items-center py-6 space-y-4">
      {tools.map((tool) => (
        <button
          key={tool.name}
          onClick={tool.action}
          className="w-12 h-12 bg-white border border-gray-300 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors shadow-sm hover:shadow-md"
          title={tool.name}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}

export default Toolbar
