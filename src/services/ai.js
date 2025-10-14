import OpenAI from 'openai';
import { SHAPE_TYPES, DEFAULT_SHAPE_PROPS, COLOR_PALETTE } from '../utils/constants';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
});

// AI function schema for canvas operations
const AI_FUNCTIONS = [
  {
    name: 'createShape',
    description: 'Create a new shape on the canvas',
    parameters: {
      type: 'object',
      properties: {
        shapeType: {
          type: 'string',
          enum: ['rectangle', 'circle', 'triangle'],
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
        radius: {
          type: 'number',
          description: 'Radius of the shape (for circles)'
        },
        scale: {
          type: 'number',
          description: 'Scale factor for triangles (default 1.0)'
        },
        fill: {
          type: 'string',
          description: 'Color of the shape (hex code or color name)'
        }
      },
      required: ['shapeType', 'x', 'y']
    }
  },
  {
    name: 'createText',
    description: 'Create text or text input on the canvas',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text content to display'
        },
        textType: {
          type: 'string',
          enum: ['text', 'text_input'],
          description: 'Type of text element'
        },
        x: {
          type: 'number',
          description: 'X position on canvas'
        },
        y: {
          type: 'number',
          description: 'Y position on canvas'
        },
        fontSize: {
          type: 'number',
          description: 'Font size in pixels'
        },
        fontFamily: {
          type: 'string',
          description: 'Font family'
        },
        fill: {
          type: 'string',
          description: 'Text color'
        },
        width: {
          type: 'number',
          description: 'Width of text container'
        },
        align: {
          type: 'string',
          enum: ['left', 'center', 'right'],
          description: 'Text alignment'
        }
      },
      required: ['text', 'textType', 'x', 'y']
    }
  },
  {
    name: 'moveShape',
    description: 'Move an existing shape to a new position',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'ID of the shape to move'
        },
        x: {
          type: 'number',
          description: 'New X position'
        },
        y: {
          type: 'number', 
          description: 'New Y position'
        }
      },
      required: ['shapeId', 'x', 'y']
    }
  },
  {
    name: 'resizeShape',
    description: 'Resize an existing shape',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'ID of the shape to resize'
        },
        width: {
          type: 'number',
          description: 'New width (for rectangles)'
        },
        height: {
          type: 'number',
          description: 'New height (for rectangles)'
        },
        radius: {
          type: 'number',
          description: 'New radius (for circles)'
        },
        scale: {
          type: 'number',
          description: 'New scale factor (for triangles)'
        }
      },
      required: ['shapeId']
    }
  },
  {
    name: 'rotateShape',
    description: 'Rotate an existing shape',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'ID of the shape to rotate'
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
    description: 'Change the color of an existing shape',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'ID of the shape to recolor'
        },
        fill: {
          type: 'string',
          description: 'New color (hex code or color name)'
        }
      },
      required: ['shapeId', 'fill']
    }
  },
  {
    name: 'deleteShape',
    description: 'Delete a shape from the canvas',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'ID of the shape to delete'
        }
      },
      required: ['shapeId']
    }
  },
  {
    name: 'getCanvasState',
    description: 'Get current state of the canvas including all shapes',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'arrangeInRow',
    description: 'Arrange multiple shapes in a horizontal row',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs to arrange'
        },
        startX: {
          type: 'number',
          description: 'Starting X position for the row'
        },
        y: {
          type: 'number',
          description: 'Y position for all shapes in the row'
        },
        spacing: {
          type: 'number',
          description: 'Space between shapes'
        }
      },
      required: ['shapeIds', 'startX', 'y', 'spacing']
    }
  },
  {
    name: 'arrangeInGrid',
    description: 'Arrange shapes in a grid pattern',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs to arrange'
        },
        startX: {
          type: 'number',
          description: 'Starting X position for the grid'
        },
        startY: {
          type: 'number',
          description: 'Starting Y position for the grid'
        },
        rows: {
          type: 'number',
          description: 'Number of rows in the grid'
        },
        cols: {
          type: 'number',
          description: 'Number of columns in the grid'
        },
        spacingX: {
          type: 'number',
          description: 'Horizontal spacing between items'
        },
        spacingY: {
          type: 'number',
          description: 'Vertical spacing between items'
        }
      },
      required: ['shapeIds', 'startX', 'startY', 'rows', 'cols', 'spacingX', 'spacingY']
    }
  },
  {
    name: 'createLoginForm',
    description: 'Create a complete login form with username, password, and submit button',
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'X position for the form'
        },
        y: {
          type: 'number',
          description: 'Y position for the form'
        },
        width: {
          type: 'number',
          description: 'Width of the form elements'
        }
      },
      required: ['x', 'y']
    }
  },
  {
    name: 'createNavBar',
    description: 'Create a navigation bar with menu items',
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'X position for the nav bar'
        },
        y: {
          type: 'number',
          description: 'Y position for the nav bar'
        },
        width: {
          type: 'number',
          description: 'Total width of the nav bar'
        },
        menuItems: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of menu item names'
        }
      },
      required: ['x', 'y', 'menuItems']
    }
  },
  {
    name: 'createCardLayout',
    description: 'Create a card layout with title, content area, and optional action buttons',
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
        width: {
          type: 'number',
          description: 'Width of the card'
        },
        height: {
          type: 'number',
          description: 'Height of the card'
        },
        title: {
          type: 'string',
          description: 'Card title text'
        },
        content: {
          type: 'string',
          description: 'Card content/description text'
        }
      },
      required: ['x', 'y', 'width', 'height', 'title']
    }
  },
  // Selection-aware functions for multi-shape operations
  {
    name: 'modifySelectedShapes',
    description: 'Modify properties of currently selected shapes (color, size, position, etc.)',
    parameters: {
      type: 'object',
      properties: {
        property: {
          type: 'string',
          enum: ['fill', 'width', 'height', 'radius', 'scale', 'fontSize', 'x', 'y', 'rotation'],
          description: 'Property to modify on selected shapes'
        },
        value: {
          type: 'number',
          description: 'New value for the property (use color name or hex for fill)'
        },
        colorValue: {
          type: 'string',
          description: 'New color value (for fill property only)'
        },
        offsetX: {
          type: 'number',
          description: 'X offset to apply to all selected shapes (relative movement)'
        },
        offsetY: {
          type: 'number',
          description: 'Y offset to apply to all selected shapes (relative movement)'
        }
      },
      required: ['property']
    }
  },
  {
    name: 'arrangeSelectedShapes',
    description: 'Arrange currently selected shapes in a specific layout (row, column, grid, circle)',
    parameters: {
      type: 'object',
      properties: {
        arrangement: {
          type: 'string',
          enum: ['row', 'column', 'grid', 'circle', 'center'],
          description: 'Type of arrangement to apply to selected shapes'
        },
        spacing: {
          type: 'number',
          description: 'Space between shapes in the arrangement (default 20px)',
          default: 20
        },
        centerX: {
          type: 'number',
          description: 'Center X position for the arrangement'
        },
        centerY: {
          type: 'number',
          description: 'Center Y position for the arrangement'
        }
      },
      required: ['arrangement']
    }
  },
  {
    name: 'duplicateSelectedShapes',
    description: 'Create copies of the currently selected shapes',
    parameters: {
      type: 'object',
      properties: {
        offsetX: {
          type: 'number',
          description: 'X offset for the duplicated shapes (default 50px)',
          default: 50
        },
        offsetY: {
          type: 'number',
          description: 'Y offset for the duplicated shapes (default 50px)',
          default: 50
        },
        count: {
          type: 'number',
          description: 'Number of copies to create (default 1)',
          default: 1
        }
      }
    }
  },
  {
    name: 'alignSelectedShapes',
    description: 'Align currently selected shapes relative to each other or to the canvas',
    parameters: {
      type: 'object',
      properties: {
        alignment: {
          type: 'string',
          enum: ['left', 'center', 'right', 'top', 'middle', 'bottom'],
          description: 'How to align the selected shapes'
        },
        relativeTo: {
          type: 'string',
          enum: ['shapes', 'canvas'],
          description: 'Align relative to other shapes or canvas bounds',
          default: 'shapes'
        }
      },
      required: ['alignment']
    }
  }
];

