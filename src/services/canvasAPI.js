import { SHAPE_TYPES, DEFAULT_SHAPE_PROPS, COLOR_PALETTE } from '../utils/constants';

/**
 * Canvas API Service - Bridges AI function calls to canvas operations
 * This provides a clean API layer for the AI to manipulate the canvas
 */
export class CanvasAPI {
  constructor(canvasContext) {
    this.canvas = canvasContext;
    console.log('🔧 CanvasAPI initialized with context:', {
      hasShapes: !!canvasContext.shapes,
      shapesCount: canvasContext.shapes?.length || 0,
      hasSelectedIds: !!canvasContext.selectedIds,
      contextKeys: Object.keys(canvasContext)
    });
  }

  /**
   * Get current shapes from canvas context (always fresh)
   */
  getCurrentShapes() {
    const shapes = this.canvas.shapes || [];
    console.log('🔍 getCurrentShapes called:', {
      shapesCount: shapes.length,
      shapes: shapes.map(s => ({ 
        id: s.id, 
        friendlyId: this.extractFriendlyId(s.id),
        type: s.type, 
        x: s.x, 
        y: s.y 
      }))
    });
    return shapes;
  }

  /**
   * Get current canvas state for AI context
   */
  getCanvasState() {
    const shapes = this.getCurrentShapes();
    
    return {
      shapes: shapes.map(shape => ({
        id: shape.id,
        type: shape.type,
        x: Math.round(shape.x || 0),
        y: Math.round(shape.y || 0),
        width: shape.width,
        height: shape.height,
        radiusX: shape.radiusX,
        radiusY: shape.radiusY,
        fill: shape.fill,
        text: shape.text,
        rotation: shape.rotation || 0,
        zIndex: shape.zIndex || 0,
        // Add friendly ID for easier reference
        friendlyId: this.extractFriendlyId(shape.id)
      })),
      totalShapes: shapes.length,
      selectedIds: Array.from(this.canvas.selectedIds || [])
    };
  }

  /**
   * Extract friendly ID from full shape ID for easier AI reference
   */
  extractFriendlyId(fullId) {
    if (!fullId) return 'unknown';
    // Extract last part after final dash (e.g., "shape-user-timestamp-abc123" -> "abc123")
    return fullId.split('-').slice(-1)[0] || fullId;
  }

