/**
 * Simple AI service for server-side use
 */

export class SimpleAIService {
  constructor() {
    this.designRules = {
      minSpacing: 20,
      preferredSpacing: 50,
      maxSpacing: 100,
      gridSize: 8,
      minContrastRatio: 4.5,
      textColor: '#000000',
      backgroundColor: '#FFFFFF',
      primaryColor: '#3B82F6',
      secondaryColor: '#6B7280',
      errorColor: '#EF4444',
      successColor: '#10B981',
      borderColor: '#D1D5DB'
    };
  }

  /**
   * Detect if a command requires enhanced processing
   * ALL commands now use enhanced processing - no more basic processing
   */
  _requiresEnhancedProcessing(userMessage) {
    // Always return true - all commands use enhanced processing
    return true;
  }

  /**
   * Process command
   */
  async processCommand(userMessage) {
    try {
      console.log('Using enhanced processing for all commands:', userMessage);
      return await this._processUICommand(userMessage);
    } catch (error) {
      console.error('AI processing error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to process command'
      };
    }
  }

  /**
   * Process UI-specific commands
   */
  async _processUICommand(command) {
    try {
    // Handle ALL commands with enhanced processing
    
    // Shape creation commands
    if (/create.*triangle|draw.*triangle|add.*triangle|make.*triangle/i.test(command)) {
      return {
        success: true,
        action: 'composite',
        functionCalls: [
          {
            name: 'createShape',
            arguments: JSON.stringify({
              shapeType: 'triangle',
              x: 400,
              y: 300,
              width: 100,
              height: 100,
              fill: '#3B82F6',
              stroke: '#2563EB',
              strokeWidth: 2
            })
          }
        ],
        response: 'Created a blue triangle at the center of the canvas.'
      };
    } else if (/create.*circle|draw.*circle|add.*circle|make.*circle/i.test(command)) {
      return {
        success: true,
        action: 'composite',
        functionCalls: [
          {
            name: 'createShape',
            arguments: JSON.stringify({
              shapeType: 'circle',
              x: 400,
              y: 300,
              width: 100,
              height: 100,
              fill: '#3B82F6',
              stroke: '#2563EB',
              strokeWidth: 2
            })
          }
        ],
        response: 'Created a blue circle at the center of the canvas.'
      };
    } else if (/create.*rectangle|draw.*rectangle|add.*rectangle|make.*rectangle/i.test(command)) {
      return {
        success: true,
        action: 'composite',
        functionCalls: [
          {
            name: 'createShape',
            arguments: JSON.stringify({
              shapeType: 'rectangle',
              x: 400,
              y: 300,
              width: 120,
              height: 80,
              fill: '#3B82F6',
              stroke: '#2563EB',
              strokeWidth: 2
            })
          }
        ],
        response: 'Created a blue rectangle at the center of the canvas.'
      };
    } else if (/create.*line|draw.*line|add.*line|make.*line/i.test(command)) {
      return {
        success: true,
        action: 'composite',
        functionCalls: [
          {
            name: 'createShape',
            arguments: JSON.stringify({
              shapeType: 'line',
              x: 300,
              y: 300,
              width: 200,
              height: 2,
              fill: '#3B82F6',
              stroke: '#3B82F6',
              strokeWidth: 2
            })
          }
        ],
        response: 'Created a blue line at the center of the canvas.'
      };
    } else if (/create.*text|draw.*text|add.*text|make.*text|write.*text/i.test(command)) {
      return {
        success: true,
        action: 'composite',
        functionCalls: [
          {
            name: 'createShape',
            arguments: JSON.stringify({
              shapeType: 'text',
              x: 400,
              y: 300,
              text: 'Sample Text',
              fontSize: 16,
              fill: '#111827',
              align: 'center'
            })
          }
        ],
        response: 'Created sample text at the center of the canvas.'
      };
    } else if (/move.*triangle|center.*triangle|position.*triangle/i.test(command)) {
      return {
        success: true,
        action: 'composite',
        functionCalls: [
          {
            name: 'moveShape',
            arguments: JSON.stringify({
              shapeDescription: 'triangle',
              x: 400,
              y: 300
            })
          }
        ],
        response: 'Moved the triangle to the center of the canvas.'
      };
    } else if (/move.*circle|center.*circle|position.*circle/i.test(command)) {
      return {
        success: true,
        action: 'composite',
        functionCalls: [
          {
            name: 'moveShape',
            arguments: JSON.stringify({
              shapeDescription: 'circle',
              x: 400,
              y: 300
            })
          }
        ],
        response: 'Moved the circle to the center of the canvas.'
      };
    } else if (/move.*rectangle|center.*rectangle|position.*rectangle/i.test(command)) {
      return {
        success: true,
        action: 'composite',
        functionCalls: [
          {
            name: 'moveShape',
            arguments: JSON.stringify({
              shapeDescription: 'rectangle',
              x: 400,
              y: 300
            })
          }
        ],
        response: 'Moved the rectangle to the center of the canvas.'
      };
    } else if (/arrange.*row|arrange.*horizontal|create.*grid|space.*evenly|distribute.*evenly/i.test(command)) {
      return {
        success: true,
        action: 'composite',
        functionCalls: [
          {
            name: 'arrangeShapes',
            arguments: JSON.stringify({
              arrangement: 'horizontal',
              spacing: 50
            })
          }
        ],
        response: 'Arranged all shapes in a horizontal row with even spacing.'
      };
    } else if (/login.*form|generate.*login|create.*login/i.test(command)) {
      // Use the new professional layout system for login forms
      return {
        success: true,
        action: 'composite',
        functionCalls: [
          // Use the new professional layout system function
          {
            name: 'createLoginFormWithLayout',
            arguments: JSON.stringify({})
          }
        ],
        response: 'Created professional login form using layout blueprint planning, flow engine positioning, and sanity validation. All elements are perfectly aligned, consistently spaced, and visually coherent.'
      };
    } else if (/navigation.*bar|nav.*bar/i.test(command)) {
        // Return multiple createShape function calls for navigation bar with better UX
        return {
          success: true,
          action: 'composite',
          functionCalls: [
            // Navigation background
            {
              name: 'createShape',
              arguments: JSON.stringify({
                shapeType: 'rectangle',
                x: 400,
                y: 40,
                width: 800,
                height: 60,
                fill: '#FFFFFF',
                stroke: '#E5E7EB',
                strokeWidth: 1
              })
            },
            // Logo
            {
              name: 'createShape',
              arguments: JSON.stringify({
                shapeType: 'text',
                x: 100,
                y: 40,
                text: 'Logo',
                fontSize: 18,
                fill: '#111827',
                align: 'left'
              })
            },
            // Menu items
            {
              name: 'createShape',
              arguments: JSON.stringify({
                shapeType: 'text',
                x: 300,
                y: 40,
                text: 'Home',
                fontSize: 14,
                fill: '#374151',
                align: 'center'
              })
            },
            {
              name: 'createShape',
              arguments: JSON.stringify({
                shapeType: 'text',
                x: 400,
                y: 40,
                text: 'About',
                fontSize: 14,
                fill: '#374151',
                align: 'center'
              })
            },
            {
              name: 'createShape',
              arguments: JSON.stringify({
                shapeType: 'text',
                x: 500,
                y: 40,
                text: 'Contact',
                fontSize: 14,
                fill: '#374151',
                align: 'center'
              })
            },
            {
              name: 'createShape',
              arguments: JSON.stringify({
                shapeType: 'text',
                x: 600,
                y: 40,
                text: 'Login',
                fontSize: 14,
                fill: '#3B82F6',
                align: 'center'
              })
            }
          ],
          response: 'Created professional navigation bar with logo, menu items, and login button. All elements are properly spaced and aligned.'
        };
    } else if (/card.*layout|create.*card/i.test(command)) {
        // Return multiple createShape function calls for card layout with better UX
        return {
          success: true,
          action: 'composite',
          functionCalls: [
            // Card container
            {
              name: 'createShape',
              arguments: JSON.stringify({
                shapeType: 'rectangle',
                x: 400,
                y: 300,
                width: 320,
                height: 420,
                fill: '#FFFFFF',
                stroke: '#E5E7EB',
                strokeWidth: 1
              })
            },
            // Card shadow (subtle)
            {
              name: 'createShape',
              arguments: JSON.stringify({
                shapeType: 'rectangle',
                x: 402,
                y: 302,
                width: 320,
                height: 420,
                fill: '#F3F4F6',
                stroke: 'none'
              })
            },
            // Image placeholder
            {
              name: 'createShape',
              arguments: JSON.stringify({
                shapeType: 'rectangle',
                x: 400,
                y: 200,
                width: 280,
                height: 180,
                fill: '#F8FAFC',
                stroke: '#E2E8F0',
                strokeWidth: 1
              })
            },
            // Image placeholder text
            {
              name: 'createShape',
              arguments: JSON.stringify({
                shapeType: 'text',
                text: '📷',
                x: 400,
                y: 200,
                fontSize: 48,
                fill: '#9CA3AF',
                align: 'center'
              })
            },
            // Title
            {
              name: 'createShape',
              arguments: JSON.stringify({
                shapeType: 'text',
                text: 'Product Title',
                x: 400,
                y: 320,
                fontSize: 18,
                fill: '#111827',
                align: 'center'
              })
            },
            // Description
            {
              name: 'createShape',
              arguments: JSON.stringify({
                shapeType: 'text',
                text: 'This is a sample product description that explains what the product does and why it\'s useful.',
                x: 400,
                y: 360,
                fontSize: 14,
                fill: '#6B7280',
                align: 'center'
              })
            },
            // Price
            {
              name: 'createShape',
              arguments: JSON.stringify({
                shapeType: 'text',
                text: '$99.99',
                x: 400,
                y: 400,
                fontSize: 20,
                fill: '#059669',
                align: 'center'
              })
            },
            // CTA Button
            {
              name: 'createShape',
              arguments: JSON.stringify({
                shapeType: 'rectangle',
                x: 400,
                y: 450,
                width: 200,
                height: 40,
                fill: '#3B82F6',
                stroke: '#2563EB',
                strokeWidth: 1
              })
            },
            // Button text
            {
              name: 'createShape',
              arguments: JSON.stringify({
                shapeType: 'text',
                text: 'Buy Now',
                x: 400,
                y: 450,
                fontSize: 14,
                fill: '#FFFFFF',
                align: 'center'
              })
            }
          ],
          response: 'Created professional card layout with image, title, description, price, and CTA button'
        };
      } else {
        // Fallback for any unrecognized command - create a generic shape
        return {
          success: true,
          action: 'composite',
          functionCalls: [
            {
              name: 'createShape',
              arguments: JSON.stringify({
                shapeType: 'rectangle',
                x: 400,
                y: 300,
                width: 100,
                height: 100,
                fill: '#3B82F6',
                stroke: '#2563EB',
                strokeWidth: 2
              })
            }
          ],
          response: `I created a blue rectangle for your command: "${command}". I can create shapes (triangle, circle, rectangle, line, text), move shapes, arrange layouts, and create UI components (login forms, navigation bars, card layouts). Please be more specific about what you'd like me to do.`
        };
      }
      
    } catch (error) {
      console.error('UI command processing error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to process UI command'
      };
    }
  }
}
