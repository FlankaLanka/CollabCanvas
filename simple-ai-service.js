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
    
    // Pre-compile common regex patterns for performance
    this.patterns = {
      creation: {
        triangle: /create.*triangle|draw.*triangle|add.*triangle|make.*triangle/i,
        circle: /create.*circle|draw.*circle|add.*circle|make.*circle/i,
        rectangle: /create.*rectangle|draw.*rectangle|add.*rectangle|make.*rectangle/i,
        line: /create.*line|draw.*line|add.*line|make.*line/i,
        text: /create.*text|draw.*text|add.*text|make.*text|write.*text/i
      },
      manipulation: {
        move: /move.*|center.*|position.*/i,
        resize: /resize.*|make.*bigger|make.*smaller|scale.*|twice.*big|half.*size/i,
        rotate: /rotate.*|turn.*degrees|spin/i,
        color: /change.*color|make.*red|make.*blue|recolor/i,
        text: /change.*text|update.*text|edit.*text|rename/i
      },
      layout: {
        grid: /create.*grid|make.*grid|(\d+)\s*x\s*(\d+).*grid/i,
        arrange: /arrange.*row|arrange.*horizontal/i,
        space: /space.*evenly|distribute.*evenly/i
      }
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
    const startTime = Date.now();
    try {
      console.log('Using enhanced processing for all commands:', userMessage);
      const result = await this._processUICommand(userMessage);
      const processingTime = Date.now() - startTime;
      console.log(`⚡ Processed in ${processingTime}ms`);
      return { ...result, processingTime };
    } catch (error) {
      console.error('AI processing error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to process command',
        processingTime: Date.now() - startTime
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
    if (this.patterns.creation.triangle.test(command)) {
      // Extract color
      const colorMatch = command.match(/\b(red|blue|green|yellow|purple|orange|pink|gray)\b/i);
      const colorMap = {
        red: '#EF4444', blue: '#3B82F6', green: '#10B981',
        yellow: '#EAB308', purple: '#8B5CF6', orange: '#F97316',
        pink: '#EC4899', gray: '#6B7280'
      };
      
      // Extract size - handle both keywords and custom dimensions
      const sizeMatch = command.match(/\b(small|large|huge|tiny|big)\b/i);
      const sizeMap = {
        tiny: 30, small: 50, medium: 100, large: 150, huge: 200, big: 150
      };
      
      // Check for custom dimensions first (e.g., "size 100,50" or "100x50")
      const customDimMatch = command.match(/(?:size|dimensions?)\s+(\d+)\s*[,x]\s*(\d+)|(\d+)\s*x\s*(\d+)|make.*size\s+(\d+)\s*,\s*(\d+)/i);
      let width, height;
      
      if (customDimMatch) {
        // Extract width and height from custom dimensions
        width = parseInt(customDimMatch[1] || customDimMatch[3] || customDimMatch[5]);
        height = parseInt(customDimMatch[2] || customDimMatch[4] || customDimMatch[6]);
      } else {
        // Use keyword-based size for both dimensions
        const size = sizeMatch ? sizeMap[sizeMatch[1].toLowerCase()] : 100;
        width = size;
        height = size;
      }
      
      // Extract position - handle multiple formats
      let x = 0, y = 0; // Default origin
      
      // Try different position patterns
      const posPatterns = [
        /at\s*(?:position|coordinates?)?\s*(?:\()?(-?\d+)\s*,\s*(-?\d+)(?:\))?/i,
        /at\s*point\s*(?:\()?(-?\d+)\s*,\s*(-?\d+)(?:\))?/i,
        /at\s*coordinates?\s*(?:\()?(-?\d+)\s*,\s*(-?\d+)(?:\))?/i,
        /at\s*location\s*(?:\()?(-?\d+)\s*,\s*(-?\d+)(?:\))?/i,
        /at\s*origin/i,
        /at\s*center/i
      ];
      
      for (const pattern of posPatterns) {
        const match = command.match(pattern);
        if (match) {
          if (pattern.source.includes('origin')) {
            x = 0; y = 0;
          } else if (pattern.source.includes('center')) {
            x = 0; y = 0;
          } else if (match[1] && match[2]) {
            x = parseInt(match[1]);
            y = parseInt(match[2]);
          }
          break;
        }
      }
      
      return {
        success: true,
        action: 'composite',
        functionCalls: [
          {
            name: 'createShape',
            arguments: JSON.stringify({
              shapeType: 'triangle',
              x: x,
              y: y,
              width: width,
              height: height,
              fill: colorMatch ? colorMap[colorMatch[1].toLowerCase()] : '#3B82F6',
              stroke: colorMatch ? colorMap[colorMatch[1].toLowerCase()] : '#2563EB',
              strokeWidth: 2
            })
          }
        ],
        response: `Created a ${sizeMatch ? sizeMatch[1] : 'medium'} ${colorMatch ? colorMatch[1] : 'blue'} triangle at position (${x}, ${y}).`
      };
    } else if (this.patterns.creation.circle.test(command)) {
      // Extract color
      const colorMatch = command.match(/\b(red|blue|green|yellow|purple|orange|pink|gray)\b/i);
      const colorMap = {
        red: '#EF4444', blue: '#3B82F6', green: '#10B981',
        yellow: '#EAB308', purple: '#8B5CF6', orange: '#F97316',
        pink: '#EC4899', gray: '#6B7280'
      };
      
      // Extract size - handle both keywords and custom dimensions
      const sizeMatch = command.match(/\b(small|large|huge|tiny|big)\b/i);
      const sizeMap = {
        tiny: 30, small: 50, medium: 100, large: 150, huge: 200, big: 150
      };
      
      // Check for custom dimensions first (e.g., "size 100,50" or "100x50")
      const customDimMatch = command.match(/(?:size|dimensions?)\s+(\d+)\s*[,x]\s*(\d+)|(\d+)\s*x\s*(\d+)|make.*size\s+(\d+)\s*,\s*(\d+)/i);
      let width, height;
      
      if (customDimMatch) {
        // Extract width and height from custom dimensions
        width = parseInt(customDimMatch[1] || customDimMatch[3] || customDimMatch[5]);
        height = parseInt(customDimMatch[2] || customDimMatch[4] || customDimMatch[6]);
      } else {
        // Use keyword-based size for both dimensions
        const size = sizeMatch ? sizeMap[sizeMatch[1].toLowerCase()] : 100;
        width = size;
        height = size;
      }
      
      // Extract position - handle multiple formats
      let x = 0, y = 0; // Default origin
      
      // Try different position patterns
      const posPatterns = [
        /at\s*(?:position|coordinates?)?\s*(?:\()?(-?\d+)\s*,\s*(-?\d+)(?:\))?/i,
        /at\s*point\s*(?:\()?(-?\d+)\s*,\s*(-?\d+)(?:\))?/i,
        /at\s*coordinates?\s*(?:\()?(-?\d+)\s*,\s*(-?\d+)(?:\))?/i,
        /at\s*location\s*(?:\()?(-?\d+)\s*,\s*(-?\d+)(?:\))?/i,
        /at\s*origin/i,
        /at\s*center/i
      ];
      
      for (const pattern of posPatterns) {
        const match = command.match(pattern);
        if (match) {
          if (pattern.source.includes('origin')) {
            x = 0; y = 0;
          } else if (pattern.source.includes('center')) {
            x = 0; y = 0;
          } else if (match[1] && match[2]) {
            x = parseInt(match[1]);
            y = parseInt(match[2]);
          }
          break;
        }
      }
      
      return {
        success: true,
        action: 'composite',
        functionCalls: [{
          name: 'createShape',
          arguments: JSON.stringify({
            shapeType: 'circle',
            x: x,
            y: y,
            width: width,
            height: height,
            fill: colorMatch ? colorMap[colorMatch[1].toLowerCase()] : '#3B82F6',
            stroke: colorMatch ? colorMap[colorMatch[1].toLowerCase()] : '#2563EB',
            strokeWidth: 2
          })
        }],
        response: `Created a ${sizeMatch ? sizeMatch[1] : 'medium'} ${colorMatch ? colorMatch[1] : 'blue'} circle at position (${x}, ${y}).`
      };
    } else if (this.patterns.creation.rectangle.test(command)) {
      // Extract color
      const colorMatch = command.match(/\b(red|blue|green|yellow|purple|orange|pink|gray)\b/i);
      const colorMap = {
        red: '#EF4444', blue: '#3B82F6', green: '#10B981',
        yellow: '#EAB308', purple: '#8B5CF6', orange: '#F97316',
        pink: '#EC4899', gray: '#6B7280'
      };
      
      // Extract dimensions
      const dimMatch = command.match(/(\d+)\s*x\s*(\d+)/i);
      const width = dimMatch ? parseInt(dimMatch[1]) : 120;
      const height = dimMatch ? parseInt(dimMatch[2]) : 80;
      
      // Extract position - handle multiple formats
      let x = 0, y = 0; // Default origin
      
      // Try different position patterns
      const posPatterns = [
        /at\s*(?:position|coordinates?)?\s*(?:\()?(-?\d+)\s*,\s*(-?\d+)(?:\))?/i,
        /at\s*point\s*(?:\()?(-?\d+)\s*,\s*(-?\d+)(?:\))?/i,
        /at\s*coordinates?\s*(?:\()?(-?\d+)\s*,\s*(-?\d+)(?:\))?/i,
        /at\s*location\s*(?:\()?(-?\d+)\s*,\s*(-?\d+)(?:\))?/i,
        /at\s*origin/i,
        /at\s*center/i
      ];
      
      for (const pattern of posPatterns) {
        const match = command.match(pattern);
        if (match) {
          if (pattern.source.includes('origin')) {
            x = 0; y = 0;
          } else if (pattern.source.includes('center')) {
            x = 0; y = 0;
          } else if (match[1] && match[2]) {
            x = parseInt(match[1]);
            y = parseInt(match[2]);
          }
          break;
        }
      }
      
      return {
        success: true,
        action: 'composite',
        functionCalls: [{
          name: 'createShape',
          arguments: JSON.stringify({
            shapeType: 'rectangle',
            x: x,
            y: y,
            width: width,
            height: height,
            fill: colorMatch ? colorMap[colorMatch[1].toLowerCase()] : '#3B82F6',
            stroke: colorMatch ? colorMap[colorMatch[1].toLowerCase()] : '#2563EB',
            strokeWidth: 2
          })
        }],
        response: `Created a ${width}x${height} ${colorMatch ? colorMatch[1] : 'blue'} rectangle at position (${x}, ${y}).`
      };
    } else if (this.patterns.creation.line.test(command)) {
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
    } else if (this.patterns.creation.text.test(command)) {
      // Extract text content
      const textMatch = command.match(/says?\s+["']([^"']+)["']|says?\s+(\w+)|that\s+says?\s+["']([^"']+)["']|that\s+says?\s+(\w+)/i);
      const textContent = textMatch ? (textMatch[1] || textMatch[2] || textMatch[3] || textMatch[4]) : 'Sample Text';
      
      // Extract position
      const posMatch = command.match(/at\s*(?:position|coordinates?)?\s*(?:\()?(\d+)\s*,\s*(\d+)(?:\))?/i);
      const x = posMatch ? parseInt(posMatch[1]) : 400;
      const y = posMatch ? parseInt(posMatch[2]) : 300;
      
      return {
        success: true,
        action: 'composite',
        functionCalls: [{
          name: 'createShape',
          arguments: JSON.stringify({
            shapeType: 'text',
            x: x,
            y: y,
            text: textContent,
            fontSize: 16,
            fill: '#111827',
            align: 'center'
          })
        }],
        response: `Created text "${textContent}" at position (${x}, ${y}).`
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
              x: 'center',
              y: 'center'
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
              x: 'center',
              y: 'center'
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
    } else if (this.patterns.manipulation.resize.test(command)) {
      // Extract shape description and size modifier
      const shapeMatch = command.match(/(triangle|circle|rectangle|square)/i);
      const scaleMatch = command.match(/twice|2x|double/i) ? 2.0 : 
                         command.match(/half|0\.5x/i) ? 0.5 :
                         command.match(/three.*times|3x/i) ? 3.0 : 1.5;
      
      return {
        success: true,
        action: 'composite',
        functionCalls: [{
          name: 'resizeShape',
          arguments: JSON.stringify({
            shapeDescription: shapeMatch ? shapeMatch[1] : 'shape',
            scale: scaleMatch
          })
        }],
        response: `Resized the ${shapeMatch ? shapeMatch[1] : 'shape'} to ${scaleMatch}x its original size.`
      };
    } else if (this.patterns.manipulation.rotate.test(command)) {
      const shapeMatch = command.match(/(triangle|circle|rectangle|text)/i);
      const degreesMatch = command.match(/(\d+)\s*degrees?/i);
      const degrees = degreesMatch ? parseInt(degreesMatch[1]) : 45;
      
      return {
        success: true,
        action: 'composite',
        functionCalls: [{
          name: 'rotateShape',
          arguments: JSON.stringify({
            shapeDescription: shapeMatch ? shapeMatch[1] : 'shape',
            degrees: degrees
          })
        }],
        response: `Rotated the ${shapeMatch ? shapeMatch[1] : 'shape'} by ${degrees} degrees.`
      };
    } else if (this.patterns.manipulation.color.test(command)) {
      const shapeMatch = command.match(/(triangle|circle|rectangle|text)/i);
      const colorMatch = command.match(/\b(red|blue|green|yellow|purple|orange|pink|black|white|gray)\b/i);
      const colorMap = {
        red: '#EF4444', blue: '#3B82F6', green: '#10B981',
        yellow: '#EAB308', purple: '#8B5CF6', orange: '#F97316',
        pink: '#EC4899', black: '#111827', white: '#FFFFFF', gray: '#6B7280'
      };
      
      return {
        success: true,
        action: 'composite',
        functionCalls: [{
          name: 'changeShapeColor',
          arguments: JSON.stringify({
            shapeDescription: shapeMatch ? shapeMatch[1] : 'shape',
            color: colorMatch ? colorMap[colorMatch[1].toLowerCase()] : '#3B82F6'
          })
        }],
        response: `Changed the ${shapeMatch ? shapeMatch[1] : 'shape'} color to ${colorMatch ? colorMatch[1] : 'blue'}.`
      };
    } else if (this.patterns.manipulation.text.test(command)) {
      const textMatch = command.match(/(?:to|says?)\s+["']([^"']+)["']|(?:to|says?)\s+(\w+)/i);
      const newText = textMatch ? (textMatch[1] || textMatch[2]) : 'Updated Text';
      
      return {
        success: true,
        action: 'composite',
        functionCalls: [{
          name: 'changeShapeText',
          arguments: JSON.stringify({
            shapeDescription: 'text',
            newText: newText
          })
        }],
        response: `Updated text to "${newText}".`
      };
    } else if (this.patterns.layout.grid.test(command)) {
      const gridMatch = command.match(/(\d+)\s*x\s*(\d+)/i);
      const rows = gridMatch ? parseInt(gridMatch[1]) : 3;
      const cols = gridMatch ? parseInt(gridMatch[2]) : 3;
      const shapeMatch = command.match(/(triangle|circle|rectangle|square)/i);
      
      return {
        success: true,
        action: 'composite',
        functionCalls: [{
          name: 'createMultipleShapes',
          arguments: JSON.stringify({
            shapeType: shapeMatch ? shapeMatch[1] : 'rectangle',
            count: rows * cols,
            arrangement: 'grid',
            gridRows: rows,
            gridCols: cols,
            spacing: 20,
            fill: '#3B82F6'
          })
        }],
        response: `Created a ${rows}x${cols} grid of ${shapeMatch ? shapeMatch[1] + 's' : 'rectangles'} (${rows * cols} total shapes).`
      };
    } else if (this.patterns.layout.space.test(command)) {
      const directionMatch = command.match(/horizontal|vertical/i);
      
      return {
        success: true,
        action: 'composite',
        functionCalls: [{
          name: 'arrangeShapes',
          arguments: JSON.stringify({
            arrangement: directionMatch ? directionMatch[0].toLowerCase() : 'horizontal',
            spacing: 50
          })
        }],
        response: `Distributed shapes evenly in a ${directionMatch ? directionMatch[0] : 'horizontal'} arrangement.`
      };
    } else if (this.patterns.layout.arrange.test(command)) {
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