  /**
   * Find shape by natural language description (e.g., "blue rectangle", "red circle")
   */
  findShapeByDescription(description) {
    const shapes = this.getCurrentShapes();
    const desc = description.toLowerCase().trim();
    
    console.log('🔍 Finding shape by description:', desc, 'Available shapes:', shapes.length);
    
    // Color mapping
    const colorMap = {
      'blue': ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'],
      'red': ['#ef4444', '#dc2626', '#b91c1c', '#991b1b'],
      'green': ['#10b981', '#059669', '#047857', '#065f46'],
      'yellow': ['#eab308', '#ca8a04', '#a16207', '#854d0e'],
      'purple': ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'],
      'pink': ['#ec4899', '#db2777', '#be185d', '#9d174d'],
      'orange': ['#f97316', '#ea580c', '#c2410c', '#9a3412'],
      'gray': ['#6b7280', '#4b5563', '#374151', '#1f2937'],
      'black': ['#000000', '#1f2937', '#111827', '#030712'],
      'white': ['#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb']
    };
    
    // Shape type matching
    const shapeTypes = {
      'rectangle': SHAPE_TYPES.RECTANGLE,
      'rect': SHAPE_TYPES.RECTANGLE,
      'square': SHAPE_TYPES.RECTANGLE,
      'box': SHAPE_TYPES.RECTANGLE,
      'circle': SHAPE_TYPES.CIRCLE,
      'oval': SHAPE_TYPES.CIRCLE,
      'ellipse': SHAPE_TYPES.CIRCLE,
      'triangle': SHAPE_TYPES.TRIANGLE,
      'text': SHAPE_TYPES.TEXT,
      'label': SHAPE_TYPES.TEXT,
      'input': SHAPE_TYPES.TEXT_INPUT,
      'field': SHAPE_TYPES.TEXT_INPUT,
      'line': SHAPE_TYPES.LINE,
      'drawing': SHAPE_TYPES.LINE,
      'bezier': SHAPE_TYPES.BEZIER_CURVE,
      'curve': SHAPE_TYPES.BEZIER_CURVE
    };
    
    // Find matches
    const candidates = shapes.filter(shape => {
      let matches = 0;
      let totalCriteria = 0;
      
      // Check color
      const colorWords = Object.keys(colorMap);
      const mentionedColor = colorWords.find(color => desc.includes(color));
      if (mentionedColor) {
        totalCriteria++;
        const colorVariants = colorMap[mentionedColor];
        if (colorVariants.some(variant => 
          shape.fill && shape.fill.toLowerCase() === variant.toLowerCase()
        )) {
          matches++;
          console.log(`✅ Color match: ${shape.fill} matches ${mentionedColor}`);
        }
      }
      
      // Check shape type
      const typeWords = Object.keys(shapeTypes);
      const mentionedType = typeWords.find(type => desc.includes(type));
      if (mentionedType) {
        totalCriteria++;
        if (shape.type === shapeTypes[mentionedType]) {
          matches++;
          console.log(`✅ Type match: ${shape.type} matches ${mentionedType}`);
        }
      }
      
      // Check text content
      if (shape.text && desc.includes(shape.text.toLowerCase())) {
        matches++;
        totalCriteria++;
        console.log(`✅ Text match: "${shape.text}"`);
      }
      
      // Check size descriptors
      if (desc.includes('large') || desc.includes('big')) {
        totalCriteria++;
        const isLarge = (shape.width > 150) || (shape.height > 150) || 
                       (shape.radiusX > 75) || (shape.radiusY > 75);
        if (isLarge) {
          matches++;
          console.log(`✅ Size match: large shape`);
        }
      }
      
      if (desc.includes('small') || desc.includes('tiny')) {
        totalCriteria++;
        const isSmall = (shape.width < 80) || (shape.height < 80) || 
                       (shape.radiusX < 40) || (shape.radiusY < 40);
        if (isSmall) {
          matches++;
          console.log(`✅ Size match: small shape`);
        }
      }
      
      // Must match at least 1 criterion and have a good match ratio
      return totalCriteria > 0 && matches / totalCriteria >= 0.5;
    });
    
    // Sort by best match (most criteria matched)
    candidates.sort((a, b) => {
      const aScore = this.getDescriptionMatchScore(a, desc, colorMap, shapeTypes);
      const bScore = this.getDescriptionMatchScore(b, desc, colorMap, shapeTypes);
      return bScore - aScore;
    });
    
    if (candidates.length > 0) {
      console.log(`✅ Found ${candidates.length} shape(s) matching "${description}"`);
      return candidates[0]; // Return best match
    }
    
    console.log(`❌ No shapes found matching "${description}"`);
    return null;
  }
  
  /**
   * Calculate match score for description-based search
   */
  getDescriptionMatchScore(shape, desc, colorMap, shapeTypes) {
    let score = 0;
    
    // Color matching (high weight)
    const colorWords = Object.keys(colorMap);
    const mentionedColor = colorWords.find(color => desc.includes(color));
    if (mentionedColor) {
      const colorVariants = colorMap[mentionedColor];
      if (colorVariants.some(variant => 
        shape.fill && shape.fill.toLowerCase() === variant.toLowerCase()
      )) {
        score += 3;
      }
    }
    
    // Type matching (high weight)
    const typeWords = Object.keys(shapeTypes);
    const mentionedType = typeWords.find(type => desc.includes(type));
    if (mentionedType && shape.type === shapeTypes[mentionedType]) {
      score += 3;
    }
    
    // Text matching (medium weight)
    if (shape.text && desc.includes(shape.text.toLowerCase())) {
      score += 2;
    }
    
    // Size matching (low weight)
    if (desc.includes('large') || desc.includes('big')) {
      const isLarge = (shape.width > 150) || (shape.height > 150) || 
                     (shape.radiusX > 75) || (shape.radiusY > 75);
      if (isLarge) score += 1;
    }
    
    if (desc.includes('small') || desc.includes('tiny')) {
      const isSmall = (shape.width < 80) || (shape.height < 80) || 
                     (shape.radiusX < 40) || (shape.radiusY < 40);
      if (isSmall) score += 1;
    }
    
    return score;
  }