// Helper function to parse color names to hex
export function parseColor(colorInput) {
  const colorMap = {
    'red': '#EF4444',
    'blue': '#3B82F6', 
    'green': '#10B981',
    'yellow': '#F59E0B',
    'purple': '#8B5CF6',
    'orange': '#F97316',
    'pink': '#EC4899',
    'gray': '#6B7280',
    'grey': '#6B7280',
    'black': '#000000',
    'white': '#FFFFFF'
  };
  
  if (colorInput.startsWith('#')) {
    return colorInput;
  }
  
  return colorMap[colorInput.toLowerCase()] || '#3B82F6';
}

// Helper function to get viewport center
export function getViewportCenter(stageRef, stageScale = 1, stagePosition = { x: 0, y: 0 }) {
  if (!stageRef?.current) {
    return { x: 400, y: 300 };
  }

  const stage = stageRef.current;
  const container = stage.container();
  if (!container) {
    return { x: 400, y: 300 };
  }

  const containerRect = container.getBoundingClientRect();
  const containerCenterX = containerRect.width / 2;
  const containerCenterY = containerRect.height / 2;

  const canvasX = (containerCenterX - stagePosition.x) / stageScale;
  const canvasY = (containerCenterY - stagePosition.y) / stageScale;

  return { x: canvasX, y: canvasY };
}

