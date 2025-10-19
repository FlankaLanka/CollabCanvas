// AI Canvas Agent - OpenAI Integration with LangChain ReAct Reasoning
// A comprehensive AI agent that manipulates the collaborative canvas through natural language
// using both OpenAI's function calling capabilities and LangChain ReAct reasoning for complex tasks.

// import { SHAPE_TYPES, DEFAULT_SHAPE_PROPS, COLOR_PALETTE } from '../utils/constants';
// Note: CanvasReActAgent is server-side only, frontend uses HTTP requests

// Environment detection
const isDevelopment = import.meta.env.DEV;

// Complex Command Planner - Multi-step execution for complex UI commands
class ComplexPlanner {
  constructor(canvasAPI) {
    this.canvasAPI = canvasAPI;
    this.predefinedPlans = this.initializePredefinedPlans();
    this.lastCreatedContainer = null;
  }

  // Get the last created container for relative positioning
  getLastCreatedContainer() {
    return this.lastCreatedContainer;
  }

  // Set the last created container
  setLastCreatedContainer(container) {
    this.lastCreatedContainer = container;
  }

  // Initialize predefined plans for reliable complex command execution
  initializePredefinedPlans() {
    return {
      'login form': {
        name: 'Login Form Creation',
        steps: [
          // Container - centered at user's viewport
          { action: 'createFormContainer', params: { width: 400, height: 420, centerX: 'viewport', centerY: 'viewport' } },
      
          // Title (left aligned, strong contrast) - relative to container
          { action: 'createShape', params: { 
              shapeType: 'text', text: 'Welcome',
              x: 'container+0', y: 'container-180', fontSize: 32, fill: '#5aaf00', fontWeight: 'bold', align: 'center', fontFamily: 'Comic Sans MS'
          }},
      
          // Username - relative to container
          { action: 'createShape', params: { 
              shapeType: 'text', text: 'Username:',
              x: 'container-75', y: 'container-90', fontSize: 14, fill: '#000000', fontFamily: 'Comic Sans MS'
          }},
          { action: 'createShape', params: { 
              shapeType: 'text_input', text: 'example@email.com',
              x: 'container+0', y: 'container-40', width: 352, height: 44,
              fill: '#FFFFFF', borderColor: '#D1D5DB', fill: '#a0a0a0'
          }},
      
          // Password - relative to container
          { action: 'createShape', params: { 
              shapeType: 'text', text: 'Password:',
              x: 'container-75', y: 'container+10', fontSize: 14, textColor: '#000000', fontFamily: 'Comic Sans MS'
          }},
          { action: 'createShape', params: { 
              shapeType: 'text_input', text: '********',
              x: 'container+0', y: 'container+60', width: 352, height: 44,
              fill: '#FFFFFF', borderColor: '#D1D5DB', fill: '#a0a0a0'
          }},
      
          // Button (full inner width, clear contrast) - relative to container
          { action: 'createShape', params: { 
              shapeType: 'rectangle', text: 'Sign In',
              x: 'container+0', y: 'container+130', width: 100, height: 50,
              fill: '#3B82F6', textColor: '#FFFFFF', fontSize: 16, fontWeight: 'bold'
          }},
          { action: 'createShape', params: { 
            shapeType: 'text', text: 'Log in',
            x: 'container+0', y: 'container+115', fontSize: 14, fill: '#ffffff', align: 'center', fontFamily: 'Comic Sans MS'
        }},

        // forgot password?
          { action: 'createShape', params: { 
            shapeType: 'text', text: 'Forgot your password?',
            x: 'container+175', y: 'container+180', fontSize: 10, fill: '#0000ff'
        }},
        ]
      },
      'navigation bar': {
        name: 'Navigation Bar Creation',
        steps: [
          // Container - centered at user's viewport
          { action: 'createFormContainer', params: { width: 800, height: 60, centerX: 'viewport', centerY: 'viewport' } },
          
          // Navigation items - relative to container
          { action: 'createShape', params: { shapeType: 'text', text: '🏠Home', x: 'container+20', y: 'container+0', fontSize: 16, fill: '#FFFFFF' } },
          { action: 'createShape', params: { shapeType: 'text', text: '👤About', x: 'container+100', y: 'container+0', fontSize: 16, fill: '#FFFFFF' } },
          { action: 'createShape', params: { shapeType: 'text', text: '📞Contact', x: 'container+180', y: 'container+0', fontSize: 16, fill: '#FFFFFF' } },
          { action: 'createShape', params: { shapeType: 'text', text: '💼Services', x: 'container+260', y: 'container+0', fontSize: 16, fill: '#FFFFFF' } }
        ]
      },
      'card layout': {
        name: 'Card Layout Creation',
        steps: [
          // Container - centered at user's viewport
          { action: 'createFormContainer', params: { width: 300, height: 200, centerX: 'viewport', centerY: 'viewport' } },
          
          // Card content - relative to container
          { action: 'createShape', params: { shapeType: 'text', text: 'Card Title', x: 'container+20', y: 'container+20', fontSize: 18, fill: '#1F2937' } },
          { action: 'createShape', params: { shapeType: 'text', text: 'This is the card content area where you can place your main information.', x: 'container+20', y: 'container+60', fontSize: 14, fill: '#6B7280' } },
          { action: 'createShape', params: { shapeType: 'rectangle', text: 'Learn More', x: 'container+20', y: 'container+150', width: 100, height: 30, fill: '#3B82F6' } }
        ]
      },
      'dashboard': {
        name: 'Dashboard Creation',
        steps: [
          // Container - centered at user's viewport
          { action: 'createFormContainer', params: { width: 800, height: 600, centerX: 'viewport', centerY: 'viewport' } },
          
          // Dashboard content - relative to container
          { action: 'createShape', params: { shapeType: 'text', text: 'Dashboard', x: 'container+20', y: 'container+20', fontSize: 24, fill: '#1F2937' } },
          
          // First metric card - relative to container
          { action: 'createShape', params: { shapeType: 'rectangle', x: 'container+20', y: 'container+60', width: 200, height: 120, fill: '#FFFFFF' } },
          { action: 'createShape', params: { shapeType: 'text', text: 'Total Users', x: 'container+30', y: 'container+80', fontSize: 14, fill: '#6B7280' } },
          { action: 'createShape', params: { shapeType: 'text', text: '1,234', x: 'container+30', y: 'container+100', fontSize: 24, fill: '#1F2937' } },
          
          // Second metric card - relative to container
          { action: 'createShape', params: { shapeType: 'rectangle', x: 'container+240', y: 'container+60', width: 200, height: 120, fill: '#FFFFFF' } },
          { action: 'createShape', params: { shapeType: 'text', text: 'Revenue', x: 'container+250', y: 'container+80', fontSize: 14, fill: '#6B7280' } },
          { action: 'createShape', params: { shapeType: 'text', text: '$12,345', x: 'container+250', y: 'container+100', fontSize: 24, fill: '#1F2937' } }
        ]
      },
      'contact form': {
        name: 'Contact Form Creation',
        steps: [
          // Container - centered at user's viewport
          { action: 'createFormContainer', params: { width: 450, height: 600, centerX: 'viewport', centerY: 'viewport' } },
          
          // Create form title - relative to container
          { action: 'createShape', params: { shapeType: 'text', text: 'Contact Us', x: 'container+24', y: 'container+24', fontSize: 24, fill: '#1F2937', fontWeight: 'bold' } },
          
          // Name section - relative to container
          { action: 'createShape', params: { shapeType: 'text', text: 'Full Name', x: 'container+24', y: 'container+64', fontSize: 14, fill: '#374151' } },
          { action: 'createShape', params: { shapeType: 'text_input', text: 'Enter your full name', x: 'container+24', y: 'container+76', width: 402, height: 44, fill: '#FFFFFF', borderColor: '#D1D5DB', textColor: '#1F2937' } },
          
          // Email section - relative to container
          { action: 'createShape', params: { shapeType: 'text', text: 'Email Address', x: 'container+24', y: 'container+144', fontSize: 14, fill: '#374151' } },
          { action: 'createShape', params: { shapeType: 'text_input', text: 'Enter your email address', x: 'container+24', y: 'container+156', width: 402, height: 44, fill: '#FFFFFF', borderColor: '#D1D5DB', textColor: '#1F2937' } },
          
          // Message section - relative to container
          { action: 'createShape', params: { shapeType: 'text', text: 'Message', x: 'container+24', y: 'container+224', fontSize: 14, fill: '#374151' } },
          { action: 'createShape', params: { shapeType: 'text_input', text: 'Enter your message here...', x: 'container+24', y: 'container+236', width: 402, height: 120, fill: '#FFFFFF', borderColor: '#D1D5DB', textColor: '#1F2937' } },
          
          // Submit button - relative to container
          { action: 'createShape', params: { shapeType: 'rectangle', text: 'Send Message', x: 'container+24', y: 'container+380', width: 150, height: 48, fill: '#3B82F6', textColor: '#FFFFFF', fontSize: 16, fontWeight: 'bold' } }
        ]
      }
    };
  }

