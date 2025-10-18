/**
 * Layout Tools - Spatial organization and arrangement
 * 
 * These tools help arrange multiple shapes in patterns and layouts.
 */

import { DynamicTool } from "langchain/tools";

/**
 * Arrange multiple shapes in a pattern
 */
export function arrangeShapesTool(canvasAPI) {
  return new DynamicTool({
    name: "arrangeShapes",
    description: `Arrange multiple shapes in a specific pattern.
    
    Parameters:
    - shapeIds: array of strings (natural language descriptions or "these" for recently created)
    - arrangement: string ("row", "column", "grid", "circle")
    - spacing: number (optional, distance between shapes)
    - centerX: number (optional, center X position)
    - centerY: number (optional, center Y position)
    
    Example input: shapeIds=blue rectangle,red circle, arrangement=row, spacing=100`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const result = await canvasAPI.arrangeShapes(params);
        return `Arranged ${result.length} shapes in ${params.arrangement} pattern`;
      } catch (error) {
        return `Error arranging shapes: ${error.message}`;
      }
    }
  });
}

/**
 * Create multiple shapes with smart spacing
 */
export function createMultipleShapesTool(canvasAPI) {
  return new DynamicTool({
    name: "createMultipleShapes",
    description: `Create multiple shapes of the same type with smart spacing.
    
    Parameters:
    - shapeType: string (type of shape to create)
    - count: number (how many shapes to create)
    - arrangement: string ("row", "column", "grid", "circle")
    - fill: string (color for all shapes)
    - width: number (optional, width for each shape)
    - height: number (optional, height for each shape)
    - startX: number (optional, starting X position)
    - startY: number (optional, starting Y position)
    - spacing: number (optional, space between shapes)
    
    Example input: shapeType=circle, count=5, arrangement=row, fill=blue, radiusX=30`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const result = await canvasAPI.createMultipleShapes(params);
        return `Created ${result.shapes.length} ${result.shapeType}s in ${result.arrangement} arrangement`;
      } catch (error) {
        return `Error creating multiple shapes: ${error.message}`;
      }
    }
  });
}

/**
 * Distribute shapes evenly in space
 */
export function distributeEvenlyTool(canvasAPI) {
  return new DynamicTool({
    name: "distributeEvenly",
    description: `Distribute shapes evenly in a line or area.
    
    Parameters:
    - shapeIds: array of strings (natural language descriptions)
    - direction: string ("horizontal", "vertical", "both")
    - spacing: number (optional, minimum space between shapes)
    
    Example input: shapeIds=blue rectangle,red circle,green triangle, direction=horizontal`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        
        // Get the shapes
        const shapes = [];
        for (const shapeId of params.shapeIds) {
          const shape = canvasAPI.findShapeByDescription(shapeId) || canvasAPI.findShape(shapeId);
          if (shape) shapes.push(shape);
        }
        
        if (shapes.length === 0) {
          return "No shapes found to distribute";
        }
        
        // Calculate distribution
        const spacing = params.spacing || 100;
        const centerX = 0; // Origin
        const centerY = 0;
        
        let positions = [];
        if (params.direction === "horizontal") {
          const totalWidth = (shapes.length - 1) * spacing;
          const startX = centerX - totalWidth / 2;
          positions = shapes.map((shape, i) => ({
            id: shape.id,
            x: startX + i * spacing,
            y: centerY
          }));
        } else if (params.direction === "vertical") {
          const totalHeight = (shapes.length - 1) * spacing;
          const startY = centerY - totalHeight / 2;
          positions = shapes.map((shape, i) => ({
            id: shape.id,
            x: centerX,
            y: startY + i * spacing
          }));
        }
        
        // Move shapes to new positions
        for (const pos of positions) {
          await canvasAPI.moveShape(pos.id, pos.x, pos.y);
        }
        
        return `Distributed ${shapes.length} shapes evenly in ${params.direction} direction`;
      } catch (error) {
        return `Error distributing shapes: ${error.message}`;
      }
    }
  });
}

/**
 * Align shapes to a common edge or center
 */
