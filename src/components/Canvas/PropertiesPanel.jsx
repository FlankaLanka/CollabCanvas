import { useCallback, useState, useEffect } from 'react';
import { useCanvas } from '../../contexts/ModernCanvasContext';
import { 
  SHAPE_TYPES, 
  COLOR_PALETTE, 
  SHAPE_SIZE_LIMITS,
  DEFAULT_SHAPE_PROPS,
  FONT_FAMILIES,
  TEXT_ALIGN_OPTIONS
} from '../../utils/constants';

function PropertiesPanel() {
  const { 
    getSelectedShape, 
    getSelectedShapes, 
    updateShape, 
    selectedId, 
    selectedIds 
  } = useCanvas();
  
  const selectedShape = getSelectedShape(); // Primary selected shape
  const selectedShapes = getSelectedShapes(); // All selected shapes
  const isMultiSelect = selectedIds.length > 1;
  
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
      if (selectedShape?.type === SHAPE_TYPES.TRIANGLE && selectedShape.points) {
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
        scale: triangleScale,
        // Rotation (all shapes)
        rotation: selectedShape.rotation || 0,
        // Text properties
        fontSize: selectedShape.fontSize || 20,
        fontFamily: selectedShape.fontFamily || 'Arial, sans-serif',
        align: selectedShape.align || 'left',
        text: selectedShape.text || ''
      });
    }
  }, [selectedShape, calculateTriangleScale]);

  // Update shape property with debouncing for size properties
  const updateShapeProperty = useCallback(async (property, value) => {
    if (selectedIds.length === 0 || isUpdating) return;
    
    setIsUpdating(true);
    try {
      if (isMultiSelect) {
        // Update all selected shapes
        const updatePromises = selectedIds.map(id => updateShape(id, { [property]: value }));
        await Promise.all(updatePromises);
        console.log('📝 Multi-select property updated:', property, value, 'for', selectedIds.length, 'shapes');
      } else {
        // Single shape update
        await updateShape(selectedId, { [property]: value });
      }
    } catch (error) {
      console.error('❌ Error updating shape property:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [selectedIds, isMultiSelect, selectedId, updateShape, isUpdating]);

  // Handle color change
  const handleColorChange = useCallback((colorType, color) => {
    setLocalProperties(prev => ({ ...prev, [colorType]: color }));
    updateShapeProperty(colorType, color);
  }, [updateShapeProperty]);

  // Handle size change with validation
  const handleSizeChange = useCallback((property, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0 || !selectedShape) return;

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

  // Handle text font size change
  const handleFontSizeChange = useCallback((fontSize) => {
    const numValue = parseFloat(fontSize);
    if (isNaN(numValue) || numValue <= 0 || !selectedShape) return;

    const limits = SHAPE_SIZE_LIMITS[selectedShape.type];
    let constrainedValue = numValue;
    if (limits) {
      constrainedValue = Math.max(limits.minFontSize, Math.min(limits.maxFontSize, numValue));
    }

    setLocalProperties(prev => ({ ...prev, fontSize: constrainedValue }));
    updateShapeProperty('fontSize', constrainedValue);
  }, [selectedShape, updateShapeProperty]);

  // Handle text font family change
  const handleFontFamilyChange = useCallback((fontFamily) => {
    setLocalProperties(prev => ({ ...prev, fontFamily }));
    updateShapeProperty('fontFamily', fontFamily);
  }, [updateShapeProperty]);

  // Handle text alignment change
  const handleTextAlignChange = useCallback((align) => {
    setLocalProperties(prev => ({ ...prev, align }));
    updateShapeProperty('align', align);
  }, [updateShapeProperty]);

  // Handle text width change (for text elements)
  const handleTextWidthChange = useCallback((width) => {
    const numValue = parseFloat(width);
    if (isNaN(numValue) || numValue <= 0 || !selectedShape) return;

    const limits = SHAPE_SIZE_LIMITS[selectedShape.type];
    let constrainedValue = numValue;
    if (limits) {
      constrainedValue = Math.max(limits.minWidth, Math.min(limits.maxWidth, numValue));
    }

    setLocalProperties(prev => ({ ...prev, width: constrainedValue }));
    updateShapeProperty('width', constrainedValue);
  }, [selectedShape, updateShapeProperty]);

  // Handle text content change
  const handleTextChange = useCallback((newText) => {
    setLocalProperties(prev => ({ ...prev, text: newText }));
    updateShapeProperty('text', newText);
  }, [updateShapeProperty]);

  // Handle rotation change (all shapes)
  const handleRotationChange = useCallback((rotation) => {
    const numValue = parseFloat(rotation);
    if (isNaN(numValue)) return;

    // Normalize rotation to 0-360 degrees
    const normalizedRotation = ((numValue % 360) + 360) % 360;

    setLocalProperties(prev => ({ ...prev, rotation: normalizedRotation }));
    updateShapeProperty('rotation', normalizedRotation);
  }, [updateShapeProperty]);

  if (selectedIds.length === 0 || !selectedShape) {
    return (
      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 sm:p-4 w-56 sm:w-64 max-w-[calc(100vw-280px)] lg:max-w-none">
        <div className="text-center text-gray-500">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <p className="text-xs sm:text-sm">Select shapes to edit properties</p>
          <p className="text-xs text-gray-400 mt-1">Ctrl+click or drag to select multiple</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 sm:p-4 w-56 sm:w-64 max-w-[calc(100vw-280px)] lg:max-w-none max-h-80 sm:max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {isMultiSelect ? (
            `${selectedIds.length} Shapes Selected`
          ) : (
            `${selectedShape?.type || 'Shape'} Properties`
          )}
        </h3>
        <div className="text-xs text-gray-500">
          {isMultiSelect ? (
            `Multi-edit`
          ) : (
            selectedShape?.id.split('-')[1] || ''
          )}
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
        
        {selectedShape?.type === SHAPE_TYPES.RECTANGLE && (
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

        {selectedShape?.type === SHAPE_TYPES.CIRCLE && (
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

        {selectedShape?.type === SHAPE_TYPES.TRIANGLE && (
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

        {(selectedShape?.type === SHAPE_TYPES.TEXT || selectedShape?.type === SHAPE_TYPES.TEXT_INPUT) && (
          <div className="space-y-2">
            {/* Text Content */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Content</label>
              {selectedShape?.type === SHAPE_TYPES.TEXT ? (
                <textarea
                  value={localProperties.text || ''}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Enter text content..."
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                />
              ) : (
                <input
                  type="text"
                  value={localProperties.text || ''}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Enter input field text..."
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              )}
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Font Size: {localProperties.fontSize || 20}px
              </label>
              <input
                type="range"
                min={SHAPE_SIZE_LIMITS[selectedShape?.type]?.minFontSize || 8}
                max={SHAPE_SIZE_LIMITS[selectedShape?.type]?.maxFontSize || 72}
                value={localProperties.fontSize || 20}
                onChange={(e) => handleFontSizeChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Text Width */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Width: {localProperties.width || 200}px
              </label>
              <input
                type="range"
                min={SHAPE_SIZE_LIMITS[selectedShape?.type]?.minWidth || 50}
                max={SHAPE_SIZE_LIMITS[selectedShape?.type]?.maxWidth || 800}
                value={localProperties.width || 200}
                onChange={(e) => handleTextWidthChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Font Family */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Font</label>
              <select
                value={localProperties.fontFamily || 'Arial, sans-serif'}
                onChange={(e) => handleFontFamilyChange(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font.split(',')[0]} {/* Show just the main font name */}
                  </option>
                ))}
              </select>
            </div>

            {/* Text Alignment */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Alignment</label>
              <div className="flex space-x-1">
                {TEXT_ALIGN_OPTIONS.map((alignment) => (
                  <button
                    key={alignment}
                    onClick={() => handleTextAlignChange(alignment)}
                    className={`px-2 py-1 text-xs border border-gray-300 rounded capitalize ${
                      (localProperties.align || 'left') === alignment 
                        ? 'bg-blue-500 text-white border-blue-500' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {alignment}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rotation Section */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-2">Rotation</label>
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Angle: {Math.round(localProperties.rotation || 0)}°
          </label>
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={localProperties.rotation || 0}
            onChange={(e) => handleRotationChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0°</span>
            <span>90°</span>
            <span>180°</span>
            <span>270°</span>
            <span>360°</span>
          </div>
          {/* Quick rotation buttons */}
          <div className="flex space-x-1 mt-2">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <button
                key={angle}
                onClick={() => handleRotationChange(angle)}
                className={`px-2 py-1 text-xs border border-gray-300 rounded ${
                  Math.round(localProperties.rotation || 0) === angle 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {angle}°
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div>Position: ({Math.round(selectedShape?.x || 0)}, {Math.round(selectedShape?.y || 0)})</div>
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