  /**
   * Find shape by friendly ID or full ID (legacy support)
   */
  findShape(idInput) {
    const shapes = this.getCurrentShapes();
    
    console.log('🔍 findShape called with:', idInput, 'Available shapes:', shapes.length);
    
    // Try exact match first
    let shape = shapes.find(s => s.id === idInput);
    if (shape) {
      console.log('✅ Found exact match:', shape.id);
      return shape;
    }
    
    // Try friendly ID match
    shape = shapes.find(s => this.extractFriendlyId(s.id) === idInput);
    if (shape) {
      console.log('✅ Found friendly ID match:', shape.id, 'for', idInput);
      return shape;
    }
    
    // Try partial match (case insensitive)
    shape = shapes.find(s => 
      s.id.toLowerCase().includes(idInput.toLowerCase()) ||
      this.extractFriendlyId(s.id).toLowerCase().includes(idInput.toLowerCase())
    );
    
    if (shape) {
      console.log('✅ Found partial match:', shape.id, 'for', idInput);
    } else {
      console.log('❌ No shape found for:', idInput);
      console.log('Available friendly IDs:', shapes.map(s => this.extractFriendlyId(s.id)));
    }
    
    return shape;
  }

  /**
   * List all shapes with friendly descriptions for AI
   */
  listShapes() {
    const shapes = this.getCurrentShapes();
    return shapes.map(shape => {
      const description = this.getShapeDescription(shape);
      return {
        id: shape.id,
        friendlyId: this.extractFriendlyId(shape.id),
        type: shape.type,
        description: description,
        position: `(${Math.round(shape.x || 0)}, ${Math.round(shape.y || 0)})`,
        fill: shape.fill
      };
    });
  }

  /**
   * Get human-readable description of a shape with color
   */
  getShapeDescription(shape) {
    const colorName = this.getColorName(shape.fill);
    const colorPrefix = colorName ? `${colorName} ` : '';
    
    switch (shape.type) {
      case SHAPE_TYPES.RECTANGLE:
        const width = shape.width || 100;
        const height = shape.height || 100;
        const rectType = Math.abs(width - height) < 20 ? 'square' : 'rectangle';
        return `${colorPrefix}${width}×${height}px ${rectType}`;
      case SHAPE_TYPES.CIRCLE:
        const radiusX = shape.radiusX || 50;
        const radiusY = shape.radiusY || 50;
        const shapeType = Math.abs(radiusX - radiusY) < 5 ? 'circle' : 'oval';
        return radiusX === radiusY ? 
          `${colorPrefix}${radiusX * 2}px ${shapeType}` : 
          `${colorPrefix}${radiusX * 2}×${radiusY * 2}px ${shapeType}`;
      case SHAPE_TYPES.TEXT:
        return `${colorPrefix}text "${shape.text || 'Text'}"`;
      case SHAPE_TYPES.TEXT_INPUT:
        return `${colorPrefix}input field "${shape.text || 'Input Field'}"`;
      case SHAPE_TYPES.LINE:
        return `${colorPrefix}drawn line`;
      case SHAPE_TYPES.TRIANGLE:
        return `${colorPrefix}triangle`;
      case SHAPE_TYPES.BEZIER_CURVE:
        return `${colorPrefix}bezier curve`;
      default:
        return `${colorPrefix}${shape.type} shape`;
    }
  }

  /**
   * Get color name from hex value
   */
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

  /**
   * Get viewport center for positioning new elements
   */
  getViewportCenter() {
    // Use canvas context to get current viewport center
    if (this.canvas.getViewportCenter) {
      return this.canvas.getViewportCenter();
    }
    
    // Fallback to stage center if available
    const stageRef = this.canvas.stageRef?.current;
    if (stageRef) {
      const stage = stageRef;
      const scale = this.canvas.stageScale || 1;
      const position = this.canvas.stagePosition || { x: 0, y: 0 };
    
    return {
        x: (-position.x + stage.width() / 2) / scale,
        y: (-position.y + stage.height() / 2) / scale
      };
    }
    
    // Default fallback
    return { x: 400, y: 300 };
  }

