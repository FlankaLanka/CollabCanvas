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
  TRIANGLE: 'triangle'
};

// Shape defaults for each type
export const DEFAULT_SHAPE_PROPS = {
  [SHAPE_TYPES.RECTANGLE]: {
    width: 100,
    height: 100,
    fill: '#3B82F6'
  },
  [SHAPE_TYPES.CIRCLE]: {
    radius: 50,
    fill: '#10B981'
  },
  [SHAPE_TYPES.TRIANGLE]: {
    points: [0, -40, -35, 30, 35, 30], // Equilateral triangle
    fill: '#EF4444',
    closed: true
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
    minRadius: 10,
    maxRadius: 250
  },
  [SHAPE_TYPES.TRIANGLE]: {
    minSize: 20,
    maxSize: 200
  }
};

// Grid settings (optional)
export const GRID_SIZE = 20;
export const GRID_COLOR = '#E5E7EB';

// Performance settings
export const DEBOUNCE_TIME = 16; // ~60fps for smooth interactions