  // Detect if a command is complex and requires multi-step planning
  isComplexCommand(userMessage) {
    const complexPatterns = [
      /create.*login.*form/i,
      /build.*login.*form/i,
      /generate.*login.*form/i,
      /create.*navigation.*bar/i,
      /build.*navbar/i,
      /create.*nav.*bar/i,
      /create.*card.*layout/i,
      /build.*card/i,
      /create.*dashboard/i,
      /build.*dashboard/i,
      /create.*contact.*form/i,
      /build.*contact.*form/i,
      /create.*form/i,
      /build.*form/i,
      /create.*ui.*component/i,
      /build.*ui.*component/i,
      /create.*layout/i,
      /build.*layout/i
    ];

    return complexPatterns.some(pattern => pattern.test(userMessage));
  }

  // Generate a step-by-step execution plan for complex commands
  generatePlan(userMessage, canvasState = null) {
    const message = userMessage.toLowerCase();
    
    // Check for predefined plans first
    for (const [key, plan] of Object.entries(this.predefinedPlans)) {
      if (message.includes(key)) {
        return {
          type: 'predefined',
          name: plan.name,
          steps: plan.steps,
          source: 'predefined'
        };
      }
    }

    // Generate dynamic plan based on command analysis
    return this.generateDynamicPlan(userMessage, canvasState);
  }

  // Generate a dynamic plan based on command analysis
  generateDynamicPlan(userMessage, canvasState) {
    const steps = [];
    const message = userMessage.toLowerCase();

    // Analyze the command and generate appropriate steps
    if (message.includes('form')) {
      steps.push(
        { action: 'createFormContainer', params: { width: 360, height: 400, centerX: 'viewport', centerY: 'viewport' } },
        { action: 'createShape', params: { shapeType: 'text', text: 'Form Title', x: 'container+20', y: 'container+20', fontSize: 18, fill: '#1F2937' } },
        { action: 'createShape', params: { shapeType: 'text_input', text: 'Input field', x: 'container+20', y: 'container+60', width: 320, height: 40, fill: '#FFFFFF' } },
        { action: 'createShape', params: { shapeType: 'rectangle', text: 'Submit', x: 'container+20', y: 'container+120', width: 100, height: 40, fill: '#3B82F6' } }
      );
    } else if (message.includes('card')) {
      steps.push(
        { action: 'createFormContainer', params: { width: 300, height: 200, centerX: 'viewport', centerY: 'viewport' } },
        { action: 'createShape', params: { shapeType: 'text', text: 'Card Title', x: 'container+20', y: 'container+20', fontSize: 18, fill: '#1F2937' } },
        { action: 'createShape', params: { shapeType: 'text', text: 'Card content goes here', x: 'container+20', y: 'container+60', fontSize: 14, fill: '#6B7280' } }
      );
    } else if (message.includes('navigation') || message.includes('navbar')) {
      steps.push(
        { action: 'createFormContainer', params: { width: 800, height: 60, centerX: 'viewport', centerY: 'viewport' } },
        { action: 'createShape', params: { shapeType: 'text', text: 'Home', x: 'container+20', y: 'container+20', fontSize: 16, fill: '#FFFFFF' } },
        { action: 'createShape', params: { shapeType: 'text', text: 'About', x: 'container+100', y: 'container+20', fontSize: 16, fill: '#FFFFFF' } },
        { action: 'createShape', params: { shapeType: 'text', text: 'Contact', x: 'container+180', y: 'container+20', fontSize: 16, fill: '#FFFFFF' } }
      );
    }

    return {
      type: 'dynamic',
      name: 'Custom UI Component',
      steps: steps,
      source: 'generated'
    };
  }

  // Execute a complex command plan step by step
  async executePlan(plan, debug = false) {
    const results = [];
    const errors = [];

    if (debug) {
      console.log(`🎯 Executing complex plan: ${plan.name}`);
      console.log(`📋 Plan type: ${plan.type} (${plan.source})`);
      console.log(`📝 Steps to execute: ${plan.steps.length}`);
    }

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      
      if (debug) {
        console.log(`🔧 Step ${i + 1}/${plan.steps.length}: ${step.action}`, step.params);
      }

      try {
        // Execute the step using the canvas API
        const result = await this.executeStep(step);
        results.push({
          step: i + 1,
          action: step.action,
          success: true,
          result: result
        });

        if (debug) {
          console.log(`✅ Step ${i + 1} completed successfully`);
        }
      } catch (error) {
        console.error(`❌ Step ${i + 1} failed:`, error);
        errors.push({
          step: i + 1,
          action: step.action,
          error: error.message
        });

        // Continue with remaining steps even if one fails
        if (debug) {
          console.log(`⚠️ Continuing with remaining steps...`);
        }
        
        // For non-critical steps like autoFixUI, we can continue
        // For critical steps like createShape, we might want to stop
        if (step.action === 'autoFixUI' || step.action === 'stackVertically' || step.action === 'alignHorizontally') {
          console.log(`⚠️ Non-critical step failed, continuing with plan...`);
        }
      }
    }

