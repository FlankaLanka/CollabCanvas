import { CANVAS_WIDTH, CANVAS_HEIGHT, SHAPE_TYPES } from '../utils/constants';

/**
 * AI Layout Helpers - Improved Layout Quality for Collab Canvas
 * 
 * This module provides enhanced layout functionality for the AI agent to generate
 * well-positioned, consistently spaced, and aesthetically pleasing UI layouts.
 * 
 * KEY IMPROVEMENTS:
 * 1. ✅ Viewport-aware positioning (elements centered based on user's current view)
 * 2. ✅ 8px grid snapping for consistency and reduced jitter  
 * 3. ✅ Canvas bounds checking (keeps all elements visible)
 * 4. ✅ Consistent spacing system (20px vertical, 16px horizontal defaults)
 * 5. ✅ Shape grouping for logically related elements
 * 6. ✅ Smart layout functions (layoutVertical, layoutHorizontal, layoutGrid)
 * 7. ✅ Collision avoidance (finds available positions)
 * 8. ✅ Responsive form sizing based on viewport
 * 
 * USAGE:
 * - All AI layout functions now use these helpers automatically
 * - Positions are snapped to grid and kept within bounds
 * - Elements are grouped by type (forms, navigation, cards)
 * - Layouts adapt to current viewport and avoid existing shapes
 */

// Layout constants
export const LAYOUT_CONSTANTS = {
  GRID_SIZE: 8, // 8px grid for snapping
  DEFAULT_VERTICAL_SPACING: 20, // 20px vertical gap
  DEFAULT_HORIZONTAL_SPACING: 16, // 16px horizontal gap  
  VIEWPORT_PADDING: 50, // Keep elements 50px from viewport edges
  FORM_CONTAINER_PADDING: 30, // Padding inside form containers
  CARD_PADDING: 24, // Padding inside cards
  MIN_ELEMENT_SPACING: 8, // Minimum space between elements
};

/**
 * Snap coordinate to 8px grid to reduce jitter and improve alignment
 */