// Main AI service class
export class AICanvasService {
  constructor(canvasAPI) {
    this.canvasAPI = canvasAPI;
    this.isProcessing = false;
    this.conversationHistory = [];
  }

  async processCommand(userMessage, options = {}) {
    if (this.isProcessing) {
      throw new Error('AI is currently processing another command. Please wait.');
    }

    this.isProcessing = true;
    
    try {
      // Add user message to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      // Get current canvas state and selection context
      const canvasState = this.canvasAPI.getCanvasState();
      const selectedShapes = this.canvasAPI.canvas.getSelectedShapes();
      const selectionContext = {
        hasSelection: selectedShapes.length > 0,
        selectedCount: selectedShapes.length,
        selectedShapes: selectedShapes.map(shape => ({
          id: shape.id,
          type: shape.type,
          x: Math.round(shape.x),
          y: Math.round(shape.y),
          fill: shape.fill,
          text: shape.text
        }))
      };
      
      // Prepare system message with canvas and selection context
      const systemMessage = {
        role: 'system',
        content: `You are an AI assistant that manipulates a collaborative canvas through function calls. 

Current canvas state: ${JSON.stringify(canvasState, null, 2)}

Selection context: ${JSON.stringify(selectionContext, null, 2)}

Available shapes: rectangles, circles, triangles, text, and text_input.
Available colors: ${COLOR_PALETTE.join(', ')} or any hex code.

Guidelines:
- Use the getCanvasState function to understand current canvas contents
- If shapes are selected, prefer using selection-aware functions (modifySelectedShapes, arrangeSelectedShapes, etc.)
- For selection-aware commands like "make these red" or "arrange in a row", use the appropriate selection functions
- Position new shapes thoughtfully - avoid overlapping unless requested
- For "center" positions, use coordinates around (400, 300) as a reference
- When creating forms or layouts, ensure proper spacing and alignment
- For complex layouts, break into multiple function calls
- Always provide immediate, clear feedback about what you're creating

Selection-aware functions:
- modifySelectedShapes: Change properties (color, size, position, rotation) of selected shapes
- arrangeSelectedShapes: Arrange selected shapes in layouts (row, column, grid, circle, center)
- duplicateSelectedShapes: Create copies of selected shapes
- alignSelectedShapes: Align selected shapes to each other or canvas
- rotateShape: Rotate individual shapes by degrees (0-360)

Be creative but practical with positioning and sizing.`
      };

      // Make AI request with function calling
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [systemMessage, ...this.conversationHistory],
        functions: AI_FUNCTIONS,
        function_call: 'auto',
        temperature: 0.7,
        max_tokens: 1000
      });

