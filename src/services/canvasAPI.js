import { SHAPE_TYPES, DEFAULT_SHAPE_PROPS } from '../utils/constants';
import { parseColor } from './ai';

/**
 * Canvas API Service - Bridges AI function calls to canvas operations
 * This provides a clean API layer for the AI to manipulate the canvas
 */
export class CanvasAPI {
  constructor(canvasContext) {
    this.canvas = canvasContext;
  }

  // Get current canvas state for AI context
  getCanvasState() {
    const shapes = this.canvas.shapes || [];
    return {
      totalShapes: shapes.length,
      shapes: shapes.map(shape => ({
        id: shape.id,
        type: shape.type,
        x: Math.round(shape.x),
        y: Math.round(shape.y),
        width: shape.width,
        height: shape.height,
        radius: shape.radius,
        fill: shape.fill,
        text: shape.text,
        rotation: shape.rotation || 0
      })),
      viewport: {
        scale: this.canvas.stageScale || 1,
        position: this.canvas.stagePosition || { x: 0, y: 0 }
      }
    };
  }

  // Create a new shape
  async createShape({ shapeType, x, y, width, height, radius, scale = 1, fill }) {
    const defaults = DEFAULT_SHAPE_PROPS[shapeType];
    if (!defaults) {
      throw new Error(`Unsupported shape type: ${shapeType}`);
    }

    const color = fill ? parseColor(fill) : defaults.fill;
    
    const shapeData = {
      type: shapeType,
      x: x,
      y: y,
      fill: color
    };

    // Add type-specific properties
    switch (shapeType) {
      case SHAPE_TYPES.RECTANGLE:
        shapeData.width = width || defaults.width;
        shapeData.height = height || defaults.height;
        break;
      
      case SHAPE_TYPES.CIRCLE:
        shapeData.radius = radius || defaults.radius;
        break;
      
      case SHAPE_TYPES.TRIANGLE:
        const triangleScale = scale || 1;
        shapeData.points = defaults.points.map(point => point * triangleScale);
        shapeData.closed = true;
        break;
    }

    const newShape = await this.canvas.addShape(shapeData);
    
    return {
      success: true,
      shapeId: newShape.id,
      message: `Created ${shapeType} at position (${x}, ${y})`
    };
  }

  // Create text or text input
  async createText({ text, textType, x, y, fontSize, fontFamily, fill, width, align }) {
    const defaults = DEFAULT_SHAPE_PROPS[textType === 'text_input' ? SHAPE_TYPES.TEXT_INPUT : SHAPE_TYPES.TEXT];
    
    const textData = {
      type: textType === 'text_input' ? SHAPE_TYPES.TEXT_INPUT : SHAPE_TYPES.TEXT,
      x: x,
      y: y,
      text: text,
      fontSize: fontSize || defaults.fontSize,
      fontFamily: fontFamily || defaults.fontFamily,
      fill: fill ? parseColor(fill) : defaults.fill,
      width: width || defaults.width,
      align: align || defaults.align,
      padding: defaults.padding,
      editable: true
    };

    // Add text input specific properties
    if (textType === 'text_input') {
      textData.height = defaults.height;
      textData.background = defaults.background;
      textData.borderColor = defaults.borderColor;
      textData.borderWidth = defaults.borderWidth;
      textData.cornerRadius = defaults.cornerRadius;
    } else {
      textData.height = 'auto';
      textData.verticalAlign = defaults.verticalAlign;
    }

    const newShape = await this.canvas.addShape(textData);
    
    return {
      success: true,
      shapeId: newShape.id,
      message: `Created ${textType} "${text}" at position (${x}, ${y})`
    };
  }

  // Move a shape to new position
  async moveShape(shapeId, x, y) {
    const shape = this.canvas.getShape(shapeId);
    if (!shape) {
      throw new Error(`Shape with ID ${shapeId} not found`);
    }

    await this.canvas.updateShape(shapeId, { x, y });
    
    return {
      success: true,
      message: `Moved ${shape.type} to position (${x}, ${y})`
    };
  }