export function alignShapesTool(canvasAPI) {
  return new DynamicTool({
    name: "alignShapes",
    description: `Align shapes to a common edge or center point.
    
    Parameters:
    - shapeIds: array of strings (natural language descriptions)
    - alignment: string ("left", "center", "right", "top", "middle", "bottom")
    
    Example input: shapeIds=blue rectangle,red circle, alignment=center`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        
        // Get the shapes
        const shapes = [];
        for (const shapeId of params.shapeIds) {
          const shape = canvasAPI.findShapeByDescription(shapeId) || canvasAPI.findShape(shapeId);
          if (shape) shapes.push(shape);
        }
        
        if (shapes.length === 0) {
          return "No shapes found to align";
        }
        
        // Calculate alignment
        let targetX, targetY;
        
        if (params.alignment === "left") {
          targetX = Math.min(...shapes.map(s => s.x));
          for (const shape of shapes) {
            await canvasAPI.moveShape(shape.id, targetX, shape.y);
          }
        } else if (params.alignment === "right") {
          targetX = Math.max(...shapes.map(s => s.x + (s.width || 0)));
          for (const shape of shapes) {
            await canvasAPI.moveShape(shape.id, targetX - (shape.width || 0), shape.y);
          }
        } else if (params.alignment === "center") {
          targetX = 0;
          for (const shape of shapes) {
            await canvasAPI.moveShape(shape.id, targetX, shape.y);
          }
        } else if (params.alignment === "top") {
          targetY = Math.min(...shapes.map(s => s.y));
          for (const shape of shapes) {
            await canvasAPI.moveShape(shape.id, shape.x, targetY);
          }
        } else if (params.alignment === "bottom") {
          targetY = Math.max(...shapes.map(s => s.y + (s.height || 0)));
          for (const shape of shapes) {
            await canvasAPI.moveShape(shape.id, shape.x, targetY - (shape.height || 0));
          }
        } else if (params.alignment === "middle") {
          targetY = 0;
          for (const shape of shapes) {
            await canvasAPI.moveShape(shape.id, shape.x, targetY);
          }
        }
        
        return `Aligned ${shapes.length} shapes to ${params.alignment}`;
      } catch (error) {
        return `Error aligning shapes: ${error.message}`;
      }
    }
  });
}

/**
 * Arrange shapes in a horizontal row
 */
export function arrangeInRowTool(canvasAPI) {
  return new DynamicTool({
    name: "arrangeInRow",
    description: `Arrange shapes in a horizontal row with even spacing.
    
    Parameters:
    - shapeIds: array of strings (shape IDs or descriptions)
    - spacing: number (optional, distance between shapes, default 50)
    
    Example input: shapeIds=shape1,shape2,shape3, spacing=100`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const result = await canvasAPI.arrangeInRow(params.shapeIds, params.spacing);
        return `Arranged ${result.shapeCount} shapes in horizontal row with ${result.spacing}px spacing`;
      } catch (error) {
        return `Error arranging in row: ${error.message}`;
      }
    }
  });
}

/**
 * Create a grid layout of shapes
 */
export function createGridLayoutTool(canvasAPI) {
  return new DynamicTool({
    name: "createGridLayout",
    description: `Create a grid layout of shapes.
    
    Parameters:
    - rows: number (number of rows)
    - columns: number (number of columns)
    - spacing: number (optional, distance between shapes, default 50)
    - shapeType: string (type of shape to create, default "rectangle")
    - fill: string (optional, color for shapes)
    
    Example input: rows=3, columns=3, spacing=100, shapeType=circle, fill=blue`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const result = await canvasAPI.createGridLayout(
          params.rows, 
          params.columns, 
          params.spacing, 
          params.shapeType, 
          { fill: params.fill }
        );
        return `Created ${result.totalShapes} shapes in ${result.rows}x${result.columns} grid`;
      } catch (error) {
        return `Error creating grid layout: ${error.message}`;
      }
    }
  });
}

/**
 * Arrange shapes in a circular pattern
 */
export function arrangeInCircleTool(canvasAPI) {
  return new DynamicTool({
    name: "arrangeInCircle",
    description: `Arrange shapes in a circular pattern.
    
    Parameters:
    - shapeIds: array of strings (shape IDs or descriptions)
    - radius: number (optional, radius of circle, default 150)
    - centerX: number (optional, center X position, default 0)
    - centerY: number (optional, center Y position, default 0)
    
    Example input: shapeIds=shape1,shape2,shape3, radius=200, centerX=0, centerY=0`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const result = await canvasAPI.arrangeInCircle(
          params.shapeIds, 
          params.radius, 
          params.centerX, 
          params.centerY
        );
        return `Arranged ${result.shapeCount} shapes in circle with radius ${result.radius}`;
      } catch (error) {
        return `Error arranging in circle: ${error.message}`;
      }
    }
  });
}

/**
 * Get center position of canvas
 */
export function getCenterPositionTool(canvasAPI) {
  return new DynamicTool({
    name: "getCenterPosition",
    description: `Get the center position of the canvas.
    
    Parameters:
    - canvasWidth: number (optional, canvas width, default 800)
    - canvasHeight: number (optional, canvas height, default 600)
    
    Example input: canvasWidth=1000, canvasHeight=800`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const result = canvasAPI.getCenterPosition(params.canvasWidth, params.canvasHeight);
        return `Canvas center position: (${result.x}, ${result.y})`;
      } catch (error) {
        return `Error getting center position: ${error.message}`;
      }
    }
  });
}

/**
 * Export all layout tools
 */
export function createLayoutTools(canvasAPI) {
  return [
    arrangeShapesTool(canvasAPI),
    createMultipleShapesTool(canvasAPI),
    distributeEvenlyTool(canvasAPI),
    alignShapesTool(canvasAPI),
    arrangeInRowTool(canvasAPI),
    createGridLayoutTool(canvasAPI),
    arrangeInCircleTool(canvasAPI),
    getCenterPositionTool(canvasAPI)
  ];
}
