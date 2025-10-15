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

// Conversion constants for metric system
const PIXELS_PER_CM = 37.795275591; // Standard screen DPI conversion (96 DPI)
const pixelsToCm = (pixels) => (pixels / PIXELS_PER_CM).toFixed(2);
const cmToPixels = (cm) => cm * PIXELS_PER_CM;

// Helper Components
const VectorInput = ({ label, x, y, onXChange, onYChange, unit = "", precision = 2 }) => (
  <div className="mb-2">
    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
    <div className="grid grid-cols-2 gap-1">
      <div>
        <input
          type="number"
          value={parseFloat(x).toFixed(precision)}
          onChange={(e) => onXChange(parseFloat(e.target.value) || 0)}
          className="w-full px-2 py-1 text-xs text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          step={0.01}
        />
      </div>
      <div>
        <input
          type="number"
          value={parseFloat(y).toFixed(precision)}
          onChange={(e) => onYChange(parseFloat(e.target.value) || 0)}
          className="w-full px-2 py-1 text-xs text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          step={0.01}
        />
      </div>
    </div>
  </div>
);

const ScalarInput = ({ label, value, onChange, unit = "", min, max, step = 0.1, precision = 1 }) => (
  <div className="mb-2">
    <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
    <div>
      <input
        type="number"
        value={parseFloat(value).toFixed(precision)}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-2 py-1 text-xs text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500"
        min={min}
        max={max}
        step={step}
      />
    </div>
  </div>
);

