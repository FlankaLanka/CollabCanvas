/**
 * Geometry utility functions for spatial analysis
 */

/**
 * Calculate distance between two shapes
 */
export function calculateDistance(shape1, shape2) {
  const center1 = {
    x: shape1.x + (shape1.width || 0) / 2,
    y: shape1.y + (shape1.height || 0) / 2
  };
  const center2 = {
    x: shape2.x + (shape2.width || 0) / 2,
    y: shape2.y + (shape2.height || 0) / 2
  };
  
  return Math.sqrt(
    Math.pow(center1.x - center2.x, 2) + Math.pow(center1.y - center2.y, 2)
  );
}

/**
 * Check if two shapes overlap
 */
export function shapesOverlap(shape1, shape2) {
  return !(shape1.x + (shape1.width || 0) <= shape2.x ||
           shape2.x + (shape2.width || 0) <= shape1.x ||
           shape1.y + (shape1.height || 0) <= shape2.y ||
           shape2.y + (shape2.height || 0) <= shape1.y);
}

/**
 * Check if position is available (no overlaps)
 */
export function isPositionAvailable(shapes, x, y, width, height) {
  return !shapes.some(shape => {
    return !(x + width <= shape.x ||
             x >= shape.x + (shape.width || 0) ||
             y + height <= shape.y ||
             y >= shape.y + (shape.height || 0));
  });
}

/**
 * Group values by proximity
 */
export function groupByProximity(values, threshold) {
  const groups = [];
  const used = new Set();
  
  for (let i = 0; i < values.length; i++) {
    if (used.has(i)) continue;
    
    const group = [values[i]];
    used.add(i);
    
    for (let j = i + 1; j < values.length; j++) {
      if (used.has(j)) continue;
      if (Math.abs(values[i] - values[j]) <= threshold) {
        group.push(values[j]);
        used.add(j);
      }
    }
    
    groups.push(group);
  }
  
  return groups;
}

/**
 * Calculate average spacing between shapes (optimized)
 */
export function calculateAverageSpacing(shapes) {
  if (shapes.length < 2) return 0;
  
  // Use spatial indexing for better performance with many shapes
  if (shapes.length > 20) {
    return calculateAverageSpacingOptimized(shapes);
  }
  
  let totalDistance = 0;
  let pairCount = 0;
  
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      totalDistance += calculateDistance(shapes[i], shapes[j]);
      pairCount++;
    }
  }
  
  return pairCount > 0 ? totalDistance / pairCount : 0;
}

/**
 * Optimized spacing calculation for large numbers of shapes
 */
function calculateAverageSpacingOptimized(shapes) {
  // Group shapes by spatial regions to reduce comparisons
  const regions = new Map();
  const regionSize = 200; // Group shapes within 200px regions
  
  shapes.forEach(shape => {
    const regionKey = `${Math.floor(shape.x / regionSize)},${Math.floor(shape.y / regionSize)}`;
    if (!regions.has(regionKey)) {
      regions.set(regionKey, []);
    }
    regions.get(regionKey).push(shape);
  });
  
  let totalDistance = 0;
  let pairCount = 0;
  
  // Only compare shapes within the same region and adjacent regions
  for (const [key, regionShapes] of regions) {
    const [x, y] = key.split(',').map(Number);
    
    // Compare within region
    for (let i = 0; i < regionShapes.length; i++) {
      for (let j = i + 1; j < regionShapes.length; j++) {
        totalDistance += calculateDistance(regionShapes[i], regionShapes[j]);
        pairCount++;
      }
    }
    
    // Compare with adjacent regions
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        
        const adjacentKey = `${x + dx},${y + dy}`;
        const adjacentShapes = regions.get(adjacentKey);
        if (adjacentShapes) {
          for (const shape1 of regionShapes) {
            for (const shape2 of adjacentShapes) {
              totalDistance += calculateDistance(shape1, shape2);
              pairCount++;
            }
          }
        }
      }
    }
  }
  
  return pairCount > 0 ? totalDistance / pairCount : 0;
}

