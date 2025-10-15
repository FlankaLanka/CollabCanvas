import { SHAPE_TYPES, DEFAULT_SHAPE_PROPS, COLOR_PALETTE } from '../utils/constants';
import { 
  getViewportCenter as getImprovedViewportCenter, 
  snapPositionToGrid, 
  getCanvasBounds,
  LAYOUT_CONSTANTS 
} from './aiLayoutHelpers';

// API endpoint for OpenAI requests (proxied through our backend)
const AI_API_ENDPOINT = '/api/ai-chat';

// Helper function to make requests to our backend AI API
async function makeAIRequest(messages, functions = null, function_call = null) {
  try {
    console.log('🤖 Making AI request to:', AI_API_ENDPOINT);
    
    const response = await fetch(AI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        functions,
        function_call
      })
    });

    console.log('📡 AI API response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        console.error('❌ AI API error details:', errorData);
      } catch (e) {
        console.error('❌ Could not parse error response:', e);
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ AI API success');
    return result;

  } catch (error) {
    console.error('❌ AI API request failed:', error);
    throw error;
  }
}

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
    name: 'createMultipleShapes',
    description: 'Create multiple shapes of the same type at once. Use this for requests like "create 5 circles" or "make 3 rectangles".',
    parameters: {
      type: 'object',
      properties: {
        shapeType: {
          type: 'string',
          enum: ['rectangle', 'circle', 'triangle'],
          description: 'Type of shapes to create'
        },
        count: {
          type: 'number',
          minimum: 2,
          maximum: 20,
          description: 'Number of shapes to create (2-20)'
        },
        startX: {
          type: 'number',
          description: 'Starting X position for the first shape'
        },
        startY: {
          type: 'number',
          description: 'Starting Y position for the first shape'
        },
        spacing: {
          type: 'number',
          description: 'Space between shapes (default 80px)',
          default: 80
        },
        arrangement: {
          type: 'string',
          enum: ['row', 'column', 'grid', 'scattered'],
          description: 'How to arrange the shapes',
          default: 'row'
        },
        width: {
          type: 'number',
          description: 'Width of the shapes (for rectangles)'
        },
        height: {
          type: 'number',
          description: 'Height of the shapes (for rectangles)'
        },
        radius: {
          type: 'number',
          description: 'Radius of the shapes (for circles)'
        },
        scale: {
          type: 'number',
          description: 'Scale factor for triangles (default 1.0)'
        },
        fill: {
          type: 'string',
          description: 'Color of the shapes (hex code or color name)'
        }
      },
      required: ['shapeType', 'count', 'startX', 'startY']
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
    description: 'Create a complete login form with username, password, and submit button. Automatically positioned in viewport center if no coordinates specified.',
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'Optional X position for the form (defaults to viewport center)'
        },
        y: {
          type: 'number',
          description: 'Optional Y position for the form (defaults to viewport center)'
        },
        width: {
          type: 'number',
          description: 'Optional width of the form elements (defaults to responsive width)'
        }
      },
      required: []
    }
  },
  {
    name: 'createNavBar',
    description: 'Create a navigation bar with menu items. Automatically positioned in viewport if no coordinates specified.',
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'Optional X position for the nav bar (defaults to viewport positioning)'
        },
        y: {
          type: 'number',
          description: 'Optional Y position for the nav bar (defaults to viewport positioning)'
        },
        width: {
          type: 'number',
          description: 'Total width of the nav bar (default 800px)'
        },
        menuItems: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of menu item names'
        }
      },
      required: ['menuItems']
    }
  },
  {
    name: 'createCardLayout',
    description: 'Create a card layout with title, content area, and optional action buttons. Automatically positioned in viewport if no coordinates specified.',
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'Optional X position for the card (defaults to viewport center)'
        },
        y: {
          type: 'number',
          description: 'Optional Y position for the card (defaults to viewport center)'
        },
        width: {
          type: 'number',
          description: 'Width of the card (default 300px)'
        },
        height: {
          type: 'number',
          description: 'Height of the card (default 200px)'
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
      required: ['title']
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

// Legacy helper function - now delegates to improved layout helpers
export function getViewportCenter(stageRef, stageScale = 1, stagePosition = { x: 0, y: 0 }) {
  // Create canvas context from parameters
  const canvasContext = {
    stageRef,
    stageScale,
    stagePosition
  };
  
  // Use improved layout helper that includes grid snapping
  return getImprovedViewportCenter(canvasContext);
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

      // Get current canvas state
      const canvasState = this.canvasAPI.getCanvasState();
      
      // Prepare system message with canvas context
      const systemMessage = {
        role: 'system',
        content: `You are an AI assistant that manipulates a collaborative canvas through function calls. You excel at understanding user intent and creating well-positioned, aesthetically pleasing layouts.

CURRENT CONTEXT:
Canvas state: ${JSON.stringify(canvasState, null, 2)}

AVAILABLE SHAPES: rectangles, circles, triangles, text, text_input
AVAILABLE COLORS: ${COLOR_PALETTE.join(', ')} or any hex code (#RRGGBB format)

FUNCTION SELECTION GUIDELINES:

🔢 QUANTITY HANDLING:
- For requests with quantities (e.g., "create 5 circles", "make 3 rectangles"):
  → Use createMultipleShapes() function
  → Choose appropriate arrangement: 'row', 'column', 'grid', or 'scattered'
  → Consider spacing (default 80px, adjust for aesthetics)

📍 POSITIONING STRATEGY:
- All positions are automatically snapped to 8px grid for consistency
- Use viewport center (dynamic based on user's current view)
- Elements are kept within canvas bounds automatically
- Avoid overlapping with existing shapes when possible
- Leave generous spacing for readability (20px vertical, 16px horizontal defaults)

🎨 LAYOUT FUNCTIONS (SMART POSITIONING):
- createLoginForm(): Complete form with proper labels, inputs, and button
  → CALL WITHOUT coordinates for automatic viewport centering: createLoginForm({})
  → The system will automatically position it optimally in the user's current view
- createNavBar(): Horizontal navigation with evenly distributed menu items
- createCardLayout(): Structured card with title, content, and styling

⚠️ CRITICAL POSITIONING RULES:
- For UI layouts (forms, cards, navigation): OMIT x/y coordinates to enable smart centering
- For individual shapes: Provide specific coordinates only when user specifies location
- NEVER use coordinates like (0,0) or arbitrary small numbers for UI layouts

🎯 SHAPE MANIPULATION:
- createShape(): Create individual shapes with specific properties
- createText(): Add text or text input elements
- moveShape(): Move existing shapes to new positions
- resizeShape(): Change size/dimensions of shapes
- rotateShape(): Rotate shapes by degrees
- changeShapeColor(): Update shape colors
- deleteShape(): Remove shapes from canvas

📏 SPACING & ALIGNMENT:
- All layouts use consistent spacing (20px vertical, 16px horizontal defaults)
- Forms: Professional spacing with proper labels and field alignment
- Multiple shapes: Smart spacing based on arrangement type
- Text alignment: 'left' for labels, 'center' for titles, 'left' for inputs
- Elements are automatically grouped for easier manipulation

🎯 USER INTENT RECOGNITION:
- "create a login form" → createLoginForm({}) // NO coordinates for auto-centering!
- "make a login form" → createLoginForm({}) // Let system choose optimal position
- "add login form at 300, 200" → createLoginForm({ x: 300, y: 200 }) // Only when user specifies
- "create navigation with Home, About" → createNavBar({ menuItems: ["Home", "About"] }) // Auto-positioned
- "make a card with Welcome title" → createCardLayout({ title: "Welcome" }) // Auto-centered  
- "5 circles" → createMultipleShapes with count=5, arrangement='row'
- "move the red circle" → moveShape to new position
- "make the rectangle bigger" → resizeShape with new dimensions

📋 POSITIONING EXAMPLES:
✅ CORRECT: createLoginForm({}) // Auto-centers in viewport
✅ CORRECT: createNavBar({ menuItems: ["Home", "About"] }) // Auto-positions at top
✅ CORRECT: createCardLayout({ title: "Welcome", content: "Hello" }) // Auto-centers
✅ CORRECT: createLoginForm({ width: 350 }) // Custom width, auto-position
❌ WRONG: createLoginForm({ x: 0, y: 0 }) // Don't default to origin
❌ WRONG: createNavBar({ x: 100, y: 50, menuItems: ["Home"] }) // Don't guess coordinates

Always provide clear, immediate feedback about what you're creating and where. Focus on individual shape operations rather than selection-based operations.`
      };

      // Make AI request with function calling
      const response = await makeAIRequest(
        [systemMessage, ...this.conversationHistory],
        AI_FUNCTIONS,
        'auto'
      );

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
        const finalResponse = await makeAIRequest(
          [systemMessage, ...this.conversationHistory]
        );

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
      
      case 'createMultipleShapes':
        return await this.canvasAPI.createMultipleShapes(parsedArgs);
      
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