  /**
   * Parse color input (name or hex) to valid hex color
   */  
  parseColor(colorInput) {
    if (!colorInput) return '#3B82F6'; // Default blue
    
    // If it's already a hex color, return it
    if (/^#[0-9A-F]{6}$/i.test(colorInput)) {
      return colorInput;
    }
    
    // Check if it matches a color from our palette (case insensitive)
    const colorName = colorInput.toLowerCase();
    const colorMap = {
      'blue': '#3B82F6',
      'red': '#EF4444', 
      'green': '#10B981',
      'yellow': '#F59E0B',
      'purple': '#8B5CF6',
      'pink': '#EC4899',
      'indigo': '#6366F1',
      'orange': '#F97316',
      'teal': '#14B8A6',
      'cyan': '#06B6D4',
      'lime': '#84CC16',
      'emerald': '#059669'
    };
    
    return colorMap[colorName] || COLOR_PALETTE[0] || '#3B82F6';
  }

  /**
   * Check if a color is dark (to determine if text should be white)
   */
  isDarkColor(hexColor) {
    if (!hexColor || !hexColor.startsWith('#')) return false;
    
    // Convert hex to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance using standard formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Consider dark if luminance is below 0.5
    return luminance < 0.5;
  }

  /**
   * CREATE SHAPE - Core creation function
   */
  async createShape({
    shapeType,
    x,
    y,
    width,
    height,
    radiusX,
    radiusY,
    fill,
    text,
    fontSize
  }) {
    const defaults = DEFAULT_SHAPE_PROPS[shapeType];
    if (!defaults) {
      throw new Error(`Invalid shape type: ${shapeType}`);
    }

    const newShape = {
        type: shapeType,
      x: x || 0,
      y: y || 0,
      fill: this.parseColor(fill) || defaults.fill,
      zIndex: (this.canvas.shapes?.length || 0) + 1
      };

      // Add type-specific properties
      switch (shapeType) {
      case SHAPE_TYPES.RECTANGLE:
        newShape.width = width || defaults.width;
        newShape.height = height || defaults.height;
        break;
      
      case SHAPE_TYPES.CIRCLE:
        newShape.radiusX = radiusX || defaults.radiusX;
        newShape.radiusY = radiusY || defaults.radiusY;
        break;
      
      case SHAPE_TYPES.TEXT:
      case SHAPE_TYPES.TEXT_INPUT:
        newShape.text = text || defaults.text;
        newShape.fontSize = fontSize || defaults.fontSize;
        newShape.fontFamily = defaults.fontFamily;
        newShape.width = width || defaults.width;
        newShape.height = height || defaults.height;
        
        // Ensure text is always dark unless explicitly specified or background is dark
        if (!fill) {
          newShape.fill = '#1F2937'; // Dark text for readability
        } else if (fill && this.isDarkColor(fill)) {
          newShape.fill = '#FFFFFF'; // White text on dark backgrounds
        }
        break;
      
      case SHAPE_TYPES.TRIANGLE:
        // Triangles use points array, not width/height
        newShape.points = [...defaults.points]; // Copy original triangle points
        newShape.closed = defaults.closed;
        
        // If width/height specified, calculate scale factors
        if (width || height) {
          const originalWidth = Math.abs(defaults.points[4] - defaults.points[2]); // 70px
          const originalHeight = Math.abs(defaults.points[1] - defaults.points[3]); // 70px
          
          if (width) {
            newShape.scaleX = width / originalWidth;
          }
          if (height) {
            newShape.scaleY = height / originalHeight;
          }
        }
        break;
      
      case SHAPE_TYPES.BEZIER_CURVE:
        // Position anchor points relative to the shape position
        newShape.anchorPoints = defaults.anchorPoints.map(point => ({
          x: point.x + (x || 0),
          y: point.y + (y || 0)
        }));
        newShape.stroke = this.parseColor(fill) || defaults.stroke;
        newShape.strokeWidth = defaults.strokeWidth;
        newShape.smoothing = defaults.smoothing;
        newShape.showAnchorPoints = defaults.showAnchorPoints;
        delete newShape.fill; // Bezier curves don't have fill
        break;
    }

    // Add to canvas using context method
    await this.canvas.addShape(newShape);
    
    console.log('✅ Created shape:', newShape.type, 'at', `(${newShape.x}, ${newShape.y})`);
    return newShape;
  }

