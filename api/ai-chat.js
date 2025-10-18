/**
 * AI Chat API Proxy - Production OpenAI Integration
 * 
 * This API endpoint proxies requests to OpenAI to keep API keys secure in production.
 * It handles function calling for canvas manipulation and provides error handling.
 */

// Import AI_FUNCTIONS from the shared file
// import { AI_FUNCTIONS } from './ai-functions.js';

// For now, let's define the functions inline to avoid import issues
const AI_FUNCTIONS = [
  {
    name: 'createShape',
    description: 'Create a SINGLE shape on the canvas. Use this ONLY for creating one shape at a time.',
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
        fill: {
          type: 'string',
          description: 'Color of the shape (hex code or color name)'
        },
        text: {
          type: 'string',
          description: 'Text content (for text shapes)'
        }
      },
      required: ['shapeType', 'x', 'y']
    }
  },
  {
    name: 'createMultipleShapes',
    description: 'Create multiple shapes with automatic layout. Use this for ANY command involving quantities (5 circles, 3x3 grid, etc.).',
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
          description: 'Number of shapes to create'
        },
        arrangement: {
          type: 'string',
          enum: ['row', 'column', 'grid'],
          description: 'How to arrange the shapes'
        },
        fill: {
          type: 'string',
          description: 'Color for all shapes (hex code or color name)'
        }
      },
      required: ['shapeType', 'count']
    }
  }
];

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

    // Extract request data
    const { messages, functions, function_call, canvasState } = req.body;

    // Validate request body
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Invalid request: messages array required' 
      });
    }

    console.log('🤖 Processing AI request with', messages.length, 'messages');
    
    // DEBUG: Log system prompt and tool schema being sent to OpenAI
    const systemMessage = messages.find(m => m.role === 'system');
    console.log('📝 System prompt length:', systemMessage?.content?.length || 0);
    console.log('📝 System prompt preview:', systemMessage?.content?.substring(0, 200) + '...');
    console.log('🔧 Functions provided:', functions?.length || 0);
    console.log('🔧 Function call mode:', function_call);
    console.log('🔧 Has createShape function:', functions?.some(f => f.name === 'createShape'));
    console.log('🔧 Has createMultipleShapes function:', functions?.some(f => f.name === 'createMultipleShapes'));

    // Use the same system prompt and functions as local server
    const systemPrompt = `You are an AI assistant that manipulates a collaborative canvas through function calls. 

CURRENT CANVAS STATE:
${JSON.stringify(canvasState || {}, null, 2)}

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

CRITICAL FUNCTION SELECTION RULES:
- Use createShape ONLY for single shapes (1 rectangle, 1 circle, etc.)
- Use createMultipleShapes for ANY command with quantities, grids, or arrays:
  * "5 circles" → createMultipleShapes with count=5
  * "3x3 grid of rectangles" → createMultipleShapes with count=9, arrangement=grid
  * "2x4 grid of circles" → createMultipleShapes with count=8, arrangement=grid
  * "array of 6 triangles" → createMultipleShapes with count=6
- NEVER use createShape for grid commands - always use createMultipleShapes

GUIDELINES:
- ALWAYS use listShapes() first if user asks about existing shapes
- Create visually appealing, well-positioned layouts
- Use appropriate colors from the palette: blue, red, green, yellow, purple, orange, pink, gray
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

Be helpful and creative while following the user's intent precisely. Always respond conversationally to engage with the user.`;

    // Ensure we have the system prompt in messages
    const enhancedMessages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...messages.filter(m => m.role !== 'system') // Remove any existing system messages
    ];

    // DEBUG: Log the exact request being sent to OpenAI
    const openaiRequestBody = {
      model: 'gpt-4o-mini', // Use same model as local
      messages: enhancedMessages,
      functions: AI_FUNCTIONS, // Use the same functions as local
      function_call: 'auto', // Force function calling
      temperature: 0.2, // Use same temperature as local
      max_tokens: 2000,
    };
    
    console.log('📤 OpenAI API Request Debug:', {
      model: openaiRequestBody.model,
      hasFunctions: !!openaiRequestBody.functions,
      functionsCount: openaiRequestBody.functions?.length,
      functionCallMode: openaiRequestBody.function_call,
      temperature: openaiRequestBody.temperature,
      hasCreateShape: openaiRequestBody.functions?.some(f => f.name === 'createShape'),
      userMessage: messages[messages.length - 1]?.content?.substring(0, 50) + '...'
    });

    // Make request to OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openaiRequestBody),
    });

    // Check if OpenAI request was successful
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('❌ OpenAI API error:', openaiResponse.status, errorData);
      
      return res.status(openaiResponse.status).json({
        error: errorData.error?.message || `OpenAI API error: ${openaiResponse.status}`,
        details: errorData
      });
    }

    // Parse and return successful response
    const data = await openaiResponse.json();
    
    // DEBUG: Log raw model response to verify tool calls
    const aiMessage = data.choices?.[0]?.message;
    console.log('📥 Raw OpenAI Response Debug:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      hasFunctionCall: !!aiMessage?.function_call,
      functionName: aiMessage?.function_call?.name,
      functionArguments: aiMessage?.function_call?.arguments,
      hasContent: !!aiMessage?.content,
      contentPreview: aiMessage?.content?.substring(0, 100) + '...',
      finishReason: data.choices?.[0]?.finish_reason
    });
    
    // SAFE-GUARD: Detect if model returned text without function call
    if (aiMessage?.content && !aiMessage?.function_call) {
      console.warn('⚠️ SAFE-GUARD TRIGGERED: Model returned text without function call!');
      console.warn('⚠️ Content:', aiMessage.content.substring(0, 200));
      console.warn('⚠️ This indicates function calling is not working properly');
    }
    
    console.log('✅ OpenAI request successful');
    
    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ API proxy error:', error);
    
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
