/**
 * ReAct-Style Reasoning Agent for Canvas Operations
 * 
 * This agent uses ReAct (Reason + Act) style prompting to handle complex,
 * multi-step canvas operations through reasoning and tool usage.
 * Uses the existing AI proxy system for OpenAI calls.
 */

// Environment detection
const isDevelopment = import.meta.env.DEV;

// API endpoint configuration (same as main AI service)
const AI_API_ENDPOINT = isDevelopment 
  ? 'http://localhost:3001/api/ai-chat'
  : '/api/ai-chat';

export class CanvasReActAgent {
  constructor(canvasAPI) {
    this.canvasAPI = canvasAPI;
    this.maxIterations = 8;
    this.conversationHistory = [];
    this.executedActions = new Set(); // Track executed actions to prevent loops
  }

  /**
   * Process a complex user command using ReAct reasoning
   */
  async processCommand(userMessage) {
    try {
      console.log('🧠 Starting ReAct reasoning for:', userMessage);
      
      // Reset action tracking for new command
      this.executedActions.clear();
      
      // Refresh canvas context to ensure we have the latest data
      if (this.canvasAPI.refreshContext) {
        this.canvasAPI.refreshContext();
      }
      
      const reasoning = [];
      let finalResponse = '';
      
      // Get current canvas state for context
      const canvasState = this.canvasAPI.getCanvasState();
      console.log('🧠 ReAct agent canvas state:', {
        shapesCount: canvasState.totalShapes,
        shapes: canvasState.shapes.slice(0, 3).map(s => `${s.type} at (${s.x}, ${s.y})`)
      });
      
      // Initial reasoning prompt - make it mutable to build context
      let systemPrompt = `You are an AI agent that uses ReAct (Reason + Act) methodology to complete complex canvas tasks.

CURRENT CANVAS STATE:
${JSON.stringify(canvasState, null, 2)}

AVAILABLE TOOLS:

1. createShape(shapeType, x, y, [options])
   - Types: rectangle, circle, triangle, line, text, text_input, bezier_curve
   - Options: width, height, radiusX, radiusY, fill, text, fontSize, fontFamily, stroke, strokeWidth, background, borderColor, borderWidth, cornerRadius
   
2. createLoginForm(x, y, width) - Creates username/password form with labels and button
3. createNavigationBar(x, y, menuItems, width) - Creates nav bar with menu items
4. createCardLayout(x, y, title, content, width, height) - Creates card with title/content

5. moveShape(shapeId, x, y) - Move shape (use natural description like "blue rectangle")
6. resizeShape(shapeId, options) - Resize shape (width, height, radiusX, radiusY, scale)
7. rotateShape(shapeId, degrees) - Rotate shape
8. changeShapeColor(shapeId, color) - Change shape color
9. changeShapeText(shapeId, newText) - Change text content of text shapes

10. arrangeShapes(shapeIds, arrangement, centerX, centerY, spacing) - Arrange multiple shapes
11. getCanvasState() - Get current canvas info
12. listShapes() - List all shapes with descriptions
13. deleteShape(shapeId) - Delete shape

SHAPE IDENTIFICATION:
- Use natural descriptions: "blue rectangle", "red circle", "username label", "login button"
- For login forms: "username label", "username input", "password label", "password input", "login button"
- Colors: blue (#3B82F6), red (#EF4444), green (#10B981), yellow (#F59E0B), purple (#8B5CF6), pink (#EC4899), orange (#F97316), gray (#6B7280), black (#000000), white (#FFFFFF)

POSITIONING GUIDELINES:
- Canvas size: 5000x5000 pixels
- Viewport center: (400, 300) for normal positioning
- Use proper spacing: 20px between related elements, 40-60px between sections
- For centering: calculate position relative to element width/height
  * Login form (width=300): x = 400 - 150 = 250
  * Rectangle (width=100): x = 400 - 50 = 350
  * Card (width=250): x = 400 - 125 = 275

USER REQUEST: ${userMessage}

IMPORTANT RULES:
1. ALWAYS call listShapes() first if modifying existing shapes
2. For "red text" requests, target specific text elements (like "username label", "password label")
3. For centering, calculate proper coordinates (e.g., x = 400 - width/2)
4. Use descriptive shape IDs when referring to elements
5. If task complete, respond with "Final Answer: [description]"

Respond with your reasoning and the first action to take. Format your response as:

Thought: [Your reasoning about what needs to be done]
Action: [Tool name and parameters to use]`;

      // Iterative ReAct loop
      for (let iteration = 0; iteration < this.maxIterations; iteration++) {
        console.log(`🤔 ReAct Iteration ${iteration + 1}`);
        
        // Get reasoning from AI
        const response = await this._callAI(systemPrompt, reasoning);
        
        if (!response) {
          throw new Error('Failed to get AI response');
        }
        
        // Parse the response to extract Thought and Action
        const { thought, action, final } = this._parseReActResponse(response);
        
        reasoning.push({
          iteration: iteration + 1,
          thought: thought,
          action: action,
          observation: ''
        });
        
        // If this is a final response, we're done
        if (final) {
          finalResponse = final;
          console.log('✅ ReAct reasoning completed with final answer');
          break;
        }
        
        // Execute the action if provided
        if (action) {
          // Check for duplicate actions to prevent loops
          const actionKey = `${action.tool}-${JSON.stringify(action.params)}`;
          
          if (this.executedActions.has(actionKey)) {
            reasoning[reasoning.length - 1].observation = `Error: Action already executed - ${action.tool}. Task may be complete.`;
            console.warn('⚠️ Duplicate action detected:', actionKey);
            
            // Force completion to prevent infinite loops
            finalResponse = 'Task completed successfully with the existing elements on the canvas.';
            break;
          }
          
          try {
            this.executedActions.add(actionKey);
            const result = await this._executeAction(action);
            reasoning[reasoning.length - 1].observation = result;
            console.log('🔧 Action executed:', action.tool, '→', result);
            
            // Update system prompt for next iteration
            systemPrompt += `\n\nPrevious Step - Thought: ${thought}\nAction: ${action.tool}(${JSON.stringify(action.params)})\nObservation: ${result}\n\nContinue with next step or respond with "Final Answer: [description]" if complete. DO NOT repeat the same action.`;
          } catch (error) {
            reasoning[reasoning.length - 1].observation = `Error: ${error.message}`;
            console.error('❌ Action execution error:', error);
          }
        } else {
          reasoning[reasoning.length - 1].observation = 'No valid action found in response';
        }
      }
      
      return {
        response: finalResponse || 'I completed the requested task using multi-step reasoning.',
        reasoning: reasoning,
        success: true
      };
      
    } catch (error) {
      console.error('❌ ReAct Agent processing error:', error);
      return {
        response: `I encountered an error while processing your request: ${error.message}`,
        reasoning: [],
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Make an AI call using the existing proxy system
   */
  async _callAI(systemPrompt, previousReasoning) {
    try {
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        }
      ];

      // Add previous reasoning context if any
      if (previousReasoning && previousReasoning.length > 0) {
        const context = previousReasoning.map(step => 
          `Thought: ${step.thought}\nAction: ${step.action ? `${step.action.tool}(${JSON.stringify(step.action.params)})` : 'None'}\nObservation: ${step.observation}`
        ).join('\n\n');
        
        messages.push({
          role: 'user',
          content: `Previous reasoning:\n${context}\n\nContinue with the next step.`
        });
      } else {
        messages.push({
          role: 'user',
          content: 'Please start by analyzing the request and planning your first action.'
        });
      }

      const response = await fetch(AI_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          temperature: 0.1,
        })
      });

