/**
 * Local Development Server for AI API
 * 
 * This provides the /api/ai-chat endpoint for local development.
 * Run this alongside your Vite dev server to enable AI features.
 * 
 * Usage:
 * 1. Set OPENAI_API_KEY environment variable
 * 2. Run: node server.js
 * 3. Update AI_API_ENDPOINT in ai.js to http://localhost:3001/api/ai-chat
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Import AI_FUNCTIONS directly to avoid import.meta.env issues in Node.js
const AI_FUNCTIONS = [
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
        },
        radiusX: {
          type: 'number',
          description: 'X radius for circles (use instead of width)'
        },
        radiusY: {
          type: 'number',
          description: 'Y radius for circles (use instead of height)'
        }
      },
      required: ['shapeType', 'count']
    }
  },
  // SINGLE SHAPE CREATION
  {
    name: 'createShape',
    description: 'Create a new shape on the canvas. If x and y are not specified, shape will be created at origin (0,0).',
    parameters: {
      type: 'object',
      properties: {
        shapeType: {
          type: 'string',
          enum: ['rectangle', 'circle', 'triangle', 'line', 'text', 'text_input', 'bezier_curve'],
          description: 'Type of shape to create'
        },
        x: {
          oneOf: [
            { type: 'number', description: 'X position on canvas' },
            { type: 'string', description: 'X position on canvas ("center" for origin at 0,0)' }
          ]
        },
        y: {
          oneOf: [
            { type: 'number', description: 'Y position on canvas' },
            { type: 'string', description: 'Y position on canvas ("center" for origin at 0,0)' }
          ]
        },
        width: {
          type: 'number',
          description: 'Width of the shape (for rectangles)'
        },
        height: {
          type: 'number',
          description: 'Height of the shape (for rectangles)'
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
      required: ['shapeId', 'scale']
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
    description: 'Change the text content of an existing text shape',
    parameters: {
      type: 'object',
      properties: {
        shapeDescription: {
          type: 'string',
          description: 'Natural language description of the text shape'
        },
        newText: {
          type: 'string',
          description: 'New text content'
        }
      },
      required: ['shapeId', 'newText']
    }
  },
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
  // LAYOUT COMMANDS
  {
    name: 'arrangeShapes',
    description: 'Arrange existing shapes in a pattern',
    parameters: {
      type: 'object',
      properties: {
        arrangement: {
          type: 'string',
          enum: ['row', 'column', 'grid', 'circle'],
          description: 'Arrangement pattern'
        },
        spacing: {
          type: 'number',
          description: 'Space between shapes'
        }
      },
      required: ['arrangement']
    }
  }
];
import { CommandParser } from './command-parser.js';

dotenv.config();

// Add fetch for Node.js if not available
if (!globalThis.fetch) {
  const { default: fetch } = await import('node-fetch');
  globalThis.fetch = fetch;
}

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// AI Chat endpoint (same logic as api/ai-chat.js)
app.post('/api/ai-chat', async (req, res) => {
  try {
    // Validate OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error('❌ OpenAI API key not configured');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY or VITE_OPENAI_API_KEY environment variable.' 
      });
    }

    // Extract request data
    const { messages, functions, function_call, canvasState } = req.body;
    
    // Use the AI functions defined at the top of the file
    // (The AI_FUNCTIONS array is already defined at the top of this file)
    
  try {
    // Validate request body
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Invalid request: messages array required' 
      });
    }

    console.log('🤖 Processing AI request with', messages.length, 'messages');

    // Get the last user message
    const userMessage = messages[messages.length - 1]?.content;
    if (!userMessage) {
      return res.status(400).json({ 
        error: 'No user message found' 
      });
    }

    // Check if this is a UI command that needs enhanced processing
    const isUICommand = /login.*form|generate.*login|create.*login|navigation.*bar|nav.*bar|card.*layout|create.*card/i.test(userMessage);
    
    // Only use SimpleAIService for UI commands, use main AI for everything else
    if (isUICommand) {
      console.log(`Using SimpleAIService for UI command: ${userMessage}`);
      
      // Use Simple AI service for UI commands only
      const { SimpleAIService } = await import('./simple-ai-service.js');
      const aiService = new SimpleAIService();
      
      try {
        const result = await aiService.processCommand(userMessage);
        
        if (result.functionCalls && result.functionCalls.length > 0) {
          // Return multiple function calls for frontend to execute
          return res.json({
            id: 'chatcmpl-' + Math.random().toString(36).substr(2, 9),
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: 'gpt-4o-mini',
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
                content: result.response || 'Command processed successfully',
                function_calls: result.functionCalls
              }
            }]
          });
        } else {
          // Single response
          return res.json({
            id: 'chatcmpl-' + Math.random().toString(36).substr(2, 9),
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: 'gpt-4o-mini',
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
                content: result.response || result.message || 'Command processed successfully'
              }
            }]
          });
        }
      } catch (error) {
        console.error('❌ SimpleAIService error:', error);
        return res.status(500).json({ 
          error: 'AI processing failed: ' + error.message 
        });
      }
    }
    
    // Fallback: Use OpenAI function calling for unmatched commands
    console.log(`Using OpenAI function calling for: ${userMessage}`);
    
    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({
        error: 'OpenAI API key not configured for fallback processing'
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI canvas assistant. Current canvas state: ${JSON.stringify(canvasState || {})}. 

COMMAND CATEGORIES:
- Creation: "create [color] [shape] at position X,Y"
- Manipulation: "move/resize/rotate/change color of [shape]"
- Layout: "arrange shapes in row/grid", "space evenly"
- Complex: "create login form/navigation/card layout"

MULTIPLE OBJECT CREATION:
- "create 5 circles" → createMultipleShapes(shapeType: 'circle', count: 5, arrangement: 'row')
- "make a 3x3 grid of squares" → createMultipleShapes(shapeType: 'rectangle', count: 9, arrangement: 'grid', gridRows: 3, gridCols: 3)
- "create 10 rectangles in a column" → createMultipleShapes(shapeType: 'rectangle', count: 10, arrangement: 'column')
- "add 4 blue triangles" → createMultipleShapes(shapeType: 'triangle', count: 4, fill: 'blue', arrangement: 'row')

MULTI-OBJECT CREATION STRATEGY:
1. For commands creating multiple objects, ALWAYS use createMultipleShapes
2. Before creating, reason about:
   - Total number of objects needed
   - Dimensions of each object
   - Total space required (width × count + spacing × (count-1))
   - Starting position (center if not specified)
3. For grids: calculate rows × cols = total count
4. For "evenly spaced": use containerWidth parameter

LAYOUT CALCULATION EXAMPLES:
- "5 squares (50px each) with 20px spacing":
  totalWidth = (50 * 5) + (20 * 4) = 330px
  startX = centerX - 330/2 = centerX - 165

- "3x3 grid of circles (40px diameter) with 15px spacing":
  totalWidth = (40 * 3) + (15 * 2) = 150px
  totalHeight = (40 * 3) + (15 * 2) = 150px
  
CENTERING STRATEGY:
- Use centerInViewport: true to auto-center groups
- Or calculate: startX = viewportCenter.x - totalWidth/2

POSITIONING COMMANDS:
- "move to center" → moveShape(shapeId, 'center', 'center') - moves to origin (0,0)
- "move to the center" → moveShape(shapeId, 'center', 'center') - moves to origin (0,0)
- "center the shape" → moveShape(shapeId, 'center', 'center') - moves to origin (0,0)
- "move to origin" → moveShape(shapeId, 0, 0) - moves to origin (0,0)
- "move to 200, 300" → moveShape(shapeId, 200, 300) - uses exact coordinates

GRID FORMAT PARSING:
- "3x3 grid" = 3 rows × 3 columns = 9 shapes total
- "2x4 grid" = 2 rows × 4 columns = 8 shapes total
- "5x1 grid" = 5 rows × 1 column = 5 shapes total

SPACING RULES:
- If spacing not specified, it will be auto-calculated based on shape size (30% buffer)
- For small shapes (50px), use tighter spacing
- For large shapes (200px), use wider spacing
- Consider existing shapes on canvas to avoid overlaps

CRITICAL FUNCTION SELECTION RULES:
- For "3x3 grid of squares" → MUST use createMultipleShapes (NOT createShape)
- For "5 circles" → MUST use createMultipleShapes (NOT createShape)  
- For "10 rectangles" → MUST use createMultipleShapes (NOT createShape)
- ONLY use createShape for single shapes like "create a blue circle"
- If the command mentions numbers, grids, or multiple items, ALWAYS use createMultipleShapes

FUNCTION PRIORITY:
1. createMultipleShapes - for ANY quantity > 1
2. createShape - ONLY for single shapes

Always use appropriate function calls for canvas operations.`
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        functions: AI_FUNCTIONS,
        function_call: 'auto',
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message;

    return res.json({
      id: 'chatcmpl-' + Math.random().toString(36).substr(2, 9),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'gpt-4o-mini',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: aiMessage.content || 'Command processed',
          function_call: aiMessage.function_call,
          function_calls: aiMessage.function_calls
        }
      }]
    });
  } catch (error) {
    console.error('❌ Inner processing error:', error);
    return res.status(500).json({
      error: 'Processing failed: ' + error.message
    });
  }

  } catch (error) {
    console.error('❌ API server error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'AI API server running',
    hasApiKey: !!(process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY)
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 AI API server running on http://localhost:${PORT}`);
  console.log(`🔑 OpenAI API key: ${(process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY) ? 'Configured' : 'Missing'}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/ai-chat`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('\n⚠️  Warning: OPENAI_API_KEY environment variable not set');
    console.log('   Set it with: export OPENAI_API_KEY="your-api-key-here"');
  }
});