  // Resize a shape
  async resizeShape(shapeId, { width, height, radius, scale }) {
    const shape = this.canvas.getShape(shapeId);
    if (!shape) {
      throw new Error(`Shape with ID ${shapeId} not found`);
    }

    const updates = {};

    switch (shape.type) {
      case SHAPE_TYPES.RECTANGLE:
        if (width !== undefined) updates.width = width;
        if (height !== undefined) updates.height = height;
        break;
      
      case SHAPE_TYPES.CIRCLE:
        if (radius !== undefined) updates.radius = radius;
        break;
      
      case SHAPE_TYPES.TRIANGLE:
        if (scale !== undefined) {
          const originalPoints = DEFAULT_SHAPE_PROPS[SHAPE_TYPES.TRIANGLE].points;
          updates.points = originalPoints.map(point => point * scale);
        }
        break;
      
      case SHAPE_TYPES.TEXT:
      case SHAPE_TYPES.TEXT_INPUT:
        if (width !== undefined) updates.width = width;
        if (height !== undefined && shape.type === SHAPE_TYPES.TEXT_INPUT) {
          updates.height = height;
        }
        break;
    }

    if (Object.keys(updates).length === 0) {
      throw new Error(`No valid resize parameters for ${shape.type}`);
    }

    await this.canvas.updateShape(shapeId, updates);
    
    return {
      success: true,
      message: `Resized ${shape.type}`
    };
  }

  // Rotate a shape (we need to add rotation support to the Shape component)
  async rotateShape(shapeId, degrees) {
    const shape = this.canvas.getShape(shapeId);
    if (!shape) {
      throw new Error(`Shape with ID ${shapeId} not found`);
    }

    await this.canvas.updateShape(shapeId, { rotation: degrees });
    
    return {
      success: true,
      message: `Rotated ${shape.type} by ${degrees} degrees`
    };
  }

  // Change shape color
  async changeShapeColor(shapeId, fill) {
    const shape = this.canvas.getShape(shapeId);
    if (!shape) {
      throw new Error(`Shape with ID ${shapeId} not found`);
    }

    const color = parseColor(fill);
    await this.canvas.updateShape(shapeId, { fill: color });
    
    return {
      success: true,
      message: `Changed ${shape.type} color to ${color}`
    };
  }

  // Delete a shape
  async deleteShape(shapeId) {
    const shape = this.canvas.getShape(shapeId);
    if (!shape) {
      throw new Error(`Shape with ID ${shapeId} not found`);
    }

    await this.canvas.deleteShape(shapeId);
    
    return {
      success: true,
      message: `Deleted ${shape.type}`
    };
  }

  // Arrange shapes in a horizontal row
  async arrangeInRow({ shapeIds, startX, y, spacing }) {
    let currentX = startX;
    let arrangedCount = 0;

    for (const shapeId of shapeIds) {
      const shape = this.canvas.getShape(shapeId);
      if (shape) {
        await this.canvas.updateShape(shapeId, { x: currentX, y: y });
        
        // Calculate next position based on shape width
        let shapeWidth = 100; // default
        if (shape.type === SHAPE_TYPES.RECTANGLE) {
          shapeWidth = shape.width || 100;
        } else if (shape.type === SHAPE_TYPES.CIRCLE) {
          shapeWidth = (shape.radius || 50) * 2;
        } else if (shape.type === SHAPE_TYPES.TEXT || shape.type === SHAPE_TYPES.TEXT_INPUT) {
          shapeWidth = shape.width || 200;
        }
        
        currentX += shapeWidth + spacing;
        arrangedCount++;
      }
    }
    
    return {
      success: true,
      message: `Arranged ${arrangedCount} shapes in a row`
    };
  }

  // Arrange shapes in a grid
  async arrangeInGrid({ shapeIds, startX, startY, rows, cols, spacingX, spacingY }) {
    let arrangedCount = 0;

    for (let i = 0; i < shapeIds.length && i < rows * cols; i++) {
      const shapeId = shapeIds[i];
      const shape = this.canvas.getShape(shapeId);
      
      if (shape) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        const x = startX + col * spacingX;
        const y = startY + row * spacingY;
        
        await this.canvas.updateShape(shapeId, { x, y });
        arrangedCount++;
      }
    }
    
