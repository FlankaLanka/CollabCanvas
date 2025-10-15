/**
 * AI Canvas Agent - OpenAI Integration
 * 
 * A comprehensive AI agent that manipulates the collaborative canvas through natural language
 * using OpenAI's function calling capabilities.
 * 
 * Requirements:
 * - 6+ distinct command categories (Creation, Manipulation, Layout, Complex)
 * - Response times under 2 seconds for simple commands
 * - Multi-user support without conflicts
 * - Real-time sync across all users
 */

import { SHAPE_TYPES, DEFAULT_SHAPE_PROPS, COLOR_PALETTE } from '../utils/constants';

// Environment detection
const isDevelopment = import.meta.env.DEV;

// API endpoint configuration
const AI_API_ENDPOINT = isDevelopment 
  ? 'http://localhost:3001/api/ai-chat'  // Local Express server for development
  : '/api/ai-chat';                       // Vercel/Netlify serverless function for production

// AI Function Definitions for Canvas Operations
const AI_FUNCTIONS = [
  // CREATION COMMANDS
  {
    name: 'createShape',
    description: 'Create a new shape on the canvas',
    parameters: {
      type: 'object',
      properties: {
        shapeType: {
          type: 'string',
          enum: ['rectangle', 'circle', 'triangle', 'line', 'text', 'text_input'],
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
        color: {
          type: 'string',
          description: 'New color (hex code or color name)'
        }
      },
      required: ['shapeId', 'color']
    }
  },

  // LAYOUT COMMANDS
  {
    name: 'createMultipleShapes',
    description: 'Create multiple shapes with automatic layout',
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
          description: 'Number of shapes to create'
        },
        arrangement: {
          type: 'string',
          enum: ['row', 'column', 'grid'],
          description: 'How to arrange the shapes'
        },
        startX: {
          type: 'number',
          description: 'Starting X position'
        },
        startY: {
          type: 'number',
          description: 'Starting Y position'
        },
        spacing: {
          type: 'number',
          description: 'Space between shapes'
        },
        fill: {
          type: 'string',
          description: 'Color for all shapes'
        }
      },
      required: ['shapeType', 'count', 'startX', 'startY']
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
          description: 'Width of the form (default: 300)'
        }
      },
      required: ['x', 'y']
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
    description: 'Get current canvas state and shapes',
    parameters: {
      type: 'object',
      properties: {},
      required: []
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
  }
];

/**
 * AI Canvas Service - Handles natural language commands and executes canvas operations
 */
export class AICanvasService {
  constructor(canvasAPI) {
    this.canvasAPI = canvasAPI;
    this.conversationHistory = [];
    this.isProcessing = false;
  }

  /**
   * Process a natural language command and execute canvas operations
   */
  async processCommand(userMessage) {
    if (this.isProcessing) {
      throw new Error('AI is currently processing another command. Please wait.');
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      console.log('🤖 Processing AI command:', userMessage);

      // Prepare conversation with system context
      const messages = [
        {
          role: 'system',
          content: `You are an AI assistant that manipulates a collaborative canvas through function calls. 

CURRENT CANVAS STATE:
${JSON.stringify(this.canvasAPI.getCanvasState(), null, 2)}

GUIDELINES:
- Create visually appealing, well-positioned layouts
- Use appropriate colors from the palette: ${COLOR_PALETTE.join(', ')}
- Position elements to avoid overlaps when possible
- For complex layouts (forms, navigation), create professional spacing
- Text and text inputs use dark colors (#1F2937) unless on dark backgrounds
- All dimensions are in pixels - use actual pixel values for width, height, radius
- Position values are direct canvas coordinates in pixels (not centimeters)
- Size/scale means actual width and height dimensions in pixels
- Always provide clear feedback about what you're creating

COMMAND CATEGORIES YOU SUPPORT:
1. Creation: Create shapes, text, and elements
2. Manipulation: Move, resize, rotate, recolor existing shapes  
3. Layout: Arrange multiple shapes in patterns, create grids
4. Complex: Build complete UI components (forms, navigation, cards)

Be helpful and creative while following the user's intent precisely.`
        },
        ...this.conversationHistory,
        {
        role: 'user',
        content: userMessage
        }
      ];

      // Always use API proxy for security and CORS compliance
      console.log(`📡 Using API proxy (${isDevelopment ? 'development' : 'production'})`);
      const response = await fetch(AI_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          functions: AI_FUNCTIONS,
          function_call: 'auto'
        })
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        // Special handling for development connection errors
        if ((response.status === 404 || !response.ok) && isDevelopment) {
          errorMessage = `Local AI server not running.

To enable AI features in development:

1. Install server dependencies:
   npm install express cors dotenv node-fetch

2. Set your OpenAI API key:
   export OPENAI_API_KEY="your-api-key-here"

3. Start the local AI server:
   npm run dev:server
   (or run both: npm run dev:full)

4. The AI server should be running at ${AI_API_ENDPOINT}

Alternative: Deploy to Vercel/Netlify to test AI features in production.`;
        }
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('❌ AI API error details:', errorData);
        } catch (e) {
          // Don't log JSON parse errors for 404s as they're expected
          if (response.status !== 404) {
            console.error('❌ Could not parse error response:', e);
          }
        }

