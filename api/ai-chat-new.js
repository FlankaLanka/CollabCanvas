/**
 * AI Chat API - Production OpenAI Integration (Exact Local Server Copy)
 * 
 * This endpoint is a direct copy of the working local server configuration
 * to ensure production behaves identically to local development.
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Validate OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error('❌ OpenAI API key not configured');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured on server' 
      });
    }

    // Extract request data (same as local server)
    const { messages, functions, function_call, canvasState } = req.body;
    const userMessage = messages[messages.length - 1]?.content || '';

    console.log('🤖 AI Chat New - Processing request with', messages.length, 'messages');
    console.log('📝 User message:', userMessage.substring(0, 50) + '...');

    // Use EXACT same AI_FUNCTIONS as local server
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

    // Use EXACT same system prompt as local server
    const systemPrompt = `You are an AI canvas assistant. Current canvas state: ${JSON.stringify(canvasState || {})}. 

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

Always use appropriate function calls for canvas operations.`;

    // Use EXACT same request format as local server
    const openaiRequestBody = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      functions: AI_FUNCTIONS,
      function_call: 'auto',
      temperature: 0.2
    };
    
    console.log('📤 AI Chat New - OpenAI API Request Debug:', {
      hasFunctions: !!openaiRequestBody.functions,
      functionsCount: openaiRequestBody.functions?.length,
      hasCreateShape: openaiRequestBody.functions?.some(f => f.name === 'createShape'),
      functionCallType: openaiRequestBody.function_call,
      userMessage: userMessage.substring(0, 50) + '...'
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openaiRequestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ AI Chat New - OpenAI API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message;

    console.log('📥 AI Chat New - OpenAI API Response Debug:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      hasFunctionCall: !!aiMessage.function_call,
      functionName: aiMessage.function_call?.name,
      hasContent: !!aiMessage.content,
      contentPreview: aiMessage.content?.substring(0, 50) + '...'
    });

    console.log('✅ AI Chat New - OpenAI request successful');
    
    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ AI Chat New - API proxy error:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Configuration for Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
