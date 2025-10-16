// Canvas dimensions and constraints
export const CANVAS_WIDTH = 5000;
export const CANVAS_HEIGHT = 5000;

// Viewport dimensions (will be calculated based on container)
export const VIEWPORT_WIDTH = 800;  // Default fallback
export const VIEWPORT_HEIGHT = 600; // Default fallback

// Zoom constraints  
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3.0;
export const DEFAULT_ZOOM = 1.0;

// Pan constraints (canvas bounds)
export const PAN_BOUNDS = {
  x: { min: -CANVAS_WIDTH + VIEWPORT_WIDTH, max: 0 },
  y: { min: -CANVAS_HEIGHT + VIEWPORT_HEIGHT, max: 0 }
};

// Shape types
export const SHAPE_TYPES = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TRIANGLE: 'triangle',
  LINE: 'line',
  TEXT: 'text',
  TEXT_INPUT: 'text_input',
  BEZIER_CURVE: 'bezier_curve'
};

// Shape defaults for each type
export const DEFAULT_SHAPE_PROPS = {
  [SHAPE_TYPES.RECTANGLE]: {
    width: 100,
    height: 100,
    fill: '#3B82F6',
    zIndex: 0
  },
  [SHAPE_TYPES.CIRCLE]: {
    radiusX: 50,
    radiusY: 50,
    fill: '#10B981',
    zIndex: 0
  },
  [SHAPE_TYPES.TRIANGLE]: {
    points: [0, -40, -35, 30, 35, 30], // Equilateral triangle
    fill: '#EF4444',
    closed: true,
    zIndex: 0
  },
  [SHAPE_TYPES.LINE]: {
    points: [-50, 0, 50, 0], // Horizontal line from -50,0 to 50,0 (100px total length)
    stroke: '#8B5CF6',
    strokeWidth: 3,
    fill: null, // Lines don't have fill
    closed: false,
    zIndex: 0
  },
  [SHAPE_TYPES.TEXT]: {
    text: 'Text',
    fontSize: 20,
    fontFamily: 'Arial, sans-serif',
    fill: '#1F2937',
    width: 200,
    height: 'auto',
    align: 'left',
    verticalAlign: 'top',
    padding: 8,
    editable: true,
    zIndex: 0
  },
  [SHAPE_TYPES.TEXT_INPUT]: {
    text: 'Input Field',
    fontSize: 16,
    fontFamily: 'Arial, sans-serif',
    fill: '#1F2937',
    width: 250,
    height: 40,
    align: 'left',
    verticalAlign: 'middle',
    padding: 12,
    editable: true,
    background: '#FFFFFF',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    cornerRadius: 6,
    zIndex: 0
  },
  [SHAPE_TYPES.BEZIER_CURVE]: {
    // Bezier curve defined by anchor points with auto-generated smooth control handles
    // Default creates a simple curve with 3 anchor points
    anchorPoints: [
      { x: 0, y: 0 },       // Start anchor point
      { x: 75, y: -50 },    // Middle anchor point  
      { x: 150, y: 0 }      // End anchor point
    ],
    stroke: '#8B5CF6',      // Purple stroke
    strokeWidth: 3,
    fill: null,             // Curves don't have fill
    lineCap: 'round',       // Rounded line endings
    lineJoin: 'round',      // Rounded line joins
    smoothing: 0.3,         // Auto-control handle smoothing factor (0 = sharp, 1 = very smooth)
    editable: true,         // Allow editing anchor points
    showAnchorPoints: false, // Show anchor points when selected
    zIndex: 0
  }
};

// Legacy default shape for backward compatibility
export const DEFAULT_SHAPE = DEFAULT_SHAPE_PROPS[SHAPE_TYPES.RECTANGLE];

// Colors for different users/shapes
export const SHAPE_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16'  // Lime
];

// Predefined color palette for color picker
export const COLOR_PALETTE = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6B7280', // Gray
  '#000000', // Black
  '#FFFFFF', // White
  '#EC4899'  // Pink
];

// Size constraints for shapes
export const SHAPE_SIZE_LIMITS = {
  [SHAPE_TYPES.RECTANGLE]: {
    minWidth: 20,
    maxWidth: 500,
    minHeight: 20,
    maxHeight: 500
  },
  [SHAPE_TYPES.CIRCLE]: {
    minRadiusX: 10,
    maxRadiusX: 250,
    minRadiusY: 10,
    maxRadiusY: 250
  },
  [SHAPE_TYPES.TRIANGLE]: {
    minSize: 20,
    maxSize: 200
  },
  [SHAPE_TYPES.LINE]: {
    minLength: 20,
    maxLength: 500,
    minStrokeWidth: 1,
    maxStrokeWidth: 20
  },
  [SHAPE_TYPES.TEXT]: {
    minFontSize: 8,
    maxFontSize: 72,
    minWidth: 50,
    maxWidth: 800
  },
  [SHAPE_TYPES.TEXT_INPUT]: {
    minFontSize: 8,
    maxFontSize: 32,
    minWidth: 100,
    maxWidth: 600,
    minHeight: 20,
    maxHeight: 200
  },
  [SHAPE_TYPES.BEZIER_CURVE]: {
    minStrokeWidth: 1,
    maxStrokeWidth: 20,
    minControlPointDistance: 10,   // Minimum distance between control points
    maxControlPointDistance: 800,  // Maximum distance between control points
    minTension: 0,                 // Minimum curve tension
    maxTension: 1                  // Maximum curve tension
  }
};

// Grid settings (optional)
export const GRID_SIZE = 20;
export const GRID_COLOR = '#E5E7EB';

// Performance settings
export const DEBOUNCE_TIME = 16; // ~60fps for smooth interactions

// Font options for text elements
export const FONT_FAMILIES = [
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Times New Roman, serif',
  'Georgia, serif',
  'Courier New, monospace',
  'Verdana, sans-serif',
  'Impact, sans-serif'
];

// Text alignment options
export const TEXT_ALIGN_OPTIONS = ['left', 'center', 'right'];
export const VERTICAL_ALIGN_OPTIONS = ['top', 'middle', 'bottom'];

// Utility function for throttling
export function throttle(func, delay) {
  let timeoutId;
  let lastExecTime = 0;
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}