/**
 * Find shapes that are too close together (optimized)
 */
export function findSpacingIssues(shapes, minSpacing = 20) {
  const issues = [];
  
  // Use spatial indexing for better performance with many shapes
  if (shapes.length > 15) {
    return findSpacingIssuesOptimized(shapes, minSpacing);
  }
  
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const distance = calculateDistance(shapes[i], shapes[j]);
      if (distance < minSpacing) {
        issues.push({
          shapes: [shapes[i].id, shapes[j].id],
          distance: Math.round(distance),
          recommended: minSpacing
        });
      }
    }
  }
  
  return issues;
}

/**
 * Optimized spacing issues detection for large numbers of shapes
 */
function findSpacingIssuesOptimized(shapes, minSpacing) {
  const issues = [];
  const regions = new Map();
  const regionSize = Math.max(minSpacing * 2, 100);
  
  // Group shapes by spatial regions
  shapes.forEach((shape, index) => {
    const regionKey = `${Math.floor(shape.x / regionSize)},${Math.floor(shape.y / regionSize)}`;
    if (!regions.has(regionKey)) {
      regions.set(regionKey, []);
    }
    regions.get(regionKey).push({ ...shape, originalIndex: index });
  });
  
  // Check for issues within regions and adjacent regions
  for (const [key, regionShapes] of regions) {
    const [x, y] = key.split(',').map(Number);
    
    // Check within region
    for (let i = 0; i < regionShapes.length; i++) {
      for (let j = i + 1; j < regionShapes.length; j++) {
        const distance = calculateDistance(regionShapes[i], regionShapes[j]);
        if (distance < minSpacing) {
          issues.push({
            shapes: [regionShapes[i].id, regionShapes[j].id],
            distance: Math.round(distance),
            recommended: minSpacing
          });
        }
      }
    }
    
    // Check with adjacent regions
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        
        const adjacentKey = `${x + dx},${y + dy}`;
        const adjacentShapes = regions.get(adjacentKey);
        if (adjacentShapes) {
          for (const shape1 of regionShapes) {
            for (const shape2 of adjacentShapes) {
              const distance = calculateDistance(shape1, shape2);
              if (distance < minSpacing) {
                issues.push({
                  shapes: [shape1.id, shape2.id],
                  distance: Math.round(distance),
                  recommended: minSpacing
                });
              }
            }
          }
        }
      }
    }
  }
  
  return issues;
}

/**
 * Find overlapping shapes
 */
export function findOverlaps(shapes) {
  const overlaps = [];
  
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      if (shapesOverlap(shapes[i], shapes[j])) {
        overlaps.push({
          shape1: { id: shapes[i].id, type: shapes[i].type },
          shape2: { id: shapes[j].id, type: shapes[j].type }
        });
      }
    }
  }
  
  return overlaps;
}

/**
 * Apply grid snapping to coordinates
 */
export function applyGridSnapping(x, y, gridSize = 8) {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize
  };
}

/**
 * Calculate center point of multiple shapes
 */
export function calculateCenterOfMass(shapes) {
  if (shapes.length === 0) return { x: 0, y: 0 };
  
  return {
    x: shapes.reduce((sum, s) => sum + s.x, 0) / shapes.length,
    y: shapes.reduce((sum, s) => sum + s.y, 0) / shapes.length
  };
}

/**
 * Get spatial bounds of shapes
 */
export function getSpatialBounds(shapes) {
  if (shapes.length === 0) {
    return { left: 0, right: 0, top: 0, bottom: 0 };
  }
  
  return {
    left: Math.min(...shapes.map(s => s.x)),
    right: Math.max(...shapes.map(s => s.x + (s.width || 0))),
    top: Math.min(...shapes.map(s => s.y)),
    bottom: Math.max(...shapes.map(s => s.y + (s.height || 0)))
  };
}