    return {
      planName: plan.name,
      totalSteps: plan.steps.length,
      successfulSteps: results.length,
      failedSteps: errors.length,
      results: results,
      errors: errors,
      success: errors.length === 0
    };
  }

  // Execute a single step in the plan
  async executeStep(step) {
    const { action, params } = step;

    // Handle special cases for auto-detection
    if (params.elements === 'auto' || params.container === 'auto') {
      // Get recent shapes for auto-detection
      const recentShapes = this.canvasAPI.getCanvasState().shapes.slice(-5);
      params.elements = recentShapes.map(shape => shape.id);
      params.container = recentShapes[0]?.id; // Use first shape as container
    }

    // Map action to canvas API method
    switch (action) {
      case 'createFormContainer':
        // Handle viewport centering
        let centerX = params.centerX;
        let centerY = params.centerY;
        
        if (params.centerX === 'viewport' || params.centerY === 'viewport') {
          const viewportCenter = this.canvasAPI.getViewportCenter();
          centerX = params.centerX === 'viewport' ? viewportCenter.x : params.centerX;
          centerY = params.centerY === 'viewport' ? viewportCenter.y : params.centerY;
        }
        
        const container = await this.canvasAPI.createFormContainer(
          params.width, 
          params.height, 
          centerX, 
          centerY
        );
        
        // Store the container for relative positioning
        this.setLastCreatedContainer(container);
        
        return container;

      case 'createShape':
        // Handle container-relative positioning
        let finalX = params.x;
        let finalY = params.y;
        
        if (typeof params.x === 'string' && params.x.startsWith('container')) {
          const offset = parseInt(params.x.replace('container', ''));
          const container = this.getLastCreatedContainer();
          finalX = container ? container.x + offset : offset;
        }
        
        if (typeof params.y === 'string' && params.y.startsWith('container')) {
          const offset = parseInt(params.y.replace('container', ''));
          const container = this.getLastCreatedContainer();
          finalY = container ? container.y + offset : offset;
        }
        
        // Handle text input shapes with better readability
        if (params.shapeType === 'text_input') {
          // Ensure good contrast for text input fields
          const textColor = params.textColor || '#1F2937'; // Dark gray for readability
          const borderColor = params.borderColor || '#D1D5DB'; // Light gray border
          const backgroundColor = params.fill || '#FFFFFF'; // White background
          
          return await this.canvasAPI.createShape({
            ...params,
            x: finalX,
            y: finalY,
            fill: backgroundColor,
            textColor: textColor,
            borderColor: borderColor,
            fontSize: params.fontSize || 16,
            fontWeight: params.fontWeight || 'normal',
            fontFamily: params.fontFamily || 'Arial, sans-serif' // Pass through fontFamily
          });
        }
        
        // Handle regular text shapes with proper contrast
        if (params.shapeType === 'text') {
          const textColor = params.textColor || params.fill || '#1F2937'; // Use textColor if provided, fallback to fill
          return await this.canvasAPI.createShape({
            ...params,
            x: finalX,
            y: finalY,
            fill: textColor, // Use the resolved textColor
            fontSize: params.fontSize || 16,
            fontWeight: params.fontWeight || 'normal',
            fontFamily: params.fontFamily || 'Arial, sans-serif', // Pass through fontFamily
            textAlign: params.textAlign || 'left' // Pass through textAlign
          });
        }
        
        // Handle button shapes with proper styling
        if (params.shapeType === 'rectangle' && params.text) {
          const buttonColor = params.fill || '#3B82F6';
          const textColor = params.textColor || '#FFFFFF';
          return await this.canvasAPI.createShape({
            ...params,
            x: finalX,
            y: finalY,
            fill: buttonColor,
            textColor: textColor,
            fontSize: params.fontSize || 16,
            fontWeight: params.fontWeight || 'bold'
          });
        }
        
        return await this.canvasAPI.createShape({
          ...params,
          x: finalX,
          y: finalY
        });

      case 'stackVertically':
        return await this.canvasAPI.stackVertically(
          params.elements, 
          params.container, 
          params.startY, 
          params.gap
        );

      case 'alignHorizontally':
        return await this.canvasAPI.alignHorizontally(
          params.elements, 
          params.centerX, 
          params.startY, 
          params.gap
        );

      case 'autoFixUI':
        try {
          return await this.canvasAPI.autoFixUI();
        } catch (error) {
          console.warn('autoFixUI failed, continuing with plan:', error.message);
          return { success: false, error: error.message };
        }

      case 'placeBelow':
        return await this.canvasAPI.placeBelow(
          params.shapeId, 
          params.referenceShapeId, 
          params.gap
        );

      case 'placeRightOf':
        return await this.canvasAPI.placeRightOf(
          params.shapeId, 
          params.referenceShapeId, 
          params.gap
        );

      case 'centerInContainer':
        return await this.canvasAPI.centerInContainer(
          params.shapeId, 
          params.containerId
        );

      case 'centerContainer':
        return this.canvasAPI.centerContainer(
          params.width, 
          params.height, 
          params.canvasWidth, 
          params.canvasHeight
        );

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  // Generate a friendly conversational response for complex commands
  generateFriendlyResponse(executionResult, planName) {
    const { successfulSteps, totalSteps, errors } = executionResult;
    
    if (successfulSteps === totalSteps) {
      return `✅ Perfect! I've created a ${planName.toLowerCase()} with ${successfulSteps} components, all properly aligned and styled.`;
    } else if (successfulSteps > 0) {
      return `✅ Great! I've created a ${planName.toLowerCase()} with ${successfulSteps} out of ${totalSteps} components. ${errors.length > 0 ? 'Some steps had minor issues, but the main structure is complete.' : ''}`;
    } else {
      return `⚠️ I encountered some issues while creating the ${planName.toLowerCase()}. Please try again or let me know if you need help with a specific part.`;
    }
  }
}

// API endpoint configuration with environment-based switching
const USE_LOCAL_AI = import.meta.env.VITE_USE_LOCAL_AI === 'true';
const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL;

// Determine which endpoint to use
let AI_API_ENDPOINT;
if (AI_SERVER_URL) {
  // Use custom AI server URL if provided
  AI_API_ENDPOINT = AI_SERVER_URL;
} else if (USE_LOCAL_AI) {
  // Use local AI server
  AI_API_ENDPOINT = 'http://localhost:3000/api/ai-chat';
} else {
  // Use AWS for production
  AI_API_ENDPOINT = 'https://vtxv073yg9.execute-api.us-east-1.amazonaws.com/api/ai-chat';
}

// Log which endpoint is being used
console.log('🤖 AI Endpoint Configuration:', {
  USE_LOCAL_AI,
  AI_SERVER_URL,
  AI_API_ENDPOINT,
  environment: isDevelopment ? 'development' : 'production'
});

// Debug logging removed for production

// AI Function Definitions for Canvas Operations
export const AI_FUNCTIONS = [
  // CREATION COMMANDS
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
            { type: 'string', description: '"center" for origin (0,0)' }
          ]
        },
        y: {
          oneOf: [
            { type: 'number', description: 'New Y position' },
            { type: 'string', description: '"center" for origin (0,0)' }
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
    description: 'Create multiple shapes with automatic layout. Use this for ANY command involving quantities, grids, or arrays (5 circles, 3x3 grid, 2x4 grid, etc.). CRITICAL: "3x3 grid" means 9 shapes in a 3x3 grid, NOT 1 shape with 3x3 dimensions. ALWAYS use this instead of createShape when count > 1 or when user mentions "grid", "array", or multiple items.',
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
        avoidOverlaps: {
          type: 'boolean',
          description: 'Whether to avoid overlapping existing shapes (default: true)'
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
    description: 'Create a professional login form with proper alignment using blueprint system. Generates username/password fields as text_input shapes (NOT rectangles), with labels positioned ABOVE inputs, and centered login button. All elements aligned within a container.',
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'X position for the form (optional, defaults to viewport center)'
        },
        y: {
          type: 'number',
          description: 'Y position for the form (optional, defaults to viewport center)'
        },
        width: {
          type: 'number',
          description: 'Width of the form (optional, defaults to 360)'
        }
      },
      required: []
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
  },

  // DESIGN SYSTEM & QUALITY TOOLS
  {
    name: 'autoAlignUI',
    description: 'Auto-align all shapes to 8px grid and fix common alignment issues',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'checkUIQuality',
    description: 'Check UI quality and return any issues (contrast, alignment, spacing)',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'autoFixUI',
    description: 'Automatically fix UI quality issues (contrast, alignment, font sizes)',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'layoutStack',
    description: 'Layout shapes in a vertical or horizontal stack',
    parameters: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['vertical', 'horizontal'],
          description: 'Stack direction'
        },
        gap: {
          type: 'number',
          description: 'Spacing between shapes in pixels'
        },
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs to layout (optional, uses selection if not provided)'
        }
      },
      required: []
    }
  },
  {
    name: 'layoutGrid',
    description: 'Layout shapes in a grid pattern',
    parameters: {
      type: 'object',
      properties: {
        rows: {
          type: 'number',
          description: 'Number of rows in the grid'
        },
        cols: {
          type: 'number',
          description: 'Number of columns in the grid'
        },
        gap: {
          type: 'number',
          description: 'Spacing between grid cells in pixels'
        },
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs to layout (optional, uses selection if not provided)'
        }
      },
      required: ['rows', 'cols']
    }
  },
  {
    name: 'getSelection',
    description: 'Get current selection or recently created shapes',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'validateUILayout',
    description: 'Validate UI layout quality - checks alignment, contrast, spacing, and font sizes',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'createFormContainer',
    description: 'Create a FormContainer - a centered container for form elements',
    parameters: {
      type: 'object',
      properties: {
        width: { type: 'number', description: 'Container width (default 360)' },
        height: { type: 'number', description: 'Container height (default 400)' },
        centerX: { type: 'number', description: 'Center X position (default 400)' },
        centerY: { type: 'number', description: 'Center Y position (default 300)' }
      },
      required: []
    }
  },
  {
    name: 'stackVertically',
    description: 'Stack elements vertically within a container with consistent spacing',
    parameters: {
      type: 'object',
      properties: {
        elements: { type: 'array', description: 'Array of elements to stack' },
        container: { type: 'object', description: 'Container object with positioning info' },
        startY: { type: 'number', description: 'Starting Y position' },
        gap: { type: 'number', description: 'Gap between elements (default 24)' }
      },
      required: ['elements', 'container', 'startY']
    }
  },
  {
    name: 'alignHorizontally',
    description: 'Align elements horizontally at the same x position',
    parameters: {
      type: 'object',
      properties: {
        elements: { type: 'array', description: 'Array of elements to align' },
        centerX: { type: 'number', description: 'Center X position' },
        startY: { type: 'number', description: 'Starting Y position' },
        gap: { type: 'number', description: 'Gap between elements (default 16)' }
      },
      required: ['elements', 'centerX', 'startY']
    }
  },
  {
    name: 'centerContainer',
    description: 'Calculate center position for a container on the canvas',
    parameters: {
      type: 'object',
      properties: {
        width: { type: 'number', description: 'Container width' },
        height: { type: 'number', description: 'Container height' },
        canvasWidth: { type: 'number', description: 'Canvas width (default 800)' },
        canvasHeight: { type: 'number', description: 'Canvas height (default 600)' }
      },
      required: ['width', 'height']
    }
  },
  {
    name: 'createLoginFormWithLayout',
    description: 'PREFERRED: Create a professional login form using advanced blueprint system. Ensures text_input shapes, proper z-index ordering, and perfect alignment.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },

  // RELATIVE POSITIONING TOOLS
  {
    name: 'placeBelow',
    description: 'Place a shape directly below another shape with specified gap',
    parameters: {
      type: 'object',
      properties: {
        shapeId: { type: 'string', description: 'Shape to position' },
        referenceShapeId: { type: 'string', description: 'Shape to position below' },
        gap: { type: 'number', description: 'Gap in pixels (default 24)' }
      },
      required: ['shapeId', 'referenceShapeId']
    }
  },
  {
    name: 'placeRightOf',
    description: 'Place a shape to the right of another shape with specified gap',
    parameters: {
      type: 'object',
      properties: {
        shapeId: { type: 'string', description: 'Shape to position' },
        referenceShapeId: { type: 'string', description: 'Shape to position to the right of' },
        gap: { type: 'number', description: 'Gap in pixels (default 16)' }
      },
      required: ['shapeId', 'referenceShapeId']
    }
  },
  {
    name: 'alignWith',
    description: 'Align a shape with another shape (left, center, right, top, middle, bottom)',
    parameters: {
      type: 'object',
      properties: {
        shapeId: { type: 'string', description: 'Shape to align' },
        referenceShapeId: { type: 'string', description: 'Reference shape' },
        alignment: { 
          type: 'string', 
          enum: ['left', 'center', 'right', 'top', 'middle', 'bottom'],
          description: 'Alignment type'
        }
      },
      required: ['shapeId', 'referenceShapeId', 'alignment']
    }
  },
  {
    name: 'centerInContainer',
    description: 'Center a shape horizontally within its parent container',
    parameters: {
      type: 'object',
      properties: {
        shapeId: { type: 'string', description: 'Shape to center' },
        containerId: { type: 'string', description: 'Container ID (optional, auto-detects if not provided)' }
      },
      required: ['shapeId']
    }
  },
  {
    name: 'setPaddingFromContainer',
    description: 'Set consistent padding between shape and its container edges',
    parameters: {
      type: 'object',
      properties: {
        shapeId: { type: 'string', description: 'Shape to position' },
        containerId: { type: 'string', description: 'Container ID' },
        padding: { type: 'number', description: 'Padding in pixels (default 24)' }
      },
      required: ['shapeId', 'containerId']
    }
  },
  {
    name: 'groupShapes',
    description: 'Group shapes together to maintain their relative positions',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: { type: 'array', items: { type: 'string' }, description: 'Array of shape IDs to group' },
        groupName: { type: 'string', description: 'Optional group name' }
      },
      required: ['shapeIds']
    }
  },
  {
    name: 'distributeInContainer',
    description: 'Distribute shapes evenly within a container',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: { type: 'array', items: { type: 'string' }, description: 'Array of shape IDs to distribute' },
        containerId: { type: 'string', description: 'Container ID' },
        direction: { type: 'string', enum: ['horizontal', 'vertical'], description: 'Distribution direction' },
        margin: { type: 'number', description: 'Edge margin (default 20)' }
      },
      required: ['shapeIds', 'containerId']
    }
  },
  {
    name: 'analyzeShapeRelationships',
    description: 'Analyze spatial relationships between shapes (containers, groups, alignments)',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'validateAndFix',
    description: 'Enhanced validation with pre/post-action checks and automatic fixes',
    parameters: {
      type: 'object',
      properties: {
        operationType: { type: 'string', description: 'Type of operation (form, card, layout)' }
      },
      required: ['operationType']
    }
  },

  // BLUEPRINT SYSTEM TOOLS
  {
    name: 'executeBlueprintPlan',
    description: 'Execute a structured UI blueprint for professional layouts',
    parameters: {
      type: 'object',
      properties: {
        blueprint: { type: 'object', description: 'Blueprint specification with layout hierarchy and constraints' }
      },
      required: ['blueprint']
    }
  },
  {
    name: 'generateLoginFormBlueprint',
    description: 'Generate a professional login form blueprint with proper constraints',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },

  // NATURAL LANGUAGE ROBUSTNESS TOOLS
  {
    name: 'parsePositionCommand',
    description: 'Parse natural language position commands with synonyms and contextual references',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Natural language position command' },
        shapeDescription: { type: 'string', description: 'Optional shape description for reference' }
      },
      required: ['command']
    }
  },
  {
    name: 'resolveTheseShapes',
    description: 'Resolve "these shapes" reference to actual shapes (selected, recent, or all)',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'parseSizeDescriptor',
    description: 'Parse size descriptors (tiny, small, medium, large, huge, very large)',
    parameters: {
      type: 'object',
      properties: {
        sizeText: { type: 'string', description: 'Size descriptor text' }
      },
      required: ['sizeText']
    }
  }
];

