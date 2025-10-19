/**
 * Reasoning Validator for Non-Complex Commands
 * 
 * Validates and enhances reasoning for manipulation and layout commands
 * before they are executed. Ensures proper validation and user feedback.
 */

export class ReasoningValidator {
  constructor(canvasAPI) {
    this.canvasAPI = canvasAPI;
  }

  /**
   * Validate manipulation commands (move, resize, rotate, change color, change text)
   * Ensures shapes exist before attempting manipulation
   */
  async validateManipulationCommand(command, params) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      enhancedParams: { ...params },
      reasoning: []
    };

    try {
      // Get current canvas state
      const canvasState = this.canvasAPI.getCanvasState();
      const shapes = canvasState.shapes || [];
      
      if (shapes.length === 0) {
        // Instead of failing, suggest creating the shape first
        validation.isValid = true; // Allow the command to proceed
        validation.warnings.push("No shapes found on canvas - will create the shape first");
        validation.reasoning.push("Canvas is empty - will create the requested shape before applying manipulation");
        
        // Extract shape type from the command for creation
        const shapeType = this.extractShapeTypeFromCommand(command);
        if (shapeType) {
          validation.enhancedParams.createFirst = true;
          validation.enhancedParams.shapeType = shapeType;
          validation.reasoning.push(`Will create ${shapeType} first, then apply manipulation`);
        }
        
        return validation;
      }

      // Check if shape exists for manipulation commands
      if (command.includes('move') || command.includes('resize') || command.includes('rotate') || 
          command.includes('change') || command.includes('delete')) {
        
        const shapeDescription = this.extractShapeDescription(params);
        const foundShape = this.findShapeByDescription(shapeDescription, shapes);
        
        if (!foundShape) {
          // Check if we should create the shape first
          const shapeType = this.extractShapeTypeFromCommand(command);
          if (shapeType) {
            validation.isValid = true; // Allow the command to proceed
            validation.warnings.push(`Shape not found: "${shapeDescription}" - will create ${shapeType} first`);
            validation.reasoning.push(`No shape matching "${shapeDescription}" exists - will create ${shapeType} first, then apply manipulation`);
            validation.enhancedParams.createFirst = true;
            validation.enhancedParams.shapeType = shapeType;
          } else {
          validation.isValid = false;
          validation.errors.push(`Shape not found: "${shapeDescription}"`);
          validation.reasoning.push(`No shape matching "${shapeDescription}" exists on canvas`);
          
            // Provide helpful suggestions with enhanced descriptions
          const availableShapes = shapes.map(shape => this.getShapeDescription(shape)).join(', ');
          validation.reasoning.push(`Available shapes: ${availableShapes}`);
            
            // Provide specific suggestions based on the requested description
            const suggestions = this.generateShapeSuggestions(shapeDescription, shapes);
            if (suggestions.length > 0) {
              validation.reasoning.push(`Did you mean: ${suggestions.join(', ')}?`);
            }
          }
        } else {
          validation.reasoning.push(`Found shape: ${this.getShapeDescription(foundShape)}`);
          validation.enhancedParams.shapeId = foundShape.id;
        }
      }

      return validation;
    } catch (error) {
      validation.isValid = false;
      validation.errors.push(`Validation error: ${error.message}`);
      return validation;
    }
  }

  /**
   * Validate layout commands (arrange, distribute, create multiple)
   * Ensures commands run on all available shapes when appropriate
   */
  async validateLayoutCommand(command, params) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      enhancedParams: { ...params },
      reasoning: []
    };

    try {
      const canvasState = this.canvasAPI.getCanvasState();
      const shapes = canvasState.shapes || [];

      // For layout commands that should operate on all shapes
      if (command.includes('arrange') || command.includes('distribute') || command.includes('space')) {
        
        if (shapes.length === 0) {
          validation.isValid = false;
          validation.errors.push("No shapes found on canvas to arrange");
          validation.reasoning.push("Canvas is empty - cannot perform layout operations");
          return validation;
        }

        // If no specific shapes are provided, use all shapes
        if (!params.shapeIds || params.shapeIds.length === 0) {
          validation.enhancedParams.shapeIds = shapes.map(shape => shape.id);
          validation.reasoning.push(`Using all ${shapes.length} shapes for layout operation`);
        } else {
          // Validate that specified shapes exist
          const validShapeIds = [];
          const invalidShapeIds = [];
          
          for (const shapeId of params.shapeIds) {
            const shape = shapes.find(s => s.id === shapeId || this.matchesShapeDescription(s, shapeId));
            if (shape) {
              validShapeIds.push(shape.id);
            } else {
              invalidShapeIds.push(shapeId);
            }
          }
          
          if (invalidShapeIds.length > 0) {
            validation.warnings.push(`Some shapes not found: ${invalidShapeIds.join(', ')}`);
            validation.reasoning.push(`Using only valid shapes: ${validShapeIds.length} shapes`);
          }
          
          validation.enhancedParams.shapeIds = validShapeIds;
        }
      }

      // For create multiple shapes commands
      if (command.includes('create') && (command.includes('multiple') || command.includes('grid') || command.includes('array'))) {
        if (params.count && params.count > 50) {
          validation.warnings.push(`Creating ${params.count} shapes may impact performance`);
          validation.reasoning.push(`Large number of shapes (${params.count}) - consider using smaller counts`);
        }
      }

      return validation;
    } catch (error) {
      validation.isValid = false;
      validation.errors.push(`Validation error: ${error.message}`);
      return validation;
    }
  }

  /**
   * Extract shape type from command for creation
   */
  extractShapeTypeFromCommand(command) {
    const lowerCommand = command.toLowerCase();
    
    // Look for shape type keywords in the command
    if (lowerCommand.includes('text')) return 'text';
    if (lowerCommand.includes('rectangle') || lowerCommand.includes('rect')) return 'rectangle';
    if (lowerCommand.includes('circle')) return 'circle';
    if (lowerCommand.includes('triangle')) return 'triangle';
    if (lowerCommand.includes('line')) return 'line';
    if (lowerCommand.includes('square')) return 'rectangle'; // squares are rectangles
    
    // Default to text for common manipulation commands
    if (lowerCommand.includes('rotate') || lowerCommand.includes('resize') || lowerCommand.includes('move')) {
      return 'text'; // Most common case
    }
    
    return null;
  }

  /**
   * Extract shape description from command parameters
   */
  extractShapeDescription(params) {
    // Try different parameter names that might contain shape description
    const description = params.shapeId || params.shapeDescription || params.target || 'shape';
    
    console.log(`🔍 Extracting shape description from params:`, params);
    console.log(`🔍 Raw description: "${description}"`);
    
    // If it looks like a shape ID (short alphanumeric string), try to find the shape and get its description
    if (this.looksLikeShapeId(description)) {
      console.log(`🔍 Detected shape ID: "${description}", attempting to resolve to natural language description`);
      const shapes = this.canvasAPI.getCanvasState().shapes || [];
      const shape = shapes.find(s => s.id === description);
      if (shape) {
        const naturalDescription = this.getShapeDescription(shape);
        console.log(`✅ Resolved shape ID to: "${naturalDescription}"`);
        return naturalDescription;
      } else {
        console.log(`❌ Shape ID "${description}" not found in canvas`);
        console.log(`📊 Available shape IDs:`, shapes.map(s => s.id));
        return description; // Return original if not found
      }
    }
    
    return description;
  }

  /**
   * Check if a string looks like a shape ID (short alphanumeric)
   */
  looksLikeShapeId(str) {
    if (!str || typeof str !== 'string') return false;
    // Shape IDs are typically short alphanumeric strings (6-8 characters)
    return /^[a-zA-Z0-9]{4,10}$/.test(str);
  }

  /**
   * Find shape by description (color, type, size, etc.) with enhanced matching
   */
  findShapeByDescription(description, shapes) {
    if (!description || description === 'shape') {
      // Return first shape if no specific description
      console.log(`🔍 No specific description, returning first shape`);
      return shapes[0];
    }

    const desc = description.toLowerCase().trim();
    console.log(`🔍 Finding shape by description: "${desc}"`);
    console.log(`🔍 Available shapes:`, shapes.map(s => `${s.type} (${this.getColorName(s.fill)})`));
    
    // Parse the description to extract attributes
    const attributes = this.parseShapeDescription(desc);
    console.log(`🔍 Parsed attributes:`, attributes);
    
    // Score each shape based on how well it matches
    const scoredShapes = shapes.map(shape => ({
      shape,
      score: this.calculateMatchScore(shape, attributes, desc)
    }));
    
    // Sort by score (highest first) and filter out zero scores
    const matches = scoredShapes
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
    
    console.log(`🔍 Shape matching results:`, matches.map(m => ({
      type: m.shape.type,
      color: this.getColorName(m.shape.fill),
      score: m.score
    })));
    
    if (matches.length === 0) {
      console.log(`❌ No shapes found matching "${desc}"`);
      console.log(`❌ This will trigger shape creation if createFirst is enabled`);
      return null;
    }
    
    const bestMatch = matches[0];
    console.log(`✅ Best match: ${this.getShapeDescription(bestMatch.shape)} (score: ${bestMatch.score})`);
    console.log(`✅ Selected shape ID: ${bestMatch.shape.id}`);
    
    return bestMatch.shape;
  }

  /**
   * Parse shape description to extract color, type, size, and other attributes
   */
  parseShapeDescription(description) {
    const attributes = {
      colors: [],
      types: [],
      sizes: [],
      text: [],
      modifiers: []
    };
    
    const words = description.split(/\s+/);
    
    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
      
      // Check for colors
      if (this.isColorWord(cleanWord)) {
        attributes.colors.push(cleanWord);
      }
      
      // Check for shape types
      if (this.isShapeType(cleanWord)) {
        attributes.types.push(cleanWord);
      }
      
      // Check for size descriptors
      if (this.isSizeDescriptor(cleanWord)) {
        attributes.sizes.push(cleanWord);
      }
      
      // Check for text content (quoted or specific words)
      if (word.includes('"') || this.isTextContent(word)) {
        attributes.text.push(word.replace(/"/g, ''));
      }
      
      // Check for modifiers
      if (this.isModifier(cleanWord)) {
        attributes.modifiers.push(cleanWord);
      }
    }
    
    return attributes;
  }

  /**
   * Calculate how well a shape matches the given attributes and description
   */
  calculateMatchScore(shape, attributes, originalDescription) {
    let score = 0;
    const shapeColor = this.getColorName(shape.fill);
    const shapeType = shape.type;
    const shapeSize = this.getSizeDescriptor(shape);
    
    console.log(`🔍 Scoring shape:`, {
      type: shapeType,
      color: shapeColor,
      size: shapeSize,
      fill: shape.fill
    });
    
    // Color matching (highest priority - STRICT)
    if (attributes.colors.length > 0) {
      const colorMatch = attributes.colors.some(color => 
        shapeColor === color || 
        shape.fill?.toLowerCase().includes(color) ||
        this.getColorVariations(color).includes(shapeColor)
      );
      if (colorMatch) {
        score += 50; // High weight for color match
        console.log(`✅ Color match: ${attributes.colors.join(', ')} -> ${shapeColor}`);
      } else {
        console.log(`❌ Color mismatch: ${attributes.colors.join(', ')} vs ${shapeColor}`);
        // CRITICAL: If color is specified but doesn't match, reject the shape entirely
        console.log(`🚫 REJECTING shape due to color mismatch`);
        return 0; // Return 0 score to completely exclude this shape
      }
    }
    
    // Type matching (high priority - STRICT)
    if (attributes.types.length > 0) {
      const typeMatch = attributes.types.some(type => 
        shapeType === type || 
        this.getShapeTypeVariations(type).includes(shapeType)
      );
      if (typeMatch) {
        score += 40; // High weight for type match
        console.log(`✅ Type match: ${attributes.types.join(', ')} -> ${shapeType}`);
      } else {
        console.log(`❌ Type mismatch: ${attributes.types.join(', ')} vs ${shapeType}`);
        // CRITICAL: If type is specified but doesn't match, reject the shape entirely
        console.log(`🚫 REJECTING shape due to type mismatch`);
        return 0; // Return 0 score to completely exclude this shape
      }
    }
    
    // Size matching (medium priority)
    if (attributes.sizes.length > 0) {
      const sizeMatch = attributes.sizes.some(size => 
        shapeSize === size || 
        this.getSizeVariations(size).includes(shapeSize)
      );
      if (sizeMatch) {
        score += 30; // Medium weight for size match
        console.log(`✅ Size match: ${attributes.sizes.join(', ')} -> ${shapeSize}`);
      }
    }
    
    // Text content matching (for text shapes)
    if (attributes.text.length > 0 && shapeType === 'text') {
      const textMatch = attributes.text.some(text => 
        shape.text?.toLowerCase().includes(text.toLowerCase())
      );
      if (textMatch) {
        score += 35; // High weight for text match
        console.log(`✅ Text match: ${attributes.text.join(', ')} -> "${shape.text}"`);
      }
    }
    
    // Modifier matching (position, etc.)
    if (attributes.modifiers.length > 0) {
      const modifierMatch = attributes.modifiers.some(modifier => 
        this.checkModifierMatch(shape, modifier)
      );
      if (modifierMatch) {
        score += 20; // Medium weight for modifier match
        console.log(`✅ Modifier match: ${attributes.modifiers.join(', ')}`);
      }
    }
    
    // Bonus for exact description match
    const shapeDesc = this.getShapeDescription(shape).toLowerCase();
    if (shapeDesc.includes(originalDescription) || originalDescription.includes(shapeDesc)) {
      score += 25;
      console.log(`✅ Description match bonus`);
    }
    
    console.log(`📊 Final score: ${score}`);
    return score;
  }

  /**
   * Check if a word represents a color
   */
  isColorWord(word) {
    const colors = [
      'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'gray', 'grey',
      'black', 'white', 'brown', 'cyan', 'magenta', 'lime', 'navy', 'maroon',
      'olive', 'teal', 'silver', 'gold', 'violet', 'indigo', 'turquoise'
    ];
    return colors.includes(word);
  }

  /**
   * Check if a word represents a shape type
   */
  isShapeType(word) {
    const types = [
      'rectangle', 'rect', 'square', 'circle', 'circ', 'triangle', 'tri',
      'line', 'text', 'input', 'field', 'box', 'oval', 'ellipse'
    ];
    return types.includes(word);
  }

  /**
   * Check if a word represents a size descriptor
   */
  isSizeDescriptor(word) {
    const sizes = [
      'large', 'big', 'huge', 'small', 'tiny', 'medium', 'wide', 'narrow',
      'tall', 'short', 'thick', 'thin', 'massive', 'mini', 'micro'
    ];
    return sizes.includes(word);
  }

  /**
   * Check if a word represents text content
   */
  isTextContent(word) {
    // Simple heuristic: words that might be text content
    return word.length > 2 && !this.isColorWord(word) && !this.isShapeType(word) && !this.isSizeDescriptor(word);
  }

  /**
   * Check if a word represents a modifier
   */
  isModifier(word) {
    const modifiers = [
      'left', 'right', 'top', 'bottom', 'center', 'middle', 'first', 'last',
      'recent', 'new', 'old', 'selected', 'highlighted', 'focused'
    ];
    return modifiers.includes(word);
  }

  /**
   * Get size descriptor for a shape
   */
  getSizeDescriptor(shape) {
    const width = shape.width || 100;
    const height = shape.height || 100;
    const radiusX = shape.radiusX || 50;
    const radiusY = shape.radiusY || 50;
    
    const area = width * height;
    const diameter = Math.max(radiusX * 2, radiusY * 2);
    
    if (area > 20000 || diameter > 200) return 'large';
    if (area < 2500 || diameter < 50) return 'small';
    return 'medium';
  }

  /**
   * Get color variations for fuzzy matching
   */
  getColorVariations(color) {
    const variations = {
      'blue': ['blue', 'navy', 'azure', 'sky'],
      'red': ['red', 'crimson', 'maroon', 'scarlet'],
      'green': ['green', 'lime', 'olive', 'emerald'],
      'yellow': ['yellow', 'gold', 'amber'],
      'purple': ['purple', 'violet', 'indigo', 'magenta'],
      'pink': ['pink', 'rose', 'magenta'],
      'orange': ['orange', 'amber', 'coral'],
      'gray': ['gray', 'grey', 'silver'],
      'black': ['black', 'dark', 'charcoal'],
      'white': ['white', 'light', 'ivory']
    };
    return variations[color] || [color];
  }

  /**
   * Get shape type variations for fuzzy matching
   */
  getShapeTypeVariations(type) {
    const variations = {
      'rectangle': ['rectangle', 'rect', 'square', 'box'],
      'square': ['square', 'rectangle', 'rect', 'box'],
      'circle': ['circle', 'circ', 'oval', 'ellipse'],
      'triangle': ['triangle', 'tri'],
      'text': ['text', 'label', 'string'],
      'input': ['input', 'field', 'text_input']
    };
    return variations[type] || [type];
  }

  /**
   * Get size variations for fuzzy matching
   */
  getSizeVariations(size) {
    const variations = {
      'large': ['large', 'big', 'huge', 'massive'],
      'small': ['small', 'tiny', 'mini', 'micro'],
      'medium': ['medium', 'normal', 'regular']
    };
    return variations[size] || [size];
  }

  /**
   * Check if a shape matches a modifier
   */
  checkModifierMatch(shape, modifier) {
    // This could be enhanced to check actual position, selection state, etc.
    // For now, just return true for basic modifiers
    return ['left', 'right', 'top', 'bottom', 'center', 'middle'].includes(modifier);
  }

  /**
   * Check if a shape matches a description using enhanced matching
   */
  matchesShapeDescription(shape, description) {
    const attributes = this.parseShapeDescription(description.toLowerCase());
    const score = this.calculateMatchScore(shape, attributes, description.toLowerCase());
    return score > 0;
  }

  /**
   * Get human-readable description of a shape with enhanced details
   */
  getShapeDescription(shape) {
    console.log(`🔍 Generating description for shape:`, {
      id: shape.id,
      type: shape.type,
      fill: shape.fill,
      width: shape.width,
      height: shape.height
    });
    
    const color = this.getColorName(shape.fill);
    const type = shape.type || 'shape';
    const colorPrefix = color ? `${color} ` : '';
    const sizeDescriptor = this.getSizeDescriptor(shape);
    
    // If no color detected, try to provide more context
    let colorInfo = colorPrefix;
    if (!color && shape.fill) {
      colorInfo = `(${shape.fill}) `; // Show hex color if name detection failed
    }
    
    switch (shape.type) {
      case 'rectangle':
        const width = shape.width || 100;
        const height = shape.height || 100;
        const rectType = Math.abs(width - height) < 20 ? 'square' : 'rectangle';
        return `${colorInfo}${sizeDescriptor} ${width}×${height}px ${rectType}`;
      case 'circle':
        const radiusX = shape.radiusX || 50;
        const radiusY = shape.radiusY || 50;
        const shapeType = Math.abs(radiusX - radiusY) < 5 ? 'circle' : 'oval';
        return radiusX === radiusY ? 
          `${colorInfo}${sizeDescriptor} ${radiusX * 2}px ${shapeType}` : 
          `${colorInfo}${sizeDescriptor} ${radiusX * 2}×${radiusY * 2}px ${shapeType}`;
      case 'text':
        return `${colorInfo}${sizeDescriptor} text "${shape.text || 'Text'}"`;
      case 'text_input':
        return `${colorInfo}${sizeDescriptor} input field "${shape.text || 'Input Field'}"`;
      case 'line':
        return `${colorInfo}${sizeDescriptor} drawn line`;
      case 'triangle':
        return `${colorInfo}${sizeDescriptor} triangle`;
      default:
        return `${colorInfo}${sizeDescriptor} ${shape.type} shape`;
    }
  }

  /**
   * Get color name from hex value with enhanced spectrum detection
   */
  getColorName(hexColor) {
    if (!hexColor) return '';
    
    const color = hexColor.toLowerCase();
    console.log(`🎨 Detecting color for hex: ${color}`);
    
    // Enhanced color mapping with comprehensive spectrum support
    const colorNames = {
      // Blue spectrum (comprehensive)
      '#3b82f6': 'blue', '#2563eb': 'blue', '#1d4ed8': 'blue', '#1e40af': 'blue',
      '#1e3a8a': 'blue', '#60a5fa': 'blue', '#93c5fd': 'blue', '#dbeafe': 'blue',
      '#1e90ff': 'blue', '#4169e1': 'blue', '#0000ff': 'blue', '#0000cd': 'blue',
      '#000080': 'blue', '#191970': 'blue', '#6495ed': 'blue', '#87ceeb': 'blue',
      
      // Red spectrum (comprehensive)
      '#ef4444': 'red', '#dc2626': 'red', '#b91c1c': 'red', '#991b1b': 'red',
      '#7f1d1d': 'red', '#f87171': 'red', '#fca5a5': 'red', '#fecaca': 'red',
      '#ff0000': 'red', '#dc143c': 'red', '#b22222': 'red', '#8b0000': 'red',
      '#ff6347': 'red', '#ff4500': 'red', '#ff1493': 'red', '#c71585': 'red',
      
      // Green spectrum (comprehensive - this is the key fix!)
      '#10b981': 'green', '#059669': 'green', '#047857': 'green', '#065f46': 'green',
      '#064e3b': 'green', '#34d399': 'green', '#6ee7b7': 'green', '#a7f3d0': 'green',
      '#00ff00': 'green', '#32cd32': 'green', '#228b22': 'green', '#006400': 'green',
      '#90ee90': 'green', '#98fb98': 'green', '#8fbc8f': 'green', '#9acd32': 'green',
      '#adff2f': 'green', '#7fff00': 'green', '#00ff7f': 'green', '#00fa9a': 'green',
      '#2e8b57': 'green', '#3cb371': 'green', '#20b2aa': 'green', '#008b8b': 'green',
      '#00ced1': 'green', '#40e0d0': 'green', '#48d1cc': 'green', '#00ffff': 'green',
      
      // Yellow spectrum
      '#eab308': 'yellow', '#ca8a04': 'yellow', '#a16207': 'yellow', '#854d0e': 'yellow',
      '#713f12': 'yellow', '#facc15': 'yellow', '#fde047': 'yellow', '#fef3c7': 'yellow',
      '#ffff00': 'yellow', '#ffd700': 'yellow', '#ffa500': 'yellow', '#ff8c00': 'yellow',
      
      // Purple spectrum
      '#8b5cf6': 'purple', '#7c3aed': 'purple', '#6d28d9': 'purple', '#5b21b6': 'purple',
      '#4c1d95': 'purple', '#a78bfa': 'purple', '#c4b5fd': 'purple', '#ddd6fe': 'purple',
      '#800080': 'purple', '#9932cc': 'purple', '#8b008b': 'purple', '#4b0082': 'purple',
      
      // Pink spectrum
      '#ec4899': 'pink', '#db2777': 'pink', '#be185d': 'pink', '#9d174d': 'pink',
      '#831843': 'pink', '#f472b6': 'pink', '#f9a8d4': 'pink', '#fbcfe8': 'pink',
      '#ffc0cb': 'pink', '#ffb6c1': 'pink', '#ff69b4': 'pink', '#ff1493': 'pink',
      
      // Orange spectrum
      '#f97316': 'orange', '#ea580c': 'orange', '#c2410c': 'orange', '#9a3412': 'orange',
      '#7c2d12': 'orange', '#fb923c': 'orange', '#fdba74': 'orange', '#fed7aa': 'orange',
      '#ffa500': 'orange', '#ff8c00': 'orange', '#ff7f50': 'orange', '#ff6347': 'orange',
      
      // Gray spectrum
      '#6b7280': 'gray', '#4b5563': 'gray', '#374151': 'gray', '#1f2937': 'gray',
      '#111827': 'gray', '#9ca3af': 'gray', '#d1d5db': 'gray', '#f3f4f6': 'gray',
      '#808080': 'gray', '#a9a9a9': 'gray', '#c0c0c0': 'gray', '#d3d3d3': 'gray',
      
      // Black spectrum
      '#000000': 'black', '#111827': 'black', '#030712': 'black', '#1f2937': 'black',
      '#2d2d2d': 'black', '#404040': 'black', '#525252': 'black', '#696969': 'black',
      
      // White spectrum
      '#ffffff': 'white', '#f9fafb': 'white', '#f3f4f6': 'white', '#e5e7eb': 'white',
      '#f8fafc': 'white', '#f1f5f9': 'white', '#e2e8f0': 'white', '#cbd5e1': 'white',
      '#f5f5f5': 'white', '#fafafa': 'white', '#f0f0f0': 'white', '#e0e0e0': 'white'
    };
    
    const detectedColor = colorNames[color] || '';
    console.log(`🎨 Detected color: "${detectedColor}" for hex: ${color}`);
    return detectedColor;
  }

  /**
   * Generate helpful shape suggestions when a shape is not found
   */
  generateShapeSuggestions(requestedDescription, shapes) {
    const suggestions = [];
    const requested = requestedDescription.toLowerCase();
    
    // Find shapes that partially match the request
    for (const shape of shapes) {
      const shapeDesc = this.getShapeDescription(shape).toLowerCase();
      const shapeColor = this.getColorName(shape.fill);
      const shapeType = shape.type;
      
      // Check for partial matches
      if (requested.includes(shapeColor) || shapeDesc.includes(requested)) {
        suggestions.push(this.getShapeDescription(shape));
      } else if (requested.includes(shapeType) && !suggestions.some(s => s.includes(shapeType))) {
        suggestions.push(this.getShapeDescription(shape));
      }
    }
    
    // Limit suggestions to avoid overwhelming the user
    return suggestions.slice(0, 3);
  }

  /**
   * Generate user-friendly feedback for validation results
   */
  generateFeedback(validation, command) {
    let feedback = '';
    
    if (!validation.isValid) {
      feedback = `❌ Cannot execute "${command}": ${validation.errors.join(', ')}`;
      if (validation.reasoning.length > 0) {
        feedback += `\n\nReasoning: ${validation.reasoning.join(' ')}`;
      }
    } else if (validation.warnings.length > 0) {
      feedback = `⚠️ ${validation.warnings.join(', ')}`;
      if (validation.reasoning.length > 0) {
        feedback += `\n\nReasoning: ${validation.reasoning.join(' ')}`;
      }
    } else {
      feedback = `✅ Command validated successfully`;
      if (validation.reasoning.length > 0) {
        feedback += `\n\nReasoning: ${validation.reasoning.join(' ')}`;
      }
    }
    
    return feedback;
  }
}