  /**
   * MOVE SHAPE - Manipulation function (supports friendly IDs)
   */
  async moveShape(shapeIdInput, x, y) {
    // Try natural language description first, then fall back to ID
    let shape = this.findShapeByDescription(shapeIdInput);
    if (!shape) {
      shape = this.findShape(shapeIdInput);
    }

    if (!shape) {
      throw new Error(`Shape not found: "${shapeIdInput}". Try describing it by color and type (e.g., "blue rectangle").`);
    }
    
    await this.canvas.updateShape(shape.id, { x, y });
    const description = this.getShapeDescription(shape);
    console.log('✅ Moved shape:', description, 'to', `(${x}, ${y})`);
    return {
      shapeId: shape.id, 
      description: description,
      x, 
      y 
    };
  }

  /**
   * RESIZE SHAPE - Manipulation function (supports friendly IDs)
   */
  async resizeShape(shapeIdInput, { width, height, radiusX, radiusY, scale }) {
    // Try natural language description first, then fall back to ID
    let shape = this.findShapeByDescription(shapeIdInput);
    if (!shape) {
      shape = this.findShape(shapeIdInput);
    }
    
    if (!shape) {
      throw new Error(`Shape not found: "${shapeIdInput}". Try describing it by color and type (e.g., "blue rectangle").`);
    }

    const updates = {};

    // For rectangles and other shapes with width/height
        if (width !== undefined) updates.width = width;
        if (height !== undefined) updates.height = height;
    
    // For circles with radiusX/Y  
    if (radiusX !== undefined) updates.radiusX = radiusX;
    if (radiusY !== undefined) updates.radiusY = radiusY;
    
    // Convert scale factor to actual pixel dimensions
        if (scale !== undefined) {
      switch (shape.type) {
        case SHAPE_TYPES.RECTANGLE:
          if (shape.width) updates.width = Math.round(shape.width * scale);
          if (shape.height) updates.height = Math.round(shape.height * scale);
          break;
        case SHAPE_TYPES.CIRCLE:
          if (shape.radiusX) updates.radiusX = Math.round(shape.radiusX * scale);
          if (shape.radiusY) updates.radiusY = Math.round(shape.radiusY * scale);
        break;
      case SHAPE_TYPES.TEXT:
      case SHAPE_TYPES.TEXT_INPUT:
          if (shape.width) updates.width = Math.round(shape.width * scale);
          if (shape.height) updates.height = Math.round(shape.height * scale);
          if (shape.fontSize) updates.fontSize = Math.round(shape.fontSize * scale);
        break;
        default:
          // For other shapes, fall back to scale properties
          updates.scaleX = scale;
          updates.scaleY = scale;
    }
    }

    await this.canvas.updateShape(shape.id, updates);
    const description = this.getShapeDescription(shape);
    console.log('✅ Resized shape:', description, updates);
    return {
      shapeId: shape.id, 
      description: description, 
      ...updates 
    };
  }

  /**
   * ROTATE SHAPE - Manipulation function (supports friendly IDs)
   */
  async rotateShape(shapeIdInput, degrees) {
    // Try natural language description first, then fall back to ID
    let shape = this.findShapeByDescription(shapeIdInput);
    if (!shape) {
      shape = this.findShape(shapeIdInput);
    }
    
    if (!shape) {
      throw new Error(`Shape not found: "${shapeIdInput}". Try describing it by color and type (e.g., "blue rectangle").`);
    }

    await this.canvas.updateShape(shape.id, { rotation: degrees });
    const description = this.getShapeDescription(shape);
    console.log('✅ Rotated shape:', description, 'to', degrees, 'degrees');
    return { 
      shapeId: shape.id, 
      description: description, 
      rotation: degrees 
    };
  }

  /**
   * CHANGE SHAPE COLOR - Manipulation function (supports friendly IDs)
   */
  async changeShapeColor(shapeIdInput, color) {
    // Try natural language description first, then fall back to ID
    let shape = this.findShapeByDescription(shapeIdInput);
    if (!shape) {
      shape = this.findShape(shapeIdInput);
    }
    
    if (!shape) {
      throw new Error(`Shape not found: "${shapeIdInput}". Try describing it by color and type (e.g., "blue rectangle").`);
    }

    const parsedColor = this.parseColor(color);
    await this.canvas.updateShape(shape.id, { fill: parsedColor });
    const description = this.getShapeDescription(shape);
    console.log('✅ Changed shape color:', description, 'to', parsedColor);
    return {
      shapeId: shape.id, 
      description: description, 
      fill: parsedColor 
    };
  }

