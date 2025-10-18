/**
 * AI Functions for Canvas Operations
 * 
 * This file contains the function definitions that are sent to OpenAI
 * for function calling. Used by both local server and production API.
 */

export const AI_FUNCTIONS = [
  // MULTIPLE SHAPE CREATION (PRIORITY FUNCTION)
  {
    name: 'createMultipleShapes',
    description: 'Create multiple shapes with automatic layout. Use this for ANY command involving quantities (5 circles, 3x3 grid, etc.). Supports grid formats where "3x3" means 3 rows and 3 columns (9 total shapes). ALWAYS use this instead of createShape when count > 1.',
    parameters: {
      type: 'object',
      properties: {
        shapeType: {
          type: 'string',
          enum: ['rectangle', 'circle', 'triangle', 'bezier_curve'],
          description: 'Type of shapes to create'
        },
        count: {
          type: 'number',
          description: 'Number of shapes to create. For grids, this should be rows × columns (e.g., 3x3 = 9 shapes)'
        },
        arrangement: {
          type: 'string',
          enum: ['row', 'column', 'grid'],
          description: 'How to arrange the shapes'
        },
        gridRows: {
          type: 'number',
          description: 'For grid arrangement: number of rows (e.g., for "3x3 grid" use 3)'
        },
        gridCols: {
          type: 'number', 
          description: 'For grid arrangement: number of columns (e.g., for "3x3 grid" use 3)'
        },
        fill: {
          type: 'string',
          description: 'Color for all shapes (hex code or color name)'
        },
        width: {
          type: 'number',
          description: 'Width for each shape (for rectangles)'
        },
        height: {
          type: 'number',
          description: 'Height for each shape (for rectangles)'
        },
        radiusX: {
          type: 'number',
          description: 'Horizontal radius for circles/ellipses'
        },
        radiusY: {
          type: 'number',
          description: 'Vertical radius for circles/ellipses'
        },
        spacing: {
          type: 'number',
          description: 'Space between shapes (will be calculated dynamically based on shape size if not specified)'
        },
        startX: {
          type: 'number',
          description: 'Starting X position (defaults to 0 if not specified)'
        },
        startY: {
          type: 'number',
          description: 'Starting Y position (defaults to 0 if not specified)'
        },
        centerInViewport: {
          type: 'boolean',
          description: 'Whether to center the entire group in viewport (default: false)'
        },
        marginSize: {
          type: 'number',
          description: 'Add margin around the group (in pixels)'
        },
        containerWidth: {
          type: 'number',
          description: 'For even distribution: the width of the container'
        }
      },
      required: ['shapeType', 'count']
    }
  },
  // SINGLE SHAPE CREATION
  {
    name: 'createShape',
    description: 'Create a SINGLE shape on the canvas. Use this ONLY for creating one shape at a time. For multiple shapes, grids, or arrays, use createMultipleShapes instead.',
    parameters: {
      type: 'object',
      properties: {
        shapeType: {
          type: 'string',
          enum: ['rectangle', 'circle', 'triangle', 'line', 'text', 'text_input', 'bezier_curve'],
          description: 'Type of shape to create'
        },
        x: {
          type: 'number',
          description: 'X position on canvas'
        },
        y: {
          type: 'number', 
          description: 'Y position on canvas'
        },
        width: {
          type: 'number',
          description: 'Width of the shape (for rectangles)'
        },
        height: {
          type: 'number',
          description: 'Height of the shape (for rectangles)'
        },
        radiusX: {
          type: 'number',
          description: 'X radius for circles/ellipses'
        },
        radiusY: {
          type: 'number',
          description: 'Y radius for circles/ellipses'
        },
        fill: {
          type: 'string',
          description: 'Color of the shape (hex code or color name)'
        },
        text: {
          type: 'string',
          description: 'Text content (for text shapes)'
        },
        fontSize: {
          type: 'number',
          description: 'Font size for text shapes'
        }
      },
      required: ['shapeType', 'x', 'y']
    }
  },
  // MANIPULATION COMMANDS
  {
    name: 'moveShape',
    description: 'Move an existing shape to a new position using natural language description',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'Natural language description of the shape (e.g., "blue rectangle", "red circle", "large triangle")'
        },
        x: {
          oneOf: [
            { type: 'number', description: 'New X position' },
            { type: 'string', description: '"center" moves to origin (0,0)' }
          ]
        },
        y: {
          oneOf: [
            { type: 'number', description: 'New Y position' },
            { type: 'string', description: '"center" moves to origin (0,0)' }
          ]
        }
      },
      required: ['shapeId', 'x', 'y']
    }
  },
  {
    name: 'resizeShape',
    description: 'Resize an existing shape using natural language description',
    parameters: {
      type: 'object',
      properties: {
        shapeDescription: {
          type: 'string',
          description: 'Natural language description of the shape (e.g., "blue rectangle", "red circle", "large triangle")'
        },
        scale: {
          type: 'number',
          description: 'Scale multiplier to resize shape proportionally (e.g., 2.0 = twice as big, 0.5 = half size)'
        }
      },
      required: ['shapeDescription', 'scale']
    }
  },
  {
    name: 'changeShapeColor',
    description: 'Change the color of an existing shape using natural language description',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'Natural language description of the shape (e.g., "blue rectangle", "red circle", "large triangle")'
        },
        color: {
          type: 'string',
          description: 'New color (hex code or color name)'
        }
      },
      required: ['shapeId', 'color']
    }
  },
  {
    name: 'deleteShape',
    description: 'Delete an existing shape using natural language description',
    parameters: {
      type: 'object',
      properties: {
        shapeDescription: {
          type: 'string',
          description: 'Natural language description of the shape to delete'
        }
      },
      required: ['shapeDescription']
    }
  },
  {
    name: 'listShapes',
    description: 'List all shapes currently on the canvas',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'getCanvasState',
    description: 'Get the current state of the canvas including all shapes',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];
