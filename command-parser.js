/**
 * Command Parser - Uses AI semantic parsing with regex fallback
 */

import { AISemanticParser } from './ai-semantic-parser.js';

export class CommandParser {
  static async parseCommand(userMessage, canvasState = {}) {
    // Try AI semantic parsing first
    const aiParser = new AISemanticParser();
    
    // Check if command is complex enough for AI parsing
    if (aiParser.isComplexCommand(userMessage)) {
      try {
        const aiResult = await aiParser.parseCommand(userMessage, canvasState);
        if (aiResult.success) {
          console.log('🤖 AI parsing result:', JSON.stringify(aiResult, null, 2));
          return aiResult;
        }
      } catch (error) {
        console.log('⚠️ AI parsing failed, falling back to regex:', error.message);
      }
    }
    
    // Fallback to regex parsing
    return this.parseCommandWithRegex(userMessage, canvasState);
  }

  static parseCommandWithRegex(userMessage, canvasState = {}) {
    const msg = userMessage.toLowerCase();
    const shapes = canvasState.shapes || [];
    
    // Detection patterns
    const isCreateCommand = /\b(create|add|make|generate|draw)\b/.test(msg);
    const isMoveCommand = /\b(move|center|position|place|put)\b/.test(msg);
    const isResizeCommand = /\b(resize|scale|bigger|smaller|larger)\b/.test(msg);
    const isRotateCommand = /\b(rotate|turn|spin)\b/.test(msg);
    const isColorCommand = /\b(color|change.*color|recolor)\b/.test(msg);
    
    // Extract shape type
    let shapeType = null;
    const shapeTypes = ['triangle', 'circle', 'rectangle', 'square', 'line', 'text'];
    for (const type of shapeTypes) {
      if (msg.includes(type)) {
        shapeType = type;
        break;
      }
    }
    
    // Extract dimensions if mentioned
    const dimensionMatch = msg.match(/(\d+)\s*x\s*(\d+)/);
    const width = dimensionMatch ? parseInt(dimensionMatch[1]) : null;
    const height = dimensionMatch ? parseInt(dimensionMatch[2]) : null;
    
    // Extract color
    const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray', 'brown'];
    let color = null;
    for (const c of colors) {
      if (msg.includes(c)) {
        color = c;
        break;
      }
    }
    
    // Extract position coordinates
    const originMatch = /\b(origin|0,\s*0)\b/.test(msg);
    const centerMatch = /\b(center|middle)\b/.test(msg);
    
    // Flexible regex that allows optional words between keyword and coordinates
    const coordMatch = msg.match(/(?:to|at|position)(?:\s+\w+)?\s*(\d+)\s*,?\s*(\d+)/);
    // Also check for bare coordinates without keywords
    const bareCoordMatch = msg.match(/\b(\d+)\s*,\s*(\d+)\b/);
    
    let targetX = null;
    let targetY = null;
    
    if (originMatch) {
      targetX = 0;
      targetY = 0;
    } else if (centerMatch) {
      // Use viewport center instead of fixed coordinates
      targetX = 'center';
      targetY = 'center';
    } else if (coordMatch) {
      targetX = parseInt(coordMatch[1]);
      targetY = parseInt(coordMatch[2]);
    } else if (bareCoordMatch) {
      targetX = parseInt(bareCoordMatch[1]);
      targetY = parseInt(bareCoordMatch[2]);
    }
    
    // Decision logic
    if (isCreateCommand) {
      return {
        action: 'create',
        function: 'createShape',
        params: {
          shapeType: shapeType || 'rectangle',
          x: targetX !== null ? targetX : 0,
          y: targetY !== null ? targetY : 0,
          width: width || 200,
          height: height || 100,
          fill: color || 'blue'
        }
      };
    }
    
    if (isMoveCommand) {
      // Check if shape exists
      const existingShape = shapes.find(s => 
        s.type === shapeType || 
        (color && s.fill?.toLowerCase().includes(color))
      );
      
      if (existingShape) {
        return {
          action: 'move',
          function: 'moveShape',
          params: {
            shapeId: existingShape.id || `${color || ''} ${shapeType || 'shape'}`,
            x: targetX !== null ? targetX : 0,
            y: targetY !== null ? targetY : 0
          }
        };
      } else {
        // No existing shape - create one at the target position
        return {
          action: 'create',
          function: 'createShape',
          params: {
            shapeType: shapeType || 'rectangle',
            x: targetX !== null ? targetX : 0,
            y: targetY !== null ? targetY : 0,
            width: width || 200,
            height: height || 100,
            fill: color || 'blue'
          },
          warning: `No ${shapeType || 'shape'} found to move. Creating new shape instead.`
        };
      }
    }
    
    if (isResizeCommand) {
      const existingShape = shapes.find(s => 
        s.type === shapeType || 
        (color && s.fill?.toLowerCase().includes(color))
      );
      
      if (existingShape) {
        return {
          action: 'resize',
          function: 'resizeShape',
          params: {
            shapeId: existingShape.id || `${color || ''} ${shapeType || 'shape'}`,
            width: width || existingShape.width * 2,
            height: height || existingShape.height * 2
          }
        };
      } else {
        return {
          action: 'error',
          error: `No ${shapeType || 'shape'} found to resize.`
        };
      }
    }
    
    if (isRotateCommand) {
      const existingShape = shapes.find(s => 
        s.type === shapeType || 
        (color && s.fill?.toLowerCase().includes(color))
      );
      
      if (existingShape) {
        const degreesMatch = msg.match(/(\d+)\s*(?:degree|deg|°)/);
        const degrees = degreesMatch ? parseInt(degreesMatch[1]) : 45;
        
        return {
          action: 'rotate',
          function: 'rotateShape',
          params: {
            shapeId: existingShape.id || `${color || ''} ${shapeType || 'shape'}`,
            degrees: degrees
          }
        };
      } else {
        return {
          action: 'error',
          error: `No ${shapeType || 'shape'} found to rotate.`
        };
      }
    }
    
    // Default fallback - try to infer intent
    if (shapeType) {
      return {
        action: 'create',
        function: 'createShape',
        params: {
          shapeType: shapeType,
          x: targetX || 400,
          y: targetY || 300,
          width: width || 200,
          height: height || 100,
          fill: color || 'blue'
        }
      };
    }
    
    return {
      action: 'error',
      error: 'Could not understand the command. Please be more specific.'
    };
  }

