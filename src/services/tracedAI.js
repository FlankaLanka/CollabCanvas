/**
 * Traced AI Service
 * 
 * This service provides LangSmith-traced AI functionality for the canvas application.
 * It wraps the LangSmith service to provide easy-to-use AI functions with automatic tracing.
 */

import langsmithService from './langsmith.js';

class TracedAIService {
  constructor() {
    this.isInitialized = false;
    this.tracedLLM = null;
  }

  /**
   * Initialize the traced AI service
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      this.tracedLLM = await langsmithService.initialize();
      this.isInitialized = true;
      console.log('✅ Traced AI service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize traced AI service:', error);
      throw error;
    }
  }

  /**
   * Process a user command with tracing
   */
  async processCommand(userMessage, canvasState = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Create a traced run for this operation
    const tracedRun = await langsmithService.createTracedRun(
      'canvas-ai-command',
      `Processing: ${userMessage.substring(0, 50)}...`
    );

    try {
      const systemPrompt = `You are an AI canvas assistant. Current canvas state: ${JSON.stringify(canvasState)}. 

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

Always use appropriate function calls for canvas operations.`;

      // Define tools for the LLM
      const tools = [
        {
          type: 'function',
          function: {
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
                x: { type: 'number', description: 'X position on canvas' },
                y: { type: 'number', description: 'Y position on canvas' },
                width: { type: 'number', description: 'Width of the shape' },
                height: { type: 'number', description: 'Height of the shape' },
                fill: { type: 'string', description: 'Color of the shape' }
              },
              required: ['shapeType', 'x', 'y']
            }
          }
        },
        {
          type: 'function',
          function: {
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
                count: { type: 'number', description: 'Number of shapes to create' },
                arrangement: {
                  type: 'string',
                  enum: ['row', 'column', 'grid'],
                  description: 'How to arrange the shapes'
                },
                gridRows: { type: 'number', description: 'For grid arrangement: number of rows' },
                gridCols: { type: 'number', description: 'For grid arrangement: number of columns' },
                fill: { type: 'string', description: 'Color for all shapes' }
              },
              required: ['shapeType', 'count', 'arrangement']
            }
          }
        }
      ];

      // Bind tools to the traced LLM
      const llmWithTools = this.tracedLLM.bindTools(tools);

      // Create messages
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ];

      console.log('🔍 Processing with LangSmith tracing:', {
        userMessage: userMessage.substring(0, 50) + '...',
        hasCanvasState: !!canvasState,
        toolsCount: tools.length
      });

      // Invoke the traced LLM
      const response = await llmWithTools.invoke(messages);

      console.log('📥 LangSmith response:', {
        hasContent: !!response.content,
        contentLength: response.content?.length,
        hasToolCalls: !!response.tool_calls,
        toolCallsCount: response.tool_calls?.length || 0,
        responseType: typeof response,
        responseKeys: Object.keys(response || {}),
        toolCallsStructure: response.tool_calls?.[0] ? Object.keys(response.tool_calls[0]) : 'no tool calls'
      });

      // Convert to OpenAI-compatible format
      let functionCall = undefined;
      
      try {
        if (response.tool_calls?.[0]) {
          const toolCall = response.tool_calls[0];
          // Handle both OpenAI format (function property) and LangChain format (direct properties)
          const functionName = toolCall.function?.name || toolCall.name;
          const functionArgs = toolCall.function?.arguments || toolCall.args;
          
          if (functionName && functionArgs) {
            functionCall = {
              name: functionName,
              arguments: JSON.stringify(functionArgs)
            };
          }
        }
      } catch (error) {
        console.warn('⚠️ Error parsing function call:', error);
        functionCall = undefined;
      }

      const result = {
        choices: [{
          message: {
            content: response.content,
            function_call: functionCall
          }
        }]
      };

      return result;

    } catch (error) {
      console.error('❌ Traced AI processing error:', error);
      throw error;
    }
  }

  /**
   * Get the status of the traced AI service
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      langsmithStatus: langsmithService.getStatus()
    };
  }
}

// Create singleton instance
const tracedAIService = new TracedAIService();

export default tracedAIService;
export { TracedAIService };
