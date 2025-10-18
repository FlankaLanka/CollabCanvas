/**
 * Spatial Planning Module
 * 
 * Provides spatial reasoning and layout calculation for multi-object creation.
 * Calculates positions, dimensions, and spacing for various arrangements.
 */

export class SpatialPlanner {
  constructor() {
    this.defaultSpacing = 20;
    this.minSpacing = 8;
  }

  /**
   * Plan a row arrangement
   * @param {number} count - Number of shapes
   * @param {number} shapeWidth - Width of each shape
   * @param {number} shapeHeight - Height of each shape
   * @param {number} startX - Starting X position
   * @param {number} startY - Y position for the row
   * @param {number} spacing - Space between shapes
   * @param {boolean} centerInViewport - Whether to center the group
   * @param {number} viewportCenterX - Viewport center X (if centering)
   * @returns {Object} - { positions: [{x, y}], totalWidth, totalHeight, spacing }
   */
  planRow(count, shapeWidth, shapeHeight, startX, startY, spacing, centerInViewport = false, viewportCenterX = 0) {
    if (count <= 0) {
      return { positions: [], totalWidth: 0, totalHeight: shapeHeight, spacing: 0 };
    }

    // Calculate total width: (shapeWidth * count) + (spacing * (count - 1))
    const totalWidth = (shapeWidth * count) + (spacing * (count - 1));
    
    // If centering, adjust startX to center the group
    let adjustedStartX = startX;
    if (centerInViewport) {
      adjustedStartX = viewportCenterX - (totalWidth / 2);
    }

    // Generate positions for each shape
    const positions = [];
    for (let i = 0; i < count; i++) {
      const x = adjustedStartX + (i * (shapeWidth + spacing));
      positions.push({ x, y: startY });
    }

    return {
      positions,
      totalWidth,
      totalHeight: shapeHeight,
      spacing,
      centerX: adjustedStartX + (totalWidth / 2)
    };
  }

  /**
   * Plan a grid arrangement
   * @param {number} rows - Number of rows
   * @param {number} cols - Number of columns
   * @param {number} shapeWidth - Width of each shape
   * @param {number} shapeHeight - Height of each shape
   * @param {number} startX - Starting X position
   * @param {number} startY - Starting Y position
   * @param {number} spacingX - Horizontal spacing
   * @param {number} spacingY - Vertical spacing
   * @param {boolean} centerInViewport - Whether to center the group
   * @param {number} viewportCenterX - Viewport center X (if centering)
   * @param {number} viewportCenterY - Viewport center Y (if centering)
   * @returns {Object} - { positions: [{x, y}], totalWidth, totalHeight, rows, cols }
   */
  planGrid(rows, cols, shapeWidth, shapeHeight, startX, startY, spacingX, spacingY, centerInViewport = false, viewportCenterX = 0, viewportCenterY = 0, count = null) {
    if (rows <= 0 || cols <= 0) {
      return { positions: [], totalWidth: 0, totalHeight: 0, rows: 0, cols: 0 };
    }

    // Calculate total dimensions
    const totalWidth = (shapeWidth * cols) + (spacingX * (cols - 1));
    const totalHeight = (shapeHeight * rows) + (spacingY * (rows - 1));
    
    // If centering, adjust start position to center the group
    let adjustedStartX = startX;
    let adjustedStartY = startY;
    if (centerInViewport) {
      adjustedStartX = viewportCenterX - (totalWidth / 2);
      adjustedStartY = viewportCenterY - (totalHeight / 2);
    }

    // Generate positions for each cell
    const positions = [];
    let shapeCount = 0;
    const maxShapes = count || (rows * cols);
    
    for (let row = 0; row < rows && shapeCount < maxShapes; row++) {
      for (let col = 0; col < cols && shapeCount < maxShapes; col++) {
        const x = adjustedStartX + (col * (shapeWidth + spacingX));
        const y = adjustedStartY + (row * (shapeHeight + spacingY));
        positions.push({ x, y });
        shapeCount++;
      }
    }

    return {
      positions,
      totalWidth,
      totalHeight,
      rows,
      cols,
      centerX: adjustedStartX + (totalWidth / 2),
      centerY: adjustedStartY + (totalHeight / 2)
    };
  }

  /**
   * Plan even distribution in a container
   * @param {number} count - Number of shapes
   * @param {number} shapeWidth - Width of each shape
   * @param {number} containerWidth - Width of the container
   * @param {number} startY - Y position for all shapes
   * @param {string} direction - 'horizontal' or 'vertical'
   * @returns {Object} - { positions: [{x, y}], actualSpacing }
   */
  planEvenDistribution(count, shapeWidth, containerWidth, startY, direction = 'horizontal') {
    if (count <= 0) {
      return { positions: [], actualSpacing: 0 };
    }

    if (count === 1) {
      return { 
        positions: [{ x: containerWidth / 2, y: startY }], 
        actualSpacing: 0 
      };
    }

    // Calculate spacing to evenly distribute shapes
    // spacing = (containerWidth - (shapeWidth * count)) / (count + 1)
    const totalShapeWidth = shapeWidth * count;
    const availableSpace = containerWidth - totalShapeWidth;
    const actualSpacing = availableSpace / (count + 1);

    // Generate positions
    const positions = [];
    for (let i = 0; i < count; i++) {
      const x = actualSpacing + (i * (shapeWidth + actualSpacing));
      positions.push({ x, y: startY });
    }

    return {
      positions,
      actualSpacing,
      totalWidth: containerWidth
    };
  }

