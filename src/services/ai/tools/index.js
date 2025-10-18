/**
 * Tools Index - Export all canvas tools for the ReAct agent
 * 
 * This module provides a centralized way to import all available tools
 * for the LangChain ReAct agent framework.
 */

import { createPrimitiveTools } from './primitives.js';
import { createQueryTools } from './queries.js';
import { createLayoutTools } from './layout.js';
import { createCompositeTools } from './composite.js';

/**
 * Create all available tools for the ReAct agent
 * @param {CanvasAPI} canvasAPI - The canvas API instance
 * @returns {Array} Array of LangChain DynamicTool instances
 */
export function createAllTools(canvasAPI) {
  return [
    ...createPrimitiveTools(canvasAPI),
    ...createQueryTools(canvasAPI),
    ...createLayoutTools(canvasAPI),
    ...createCompositeTools(canvasAPI)
  ];
}

/**
 * Get tool categories for debugging and documentation
 */
export const TOOL_CATEGORIES = {
  PRIMITIVES: [
    'createShape',
    'moveShape', 
    'resizeShape',
    'rotateShape',
    'changeColor',
    'changeText',
    'deleteShape'
  ],
  QUERIES: [
    'listShapes',
    'getCanvasState',
    'identifyShape',
    'findShapesByProperty'
  ],
  LAYOUT: [
    'arrangeShapes',
    'createMultipleShapes',
    'distributeEvenly',
    'alignShapes',
    'arrangeInRow',
    'createGridLayout',
    'arrangeInCircle',
    'getCenterPosition'
  ],
  COMPOSITE: [
    'createLoginForm',
    'createNavigationBar',
    'createCardLayout'
  ]
};

/**
 * Get total number of available tools
 */
export function getToolCount() {
  return Object.values(TOOL_CATEGORIES).flat().length;
}