    return {
      success: true,
      message: `Arranged ${arrangedCount} shapes in a ${rows}x${cols} grid`
    };
  }

  // Create a login form (complex layout)
  async createLoginForm({ x, y, width = 300 }) {
    const elements = [];
    
    // Title
    const titleShape = await this.canvas.addShape({
      type: SHAPE_TYPES.TEXT,
      x: x,
      y: y,
      text: 'Login',
      fontSize: 24,
      fontFamily: 'Arial, sans-serif',
      fill: '#1F2937',
      width: width,
      align: 'center',
      padding: 8
    });
    elements.push(titleShape);

    // Username field
    const usernameShape = await this.canvas.addShape({
      type: SHAPE_TYPES.TEXT_INPUT,
      x: x,
      y: y + 60,
      text: 'Username',
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      fill: '#6B7280',
      width: width,
      height: 40,
      padding: 12,
      background: '#FFFFFF',
      borderColor: '#D1D5DB',
      borderWidth: 1,
      cornerRadius: 6
    });
    elements.push(usernameShape);

    // Password field
    const passwordShape = await this.canvas.addShape({
      type: SHAPE_TYPES.TEXT_INPUT,
      x: x,
      y: y + 120,
      text: 'Password',
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      fill: '#6B7280',
      width: width,
      height: 40,
      padding: 12,
      background: '#FFFFFF',
      borderColor: '#D1D5DB',
      borderWidth: 1,
      cornerRadius: 6
    });
    elements.push(passwordShape);

    // Submit button (as styled rectangle with text)
    const buttonShape = await this.canvas.addShape({
      type: SHAPE_TYPES.RECTANGLE,
      x: x,
      y: y + 180,
      width: width,
      height: 45,
      fill: '#3B82F6'
    });
    elements.push(buttonShape);

    const buttonText = await this.canvas.addShape({
      type: SHAPE_TYPES.TEXT,
      x: x,
      y: y + 190,
      text: 'Sign In',
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      fill: '#FFFFFF',
      width: width,
      align: 'center',
      padding: 8
    });
    elements.push(buttonText);

    return {
      success: true,
      elements: elements.map(el => el.id),
      message: `Created login form with ${elements.length} elements`
    };
  }

  // Create a navigation bar
  async createNavBar({ x, y, width = 800, menuItems }) {
    const elements = [];
    
    // Background bar
    const backgroundShape = await this.canvas.addShape({
      type: SHAPE_TYPES.RECTANGLE,
      x: x,
      y: y,
      width: width,
      height: 60,
      fill: '#1F2937'
    });
    elements.push(backgroundShape);

    // Menu items
    const itemWidth = width / menuItems.length;
    
    for (let i = 0; i < menuItems.length; i++) {
      const itemX = x + i * itemWidth;
      
      const menuText = await this.canvas.addShape({
        type: SHAPE_TYPES.TEXT,
        x: itemX,
        y: y + 15,
        text: menuItems[i],
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        fill: '#FFFFFF',
        width: itemWidth,
        align: 'center',
        padding: 8
      });
      elements.push(menuText);
    }

    return {
      success: true,
      elements: elements.map(el => el.id),
      message: `Created navigation bar with ${menuItems.length} menu items`
    };
  }

  // Create a card layout
  async createCardLayout({ x, y, width, height, title, content = '' }) {
    const elements = [];
    
    // Card background
    const cardShape = await this.canvas.addShape({
      type: SHAPE_TYPES.RECTANGLE,
      x: x,
      y: y,
      width: width,
      height: height,
      fill: '#FFFFFF'
    });
    elements.push(cardShape);

    // Card border (slightly larger rectangle behind)
    const borderShape = await this.canvas.addShape({
      type: SHAPE_TYPES.RECTANGLE,
      x: x - 2,
      y: y - 2,
      width: width + 4,
      height: height + 4,
      fill: '#E5E7EB'
    });
    elements.push(borderShape);

    // Move card background to front (we'll need to implement z-index or layer management)
    // For now, create border first, then card

    // Title
    const titleShape = await this.canvas.addShape({
      type: SHAPE_TYPES.TEXT,
      x: x + 20,
      y: y + 20,
      text: title,
      fontSize: 20,
      fontFamily: 'Arial, sans-serif',
      fill: '#1F2937',
      width: width - 40,
      align: 'left',
      padding: 8
    });
    elements.push(titleShape);

    // Content (if provided)
    if (content) {
      const contentShape = await this.canvas.addShape({
        type: SHAPE_TYPES.TEXT,
        x: x + 20,
        y: y + 70,
        text: content,
        fontSize: 14,
        fontFamily: 'Arial, sans-serif',
        fill: '#6B7280',
        width: width - 40,
        align: 'left',
        padding: 8
      });
      elements.push(contentShape);
    }

    return {
      success: true,
      elements: elements.map(el => el.id),
      message: `Created card layout "${title}" with ${elements.length} elements`
    };
  }

  // Selection-aware operations
  
  // Modify properties of selected shapes
  async modifySelectedShapes({ property, value, colorValue, offsetX, offsetY }) {
    const selectedShapes = this.canvas.getSelectedShapes();
    
    if (!selectedShapes || selectedShapes.length === 0) {
      throw new Error('No shapes selected. Please select shapes first and try again.');
    }

    const updatePromises = [];
    let updates = {};

    // Handle different property types
    if (property === 'fill') {
      const color = parseColor(colorValue || value);
      updates.fill = color;
    } else if (offsetX !== undefined || offsetY !== undefined) {
      // Handle relative positioning
      selectedShapes.forEach(shape => {
        const newX = shape.x + (offsetX || 0);
        const newY = shape.y + (offsetY || 0);
        updatePromises.push(
          this.canvas.updateShape(shape.id, { x: newX, y: newY })
        );
      });
    } else {
      // Handle absolute property values
      updates[property] = value;
    }

    // Apply updates to all selected shapes
    if (Object.keys(updates).length > 0) {
      selectedShapes.forEach(shape => {
        updatePromises.push(
          this.canvas.updateShape(shape.id, updates)
        );
      });
    }

    await Promise.all(updatePromises);
    
    return {
      success: true,
      affectedShapes: selectedShapes.length,
      message: `Modified ${property} for ${selectedShapes.length} selected shapes`
    };
  }

  // Arrange selected shapes in different layouts
  async arrangeSelectedShapes({ arrangement, spacing = 20, centerX, centerY }) {
    const selectedShapes = this.canvas.getSelectedShapes();
    
    if (!selectedShapes || selectedShapes.length === 0) {
      throw new Error('No shapes selected. Please select shapes first and try again.');
    }

    if (selectedShapes.length === 1) {
      return {
        success: true,
        message: 'Only one shape selected - no arrangement needed'
      };
    }

    const updatePromises = [];

    // Calculate center point
    const centerPt = {
      x: centerX || 400,
      y: centerY || 300
    };

    switch (arrangement) {
      case 'row': {
        const totalWidth = selectedShapes.reduce((acc, shape, i) => {
          let shapeWidth = 100;
          if (shape.type === SHAPE_TYPES.RECTANGLE) shapeWidth = shape.width || 100;
          else if (shape.type === SHAPE_TYPES.CIRCLE) shapeWidth = (shape.radius || 50) * 2;
          else if (shape.type === SHAPE_TYPES.TEXT || shape.type === SHAPE_TYPES.TEXT_INPUT) shapeWidth = shape.width || 200;
          return acc + shapeWidth + (i > 0 ? spacing : 0);
        }, 0);
        
        let currentX = centerPt.x - totalWidth / 2;
        const y = centerPt.y;
        
        selectedShapes.forEach(shape => {
          let shapeWidth = 100;
          if (shape.type === SHAPE_TYPES.RECTANGLE) shapeWidth = shape.width || 100;
          else if (shape.type === SHAPE_TYPES.CIRCLE) shapeWidth = (shape.radius || 50) * 2;
          else if (shape.type === SHAPE_TYPES.TEXT || shape.type === SHAPE_TYPES.TEXT_INPUT) shapeWidth = shape.width || 200;
          
          updatePromises.push(
            this.canvas.updateShape(shape.id, { x: currentX + shapeWidth / 2, y })
          );
          currentX += shapeWidth + spacing;
        });
        break;
      }
      
      case 'column': {
        const totalHeight = selectedShapes.length * 100 + (selectedShapes.length - 1) * spacing;
        let currentY = centerPt.y - totalHeight / 2;
        const x = centerPt.x;
        
        selectedShapes.forEach(shape => {
          updatePromises.push(
            this.canvas.updateShape(shape.id, { x, y: currentY })
          );
          currentY += 100 + spacing;
        });
        break;
      }
      
      case 'grid': {
        const cols = Math.ceil(Math.sqrt(selectedShapes.length));
        const rows = Math.ceil(selectedShapes.length / cols);
        const gridWidth = cols * 120 + (cols - 1) * spacing;
        const gridHeight = rows * 120 + (rows - 1) * spacing;
        
        const startX = centerPt.x - gridWidth / 2;
        const startY = centerPt.y - gridHeight / 2;
        
        selectedShapes.forEach((shape, i) => {
          const row = Math.floor(i / cols);
          const col = i % cols;
          const x = startX + col * (120 + spacing);
          const y = startY + row * (120 + spacing);
          
          updatePromises.push(
            this.canvas.updateShape(shape.id, { x, y })
          );
        });
        break;
      }
      
      case 'circle': {
        const radius = Math.max(100, selectedShapes.length * 30);
        const angleStep = (2 * Math.PI) / selectedShapes.length;
        
        selectedShapes.forEach((shape, i) => {
          const angle = i * angleStep - Math.PI / 2; // Start at top
          const x = centerPt.x + Math.cos(angle) * radius;
          const y = centerPt.y + Math.sin(angle) * radius;
          
          updatePromises.push(
            this.canvas.updateShape(shape.id, { x, y })
          );
        });
        break;
      }
      
      case 'center': {
        selectedShapes.forEach(shape => {
          updatePromises.push(
            this.canvas.updateShape(shape.id, { x: centerPt.x, y: centerPt.y })
          );
        });
        break;
      }
    }

    await Promise.all(updatePromises);
    
    return {
      success: true,
      affectedShapes: selectedShapes.length,
      message: `Arranged ${selectedShapes.length} shapes in ${arrangement} formation`
    };
  }

  // Duplicate selected shapes
  async duplicateSelectedShapes({ offsetX = 50, offsetY = 50, count = 1 }) {
    const selectedShapes = this.canvas.getSelectedShapes();
    
    if (!selectedShapes || selectedShapes.length === 0) {
      throw new Error('No shapes selected. Please select shapes first and try again.');
    }

    const newShapes = [];
    
    for (let i = 1; i <= count; i++) {
      for (const shape of selectedShapes) {
        const duplicateData = {
          ...shape,
          x: shape.x + (offsetX * i),
          y: shape.y + (offsetY * i)
        };
        
        // Remove the original ID so a new one is generated
        delete duplicateData.id;
        
        const newShape = await this.canvas.addShape(duplicateData);
        newShapes.push(newShape);
      }
    }
    
    return {
      success: true,
      duplicatedShapes: newShapes.length,
      newShapeIds: newShapes.map(s => s.id),
      message: `Created ${count} duplicate${count > 1 ? 's' : ''} of ${selectedShapes.length} selected shapes`
    };
  }

  // Align selected shapes
  async alignSelectedShapes({ alignment, relativeTo = 'shapes' }) {
    const selectedShapes = this.canvas.getSelectedShapes();
    
    if (!selectedShapes || selectedShapes.length < 2) {
      throw new Error('Please select at least 2 shapes to align.');
    }

    let referenceValue;
    const updatePromises = [];

    // Calculate reference value for alignment
    if (relativeTo === 'canvas') {
      // Align to canvas (viewport center)
      switch (alignment) {
        case 'left': referenceValue = 100; break;
        case 'center': case 'middle': referenceValue = 400; break;
        case 'right': referenceValue = 700; break;
        case 'top': referenceValue = 100; break;
        case 'bottom': referenceValue = 500; break;
      }
    } else {
      // Align relative to other shapes
      switch (alignment) {
        case 'left':
          referenceValue = Math.min(...selectedShapes.map(s => s.x));
          break;
        case 'center':
          referenceValue = selectedShapes.reduce((sum, s) => sum + s.x, 0) / selectedShapes.length;
          break;
        case 'right':
          referenceValue = Math.max(...selectedShapes.map(s => s.x));
          break;
        case 'top':
          referenceValue = Math.min(...selectedShapes.map(s => s.y));
          break;
        case 'middle':
          referenceValue = selectedShapes.reduce((sum, s) => sum + s.y, 0) / selectedShapes.length;
          break;
        case 'bottom':
          referenceValue = Math.max(...selectedShapes.map(s => s.y));
          break;
      }
    }

    // Apply alignment
    selectedShapes.forEach(shape => {
      const updates = {};
      
      switch (alignment) {
        case 'left':
        case 'center':
        case 'right':
          updates.x = referenceValue;
          break;
        case 'top':
        case 'middle':
        case 'bottom':
          updates.y = referenceValue;
          break;
      }
      
      updatePromises.push(
        this.canvas.updateShape(shape.id, updates)
      );
    });

    await Promise.all(updatePromises);
    
    return {
      success: true,
      affectedShapes: selectedShapes.length,
      message: `Aligned ${selectedShapes.length} shapes to ${alignment} ${relativeTo === 'canvas' ? 'of canvas' : 'of selection'}`
    };
  }
}

export default CanvasAPI;
