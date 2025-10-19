import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCanvas } from '../../contexts/ModernCanvasContext';
import { SHAPE_TYPES } from '../../utils/constants';

// ScalarInput component for number inputs with proper validation
const ScalarInput = ({ label, value, onChange, min, max, step = 1, precision = 0, unit = "" }) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) setLocalValue(value);
  }, [value, isFocused]);

  const handleBlur = (e) => {
    setIsFocused(false);
    const numValue = parseFloat(e.target.value);
    if (!isNaN(numValue)) {
      const clampedValue = Math.min(Math.max(numValue, min || -Infinity), max || Infinity);
      setLocalValue(clampedValue);
      onChange(clampedValue);
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
        {unit && <span className="text-xs text-gray-500 ml-1">{unit}</span>}
      </div>
    </div>
  );
};

// ColorPicker component with RGB sliders
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
    if (isNaN(numValue) || numValue < 0 || numValue > 255) return;
    
    const newRgb = { ...rgb, [component]: numValue };
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

/**
 * Inspector Component - Properties panel for selected shapes
 * 
 * Shows detailed properties of the currently selected shape(s)
 * Moved from right sidebar to left sidebar for better UX
 * Includes all functionality from the original PropertiesPanel
 */
function Inspector() {
  const { 
    selectedId, 
    selectedIds, 
    shapes, 
    updateShape, 
    addBezierPoint,
    store 
  } = useCanvas();
  
  // Get the selected shape
  const selectedShape = selectedId ? shapes.find(s => s.id === selectedId) : null;
  const isMultiSelect = selectedIds.length > 1;
  
  // Local state for form inputs (to avoid constant re-renders)
  const [localProperties, setLocalProperties] = useState({});
  
  // Color sync timeout ref for debouncing color changes
  const colorSyncTimeoutRef = useRef(null);
  
  // Update local properties when selection changes
  useEffect(() => {
    if (selectedShape) {
      setLocalProperties({
        positionX: selectedShape.x || 0,
        positionY: selectedShape.y || 0,
        zIndex: selectedShape.zIndex || 0,
        rotation: selectedShape.rotation || 0,
        // Show actual dimensions instead of scale values
        width: selectedShape.width || 100,
        height: selectedShape.height || 100,
        radiusX: selectedShape.radiusX || 50,
        radiusY: selectedShape.radiusY || 50,
        scaleX: selectedShape.scaleX || 1,
        scaleY: selectedShape.scaleY || 1,
        fill: selectedShape.fill || '#3B82F6',
        stroke: selectedShape.stroke || '#8B5CF6',
        strokeWidth: selectedShape.strokeWidth || 2,
        text: selectedShape.text || '',
        fontSize: selectedShape.fontSize || 20,
        fontFamily: selectedShape.fontFamily || 'Arial, sans-serif',
        align: selectedShape.align || 'left',
        smoothing: selectedShape.smoothing || 0.3,
        showAnchorPoints: selectedShape.showAnchorPoints || false
      });
    }
  }, [selectedShape, selectedIds]);

  // Font families for text elements
  const FONT_FAMILIES = [
    'Arial, sans-serif',
    'Helvetica, sans-serif',
    'Times New Roman, serif',
    'Georgia, serif',
    'Courier New, monospace',
    'Verdana, sans-serif',
    'Trebuchet MS, sans-serif',
    'Arial Black, sans-serif',
    'Comic Sans MS, cursive',
    'Impact, sans-serif'
  ];

  const TEXT_ALIGN_OPTIONS = ['left', 'center', 'right'];

  // Property update handlers
  const handlePositionXChange = (value) => {
    const newValue = parseFloat(value) || 0;
    setLocalProperties(prev => ({ ...prev, positionX: newValue }));
    if (selectedShape) {
      updateShape(selectedShape.id, { x: newValue });
    }
  };

  const handlePositionYChange = (value) => {
    const newValue = parseFloat(value) || 0;
    setLocalProperties(prev => ({ ...prev, positionY: newValue }));
    if (selectedShape) {
      updateShape(selectedShape.id, { y: newValue });
    }
  };

  const handlePositionZChange = (value) => {
    const newValue = parseInt(value) || 0;
    setLocalProperties(prev => ({ ...prev, zIndex: newValue }));
    if (selectedShape) {
      updateShape(selectedShape.id, { zIndex: newValue });
    }
  };

  const handleRotationChange = (value) => {
    const newValue = parseFloat(value) || 0;
    setLocalProperties(prev => ({ ...prev, rotation: newValue }));
    if (selectedShape) {
      updateShape(selectedShape.id, { rotation: newValue });
    }
  };

  const handleWidthChange = (value) => {
    const newValue = parseFloat(value) || 100;
    setLocalProperties(prev => ({ ...prev, width: newValue }));
    if (selectedShape) {
      updateShape(selectedShape.id, { width: newValue });
    }
  };

  const handleHeightChange = (value) => {
    const newValue = parseFloat(value) || 100;
    setLocalProperties(prev => ({ ...prev, height: newValue }));
    if (selectedShape) {
      updateShape(selectedShape.id, { height: newValue });
    }
  };

  const handleRadiusXChange = (value) => {
    const newValue = parseFloat(value) || 50;
    setLocalProperties(prev => ({ ...prev, radiusX: newValue }));
    if (selectedShape) {
      updateShape(selectedShape.id, { radiusX: newValue });
    }
  };

  const handleRadiusYChange = (value) => {
    const newValue = parseFloat(value) || 50;
    setLocalProperties(prev => ({ ...prev, radiusY: newValue }));
    if (selectedShape) {
      updateShape(selectedShape.id, { radiusY: newValue });
    }
  };

  // Handle color changes with immediate local update and debounced database sync
  const handleColorChange = useCallback((color) => {
    if (!selectedShape || !store) return;
    
    // Determine the appropriate property based on shape type
    const colorProperty = (selectedShape.type === SHAPE_TYPES.BEZIER_CURVE || selectedShape.type === SHAPE_TYPES.LINE) ? 'stroke' : 'fill';
    
    // Update local properties immediately for smooth UI
    setLocalProperties(prev => ({ ...prev, [colorProperty]: color }));
    
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
      
      updateShape(selectedShape.id, { [colorProperty]: color });
    }, 150);
    
  }, [updateShape, selectedShape, store]);

  const handleTextChange = (value) => {
    setLocalProperties(prev => ({ ...prev, text: value }));
    if (selectedShape) {
      updateShape(selectedShape.id, { text: value });
    }
  };

  const handleFontSizeChange = (value) => {
    const newValue = parseInt(value) || 20;
    setLocalProperties(prev => ({ ...prev, fontSize: newValue }));
    if (selectedShape) {
      updateShape(selectedShape.id, { fontSize: newValue });
    }
  };

  const handleFontFamilyChange = (value) => {
    setLocalProperties(prev => ({ ...prev, fontFamily: value }));
    if (selectedShape) {
      updateShape(selectedShape.id, { fontFamily: value });
    }
  };

  const handleTextAlignChange = (alignment) => {
    setLocalProperties(prev => ({ ...prev, align: alignment }));
    if (selectedShape) {
      updateShape(selectedShape.id, { align: alignment });
    }
  };

  // If no shape is selected, show empty state
  if (!selectedShape) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Inspector</h3>
        </div>
        <div className="flex-1 p-4">
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Select an object to edit properties</p>
            <p className="text-xs text-gray-400 mt-1">Ctrl + click to toggle</p>
            <p className="text-xs text-gray-400">Shift + click to add</p>
            <p className="text-xs text-gray-400">Ctrl + A to select all</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col max-h-screen overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Inspector</h3>
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
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Transform Section */}
        <div>
          <div className="flex items-center mb-2">
            <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l16 16m0 0V8m0 8H8" />
            </svg>
            <h4 className="text-sm font-medium text-gray-800">Transform</h4>
          </div>
          
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Position</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500">X</label>
                  <input
                    type="number"
                    value={Math.round(localProperties.positionX || 0)}
                    onChange={(e) => handlePositionXChange(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Y</label>
                  <input
                    type="number"
                    value={Math.round(localProperties.positionY || 0)}
                    onChange={(e) => handlePositionYChange(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Z</label>
                  <input
                    type="number"
                    value={Math.round(localProperties.zIndex || 0)}
                    onChange={(e) => handlePositionZChange(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">Rotation</label>
              <input
                type="number"
                value={Math.round(localProperties.rotation || 0)}
                onChange={(e) => handleRotationChange(e.target.value)}
                min={0}
                max={360}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Size controls (not applicable for Bezier curves) */}
            {selectedShape?.type !== SHAPE_TYPES.BEZIER_CURVE && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Size</label>
                {selectedShape?.type === SHAPE_TYPES.CIRCLE ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500">Radius X</label>
                      <input
                        type="number"
                        value={Math.round(localProperties.radiusX || 50)}
                        onChange={(e) => handleRadiusXChange(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Radius Y</label>
                      <input
                        type="number"
                        value={Math.round(localProperties.radiusY || 50)}
                        onChange={(e) => handleRadiusYChange(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                ) : selectedShape?.type === SHAPE_TYPES.LINE ? (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Stroke Width</label>
                    <input
                      type="number"
                      value={Math.round(localProperties.strokeWidth || 3)}
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value) || 3;
                        setLocalProperties(prev => ({ ...prev, strokeWidth: newValue }));
                        if (selectedShape) {
                          updateShape(selectedShape.id, { strokeWidth: newValue });
                        }
                      }}
                      min={1}
                      max={20}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ) : selectedShape?.type === SHAPE_TYPES.TRIANGLE ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500">W</label>
                      <input
                        type="number"
                        value={Math.round((localProperties.scaleX || 1) * 100)}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value) / 100 || 1;
                          setLocalProperties(prev => ({ ...prev, scaleX: newValue }));
                          if (selectedShape) {
                            updateShape(selectedShape.id, { scaleX: newValue });
                          }
                        }}
                        step={10}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">H</label>
                      <input
                        type="number"
                        value={Math.round((localProperties.scaleY || 1) * 100)}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value) / 100 || 1;
                          setLocalProperties(prev => ({ ...prev, scaleY: newValue }));
                          if (selectedShape) {
                            updateShape(selectedShape.id, { scaleY: newValue });
                          }
                        }}
                        step={10}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                ) : selectedShape?.type === SHAPE_TYPES.TEXT || selectedShape?.type === SHAPE_TYPES.TEXT_INPUT ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500">W</label>
                      <input
                        type="number"
                        value={Math.round((localProperties.scaleX || 1) * 100)}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value) / 100 || 1;
                          setLocalProperties(prev => ({ ...prev, scaleX: newValue }));
                          if (selectedShape) {
                            updateShape(selectedShape.id, { scaleX: newValue });
                          }
                        }}
                        step={10}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">H</label>
                      <input
                        type="number"
                        value={Math.round((localProperties.scaleY || 1) * 100)}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value) / 100 || 1;
                          setLocalProperties(prev => ({ ...prev, scaleY: newValue }));
                          if (selectedShape) {
                            updateShape(selectedShape.id, { scaleY: newValue });
                          }
                        }}
                        step={10}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500">W</label>
                      <input
                        type="number"
                        value={Math.round(localProperties.width || 100)}
                        onChange={(e) => handleWidthChange(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">H</label>
                      <input
                        type="number"
                        value={Math.round(localProperties.height || 100)}
                        onChange={(e) => handleHeightChange(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Text Properties */}
        {(selectedShape?.type === SHAPE_TYPES.TEXT || selectedShape?.type === SHAPE_TYPES.TEXT_INPUT) && (
          <div>
            <div className="flex items-center mb-2">
              <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h4 className="text-sm font-medium text-gray-800">Text</h4>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Content</label>
                <textarea
                  value={localProperties.text || ''}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder={selectedShape?.type === SHAPE_TYPES.TEXT ? "Enter text content..." : "Enter input field text..."}
                  rows={3}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Font Size</label>
                <input
                  type="number"
                  value={localProperties.fontSize || 20}
                  onChange={(e) => handleFontSizeChange(e.target.value)}
                  min={8}
                  max={72}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Font Family</label>
                <select
                  value={localProperties.fontFamily || 'Arial, sans-serif'}
                  onChange={(e) => handleFontFamilyChange(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {FONT_FAMILIES.map((font) => (
                    <option key={font} value={font}>
                      {font.split(',')[0]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Alignment</label>
                <div className="flex space-x-1">
                  {TEXT_ALIGN_OPTIONS.map((alignment) => (
                    <button
                      key={alignment}
                      onClick={() => handleTextAlignChange(alignment)}
                      className={`flex-1 px-2 py-1 text-xs border border-gray-300 rounded capitalize ${
                        (localProperties.align || 'left') === alignment 
                          ? 'bg-blue-600 text-white border-blue-500' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {alignment}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bezier Curve Properties */}
        {selectedShape?.type === SHAPE_TYPES.BEZIER_CURVE && (
          <div>
            <div className="flex items-center mb-2">
              <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12C3 12 6 2 12 12C18 22 21 12 21 12" />
              </svg>
              <h4 className="text-sm font-medium text-gray-800">Bezier Curve</h4>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  Anchor Points: {selectedShape?.anchorPoints?.length || 3}
                </span>
                <button
                  onClick={() => {
                    console.log('🔵 Add Point button clicked for shape:', selectedShape?.id, 'type:', selectedShape?.type);
                    addBezierPoint(selectedShape.id);
                  }}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  title="Add anchor point to curve"
                >
                  + Add Point
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Edit Points</span>
                <button
                  onClick={() => {
                    if (selectedShape) {
                      updateShape(selectedShape.id, { showAnchorPoints: !selectedShape.showAnchorPoints });
                    }
                  }}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    selectedShape?.showAnchorPoints 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title="Toggle anchor point visibility"
                >
                  {selectedShape?.showAnchorPoints ? 'Hide Points' : 'Show Points'}
                </button>
              </div>

              <ScalarInput
                label="Smoothing"
                value={(selectedShape?.smoothing ?? 0.3) * 100}
                onChange={(value) => {
                  if (selectedShape) {
                    updateShape(selectedShape.id, { smoothing: value / 100 });
                  }
                }}
                unit="%"
                min={0}
                max={100}
                step={5}
                precision={0}
              />

              <ScalarInput
                label="Stroke Width"
                value={selectedShape?.strokeWidth || 3}
                onChange={(value) => {
                  if (selectedShape) {
                    updateShape(selectedShape.id, { strokeWidth: value });
                  }
                }}
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
        <div>
          <div className="flex items-center mb-2">
            <svg className="w-4 h-4 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
            </svg>
            <h4 className="text-sm font-medium text-gray-800">Appearance</h4>
          </div>
          
          <ColorPicker
            color={
              selectedShape && (selectedShape.type === SHAPE_TYPES.BEZIER_CURVE || selectedShape.type === SHAPE_TYPES.LINE)
                ? (localProperties.stroke || '#8B5CF6')
                : (localProperties.fill || '#3B82F6')
            }
            onChange={handleColorChange}
          />
        </div>

        {/* Debug Info */}
        <div className="pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1 font-mono">
            <div className="flex justify-between">
              <span>ID:</span>
              <span className="text-gray-400">{selectedShape?.id.split('-').slice(-1)[0] || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="text-gray-400">{selectedShape?.type || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Z-Index:</span>
              <span className="text-gray-400">{selectedShape?.zIndex || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inspector;