/**
 * Validation Tools - Post-creation verification and quality checks
 */

import { DynamicTool } from "langchain/tools";

/**
 * Validate that a group of shapes matches the expected layout
 */
export function validateLayoutTool(canvasAPI) {
  return new DynamicTool({
    name: "validateLayout",
    description: `Validate that a group of shapes matches the expected layout.
    
    Parameters:
    - expectedCount: number
    - expectedArrangement: string (row/grid/column)
    - expectedSpacing: number (optional)
    - tolerance: number (optional, pixels of acceptable deviation, default 5)
    
    Returns validation report with:
    - actualCount vs expectedCount
    - spacing consistency (all gaps within tolerance)
    - alignment verification (all in row/grid)
    - any deviations found`,
    
    func: async (input) => {
      try {
        const params = JSON.parse(input);
        const state = canvasAPI.getCanvasState();
        const shapes = state.shapes;
        
        const tolerance = params.tolerance || 5;
        
        // Check count
        if (shapes.length !== params.expectedCount) {
          return `❌ Count mismatch: expected ${params.expectedCount}, got ${shapes.length}`;
        }
        
        if (shapes.length === 0) {
          return "❌ No shapes found to validate";
        }
        
        let validationResults = [];
        
        // Check arrangement
        if (params.expectedArrangement === 'row') {
          const rowValidation = validateRowLayout(shapes, params.expectedSpacing, tolerance);
          validationResults.push(rowValidation);
        } else if (params.expectedArrangement === 'column') {
          const columnValidation = validateColumnLayout(shapes, params.expectedSpacing, tolerance);
          validationResults.push(columnValidation);
        } else if (params.expectedArrangement === 'grid') {
          const gridValidation = validateGridLayout(shapes, tolerance);
          validationResults.push(gridValidation);
        }
        
        // Compile results
        const hasErrors = validationResults.some(result => result.hasErrors);
        const summary = validationResults.map(r => r.summary).join('; ');
        
        if (hasErrors) {
          return `❌ Layout validation failed: ${summary}`;
        } else {
          return `✅ Layout validation passed: ${summary}`;
        }
        
      } catch (error) {
        return `Error validating layout: ${error.message}`;
      }
    }
  });
}

/**
 * Validate row layout
 */
function validateRowLayout(shapes, expectedSpacing, tolerance) {
  if (shapes.length < 2) {
    return { hasErrors: false, summary: "Single shape, no spacing to validate" };
  }
  
  // Sort shapes by x position
  const sortedShapes = shapes.sort((a, b) => a.x - b.x);
  const errors = [];
  
  // Check spacing consistency
  for (let i = 1; i < sortedShapes.length; i++) {
    const prevShape = sortedShapes[i - 1];
    const currentShape = sortedShapes[i];
    
    const actualSpacing = currentShape.x - (prevShape.x + (prevShape.width || 100));
    const expectedSpacing = expectedSpacing || 50; // Default spacing
    
    if (Math.abs(actualSpacing - expectedSpacing) > tolerance) {
      errors.push(`Gap between shapes ${i-1} and ${i}: expected ~${expectedSpacing}px, got ${actualSpacing}px`);
    }
  }
  
  // Check y-alignment (all shapes should have similar y values)
  const yValues = shapes.map(s => s.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  
  if (maxY - minY > tolerance) {
    errors.push(`Shapes not aligned in row: y-values range from ${minY} to ${maxY}`);
  }
  
  return {
    hasErrors: errors.length > 0,
    summary: errors.length > 0 ? errors.join('; ') : `Row layout valid (${shapes.length} shapes)`,
    errors
  };
}

/**
 * Validate column layout
 */
function validateColumnLayout(shapes, expectedSpacing, tolerance) {
  if (shapes.length < 2) {
    return { hasErrors: false, summary: "Single shape, no spacing to validate" };
  }
  
  // Sort shapes by y position
  const sortedShapes = shapes.sort((a, b) => a.y - b.y);
  const errors = [];
  
  // Check spacing consistency
  for (let i = 1; i < sortedShapes.length; i++) {
    const prevShape = sortedShapes[i - 1];
    const currentShape = sortedShapes[i];
    
    const actualSpacing = currentShape.y - (prevShape.y + (prevShape.height || 100));
    const expectedSpacing = expectedSpacing || 50; // Default spacing
    
    if (Math.abs(actualSpacing - expectedSpacing) > tolerance) {
      errors.push(`Gap between shapes ${i-1} and ${i}: expected ~${expectedSpacing}px, got ${actualSpacing}px`);
    }
  }
  
  // Check x-alignment (all shapes should have similar x values)
  const xValues = shapes.map(s => s.x);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  
  if (maxX - minX > tolerance) {
    errors.push(`Shapes not aligned in column: x-values range from ${minX} to ${maxX}`);
  }
  
  return {
    hasErrors: errors.length > 0,
    summary: errors.length > 0 ? errors.join('; ') : `Column layout valid (${shapes.length} shapes)`,
    errors
  };
}

/**
 * Validate grid layout
 */
function validateGridLayout(shapes, tolerance) {
  if (shapes.length < 2) {
    return { hasErrors: false, summary: "Single shape, no grid to validate" };
  }
  
  const errors = [];
  
  // Try to detect grid dimensions
  const xValues = [...new Set(shapes.map(s => Math.round(s.x / 10) * 10))].sort((a, b) => a - b);
  const yValues = [...new Set(shapes.map(s => Math.round(s.y / 10) * 10))].sort((a, b) => a - b);
  
  const cols = xValues.length;
  const rows = yValues.length;
  
  // Check if shapes form a proper grid
  for (const shape of shapes) {
    const xIndex = xValues.findIndex(x => Math.abs(x - shape.x) <= tolerance);
    const yIndex = yValues.findIndex(y => Math.abs(y - shape.y) <= tolerance);
    
    if (xIndex === -1 || yIndex === -1) {
      errors.push(`Shape at (${shape.x}, ${shape.y}) not aligned to grid`);
    }
  }
  
  // Check for consistent spacing
  if (xValues.length > 1) {
    const xSpacing = xValues[1] - xValues[0];
    for (let i = 1; i < xValues.length; i++) {
      if (Math.abs((xValues[i] - xValues[i-1]) - xSpacing) > tolerance) {
        errors.push(`Inconsistent horizontal spacing in grid`);
        break;
      }
    }
  }
  
  if (yValues.length > 1) {
    const ySpacing = yValues[1] - yValues[0];
    for (let i = 1; i < yValues.length; i++) {
      if (Math.abs((yValues[i] - yValues[i-1]) - ySpacing) > tolerance) {
        errors.push(`Inconsistent vertical spacing in grid`);
        break;
      }
    }
  }
  
  return {
    hasErrors: errors.length > 0,
    summary: errors.length > 0 ? errors.join('; ') : `Grid layout valid (${rows}x${cols}, ${shapes.length} shapes)`,
    errors
  };
}

/**
 * Export all validation tools
 */
export function createValidationTools(canvasAPI) {
  return [
    validateLayoutTool(canvasAPI)
  ];
}
