/**
 * AI-Powered Semantic Command Parser
 * Uses OpenAI function calling to interpret natural language commands
 */

import OpenAI from 'openai';

export class AISemanticParser {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Define the schema for command parsing
    this.commandSchema = {
      name: 'parseCommand',
      description: 'Parse natural language commands into structured actions for a collaborative canvas application',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['createShape', 'moveShape', 'resizeShape', 'rotateShape', 'changeColor', 'deleteShape', 'listShapes'],
            description: 'The action to perform on the canvas'
          },
          params: {
            type: 'object',
            properties: {
              shapeType: {
                type: 'string',
                enum: ['rectangle', 'circle', 'triangle', 'text', 'text_input', 'line', 'bezier'],
                description: 'Type of shape (for createShape action)'
              },
              x: {
                type: 'number',
                description: 'X coordinate position'
              },
              y: {
                type: 'number',
                description: 'Y coordinate position'
              },
              width: {
                type: 'number',
                description: 'Width of the shape'
              },
              height: {
                type: 'number',
                description: 'Height of the shape'
              },
              radiusX: {
                type: 'number',
                description: 'Horizontal radius (for circles)'
              },
              radiusY: {
                type: 'number',
                description: 'Vertical radius (for circles)'
              },
              fill: {
                type: 'string',
                description: 'Fill color (hex code or color name)'
              },
              text: {
                type: 'string',
                description: 'Text content (for text shapes)'
              },
              fontSize: {
                type: 'number',
                description: 'Font size in pixels'
              },
              shapeId: {
                type: 'string',
                description: 'ID or description of existing shape to modify'
              },
              scale: {
                type: 'number',
                description: 'Scale factor for resizing'
              },
              degrees: {
                type: 'number',
                description: 'Rotation in degrees'
              },
              color: {
                type: 'string',
                description: 'New color for shape'
              }
            },
            required: []
          }
        },
        required: ['action', 'params']
      }
    };
  }

  /**
   * Parse a natural language command using AI
   */
  async parseCommand(userMessage, canvasState = {}) {
    try {
      const systemPrompt = `You are an AI assistant that parses natural language commands for a collaborative canvas application.

CANVAS CONTEXT:
- Current shapes: ${JSON.stringify(canvasState.shapes || [], null, 2)}
- Total shapes: ${canvasState.totalShapes || 0}

COMMAND INTERPRETATION RULES:
1. For creation commands: Use "createShape" action
2. For movement commands: Use "moveShape" action  
3. For resizing commands: Use "resizeShape" action
4. For rotation commands: Use "rotateShape" action
5. For color changes: Use "changeColor" action
6. For deletion: Use "deleteShape" action
7. For listing: Use "listShapes" action

COORDINATE HANDLING:
- "at point 0,0" or "at 0,0" → x: 0, y: 0
- "near coordinates 100,200" → x: 100, y: 200
- "at location 200,300" → x: 200, y: 300
- "center" or "middle" → x: 0, y: 0 (origin)
- "origin" → x: 0, y: 0
- If no coordinates specified, use origin (0, 0)

SHAPE IDENTIFICATION:
- "the red circle" → look for circle with red fill
- "the blue triangle" → look for triangle with blue fill
- "the first shape" → use shape ID from canvas state
- "the largest shape" → identify by size

DEFAULT VALUES:
- If no coordinates given: x: 0, y: 0 (origin)
- If no size given: width: 200, height: 100
- If no color given: fill: "blue"
- If no shape type given: "rectangle"

Parse the user's command and return the appropriate action with parameters.`;

      const response = await this.openai.chat.completions.create({
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
        functions: [this.commandSchema],
        function_call: { name: 'parseCommand' },
        temperature: 0.1
      });

      const functionCall = response.choices[0].message.function_call;
      if (functionCall && functionCall.name === 'parseCommand') {
        const parsedCommand = JSON.parse(functionCall.arguments);
        
        // Add default values for missing parameters
        this.addDefaultValues(parsedCommand);
        
        return {
          success: true,
          action: parsedCommand.action,
          function: parsedCommand.action,
          params: parsedCommand.params,
          reasoning: 'Parsed using AI semantic understanding'
        };
      } else {
        throw new Error('No valid function call returned');
      }

    } catch (error) {
      console.error('AI semantic parsing error:', error);
      return {
        success: false,
        action: 'error',
        error: `AI parsing failed: ${error.message}`,
        reasoning: 'AI parsing failed, will fall back to regex'
      };
    }
  }

  /**
   * Add default values for missing parameters
   */
  addDefaultValues(parsedCommand) {
    const { action, params } = parsedCommand;
    
    // Add default coordinates if missing
    if (params.x === undefined) params.x = 0;
    if (params.y === undefined) params.y = 0;
    
    // Add default dimensions for creation
    if (action === 'createShape') {
      if (params.width === undefined) params.width = 200;
      if (params.height === undefined) params.height = 100;
      if (params.fill === undefined) params.fill = 'blue';
    }
    
    // Add default scale for resize
    if (action === 'resizeShape' && params.scale === undefined) {
      params.scale = 2.0;
    }
    
    // Add default rotation for rotate
    if (action === 'rotateShape' && params.degrees === undefined) {
      params.degrees = 45;
    }
  }

  /**
   * Check if a command is suitable for AI parsing
   */
  isComplexCommand(userMessage) {
    const complexPatterns = [
      /\b(draw|place|put|position|locate|move|center|near|around|beside|next to)\b/i,
      /\b(at|to|from|towards|away from)\b/i,
      /\b(create|make|generate|add|insert)\b/i,
      /\b(red|blue|green|yellow|orange|purple|pink|black|white|gray|brown)\b/i,
      /\b(large|small|big|tiny|huge|massive|mini|micro)\b/i,
      /\b(rotate|turn|spin|flip|mirror)\b/i,
      /\b(resize|scale|bigger|smaller|larger|grow|shrink)\b/i,
      /\b(delete|remove|erase|clear)\b/i,
      /\b(list|show|display|get|find|search)\b/i
    ];
    
    return complexPatterns.some(pattern => pattern.test(userMessage));
  }
}