  /**
   * CREATE MULTIPLE SHAPES - Layout function
   */
  async createMultipleShapes({
    shapeType,
    count,
    arrangement = 'row',
    startX,
    startY,
    spacing = 80,
    fill
  }) {
    const shapes = [];
    const defaults = DEFAULT_SHAPE_PROPS[shapeType];
    const color = this.parseColor(fill) || defaults.fill;
    
    // Calculate positions based on arrangement
    for (let i = 0; i < count; i++) {
      let x = startX;
      let y = startY;
      
      switch (arrangement) {
        case 'row':
          x = startX + (i * spacing);
          break;
        case 'column':
          y = startY + (i * spacing);
          break;
        case 'grid':
          const cols = Math.ceil(Math.sqrt(count));
          x = startX + ((i % cols) * spacing);
          y = startY + (Math.floor(i / cols) * spacing);
          break;
      }
      
      const shape = await this.createShape({
        shapeType,
        x,
        y,
        fill: color
      });
      
      shapes.push(shape);
    }
    
    console.log('✅ Created', count, shapeType, 'shapes in', arrangement, 'arrangement');
    return shapes;
  }

  /**
   * ARRANGE SHAPES - Layout function
   */
  async arrangeShapes({ shapeIds, arrangement, centerX, centerY, spacing = 80 }) {
    const shapes = this.canvas.shapes?.filter(s => shapeIds.includes(s.id)) || [];
    if (shapes.length === 0) {
      throw new Error('No valid shapes found to arrange');
    }

    const arrangements = [];
    
    for (let i = 0; i < shapes.length; i++) {
      let x = centerX;
      let y = centerY;
      
      switch (arrangement) {
        case 'row':
          x = centerX + ((i - (shapes.length - 1) / 2) * spacing);
          break;
        case 'column':
          y = centerY + ((i - (shapes.length - 1) / 2) * spacing);
          break;
        case 'grid':
          const cols = Math.ceil(Math.sqrt(shapes.length));
          x = centerX + (((i % cols) - (cols - 1) / 2) * spacing);
          y = centerY + ((Math.floor(i / cols) - (Math.ceil(shapes.length / cols) - 1) / 2) * spacing);
          break;
        case 'circle':
          const angle = (i / shapes.length) * 2 * Math.PI;
          const radius = spacing;
          x = centerX + Math.cos(angle) * radius;
          y = centerY + Math.sin(angle) * radius;
          break;
      }
      
      await this.moveShape(shapes[i].id, x, y);
      arrangements.push({ shapeId: shapes[i].id, x, y });
    }
    
    console.log('✅ Arranged', shapes.length, 'shapes in', arrangement, 'pattern');
    return arrangements;
  }

  /**
   * CREATE LOGIN FORM - Complex function
   */
  async createLoginForm({ x, y, width = 300 }) {
    const formElements = [];
    const spacing = 20;
    let currentY = y;
    
    // Title
    const title = await this.createShape({
      shapeType: SHAPE_TYPES.TEXT,
      x: x + width/2 - 50,
      y: currentY,
      text: 'Login',
      fontSize: 24,
      fill: '#1F2937'
    });
    formElements.push(title);
    currentY += 50;

    // Username label  
    const usernameLabel = await this.createShape({
      shapeType: SHAPE_TYPES.TEXT,
      x: x,
      y: currentY,
      text: 'Username:',
      fontSize: 14,
      fill: '#374151'
    });
    formElements.push(usernameLabel);
    currentY += 25;
    
    // Username input
    const usernameInput = await this.createShape({
      shapeType: SHAPE_TYPES.TEXT_INPUT,
      x: x,
      y: currentY,
      width: width,
      height: 40,
      text: '',
      fill: '#1F2937' // Dark text for readability
    });
    formElements.push(usernameInput);
    currentY += 60;

    // Password label
    const passwordLabel = await this.createShape({
      shapeType: SHAPE_TYPES.TEXT,
      x: x,
      y: currentY,
      text: 'Password:',
      fontSize: 14,
      fill: '#374151'
    });
    formElements.push(passwordLabel);
    currentY += 25;
    
    // Password input
    const passwordInput = await this.createShape({
      shapeType: SHAPE_TYPES.TEXT_INPUT,
      x: x,
      y: currentY,
      width: width,
      height: 40,
      text: '',
      fill: '#1F2937' // Dark text for readability
    });
    formElements.push(passwordInput);
    currentY += 60;

    // Submit button
    const submitButton = await this.createShape({
      shapeType: SHAPE_TYPES.RECTANGLE,
      x: x + width/2 - 60,
      y: currentY,
      width: 120,
      height: 40,
      fill: '#3B82F6'
    });
    formElements.push(submitButton);
    
    // Button text
    const buttonText = await this.createShape({
      shapeType: SHAPE_TYPES.TEXT,
      x: x + width/2 - 25,
      y: currentY + 12,
      text: 'Login',
      fontSize: 16,
      fill: '#FFFFFF'
    });
    formElements.push(buttonText);
    
    console.log('✅ Created login form with', formElements.length, 'elements');
    return formElements;
  }