  /**
   * Add margin around a group of positions
   * @param {Array} positions - Array of {x, y} positions
   * @param {number} marginSize - Margin size in pixels
   * @returns {Array} - New positions with margin applied
   */
  addMargin(positions, marginSize) {
    if (positions.length === 0) return positions;

    // Find bounding box
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));

    // Calculate shift to add margin
    const shiftX = -minX + marginSize;
    const shiftY = -minY + marginSize;

    // Apply shift to all positions
    return positions.map(pos => ({
      x: pos.x + shiftX,
      y: pos.y + shiftY
    }));
  }

  /**
   * Center a group of shapes in viewport
   * @param {Array} positions - Array of {x, y} positions
   * @param {number} shapeWidth - Width of shapes
   * @param {number} shapeHeight - Height of shapes
   * @param {number} viewportCenterX - Viewport center X
   * @param {number} viewportCenterY - Viewport center Y
   * @returns {Array} - New centered positions
   */
  centerGroup(positions, shapeWidth, shapeHeight, viewportCenterX, viewportCenterY) {
    if (positions.length === 0) return positions;

    // Calculate bounding box of the group
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));

    // Calculate group center
    const groupCenterX = (minX + maxX) / 2;
    const groupCenterY = (minY + maxY) / 2;

    // Calculate shift to center the group
    const shiftX = viewportCenterX - groupCenterX;
    const shiftY = viewportCenterY - groupCenterY;

    // Apply shift to all positions
    return positions.map(pos => ({
      x: pos.x + shiftX,
      y: pos.y + shiftY
    }));
  }

  /**
   * Plan layout based on arrangement type
   * @param {Object} options - Layout options
   * @returns {Object} - Planned layout
   */
  planLayout({
    arrangement,
    count,
    gridRows,
    gridCols,
    shapeWidth,
    shapeHeight,
    startX,
    startY,
    spacing,
    centerInViewport = false,
    marginSize = 0,
    containerWidth,
    viewportCenterX = 0,
    viewportCenterY = 0
  }) {
    let plan;

    switch (arrangement) {
      case 'row':
        plan = this.planRow(
          count, shapeWidth, shapeHeight, startX, startY, spacing,
          centerInViewport, viewportCenterX
        );
        break;

      case 'column':
        // For column, we swap width/height and x/y
        const columnPlan = this.planRow(
          count, shapeHeight, shapeWidth, startY, startX, spacing,
          centerInViewport, viewportCenterY
        );
        // Swap x and y back
        plan = {
          positions: columnPlan.positions.map(p => ({ x: p.y, y: p.x })),
          totalWidth: columnPlan.totalHeight,
          totalHeight: columnPlan.totalWidth,
          spacing: columnPlan.spacing,
          centerX: columnPlan.centerY,
          centerY: columnPlan.centerX
        };
        break;

      case 'grid':
        plan = this.planGrid(
          gridRows, gridCols, shapeWidth, shapeHeight, startX, startY, spacing, spacing,
          centerInViewport, viewportCenterX, viewportCenterY, count
        );
        break;

      case 'even':
        plan = this.planEvenDistribution(
          count, shapeWidth, containerWidth, startY
        );
        break;

      default:
        throw new Error(`Unknown arrangement: ${arrangement}`);
    }

    // Apply margin if specified
    if (marginSize > 0) {
      plan.positions = this.addMargin(plan.positions, marginSize);
    }

    return plan;
  }

  /**
   * Calculate smart spacing based on shape size
   * @param {number} shapeSize - Size of the shape (width or height)
   * @returns {number} - Recommended spacing
   */
  calculateSmartSpacing(shapeSize) {
    // Context-aware spacing based on shape size
    let bufferPercentage;
    
    if (shapeSize < 80) {
      // Small shapes: 40% buffer for tighter spacing
      bufferPercentage = 0.4;
    } else if (shapeSize <= 150) {
      // Medium shapes: 30% buffer
      bufferPercentage = 0.3;
    } else {
      // Large shapes: 20% buffer for wider spacing
      bufferPercentage = 0.2;
    }
    
    const buffer = shapeSize * bufferPercentage;
    const spacing = shapeSize + buffer;
    
    // Ensure minimum spacing
    return Math.max(spacing, this.minSpacing);
  }
}