      const message = response.choices[0].message;

      // Handle function calls
      if (message.function_call) {
        const result = await this.executeFunctionCall(message.function_call);
        
        // Add function call and result to conversation
        this.conversationHistory.push({
          role: 'assistant',
          content: null,
          function_call: message.function_call
        });

        this.conversationHistory.push({
          role: 'function',
          name: message.function_call.name,
          content: JSON.stringify(result)
        });

        // Get final response from AI
        const finalResponse = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [systemMessage, ...this.conversationHistory],
          temperature: 0.7,
          max_tokens: 200
        });

        const finalMessage = finalResponse.choices[0].message.content;
        
        this.conversationHistory.push({
          role: 'assistant',
          content: finalMessage
        });

        return {
          response: finalMessage,
          functionCalls: [message.function_call],
          results: [result]
        };
      } else {
        // No function call, just return the message
        this.conversationHistory.push({
          role: 'assistant',
          content: message.content
        });

        return {
          response: message.content,
          functionCalls: [],
          results: []
        };
      }

    } catch (error) {
      console.error('AI processing error:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  async executeFunctionCall(functionCall) {
    const { name, arguments: args } = functionCall;
    const parsedArgs = JSON.parse(args);

    console.log(`🤖 Executing AI function: ${name}`, parsedArgs);

    switch (name) {
      case 'createShape':
        return await this.canvasAPI.createShape(parsedArgs);
      
      case 'createText':
        return await this.canvasAPI.createText(parsedArgs);
        
      case 'moveShape':
        return await this.canvasAPI.moveShape(parsedArgs.shapeId, parsedArgs.x, parsedArgs.y);
        
      case 'resizeShape':
        return await this.canvasAPI.resizeShape(parsedArgs.shapeId, parsedArgs);
        
      case 'rotateShape':
        return await this.canvasAPI.rotateShape(parsedArgs.shapeId, parsedArgs.degrees);
        
      case 'changeShapeColor':
        return await this.canvasAPI.changeShapeColor(parsedArgs.shapeId, parsedArgs.fill);
        
      case 'deleteShape':
        return await this.canvasAPI.deleteShape(parsedArgs.shapeId);
        
      case 'getCanvasState':
        return this.canvasAPI.getCanvasState();
        
      case 'arrangeInRow':
        return await this.canvasAPI.arrangeInRow(parsedArgs);
        
      case 'arrangeInGrid':
        return await this.canvasAPI.arrangeInGrid(parsedArgs);
        
      case 'createLoginForm':
        return await this.canvasAPI.createLoginForm(parsedArgs);
        
      case 'createNavBar':
        return await this.canvasAPI.createNavBar(parsedArgs);
        
      case 'createCardLayout':
        return await this.canvasAPI.createCardLayout(parsedArgs);
        
      // Selection-aware functions
      case 'modifySelectedShapes':
        return await this.canvasAPI.modifySelectedShapes(parsedArgs);
        
      case 'arrangeSelectedShapes':
        return await this.canvasAPI.arrangeSelectedShapes(parsedArgs);
        
      case 'duplicateSelectedShapes':
        return await this.canvasAPI.duplicateSelectedShapes(parsedArgs);
        
      case 'alignSelectedShapes':
        return await this.canvasAPI.alignSelectedShapes(parsedArgs);
        
      default:
        throw new Error(`Unknown function: ${name}`);
    }
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getHistory() {
    return [...this.conversationHistory];
  }
}

export default AICanvasService;