const ColorPicker = ({ color, onChange }) => {
  const [localColor, setLocalColor] = useState(color);

  useEffect(() => {
    setLocalColor(color);
  }, [color]);

  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  // Convert RGB to hex
  const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const rgb = hexToRgb(localColor);

  const handleRgbChange = (component, value) => {
    const newRgb = { ...rgb, [component]: parseInt(value) };
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setLocalColor(newHex);
    onChange(newHex);
  };

  return (
    <div className="mb-2">
      <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
      
      {/* Color preview */}
      <div className="flex items-center space-x-2 mb-2 p-2 bg-white border border-gray-300 rounded">
        <div 
          className="w-5 h-5 rounded border border-gray-300 shadow-sm"
          style={{ backgroundColor: localColor }}
        />
        <span className="text-xs font-mono text-gray-900">{localColor}</span>
      </div>

      {/* RGB Sliders */}
      <div className="space-y-2">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-red-600 font-medium">R</label>
            <span className="text-xs text-gray-600">{rgb.r}</span>
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={rgb.r}
            onChange={(e) => handleRgbChange('r', e.target.value)}
            className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-green-600 font-medium">G</label>
            <span className="text-xs text-gray-600">{rgb.g}</span>
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={rgb.g}
            onChange={(e) => handleRgbChange('g', e.target.value)}
            className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-blue-600 font-medium">B</label>
            <span className="text-xs text-gray-600">{rgb.b}</span>
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={rgb.b}
            onChange={(e) => handleRgbChange('b', e.target.value)}
            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

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
        // Transform properties (in metric units)
        positionX: pixelsToCm(selectedShape.x || 0),
        positionY: pixelsToCm(selectedShape.y || 0),
        scaleX: selectedShape.scaleX || 1,
        scaleY: selectedShape.scaleY || 1,
        rotation: selectedShape.rotation || 0,
        
        // Appearance
        fill: selectedShape.fill || '#3B82F6',
        
        // Size properties (converted to cm)
        width: pixelsToCm(selectedShape.width || 100),
        height: pixelsToCm(selectedShape.height || 100),
        radiusX: pixelsToCm(selectedShape.radiusX || selectedShape.radius || 50),
        radiusY: pixelsToCm(selectedShape.radiusY || selectedShape.radius || 50),
        
        // Triangle properties
        triangleScale: triangleScale,
        
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


  // Handle triangle scaling
  const handleTriangleScale = useCallback((scale) => {
    if (!selectedShape || selectedShape.type !== SHAPE_TYPES.TRIANGLE) return;
    
    const originalPoints = DEFAULT_SHAPE_PROPS[SHAPE_TYPES.TRIANGLE].points; // Base triangle from constants
    const scaledPoints = originalPoints.map(point => point * scale);
    
    setLocalProperties(prev => ({ ...prev, triangleScale: scale }));
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

    console.log('🔄 Rotation change:', {
      input: rotation,
      parsed: numValue,
      normalized: normalizedRotation,
      selectedShape: selectedShape?.rotation
    });

    setLocalProperties(prev => ({ ...prev, rotation: normalizedRotation }));
    updateShapeProperty('rotation', normalizedRotation);
  }, [updateShapeProperty, selectedShape]);

  // Handle position changes (convert cm to pixels)
  const handlePositionXChange = useCallback((cmValue) => {
    const pixelValue = cmToPixels(cmValue);
    setLocalProperties(prev => ({ ...prev, positionX: cmValue }));
    updateShapeProperty('x', pixelValue);
  }, [updateShapeProperty]);

  const handlePositionYChange = useCallback((cmValue) => {
    const pixelValue = cmToPixels(cmValue);
    setLocalProperties(prev => ({ ...prev, positionY: cmValue }));
    updateShapeProperty('y', pixelValue);
  }, [updateShapeProperty]);

  // Handle scale changes
  const handleScaleXChange = useCallback((scaleValue) => {
    setLocalProperties(prev => ({ ...prev, scaleX: scaleValue }));
    updateShapeProperty('scaleX', scaleValue);
  }, [updateShapeProperty]);

  const handleScaleYChange = useCallback((scaleValue) => {
    setLocalProperties(prev => ({ ...prev, scaleY: scaleValue }));
    updateShapeProperty('scaleY', scaleValue);
  }, [updateShapeProperty]);


  // Handle color changes
  const handleColorChange = useCallback((color) => {
    setLocalProperties(prev => ({ ...prev, fill: color }));
    updateShapeProperty('fill', color);
  }, [updateShapeProperty]);

  if (selectedIds.length === 0 || !selectedShape) {
    return (
      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-64 max-w-[calc(100vw-280px)] lg:max-w-none">
        <div className="text-center text-gray-500">
          <svg className="w-6 h-6 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <p className="text-sm font-medium text-gray-700">Inspector</p>
          <p className="text-xs text-gray-500 mt-1">Select objects to edit properties</p>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-600 leading-relaxed">
              <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl</kbd>+click to toggle<br/>
              <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Shift</kbd>+click to add<br/>
              <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl</kbd>+<kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">A</kbd> to select all
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-64 max-w-[calc(100vw-280px)] lg:max-w-none max-h-[60vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Inspector
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">
            {isMultiSelect ? (
              `${selectedIds.length} objects selected`
            ) : (
              `${selectedShape?.type || 'object'}`
            )}
          </p>
        </div>
        <div className="text-xs text-gray-500 font-mono">
          {selectedShape?.id.split('-')[1] || ''}
        </div>
      </div>

      {/* Transform Section */}
      <div className="mb-3">
        <div className="flex items-center mb-2">
          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l16 16m0 0V8m0 8H8" />
          </svg>
          <h4 className="text-sm font-medium text-gray-800">Transform</h4>
        </div>
        
        <VectorInput
          label="Position"
          x={localProperties.positionX || 0}
          y={localProperties.positionY || 0}
          onXChange={handlePositionXChange}
          onYChange={handlePositionYChange}
          precision={2}
        />

        <ScalarInput
          label="Rotation"
          value={localProperties.rotation || 0}
          onChange={handleRotationChange}
          min={0}
          max={360}
          step={1}
          precision={0}
        />

        <VectorInput
          label="Scale"
          x={localProperties.scaleX || 1}
          y={localProperties.scaleY || 1}
          onXChange={handleScaleXChange}
          onYChange={handleScaleYChange}
          precision={3}
        />
      </div>


      {/* Text Properties */}
      {(selectedShape?.type === SHAPE_TYPES.TEXT || selectedShape?.type === SHAPE_TYPES.TEXT_INPUT) && (
        <div className="mb-5">
          <div className="flex items-center mb-3">
            <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h4 className="text-sm font-medium text-gray-200">Text</h4>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-400 mb-2">Content</label>
            {selectedShape?.type === SHAPE_TYPES.TEXT ? (
              <textarea
                value={localProperties.text || ''}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Enter text content..."
                className="w-full px-3 py-2 text-xs bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500 focus:bg-gray-750 text-gray-100 resize-none"
                rows={3}
              />
            ) : (
              <input
                type="text"
                value={localProperties.text || ''}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Enter input field text..."
                className="w-full px-3 py-2 text-xs bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500 focus:bg-gray-750 text-gray-100"
              />
            )}
          </div>

          <ScalarInput
            label="Font Size"
            value={localProperties.fontSize || 20}
            onChange={handleFontSizeChange}
            unit="px"
            min={8}
            max={72}
            step={1}
            precision={0}
          />

          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-400 mb-2">Font Family</label>
            <select
              value={localProperties.fontFamily || 'Arial, sans-serif'}
              onChange={(e) => handleFontFamilyChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500 text-gray-100"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font} value={font}>
                  {font.split(',')[0]}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-400 mb-2">Alignment</label>
            <div className="flex space-x-1">
              {TEXT_ALIGN_OPTIONS.map((alignment) => (
                <button
                  key={alignment}
                  onClick={() => handleTextAlignChange(alignment)}
                  className={`flex-1 px-2 py-1 text-xs border border-gray-600 rounded capitalize ${
                    (localProperties.align || 'left') === alignment 
                      ? 'bg-blue-600 text-white border-blue-500' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {alignment}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Appearance Section */}
      <div className="mb-5">
        <div className="flex items-center mb-3">
          <svg className="w-4 h-4 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
          </svg>
          <h4 className="text-sm font-medium text-gray-200">Appearance</h4>
        </div>
        
        <ColorPicker
          color={localProperties.fill || '#3B82F6'}
          onChange={handleColorChange}
        />
      </div>

      {/* Debug Info */}
      <div className="pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-500 space-y-1 font-mono">
          <div className="flex justify-between">
            <span>ID:</span>
            <span className="text-gray-400">{selectedShape?.id.split('-')[1] || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="text-gray-400 capitalize">{selectedShape?.type || 'N/A'}</span>
          </div>
          {isUpdating && (
            <div className="text-blue-400 flex items-center mt-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400 mr-2"></div>
              <span>Syncing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PropertiesPanel;
