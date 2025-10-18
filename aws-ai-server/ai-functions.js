/**
 * Shared AI Functions for AWS AI Agent
 * 
 * This module exports the complete AI_FUNCTIONS array that can be used
 * by both the main server and the LangSmith service.
 */

// AI_FUNCTIONS - Complete Canvas manipulation tools (46 functions)
export const AI_FUNCTIONS = [
  // CREATION COMMANDS
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
            { type: 'string', description: '"center" for origin (0,0)' }
          ]
        },
        y: {
          oneOf: [
            { type: 'number', description: 'New Y position' },
            { type: 'string', description: '"center" for origin (0,0)' }
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
        shapeId: {
          type: 'string',
          description: 'Natural language description of the shape (e.g., "blue rectangle", "red circle", "large triangle")'
        },
        width: {
          type: 'number',
          description: 'New width (for rectangles)'
        },
        height: {
          type: 'number',
          description: 'New height (for rectangles)'
        },
        radiusX: {
          type: 'number',
          description: 'New X radius (for circles)'
        },
        radiusY: {
          type: 'number',
          description: 'New Y radius (for circles)'
        },
        scale: {
          type: 'number',
          description: 'Scale multiplier to resize shape proportionally (e.g., 2.0 = twice as big, 0.5 = half size). Converts to actual pixel dimensions.'
        }
      },
      required: ['shapeId']
    }
  },

  {
    name: 'rotateShape',
    description: 'Rotate an existing shape using natural language description',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'Natural language description of the shape (e.g., "blue rectangle", "red circle", "large triangle")'
        },
        degrees: {
          type: 'number',
          description: 'Rotation angle in degrees'
        }
      },
      required: ['shapeId', 'degrees']
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
    name: 'changeShapeText',
    description: 'Change the text content of an existing text shape using natural language description',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'Natural language description of the text shape (e.g., "text that says Hello", "username label", "title text")'
        },
        newText: {
          type: 'string',
          description: 'New text content to replace the existing text'
        }
      },
      required: ['shapeId', 'newText']
    }
  },

  // LAYOUT COMMANDS
  {
    name: 'createMultipleShapes',
    description: 'Create multiple shapes with automatic layout. Use this for ANY command involving quantities, grids, or arrays (5 circles, 3x3 grid, 2x4 grid, etc.). CRITICAL: "3x3 grid" means 9 shapes in a 3x3 grid, NOT 1 shape with 3x3 dimensions. ALWAYS use this instead of createShape when count > 1 or when user mentions "grid", "array", or multiple items.',
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
        startX: {
          type: 'number',
          description: 'Starting X position (or use viewport center if not specified)'
        },
        startY: {
          type: 'number',
          description: 'Starting Y position (or use viewport center if not specified)'
        },
        spacing: {
          type: 'number',
          description: 'Space between shapes (will be calculated dynamically based on shape size if not specified)'
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
        avoidOverlaps: {
          type: 'boolean',
          description: 'Whether to avoid overlapping existing shapes (default: true)'
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

  {
    name: 'arrangeShapesInRow',
    description: 'Arrange existing shapes in a horizontal row with specified spacing',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs or descriptions to arrange'
        },
        spacing: {
          type: 'number',
          description: 'Space between shapes in pixels'
        },
        startX: { type: 'number', description: 'Starting X position' },
        startY: { type: 'number', description: 'Y position for the row' }
      },
      required: ['shapeIds']
    }
  },
  {
    name: 'arrangeShapesInGrid',
    description: 'Arrange existing shapes in a grid pattern',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs or descriptions to arrange'
        },
        rows: { type: 'number', description: 'Number of rows' },
        cols: { type: 'number', description: 'Number of columns' },
        startX: { type: 'number', description: 'Starting X position' },
        startY: { type: 'number', description: 'Starting Y position' },
        spacingX: { type: 'number', description: 'Horizontal spacing' },
        spacingY: { type: 'number', description: 'Vertical spacing' }
      },
      required: ['shapeIds', 'rows', 'cols']
    }
  },
  {
    name: 'distributeShapesEvenly',
    description: 'Distribute shapes evenly in a container',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs or descriptions to distribute'
        },
        containerWidth: { type: 'number', description: 'Width of the container' },
        direction: { type: 'string', enum: ['horizontal', 'vertical'], description: 'Distribution direction' }
      },
      required: ['shapeIds', 'containerWidth']
    }
  },
  {
    name: 'centerGroup',
    description: 'Center a group of shapes at a specific point',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs or descriptions to center'
        },
        centerX: { type: 'number', description: 'X coordinate to center the group' },
        centerY: { type: 'number', description: 'Y coordinate to center the group' }
      },
      required: ['shapeIds']
    }
  },
  {
    name: 'addGroupMargin',
    description: 'Add margin around a group of shapes',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs or descriptions to add margin to'
        },
        marginSize: { type: 'number', description: 'Margin size in pixels' }
      },
      required: ['shapeIds', 'marginSize']
    }
  },

  {
    name: 'arrangeShapes',
    description: 'Arrange existing shapes in a pattern',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs to arrange'
        },
        arrangement: {
          type: 'string',
          enum: ['row', 'column', 'grid', 'circle'],
          description: 'Arrangement pattern'
        },
        centerX: {
          type: 'number',
          description: 'Center X position for arrangement'
        },
        centerY: {
          type: 'number',
          description: 'Center Y position for arrangement'
        },
        spacing: {
          type: 'number',
          description: 'Space between shapes'
        }
      },
      required: ['shapeIds', 'arrangement', 'centerX', 'centerY']
    }
  },

  // COMPLEX COMMANDS
  {
    name: 'createLoginForm',
    description: 'Create a professional login form with proper alignment using blueprint system. Generates username/password fields as text_input shapes (NOT rectangles), with labels positioned ABOVE inputs, and centered login button. All elements aligned within a container.',
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'X position for the form (optional, defaults to viewport center)'
        },
        y: {
          type: 'number',
          description: 'Y position for the form (optional, defaults to viewport center)'
        },
        width: {
          type: 'number',
          description: 'Width of the form (optional, defaults to 360)'
        }
      },
      required: []
    }
  },

  {
    name: 'createNavigationBar',
    description: 'Create a navigation bar with menu items',
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'X position for the navigation bar'
        },
        y: {
          type: 'number',
          description: 'Y position for the navigation bar'
        },
        menuItems: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of menu item names'
        },
        width: {
          type: 'number',
          description: 'Total width of the navigation bar'
        }
      },
      required: ['x', 'y', 'menuItems']
    }
  },

  {
    name: 'createCardLayout',
    description: 'Create a card layout with title, content area, and styling',
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'X position for the card'
        },
        y: {
          type: 'number',
          description: 'Y position for the card'
        },
        title: {
          type: 'string',
          description: 'Card title text'
        },
        content: {
          type: 'string',
          description: 'Card content text'
        },
        width: {
          type: 'number',
          description: 'Card width (default: 250)'
        },
        height: {
          type: 'number',
          description: 'Card height (default: 200)'
        }
      },
      required: ['x', 'y', 'title']
    }
  },

  // UTILITY COMMANDS
  {
    name: 'getCanvasState',
    description: 'Get current canvas state and shapes with detailed information',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },

  {
    name: 'listShapes',
    description: 'List all shapes on the canvas with friendly descriptions and IDs for easy reference',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },

  {
    name: 'identifyShape',
    description: 'Find and identify a specific shape by its ID or friendly ID',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'Full shape ID or friendly ID (like "abc123") to identify'
        }
      },
      required: ['shapeId']
    }
  },

  {
    name: 'deleteShape',
    description: 'Delete an existing shape from the canvas using natural language description',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'Natural language description of the shape (e.g., "blue rectangle", "red circle", "large triangle")'
        }
      },
      required: ['shapeId']
    }
  },

  // DESIGN SYSTEM & QUALITY TOOLS
  {
    name: 'autoAlignUI',
    description: 'Auto-align all shapes to 8px grid and fix common alignment issues',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'checkUIQuality',
    description: 'Check UI quality and return any issues (contrast, alignment, spacing)',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'autoFixUI',
    description: 'Automatically fix UI quality issues (contrast, alignment, font sizes)',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'layoutStack',
    description: 'Layout shapes in a vertical or horizontal stack',
    parameters: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['vertical', 'horizontal'],
          description: 'Stack direction'
        },
        gap: {
          type: 'number',
          description: 'Spacing between shapes in pixels'
        },
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs to layout (optional, uses selection if not provided)'
        }
      },
      required: []
    }
  },
  {
    name: 'layoutGrid',
    description: 'Layout shapes in a grid pattern',
    parameters: {
      type: 'object',
      properties: {
        rows: {
          type: 'number',
          description: 'Number of rows in the grid'
        },
        cols: {
          type: 'number',
          description: 'Number of columns in the grid'
        },
        gap: {
          type: 'number',
          description: 'Spacing between grid cells in pixels'
        },
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs to layout (optional, uses selection if not provided)'
        }
      },
      required: ['rows', 'cols']
    }
  },
  {
    name: 'getSelection',
    description: 'Get current selection or recently created shapes',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'validateUILayout',
    description: 'Validate UI layout quality - checks alignment, contrast, spacing, and font sizes',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'createFormContainer',
    description: 'Create a FormContainer - a centered container for form elements',
    parameters: {
      type: 'object',
      properties: {
        width: { type: 'number', description: 'Container width (default 360)' },
        height: { type: 'number', description: 'Container height (default 400)' },
        centerX: { type: 'number', description: 'Center X position (default 400)' },
        centerY: { type: 'number', description: 'Center Y position (default 300)' }
      },
      required: []
    }
  },
  {
    name: 'stackVertically',
    description: 'Stack elements vertically within a container with consistent spacing',
    parameters: {
      type: 'object',
      properties: {
        elements: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Array of elements to stack' 
        },
        container: { type: 'object', description: 'Container object with positioning info' },
        startY: { type: 'number', description: 'Starting Y position' },
        gap: { type: 'number', description: 'Gap between elements (default 24)' }
      },
      required: ['elements', 'container', 'startY']
    }
  },
  {
    name: 'alignHorizontally',
    description: 'Align elements horizontally at the same x position',
    parameters: {
      type: 'object',
      properties: {
        elements: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Array of elements to align' 
        },
        centerX: { type: 'number', description: 'Center X position' },
        startY: { type: 'number', description: 'Starting Y position' },
        gap: { type: 'number', description: 'Gap between elements (default 16)' }
      },
      required: ['elements', 'centerX', 'startY']
    }
  },
  {
    name: 'centerContainer',
    description: 'Calculate center position for a container on the canvas',
    parameters: {
      type: 'object',
      properties: {
        width: { type: 'number', description: 'Container width' },
        height: { type: 'number', description: 'Container height' },
        canvasWidth: { type: 'number', description: 'Canvas width (default 800)' },
        canvasHeight: { type: 'number', description: 'Canvas height (default 600)' }
      },
      required: ['width', 'height']
    }
  },
  {
    name: 'createLoginFormWithLayout',
    description: 'PREFERRED: Create a professional login form using advanced blueprint system. Ensures text_input shapes, proper z-index ordering, and perfect alignment.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },

  // RELATIVE POSITIONING TOOLS
  {
    name: 'placeBelow',
    description: 'Place a shape directly below another shape with specified gap',
    parameters: {
      type: 'object',
      properties: {
        shapeId: { type: 'string', description: 'Shape to position' },
        referenceShapeId: { type: 'string', description: 'Shape to position below' },
        gap: { type: 'number', description: 'Gap in pixels (default 24)' }
      },
      required: ['shapeId', 'referenceShapeId']
    }
  },
  {
    name: 'placeRightOf',
    description: 'Place a shape to the right of another shape with specified gap',
    parameters: {
      type: 'object',
      properties: {
        shapeId: { type: 'string', description: 'Shape to position' },
        referenceShapeId: { type: 'string', description: 'Shape to position to the right of' },
        gap: { type: 'number', description: 'Gap in pixels (default 16)' }
      },
      required: ['shapeId', 'referenceShapeId']
    }
  },
  {
    name: 'alignWith',
    description: 'Align a shape with another shape (left, center, right, top, middle, bottom)',
    parameters: {
      type: 'object',
      properties: {
        shapeId: { type: 'string', description: 'Shape to align' },
        referenceShapeId: { type: 'string', description: 'Reference shape' },
        alignment: { 
          type: 'string', 
          enum: ['left', 'center', 'right', 'top', 'middle', 'bottom'],
          description: 'Alignment type'
        }
      },
      required: ['shapeId', 'referenceShapeId', 'alignment']
    }
  },
  {
    name: 'centerInContainer',
    description: 'Center a shape horizontally within its parent container',
    parameters: {
      type: 'object',
      properties: {
        shapeId: { type: 'string', description: 'Shape to center' },
        containerId: { type: 'string', description: 'Container ID (optional, auto-detects if not provided)' }
      },
      required: ['shapeId']
    }
  },
  {
    name: 'setPaddingFromContainer',
    description: 'Set consistent padding between shape and its container edges',
    parameters: {
      type: 'object',
      properties: {
        shapeId: { type: 'string', description: 'Shape to position' },
        containerId: { type: 'string', description: 'Container ID' },
        padding: { type: 'number', description: 'Padding in pixels (default 24)' }
      },
      required: ['shapeId', 'containerId']
    }
  },
  {
    name: 'groupShapes',
    description: 'Group shapes together to maintain their relative positions',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: { type: 'array', items: { type: 'string' }, description: 'Array of shape IDs to group' },
        groupName: { type: 'string', description: 'Optional group name' }
      },
      required: ['shapeIds']
    }
  },
  {
    name: 'distributeInContainer',
    description: 'Distribute shapes evenly within a container',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: { type: 'array', items: { type: 'string' }, description: 'Array of shape IDs to distribute' },
        containerId: { type: 'string', description: 'Container ID' },
        direction: { type: 'string', enum: ['horizontal', 'vertical'], description: 'Distribution direction' },
        margin: { type: 'number', description: 'Edge margin (default 20)' }
      },
      required: ['shapeIds', 'containerId']
    }
  },
  {
    name: 'analyzeShapeRelationships',
    description: 'Analyze spatial relationships between shapes (containers, groups, alignments)',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'validateAndFix',
    description: 'Enhanced validation with pre/post-action checks and automatic fixes',
    parameters: {
      type: 'object',
      properties: {
        operationType: { type: 'string', description: 'Type of operation (form, card, layout)' }
      },
      required: ['operationType']
    }
  },

  // BLUEPRINT SYSTEM TOOLS
  {
    name: 'executeBlueprintPlan',
    description: 'Execute a structured UI blueprint for professional layouts',
    parameters: {
      type: 'object',
      properties: {
        blueprint: { type: 'object', description: 'Blueprint specification with layout hierarchy and constraints' }
      },
      required: ['blueprint']
    }
  },
  {
    name: 'generateLoginFormBlueprint',
    description: 'Generate a professional login form blueprint with proper constraints',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },

  // NATURAL LANGUAGE ROBUSTNESS TOOLS
  {
    name: 'parsePositionCommand',
    description: 'Parse natural language position commands with synonyms and contextual references',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Natural language position command' },
        shapeDescription: { type: 'string', description: 'Optional shape description for reference' }
      },
      required: ['command']
    }
  },
  {
    name: 'resolveTheseShapes',
    description: 'Resolve "these shapes" reference to actual shapes (selected, recent, or all)',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'parseSizeDescriptor',
    description: 'Parse size descriptors (tiny, small, medium, large, huge, very large)',
    parameters: {
      type: 'object',
      properties: {
        sizeText: { type: 'string', description: 'Size descriptor text' }
      },
      required: ['sizeText']
    }
  }
];
