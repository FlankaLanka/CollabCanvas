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
   * Get current canvas state for AI context
   */
  getCanvasState() {
    const shapes = this.canvas.shapes || [];
    console.log('🔍 CanvasAPI getCanvasState called:', {
      shapesCount: shapes.length,
      shapes: shapes.map(s => ({ id: s.id, type: s.type, x: s.x, y: s.y })),
      selectedIds: Array.from(this.canvas.selectedIds || [])
    });
    
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
        zIndex: shape.zIndex || 0
      })),
      totalShapes: shapes.length,
      selectedIds: Array.from(this.canvas.selectedIds || [])
    };
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
    }

    // Add to canvas using context method
    await this.canvas.addShape(newShape);
    
    console.log('✅ Created shape:', newShape.type, 'at', `(${newShape.x}, ${newShape.y})`);
    return newShape;
  }

  /**
   * MOVE SHAPE - Manipulation function
   */
  async moveShape(shapeId, x, y) {
    const shape = this.canvas.shapes?.find(s => s.id === shapeId);
    if (!shape) {
      throw new Error(`Shape not found: ${shapeId}`);
    }

    await this.canvas.updateShape(shapeId, { x, y });
    console.log('✅ Moved shape:', shapeId, 'to', `(${x}, ${y})`);
    return { shapeId, x, y };
  }

  /**
   * RESIZE SHAPE - Manipulation function
   */
  async resizeShape(shapeId, { width, height, radiusX, radiusY, scale }) {
    const shape = this.canvas.shapes?.find(s => s.id === shapeId);
    if (!shape) {
      throw new Error(`Shape not found: ${shapeId}`);
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

    await this.canvas.updateShape(shapeId, updates);
    console.log('✅ Resized shape:', shapeId, updates);
    return { shapeId, ...updates };
  }

  /**
   * ROTATE SHAPE - Manipulation function
   */
  async rotateShape(shapeId, degrees) {
    const shape = this.canvas.shapes?.find(s => s.id === shapeId);
    if (!shape) {
      throw new Error(`Shape not found: ${shapeId}`);
    }

    await this.canvas.updateShape(shapeId, { rotation: degrees });
    console.log('✅ Rotated shape:', shapeId, 'to', degrees, 'degrees');
    return { shapeId, rotation: degrees };
  }

  /**
   * CHANGE SHAPE COLOR - Manipulation function
   */
  async changeShapeColor(shapeId, color) {
    const shape = this.canvas.shapes?.find(s => s.id === shapeId);
    if (!shape) {
      throw new Error(`Shape not found: ${shapeId}`);
    }

    const parsedColor = this.parseColor(color);
    await this.canvas.updateShape(shapeId, { fill: parsedColor });
    console.log('✅ Changed shape color:', shapeId, 'to', parsedColor);
    return { shapeId, fill: parsedColor };
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
   * DELETE SHAPE - Utility function
   */
  async deleteShape(shapeId) {
    const shape = this.canvas.shapes?.find(s => s.id === shapeId);
    if (!shape) {
      throw new Error(`Shape not found: ${shapeId}`);
    }

    await this.canvas.deleteShape(shapeId);
    console.log('✅ Deleted shape:', shapeId);
    return { shapeId, deleted: true };
  }
}

export default CanvasAPI;