        throw new Error(errorMessage);
      }

      const completion = await response.json();

      const responseMessage = completion.choices[0].message;
      let aiResponse = responseMessage.content || 'I\'ve executed your request.';
      const functionCalls = [];
      const results = [];

      // Execute function calls if any
      if (responseMessage.function_call) {
        const functionCall = responseMessage.function_call;
        functionCalls.push(functionCall);

        try {
          const result = await this.executeFunctionCall(functionCall);
          results.push(result);
          console.log('✅ Function executed successfully:', functionCall.name);
        } catch (error) {
          console.error('❌ Function execution failed:', error);
          aiResponse += `\n\nNote: There was an issue executing the command: ${error.message}`;
        }
      }

      // Update conversation history
      this.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: aiResponse, function_call: responseMessage.function_call }
      );

      // Keep conversation history manageable
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      const processingTime = Date.now() - startTime;
      console.log(`⚡ AI processing completed in ${processingTime}ms`);

      return {
        response: aiResponse,
        functionCalls,
        results,
        processingTime
      };

    } catch (error) {
      console.error('❌ AI processing error:', error);
      throw new Error(`AI processing failed: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a function call from the AI
   */
  async executeFunctionCall(functionCall) {
    const { name, arguments: args } = functionCall;
    const parsedArgs = JSON.parse(args);

    console.log('🔧 Executing function:', name, 'with args:', parsedArgs);

    switch (name) {
      case 'createShape':
        return await this.canvasAPI.createShape(parsedArgs);
        
      case 'moveShape':
        return await this.canvasAPI.moveShape(parsedArgs.shapeId, parsedArgs.x, parsedArgs.y);
        
      case 'resizeShape':
        return await this.canvasAPI.resizeShape(parsedArgs.shapeId, parsedArgs);
        
      case 'rotateShape':
        return await this.canvasAPI.rotateShape(parsedArgs.shapeId, parsedArgs.degrees);
        
      case 'changeShapeColor':
        return await this.canvasAPI.changeShapeColor(parsedArgs.shapeId, parsedArgs.color);
      
      case 'createMultipleShapes':
        return await this.canvasAPI.createMultipleShapes(parsedArgs);
      
      case 'arrangeShapes':
        return await this.canvasAPI.arrangeShapes(parsedArgs);
        
      case 'createLoginForm':
        return await this.canvasAPI.createLoginForm(parsedArgs);
        
      case 'createNavigationBar':
        return await this.canvasAPI.createNavigationBar(parsedArgs);
        
      case 'createCardLayout':
        return await this.canvasAPI.createCardLayout(parsedArgs);
        
      case 'getCanvasState':
        return this.canvasAPI.getCanvasState();
      
      case 'deleteShape':
        return await this.canvasAPI.deleteShape(parsedArgs.shapeId);
      
      default:
        throw new Error(`Unknown function: ${name}`);
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return [...this.conversationHistory];
  }
}

export default AICanvasService;