      if (!response.ok) {
        throw new Error(`AI API call failed: ${response.status} ${response.statusText}`);
      }

      const completion = await response.json();
      return completion.choices[0].message.content;
      
    } catch (error) {
      console.error('❌ AI call failed:', error);
      throw error;
    }
  }

  /**
   * Parse ReAct response to extract thought, action, and final answer
   */
  _parseReActResponse(response) {
    try {
      const lines = response.split('\n').filter(line => line.trim());
      let thought = '';
      let action = null;
      let final = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.toLowerCase().startsWith('thought:')) {
          thought = line.substring(8).trim();
        }
        
        if (line.toLowerCase().startsWith('action:')) {
          const actionText = line.substring(7).trim();
          action = this._parseActionString(actionText);
        }
        
        if (line.toLowerCase().startsWith('final answer:')) {
          final = line.substring(13).trim();
          break;
        }
      }

      return { thought, action, final };
    } catch (error) {
      console.warn('Failed to parse ReAct response:', error);
      return { thought: response, action: null, final: null };
    }
  }

  /**
   * Parse action string like "createLoginForm(x=100, y=200, width=300)"
   */
  _parseActionString(actionText) {
    try {
      const match = actionText.match(/(\w+)\((.*)\)/);
      if (!match) {
        return null;
      }

      const tool = match[1];
      const paramsString = match[2];
      const params = {};

      if (paramsString.trim()) {
        // Handle different parameter formats
        if (paramsString.includes('=')) {
          // Format: x=100, y=200, text="hello"
          const pairs = paramsString.split(',');
          for (const pair of pairs) {
            const [key, value] = pair.split('=').map(s => s.trim());
            if (key && value !== undefined) {
              // Parse numbers
              if (!isNaN(value) && !isNaN(parseFloat(value))) {
                params[key] = parseFloat(value);
              }
              // Parse arrays
              else if (value.startsWith('[') && value.endsWith(']')) {
                params[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, ''));
              }
              // Parse booleans
              else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
                params[key] = value.toLowerCase() === 'true';
              }
              // Parse strings (remove quotes)
              else {
                params[key] = value.replace(/^["']|["']$/g, '');
              }
            }
          }
        } else {
          // Simple comma-separated values - improved parameter mapping
          const values = paramsString.split(',').map(s => s.trim());
          
          // Map based on tool type
          switch (tool) {
            case 'createShape':
              if (values.length >= 3) {
                params.shapeType = values[0].replace(/['"]/g, '');
                params.x = parseFloat(values[1]) || 0;
                params.y = parseFloat(values[2]) || 0;
                if (values[3]) params.width = parseFloat(values[3]);
                if (values[4]) params.height = parseFloat(values[4]);
                if (values[5]) params.fill = values[5].replace(/['"]/g, '');
              }
              break;
            case 'createLoginForm':
              if (values.length >= 2) {
                params.x = parseFloat(values[0]) || 0;
                params.y = parseFloat(values[1]) || 0;
                if (values[2]) params.width = parseFloat(values[2]);
              }
              break;
            case 'moveShape':
              if (values.length >= 3) {
                params.shapeId = values[0].replace(/['"]/g, '');
                params.x = parseFloat(values[1]) || 0;
                params.y = parseFloat(values[2]) || 0;
              }
              break;
            case 'changeShapeColor':
              if (values.length >= 2) {
                params.shapeId = values[0].replace(/['"]/g, '');
                params.color = values[1].replace(/['"]/g, '');
              }
              break;
          }
        }
      }

      return { tool, params };
    } catch (error) {
      console.warn('Failed to parse action string:', actionText, error);
      return null;
    }
  }

  /**
   * Execute an action using the canvas API
   */
  async _executeAction(action) {
    try {
      const { tool, params } = action;

      switch (tool) {
        case 'createShape':
          // Support all createShape parameters
          const shapeParams = {
            shapeType: params.shapeType || params.type,
            x: params.x || 0,
            y: params.y || 0,
            width: params.width,
            height: params.height,
            radiusX: params.radiusX,
            radiusY: params.radiusY,
            fill: params.fill,
            text: params.text,
            fontSize: params.fontSize,
            fontFamily: params.fontFamily,
            stroke: params.stroke,
            strokeWidth: params.strokeWidth,
            background: params.background,
            borderColor: params.borderColor,
            borderWidth: params.borderWidth,
            cornerRadius: params.cornerRadius
          };
          
          // Remove undefined properties
          Object.keys(shapeParams).forEach(key => {
            if (shapeParams[key] === undefined) {
              delete shapeParams[key];
            }
          });
          
          return await this.canvasAPI.createShape(shapeParams);
          
        case 'createLoginForm':
          return await this.canvasAPI.createLoginForm(params);
          
        case 'createNavigationBar':
          return await this.canvasAPI.createNavigationBar(params);
          
        case 'createCardLayout':
          return await this.canvasAPI.createCardLayout(params);
          
        case 'moveShape':
          return await this.canvasAPI.moveShape(params.shapeId, params.x, params.y);
          
        case 'resizeShape':
          // Handle both old and new parameter formats
          const resizeParams = {
            width: params.width,
            height: params.height,
            radiusX: params.radiusX,
            radiusY: params.radiusY,
            scale: params.scale
          };
          // Remove undefined properties
          Object.keys(resizeParams).forEach(key => {
            if (resizeParams[key] === undefined) {
              delete resizeParams[key];
            }
          });
          return await this.canvasAPI.resizeShape(params.shapeId, resizeParams);
          
        case 'rotateShape':
          return await this.canvasAPI.rotateShape(params.shapeId, params.degrees);
          
        case 'changeShapeColor':
          return await this.canvasAPI.changeShapeColor(params.shapeId, params.color);
          
        case 'changeShapeText':
          return await this.canvasAPI.changeShapeText(params.shapeId, params.newText);
          
        case 'arrangeShapes':
          return await this.canvasAPI.arrangeShapes(params);
          
        case 'getCanvasState':
          return this.canvasAPI.getCanvasState();
          
        case 'listShapes':
          return this.canvasAPI.listShapes();
          
        case 'deleteShape':
          return await this.canvasAPI.deleteShape(params.shapeId ? {shapeId: params.shapeId} : params);
          
        default:
          throw new Error(`Unknown tool: ${tool}`);
      }
    } catch (error) {
      console.error(`❌ Failed to execute action ${action.tool}:`, error);
      throw error;
    }
  }
}
