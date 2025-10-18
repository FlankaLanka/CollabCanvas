/**
 * Layout Flow Engine
 * Provides structured positioning helpers for UI elements
 */

import { tokens } from '../design/tokens.js';

export class LayoutFlowEngine {
  constructor(canvasAPI) {
    this.canvasAPI = canvasAPI;
    this.currentContainer = null;
    this.elementStack = [];
  }

  /**
   * Set the current container for relative positioning
   */
  setContainer(container) {
    this.currentContainer = container;
    this.elementStack = [];
  }

  /**
   * Create a vertical stack of elements
   */
  async createVerticalStack(elements, options = {}) {
    const {
      startY = 0,
      spacing = tokens.spacing.lg,
      alignX = 'center',
      containerWidth = 360
    } = options;

    const results = [];
    let currentY = startY;

    for (const element of elements) {
      const x = this._calculateX(element, alignX, containerWidth);
      const y = currentY;

      const shape = await this.canvasAPI.createShape({
        shapeType: element.type,
        x: x,
        y: y,
        ...element.properties
      });

      results.push({
        ...shape,
        elementType: element.type,
        originalElement: element
      });

      this.elementStack.push(shape);
      currentY += (element.height || 40) + spacing;
    }

    return results;
  }

  /**
   * Align elements to center X of container
   */
  async alignCenterX(elements, containerCenterX = 400) {
    const results = [];
    
    for (const element of elements) {
      const newX = containerCenterX - (element.width || 100) / 2;
      
      await this.canvasAPI.moveShape(element.id, newX, element.y);
      
      results.push({
        ...element,
        x: newX
      });
    }

    return results;
  }

  /**
   * Align elements to left edge of container
   */
  async alignLeft(elements, containerLeftX, containerPadding = tokens.spacing.lg) {
    const results = [];
    
    for (const element of elements) {
      const newX = containerLeftX + containerPadding;
      
      await this.canvasAPI.moveShape(element.id, newX, element.y);
      
      results.push({
        ...element,
        x: newX
      });
    }

    return results;
  }

  /**
   * Align elements to right edge of container
   */
  async alignRight(elements, containerRightX, containerPadding = tokens.spacing.lg) {
    const results = [];
    
    for (const element of elements) {
      const newX = containerRightX - (element.width || 100) - containerPadding;
      
      await this.canvasAPI.moveShape(element.id, newX, element.y);
      
      results.push({
        ...element,
        x: newX
      });
    }

    return results;
  }

  /**
   * Create a horizontal stack of elements
   */
  async createHorizontalStack(elements, options = {}) {
    const {
      startX = 0,
      spacing = tokens.spacing.md,
      alignY = 'center',
      containerHeight = 60
    } = options;

    const results = [];
    let currentX = startX;

    for (const element of elements) {
      const y = this._calculateY(element, alignY, containerHeight);
      const x = currentX;

      const shape = await this.canvasAPI.createShape({
        shapeType: element.type,
        x: x,
        y: y,
        ...element.properties
      });

      results.push({
        ...shape,
        elementType: element.type,
        originalElement: element
      });

      this.elementStack.push(shape);
      currentX += (element.width || 100) + spacing;
    }

    return results;
  }

  /**
   * Set consistent width for all elements
   */
  async setConsistentWidth(elements, width) {
    const results = [];
    
    for (const element of elements) {
      await this.canvasAPI.resizeShape(element.id, { width });
      
      results.push({
        ...element,
        width
      });
    }

    return results;
  }

  /**
   * Calculate X position based on alignment
   */
  _calculateX(element, alignX, containerWidth) {
    const elementWidth = element.width || 100;
    
    switch (alignX) {
      case 'left':
        return this.currentContainer ? this.currentContainer.x - containerWidth/2 + tokens.spacing.lg : 0;
      case 'right':
        return this.currentContainer ? this.currentContainer.x + containerWidth/2 - elementWidth - tokens.spacing.lg : 0;
      case 'center':
      default:
        return this.currentContainer ? this.currentContainer.x : 400;
    }
  }

  /**
   * Calculate Y position based on alignment
   */
  _calculateY(element, alignY, containerHeight) {
    const elementHeight = element.height || 40;
    
    switch (alignY) {
      case 'top':
        return this.currentContainer ? this.currentContainer.y - containerHeight/2 + tokens.spacing.lg : 0;
      case 'bottom':
        return this.currentContainer ? this.currentContainer.y + containerHeight/2 - elementHeight - tokens.spacing.lg : 0;
      case 'center':
      default:
        return this.currentContainer ? this.currentContainer.y : 300;
    }
  }

  /**
   * Get the current element stack
   */
  getElementStack() {
    return this.elementStack;
  }

  /**
   * Clear the element stack
   */
  clearStack() {
    this.elementStack = [];
  }
}