  /**
   * Parse layout commands that work with selected shapes
   */
  static parseLayoutCommand(userMessage, canvasState = {}) {
    const msg = userMessage.toLowerCase();
    
    // Arrange in row
    if (/arrange.*row|arrange.*horizontal/.test(msg)) {
      const spacingMatch = msg.match(/spacing\s*(\d+)/);
      const spacing = spacingMatch ? parseInt(spacingMatch[1]) : 50;
      
      return {
        action: 'layout',
        function: 'arrangeInRow',
        params: { spacing },
        requiresSelection: true,
        selectionHint: 'Select the shapes you want to arrange in a horizontal row.'
      };
    }
    
    // Create grid
    if (/create.*grid|make.*grid/.test(msg)) {
      const gridMatch = msg.match(/(\d+)\s*x\s*(\d+)/);
      if (gridMatch) {
        return {
          action: 'layout',
          function: 'createGrid',
          params: {
            rows: parseInt(gridMatch[1]),
            columns: parseInt(gridMatch[2]),
            shapeType: 'rectangle',
            spacing: 50
          },
          requiresSelection: false
        };
      }
    }
    
    // Distribute evenly
    if (/space.*evenly|distribute.*evenly/.test(msg)) {
      const direction = /vertical/.test(msg) ? 'vertical' : 'horizontal';
      return {
        action: 'layout',
        function: 'distributeEvenly',
        params: { direction },
        requiresSelection: true,
        selectionHint: 'Select at least 2 shapes to distribute them evenly.'
      };
    }
    
    return {
      action: 'error',
      error: 'Could not understand layout command'
    };
  }
}

