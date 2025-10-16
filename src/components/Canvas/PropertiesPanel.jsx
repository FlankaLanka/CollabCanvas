import { useCallback, useState, useEffect, useRef } from 'react';
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
const VectorInput = ({ label, x, y, onXChange, onYChange, unit = "", precision = 2, xLabel = "X", yLabel = "Y" }) => {
  const [localX, setLocalX] = useState(x);
  const [localY, setLocalY] = useState(y);
  const [isFocusedX, setIsFocusedX] = useState(false);
  const [isFocusedY, setIsFocusedY] = useState(false);

  // Update local state when props change, but only if not currently focused
  useEffect(() => {
    if (!isFocusedX) setLocalX(x);
  }, [x, isFocusedX]);

  useEffect(() => {
    if (!isFocusedY) setLocalY(y);
  }, [y, isFocusedY]);

  const handleXBlur = (e) => {
    setIsFocusedX(false);
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      onXChange(value);
    } else {
      setLocalX(x); // Reset to original value if invalid
    }
  };

  const handleYBlur = (e) => {
    setIsFocusedY(false);
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      onYChange(value);
    } else {
      setLocalY(y); // Reset to original value if invalid
    }
  };

  return (
    <div className="mb-2">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <div className="grid grid-cols-2 gap-1">
        <div>
          <input
            type="number"
            value={isFocusedX ? localX : parseFloat(x).toFixed(precision)}
            onChange={(e) => setLocalX(e.target.value)}
            onFocus={() => setIsFocusedX(true)}
            onBlur={handleXBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.target.blur();
              }
            }}
            className="w-full px-2 py-1 text-xs text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            step={0.01}
            placeholder={xLabel}
          />
        </div>
        <div>
          <input
            type="number"
            value={isFocusedY ? localY : parseFloat(y).toFixed(precision)}
            onChange={(e) => setLocalY(e.target.value)}
            onFocus={() => setIsFocusedY(true)}
            onBlur={handleYBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.target.blur();
              }
            }}
            className="w-full px-2 py-1 text-xs text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            step={0.01}
            placeholder={yLabel}
          />
        </div>
      </div>
    </div>
  );
};

const PositionInput = ({ label, x, y, z, onXChange, onYChange, onZChange, precision = 2 }) => {
  const [localX, setLocalX] = useState(x);
  const [localY, setLocalY] = useState(y);
  const [localZ, setLocalZ] = useState(z);
  const [isFocusedX, setIsFocusedX] = useState(false);
  const [isFocusedY, setIsFocusedY] = useState(false);
  const [isFocusedZ, setIsFocusedZ] = useState(false);

  // Update local state when props change, but only if not currently focused
  useEffect(() => {
    if (!isFocusedX) setLocalX(x);
  }, [x, isFocusedX]);

  useEffect(() => {
    if (!isFocusedY) setLocalY(y);
  }, [y, isFocusedY]);

  useEffect(() => {
    if (!isFocusedZ) setLocalZ(z);
  }, [z, isFocusedZ]);

  const handleXBlur = (e) => {
    setIsFocusedX(false);
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      onXChange(value);
    } else {
      setLocalX(x); // Reset to original value if invalid
    }
  };

  const handleYBlur = (e) => {
    setIsFocusedY(false);
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      onYChange(value);
    } else {
      setLocalY(y); // Reset to original value if invalid
    }
  };

  const handleZBlur = (e) => {
    setIsFocusedZ(false);
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      onZChange(value);
    } else {
      setLocalZ(z); // Reset to original value if invalid
    }
  };

  return (
    <div className="mb-2">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <div className="grid grid-cols-3 gap-1">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">X</label>
          <input
            type="number"
            value={isFocusedX ? localX : parseFloat(x).toFixed(precision)}
            onChange={(e) => setLocalX(e.target.value)}
            onFocus={() => setIsFocusedX(true)}
            onBlur={handleXBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.target.blur();
              }
            }}
            className="w-full px-2 py-1 text-xs text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            step={0.01}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Y</label>
          <input
            type="number"
            value={isFocusedY ? localY : parseFloat(y).toFixed(precision)}
            onChange={(e) => setLocalY(e.target.value)}
            onFocus={() => setIsFocusedY(true)}
            onBlur={handleYBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.target.blur();
              }
            }}
            className="w-full px-2 py-1 text-xs text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            step={0.01}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Z</label>
          <input
            type="number"
            value={isFocusedZ ? localZ : z}
            onChange={(e) => setLocalZ(e.target.value)}
            onFocus={() => setIsFocusedZ(true)}
            onBlur={handleZBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.target.blur();
              }
            }}
            className="w-full px-2 py-1 text-xs text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            step={1}
          />
        </div>
      </div>
    </div>
  );
};

