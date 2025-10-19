/**
 * Semantic Command Interpreter
 * 
 * Lightweight interpreter that normalizes natural language commands
 * into structured data before passing to the ReAct agent.
 */

import OpenAI from 'openai';

export class SemanticInterpreter {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Define the schema for command interpretation
    this.commandSchema = {
      name: 'interpretCommand',
      description: 'Interpret natural language commands into structured actions for a collaborative canvas',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: [
              'createShape', 'moveShape', 'resizeShape', 'rotateShape', 
              'changeColor', 'changeText', 'deleteShape', 'listShapes',
              'arrangeShapes', 'createMultipleShapes', 'distributeEvenly',
              'createLoginForm', 'createNavigationBar', 'createCardLayout'
            ],
            description: 'The primary action to perform'
          },
          params: {
            type: 'object',
            properties: {
              shapeType: {
                type: 'string',
                enum: ['rectangle', 'circle', 'triangle', 'text', 'text_input', 'line', 'bezier'],
                description: 'Type of shape to create'
              },
              x: { type: 'number', description: 'X coordinate' },
              y: { type: 'number', description: 'Y coordinate' },
              width: { type: 'number', description: 'Width of shape' },
              height: { type: 'number', description: 'Height of shape' },
              fill: { type: 'string', description: 'Fill color' },
              text: { type: 'string', description: 'Text content' },
              fontSize: { type: 'number', description: 'Font size' },
              shapeId: { type: 'string', description: 'ID or description of existing shape' },
              scale: { type: 'number', description: 'Scale factor for resizing' },
              degrees: { type: 'number', description: 'Rotation in degrees' },
              color: { type: 'string', description: 'New color' },
              count: { type: 'number', description: 'Number of shapes to create' },
              pattern: { type: 'string', enum: ['row', 'column', 'grid', 'circle'], description: 'Arrangement pattern' },
              spacing: { type: 'number', description: 'Spacing between elements' },
              rows: { type: 'number', description: 'Number of rows for grid' },
              columns: { type: 'number', description: 'Number of columns for grid' }
            }
          },
          reasoning: {
            type: 'string',
            description: 'Brief explanation of the interpretation'
          }
        },
        required: ['action', 'params', 'reasoning']
      }
    };
  }

  /**
   * Interpret a natural language command into structured data
   */
  async interpretCommand(userInput, canvasState = {}) {
    try {
      const systemPrompt = `You are a semantic command interpreter for a collaborative canvas application.

CANVAS CONTEXT:
- Current shapes: ${JSON.stringify(canvasState.shapes || [], null, 2)}
- Total shapes: ${canvasState.totalShapes || 0}

INTERPRETATION RULES:

1. COORDINATE SYNONYMS:
   - "at point 0,0", "at coordinates 0,0", "at location 0,0" → x: 0, y: 0
   - "center", "middle", "centered" → x: "viewport", y: "viewport" (viewport center)
   - "origin" → x: 0, y: 0
   - "near coordinates 100,200" → x: 100, y: 200
   - If no position specified → x: "viewport", y: "viewport" (viewport center)

2. ACTION SYNONYMS:
   - "create", "draw", "add", "make", "generate" → createShape
   - "move", "place", "position", "relocate" → moveShape
   - "resize", "scale", "bigger", "smaller", "larger" → resizeShape
   - "rotate", "turn", "spin" → rotateShape
   - "color", "recolor", "change color" → changeColor
   - "arrange", "organize", "layout" → arrangeShapes
   - "grid of 3x3", "3x3 grid" → createMultipleShapes with grid pattern

3. SHAPE IDENTIFICATION:
   - "the blue rectangle" → shapeId: "blue rectangle"
   - "the first shape" → use shape ID from canvas state
   - "the largest shape" → identify by size
   - "these shapes" → refer to recently created shapes

4. DIMENSION HANDLING:
   - "200x300 rectangle" → width: 200, height: 300
   - "large", "big" → scale: 2.0 or larger dimensions
   - "small", "tiny" → scale: 0.5 or smaller dimensions
   - "twice as big" → scale: 2.0
   - "half size" → scale: 0.5

5. LAYOUT PATTERNS:
   - "in a row", "horizontally" → pattern: "row"
   - "in a column", "vertically" → pattern: "column"
   - "in a grid", "grid layout" → pattern: "grid"
   - "in a circle", "circular" → pattern: "circle"
   - "evenly spaced" → distributeEvenly

6. COMPLEX COMMANDS:
   - "login form" → createLoginForm
   - "navigation bar", "nav bar" → createNavigationBar
   - "card layout" → createCardLayout

DEFAULT VALUES:
- If no coordinates: x: "viewport", y: "viewport" (viewport center)
- If no size: width: 200, height: 100
- If no color: fill: "blue"
- If no shape type: "rectangle"

Interpret the user's command and return structured action with parameters.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        functions: [this.commandSchema],
        function_call: { name: 'interpretCommand' },
        temperature: 0.1
      });

      const functionCall = response.choices[0].message.function_call;
      if (functionCall && functionCall.name === 'interpretCommand') {
        const interpretation = JSON.parse(functionCall.arguments);
        
        // Add default values for missing parameters
        this.addDefaultValues(interpretation);
        
        return {
          success: true,
          originalInput: userInput,
          interpretedCommand: interpretation,
          normalizedInput: this.generateNormalizedInput(interpretation)
        };
      } else {
        throw new Error('No valid interpretation returned');
      }

    } catch (error) {
      console.error('Semantic interpretation error:', error);
      return {
        success: false,
        originalInput: userInput,
        error: `Interpretation failed: ${error.message}`,
        fallbackInput: userInput // Return original for fallback
      };
    }
  }

  /**
   * Add default values for missing parameters
   */
  addDefaultValues(interpretation) {
    const { action, params } = interpretation;
    
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
    
    // Add default spacing for arrangements
    if (['arrangeShapes', 'createMultipleShapes', 'distributeEvenly'].includes(action)) {
      if (params.spacing === undefined) params.spacing = 50;
    }
  }

  /**
   * Generate a normalized input string for the ReAct agent
   */
  generateNormalizedInput(interpretation) {
    const { action, params, reasoning } = interpretation;
    
    let normalizedInput = `[${action}] `;
    
    // Add key parameters to the normalized input
    if (params.shapeType) normalizedInput += `Create ${params.shapeType}`;
    if (params.shapeId) normalizedInput += `Modify ${params.shapeId}`;
    if (params.x !== undefined && params.y !== undefined) {
      normalizedInput += ` at position (${params.x}, ${params.y})`;
    }
    if (params.fill) normalizedInput += ` with color ${params.fill}`;
    if (params.text) normalizedInput += ` with text "${params.text}"`;
    if (params.pattern) normalizedInput += ` in ${params.pattern} pattern`;
    if (params.count) normalizedInput += ` (${params.count} shapes)`;
    
    normalizedInput += `. ${reasoning}`;
    
    return normalizedInput;
  }

  /**
   * Check if a command is complex enough to benefit from interpretation
   */
  isComplexCommand(userInput) {
    const complexPatterns = [
      /\b(at|to|from|towards|away from|near|around|beside|next to)\b/i,
      /\b(center|middle|centered|origin|coordinates|position|location)\b/i,
      /\b(large|small|big|tiny|huge|massive|mini|micro|twice|half|double)\b/i,
      /\b(red|blue|green|yellow|orange|purple|pink|black|white|gray|brown)\b/i,
      /\b(row|column|grid|circle|horizontal|vertical|evenly|spaced)\b/i,
      /\b(login|navigation|nav|card|form|layout)\b/i,
      /\b(create|draw|add|make|generate|move|place|position|resize|scale|rotate|turn|spin)\b/i
    ];
    
    return complexPatterns.some(pattern => pattern.test(userInput));
  }
}