  /**
   * CREATE NAVIGATION BAR - Complex function
   */
  async createNavigationBar({ x, y, menuItems, width = 600 }) {
    const navElements = [];
    const itemWidth = width / menuItems.length;
    
    // Background bar
    const navBg = await this.createShape({
      shapeType: SHAPE_TYPES.RECTANGLE,
      x: x,
      y: y,
      width: width,
      height: 50,
      fill: '#1F2937'
    });
    navElements.push(navBg);
    
    // Menu items
    for (let i = 0; i < menuItems.length; i++) {
      const itemX = x + (i * itemWidth) + itemWidth/2 - 30;
      const menuText = await this.createShape({
        shapeType: SHAPE_TYPES.TEXT,
        x: itemX,
        y: y + 15,
        text: menuItems[i],
        fontSize: 16,
        fill: '#FFFFFF'
      });
      navElements.push(menuText);
    }
    
    console.log('✅ Created navigation bar with', menuItems.length, 'menu items');
    return navElements;
  }

  /**
   * CREATE CARD LAYOUT - Complex function
   */
  async createCardLayout({ x, y, title, content = '', width = 250, height = 200 }) {
    const cardElements = [];
    
    // Card background
    const cardBg = await this.createShape({
      shapeType: SHAPE_TYPES.RECTANGLE,
      x: x,
      y: y,
      width: width,
      height: height,
      fill: '#FFFFFF'
    });
    cardElements.push(cardBg);

    // Card border
    const cardBorder = await this.createShape({
      shapeType: SHAPE_TYPES.RECTANGLE,
      x: x,
      y: y,
      width: width,
      height: height,
      fill: '#E5E7EB'
    });
    cardElements.push(cardBorder);

    // Title
    const titleText = await this.createShape({
      shapeType: SHAPE_TYPES.TEXT,
      x: x + 20,
      y: y + 20,
      text: title,
      fontSize: 18,
      fill: '#1F2937'
    });
    cardElements.push(titleText);

    // Content (if provided)
    if (content) {
      const contentText = await this.createShape({
        shapeType: SHAPE_TYPES.TEXT,
        x: x + 20,
        y: y + 60,
        text: content,
        fontSize: 14,
        fill: '#6B7280'
      });
      cardElements.push(contentText);
    }
    
    console.log('✅ Created card layout with title:', title);
    return cardElements;
  }

  /**
   * DELETE SHAPE - Utility function (supports friendly IDs)
   */
  async deleteShape(shapeIdInput) {
    // Try natural language description first, then fall back to ID
    let shape = this.findShapeByDescription(shapeIdInput);
    if (!shape) {
      shape = this.findShape(shapeIdInput);
    }
    
    if (!shape) {
      throw new Error(`Shape not found: "${shapeIdInput}". Try describing it by color and type (e.g., "blue rectangle").`);
    }

    const description = this.getShapeDescription(shape);
    await this.canvas.deleteShape(shape.id);
    console.log('✅ Deleted shape:', description);
    return {
      shapeId: shape.id, 
      description: description, 
      deleted: true 
    };
  }
}

export default CanvasAPI;