// AI Canvas Service - Handles natural language commands and executes canvas operations
export class AICanvasService {
  constructor(canvasAPI) {
    this.canvasAPI = canvasAPI;
    this.conversationHistory = [];
    this.isProcessing = false;
    
    // Initialize complex command planner for multi-step execution
    this.complexPlanner = new ComplexPlanner(canvasAPI);
    
    // Frontend uses HTTP requests to backend, not direct LangChain
    console.log('🤖 AICanvasService initialized (frontend mode)');
    
    // DEBUG: Log available canvasAPI methods
    console.log('🔧 Available canvasAPI tools:', Object.keys(canvasAPI));
    console.log('🔧 canvasAPI.createShape exists:', typeof canvasAPI.createShape === 'function');
    console.log('🔧 canvasAPI.createMultipleShapes exists:', typeof canvasAPI.createMultipleShapes === 'function');
    console.log('🔧 canvasAPI.arrangeInGrid exists:', typeof canvasAPI.arrangeInGrid === 'function');
    
    // DEBUG: Environment detection
    console.log('🌍 Environment:', {
      isDevelopment: isDevelopment,
      aiEndpoint: AI_API_ENDPOINT,
      hasCanvasAPI: !!canvasAPI
    });
  }


  // Process a natural language command with hybrid approach
  async processCommand(userMessage, debug = false) {
    if (this.isProcessing) {
      throw new Error('AI is currently processing another command. Please wait.');
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      // HYBRID APPROACH: Check if this is a complex command that needs multi-step planning
      if (this.complexPlanner.isComplexCommand(userMessage)) {
        console.log('🎯 Complex command detected, using multi-step planner');
        return await this.processComplexCommand(userMessage, startTime, debug);
      }
      
      // BASIC COMMANDS: Use existing ReAct approach for simple commands
      console.log('🔧 Basic command detected, using ReAct approach');
      return await this.processBasicCommand(userMessage, startTime);
      
    } catch (error) {
      console.error('AI processing error:', error);
      throw new Error(`AI processing failed: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  // Process complex commands using multi-step planning
  async processComplexCommand(userMessage, startTime, debug = false) {
    try {
      // Get current canvas state for context
      const currentCanvasState = this.canvasAPI.getCanvasState();
      
      // Generate execution plan
      const plan = this.complexPlanner.generatePlan(userMessage, currentCanvasState);
      
      if (debug) {
        console.log('📋 Generated plan:', plan);
      }
      
      // Execute the plan step by step
      const executionResult = await this.complexPlanner.executePlan(plan, debug);
      
      // Generate friendly response
      const friendlyResponse = this.complexPlanner.generateFriendlyResponse(executionResult, plan.name);
      
      const processingTime = Date.now() - startTime;
      
      return {
        response: friendlyResponse,
        reasoning: [`Executed ${executionResult.successfulSteps} out of ${executionResult.totalSteps} steps`],
        intermediateSteps: executionResult.results.map(r => `${r.step}. ${r.action}`),
        processingTime,
        agentUsed: 'complex-planner',
        planName: plan.name,
        planType: plan.type,
        executionResult: executionResult
      };
      
    } catch (error) {
      console.error('Complex command processing error:', error);
      throw error;
    }
  }

  // Process basic commands using existing ReAct approach
  async processBasicCommand(userMessage, startTime) {
    try {
      // Route basic commands through the server for proper function call execution
      const isUICommand = /login.*form|generate.*login|create.*login|navigation.*bar|nav.*bar|card.*layout|create.*card/i.test(userMessage);
      const isBasicCommand = /create.*|draw.*|add.*|make.*|move.*|resize.*|rotate.*|change.*|arrange.*|space.*|grid.*/i.test(userMessage);
      
      if (isUICommand || isBasicCommand) {
        // Use server proxy for UI commands
        const currentCanvasState = this.canvasAPI.getCanvasState();
        const response = await fetch(AI_API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: `You are an AI assistant that manipulates a collaborative canvas.

🎯 SHAPE DETECTION INTELLIGENCE:
When users mention shapes without specific details (e.g., "rotate the text", "move the circle", "resize the rectangle"), you should:
1. Automatically find the most appropriate shape of that type
2. If multiple shapes exist, pick any one that matches the criteria
3. Use simple type names like "text", "circle", "rectangle" as shapeId parameters
4. NEVER ask for clarification - always take action with the best available match

CURRENT CANVAS STATE:
${JSON.stringify(currentCanvasState, null, 2)}`
              },
              {
                role: 'user',
                content: userMessage
              }
            ],
            temperature: 0.2,
            canvasState: currentCanvasState
          })
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();
        const responseMessage = result.choices[0].message;
        let aiResponse = responseMessage.content;
        const processingTime = Date.now() - startTime;
        
        console.log('🔍 Server response:', {
          content: aiResponse,
          hasToolCalls: !!(responseMessage.tool_calls),
          hasFunctionCalls: !!(responseMessage.function_calls),
          hasFunctionCall: !!(responseMessage.function_call),
          hasToolCall: !!(responseMessage.tool_call),
          toolCallsCount: responseMessage.tool_calls?.length || 0,
          functionCallsCount: responseMessage.function_calls?.length || 0,
          totalCalls: (responseMessage.tool_calls?.length || responseMessage.function_calls?.length || 0) + (responseMessage.tool_call ? 1 : 0) + (responseMessage.function_call ? 1 : 0)
        });
        
        // Execute function calls if any
        const functionCalls = [];
        const results = [];
        
        // Handle new tool_calls format (OpenAI 2024+)
        if (responseMessage.tool_calls && Array.isArray(responseMessage.tool_calls)) {
          console.log('🔧 Executing multiple tool calls:', responseMessage.tool_calls.length);
          for (const toolCall of responseMessage.tool_calls) {
            try {
              console.log('🔧 Executing tool call:', toolCall.function.name, 'with args:', toolCall.function.arguments);
              const result = await this.executeFunctionCall({
                name: toolCall.function.name,
                arguments: toolCall.function.arguments
              });
              results.push(result);
              functionCalls.push({
                name: toolCall.function.name,
                arguments: toolCall.function.arguments
              });
              console.log('✅ Tool call executed successfully:', toolCall.function.name, 'result:', result);
            } catch (functionError) {
              console.error('❌ Tool call execution error:', functionError);
            }
          }
        }
        // Handle old function_calls format (legacy)
        else if (responseMessage.function_calls && Array.isArray(responseMessage.function_calls)) {
          console.log('🔧 Executing multiple function calls:', responseMessage.function_calls.length);
          for (const functionCall of responseMessage.function_calls) {
            try {
              console.log('🔧 Executing function call:', functionCall.name, 'with args:', functionCall.arguments);
              const result = await this.executeFunctionCall(functionCall);
              results.push(result);
              functionCalls.push(functionCall);
              console.log('✅ Composite function executed successfully:', functionCall.name, 'result:', result);
            } catch (functionError) {
              console.error('❌ Composite function execution error:', functionError);
            }
          }
        } else if (responseMessage.tool_call) {
          // Handle single tool call (new format)
          const toolCall = responseMessage.tool_call;
          try {
            console.log('🔧 Executing single tool call:', toolCall.function.name, 'with args:', toolCall.function.arguments);
            const result = await this.executeFunctionCall({
              name: toolCall.function.name,
              arguments: toolCall.function.arguments
            });
            results.push(result);
            functionCalls.push({
              name: toolCall.function.name,
              arguments: toolCall.function.arguments
            });
            console.log('✅ Tool call executed successfully:', toolCall.function.name, 'result:', result);
          } catch (functionError) {
            console.error('❌ Tool call execution error:', functionError);
          }
        } else if (responseMessage.function_call) {
          // Handle single function call (legacy format)
          const functionCall = responseMessage.function_call;
          try {
            console.log('🔧 Executing single function call:', functionCall.name, 'with args:', functionCall.arguments);
            const result = await this.executeFunctionCall(functionCall);
            results.push(result);
            functionCalls.push(functionCall);
            console.log('✅ Function executed successfully:', functionCall.name, 'result:', result);
          } catch (functionError) {
            console.error('❌ Function execution error:', functionError);
          }
        } else {
          console.log('⚠️ No function calls found in response');
        }
        
        // Quality Gate: Check and fix UI issues after UI commands only
        if (isUICommand) {
          try {
            console.log('🔍 Running quality gate for UI command...');
            
            // Get current canvas state to understand spatial positions
            const canvasState = this.canvasAPI.getCanvasState();
            console.log('📊 Canvas state:', { shapes: canvasState.shapes.length, totalShapes: canvasState.totalShapes });
            
            // Validate UI layout quality
            const validation = await this.canvasAPI.validateUILayout();
            console.log('🔍 UI validation result:', { valid: validation.valid, score: validation.score, issues: validation.issues.length });
            
            if (!validation.valid || validation.issues.length > 0) {
              console.log('⚠️ Found UI issues:', validation.issues);
              const fixResult = await this.canvasAPI.autoFixUI();
              console.log('🔧 Applied quality fixes:', fixResult);
              aiResponse += ` Applied quality fixes to ensure proper alignment, contrast, and spacing.`;
            } else {
              console.log('✅ UI layout is valid');
            }
          } catch (qualityError) {
            console.warn('⚠️ Quality gate error (non-critical):', qualityError);
          }
        } else {
          console.log('🔍 Skipping quality gate for basic command to preserve exact positioning');
        }
        
        return {
          response: aiResponse,
          reasoning: [],
          intermediateSteps: [],
          processingTime,
          agentUsed: 'server-ui',
          functionCalls,
          results
        };
      } else {
        // Handle basic commands directly with canvas API
        return await this._processBasicCommand(userMessage, startTime);
      }
    } catch (error) {
      console.error('Basic command processing error:', error);
      throw error;
    }
  }

  // Process basic commands using OpenAI function calling
  async _processBasicCommand(userMessage, startTime) {
    try {
      // Refresh canvas context to ensure we have the latest data
      if (this.canvasAPI.refreshContext) {
        this.canvasAPI.refreshContext();
      }

      // Get the most current canvas state
      const currentCanvasState = this.canvasAPI.getCanvasState();
      
      // Add selected shapes to canvas state for layout commands
      const selectedShapes = this.canvasAPI.canvas.getSelectedShapes 
        ? this.canvasAPI.canvas.getSelectedShapes()
        : [];
      
      currentCanvasState.selectedShapes = selectedShapes;
      currentCanvasState.selectedShapeCount = selectedShapes.length;

      // Prepare conversation with system context
      const messages = [
        {
          role: 'system',
          content: `You are an AI assistant that manipulates a collaborative canvas.

🎯 SHAPE DETECTION INTELLIGENCE:
When users mention shapes without specific details (e.g., "rotate the text", "move the circle", "resize the rectangle"), you should:
1. Automatically find the most appropriate shape of that type
2. If multiple shapes exist, pick any one that matches the criteria
3. Use simple type names like "text", "circle", "rectangle" as shapeId parameters
4. NEVER ask for clarification - always take action with the best available match

CURRENT CANVAS STATE:
${JSON.stringify(currentCanvasState, null, 2)}

The server will handle command interpretation automatically. Just pass the user's request as-is.`
        },
        {
          role: 'user',
          content: userMessage
        }
      ];

      // Use server proxy for OpenAI function calling
      const response = await fetch(AI_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          functions: AI_FUNCTIONS,
          function_call: 'auto',
          canvasState: currentCanvasState
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const completion = await response.json();
      const responseMessage = completion.choices[0].message;
      let aiResponse = responseMessage.content || 'I\'ve executed your request.';
      const functionCalls = [];
      const results = [];

      // Check for tool calls (new format) first
      if (responseMessage.tool_calls && Array.isArray(responseMessage.tool_calls)) {
        console.log('🔧 Executing multiple tool calls:', responseMessage.tool_calls.length);
        for (const toolCall of responseMessage.tool_calls) {
          try {
            console.log('🔧 Executing tool call:', toolCall.function.name, 'with args:', toolCall.function.arguments);
            const result = await this.executeFunctionCall({
              name: toolCall.function.name,
              arguments: toolCall.function.arguments
            });
            results.push(result);
            functionCalls.push({
              name: toolCall.function.name,
              arguments: toolCall.function.arguments
            });
            console.log('✅ Tool call executed successfully:', toolCall.function.name, 'result:', result);
          } catch (functionError) {
            console.error('❌ Tool call execution error:', functionError);
          }
        }
        aiResponse = responseMessage.content || `✅ Executed ${results.length} operations successfully.`;
      }
      // Check for multiple function calls (legacy format)
      else if (responseMessage.function_calls && Array.isArray(responseMessage.function_calls)) {
        console.log('🔧 Executing multiple function calls:', responseMessage.function_calls.length);
        for (const functionCall of responseMessage.function_calls) {
          try {
            console.log('🔧 Executing function call:', functionCall.name, 'with args:', functionCall.arguments);
            const result = await this.executeFunctionCall(functionCall);
            results.push(result);
            functionCalls.push(functionCall);
            console.log('✅ Composite function executed successfully:', functionCall.name, 'result:', result);
          } catch (functionError) {
            console.error('❌ Composite function execution error:', functionError);
          }
        }
        aiResponse = responseMessage.content || `✅ Executed ${results.length} operations successfully.`;
      }
      // Execute single tool call (new format)
      else if (responseMessage.tool_call) {
        const toolCall = responseMessage.tool_call;
        functionCalls.push({
          name: toolCall.function.name,
          arguments: toolCall.function.arguments
        });

        try {
          const result = await this.executeFunctionCall({
            name: toolCall.function.name,
            arguments: toolCall.function.arguments
          });
          results.push(result);
          console.log('✅ Tool call executed successfully:', toolCall.function.name);
        } catch (functionError) {
          console.error('❌ Tool call execution error:', functionError);
        }
      }
      // Execute single function call (legacy format)
      else if (responseMessage.function_call) {
        const functionCall = responseMessage.function_call;
        functionCalls.push(functionCall);

        try {
          const result = await this.executeFunctionCall(functionCall);
          results.push(result);
          console.log('✅ Function executed successfully:', functionCall.name);
          
          // Provide conversational response
          switch (functionCall.name) {
            case 'createShape':
              if (result && result.type) {
                const shapeDesc = this.getShapeDescription(result);
                aiResponse = `✅ Created! I've added a ${shapeDesc} to the canvas.`;
              } else {
                aiResponse = `✅ Done! I've created the shape.`;
              }
              break;
            default:
              aiResponse = `✅ Done! I've executed your request.`;
          }
        } catch (functionError) {
          console.error('❌ Function execution error:', functionError);
          aiResponse = `I encountered an error while executing the command: ${functionError.message}`;
        }
      }

      // Quality Gate: Skip for basic commands to preserve exact positioning
      // Only run quality gate for complex UI layouts, not simple shape creation
      console.log('🔍 Skipping quality gate for basic command to preserve exact positioning');

          const processingTime = Date.now() - startTime;
          
          return {
        response: aiResponse,
        functionCalls,
        results,
            processingTime,
        agentUsed: 'function-calling'
          };
        } catch (error) {
      console.error('Basic command processing error:', error);
      throw error;
    }
  }