const ScalarInput = ({ label, value, onChange, unit = "", min, max, step = 0.1, precision = 1 }) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // Update local state when props change, but only if not currently focused
  useEffect(() => {
    if (!isFocused) setLocalValue(value);
  }, [value, isFocused]);

  const handleBlur = (e) => {
    setIsFocused(false);
    const numValue = parseFloat(e.target.value);
    if (!isNaN(numValue)) {
      // Apply min/max constraints if provided
      let constrainedValue = numValue;
      if (min !== undefined && numValue < min) constrainedValue = min;
      if (max !== undefined && numValue > max) constrainedValue = max;
      onChange(constrainedValue);
    } else {
      setLocalValue(value); // Reset to original value if invalid
    }
  };

  return (
    <div className="mb-2">
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <div>
        <input
          type="number"
          value={isFocused ? localValue : parseFloat(value).toFixed(precision)}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.target.blur();
            }
          }}
          className="w-full px-2 py-1 text-xs text-gray-900 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          min={min}
          max={max}
          step={step}
        />
      </div>
    </div>
  );
};

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
    const numValue = parseInt(value);
    // Validate input to prevent invalid colors
    if (isNaN(numValue) || numValue < 0 || numValue > 255) return;
    
    const newRgb = { ...rgb, [component]: numValue };
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    
    // Update local color state immediately for smooth UI
    setLocalColor(newHex);
    
    // Call onChange immediately - the parent will handle debouncing
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
            step="1"
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
            step="1"
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
            step="1"
          />
        </div>
      </div>
    </div>
  );
};

