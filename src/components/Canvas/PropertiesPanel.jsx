import { useCallback, useState, useEffect } from 'react';
import { useCanvas } from '../../contexts/CanvasContext';
import { 
  SHAPE_TYPES, 
  COLOR_PALETTE, 
  SHAPE_SIZE_LIMITS,
  DEFAULT_SHAPE_PROPS
} from '../../utils/constants';

function PropertiesPanel() {
  const { getSelectedShape, updateShape, selectedId } = useCanvas();
  const selectedShape = getSelectedShape();
  
  // Local state for inputs (to prevent constant re-renders while typing)
  const [localProperties, setLocalProperties] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Calculate triangle scale from current points
  const calculateTriangleScale = useCallback((points) => {
    if (!points || points.length < 6) return 1;
    const originalPoints = DEFAULT_SHAPE_PROPS[SHAPE_TYPES.TRIANGLE].points; // Base triangle from constants
    // Calculate scale based on width (distance between left and right points)
    const currentWidth = Math.abs(points[4] - points[2]); // x4 - x2 (rightmost - leftmost x)
    const originalWidth = Math.abs(originalPoints[4] - originalPoints[2]); // 35 - (-35) = 70
    return currentWidth / originalWidth;
  }, []);

  // Update local state when selected shape changes
  useEffect(() => {
    if (selectedShape) {
      let triangleScale = 1;
      if (selectedShape.type === SHAPE_TYPES.TRIANGLE && selectedShape.points) {
        triangleScale = calculateTriangleScale(selectedShape.points);
      }

      setLocalProperties({
        fill: selectedShape.fill || '#3B82F6',
        // Rectangle properties
        width: selectedShape.width || 100,
        height: selectedShape.height || 100,
        // Circle properties
        radius: selectedShape.radius || 50,
        // Triangle properties
        scale: triangleScale
      });
    }
  }, [selectedShape, calculateTriangleScale]);

  // Update shape property with debouncing for size properties
  const updateShapeProperty = useCallback(async (property, value) => {
    if (!selectedShape || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await updateShape(selectedId, { [property]: value });
    } catch (error) {
      console.error('❌ Error updating shape property:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [selectedShape, selectedId, updateShape, isUpdating]);

  // Handle color change
  const handleColorChange = useCallback((colorType, color) => {
    setLocalProperties(prev => ({ ...prev, [colorType]: color }));
    updateShapeProperty(colorType, color);
  }, [updateShapeProperty]);

  // Handle size change with validation
  const handleSizeChange = useCallback((property, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;

    // Apply constraints based on shape type
    let constrainedValue = numValue;
    const limits = SHAPE_SIZE_LIMITS[selectedShape.type];
    
    if (limits) {
      switch (property) {
        case 'width':
          constrainedValue = Math.max(limits.minWidth, Math.min(limits.maxWidth, numValue));
          break;
        case 'height':
          constrainedValue = Math.max(limits.minHeight, Math.min(limits.maxHeight, numValue));
          break;
        case 'radius':
          constrainedValue = Math.max(limits.minRadius, Math.min(limits.maxRadius, numValue));
          break;
      }
    }

    setLocalProperties(prev => ({ ...prev, [property]: constrainedValue }));
    updateShapeProperty(property, constrainedValue);
  }, [selectedShape, updateShapeProperty]);

  // Handle triangle scaling
  const handleTriangleScale = useCallback((scale) => {
    if (!selectedShape || selectedShape.type !== SHAPE_TYPES.TRIANGLE) return;
    
    const originalPoints = DEFAULT_SHAPE_PROPS[SHAPE_TYPES.TRIANGLE].points; // Base triangle from constants
    const scaledPoints = originalPoints.map(point => point * scale);
    
    setLocalProperties(prev => ({ ...prev, scale }));
    updateShapeProperty('points', scaledPoints);
  }, [selectedShape, updateShapeProperty]);

  if (!selectedShape) {
    return (
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-64">
        <div className="text-center text-gray-500">
          <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <p className="text-sm">Select a shape to edit properties</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-64 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 capitalize">
          {selectedShape.type} Properties
        </h3>
        <div className="text-xs text-gray-500">
          {selectedShape.id.split('-')[1]}
        </div>
      </div>

      {/* Color Section */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-2">Color</label>
        
        {/* Fill Color */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Fill Color</span>
            <div 
              className="w-6 h-6 rounded border-2 border-gray-300"
              style={{ backgroundColor: localProperties.fill || '#3B82F6' }}
            />
          </div>
          <div className="grid grid-cols-6 gap-1">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange('fill', color)}
                className={`w-7 h-7 rounded border-2 hover:scale-110 transition-transform ${
                  (localProperties.fill || '#3B82F6') === color ? 'border-blue-500' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Size Section */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-2">Size</label>
        
        {selectedShape.type === SHAPE_TYPES.RECTANGLE && (
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Width: {localProperties.width || 100}px
              </label>
              <input
                type="range"
                min={SHAPE_SIZE_LIMITS.rectangle.minWidth}
                max={SHAPE_SIZE_LIMITS.rectangle.maxWidth}
                value={localProperties.width || 100}
                onChange={(e) => handleSizeChange('width', e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Height: {localProperties.height || 100}px
              </label>
              <input
                type="range"
                min={SHAPE_SIZE_LIMITS.rectangle.minHeight}
                max={SHAPE_SIZE_LIMITS.rectangle.maxHeight}
                value={localProperties.height || 100}
                onChange={(e) => handleSizeChange('height', e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {selectedShape.type === SHAPE_TYPES.CIRCLE && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Radius: {localProperties.radius || 50}px
            </label>
            <input
              type="range"
              min={SHAPE_SIZE_LIMITS.circle.minRadius}
              max={SHAPE_SIZE_LIMITS.circle.maxRadius}
              value={localProperties.radius || 50}
              onChange={(e) => handleSizeChange('radius', e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}

        {selectedShape.type === SHAPE_TYPES.TRIANGLE && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Scale: {(localProperties.scale || 1).toFixed(2)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.01"
              value={localProperties.scale || 1}
              onChange={(e) => handleTriangleScale(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div>Position: ({Math.round(selectedShape.x)}, {Math.round(selectedShape.y)})</div>
          {isUpdating && (
            <div className="text-blue-600 flex items-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
              Syncing...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PropertiesPanel;