  // Process command using the original OpenAI function calling approach
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
      
      // DEBUG: Log system prompt and tool definitions
      console.log('📝 AI_FUNCTIONS available:', AI_FUNCTIONS.length);
      console.log('📝 createShape function exists:', AI_FUNCTIONS.find(f => f.name === 'createShape'));
      console.log('📝 createMultipleShapes function exists:', AI_FUNCTIONS.find(f => f.name === 'createMultipleShapes'));

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
      
      // DEBUG: Log the full request being sent
      const requestBody = {
        messages: messages,
        functions: AI_FUNCTIONS,
        function_call: 'auto'
      };
      console.log('📤 AI API Request:', {
        endpoint: AI_API_ENDPOINT,
        functionsCount: AI_FUNCTIONS.length,
        hasCreateShape: AI_FUNCTIONS.some(f => f.name === 'createShape'),
        userMessage: userMessage
      });
      
      const response = await fetch(AI_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
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
      
      // DEBUG: Log the full AI response
      console.log('📥 AI API Response:', {
        hasChoices: !!completion.choices,
        choicesLength: completion.choices?.length,
        hasFunctionCall: !!completion.choices?.[0]?.message?.function_call,
        hasContent: !!completion.choices?.[0]?.message?.content,
        content: completion.choices?.[0]?.message?.content?.substring(0, 100) + '...'
      });

      const responseMessage = completion.choices[0].message;
      let aiResponse = responseMessage.content || 'I\'ve executed your request.';
      const functionCalls = [];
      const results = [];

      // DEBUG: Log what the AI decided to do
      console.log('🤖 AI Decision:', {
        hasToolCall: !!responseMessage.tool_call,
        hasFunctionCall: !!responseMessage.function_call,
        hasToolCalls: !!(responseMessage.tool_calls),
        hasFunctionCalls: !!(responseMessage.function_calls),
        toolCallName: responseMessage.tool_call?.function?.name,
        functionName: responseMessage.function_call?.name,
        hasContent: !!responseMessage.content,
        contentPreview: responseMessage.content?.substring(0, 50) + '...'
      });

      // Execute tool calls (new format) first
      if (responseMessage.tool_call) {
        const toolCall = responseMessage.tool_call;
        functionCalls.push({
          name: toolCall.function.name,
          arguments: toolCall.function.arguments
        });
        
        console.log('🔧 AI decided to run tool:', toolCall.function.name, 'with params:', JSON.parse(toolCall.function.arguments));
        
        try {
          const result = await this.executeFunctionCall({
            name: toolCall.function.name,
            arguments: toolCall.function.arguments
          });
          results.push(result);
          console.log('✅ Tool call executed successfully:', toolCall.function.name);
        } catch (functionError) {
          console.error('❌ Tool call execution error:', functionError);
        }
      }
      // Execute function calls (legacy format)
      else if (responseMessage.function_call) {
        const functionCall = responseMessage.function_call;
        functionCalls.push(functionCall);
        
        console.log('🔧 AI decided to run:', functionCall.name, 'with params:', JSON.parse(functionCall.arguments));

        try {
          const result = await this.executeFunctionCall(functionCall);
          results.push(result);
          console.log('✅ Function executed successfully:', functionCall.name);
          
          // SAFE-GUARD: Verify shape creation for shape-related commands
          if (['createShape', 'createMultipleShapes'].includes(functionCall.name)) {
            const canvasStateAfter = this.canvasAPI.getCanvasState();
            const shapesBefore = currentCanvasState.totalShapes;
            const shapesAfter = canvasStateAfter.totalShapes;
            
            console.log('🛡️ Safe-guard check:', {
              functionName: functionCall.name,
              shapesBefore,
              shapesAfter,
              shapesCreated: shapesAfter - shapesBefore,
              success: shapesAfter > shapesBefore
            });
            
            if (shapesAfter <= shapesBefore) {
              console.warn('⚠️ Safe-guard triggered: No shapes were created despite function call');
              aiResponse = `I attempted to create a shape but it didn't appear on the canvas. This might be a technical issue. Please try again or contact support if the problem persists.`;
            }
          }
          
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
      } else {
        // No function call - AI provided a text response
        console.log('💬 AI provided text response (no function call)');
        
        // SAFE-GUARD: Detect if user requested shape creation but got text response
        const isShapeRequest = /create|add|make|draw|generate.*(shape|circle|rectangle|triangle|square)/i.test(userMessage);
        if (isShapeRequest) {
          console.warn('⚠️ Safe-guard triggered: User requested shape creation but AI generated text response');
          console.warn('⚠️ This indicates the production AI endpoint is not properly configured for function calling');
          console.warn('⚠️ Expected: Function call to createShape or createMultipleShapes');
          console.warn('⚠️ Actual: Text response without function calls');
          
          // Override the AI response with a helpful error message
          aiResponse = `I understand you want to create a shape, but I'm having trouble with the shape creation system in production. This appears to be a technical issue where the AI is generating text instead of calling the shape creation functions. Please try again, or if the problem persists, there may be a configuration issue with the production AI endpoint.`;
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

  // Get a friendly description of a shape
  getShapeDescription(shape) {
    const color = shape.fill || 'default';
    const type = shape.type || 'shape';
    return `${color} ${type}`;
  }

  // Execute a function call from the AI
  async executeFunctionCall(functionCall) {
    const { name, arguments: args } = functionCall;
    const parsedArgs = JSON.parse(args);

    console.log('🔧 Executing function:', name, 'with args:', parsedArgs);
    
    // DEBUG: Log canvas state before execution
    const canvasStateBefore = this.canvasAPI.getCanvasState();
    console.log('📊 Canvas state BEFORE execution:', {
      shapesCount: canvasStateBefore.totalShapes,
      shapes: canvasStateBefore.shapes.slice(0, 3).map(s => `${s.type} at (${s.x}, ${s.y})`)
    });

    switch (name) {
      case 'createShape':
        console.log('🔧 Calling canvasAPI.createShape with:', parsedArgs);
        console.log('🔧 canvasAPI.createShape type:', typeof this.canvasAPI.createShape);
        
        try {
          const result = await this.canvasAPI.createShape(parsedArgs);
          console.log('🔧 createShape result:', result);
          
          // DEBUG: Verify shape was actually created
          const canvasStateAfter = this.canvasAPI.getCanvasState();
          console.log('📊 Canvas state AFTER createShape:', {
            shapesCount: canvasStateAfter.totalShapes,
            newShapes: canvasStateAfter.shapes.slice(canvasStateBefore.totalShapes),
            shapeCreated: canvasStateAfter.totalShapes > canvasStateBefore.totalShapes
          });
          
          return result;
        } catch (error) {
          console.error('❌ createShape failed:', error);
          throw error;
        }
        
      case 'moveShape':
        // Handle center positioning
        let x = parsedArgs.x;
        let y = parsedArgs.y;
        
        // Convert "center" strings to origin (0,0)
        if (x === 'center' || y === 'center') {
          if (x === 'center') x = 0;
          if (y === 'center') y = 0;
        }
        
        return await this.canvasAPI.moveShape(parsedArgs.shapeId || parsedArgs.shapeDescription, x, y);
        
      case 'resizeShape':
        return await this.canvasAPI.resizeShape(parsedArgs.shapeId || parsedArgs.shapeDescription, parsedArgs);
        
      case 'rotateShape':
        return await this.canvasAPI.rotateShape(parsedArgs.shapeId || parsedArgs.shapeDescription, parsedArgs.degrees);
        
      case 'changeShapeColor':
        return await this.canvasAPI.changeShapeColor(parsedArgs.shapeId || parsedArgs.shapeDescription, parsedArgs.color);
      
      case 'changeShapeText':
        return await this.canvasAPI.changeShapeText(parsedArgs.shapeId || parsedArgs.shapeDescription, parsedArgs.newText);
      
      case 'createMultipleShapes':
        return await this.canvasAPI.createMultipleShapes(parsedArgs);
        
      case 'arrangeShapesInRow':
        return await this.canvasAPI.arrangeInRow(parsedArgs.shapeIds, parsedArgs.startX || 0, parsedArgs.startY || 0, parsedArgs.spacing || 50);
        
      case 'arrangeShapesInGrid':
        return await this.canvasAPI.arrangeInGrid(parsedArgs.shapeIds, parsedArgs.rows, parsedArgs.cols, parsedArgs.startX || 0, parsedArgs.startY || 0, parsedArgs.spacingX || 50, parsedArgs.spacingY || 50);
        
      case 'distributeShapesEvenly':
        // Handle "these shapes" reference
        let shapeIds = parsedArgs.shapeIds;
        if (shapeIds && (shapeIds.includes('these') || shapeIds.includes('recent'))) {
          const recentShapes = this.canvasAPI.resolveTheseShapes();
          shapeIds = recentShapes.map(shape => shape.id);
          console.log('🔗 Resolved "these shapes" to:', shapeIds.length, 'shapes');
        }
        
        // Convert containerWidth to proper bounds object
        const containerWidth = parsedArgs.containerWidth || 600;
        const direction = parsedArgs.direction || 'horizontal';
        
        // Create bounds object based on direction
        const bounds = direction === 'horizontal' 
          ? { x: 100, y: 100, width: containerWidth, height: 200 }
          : { x: 100, y: 100, width: 200, height: containerWidth };
          
        console.log('🔧 Distributing shapes:', shapeIds, 'with bounds:', bounds);
        return await this.canvasAPI.distributeEvenly(shapeIds, bounds);
        
      case 'centerGroup':
        return await this.canvasAPI.centerGroup(parsedArgs.shapeIds, parsedArgs.centerX || 0, parsedArgs.centerY || 0);
        
      case 'addGroupMargin':
        return await this.canvasAPI.addGroupMargin(parsedArgs.shapeIds, parsedArgs.marginSize);
      
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
        
      case 'createLoginFormWithLayout':
        return await this.canvasAPI.createLoginFormWithLayout();
        
      case 'arrangeInRow':
        return await this.canvasAPI.arrangeInRow(parsedArgs.spacing);
        
      case 'createGrid':
        return await this.canvasAPI.createGrid(parsedArgs.rows, parsedArgs.columns, parsedArgs.shapeType, parsedArgs.spacing);
        
      case 'distributeEvenly':
        return await this.canvasAPI.distributeEvenly(parsedArgs.direction);
        
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
        return await this.canvasAPI.deleteShape(parsedArgs.shapeId || parsedArgs.shapeDescription);
        
      case 'autoAlignUI':
        return await this.canvasAPI.autoAlignUI();
        
      case 'checkUIQuality':
        return await this.canvasAPI.checkUIQuality();
        
      case 'autoFixUI':
        return await this.canvasAPI.autoFixUI();
        
      case 'layoutStack':
        return await this.canvasAPI.layoutStack(parsedArgs);
        
      case 'layoutGrid':
        return await this.canvasAPI.layoutGrid(parsedArgs);
        
      case 'getSelection':
        return this.canvasAPI.getSelection();
        
      case 'validateUILayout':
        return await this.canvasAPI.validateUILayout();
        
      case 'createFormContainer':
        return await this.canvasAPI.createFormContainer(parsedArgs.width, parsedArgs.height, parsedArgs.centerX, parsedArgs.centerY);
        
      case 'stackVertically':
        return await this.canvasAPI.stackVertically(parsedArgs.elements, parsedArgs.container, parsedArgs.startY, parsedArgs.gap);
        
      case 'alignHorizontally':
        return await this.canvasAPI.alignHorizontally(parsedArgs.elements, parsedArgs.centerX, parsedArgs.startY, parsedArgs.gap);
        
      case 'centerContainer':
        return this.canvasAPI.centerContainer(parsedArgs.width, parsedArgs.height, parsedArgs.canvasWidth, parsedArgs.canvasHeight);
        
    case 'createLoginFormWithLayout':
      return await this.canvasAPI.createLoginFormWithLayout();
      
    // RELATIVE POSITIONING TOOLS
    case 'placeBelow':
      return await this.canvasAPI.placeBelow(parsedArgs.shapeId, parsedArgs.referenceShapeId, parsedArgs.gap);
      
    case 'placeRightOf':
      return await this.canvasAPI.placeRightOf(parsedArgs.shapeId, parsedArgs.referenceShapeId, parsedArgs.gap);
      
    case 'alignWith':
      return await this.canvasAPI.alignWith(parsedArgs.shapeId, parsedArgs.referenceShapeId, parsedArgs.alignment);
      
    case 'centerInContainer':
      return await this.canvasAPI.centerInContainer(parsedArgs.shapeId, parsedArgs.containerId);
      
    case 'setPaddingFromContainer':
      return await this.canvasAPI.setPaddingFromContainer(parsedArgs.shapeId, parsedArgs.containerId, parsedArgs.padding);
      
    case 'groupShapes':
      return await this.canvasAPI.groupShapes(parsedArgs.shapeIds, parsedArgs.groupName);
      
    case 'distributeInContainer':
      return await this.canvasAPI.distributeInContainer(parsedArgs.shapeIds, parsedArgs.containerId, parsedArgs.direction, parsedArgs.margin);
      
    case 'analyzeShapeRelationships':
      return this.canvasAPI.analyzeShapeRelationships();
      
    case 'validateAndFix':
      return await this.canvasAPI.validateAndFix(parsedArgs.operationType);
      
    // BLUEPRINT SYSTEM TOOLS
    case 'executeBlueprintPlan':
      return await this.canvasAPI.executeBlueprintPlan(parsedArgs.blueprint);
      
    case 'generateLoginFormBlueprint':
      return this.canvasAPI.generateLoginFormBlueprint();
      
    // NATURAL LANGUAGE ROBUSTNESS TOOLS
    case 'parsePositionCommand':
      return this.canvasAPI.parsePositionCommand(parsedArgs.command, parsedArgs.shapeDescription);
      
      case 'resolveTheseShapes':
        return this.canvasAPI.resolveTheseShapes();
        
      case 'fixRotationValues':
        return await this.canvasAPI.fixRotationValues();
        
      case 'convertShapeRotationToDegrees':
        return await this.canvasAPI.convertShapeRotationToDegrees(parsedArgs.shapeId);
      
    case 'parseSizeDescriptor':
      return this.canvasAPI.parseSizeDescriptor(parsedArgs.sizeText);
      
    default:
      throw new Error(`Unknown function: ${name}`);
    }
  }

  // Get human-readable description of a shape
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

  // Get color name from hex value
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

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
  }

  // Get conversation history
  getHistory() {
    return [...this.conversationHistory];
  }
}

export default AICanvasService;
