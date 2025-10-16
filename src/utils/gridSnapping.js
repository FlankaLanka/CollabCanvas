/**
 * Grid Snapping Utilities
 * Provides functions to snap coordinates to grid points based on current zoom level
 */

/**
 * Calculate the current grid spacing for a given zoom level
 * Uses the same algorithm as Grid.jsx to ensure consistency
 */
export function getGridSpacing(stageScale) {
  const targetScreenSpacing = 40; // Same as Grid.jsx
  const canvasSpacing = targetScreenSpacing / stageScale;
  
  // Find the best power of 10 or common subdivision
  const magnitude = Math.pow(10, Math.floor(Math.log10(canvasSpacing)));
  const normalized = canvasSpacing / magnitude;
  
  let spacing;
  if (normalized <= 1.2) spacing = magnitude;
  else if (normalized <= 2.5) spacing = 2 * magnitude;
  else if (normalized <= 6) spacing = 5 * magnitude;
  else spacing = 10 * magnitude;
  
  return spacing;
}

/**
 * Snap a coordinate to the nearest grid point
 * @param {number} coord - The coordinate to snap
 * @param {number} gridSpacing - The current grid spacing
 * @returns {number} - The snapped coordinate
 */
export function snapToGrid(coord, gridSpacing) {
  return Math.round(coord / gridSpacing) * gridSpacing;
}

/**
 * Snap a point (x, y) to the nearest grid intersection
 * @param {Object} point - Point with x, y coordinates
 * @param {number} stageScale - Current stage scale
 * @returns {Object} - Snapped point with x, y coordinates
 */
export function snapPointToGrid(point, stageScale) {
  const gridSpacing = getGridSpacing(stageScale);
  
  return {
    x: snapToGrid(point.x, gridSpacing),
    y: snapToGrid(point.y, gridSpacing)
  };
}

/**
 * Check if grid snapping is enabled and should be applied
 * @param {boolean} snapToGrid - Whether snapping is enabled
 * @param {Object} event - Mouse/touch event (optional, for future modifier key support)
 * @returns {boolean} - Whether to apply snapping
 */
export function shouldSnapToGrid(snapToGrid, event = null) {
  // Future: Could add modifier key support (e.g., hold Shift to temporarily disable)
  // For now, just return the snap setting
  return snapToGrid;
}
