/**
 * AI Canvas Agent - OpenAI Integration with LangChain ReAct Reasoning
 * 
 * A comprehensive AI agent that manipulates the collaborative canvas through natural language
 * using both OpenAI's function calling capabilities and LangChain ReAct reasoning for complex tasks.
 * 
 * Features:
 * - Simple commands: Direct OpenAI function calling (fast execution)
 * - Complex commands: LangChain ReAct reasoning (multi-step planning)
 * - 6+ distinct command categories (Creation, Manipulation, Layout, Complex)
 * - Multi-user support without conflicts
 * - Real-time sync across all users
 */

import { SHAPE_TYPES, DEFAULT_SHAPE_PROPS, COLOR_PALETTE } from '../utils/constants';
import { CanvasReActAgent } from './ai/agent.js';

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
    description: 'Create multiple shapes with automatic layout. Supports grid formats like "3x3" meaning 3 rows and 3 columns (9 total shapes).',
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
          description: 'Color for all shapes'
        },
        width: {
          type: 'number',
          description: 'Width for each shape (for rectangles)'
        },
        height: {
          type: 'number',
          description: 'Height for each shape (for rectangles)'
        }
      },
      required: ['shapeType', 'count']
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
    
    // Initialize LangChain ReAct agent for complex reasoning
    this.reactAgent = new CanvasReActAgent(canvasAPI);
  }

  /**
   * Detect if a command requires complex multi-step reasoning
   */
  _isComplexCommand(userMessage) {
    const complexPatterns = [
      // Multi-step UI creation
      /login\s+form/i,
      /registration\s+form/i,
      /signup\s+form/i,
      /navigation\s+(bar|menu)/i,
      /nav\s+(bar|menu)/i,
      /card\s+layout/i,
      
      // Layout and organization requests
      /arrange.*in.*grid/i,
      /organize.*evenly/i,
      /distribute.*evenly/i,
      /align.*center/i,
      /make.*same\s+size/i,
      /resize.*all/i,
      /create.*grid\s+of/i,
      /\d+x\d+.*grid/i,
      /center.*on.*canvas/i,
      /center\s+it/i,
      
      // Styling modifiers with specific attributes
      /with.*red.*text/i,
      /with.*blue.*button/i,
      /with.*\w+.*text/i, // "with [color] text"
      /with.*color/i,
      /make.*text.*red/i,
      /change.*text.*color/i,
      /red.*text/i,
      
      // Multi-object operations
      /create.*and.*arrange/i,
      /make.*then.*move/i,
      /several.*shapes/i,
      /multiple.*elements/i,
      /create.*\d+.*shapes/i, // "create 5 shapes"
      
      // Complex requests with "and"
      /create.*and.*make/i,
      /add.*and.*position/i,
      /build.*with.*styling/i,
      /create.*and.*center/i,
      
      // Sequential actions indicated by words
      /first.*then/i,
      /after.*do/i,
      /once.*complete/i,
      /then.*make/i,
      /then.*change/i,
      
      // Requests with multiple requirements
      /\w+.*and.*\w+.*and/i, // multiple "and" clauses
      /.*(create|make|add).*and.*(move|position|center|color|style)/i,
    ];
    
    return complexPatterns.some(pattern => pattern.test(userMessage));
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

      // Check if this is a complex command that requires ReAct reasoning
      if (this._isComplexCommand(userMessage)) {
        console.log('🧠 Using ReAct agent for complex command');
        
        try {
          const result = await this.reactAgent.processCommand(userMessage);
          const processingTime = Date.now() - startTime;
          
          return {
            response: result.response,
            functionCalls: [], // ReAct agent handles this internally
            results: [],
            processingTime,
            reasoning: result.reasoning,
            agentUsed: 'react'
          };
        } catch (error) {
          console.warn('⚠️ ReAct agent failed, falling back to standard processing:', error.message);
          // Fall through to standard processing
        }
      }
      
      console.log('🔧 Using standard OpenAI function calling');
      return await this._processWithFunctionCalling(userMessage, startTime);
      
    } catch (error) {
      console.error('❌ AI processing error:', error);
      throw new Error(`AI processing failed: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process command using the original OpenAI function calling approach
   */
  async _processWithFunctionCalling(userMessage, startTime) {
      // Refresh canvas context to ensure we have the latest data
      if (this.canvasAPI.refreshContext) {
        this.canvasAPI.refreshContext();
      }

      // Get the most current canvas state
      const currentCanvasState = this.canvasAPI.getCanvasState();
      console.log('🎯 Current canvas state for AI:', {
        shapesCount: currentCanvasState.totalShapes,
        shapes: currentCanvasState.shapes.slice(0, 3).map(s => `${s.type} at (${s.x}, ${s.y})`)
      });

      // Prepare conversation with system context
      const messages = [
        {
          role: 'system',
          content: `You are an AI assistant that manipulates a collaborative canvas through function calls. 

CURRENT CANVAS STATE:
${JSON.stringify(currentCanvasState, null, 2)}

SHAPE IDENTIFICATION SYSTEM:
- Identify shapes by natural language descriptions like "blue rectangle", "red circle", "large triangle"
- Use color, type, size, and text content to identify shapes
- Supported colors: blue, red, green, yellow, purple, pink, orange, gray, black, white
- Supported types: rectangle, circle, triangle, text, input field, line, bezier curve
- Size descriptors: large/big, small/tiny
- Examples: "delete the blue rectangle", "move the red circle to 200, 300", "resize the large triangle"

ENHANCED COMMAND PARSING:
- Coordinates: "at position 100, 200" or "at coordinates (100, 200)" → x: 100, y: 200
- Dimensions: "200x300" or "200 by 300" → width: 200, height: 300  
- Scale factors: "twice as big" → scale: 2.0, "half the size" → scale: 0.5, "three times bigger" → scale: 3.0
- Grid formats: "3x3 grid" → 3 rows, 3 columns = 9 shapes total
- Shape selection: "these shapes" refers to recently created or currently selected shapes

GUIDELINES:
- ALWAYS use listShapes() first if user asks about existing shapes
- Create visually appealing, well-positioned layouts
- Use appropriate colors from the palette: ${COLOR_PALETTE.join(', ')}
- Position elements to avoid overlaps when possible
- For complex layouts (forms, navigation), create professional spacing
- Text and text inputs use dark colors (#1F2937) unless on dark backgrounds
- All dimensions are in pixels - use actual pixel values for width, height, radius
- Position values are direct canvas coordinates in pixels (not centimeters)
- Size/scale means actual width and height dimensions in pixels
- Always provide clear feedback about what you're creating

RESPONSE REQUIREMENTS:
- CRITICAL: Always respond conversationally, never with technical function details
- Use natural, friendly language like "I can see...", "Perfect! I've moved...", "Done!"
- Describe results in terms the user understands (colors, shapes, positions)
- Confirm what you accomplished, not what function you called
- Be enthusiastic and helpful with phrases like "Great!", "Perfect!", "Excellent!"
- NEVER mention function names, IDs, or technical implementation details

COMMAND CATEGORIES YOU SUPPORT:
1. Creation: Create shapes, text, and elements
2. Manipulation: Move, resize, rotate, recolor, and modify text content of existing shapes  
3. Layout: Arrange multiple shapes in patterns, create grids
4. Complex: Build complete UI components (forms, navigation, cards)
5. Text Editing: Change text content of existing text shapes and labels

Be helpful and creative while following the user's intent precisely. Always respond conversationally to engage with the user.`
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
          
          // Enhance response with function result details for better user feedback
          // Always provide conversational responses instead of technical logs
          // Override any response to ensure consistent user-friendly messaging
          {
            switch (functionCall.name) {
              case 'listShapes':
                if (result && result.length > 0) {
                  aiResponse = `I can see ${result.length} shape${result.length > 1 ? 's' : ''} on the canvas:\n\n` +
                    result.map(shape => `• ${shape.description}`).join('\n');
                } else {
                  aiResponse = "The canvas is currently empty - no shapes are present.";
                }
                break;
                
              case 'getCanvasState':
                if (result && result.shapes && result.shapes.length > 0) {
                  aiResponse = `I can see ${result.totalShapes} shape${result.totalShapes > 1 ? 's' : ''} on the canvas:\n\n` +
                    result.shapes.map(shape => `• ${this.getShapeDescription(shape)} at (${shape.x}, ${shape.y})`).join('\n');
                } else {
                  aiResponse = "The canvas is currently empty - no shapes are present.";
                }
                break;
                
              case 'deleteShape':
                if (result && result.description) {
                  aiResponse = `✅ Done! I've deleted the ${result.description}.`;
                } else {
                  aiResponse = `✅ Done! I've deleted the shape.`;
                }
                break;
                
              case 'moveShape':
                if (result && result.description) {
                  aiResponse = `✅ Perfect! I've moved the ${result.description} to position (${result.x}, ${result.y}).`;
                } else {
                  aiResponse = `✅ Done! I've moved the shape to the new position.`;
                }
                break;
                
              case 'resizeShape':
                if (result && result.description) {
                  const sizeInfo = result.width ? `${result.width}×${result.height}px` : 
                                  result.radiusX ? `${result.radiusX * 2}px diameter` : 'new size';
                  aiResponse = `✅ Perfect! I've resized the ${result.description} to ${sizeInfo}.`;
                } else {
                  aiResponse = `✅ Done! I've resized the shape.`;
                }
                break;
                
              case 'rotateShape':
                if (result && result.description) {
                  aiResponse = `✅ Great! I've rotated the ${result.description} to ${result.rotation}°.`;
                } else {
                  aiResponse = `✅ Done! I've rotated the shape.`;
                }
                break;
                
              case 'changeShapeColor':
                if (result && result.description && result.fill) {
                  const colorName = this.getColorName(result.fill);
                  const colorText = colorName ? colorName : result.fill;
                  aiResponse = `✅ Excellent! I've changed the shape's color to ${colorText}.`;
                } else {
                  aiResponse = `✅ Done! I've changed the shape's color.`;
                }
                break;

              case 'changeShapeText':
                if (result && result.description && result.text) {
                  aiResponse = `✅ Perfect! I've updated the text to "${result.text}".`;
                } else {
                  aiResponse = `✅ Done! I've updated the text content.`;
                }
                break;
                
              case 'createShape':
                if (result && result.type) {
                  const shapeDesc = this.getShapeDescription(result);
                  aiResponse = `✅ Created! I've added a ${shapeDesc} to the canvas.`;
                } else {
                  aiResponse = `✅ Done! I've created the shape.`;
                }
                break;
                
              case 'createMultipleShapes':
                if (result && result.shapes) {
                  aiResponse = `✅ Awesome! I've created ${result.shapes.length} ${result.shapeType}s arranged in a ${result.arrangement}.`;
                } else {
                  aiResponse = `✅ Done! I've created multiple shapes for you.`;
                }
                break;
                
              case 'createLoginForm':
                if (result && result.components) {
                  aiResponse = `✅ Perfect! I've created a login form with ${result.components.length} components (username field, password field, and login button).`;
                } else {
                  aiResponse = `✅ Done! I've created a login form for you.`;
                }
                break;
                
              case 'createNavigationBar':
                if (result && result.components) {
                  aiResponse = `✅ Great! I've created a navigation bar with ${result.components.length} menu items.`;
                } else {
                  aiResponse = `✅ Done! I've created a navigation bar for you.`;
                }
                break;
                
              case 'createCardLayout':
                if (result && result.components) {
                  aiResponse = `✅ Excellent! I've created a card layout with title and content areas.`;
                } else {
                  aiResponse = `✅ Done! I've created a card layout for you.`;
                }
                break;
                
              default:
                aiResponse = `✅ Done! I've completed your request.`;
            }
          }
        } catch (error) {
          console.error('❌ Function execution failed:', error);
          const errorMsg = error.message.includes('Shape not found') 
            ? `I couldn't find that shape. ${error.message}` 
            : `There was an issue executing the command: ${error.message}`;
          aiResponse += `\n\n${errorMsg}`;
        }
      }

      // Ensure we always have a meaningful, conversational response
      if (!aiResponse || aiResponse.trim() === '') {
        aiResponse = '✅ Done! I\'ve completed your request.';
      }
      
      // Additional check to avoid technical responses
      if (aiResponse.includes('function') || aiResponse.includes('executed') || aiResponse.includes('called')) {
        aiResponse = '✅ Perfect! I\'ve completed what you asked for.';
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
        processingTime,
        agentUsed: 'function-calling'
      };
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
      
      case 'changeShapeText':
        return await this.canvasAPI.changeShapeText(parsedArgs.shapeId, parsedArgs.newText);
      
      case 'createMultipleShapes':
        return await this.canvasAPI.createMultipleShapes(parsedArgs);
      
      case 'arrangeShapes':
        // Handle "these shapes" reference
        if (parsedArgs.shapeIds && (parsedArgs.shapeIds.includes('these') || parsedArgs.shapeIds.includes('recent'))) {
          const recentShapes = this.canvasAPI.resolveTheseShapes();
          parsedArgs.shapeIds = recentShapes.map(shape => shape.id);
          console.log('🔗 Resolved "these shapes" to:', parsedArgs.shapeIds.length, 'shapes');
        }
        return await this.canvasAPI.arrangeShapes(parsedArgs);
        
      case 'createLoginForm':
        return await this.canvasAPI.createLoginForm(parsedArgs);
        
      case 'createNavigationBar':
        return await this.canvasAPI.createNavigationBar(parsedArgs);
        
      case 'createCardLayout':
        return await this.canvasAPI.createCardLayout(parsedArgs);
        
      case 'getCanvasState':
        return this.canvasAPI.getCanvasState();
      
      case 'listShapes':
        return this.canvasAPI.listShapes();
      
      case 'identifyShape':
        const shape = this.canvasAPI.findShape(parsedArgs.shapeId);
        if (!shape) {
          return { error: `Shape not found: ${parsedArgs.shapeId}`, availableShapes: this.canvasAPI.listShapes() };
        }
        return {
          found: true,
          shape: {
            id: shape.id,
            friendlyId: this.canvasAPI.extractFriendlyId(shape.id),
            type: shape.type,
            description: this.canvasAPI.getShapeDescription(shape),
            position: `(${Math.round(shape.x || 0)}, ${Math.round(shape.y || 0)})`,
            fill: shape.fill
          }
        };
      
      case 'deleteShape':
        return await this.canvasAPI.deleteShape(parsedArgs.shapeId);
        
      default:
        throw new Error(`Unknown function: ${name}`);
    }
  }

  /**
   * Get human-readable description of a shape
   */
  getShapeDescription(shape) {
    const colorName = this.getColorName(shape.fill);
    const colorPrefix = colorName ? `${colorName} ` : '';
    
    switch (shape.type) {
      case 'rectangle':
        const width = shape.width || 100;
        const height = shape.height || 100;
        const rectType = Math.abs(width - height) < 20 ? 'square' : 'rectangle';
        return `${colorPrefix}${width}×${height}px ${rectType}`;
      case 'circle':
        const radiusX = shape.radiusX || 50;
        const radiusY = shape.radiusY || 50;
        const shapeType = Math.abs(radiusX - radiusY) < 5 ? 'circle' : 'oval';
        return radiusX === radiusY ? 
          `${colorPrefix}${radiusX * 2}px ${shapeType}` : 
          `${colorPrefix}${radiusX * 2}×${radiusY * 2}px ${shapeType}`;
      case 'text':
        return `${colorPrefix}text "${shape.text || 'Text'}"`;
      case 'text_input':
        return `${colorPrefix}input field "${shape.text || 'Input Field'}"`;
      case 'line':
        return `${colorPrefix}drawn line`;
      case 'triangle':
        return `${colorPrefix}triangle`;
      default:
        return `${colorPrefix}${shape.type} shape`;
    }
  }

  /**
   * Get color name from hex value
   */
  getColorName(hexColor) {
    if (!hexColor) return '';
    
    const color = hexColor.toLowerCase();
    
    // Common color mappings
    const colorNames = {
      '#3b82f6': 'blue', '#2563eb': 'blue', '#1d4ed8': 'blue', '#1e40af': 'blue',
      '#ef4444': 'red', '#dc2626': 'red', '#b91c1c': 'red', '#991b1b': 'red',
      '#10b981': 'green', '#059669': 'green', '#047857': 'green', '#065f46': 'green',
      '#eab308': 'yellow', '#ca8a04': 'yellow', '#a16207': 'yellow', '#854d0e': 'yellow',
      '#8b5cf6': 'purple', '#7c3aed': 'purple', '#6d28d9': 'purple', '#5b21b6': 'purple',
      '#ec4899': 'pink', '#db2777': 'pink', '#be185d': 'pink', '#9d174d': 'pink',
      '#f97316': 'orange', '#ea580c': 'orange', '#c2410c': 'orange', '#9a3412': 'orange',
      '#6b7280': 'gray', '#4b5563': 'gray', '#374151': 'gray', '#1f2937': 'gray',
      '#000000': 'black', '#111827': 'black', '#030712': 'black',
      '#ffffff': 'white', '#f9fafb': 'white', '#f3f4f6': 'white', '#e5e7eb': 'white'
    };
    
    return colorNames[color] || '';
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