export function snapToGrid(value, gridSize = LAYOUT_CONSTANTS.GRID_SIZE) {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap position object to grid
 */
export function snapPositionToGrid(position, gridSize = LAYOUT_CONSTANTS.GRID_SIZE) {
  return {
    x: snapToGrid(position.x, gridSize),
    y: snapToGrid(position.y, gridSize)
  };
}

/**
 * Get the current viewport center considering stage scale and position
 */
export function getViewportCenter(canvasContext) {
  const stageRef = canvasContext?.stageRef;
  const stageScale = canvasContext?.stageScale || 1;
  const stagePosition = canvasContext?.stagePosition || { x: 0, y: 0 };
  
  if (!stageRef?.current) {
    // Fallback to canvas center if no stage ref
    return snapPositionToGrid({ 
      x: CANVAS_WIDTH / 2, 
      y: CANVAS_HEIGHT / 2 
    });
  }

  const stage = stageRef.current;
  const container = stage.container();
  if (!container) {
    return snapPositionToGrid({ 
      x: CANVAS_WIDTH / 2, 
      y: CANVAS_HEIGHT / 2 
    });
  }

  const containerRect = container.getBoundingClientRect();
  const containerCenterX = containerRect.width / 2;
  const containerCenterY = containerRect.height / 2;

  const canvasX = (containerCenterX - stagePosition.x) / stageScale;
  const canvasY = (containerCenterY - stagePosition.y) / stageScale;

  return snapPositionToGrid({ x: canvasX, y: canvasY });
}

/**
 * Get canvas bounds considering current viewport
 */
export function getCanvasBounds(canvasContext) {
  const stageScale = canvasContext?.stageScale || 1;
  const stagePosition = canvasContext?.stagePosition || { x: 0, y: 0 };
  
  // Calculate visible area
  const visibleLeft = Math.max(0, -stagePosition.x / stageScale);
  const visibleTop = Math.max(0, -stagePosition.y / stageScale);
  const visibleRight = Math.min(CANVAS_WIDTH, visibleLeft + (800 / stageScale)); // Default viewport width
  const visibleBottom = Math.min(CANVAS_HEIGHT, visibleTop + (600 / stageScale)); // Default viewport height
  
  // Add padding to keep elements comfortably in view
  const padding = LAYOUT_CONSTANTS.VIEWPORT_PADDING;
  
  return {
    left: visibleLeft + padding,
    top: visibleTop + padding,
    right: visibleRight - padding,
    bottom: visibleBottom - padding,
    width: visibleRight - visibleLeft - (padding * 2),
    height: visibleBottom - visibleTop - (padding * 2)
  };
}

/**
 * Ensure position is within canvas bounds, adjusting if necessary
 */
export function keepInBounds(position, elementSize, canvasBounds) {
  const { width = 0, height = 0 } = elementSize;
  
  let x = position.x;
  let y = position.y;
  
  // Keep element within bounds
  if (x < canvasBounds.left) x = canvasBounds.left;
  if (y < canvasBounds.top) y = canvasBounds.top;
  if (x + width > canvasBounds.right) x = canvasBounds.right - width;
  if (y + height > canvasBounds.bottom) y = canvasBounds.bottom - height;
  
  return snapPositionToGrid({ x, y });
}

/**
 * Calculate optimal position for centering an element or group
 */
export function getCenteredPosition(elementSize, canvasContext, offset = { x: 0, y: 0 }) {
  const center = getViewportCenter(canvasContext);
  const { width = 0, height = 0 } = elementSize;
  
  const position = {
    x: center.x - (width / 2) + offset.x,
    y: center.y - (height / 2) + offset.y
  };
  
  const bounds = getCanvasBounds(canvasContext);
  return keepInBounds(position, elementSize, bounds);
}

/**
 * Layout elements vertically with consistent spacing
 */
export function layoutVertical(elements, options = {}) {
  const {
    startPosition,
    spacing = LAYOUT_CONSTANTS.DEFAULT_VERTICAL_SPACING,
    alignment = 'left', // 'left', 'center', 'right'
    containerWidth,
    canvasContext
  } = options;
  
  // Validation
  if (!elements || elements.length === 0) {
    console.warn('⚠️ layoutVertical called with no elements');
    return [];
  }
  
  if (!startPosition) {
    console.warn('⚠️ layoutVertical called without startPosition');
    return elements.map(() => ({ x: 0, y: 0 }));
  }
  
  const center = startPosition || getViewportCenter(canvasContext);
  const bounds = getCanvasBounds(canvasContext);
  
  // Calculate total height to ensure centering
  const totalHeight = elements.reduce((total, element, index) => {
    const elementHeight = getElementHeight(element);
    return total + elementHeight + (index > 0 ? spacing : 0);
  }, 0);
  
  let currentY = center.y - (totalHeight / 2);
  const positions = [];
  
  elements.forEach((element, index) => {
    if (index > 0) {
      currentY += spacing;
    }
    
    const elementWidth = getElementWidth(element);
    let x = center.x;
    
    // Apply alignment
    if (alignment === 'left') {
      x = containerWidth ? center.x - (containerWidth / 2) : center.x - (elementWidth / 2);
    } else if (alignment === 'center') {
      x = center.x - (elementWidth / 2);
    } else if (alignment === 'right') {
      x = containerWidth ? center.x + (containerWidth / 2) - elementWidth : center.x - (elementWidth / 2);
    }
    
    const position = keepInBounds(
      { x, y: currentY },
      { width: elementWidth, height: getElementHeight(element) },
      bounds
    );
    
    positions.push(position);
    currentY += getElementHeight(element);
  });
  
  return positions;
}

/**
 * Layout elements horizontally with consistent spacing
 */
export function layoutHorizontal(elements, options = {}) {
  const {
    startPosition,
    spacing = LAYOUT_CONSTANTS.DEFAULT_HORIZONTAL_SPACING,
    alignment = 'center', // 'top', 'center', 'bottom'
    canvasContext
  } = options;
  
  const center = startPosition || getViewportCenter(canvasContext);
  const bounds = getCanvasBounds(canvasContext);
  
  // Calculate total width to ensure centering
  const totalWidth = elements.reduce((total, element, index) => {
    const elementWidth = getElementWidth(element);
    return total + elementWidth + (index > 0 ? spacing : 0);
  }, 0);
  
  let currentX = center.x - (totalWidth / 2);
  const positions = [];
  
  elements.forEach((element, index) => {
    if (index > 0) {
      currentX += spacing;
    }
    
    const elementHeight = getElementHeight(element);
    let y = center.y;
    
    // Apply alignment
    if (alignment === 'top') {
      y = center.y - (elementHeight / 2);
    } else if (alignment === 'center') {
      y = center.y - (elementHeight / 2);
    } else if (alignment === 'bottom') {
      y = center.y + (elementHeight / 2) - elementHeight;
    }
    
    const position = keepInBounds(
      { x: currentX, y },
      { width: getElementWidth(element), height: elementHeight },
      bounds
    );
    
    positions.push(position);
    currentX += getElementWidth(element);
  });
  
  return positions;
}

/**
 * Layout elements in a grid
 */
export function layoutGrid(elements, options = {}) {
  const {
    startPosition,
    columns = Math.ceil(Math.sqrt(elements.length)),
    spacing = LAYOUT_CONSTANTS.DEFAULT_VERTICAL_SPACING,
    canvasContext
  } = options;
  
  const center = startPosition || getViewportCenter(canvasContext);
  const bounds = getCanvasBounds(canvasContext);
  
  const rows = Math.ceil(elements.length / columns);
  const positions = [];
  
  // Estimate grid dimensions for centering
  const avgElementWidth = 120; // Reasonable default
  const avgElementHeight = 100; // Reasonable default
  const gridWidth = (columns * avgElementWidth) + ((columns - 1) * spacing);
  const gridHeight = (rows * avgElementHeight) + ((rows - 1) * spacing);
  
  const gridStartX = center.x - (gridWidth / 2);
  const gridStartY = center.y - (gridHeight / 2);
  
  elements.forEach((element, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    
    const x = gridStartX + (col * (avgElementWidth + spacing));
    const y = gridStartY + (row * (avgElementHeight + spacing));
    
    const position = keepInBounds(
      { x, y },
      { width: getElementWidth(element), height: getElementHeight(element) },
      bounds
    );
    
    positions.push(position);
  });
  
  return positions;
}

/**
 * Create a shape group for related elements
 */
export function createShapeGroup(groupId, shapes, groupType = 'layout') {
  return {
    id: groupId,
    type: 'group',
    groupType, // 'layout', 'form', 'card', etc.
    shapes: shapes.map(shape => shape.id),
    created: Date.now(),
    // Calculate group bounds
    bounds: calculateGroupBounds(shapes)
  };
}

/**
 * Calculate bounds of a group of shapes
 */
export function calculateGroupBounds(shapes) {
  if (!shapes.length) return { x: 0, y: 0, width: 0, height: 0 };
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  shapes.forEach(shape => {
    const width = getElementWidth(shape);
    const height = getElementHeight(shape);
    
    minX = Math.min(minX, shape.x);
    minY = Math.min(minY, shape.y);
    maxX = Math.max(maxX, shape.x + width);
    maxY = Math.max(maxY, shape.y + height);
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Helper function to get element width
 */
function getElementWidth(element) {
  if (element.width) return element.width;
  if (element.radiusX) return element.radiusX * 2;
  if (element.type === SHAPE_TYPES.TRIANGLE) return 70; // Default triangle width
  return 100; // Default width
}

/**
 * Helper function to get element height  
 */
function getElementHeight(element) {
  if (element.height) return element.height;
  if (element.radiusY) return element.radiusY * 2;
  if (element.type === SHAPE_TYPES.TRIANGLE) return 80; // Default triangle height
  if (element.type === SHAPE_TYPES.TEXT) return element.fontSize ? element.fontSize + 16 : 36;
  return 100; // Default height
}

/**
 * Position elements avoiding existing shapes on canvas
 */
export function findAvailablePosition(elementSize, canvasState, canvasContext, preferredPosition = null) {
  const bounds = getCanvasBounds(canvasContext);
  const { width = 100, height = 100 } = elementSize;
  
  // Start with preferred position or viewport center
  let position = preferredPosition || getViewportCenter(canvasContext);
  
  // Check if position overlaps with existing shapes
  const existingShapes = canvasState?.shapes || [];
  const isOverlapping = (pos) => {
    return existingShapes.some(shape => {
      const shapeWidth = getElementWidth(shape);
      const shapeHeight = getElementHeight(shape);
      
      return !(pos.x >= shape.x + shapeWidth ||
               pos.x + width <= shape.x ||
               pos.y >= shape.y + shapeHeight ||
               pos.y + height <= shape.y);
    });
  };
  
  // If no overlap, return the position
  if (!isOverlapping(position)) {
    return keepInBounds(position, elementSize, bounds);
  }
  
  // Try to find a non-overlapping position in a spiral pattern
  const spacing = 40;
  let attempts = 0;
  const maxAttempts = 20;
  
  while (attempts < maxAttempts) {
    const angle = (attempts / maxAttempts) * Math.PI * 2;
    const distance = spacing * (1 + attempts * 0.5);
    
    const testPosition = {
      x: position.x + Math.cos(angle) * distance,
      y: position.y + Math.sin(angle) * distance
    };
    
    if (!isOverlapping(testPosition)) {
      return keepInBounds(testPosition, elementSize, bounds);
    }
    
    attempts++;
  }
  
  // Fallback to original position if no space found
  return keepInBounds(position, elementSize, bounds);
}

/**
 * Calculate recommended form width based on viewport
 */
export function getRecommendedFormWidth(canvasContext) {
  const bounds = getCanvasBounds(canvasContext);
  const maxFormWidth = 400;
  const minFormWidth = 280;
  
  // Use 40% of available width, clamped to min/max
  const recommendedWidth = Math.max(minFormWidth, Math.min(maxFormWidth, bounds.width * 0.4));
  return snapToGrid(recommendedWidth);
}
