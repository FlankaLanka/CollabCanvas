/**
 * Query Tools - Canvas introspection and shape identification
 * 
 * These tools help the agent understand the current state of the canvas
 * and locate specific shapes for manipulation.
 */

import { DynamicTool } from "langchain/tools";

/**
 * List all shapes on the canvas with descriptions
 */
export function listShapesTool(canvasAPI) {
  return new DynamicTool({
    name: "listShapes",
    description: `Get a list of all shapes currently on the canvas with their descriptions and positions.
    
    No parameters required.
    
    Example input: (no parameters required)`,
    
    func: async (input) => {
      try {
        const shapes = canvasAPI.listShapes();
        if (shapes.length === 0) {
          return "The canvas is empty - no shapes are present.";
        }
        
        const shapeList = shapes.map(shape => 
          `• ${shape.description} at (${Math.round(shape.x)}, ${Math.round(shape.y)})`
        ).join('\n');
        
        return `Canvas contains ${shapes.length} shape${shapes.length > 1 ? 's' : ''}:\n${shapeList}`;
      } catch (error) {
        return `Error listing shapes: ${error.message}`;
      }
    }
  });
}

/**
 * Get current canvas state
 */
export function getCanvasStateTool(canvasAPI) {
  return new DynamicTool({
    name: "getCanvasState",
    description: `Get the current state of the canvas including shapes, viewport, and bounds.
    
    No parameters required.
    
    Example input: (no parameters required)`,
    
    func: async (input) => {
      try {
        const state = canvasAPI.getCanvasState();
        return JSON.stringify({
          totalShapes: state.totalShapes,
          viewportCenter: { x: 0, y: 0 },
          canvasSize: { width: 5000, height: 5000 },
          shapes: state.shapes.slice(0, 10).map(shape => ({
            id: shape.id,
            type: shape.type,
            position: { x: shape.x, y: shape.y },
            description: canvasAPI.getShapeDescription(shape)
          }))
        });
      } catch (error) {
        return `Error getting canvas state: ${error.message}`;
      }
    }
  });
}

/**
 * Identify a shape by natural language description
 */
export function identifyShapeTool(canvasAPI) {
  return new DynamicTool({
    name: "identifyShape",
    description: `Find a specific shape by its natural language description.
    
    Parameters:
    - shapeId: string (natural language description like "blue rectangle", "red circle", "large triangle")
    
    Example input: shapeId=blue rectangle`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const result = canvasAPI.identifyShape(params.shapeId);
        
        if (result.error) {
          return `Shape not found: ${result.error}. Available shapes: ${result.availableShapes?.map(s => s.description).join(', ') || 'none'}`;
        }
        
        return `Found ${result.shape.description} (id=${result.shape.id}) at ${result.shape.position}`;
      } catch (error) {
        return `Error identifying shape: ${error.message}`;
      }
    }
  });
}

/**
 * Find shapes by specific properties
 */
export function findShapesByPropertyTool(canvasAPI) {
  return new DynamicTool({
    name: "findShapesByProperty",
    description: `Find shapes that match specific properties like color, type, or size.
    
    Parameters:
    - property: string ("color", "type", "size")
    - value: string (the value to match)
    
    Example input: property=color, value=blue`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const shapes = canvasAPI.getCurrentShapes();
        
        let matches = [];
        switch (params.property) {
          case "color":
            matches = shapes.filter(shape => 
              shape.fill && shape.fill.toLowerCase().includes(params.value.toLowerCase())
            );
            break;
          case "type":
            matches = shapes.filter(shape => 
              shape.type && shape.type.toLowerCase().includes(params.value.toLowerCase())
            );
            break;
          case "size":
            // For size, we'll look for "large", "small", etc.
            const sizeKeywords = params.value.toLowerCase();
            matches = shapes.filter(shape => {
              const width = shape.width || (shape.radiusX ? shape.radiusX * 2 : 0);
              const height = shape.height || (shape.radiusY ? shape.radiusY * 2 : 0);
              const size = Math.max(width, height);
              
              if (sizeKeywords.includes("large") && size > 200) return true;
              if (sizeKeywords.includes("small") && size < 100) return true;
              if (sizeKeywords.includes("medium") && size >= 100 && size <= 200) return true;
              return false;
            });
            break;
        }
        
        if (matches.length === 0) {
          return `No shapes found with ${params.property}="${params.value}"`;
        }
        
        const matchList = matches.map(shape => 
          `• ${canvasAPI.getShapeDescription(shape)} at (${Math.round(shape.x)}, ${Math.round(shape.y)})`
        ).join('\n');
        
        return `Found ${matches.length} shape${matches.length > 1 ? 's' : ''} with ${params.property}="${params.value}":\n${matchList}`;
      } catch (error) {
        return `Error finding shapes: ${error.message}`;
      }
    }
  });
}

/**
 * Export all query tools
 */
export function createQueryTools(canvasAPI) {
  return [
    listShapesTool(canvasAPI),
    getCanvasStateTool(canvasAPI),
    identifyShapeTool(canvasAPI),
    findShapesByPropertyTool(canvasAPI)
  ];
}
