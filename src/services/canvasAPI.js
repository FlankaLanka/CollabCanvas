import { SHAPE_TYPES, DEFAULT_SHAPE_PROPS } from '../utils/constants';
import { parseColor } from './ai';
import {
  getViewportCenter as getImprovedViewportCenter,
  snapPositionToGrid,
  getCanvasBounds,
  keepInBounds,
  getCenteredPosition,
  layoutVertical,
  layoutHorizontal,
  layoutGrid,
  findAvailablePosition,
  getRecommendedFormWidth,
  createShapeGroup,
  LAYOUT_CONSTANTS
} from './aiLayoutHelpers';

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
    
    // Snap position to grid and ensure it's within bounds
    const elementWidth = width || (shapeType === SHAPE_TYPES.CIRCLE ? (radius || defaults.radius) * 2 : defaults.width);
    const elementHeight = height || (shapeType === SHAPE_TYPES.CIRCLE ? (radius || defaults.radius) * 2 : defaults.height);
    
    const canvasContext = { stageRef: this.canvas.stageRef, stageScale: this.canvas.stageScale, stagePosition: this.canvas.stagePosition };
    const bounds = getCanvasBounds(canvasContext);
    
    let position = snapPositionToGrid({ x, y });
    position = keepInBounds(position, { width: elementWidth, height: elementHeight }, bounds);
    
    const shapeData = {
      type: shapeType,
      x: position.x,
      y: position.y,
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

  // Create multiple shapes at once
  async createMultipleShapes({ shapeType, count, startX, startY, spacing = LAYOUT_CONSTANTS.DEFAULT_HORIZONTAL_SPACING, arrangement = 'row', width, height, radius, scale = 1, fill }) {
    const defaults = DEFAULT_SHAPE_PROPS[shapeType];
    if (!defaults) {
      throw new Error(`Unsupported shape type: ${shapeType}`);
    }

    const color = fill ? parseColor(fill) : defaults.fill;
    const createdShapes = [];
    
    // Use improved layout helpers for positioning
    const canvasContext = { stageRef: this.canvas.stageRef, stageScale: this.canvas.stageScale, stagePosition: this.canvas.stagePosition };
    const elementWidth = width || (shapeType === SHAPE_TYPES.CIRCLE ? (radius || defaults.radius) * 2 : defaults.width);
    const elementHeight = height || (shapeType === SHAPE_TYPES.CIRCLE ? (radius || defaults.radius) * 2 : defaults.height);
    
    // Create dummy elements for layout calculation
    const elements = Array(count).fill({ width: elementWidth, height: elementHeight });
    
    let positions;
    const startPosition = findAvailablePosition(
      { width: elementWidth, height: elementHeight }, 
      this.getCanvasState(), 
      canvasContext,
      snapPositionToGrid({ x: startX, y: startY })
    );
    
    switch (arrangement) {
      case 'row':
        positions = layoutHorizontal(elements, { startPosition, spacing, canvasContext });
        break;
      case 'column': 
        positions = layoutVertical(elements, { startPosition, spacing, canvasContext });
        break;
      case 'grid':
        positions = layoutGrid(elements, { startPosition, spacing, canvasContext });
        break;
      case 'scattered':
        positions = this.calculateScatteredPositions(count, startPosition, spacing, canvasContext);
        break;
      default:
        positions = layoutHorizontal(elements, { startPosition, spacing, canvasContext });
    }
    
    for (let i = 0; i < count; i++) {
      const pos = positions[i];
      
      const shapeData = {
        type: shapeType,
        x: pos.x,
        y: pos.y,
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
      createdShapes.push(newShape);
    }
    
    return {
      success: true,
      shapeIds: createdShapes.map(s => s.id),
      count: createdShapes.length,
      message: `Created ${count} ${shapeType}s in ${arrangement} arrangement`
    };
  }

  // Helper function to calculate scattered positions with improved layout
  calculateScatteredPositions(count, startPosition, spacing, canvasContext) {
    const positions = [];
    const bounds = getCanvasBounds(canvasContext);
    
    for (let i = 0; i < count; i++) {
      // Create a scattered pattern in a spiral
      const angle = (i / count) * 2 * Math.PI;
      const radius = 50 + (i * 20);
      
      let position = {
        x: startPosition.x + Math.cos(angle) * radius,
        y: startPosition.y + Math.sin(angle) * radius
      };
      
      // Snap to grid and keep in bounds
      position = snapPositionToGrid(position);
      position = keepInBounds(position, { width: 100, height: 100 }, bounds);
      
      positions.push(position);
    }
    
    return positions;
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
  async createLoginForm({ x, y, width }) {
    const elements = [];
    
    // Use improved layout system
    const canvasContext = { stageRef: this.canvas.stageRef, stageScale: this.canvas.stageScale, stagePosition: this.canvas.stagePosition };
    const formWidth = width || getRecommendedFormWidth(canvasContext);
    const containerPadding = LAYOUT_CONSTANTS.FORM_CONTAINER_PADDING;
    const fieldHeight = 45;
    const formSpacing = LAYOUT_CONSTANTS.DEFAULT_VERTICAL_SPACING;
    
    // Find optimal position for the form
    const formElements = [
      { width: formWidth, height: 35 }, // Title
      { width: formWidth, height: 20 }, // Username label
      { width: formWidth, height: fieldHeight }, // Username field
      { width: formWidth, height: 20 }, // Password label  
      { width: formWidth, height: fieldHeight }, // Password field
      { width: formWidth, height: 50 } // Submit button
    ];
    
    const totalFormHeight = formElements.reduce((total, el, i) => total + el.height + (i > 0 ? formSpacing : 0), 0);
    const containerHeight = totalFormHeight + (containerPadding * 2);
    
    // Position form in viewport, avoiding existing shapes
    let preferredPosition;
    if (x !== undefined && y !== undefined) {
      // Use provided coordinates
      preferredPosition = snapPositionToGrid({ x, y });
    } else {
      // Default to viewport center for better positioning
      preferredPosition = getImprovedViewportCenter(canvasContext);
    }
    
    const formPosition = findAvailablePosition(
      { width: formWidth + (containerPadding * 2), height: containerHeight },
      this.getCanvasState(),
      canvasContext, 
      preferredPosition
    );
    
    // Debug logging for positioning
    console.log('🎯 Login Form Positioning Debug:', {
      providedCoords: { x, y },
      preferredPosition,
      finalPosition: formPosition,
      formWidth,
      containerHeight,
      canvasContext: {
        stageScale: canvasContext.stageScale,
        stagePosition: canvasContext.stagePosition
      }
    });
    
    // Form container background (for better visual grouping)
    const containerShape = await this.canvas.addShape({
      type: SHAPE_TYPES.RECTANGLE,
      x: formPosition.x,
      y: formPosition.y,
      width: formWidth + (containerPadding * 2),
      height: containerHeight,
      fill: '#F9FAFB'
    });
    elements.push(containerShape);

    // Container border
    const borderShape = await this.canvas.addShape({
      type: SHAPE_TYPES.RECTANGLE,
      x: formPosition.x - 1,
      y: formPosition.y - 1,
      width: formWidth + (containerPadding * 2) + 2,
      height: containerHeight + 2,
      fill: '#E5E7EB'
    });
    elements.push(borderShape);

    // Use layout helpers for consistent positioning
    const contentStartX = formPosition.x + containerPadding;
    const contentStartY = formPosition.y + containerPadding;
    
    // Use layout vertical for consistent spacing
    const elementPositions = layoutVertical(formElements, {
      startPosition: { x: contentStartX, y: contentStartY },
      spacing: formSpacing,
      alignment: 'left',
      containerWidth: formWidth,
      canvasContext
    });

    let elementIndex = 0;
    
    // Title
    const titlePos = elementPositions[elementIndex++];
    const titleShape = await this.canvas.addShape({
      type: SHAPE_TYPES.TEXT,
      x: titlePos.x,
      y: titlePos.y,
      text: 'Login',
      fontSize: 28,
      fontFamily: 'Inter, Arial, sans-serif',
      fill: '#1F2937',
      width: formWidth,
      align: 'center',
      padding: 0
    });
    elements.push(titleShape);

    // Username label  
    const usernameLabelPos = elementPositions[elementIndex++];
    const usernameLabel = await this.canvas.addShape({
      type: SHAPE_TYPES.TEXT,
      x: usernameLabelPos.x,
      y: usernameLabelPos.y,
      text: 'Username',
      fontSize: 14,
      fontFamily: 'Inter, Arial, sans-serif',
      fill: '#374151',
      width: formWidth,
      align: 'left',
      padding: 0
    });
    elements.push(usernameLabel);

    // Username field
    const usernamePos = elementPositions[elementIndex++];
    const usernameShape = await this.canvas.addShape({
      type: SHAPE_TYPES.TEXT_INPUT,
      x: usernamePos.x,
      y: usernamePos.y,
      text: 'Enter your username',
      fontSize: 16,
      fontFamily: 'Inter, Arial, sans-serif',
      fill: '#9CA3AF',
      width: formWidth,
      height: fieldHeight,
      padding: 12,
      background: '#FFFFFF',
      borderColor: '#D1D5DB',
      borderWidth: 2,
      cornerRadius: 8,
      align: 'left'
    });
    elements.push(usernameShape);

    // Password label
    const passwordLabelPos = elementPositions[elementIndex++];
    const passwordLabel = await this.canvas.addShape({
      type: SHAPE_TYPES.TEXT,
      x: passwordLabelPos.x,
      y: passwordLabelPos.y,
      text: 'Password',
      fontSize: 14,
      fontFamily: 'Inter, Arial, sans-serif',
      fill: '#374151',
      width: formWidth,
      align: 'left',
      padding: 0
    });
    elements.push(passwordLabel);

    // Password field
    const passwordPos = elementPositions[elementIndex++];
    const passwordShape = await this.canvas.addShape({
      type: SHAPE_TYPES.TEXT_INPUT,
      x: passwordPos.x,
      y: passwordPos.y,
      text: 'Enter your password',
      fontSize: 16,
      fontFamily: 'Inter, Arial, sans-serif',
      fill: '#9CA3AF',
      width: formWidth,
      height: fieldHeight,
      padding: 12,
      background: '#FFFFFF',
      borderColor: '#D1D5DB',
      borderWidth: 2,
      cornerRadius: 8,
      align: 'left'
    });
    elements.push(passwordShape);

    // Submit button
    const buttonPos = elementPositions[elementIndex++];
    const buttonShape = await this.canvas.addShape({
      type: SHAPE_TYPES.RECTANGLE,
      x: buttonPos.x,
      y: buttonPos.y,
      width: formWidth,
      height: 50,
      fill: '#3B82F6'
    });
    elements.push(buttonShape);

    // Button text - properly centered within the button
    const buttonText = await this.canvas.addShape({
      type: SHAPE_TYPES.TEXT,
      x: buttonPos.x,
      y: buttonPos.y + 15, // Center vertically within the 50px button
      text: 'Sign In',
      fontSize: 16,
      fontFamily: 'Inter, Arial, sans-serif',
      fill: '#FFFFFF',
      width: formWidth,
      align: 'center',
      padding: 0
    });
    elements.push(buttonText);

    // Create a shape group for the form
    const formGroup = createShapeGroup(
      `login-form-${Date.now()}`,
      elements,
      'form'
    );

    return {
      success: true,
      elements: elements.map(el => el.id),
      group: formGroup,
      message: `Created login form with ${elements.length} elements at (${formPosition.x}, ${formPosition.y})`
    };
  }

  // Create a navigation bar
  async createNavBar({ x, y, width = 800, menuItems }) {
    const elements = [];
    const navHeight = 60;
    
    // Use improved layout system
    const canvasContext = { stageRef: this.canvas.stageRef, stageScale: this.canvas.stageScale, stagePosition: this.canvas.stagePosition };
    
    // Find optimal position for navigation bar
    let preferredNavPosition;
    if (x !== undefined && y !== undefined) {
      preferredNavPosition = snapPositionToGrid({ x, y });
    } else {
      // Position at top of viewport for navigation bars
      const center = getImprovedViewportCenter(canvasContext);
      const bounds = getCanvasBounds(canvasContext);
      preferredNavPosition = { x: center.x - (width / 2), y: bounds.top + 20 };
    }
    
    const navPosition = findAvailablePosition(
      { width: width, height: navHeight },
      this.getCanvasState(),
      canvasContext,
      preferredNavPosition
    );
    
    // Navigation bar shadow/border
    const shadowShape = await this.canvas.addShape({
      type: SHAPE_TYPES.RECTANGLE,
      x: navPosition.x,
      y: navPosition.y + 2,
      width: width,
      height: navHeight,
      fill: '#0F172A'
    });
    elements.push(shadowShape);
    
    // Background bar
    const backgroundShape = await this.canvas.addShape({
      type: SHAPE_TYPES.RECTANGLE,
      x: navPosition.x,
      y: navPosition.y,
      width: width,
      height: navHeight,
      fill: '#1E293B'
    });
    elements.push(backgroundShape);

    // Menu items with improved horizontal layout
    const menuElements = menuItems.map(item => ({
      text: item,
      width: width / menuItems.length,
      height: 20
    }));

    const menuPositions = layoutHorizontal(menuElements, {
      startPosition: { x: navPosition.x, y: navPosition.y + 20 },
      spacing: 0, // No spacing for nav items
      alignment: 'center',
      canvasContext
    });
    
    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i];
      const menuText = await this.canvas.addShape({
        type: SHAPE_TYPES.TEXT,
        x: menuPositions[i].x,
        y: menuPositions[i].y,
        text: item,
        fontSize: 16,
        fontFamily: 'Inter, Arial, sans-serif',
        fill: '#F1F5F9',
        width: menuElements[i].width,
        align: 'center',
        padding: 0
      });
      elements.push(menuText);
    }

    // Create navigation group
    const navGroup = createShapeGroup(
      `navbar-${Date.now()}`,
      elements,
      'navigation'
    );

    return {
      success: true,
      elements: elements.map(el => el.id),
      group: navGroup,
      message: `Created navigation bar with ${menuItems.length} menu items at (${navPosition.x}, ${navPosition.y})`
    };
  }

  // Create a card layout
  async createCardLayout({ x, y, width = 300, height = 200, title, content = '' }) {
    const elements = [];
    const cardPadding = LAYOUT_CONSTANTS.CARD_PADDING;
    
    // Use improved layout system
    const canvasContext = { stageRef: this.canvas.stageRef, stageScale: this.canvas.stageScale, stagePosition: this.canvas.stagePosition };
    
    // Find optimal position for the card
    let preferredCardPosition;
    if (x !== undefined && y !== undefined) {
      preferredCardPosition = snapPositionToGrid({ x, y });
    } else {
      // Default to viewport center for cards
      preferredCardPosition = getImprovedViewportCenter(canvasContext);
    }
    
    const cardPosition = findAvailablePosition(
      { width: width, height: height },
      this.getCanvasState(),
      canvasContext,
      preferredCardPosition
    );
    
    // Card shadow (for depth)
    const shadowShape = await this.canvas.addShape({
      type: SHAPE_TYPES.RECTANGLE,
      x: cardPosition.x + 4,
      y: cardPosition.y + 4,
      width: width,
      height: height,
      fill: '#0000001A' // Subtle shadow
    });
    elements.push(shadowShape);

    // Card border
    const borderShape = await this.canvas.addShape({
      type: SHAPE_TYPES.RECTANGLE,
      x: cardPosition.x - 1,
      y: cardPosition.y - 1,
      width: width + 2,
      height: height + 2,
      fill: '#E2E8F0'
    });
    elements.push(borderShape);
    
    // Card background
    const cardShape = await this.canvas.addShape({
      type: SHAPE_TYPES.RECTANGLE,
      x: cardPosition.x,
      y: cardPosition.y,
      width: width,
      height: height,
      fill: '#FFFFFF'
    });
    elements.push(cardShape);

    // Content elements for layout
    const cardElements = [
      { width: width - (cardPadding * 2), height: 30 } // Title
    ];
    
    if (content && content.trim()) {
      cardElements.push({ width: width - (cardPadding * 2), height: 60 }); // Content
    }

    // Use vertical layout for card contents
    const contentPositions = layoutVertical(cardElements, {
      startPosition: { x: cardPosition.x + cardPadding, y: cardPosition.y + cardPadding },
      spacing: LAYOUT_CONSTANTS.DEFAULT_VERTICAL_SPACING,
      alignment: 'left',
      containerWidth: width - (cardPadding * 2),
      canvasContext
    });

    let elementIndex = 0;

    // Title
    const titlePos = contentPositions[elementIndex++];
    const titleShape = await this.canvas.addShape({
      type: SHAPE_TYPES.TEXT,
      x: titlePos.x,
      y: titlePos.y,
      text: title,
      fontSize: 22,
      fontFamily: 'Inter, Arial, sans-serif',
      fill: '#1E293B',
      width: width - (cardPadding * 2),
      align: 'left',
      padding: 0
    });
    elements.push(titleShape);

    // Content (if provided)
    if (content && content.trim()) {
      const contentPos = contentPositions[elementIndex++];
      const contentShape = await this.canvas.addShape({
        type: SHAPE_TYPES.TEXT,
        x: contentPos.x,
        y: contentPos.y,
        text: content,
        fontSize: 15,
        fontFamily: 'Inter, Arial, sans-serif',
        fill: '#64748B',
        width: width - (cardPadding * 2),
        align: 'left',
        padding: 0
      });
      elements.push(contentShape);
    }

    // Create card group
    const cardGroup = createShapeGroup(
      `card-${Date.now()}`,
      elements,
      'card'
    );

    return {
      success: true,
      elements: elements.map(el => el.id),
      group: cardGroup,
      message: `Created card layout "${title}" with ${elements.length} elements at (${cardPosition.x}, ${cardPosition.y})`
    };
  }
}

export default CanvasAPI;
