/**
 * Primitive Canvas Tools - Basic shape operations
 * 
 * These tools wrap the core CanvasAPI functions as LangChain DynamicTools
 * for use in the ReAct agent framework.
 */

import { DynamicTool } from "langchain/tools";

/**
 * Create a shape on the canvas
 */
export function createShapeTool(canvasAPI) {
  return new DynamicTool({
    name: "createShape",
    description: `Create a shape on the canvas. Returns the created shape ID and position.
    
    Parameters:
    - shapeType: "rectangle" | "circle" | "triangle" | "text" | "text_input" | "line" | "bezier"
    - x: number (center viewport is 400)
    - y: number (center viewport is 300)
    - width: number (optional, for rectangles/triangles)
    - height: number (optional, for rectangles/triangles)
    - radiusX: number (optional, for circles)
    - radiusY: number (optional, for circles)
    - fill: string (color name or hex)
    - text: string (for text shapes)
    - fontSize: number (for text shapes)
    
    Example input: shapeType=rectangle, x=0, y=0, width=200, height=100, fill=blue`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const result = await canvasAPI.createShape(params);
        return `Created ${result.type} (id=${result.id}) at (${result.x}, ${result.y}) with color ${result.fill}`;
      } catch (error) {
        return `Error creating shape: ${error.message}`;
      }
    }
  });
}

/**
 * Move a shape to a new position
 */
export function moveShapeTool(canvasAPI) {
  return new DynamicTool({
    name: "moveShape",
    description: `Move a shape to a new position. Use natural language description to identify the shape.
    
    Parameters:
    - shapeId: string (natural language description like "blue rectangle", "red circle", "large triangle")
    - x: number (new X position)
    - y: number (new Y position)
    
    Example input: shapeId=blue rectangle, x=500, y=400`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const result = await canvasAPI.moveShape(params.shapeId, params.x, params.y);
        return `Moved ${result.description} to position (${result.x}, ${result.y})`;
      } catch (error) {
        return `Error moving shape: ${error.message}`;
      }
    }
  });
}

/**
 * Resize a shape
 */
export function resizeShapeTool(canvasAPI) {
  return new DynamicTool({
    name: "resizeShape",
    description: `Resize a shape by scale factor or new dimensions.
    
    Parameters:
    - shapeId: string (natural language description)
    - scale: number (optional, scale factor like 2.0 for "twice as big")
    - width: number (optional, new width in pixels)
    - height: number (optional, new height in pixels)
    
    Example input: shapeId=blue rectangle, scale=2.0`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const result = await canvasAPI.resizeShape(params.shapeId, params);
        return `Resized ${result.description} to ${result.width}x${result.height}`;
      } catch (error) {
        return `Error resizing shape: ${error.message}`;
      }
    }
  });
}

/**
 * Rotate a shape
 */
export function rotateShapeTool(canvasAPI) {
  return new DynamicTool({
    name: "rotateShape",
    description: `Rotate a shape by degrees.
    
    Parameters:
    - shapeId: string (natural language description)
    - degrees: number (rotation in degrees, positive for clockwise)
    
    Example input: shapeId=blue rectangle, degrees=45`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const result = await canvasAPI.rotateShape(params.shapeId, params.degrees);
        return `Rotated ${result.description} to ${result.rotation}°`;
      } catch (error) {
        return `Error rotating shape: ${error.message}`;
      }
    }
  });
}

/**
 * Change the color of a shape
 */
export function changeColorTool(canvasAPI) {
  return new DynamicTool({
    name: "changeColor",
    description: `Change the color of a shape.
    
    Parameters:
    - shapeId: string (natural language description)
    - color: string (color name or hex code)
    
    Example input: shapeId=blue rectangle, color=red`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const result = await canvasAPI.changeShapeColor(params.shapeId, params.color);
        return `Changed ${result.description} color to ${result.fill}`;
      } catch (error) {
        return `Error changing color: ${error.message}`;
      }
    }
  });
}

/**
 * Change the text content of a text shape
 */
export function changeTextTool(canvasAPI) {
  return new DynamicTool({
    name: "changeText",
    description: `Change the text content of a text or text_input shape.
    
    Parameters:
    - shapeId: string (natural language description)
    - newText: string (new text content)
    
    Example input: shapeId=text that says Hello, newText=Goodbye`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const result = await canvasAPI.changeShapeText(params.shapeId, params.newText);
        return `Changed text from "${result.oldText}" to "${result.text}"`;
      } catch (error) {
        return `Error changing text: ${error.message}`;
      }
    }
  });
}

/**
 * Delete a shape
 */
export function deleteShapeTool(canvasAPI) {
  return new DynamicTool({
    name: "deleteShape",
    description: `Delete a shape from the canvas.
    
    Parameters:
    - shapeId: string (natural language description)
    
    Example input: shapeId=blue rectangle`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const result = await canvasAPI.deleteShape(params.shapeId);
        return `Deleted ${result.description}`;
      } catch (error) {
        return `Error deleting shape: ${error.message}`;
      }
    }
  });
}

/**
 * Export all primitive tools
 */
export function createPrimitiveTools(canvasAPI) {
  return [
    createShapeTool(canvasAPI),
    moveShapeTool(canvasAPI),
    resizeShapeTool(canvasAPI),
    rotateShapeTool(canvasAPI),
    changeColorTool(canvasAPI),
    changeTextTool(canvasAPI),
    deleteShapeTool(canvasAPI)
  ];
}