const TextInput = ({ label, value, onChange, isTextArea = false, placeholder = "", rows = 3 }) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // Update local state when props change, but only if not currently focused
  useEffect(() => {
    if (!isFocused) setLocalValue(value);
  }, [value, isFocused]);

  const handleBlur = (e) => {
    setIsFocused(false);
    const textValue = e.target.value;
    onChange(textValue);
  };

  const InputComponent = isTextArea ? 'textarea' : 'input';
  const extraProps = isTextArea ? { rows } : { type: 'text' };

  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-400 mb-2">{label}</label>
      <InputComponent
        {...extraProps}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !isTextArea) {
            e.target.blur();
          }
        }}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 ${isTextArea ? 'resize-none' : ''}`}
      />
    </div>
  );
};

function PropertiesPanel() {
  const { 
    getSelectedShape, 
    getSelectedShapes, 
    updateShape, 
    selectedId, 
    selectedIds,
    setShapeZIndex,
    addBezierPoint,
    shapes,
    store
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

      // Get actual dimensions for scale display
      let scaleWidth = 0;
      let scaleHeight = 0;
      
      switch (selectedShape.type) {
        case SHAPE_TYPES.RECTANGLE:
          scaleWidth = selectedShape.width || 100;
          scaleHeight = selectedShape.height || 100;
          break;
        case SHAPE_TYPES.CIRCLE:
          scaleWidth = (selectedShape.radiusX || 50) * 2; // Diameter for width
          scaleHeight = (selectedShape.radiusY || 50) * 2; // Diameter for height
          break;
        case SHAPE_TYPES.TRIANGLE:
          // Calculate triangle dimensions from original points and current scale
          const originalPoints = DEFAULT_SHAPE_PROPS[SHAPE_TYPES.TRIANGLE].points;
          const originalWidth = Math.abs(originalPoints[4] - originalPoints[2]); // 35 - (-35) = 70
          const originalHeight = Math.abs(originalPoints[1] - originalPoints[3]); // -40 - 30 = 70
          const currentScaleX = selectedShape.scaleX || 1;
          const currentScaleY = selectedShape.scaleY || 1;
          scaleWidth = Math.round(originalWidth * currentScaleX);
          scaleHeight = Math.round(originalHeight * currentScaleY);
          break;
        case SHAPE_TYPES.TEXT:
        case SHAPE_TYPES.TEXT_INPUT:
          // Calculate text dimensions from base size and current scale
          const textDefaults = DEFAULT_SHAPE_PROPS[selectedShape.type];
          const textBaseWidth = textDefaults.width || 200;
          // For TEXT: use fontSize * 1.5 as base height, for TEXT_INPUT: use fixed height
          const textBaseHeight = selectedShape.type === SHAPE_TYPES.TEXT_INPUT ? 
            (textDefaults.height || 40) : 
            ((selectedShape.fontSize || textDefaults.fontSize || 20) * 1.5);
          const textScaleX = selectedShape.scaleX || 1;
          const textScaleY = selectedShape.scaleY || 1;
          scaleWidth = Math.round(textBaseWidth * textScaleX);
          scaleHeight = Math.round(textBaseHeight * textScaleY);
          break;
        case SHAPE_TYPES.LINE:
          // Calculate line dimensions from points bounding box and current scale
          if (selectedShape.points && selectedShape.points.length >= 4) {
            const points = selectedShape.points;
            let minX = points[0], maxX = points[0], minY = points[1], maxY = points[1];
            for (let i = 0; i < points.length; i += 2) {
              minX = Math.min(minX, points[i]);
              maxX = Math.max(maxX, points[i]);
              minY = Math.min(minY, points[i + 1]);
              maxY = Math.max(maxY, points[i + 1]);
            }
            const lineBaseWidth = Math.abs(maxX - minX) || 100;
            const lineBaseHeight = Math.abs(maxY - minY) || 100;
            const lineScaleX = selectedShape.scaleX || 1;
            const lineScaleY = selectedShape.scaleY || 1;
            scaleWidth = Math.round(lineBaseWidth * lineScaleX);
            scaleHeight = Math.round(lineBaseHeight * lineScaleY);
          } else {
            scaleWidth = 100;
            scaleHeight = 100;
          }
          break;
        case SHAPE_TYPES.BEZIER_CURVE:
          // Bezier curves don't have meaningful width/height - they're defined by anchor points
          scaleWidth = 0;
          scaleHeight = 0;
          break;
        default:
          scaleWidth = selectedShape.width || 100;
          scaleHeight = selectedShape.height || 100;
      }

      setLocalProperties({
        // Transform properties (direct pixel coordinates)
        positionX: selectedShape.x || 0,
        positionY: selectedShape.y || 0,
        zIndex: selectedShape.zIndex || 0,
        scaleX: scaleWidth,  // Now represents actual width in pixels
        scaleY: scaleHeight, // Now represents actual height in pixels
        rotation: selectedShape.rotation || 0,
        
        // Appearance (handle both fill and stroke based on shape type)
        fill: getShapeColorProperty(selectedShape),
        
        // Size properties (in pixels)
        width: selectedShape.width || 100,
        height: selectedShape.height || 100,
        radiusX: selectedShape.radiusX || selectedShape.radius || 50,
        radiusY: selectedShape.radiusY || selectedShape.radius || 50,
        
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

  // Cleanup color sync timeout when component unmounts or shape changes
  useEffect(() => {
    return () => {
      if (colorSyncTimeoutRef.current) {
        clearTimeout(colorSyncTimeoutRef.current);
      }
    };
  }, [selectedShape?.id]);

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

  // Handle text content change (now called onBlur from TextInput)
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

  // Handle position changes (direct pixel coordinates)
  const handlePositionXChange = useCallback((pixelValue) => {
    setLocalProperties(prev => ({ ...prev, positionX: pixelValue }));
    updateShapeProperty('x', pixelValue);
  }, [updateShapeProperty]);

  const handlePositionYChange = useCallback((pixelValue) => {
    setLocalProperties(prev => ({ ...prev, positionY: pixelValue }));
    updateShapeProperty('y', pixelValue);
  }, [updateShapeProperty]);

  const handlePositionZChange = useCallback((zValue) => {
    setLocalProperties(prev => ({ ...prev, zIndex: zValue }));
    setShapeZIndex(selectedShape?.id, zValue);
  }, [setShapeZIndex, selectedShape]);

  // Handle scale changes (now width/height dimensions)
  const handleScaleXChange = useCallback((widthValue) => {
    setLocalProperties(prev => ({ ...prev, scaleX: widthValue }));
    
    // Update the appropriate property based on shape type
    switch (selectedShape?.type) {
      case SHAPE_TYPES.RECTANGLE:
        updateShapeProperty('width', widthValue);
        break;
      case SHAPE_TYPES.TEXT:
      case SHAPE_TYPES.TEXT_INPUT:
        // Convert width to scale factor for text shapes
        const textWidthDefaults = DEFAULT_SHAPE_PROPS[selectedShape.type];
        const textBaseWidth = textWidthDefaults.width || 200;
        const textNewScaleX = widthValue / textBaseWidth;
        updateShapeProperty('scaleX', textNewScaleX);
        break;
      case SHAPE_TYPES.LINE:
        // Convert width to scale factor for lines based on bounding box
        if (selectedShape.points && selectedShape.points.length >= 4) {
          const points = selectedShape.points;
          let minX = points[0], maxX = points[0];
          for (let i = 0; i < points.length; i += 2) {
            minX = Math.min(minX, points[i]);
            maxX = Math.max(maxX, points[i]);
          }
          const lineBaseWidth = Math.abs(maxX - minX) || 100;
          const lineNewScaleX = widthValue / lineBaseWidth;
          updateShapeProperty('scaleX', lineNewScaleX);
        }
        break;
      case SHAPE_TYPES.CIRCLE:
        updateShapeProperty('radiusX', widthValue / 2); // Convert diameter to radius
        break;
      case SHAPE_TYPES.TRIANGLE:
        // Convert width to scale factor for triangles
        const originalPoints = DEFAULT_SHAPE_PROPS[SHAPE_TYPES.TRIANGLE].points;
        const originalWidth = Math.abs(originalPoints[4] - originalPoints[2]); // 70px
        const newScaleX = widthValue / originalWidth;
        updateShapeProperty('scaleX', newScaleX);
        break;
      case SHAPE_TYPES.BEZIER_CURVE:
        // Bezier curves don't have meaningful width/height - they're defined by anchor points
        console.warn('Scale change attempted on Bezier curve - ignoring');
        break;
      default:
        updateShapeProperty('width', widthValue);
    }
  }, [updateShapeProperty, selectedShape]);

  const handleScaleYChange = useCallback((heightValue) => {
    setLocalProperties(prev => ({ ...prev, scaleY: heightValue }));
    
    // Update the appropriate property based on shape type
    switch (selectedShape?.type) {
      case SHAPE_TYPES.RECTANGLE:
        updateShapeProperty('height', heightValue);
        break;
      case SHAPE_TYPES.TEXT:
      case SHAPE_TYPES.TEXT_INPUT:
        // Convert height to scale factor for text shapes
        const textHeightDefaults = DEFAULT_SHAPE_PROPS[selectedShape.type];
        // For TEXT: use fontSize * 1.5 as base height, for TEXT_INPUT: use fixed height
        const textBaseHeight = selectedShape.type === SHAPE_TYPES.TEXT_INPUT ? 
          (textHeightDefaults.height || 40) : 
          ((selectedShape.fontSize || textHeightDefaults.fontSize || 20) * 1.5);
        const textNewScaleY = heightValue / textBaseHeight;
        updateShapeProperty('scaleY', textNewScaleY);
        break;
      case SHAPE_TYPES.LINE:
        // Convert height to scale factor for lines based on bounding box
        if (selectedShape.points && selectedShape.points.length >= 4) {
          const points = selectedShape.points;
          let minY = points[1], maxY = points[1];
          for (let i = 1; i < points.length; i += 2) {
            minY = Math.min(minY, points[i]);
            maxY = Math.max(maxY, points[i]);
          }
          const lineBaseHeight = Math.abs(maxY - minY) || 100;
          const lineNewScaleY = heightValue / lineBaseHeight;
          updateShapeProperty('scaleY', lineNewScaleY);
        }
        break;
      case SHAPE_TYPES.CIRCLE:
        updateShapeProperty('radiusY', heightValue / 2); // Convert diameter to radius
        break;
      case SHAPE_TYPES.TRIANGLE:
        // Convert height to scale factor for triangles
        const originalPoints = DEFAULT_SHAPE_PROPS[SHAPE_TYPES.TRIANGLE].points;
        const originalHeight = Math.abs(originalPoints[1] - originalPoints[3]); // 70px
        const newScaleY = heightValue / originalHeight;
        updateShapeProperty('scaleY', newScaleY);
        break;
      case SHAPE_TYPES.BEZIER_CURVE:
        // Bezier curves don't have meaningful width/height - they're defined by anchor points
        console.warn('Scale change attempted on Bezier curve - ignoring');
        break;
      default:
        updateShapeProperty('height', heightValue);
    }
  }, [updateShapeProperty, selectedShape]);


  // Get the appropriate color property for the selected shape
  const getShapeColorProperty = useCallback((shape) => {
    if (!shape) return '#3B82F6';
    
    // Bezier curves and lines use stroke, other shapes use fill
    if (shape.type === SHAPE_TYPES.BEZIER_CURVE || shape.type === SHAPE_TYPES.LINE) {
      return shape.stroke || '#8B5CF6';
    }
    
    return shape.fill || '#3B82F6';
  }, []);

  // Debounced color sync to database
  const colorSyncTimeoutRef = useRef(null);
  
  // Handle color changes with immediate local update and debounced database sync
  const handleColorChange = useCallback((color) => {
    if (!selectedShape || !store) return;
    
    // Update local properties immediately for smooth UI
    setLocalProperties(prev => ({ ...prev, fill: color }));
    
    // Determine the appropriate property based on shape type
    const colorProperty = (selectedShape.type === SHAPE_TYPES.BEZIER_CURVE || selectedShape.type === SHAPE_TYPES.LINE) ? 'stroke' : 'fill';
    
    // IMMEDIATE: Update the local shape object for instant visual feedback
    const localShape = store.shapes.get(selectedShape.id);
    if (localShape) {
      localShape[colorProperty] = color;
      // Trigger re-render by updating a dummy timestamp (forces React to re-render)
      localShape._lastColorUpdate = Date.now();
    }
    
    // Clear existing timeout
    if (colorSyncTimeoutRef.current) {
      clearTimeout(colorSyncTimeoutRef.current);
    }
    
    // DEBOUNCED: Sync to database after user stops moving slider for 150ms
    colorSyncTimeoutRef.current = setTimeout(() => {
      console.log('🎨 Color syncing to database:', {
        shapeType: selectedShape.type,
        shapeId: selectedShape.id,
        colorProperty,
        newColor: color
      });
      
      updateShapeProperty(colorProperty, color);
    }, 150);
    
  }, [updateShapeProperty, selectedShape, store]);

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
          {selectedShape?.id.split('-').slice(-1)[0] || ''}
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
        
        <PositionInput
          label="Position"
          x={localProperties.positionX || 0}
          y={localProperties.positionY || 0}
          z={localProperties.zIndex || 0}
          onXChange={handlePositionXChange}
          onYChange={handlePositionYChange}
          onZChange={handlePositionZChange}
          precision={0}
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

        {/* Size controls (not applicable for Bezier curves which are defined by anchor points) */}
        {selectedShape?.type !== SHAPE_TYPES.BEZIER_CURVE && (
          <VectorInput
            label="Size"
            x={localProperties.scaleX || 100}
            y={localProperties.scaleY || 100}
            onXChange={handleScaleXChange}
            onYChange={handleScaleYChange}
            precision={0}
            xLabel="W"
            yLabel="H"
          />
        )}
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

          <TextInput
            label="Content"
            value={localProperties.text || ''}
            onChange={handleTextChange}
            isTextArea={selectedShape?.type === SHAPE_TYPES.TEXT}
            placeholder={selectedShape?.type === SHAPE_TYPES.TEXT ? "Enter text content..." : "Enter input field text..."}
            rows={3}
          />

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

      {/* Bezier Curve Properties */}
      {selectedShape?.type === SHAPE_TYPES.BEZIER_CURVE && (
        <div className="mb-5">
          <div className="flex items-center mb-3">
            <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12C3 12 6 2 12 12C18 22 21 12 21 12" />
            </svg>
            <h4 className="text-sm font-medium text-gray-200">Bezier Curve</h4>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Anchor Points: {selectedShape?.anchorPoints?.length || 3}
              </span>
              <button
                onClick={() => {
                  console.log('🔵 Add Point button clicked for shape:', selectedShape?.id, 'type:', selectedShape?.type);
                  addBezierPoint(selectedShape.id);
                }}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                title="Add anchor point to curve"
              >
                + Add Point
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Edit Points</span>
              <button
                onClick={() => updateShapeProperty('showAnchorPoints', !selectedShape?.showAnchorPoints)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  selectedShape?.showAnchorPoints 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Toggle anchor point visibility"
              >
                {selectedShape?.showAnchorPoints ? 'Hide Points' : 'Show Points'}
              </button>
            </div>

            <ScalarInput
              label="Smoothing"
              value={(selectedShape?.smoothing ?? 0.3) * 100}
              onChange={(value) => updateShapeProperty('smoothing', value / 100)}
              unit="%"
              min={0}
              max={100}
              step={5}
              precision={0}
            />

            <ScalarInput
              label="Stroke Width"
              value={selectedShape?.strokeWidth || 3}
              onChange={(value) => updateShapeProperty('strokeWidth', value)}
              unit="px"
              min={1}
              max={20}
              step={1}
              precision={0}
            />
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
            <span className="text-gray-400">{selectedShape?.id.split('-').slice(-1)[0] || 'N/A'}</span>
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
