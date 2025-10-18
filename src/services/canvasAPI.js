import { SHAPE_TYPES, DEFAULT_SHAPE_PROPS, COLOR_PALETTE } from '../utils/constants';
import { SpatialPlanner } from './ai/spatialPlanner';

/**
 * Canvas API Service - Bridges AI function calls to canvas operations
 * This provides a clean API layer for the AI to manipulate the canvas
 */
export class CanvasAPI {
  constructor(canvasContext) {
    this.canvas = canvasContext;
    
    // Track recently created shapes for "these shapes" references
    this.recentlyCreated = [];
    this.maxRecentShapes = 10; // Keep track of last 10 operations
    
    // DEBUG: Log CanvasAPI initialization
    console.log('🎨 CanvasAPI initialized:', {
      hasCanvas: !!this.canvas,
      hasStore: !!this.canvas?.store,
      hasShapes: !!this.canvas?.shapes,
      canvasKeys: Object.keys(this.canvas || {}),
      environment: typeof window !== 'undefined' ? 'browser' : 'server'
    });
  }

  /**
   * Refresh canvas context to get latest data
   */
  refreshContext() {
    // Force a refresh if the canvas has reactive capabilities
    if (this.canvas.store && typeof this.canvas.store.getState === 'function') {
      // Zustand store - get fresh state
      const state = this.canvas.store.getState();
    }
  }

  /**
   * Track recently created shapes for "these shapes" references
   */
  _trackRecentlyCreated(shapes) {
    const shapesToTrack = Array.isArray(shapes) ? shapes : [shapes];
    
    // Add to front of array with timestamp
    const tracked = {
      shapes: shapesToTrack,
      timestamp: Date.now(),
      operation: 'create'
    };
    
    this.recentlyCreated.unshift(tracked);
    
    // Keep only the most recent operations
    if (this.recentlyCreated.length > this.maxRecentShapes) {
      this.recentlyCreated = this.recentlyCreated.slice(0, this.maxRecentShapes);
    }
    
  }

  /**
   * Get recently created shapes for "these shapes" references
   */
  getRecentlyCreatedShapes(maxAge = 30000) { // 30 seconds default
    const now = Date.now();
    const recent = this.recentlyCreated
      .filter(op => (now - op.timestamp) < maxAge)
      .flatMap(op => op.shapes)
      .filter(shape => shape && shape.id); // Ensure valid shapes
    
    
    return recent;
  }

  /**
   * Analyze shape relationships for UX-aware reasoning
   */
  analyzeShapeRelationships(shapes = null) {
    const shapesToAnalyze = shapes || this.getCurrentShapes();
    
    return {
      containers: this._identifyContainers(shapesToAnalyze),
      groups: this._identifyGroups(shapesToAnalyze),
      alignments: this._detectAlignments(shapesToAnalyze),
      hierarchy: this._buildHierarchy(shapesToAnalyze),
      spacing: this._analyzeSpacing(shapesToAnalyze)
    };
  }

  /**
   * Identify containers (large rectangles that contain other shapes)
   */
  _identifyContainers(shapes) {
    return shapes.filter(s => 
      s.type === 'rectangle' && 
      s.width >= 300 && 
      s.height >= 200
    ).map(container => ({
      id: container.id,
      bounds: this._getBounds(container),
      children: shapes.filter(s => 
        s.id !== container.id && 
        this._isInside(s, container)
      )
    }));
  }

  /**
   * Identify groups of shapes that are close together (< 50px)
   */
  _identifyGroups(shapes) {
    const groups = [];
    const processed = new Set();
    
    shapes.forEach(shape => {
      if (processed.has(shape.id)) return;
      
      const nearby = shapes.filter(s => 
        s.id !== shape.id && 
        !processed.has(s.id) &&
        this._distance(shape, s) < 50
      );
      
      if (nearby.length > 0) {
        const group = [shape, ...nearby];
        group.forEach(s => processed.add(s.id));
        groups.push(group);
      }
    });
    
    return groups;
  }

  /**
   * Detect alignment patterns in shapes
   */
  _detectAlignments(shapes) {
    const tolerance = 5;
    const leftAligned = [];
    const centerAligned = [];
    const rightAligned = [];
    
    // Group shapes by x-coordinate (left edge)
    const byX = {};
    shapes.forEach(s => {
      const x = Math.round(s.x / tolerance) * tolerance;
      if (!byX[x]) byX[x] = [];
      byX[x].push(s);
    });
    
    Object.values(byX).forEach(group => {
      if (group.length >= 2) {
        leftAligned.push(group);
      }
    });

    // Group shapes by center X
    const byCenterX = {};
    shapes.forEach(s => {
      const centerX = Math.round((s.x + (s.width || 0) / 2) / tolerance) * tolerance;
      if (!byCenterX[centerX]) byCenterX[centerX] = [];
      byCenterX[centerX].push(s);
    });
    
    Object.values(byCenterX).forEach(group => {
      if (group.length >= 2) {
        centerAligned.push(group);
      }
    });

    // Group shapes by right edge
    const byRightX = {};
    shapes.forEach(s => {
      const rightX = Math.round((s.x + (s.width || 0)) / tolerance) * tolerance;
      if (!byRightX[rightX]) byRightX[rightX] = [];
      byRightX[rightX].push(s);
    });
    
    Object.values(byRightX).forEach(group => {
      if (group.length >= 2) {
        rightAligned.push(group);
      }
    });
    
    return { leftAligned, centerAligned, rightAligned };
  }

  /**
   * Build hierarchy of parent-child relationships
   */
  _buildHierarchy(shapes) {
    const containers = this._identifyContainers(shapes);
    const hierarchy = [];
    
    containers.forEach(container => {
      hierarchy.push({
        type: 'container',
        id: container.id,
        children: container.children.map(child => ({
          type: 'child',
          id: child.id,
          relationship: 'inside'
        }))
      });
    });
    
    return hierarchy;
  }

  /**
   * Analyze spacing between shapes
   */
  _analyzeSpacing(shapes) {
    const spacing = [];
    const sortedShapes = shapes.sort((a, b) => a.y - b.y);
    
    for (let i = 0; i < sortedShapes.length - 1; i++) {
      const current = sortedShapes[i];
      const next = sortedShapes[i + 1];
      const gap = next.y - (current.y + (current.height || 0));
      
      if (gap > 0 && gap < 100) { // Only track reasonable gaps
        spacing.push({
          elements: [current, next],
          gap: gap,
          type: 'vertical'
        });
      }
    }
    
    return spacing;
  }

  /**
   * Get bounds of a shape
   */
  _getBounds(shape) {
    const width = shape.width || 0;
    const height = shape.height || 0;
    
    return {
      left: shape.x,
      right: shape.x + width,
      top: shape.y,
      bottom: shape.y + height,
      centerX: shape.x + width / 2,
      centerY: shape.y + height / 2
    };
  }

  /**
   * Check if a shape is inside another shape
   */
  _isInside(shape, container) {
    const shapeBounds = this._getBounds(shape);
    const containerBounds = this._getBounds(container);
    
    return shapeBounds.left >= containerBounds.left &&
           shapeBounds.right <= containerBounds.right &&
           shapeBounds.top >= containerBounds.top &&
           shapeBounds.bottom <= containerBounds.bottom;
  }

  /**
   * Calculate distance between two shapes
   */
  _distance(shape1, shape2) {
    const center1 = {
      x: shape1.x + (shape1.width || 0) / 2,
      y: shape1.y + (shape1.height || 0) / 2
    };
    const center2 = {
      x: shape2.x + (shape2.width || 0) / 2,
      y: shape2.y + (shape2.height || 0) / 2
    };
    
    return Math.sqrt(
      Math.pow(center2.x - center1.x, 2) + 
      Math.pow(center2.y - center1.y, 2)
    );
  }

  /**
   * Parse natural language position commands with synonyms
   */
  parsePositionCommand(command, shapeDescription = null) {
    // Coordinate patterns
    const coordinatePatterns = [
      /(?:at|to)\s+(?:point|location|position|coordinates?)\s*[:\-]?\s*\(?(\d+)\s*,\s*(\d+)\)?/i,
      /(?:x|position)\s*[=:]\s*(\d+)\s*,?\s*(?:y|position)\s*[=:]\s*(\d+)/i,
      /\((\d+)\s*,\s*(\d+)\)/
    ];
    
    for (const pattern of coordinatePatterns) {
      const match = command.match(pattern);
      if (match) {
        return {
          type: 'coordinates',
          x: parseInt(match[1]),
          y: parseInt(match[2])
        };
      }
    }
    
    // Relative position patterns
    if (/beside|next to|adjacent to|to the right of/i.test(command)) {
      const referenceShape = this._resolveShapeReference(shapeDescription);
      if (referenceShape) {
        return {
          type: 'relative',
          relation: 'right',
          referenceShape,
          gap: this._extractGap(command) || 16
        };
      }
    }
    
    if (/just under|directly below|underneath|beneath/i.test(command)) {
      const referenceShape = this._resolveShapeReference(shapeDescription);
      if (referenceShape) {
        return {
          type: 'relative',
          relation: 'below',
          referenceShape,
          gap: this._extractGap(command) || 8
        };
      }
    }
    
    if (/above|on top of|over/i.test(command)) {
      const referenceShape = this._resolveShapeReference(shapeDescription);
      if (referenceShape) {
        return {
          type: 'relative',
          relation: 'above',
          referenceShape,
          gap: this._extractGap(command) || 8
        };
      }
    }
    
    if (/space evenly|distribute|spread out|evenly spaced/i.test(command)) {
      return {
        type: 'distribute',
        direction: /vertical/i.test(command) ? 'vertical' : 'horizontal'
      };
    }
    
    return null;
  }

  /**
   * Resolve contextual shape references
   */
  _resolveShapeReference(description) {
    if (!description) return null;
    
    const shapes = this.getCurrentShapes();
    
    // Contextual references
    const contextualReferences = {
      'the form': () => shapes.filter(s => s.type === 'rectangle' && s.width >= 300),
      'the login': () => shapes.filter(s => s.text && s.text.toLowerCase().includes('login')),
      'the button': () => shapes.filter(s => s.type === 'rectangle' && s.height <= 50 && s.fill === '#3B82F6'),
      'the title': () => shapes.filter(s => s.fontSize && s.fontSize >= 20),
      'the input': () => shapes.filter(s => s.type === 'rectangle' && s.height >= 30 && s.height <= 50),
      'the label': () => shapes.filter(s => s.type === 'text' && s.fontSize && s.fontSize <= 16)
    };
    
    // Check for exact contextual matches
    for (const [key, resolver] of Object.entries(contextualReferences)) {
      if (description.toLowerCase().includes(key)) {
        const matches = resolver();
        return matches.length > 0 ? matches[0] : null;
      }
    }
    
    // Try to find by properties
    return this._findShapeByDescription(description, shapes);
  }

  /**
   * Find shape by natural language description
   */
  _findShapeByDescription(description, shapes) {
    const desc = description.toLowerCase();
    
    // Color matching
    const colorMatches = shapes.filter(s => {
      if (desc.includes('blue') && s.fill === '#3B82F6') return true;
      if (desc.includes('red') && s.fill === '#EF4444') return true;
      if (desc.includes('green') && s.fill === '#10B981') return true;
      if (desc.includes('yellow') && s.fill === '#F59E0B') return true;
      return false;
    });
    
    if (colorMatches.length > 0) return colorMatches[0];
    
    // Size matching
    const sizeMatches = shapes.filter(s => {
      if (desc.includes('large') && s.width > 200) return true;
      if (desc.includes('small') && s.width < 100) return true;
      if (desc.includes('tiny') && s.width < 50) return true;
      return false;
    });
    
    if (sizeMatches.length > 0) return sizeMatches[0];
    
    // Type matching
    const typeMatches = shapes.filter(s => {
      if (desc.includes('circle') && s.type === 'circle') return true;
      if (desc.includes('rectangle') && s.type === 'rectangle') return true;
      if (desc.includes('triangle') && s.type === 'triangle') return true;
      if (desc.includes('text') && s.type === 'text') return true;
      return false;
    });
    
    if (typeMatches.length > 0) return typeMatches[0];
    
    return null;
  }

  /**
   * Extract gap value from command
   */
  _extractGap(command) {
    const gapMatch = command.match(/(\d+)\s*px/i);
    return gapMatch ? parseInt(gapMatch[1]) : null;
  }

  /**
   * Resolve "these shapes" reference
   */
  resolveTheseShapes() {
    // First check: currently selected shapes
    const selectedShapes = this.canvas.getSelectedShapes ? this.canvas.getSelectedShapes() : [];
    if (selectedShapes && selectedShapes.length > 0) {
      return selectedShapes;
    }
    
    // Second check: shapes created in last 30 seconds
    const recentShapes = this.getRecentlyCreatedShapes();
    if (recentShapes.length > 0) {
      return recentShapes;
    }
    
    // Third check: shapes mentioned in conversation history
    // (This would require conversation context - for now, fall back to all shapes)
    
    // Fallback: all shapes on canvas
    return this.getCurrentShapes();
  }

  /**
   * Parse size descriptors
   */
  parseSizeDescriptor(sizeText) {
    const sizeMap = {
      'tiny': { scale: 0.5 },
      'small': { scale: 0.75 },
      'medium': { scale: 1.0 },
      'large': { scale: 1.5 },
      'huge': { scale: 2.0 },
      'very large': { scale: 2.5 }
    };
    
    const normalizedSize = sizeText.toLowerCase().trim();
    return sizeMap[normalizedSize] || { scale: 1.0 };
  }


  /**
   * Get current shapes from canvas context (always fresh)
   */
  getCurrentShapes() {
    let shapes = [];
    
    // Try multiple sources to get the most current shapes
    // 1. Direct access to store (most reliable)
    if (this.canvas.store && this.canvas.store.shapes) {
      if (this.canvas.store.shapes instanceof Map) {
        shapes = Array.from(this.canvas.store.shapes.values());
      }
    }
    
    // 2. Fallback to processed shapes array from context
    if (shapes.length === 0 && this.canvas.shapes) {
      if (this.canvas.shapes instanceof Map) {
        shapes = Array.from(this.canvas.shapes.values());
      } else if (Array.isArray(this.canvas.shapes)) {
        shapes = this.canvas.shapes;
      }
    }
    
    // Trigger cleanup when accessing canvas state (opportunistic cleanup)
    if (this.canvas.cleanupOrphanedUpdates && typeof this.canvas.cleanupOrphanedUpdates === 'function') {
      this.canvas.cleanupOrphanedUpdates(60000); // 1 minute timeout
    }
    
    // 3. Final fallback - empty array
    if (shapes.length === 0) {
      // No shapes found - this is expected for empty canvas
    }
    
    
    return shapes;
  }

  /**
   * Get current canvas state for AI context
   */
  getCanvasState() {
    const shapes = this.getCurrentShapes();
    
    return {
      shapes: shapes.map(shape => ({
        id: shape.id,
        type: shape.type,
        x: Math.round(shape.x || 0),
        y: Math.round(shape.y || 0),
        width: shape.width,
        height: shape.height,
        radiusX: shape.radiusX,
        radiusY: shape.radiusY,
        fill: shape.fill,
        text: shape.text,
        rotation: shape.rotation || 0,
        zIndex: shape.zIndex || 0,
        // Add friendly ID for easier reference
        friendlyId: this.extractFriendlyId(shape.id)
      })),
      totalShapes: shapes.length,
      selectedIds: Array.from(this.canvas.selectedIds || [])
    };
  }

  /**
   * Extract friendly ID from full shape ID for easier AI reference
   */
  extractFriendlyId(fullId) {
    if (!fullId) return 'unknown';
    // Extract last part after final dash (e.g., "shape-user-timestamp-abc123" -> "abc123")
    return fullId.split('-').slice(-1)[0] || fullId;
  }

  /**
   * Find shape by natural language description (e.g., "blue rectangle", "red circle")
   */
  findShapeByDescription(description) {
    const shapes = this.getCurrentShapes();
    if (!description || typeof description !== 'string') {
      return null;
    }
    const desc = description.toLowerCase().trim();
    
    
    // Color mapping
    const colorMap = {
      'blue': ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'],
      'red': ['#ef4444', '#dc2626', '#b91c1c', '#991b1b'],
      'green': ['#10b981', '#059669', '#047857', '#065f46'],
      'yellow': ['#eab308', '#ca8a04', '#a16207', '#854d0e'],
      'purple': ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'],
      'pink': ['#ec4899', '#db2777', '#be185d', '#9d174d'],
      'orange': ['#f97316', '#ea580c', '#c2410c', '#9a3412'],
      'gray': ['#6b7280', '#4b5563', '#374151', '#1f2937'],
      'black': ['#000000', '#1f2937', '#111827', '#030712'],
      'white': ['#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb']
    };
    
    // Shape type matching
    const shapeTypes = {
      'rectangle': SHAPE_TYPES.RECTANGLE,
      'rect': SHAPE_TYPES.RECTANGLE,
      'square': SHAPE_TYPES.RECTANGLE,
      'box': SHAPE_TYPES.RECTANGLE,
      'circle': SHAPE_TYPES.CIRCLE,
      'oval': SHAPE_TYPES.CIRCLE,
      'ellipse': SHAPE_TYPES.CIRCLE,
      'triangle': SHAPE_TYPES.TRIANGLE,
      'text': SHAPE_TYPES.TEXT,
      'label': SHAPE_TYPES.TEXT,
      'input': SHAPE_TYPES.TEXT_INPUT,
      'field': SHAPE_TYPES.TEXT_INPUT,
      'line': SHAPE_TYPES.LINE,
      'drawing': SHAPE_TYPES.LINE,
      'bezier': SHAPE_TYPES.BEZIER_CURVE,
      'curve': SHAPE_TYPES.BEZIER_CURVE
    };
    
    // Find matches
    const candidates = shapes.filter(shape => {
      let matches = 0;
      let totalCriteria = 0;
      
      // Check color
      const colorWords = Object.keys(colorMap);
      const mentionedColor = colorWords.find(color => desc.includes(color));
      if (mentionedColor) {
        totalCriteria++;
        const colorVariants = colorMap[mentionedColor];
        if (colorVariants.some(variant => 
          shape.fill && shape.fill.toLowerCase() === variant.toLowerCase()
        )) {
          matches++;
        }
      }
      
      // Check shape type
      const typeWords = Object.keys(shapeTypes);
      const mentionedType = typeWords.find(type => desc.includes(type));
      if (mentionedType) {
        totalCriteria++;
        if (shape.type === shapeTypes[mentionedType]) {
          matches++;
        }
      }
      
        // Check text content (both exact and partial matches)
        if (shape.text) {
          const shapeTextLower = shape.text.toLowerCase();
          if (desc.includes(shapeTextLower) || shapeTextLower.includes(desc.replace(/text|label|input|field/g, '').trim())) {
            matches++;
            totalCriteria++;
          }
        }
      
      // Check size descriptors
      if (desc.includes('large') || desc.includes('big')) {
        totalCriteria++;
        const isLarge = (shape.width > 150) || (shape.height > 150) || 
                       (shape.radiusX > 75) || (shape.radiusY > 75);
        if (isLarge) {
          matches++;
        }
      }
      
      if (desc.includes('small') || desc.includes('tiny')) {
        totalCriteria++;
        const isSmall = (shape.width < 80) || (shape.height < 80) || 
                       (shape.radiusX < 40) || (shape.radiusY < 40);
        if (isSmall) {
          matches++;
        }
      }
      
      // Must match at least 1 criterion and have a good match ratio
      return totalCriteria > 0 && matches / totalCriteria >= 0.5;
    });
    
    // Sort by best match (most criteria matched)
    candidates.sort((a, b) => {
      const aScore = this.getDescriptionMatchScore(a, desc, colorMap, shapeTypes);
      const bScore = this.getDescriptionMatchScore(b, desc, colorMap, shapeTypes);
      return bScore - aScore;
    });
    
    if (candidates.length > 0) {
      return candidates[0]; // Return best match
    }
    
    return null;
  }
  
  /**
   * Calculate match score for description-based search
   */
  getDescriptionMatchScore(shape, desc, colorMap, shapeTypes) {
    let score = 0;
    
    // Color matching (high weight)
    const colorWords = Object.keys(colorMap);
    const mentionedColor = colorWords.find(color => desc.includes(color));
    if (mentionedColor) {
      const colorVariants = colorMap[mentionedColor];
      if (colorVariants.some(variant => 
        shape.fill && shape.fill.toLowerCase() === variant.toLowerCase()
      )) {
        score += 3;
      }
    }
    
    // Type matching (high weight)
    const typeWords = Object.keys(shapeTypes);
    const mentionedType = typeWords.find(type => desc.includes(type));
    if (mentionedType && shape.type === shapeTypes[mentionedType]) {
      score += 3;
    }
    
    // Text matching (medium weight)
    if (shape.text && desc.includes(shape.text.toLowerCase())) {
      score += 2;
    }
    
    // Size matching (low weight)
    if (desc.includes('large') || desc.includes('big')) {
      const isLarge = (shape.width > 150) || (shape.height > 150) || 
                     (shape.radiusX > 75) || (shape.radiusY > 75);
      if (isLarge) score += 1;
    }
    
    if (desc.includes('small') || desc.includes('tiny')) {
      const isSmall = (shape.width < 80) || (shape.height < 80) || 
                     (shape.radiusX < 40) || (shape.radiusY < 40);
      if (isSmall) score += 1;
    }
    
    return score;
  }

  /**
   * Find shape by friendly ID or full ID (legacy support)
   */
  findShape(idInput) {
    const shapes = this.getCurrentShapes();
    
    
    // Try exact match first
    let shape = shapes.find(s => s.id === idInput);
    if (shape) {
      return shape;
    }
    
    // Try friendly ID match
    shape = shapes.find(s => this.extractFriendlyId(s.id) === idInput);
    if (shape) {
      return shape;
    }
    
    // Try partial match (case insensitive)
    shape = shapes.find(s => 
      s.id.toLowerCase().includes(idInput.toLowerCase()) ||
      this.extractFriendlyId(s.id).toLowerCase().includes(idInput.toLowerCase())
    );
    
    if (shape) {
      // Shape found
    } else {
      // Shape not found
    }
    
    return shape;
  }

  /**
   * List all shapes with friendly descriptions for AI
   */
  listShapes() {
    const shapes = this.getCurrentShapes();
    return shapes.map(shape => {
      const description = this.getShapeDescription(shape);
      return {
        id: shape.id,
        friendlyId: this.extractFriendlyId(shape.id),
        type: shape.type,
        description: description,
        position: `(${Math.round(shape.x || 0)}, ${Math.round(shape.y || 0)})`,
        fill: shape.fill
      };
    });
  }

  /**
   * Get human-readable description of a shape with color
   */
  getShapeDescription(shape) {
    const colorName = this.getColorName(shape.fill);
    const colorPrefix = colorName ? `${colorName} ` : '';
    
    switch (shape.type) {
      case SHAPE_TYPES.RECTANGLE:
        const width = shape.width || 100;
        const height = shape.height || 100;
        const rectType = Math.abs(width - height) < 20 ? 'square' : 'rectangle';
        return `${colorPrefix}${width}×${height}px ${rectType}`;
      case SHAPE_TYPES.CIRCLE:
        const radiusX = shape.radiusX || 50;
        const radiusY = shape.radiusY || 50;
        const shapeType = Math.abs(radiusX - radiusY) < 5 ? 'circle' : 'oval';
        return radiusX === radiusY ? 
          `${colorPrefix}${radiusX * 2}px ${shapeType}` : 
          `${colorPrefix}${radiusX * 2}×${radiusY * 2}px ${shapeType}`;
      case SHAPE_TYPES.TEXT:
        return `${colorPrefix}text "${shape.text || 'Text'}"`;
      case SHAPE_TYPES.TEXT_INPUT:
        return `${colorPrefix}input field "${shape.text || 'Input Field'}"`;
      case SHAPE_TYPES.LINE:
        return `${colorPrefix}drawn line`;
      case SHAPE_TYPES.TRIANGLE:
        return `${colorPrefix}triangle`;
      case SHAPE_TYPES.BEZIER_CURVE:
        return `${colorPrefix}bezier curve`;
      default:
        return `${colorPrefix}${shape.type} shape`;
    }
  }

  /**
   * Get color name from hex value
   */
  getColorName(hexColor) {
    if (!hexColor) return '';
    
    const color = hexColor.toLowerCase();
    
    // Common color mappings
    const colorNames = {
      '#3b82f6': 'blue', '#2563eb': 'blue', '#1d4ed8': 'blue', '#1e40af': 'blue',
      '#ef4444': 'red', '#dc2626': 'red', '#b91c1c': 'red', '#991b1b': 'red',
      '#10b981': 'green', '#059669': 'green', '#047857': 'green', '#065f46': 'green',
      '#eab308': 'yellow', '#ca8a04': 'yellow', '#a16207': 'yellow', '#854d0e': 'yellow',
      '#8b5cf6': 'purple', '#7c3aed': 'purple', '#6d28d9': 'purple', '#5b21b6': 'purple',
      '#ec4899': 'pink', '#db2777': 'pink', '#be185d': 'pink', '#9d174d': 'pink',
      '#f97316': 'orange', '#ea580c': 'orange', '#c2410c': 'orange', '#9a3412': 'orange',
      '#6b7280': 'gray', '#4b5563': 'gray', '#374151': 'gray', '#1f2937': 'gray',
      '#000000': 'black', '#111827': 'black', '#030712': 'black',
      '#ffffff': 'white', '#f9fafb': 'white', '#f3f4f6': 'white', '#e5e7eb': 'white'
    };
    
    return colorNames[color] || '';
  }

  /**
   * Get viewport center for positioning new elements
   */
  getViewportCenter() {
    // Use canvas context to get current viewport center
    if (this.canvas.getViewportCenter) {
      return this.canvas.getViewportCenter();
    }
    
    // Fallback to stage center if available
    const stageRef = this.canvas.stageRef?.current;
    if (stageRef) {
      const stage = stageRef;
      const scale = this.canvas.stageScale || 1;
      const position = this.canvas.stagePosition || { x: 0, y: 0 };
    
    return {
        x: (-position.x + stage.width() / 2) / scale,
        y: (-position.y + stage.height() / 2) / scale
      };
    }
    
    // Default fallback
    return { x: 0, y: 0 };
  }

  /**
   * Parse color input (name or hex) to valid hex color
   */  
  parseColor(colorInput) {
    if (!colorInput) return '#3B82F6'; // Default blue
    
    // If it's already a hex color, return it
    if (/^#[0-9A-F]{6}$/i.test(colorInput)) {
      return colorInput;
    }
    
    // Check if it matches a color from our palette (case insensitive)
    const colorName = colorInput.toLowerCase();
    const colorMap = {
      'blue': '#3B82F6',
      'red': '#EF4444', 
      'green': '#10B981',
      'yellow': '#F59E0B',
      'purple': '#8B5CF6',
      'pink': '#EC4899',
      'indigo': '#6366F1',
      'orange': '#F97316',
      'teal': '#14B8A6',
      'cyan': '#06B6D4',
      'lime': '#84CC16',
      'emerald': '#059669'
    };
    
    return colorMap[colorName] || COLOR_PALETTE[0] || '#3B82F6';
  }

  /**
   * Check if a color is dark (to determine if text should be white)
   */
  isDarkColor(hexColor) {
    if (!hexColor || !hexColor.startsWith('#')) return false;
    
    // Convert hex to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance using standard formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Consider dark if luminance is below 0.5
    return luminance < 0.5;
  }

  /**
   * CREATE SHAPE - Core creation function
   */
  async createShape({
    shapeType,
    x,
    y,
    width,
    height,
    radiusX,
    radiusY,
    fill,
    text,
    fontSize,
    align,
    background,
    borderColor,
    borderWidth,
    cornerRadius,
    stroke,
    strokeWidth,
    zIndex
  }) {
    // DEBUG: Log createShape call
    console.log('🎨 CanvasAPI.createShape called:', {
      shapeType,
      x, y, width, height,
      fill, text,
      hasCanvas: !!this.canvas,
      hasStore: !!this.canvas?.store,
      environment: typeof window !== 'undefined' ? 'browser' : 'server'
    });
    
    const defaults = DEFAULT_SHAPE_PROPS[shapeType];
    if (!defaults) {
      throw new Error(`Invalid shape type: ${shapeType}`);
    }

    // Calculate dimensions for collision detection
    let shapeWidth = width || defaults.width || (radiusX ? radiusX * 2 : 0) || 100;
    let shapeHeight = height || defaults.height || (radiusY ? radiusY * 2 : 0) || 100;
    
    // Use origin (0,0) if no position specified
    if (x === undefined || y === undefined) {
      x = x ?? 0;
      y = y ?? 0;
    }
    
    // Validate coordinates to prevent NaN
    if (isNaN(x) || isNaN(y)) {
      console.error(`❌ Invalid coordinates for ${shapeType}: x=${x}, y=${y}`);
      x = x || 0;
      y = y || 0;
    }
    
    console.log(`🔵 Creating ${shapeType} at (${x}, ${y}) with size ${shapeWidth}x${shapeHeight}`);
    
    // Use exact coordinates as specified - no collision detection or position adjustment
    const finalX = x;
    const finalY = y;
    
    console.log(`📝 Shape data before creation:`, {
      shapeType,
      x: finalX,
      y: finalY,
      width,
      height,
      radiusX,
      radiusY,
      fill: fill
    });

    // Calculate fill color based on shape type
    let finalFill;
    if (shapeType === SHAPE_TYPES.TEXT || shapeType === SHAPE_TYPES.TEXT_INPUT) {
      // Text-specific logic: default to black
      if (!fill) {
        finalFill = '#000000'; // Default text to black
      } else if (fill && this.isDarkColor(fill)) {
        finalFill = '#FFFFFF'; // White text on dark backgrounds
      } else {
        finalFill = this.parseColor(fill); // Use specified color
      }
    } else {
      // Non-text shapes use normal logic
      finalFill = this.parseColor(fill) || defaults.fill;
    }

    // Generate a unique ID for the shape
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const shapeId = `shape-${timestamp}-${random}`;
    
    const newShape = {
      id: shapeId,
      type: shapeType,
      x: finalX,
      y: finalY,
      fill: finalFill,
      zIndex: zIndex ?? (this.canvas.shapes?.length || 0) + 1
    };

      // Add type-specific properties
      switch (shapeType) {
      case SHAPE_TYPES.RECTANGLE:
        newShape.width = width || defaults.width;
        newShape.height = height || defaults.height;
        break;
      
      case SHAPE_TYPES.CIRCLE:
        newShape.radiusX = radiusX || defaults.radiusX;
        newShape.radiusY = radiusY || defaults.radiusY;
        break;
      
      case SHAPE_TYPES.TEXT:
        newShape.text = text || defaults.text;
        newShape.fontSize = fontSize || defaults.fontSize;
        newShape.fontFamily = defaults.fontFamily;
        newShape.align = align || 'left'; // Add alignment support
        newShape.width = width || defaults.width;
        newShape.height = height || defaults.height;
        // Text color logic is now handled above
        break;
      
      case SHAPE_TYPES.TEXT_INPUT:
        newShape.text = text || defaults.text;
        newShape.fontSize = fontSize || defaults.fontSize;
        newShape.fontFamily = defaults.fontFamily;
        newShape.align = align || 'left';
        newShape.width = width || defaults.width;
        newShape.height = height || defaults.height;
        newShape.background = background || defaults.background;
        newShape.borderColor = borderColor || defaults.borderColor;
        newShape.borderWidth = borderWidth ?? defaults.borderWidth;
        newShape.cornerRadius = cornerRadius ?? defaults.cornerRadius;
        break;
      
      case SHAPE_TYPES.TRIANGLE:
        // Triangles use points array, not width/height
        newShape.points = [...defaults.points]; // Copy original triangle points
        newShape.closed = defaults.closed;
        
        // If width/height specified, calculate scale factors
        if (width || height) {
          const originalWidth = Math.abs(defaults.points[4] - defaults.points[2]); // 70px
          const originalHeight = Math.abs(defaults.points[1] - defaults.points[3]); // 70px
          
          if (width) {
            newShape.scaleX = width / originalWidth;
          }
          if (height) {
            newShape.scaleY = height / originalHeight;
          }
        }
        break;
      
      case SHAPE_TYPES.BEZIER_CURVE:
        // Position anchor points relative to the shape position
        newShape.anchorPoints = defaults.anchorPoints.map(point => ({
          x: point.x + (x || 0),
          y: point.y + (y || 0)
        }));
        newShape.stroke = this.parseColor(fill) || defaults.stroke;
        newShape.strokeWidth = defaults.strokeWidth;
        newShape.smoothing = defaults.smoothing;
        newShape.showAnchorPoints = defaults.showAnchorPoints;
        delete newShape.fill; // Bezier curves don't have fill
        break;
    }

    // Add to canvas using context method with debugging
    console.log(`🔧 Calling canvas.addShape with:`, {
      id: newShape.id,
      type: newShape.type,
      x: newShape.x,
      y: newShape.y,
      width: newShape.width,
      height: newShape.height
    });
    
    try {
      await this.canvas.addShape(newShape);
      console.log(`✅ canvas.addShape completed for shape ${newShape.id}`);
    } catch (error) {
      console.error(`❌ canvas.addShape failed for shape ${newShape.id}:`, error);
      throw error;
    }
    
    // Verify the shape was actually added
    const canvasState = this.getCanvasState();
    const shapeExists = canvasState.shapes.some(s => s.id === newShape.id);
    if (!shapeExists) {
      console.error(`❌ Shape ${newShape.id} was not found in canvas state after addShape call!`);
      console.error(`❌ Canvas state has ${canvasState.shapes.length} shapes:`, canvasState.shapes.map(s => s.id));
    } else {
      console.log(`✅ Shape ${newShape.id} confirmed in canvas state`);
    }
    
    // Track for "these shapes" references
    this._trackRecentlyCreated(newShape);
    
    return newShape;
  }

  /**
   * MOVE SHAPE - Manipulation function (supports friendly IDs)
   */
  async moveShape(shapeIdInput, x, y) {
    // Try natural language description first, then fall back to ID
    let shape = this.findShapeByDescription(shapeIdInput);
    if (!shape) {
      shape = this.findShape(shapeIdInput);
    }
    
    if (!shape) {
      throw new Error(`Shape not found: "${shapeIdInput}". Try describing it by color and type (e.g., "blue rectangle").`);
    }

    // Handle special positioning keywords
    let targetX = x;
    let targetY = y;
    
    // Check if "center" was requested (now means origin 0,0)
    if (x === 'center' || y === 'center') {
      if (x === 'center') targetX = 0;
      if (y === 'center') targetY = 0;
    }

    await this.canvas.updateShape(shape.id, { x: targetX, y: targetY });
    const description = this.getShapeDescription(shape);
    return { 
      shapeId: shape.id, 
      description: description, 
      x: targetX, 
      y: targetY 
    };
  }

  /**
   * RESIZE SHAPE - Manipulation function (supports friendly IDs)
   */
  async resizeShape(shapeIdInput, { width, height, radiusX, radiusY, scale }) {
    // Try natural language description first, then fall back to ID
    let shape = this.findShapeByDescription(shapeIdInput);
    if (!shape) {
      shape = this.findShape(shapeIdInput);
    }
    
    if (!shape) {
      throw new Error(`Shape not found: "${shapeIdInput}". Try describing it by color and type (e.g., "blue rectangle").`);
    }

    const updates = {};

    // For rectangles and other shapes with width/height
        if (width !== undefined) updates.width = width;
        if (height !== undefined) updates.height = height;
    
    // For circles with radiusX/Y  
    if (radiusX !== undefined) updates.radiusX = radiusX;
    if (radiusY !== undefined) updates.radiusY = radiusY;
    
    // Convert scale factor to actual pixel dimensions
        if (scale !== undefined) {
      switch (shape.type) {
        case SHAPE_TYPES.RECTANGLE:
          if (shape.width) updates.width = Math.round(shape.width * scale);
          if (shape.height) updates.height = Math.round(shape.height * scale);
          break;
        case SHAPE_TYPES.CIRCLE:
          if (shape.radiusX) updates.radiusX = Math.round(shape.radiusX * scale);
          if (shape.radiusY) updates.radiusY = Math.round(shape.radiusY * scale);
        break;
      case SHAPE_TYPES.TEXT:
      case SHAPE_TYPES.TEXT_INPUT:
          if (shape.width) updates.width = Math.round(shape.width * scale);
          if (shape.height) updates.height = Math.round(shape.height * scale);
          if (shape.fontSize) updates.fontSize = Math.round(shape.fontSize * scale);
        break;
        default:
          // For other shapes, fall back to scale properties
          updates.scaleX = scale;
          updates.scaleY = scale;
    }
    }

    await this.canvas.updateShape(shape.id, updates);
    const description = this.getShapeDescription(shape);
    return {
      shapeId: shape.id, 
      description: description, 
      ...updates 
    };
  }

  /**
   * ROTATE SHAPE - Manipulation function (supports friendly IDs)
   */
  async rotateShape(shapeIdInput, degrees) {
    // Try natural language description first, then fall back to ID
    let shape = this.findShapeByDescription(shapeIdInput);
    if (!shape) {
      shape = this.findShape(shapeIdInput);
    }
    
    if (!shape) {
      throw new Error(`Shape not found: "${shapeIdInput}". Try describing it by color and type (e.g., "blue rectangle").`);
    }

    // Ensure degrees is a valid number and normalize to 0-360 range
    const normalizedDegrees = ((degrees % 360) + 360) % 360;
    
    console.log('🔄 Rotating shape:', {
      shapeId: shape.id,
      inputDegrees: degrees,
      normalizedDegrees: normalizedDegrees,
      currentRotation: shape.rotation || 0,
      shapeType: shape.type,
      trianglePoints: shape.type === 'triangle' ? shape.points : 'N/A'
    });

    await this.canvas.updateShape(shape.id, { rotation: normalizedDegrees });
    const description = this.getShapeDescription(shape);
    return { 
      shapeId: shape.id, 
      description: description, 
      rotation: normalizedDegrees 
    };
  }

  /**
   * Normalize all rotation values to 0-360 degrees
   */
  async fixRotationValues() {
    const shapes = this.getCurrentShapes();
    const shapesToFix = shapes.filter(shape => shape.rotation !== undefined && shape.rotation !== null);
    
    if (shapesToFix.length > 0) {
      console.log('🔧 Normalizing rotation values for', shapesToFix.length, 'shapes');
      
      for (const shape of shapesToFix) {
        const normalizedDegrees = ((shape.rotation % 360) + 360) % 360;
        
        // Only update if the value changed
        if (Math.abs(normalizedDegrees - shape.rotation) > 0.01) {
          console.log('🔄 Normalizing rotation:', {
            shapeId: shape.id,
            original: shape.rotation,
            normalized: normalizedDegrees
          });
          
          await this.canvas.updateShape(shape.id, { rotation: normalizedDegrees });
        }
      }
    }
    
    return { fixed: shapesToFix.length };
  }

  /**
   * Normalize a specific shape's rotation to 0-360 degrees
   */
  async convertShapeRotationToDegrees(shapeId) {
    const shape = this.findShape(shapeId);
    if (!shape) {
      throw new Error(`Shape not found: ${shapeId}`);
    }

    if (!shape.rotation) {
      return { shapeId, rotation: 0, converted: false };
    }

    const normalizedDegrees = ((shape.rotation % 360) + 360) % 360;

    console.log('🔄 Normalizing shape rotation:', {
      shapeId: shape.id,
      original: shape.rotation,
      normalized: normalizedDegrees
    });

    await this.canvas.updateShape(shape.id, { rotation: normalizedDegrees });

    return { 
      shapeId: shape.id, 
      rotation: normalizedDegrees, 
      converted: Math.abs(normalizedDegrees - shape.rotation) > 0.01
    };
  }

  /**
   * CHANGE SHAPE COLOR - Manipulation function (supports friendly IDs)
   */
  async changeShapeColor(shapeIdInput, color) {
    // Try natural language description first, then fall back to ID
    let shape = this.findShapeByDescription(shapeIdInput);
    if (!shape) {
      shape = this.findShape(shapeIdInput);
    }
    
    if (!shape) {
      throw new Error(`Shape not found: "${shapeIdInput}". Try describing it by color and type (e.g., "blue rectangle").`);
    }

    const parsedColor = this.parseColor(color);
    await this.canvas.updateShape(shape.id, { fill: parsedColor });
    const description = this.getShapeDescription(shape);
    return {
      shapeId: shape.id, 
      description: description, 
      fill: parsedColor 
    };
  }

  /**
   * CHANGE SHAPE TEXT - Manipulation function (supports friendly IDs)
   */
  async changeShapeText(shapeIdInput, newText) {
    // Try natural language description first, then fall back to ID
    let shape = this.findShapeByDescription(shapeIdInput);
    if (!shape) {
      shape = this.findShape(shapeIdInput);
    }
    
    if (!shape) {
      throw new Error(`Shape not found: "${shapeIdInput}". Try describing it by its current text or type (e.g., "text that says Hello", "username label").`);
    }

    // Verify this is a text shape
    if (shape.type !== SHAPE_TYPES.TEXT && shape.type !== SHAPE_TYPES.TEXT_INPUT) {
      throw new Error(`Shape "${shapeIdInput}" is not a text shape. It's a ${shape.type}. Only text shapes can have their text changed.`);
    }

    await this.canvas.updateShape(shape.id, { text: newText });
    const description = this.getShapeDescription(shape);
    return {
      shapeId: shape.id, 
      description: description, 
      text: newText,
      oldText: shape.text 
    };
  }

  /**
   * CREATE MULTIPLE SHAPES - Layout function with smart spacing and collision detection
   */
  async createMultipleShapes({
    shapeType,
    count,
    arrangement = 'row',
    gridRows,
    gridCols,
    startX,
    startY,
    spacing,
    fill,
    width,
    height,
    centerInViewport = false,  // NEW
    marginSize = 0,             // NEW
    containerWidth,             // NEW for even distribution
    radiusX,                    // NEW for circles
    radiusY,                    // NEW for circles
    avoidOverlaps = true
  }) {
    const shapes = [];
    const defaults = DEFAULT_SHAPE_PROPS[shapeType];
    const color = this.parseColor(fill) || defaults.fill;
    
    // Calculate shape dimensions for smart spacing
    const shapeWidth = width || defaults.width || (radiusX ? radiusX * 2 : 0) || 100;
    const shapeHeight = height || defaults.height || (radiusY ? radiusY * 2 : 0) || 100;
    
    // Use SpatialPlanner to calculate all positions
    const planner = new SpatialPlanner();
    
    // Calculate smart spacing if not provided
    let calculatedSpacing = spacing;
    if (!calculatedSpacing) {
      calculatedSpacing = planner.calculateSmartSpacing(Math.max(shapeWidth, shapeHeight));
      console.log(`📏 Smart spacing: ${Math.max(shapeWidth, shapeHeight)}px shape → ${calculatedSpacing}px spacing`);
    }
    
    // Use origin (0,0) if no start position specified
    if (startX === undefined || startY === undefined) {
      startX = startX ?? 0;
      startY = startY ?? 0;
    }
    
    // Get viewport center for centering calculations
    const viewportCenter = this.getViewportCenter();
    
    // For grid arrangements, calculate rows and cols from count if not provided
    let finalGridRows = gridRows;
    let finalGridCols = gridCols;
    
    if (arrangement === 'grid') {
      if (!finalGridRows || !finalGridCols) {
        // Calculate grid dimensions from count
        if (count === 9) {
          finalGridRows = 3;
          finalGridCols = 3;
        } else if (count === 4) {
          finalGridRows = 2;
          finalGridCols = 2;
        } else if (count === 6) {
          finalGridRows = 2;
          finalGridCols = 3;
        } else if (count === 8) {
          finalGridRows = 2;
          finalGridCols = 4;
        } else if (count === 12) {
          finalGridRows = 3;
          finalGridCols = 4;
        } else if (count === 16) {
          finalGridRows = 4;
          finalGridCols = 4;
        } else {
          // Default to square grid
          const sqrt = Math.sqrt(count);
          finalGridRows = Math.ceil(sqrt);
          finalGridCols = Math.ceil(count / finalGridRows);
        }
        console.log(`🔢 Calculated grid dimensions: ${finalGridRows}x${finalGridCols} for ${count} shapes`);
      }
    }
    
    // Plan the layout using SpatialPlanner
    const plan = planner.planLayout({
      arrangement,
      count,
      gridRows: finalGridRows,
      gridCols: finalGridCols,
      shapeWidth,
      shapeHeight,
      startX,
      startY,
      spacing: calculatedSpacing,
      centerInViewport,
      marginSize,
      containerWidth,
      viewportCenterX: viewportCenter.x,
      viewportCenterY: viewportCenter.y
    });
    
    // Collision detection: check for overlaps with existing shapes
    if (avoidOverlaps && plan.positions.length > 0) {
      const existingShapes = this.getCanvasState().shapes;
      if (existingShapes.length > 0) {
        // Calculate the total area needed for the new shapes
        const proposedBounds = {
          x: Math.min(...plan.positions.map(p => p.x)),
          y: Math.min(...plan.positions.map(p => p.y)),
          width: plan.totalWidth,
          height: plan.totalHeight
        };
        
        const hasOverlap = existingShapes.some(shape => {
          const shapeBounds = {
            x: shape.x,
            y: shape.y,
            width: shape.width || shape.radiusX * 2 || 100,
            height: shape.height || shape.radiusY * 2 || 100
          };
          
          return this._checkBoundsOverlap(proposedBounds, shapeBounds);
        });
        
        // If overlap detected, adjust starting position
        if (hasOverlap) {
          const offset = Math.max(shapeWidth, shapeHeight) + calculatedSpacing;
          plan.positions = plan.positions.map(pos => ({
            x: pos.x + offset,
            y: pos.y
          }));
          console.log(`🔍 Collision detected, adjusting position by ${offset}px`);
        }
      }
    }
    
    // Create shapes at planned positions with comprehensive debugging
    console.log(`🎯 Creating ${plan.positions.length} shapes with SpatialPlanner...`);
    console.log(`📊 Plan details:`, {
      positions: plan.positions.length,
      totalWidth: plan.totalWidth,
      totalHeight: plan.totalHeight,
      shapeType,
      shapeWidth,
      shapeHeight,
      color
    });
    
    // Get initial canvas state for comparison
    const initialCanvasState = this.getCanvasState();
    const initialShapeCount = initialCanvasState.shapes.length;
    console.log(`📊 Initial canvas state: ${initialShapeCount} shapes`);
    
    // Create each shape with detailed validation
    for (let i = 0; i < plan.positions.length; i++) {
      const position = plan.positions[i];
      console.log(`🔵 Creating shape ${i + 1}/${plan.positions.length} at (${position.x}, ${position.y})`);
      
      // Validate position is within reasonable bounds
      if (position.x < -1000 || position.x > 2000 || position.y < -1000 || position.y > 2000) {
        console.warn(`⚠️ Shape ${i + 1} position (${position.x}, ${position.y}) is outside reasonable bounds`);
      }
      
      // Prepare shape parameters with validation
      const shapeParams = {
        shapeType,
        x: position.x,
        y: position.y,
        width,
        height,
        radiusX,
        radiusY,
        fill: color,
      };
      
      console.log(`📝 Shape ${i + 1} parameters:`, shapeParams);
      
      // Validate all required parameters
      if (!shapeType) {
        console.error(`❌ Shape ${i + 1}: Missing shapeType`);
        continue;
      }
      if (position.x === undefined || position.y === undefined) {
        console.error(`❌ Shape ${i + 1}: Missing position (${position.x}, ${position.y})`);
        continue;
      }
      if (isNaN(position.x) || isNaN(position.y)) {
        console.error(`❌ Shape ${i + 1}: Invalid position (${position.x}, ${position.y})`);
        continue;
      }
      
      try {
        // Create the shape
        const shape = await this.createShape(shapeParams);
        
        if (!shape) {
          console.error(`❌ Shape ${i + 1}: createShape returned null/undefined`);
          continue;
        }
        
        if (!shape.id) {
          console.error(`❌ Shape ${i + 1}: Created shape missing ID:`, shape);
          continue;
        }
        
        console.log(`✅ Shape ${i + 1} created successfully:`, {
          id: shape.id,
          type: shape.type,
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height
        });
        
        shapes.push(shape);
        
        // Verify shape was added to canvas
        const currentCanvasState = this.getCanvasState();
        const currentShapeCount = currentCanvasState.shapes.length;
        console.log(`📊 Canvas state after shape ${i + 1}: ${currentShapeCount} shapes (was ${initialShapeCount + i})`);
        
        if (currentShapeCount <= initialShapeCount + i) {
          console.error(`❌ Shape ${i + 1} was not added to canvas! Expected ${initialShapeCount + i + 1} shapes, got ${currentShapeCount}`);
        }
        
      } catch (error) {
        console.error(`❌ Shape ${i + 1} creation failed:`, error);
        console.error(`❌ Error details:`, {
          message: error.message,
          stack: error.stack,
          shapeParams
        });
        continue;
      }
    }
    
    console.log(`🎉 Shape creation loop completed: ${shapes.length} shapes created`);
    
    // Final validation with detailed reporting
    const finalCanvasState = this.getCanvasState();
    const finalShapeCount = finalCanvasState.shapes.length;
    const shapesAdded = finalShapeCount - initialShapeCount;
    
    console.log(`🔍 FINAL VALIDATION:`);
    console.log(`📊 Expected: ${count} shapes`);
    console.log(`📊 Created in loop: ${shapes.length} shapes`);
    console.log(`📊 Initial canvas: ${initialShapeCount} shapes`);
    console.log(`📊 Final canvas: ${finalShapeCount} shapes`);
    console.log(`📊 Net shapes added: ${shapesAdded} shapes`);
    
    if (shapesAdded < count) {
      console.error(`❌ VALIDATION FAILED: Only ${shapesAdded} shapes were actually added to canvas (expected ${count})`);
      console.error(`❌ This indicates a problem with the canvas.addShape() method or canvas state management`);
      
      // Try to identify which shapes failed
      const createdShapeIds = shapes.map(s => s.id);
      const canvasShapeIds = finalCanvasState.shapes.map(s => s.id);
      const missingShapes = createdShapeIds.filter(id => !canvasShapeIds.includes(id));
      
      if (missingShapes.length > 0) {
        console.error(`❌ Missing shape IDs:`, missingShapes);
      }
    } else {
      console.log(`✅ VALIDATION PASSED: ${shapesAdded} shapes successfully added to canvas`);
    }
    
    // Track all created shapes for "these shapes" references
    this._trackRecentlyCreated(shapes);
    
    // Final success/failure determination
    const success = shapesAdded >= count;
    if (!success) {
      console.error(`❌ MULTIPLE SHAPES CREATION FAILED:`);
      console.error(`❌ Expected: ${count} shapes`);
      console.error(`❌ Actually added to canvas: ${shapesAdded} shapes`);
      console.error(`❌ This indicates a fundamental issue with shape creation or canvas state management`);
    } else {
      console.log(`✅ MULTIPLE SHAPES CREATION SUCCESS: ${shapesAdded} shapes added to canvas`);
    }
    
    return {
      shapes,
      arrangement,
      shapeType,
      count,
      spacing: calculatedSpacing,
      totalWidth: plan.totalWidth,
      totalHeight: plan.totalHeight,
      actualSpacing: plan.spacing || calculatedSpacing,
      validation: {
        expected: count,
        created: shapes.length,
        actuallyAdded: shapesAdded,
        success: success
      }
    };
  }

  /**
   * Check if two rectangular bounds overlap
   */
  _checkBoundsOverlap(bounds1, bounds2) {
    return !(bounds1.x + bounds1.width < bounds2.x || 
             bounds2.x + bounds2.width < bounds1.x || 
             bounds1.y + bounds1.height < bounds2.y || 
             bounds2.y + bounds2.height < bounds1.y);
  }

  /**
   * Layout Helper Functions for Multi-Object Creation
   */
  
  /**
   * Generate shape specifications for a horizontal row
   */
  generateRowLayout(count, startX, startY, width, height, spacing) {
    const shapes = [];
    for (let i = 0; i < count; i++) {
      shapes.push({
        shapeType: "rectangle",
        x: startX + i * (width + spacing),
        y: startY,
        width,
        height
      });
    }
    return shapes;
  }

  /**
   * Generate shape specifications for a grid
   */
  generateGridLayout(rows, cols, startX, startY, width, height, spacingX, spacingY) {
    const shapes = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        shapes.push({
          shapeType: "rectangle",
          x: startX + col * (width + spacingX),
          y: startY + row * (height + spacingY),
          width,
          height
        });
      }
    }
    return shapes;
  }

  /**
   * Generate shape specifications for even distribution
   */
  generateEvenLayout(count, containerWidth, shapeWidth, y) {
    const spacing = (containerWidth - count * shapeWidth) / (count + 1);
    return this.generateRowLayout(count, spacing, y, shapeWidth, shapeWidth, spacing);
  }

  /**
   * Arrange existing shapes in a row
   */
  async arrangeInRow(shapeIds, startX, startY, spacing) {
    const shapes = [];
    for (const shapeId of shapeIds) {
      const shape = this.findShape(shapeId) || this.findShapeByDescription(shapeId);
      if (shape) shapes.push(shape);
    }
    
    if (shapes.length === 0) {
      throw new Error('No valid shapes found to arrange');
    }
    
    const planner = new SpatialPlanner();
    const shapeWidth = shapes[0].width || 100;
    const shapeHeight = shapes[0].height || 100;
    
    const plan = planner.planRow(shapes.length, shapeWidth, shapeHeight, startX, startY, spacing);
    
    for (let i = 0; i < shapes.length; i++) {
      await this.moveShape(shapes[i].id, plan.positions[i].x, plan.positions[i].y);
    }
    
    return {
      shapeCount: shapes.length,
      arrangement: 'row',
      spacing: plan.spacing,
      totalWidth: plan.totalWidth
    };
  }

  /**
   * Arrange existing shapes in a grid
   */
  async arrangeInGrid(shapeIds, rows, cols, startX, startY, spacingX, spacingY) {
    const shapes = [];
    for (const shapeId of shapeIds) {
      const shape = this.findShape(shapeId) || this.findShapeByDescription(shapeId);
      if (shape) shapes.push(shape);
    }
    
    if (shapes.length === 0) {
      throw new Error('No valid shapes found to arrange');
    }
    
    const planner = new SpatialPlanner();
    const shapeWidth = shapes[0].width || 100;
    const shapeHeight = shapes[0].height || 100;
    
    const plan = planner.planGrid(rows, cols, shapeWidth, shapeHeight, startX, startY, spacingX, spacingY);
    
    for (let i = 0; i < Math.min(shapes.length, plan.positions.length); i++) {
      await this.moveShape(shapes[i].id, plan.positions[i].x, plan.positions[i].y);
    }
    
    return {
      shapeCount: shapes.length,
      arrangement: 'grid',
      rows,
      cols,
      totalWidth: plan.totalWidth,
      totalHeight: plan.totalHeight
    };
  }

  /**
   * Distribute shapes evenly in a container
   */
  async distributeEvenly(shapeIds, containerWidth, direction = 'horizontal') {
    const shapes = [];
    for (const shapeId of shapeIds) {
      const shape = this.findShape(shapeId) || this.findShapeByDescription(shapeId);
      if (shape) shapes.push(shape);
    }
    
    if (shapes.length === 0) {
      throw new Error('No valid shapes found to distribute');
    }
    
    const planner = new SpatialPlanner();
    const shapeWidth = shapes[0].width || 100;
    const startY = shapes[0].y || 0;
    
    const plan = planner.planEvenDistribution(shapes.length, shapeWidth, containerWidth, startY, direction);
    
    for (let i = 0; i < shapes.length; i++) {
      await this.moveShape(shapes[i].id, plan.positions[i].x, plan.positions[i].y);
    }
    
    return {
      shapeCount: shapes.length,
      arrangement: 'even',
      actualSpacing: plan.actualSpacing,
      totalWidth: plan.totalWidth
    };
  }

  /**
   * Center a group of shapes
   */
  async centerGroup(shapeIds, centerX, centerY) {
    const shapes = [];
    for (const shapeId of shapeIds) {
      const shape = this.findShape(shapeId) || this.findShapeByDescription(shapeId);
      if (shape) shapes.push(shape);
    }
    
    if (shapes.length === 0) {
      throw new Error('No valid shapes found to center');
    }
    
    const planner = new SpatialPlanner();
    const shapeWidth = shapes[0].width || 100;
    const shapeHeight = shapes[0].height || 100;
    
    // Get current positions
    const currentPositions = shapes.map(shape => ({ x: shape.x, y: shape.y }));
    
    // Center the group
    const centeredPositions = planner.centerGroup(currentPositions, shapeWidth, shapeHeight, centerX, centerY);
    
    for (let i = 0; i < shapes.length; i++) {
      await this.moveShape(shapes[i].id, centeredPositions[i].x, centeredPositions[i].y);
    }
    
    return {
      shapeCount: shapes.length,
      centerX,
      centerY
    };
  }

  /**
   * Add margin around a group
   */
  async addGroupMargin(shapeIds, marginSize) {
    const shapes = [];
    for (const shapeId of shapeIds) {
      const shape = this.findShape(shapeId) || this.findShapeByDescription(shapeId);
      if (shape) shapes.push(shape);
    }
    
    if (shapes.length === 0) {
      throw new Error('No valid shapes found to add margin to');
    }
    
    const planner = new SpatialPlanner();
    
    // Get current positions
    const currentPositions = shapes.map(shape => ({ x: shape.x, y: shape.y }));
    
    // Add margin
    const marginedPositions = planner.addMargin(currentPositions, marginSize);
    
    for (let i = 0; i < shapes.length; i++) {
      await this.moveShape(shapes[i].id, marginedPositions[i].x, marginedPositions[i].y);
    }
    
    return {
      shapeCount: shapes.length,
      marginSize
    };
  }

  /**
   * ARRANGE SHAPES - Layout function
   */
  async arrangeShapes({ shapeIds, arrangement, centerX, centerY, spacing = 80 }) {
    const shapes = this.canvas.shapes?.filter(s => shapeIds.includes(s.id)) || [];
    if (shapes.length === 0) {
      throw new Error('No valid shapes found to arrange');
    }

    const arrangements = [];
    
    for (let i = 0; i < shapes.length; i++) {
      let x = centerX;
      let y = centerY;
      
      switch (arrangement) {
        case 'row':
          x = centerX + ((i - (shapes.length - 1) / 2) * spacing);
          break;
        case 'column':
          y = centerY + ((i - (shapes.length - 1) / 2) * spacing);
          break;
        case 'grid':
          const cols = Math.ceil(Math.sqrt(shapes.length));
          x = centerX + (((i % cols) - (cols - 1) / 2) * spacing);
          y = centerY + ((Math.floor(i / cols) - (Math.ceil(shapes.length / cols) - 1) / 2) * spacing);
          break;
        case 'circle':
          const angleDegrees = (i / shapes.length) * 360;
          const angleRadians = (angleDegrees * Math.PI) / 180;
          const radius = spacing;
          x = centerX + Math.cos(angleRadians) * radius;
          y = centerY + Math.sin(angleRadians) * radius;
          break;
      }
      
      await this.moveShape(shapes[i].id, x, y);
      arrangements.push({ shapeId: shapes[i].id, x, y });
    }
    
    return arrangements;
  }

  /**
   * CREATE LOGIN FORM - Professional form using blueprint system
   */
  async createLoginForm({ x, y, width = 360 } = {}) {
    // Use createLoginFormWithLayout which uses the blueprint system
    return await this.createLoginFormWithLayout();
  }

  /**
   * CREATE NAVIGATION BAR - Enhanced professional navigation
   */
  async createNavigationBar({ x, y, menuItems, width = 600 }) {
    // Use viewport center if no position specified
    if (x === undefined || y === undefined) {
      const center = this.getViewportCenter();
      x = x ?? center.x - width / 2;
      y = y ?? center.y - 200;
    }
    
    // Enhanced navigation dimensions
    const navHeight = 60;
    const itemWidth = width / menuItems.length;
    const padding = 20;
    
    // Check for collisions and adjust position if needed
    const safePosition = this.findSafePosition(x, y, width, navHeight);
    const adjustedX = safePosition.x;
    const adjustedY = safePosition.y;
    
    if (safePosition.adjusted) {
    }
    
    const navElements = [];
    
    // Navigation shadow for depth
    const navShadow = await this.createShape({
      shapeType: SHAPE_TYPES.RECTANGLE,
      x: adjustedX + 2,
      y: adjustedY + 2,
      width: width,
      height: navHeight,
      fill: '#F3F4F6',
    });
    navElements.push(navShadow);
    
    // Main navigation background
    const navBg = await this.createShape({
      shapeType: SHAPE_TYPES.RECTANGLE,
      x: adjustedX,
      y: adjustedY,
      width: width,
      height: navHeight,
      fill: '#FFFFFF',
      stroke: '#E5E7EB',
      strokeWidth: 1,
    });
    navElements.push(navBg);
    
    // Set proper z-index for layering
    navBg.zIndex = 10;
    navShadow.zIndex = 5;
    
    // Menu items with enhanced styling
    for (let i = 0; i < menuItems.length; i++) {
      const itemX = adjustedX + (i * itemWidth) + itemWidth/2;
      const itemY = adjustedY + navHeight/2;
      
      // Menu item background (subtle hover effect)
      const itemBg = await this.createShape({
        shapeType: SHAPE_TYPES.RECTANGLE,
        x: adjustedX + (i * itemWidth) + 5,
        y: adjustedY + 5,
        width: itemWidth - 10,
        height: navHeight - 10,
        fill: '#F8FAFC',
        stroke: '#E2E8F0',
        strokeWidth: 1,
      });
      navElements.push(itemBg);
      
      // Menu item text
      const menuText = await this.createShape({
        shapeType: SHAPE_TYPES.TEXT,
        x: itemX - (menuItems[i].length * 4), // Better text centering
        y: itemY - 8,
        text: menuItems[i],
        fontSize: 16,
        fill: '#1F2937',
      });
      navElements.push(menuText);
    }
    
    // Optional: Add logo/brand area
    const logoArea = await this.createShape({
      shapeType: SHAPE_TYPES.TEXT,
      x: adjustedX + 20,
      y: adjustedY + 20,
      text: 'Brand',
      fontSize: 20,
      fill: '#3B82F6',
    });
    navElements.push(logoArea);
    
    // Track all navigation elements for "these shapes" references
    this._trackRecentlyCreated(navElements);
    
    return { components: navElements };
  }

  /**
   * CREATE CARD LAYOUT - Enhanced card with image, title, and description
   */
  async createCardLayout({ x, y, title, content = '', image = '', width = 280, height = 320 }) {
    // Use viewport center if no position specified
    if (x === undefined || y === undefined) {
      const center = this.getViewportCenter();
      x = x ?? center.x - width / 2;
      y = y ?? center.y - height / 2;
    }
    
    // Enhanced card dimensions
    const cardPadding = 20;
    const imageHeight = 120;
    const titleHeight = 40;
    const contentHeight = height - imageHeight - titleHeight - (cardPadding * 3);
    
    // Check for collisions and adjust position if needed
    const safePosition = this.findSafePosition(x, y, width, height);
    const adjustedX = safePosition.x;
    const adjustedY = safePosition.y;
    
    if (safePosition.adjusted) {
    }
    
    const cardElements = [];
    
    // Card shadow for depth
    const cardShadow = await this.createShape({
      shapeType: SHAPE_TYPES.RECTANGLE,
      x: adjustedX + 3,
      y: adjustedY + 3,
      width: width,
      height: height,
      fill: '#F3F4F6',
    });
    cardElements.push(cardShadow);
    
    // Main card background
    const cardBg = await this.createShape({
      shapeType: SHAPE_TYPES.RECTANGLE,
      x: adjustedX,
      y: adjustedY,
      width: width,
      height: height,
      fill: '#FFFFFF',
      stroke: '#E5E7EB',
      strokeWidth: 1,
    });
    cardElements.push(cardBg);
    
    // Set proper z-index for layering
    cardBg.zIndex = 10;
    cardShadow.zIndex = 5;
    
    let currentY = adjustedY + cardPadding;
    
    // Image placeholder/area
    if (image) {
      // Image background
      const imageBg = await this.createShape({
        shapeType: SHAPE_TYPES.RECTANGLE,
        x: adjustedX + cardPadding,
        y: currentY,
        width: width - (cardPadding * 2),
        height: imageHeight,
        fill: '#F8FAFC',
        stroke: '#E2E8F0',
        strokeWidth: 1,
      });
      cardElements.push(imageBg);
      
      // Image placeholder text
      const imagePlaceholder = await this.createShape({
        shapeType: SHAPE_TYPES.TEXT,
        x: adjustedX + width/2 - 30,
        y: currentY + imageHeight/2 - 8,
        text: '📷 Image',
        fontSize: 16,
        fill: '#9CA3AF',
      });
      cardElements.push(imagePlaceholder);
    } else {
      // Default image placeholder
      const imageBg = await this.createShape({
        shapeType: SHAPE_TYPES.RECTANGLE,
        x: adjustedX + cardPadding,
        y: currentY,
        width: width - (cardPadding * 2),
        height: imageHeight,
        fill: '#F8FAFC',
        stroke: '#E2E8F0',
        strokeWidth: 1,
      });
      cardElements.push(imageBg);
      
      const imagePlaceholder = await this.createShape({
        shapeType: SHAPE_TYPES.TEXT,
        x: adjustedX + width/2 - 25,
        y: currentY + imageHeight/2 - 8,
        text: '📷 Image',
        fontSize: 16,
        fill: '#9CA3AF',
      });
      cardElements.push(imagePlaceholder);
    }
    
    currentY += imageHeight + 15;
    
    // Title section
    const titleText = await this.createShape({
      shapeType: SHAPE_TYPES.TEXT,
      x: adjustedX + cardPadding,
      y: currentY,
      text: title,
      fontSize: 20,
      fill: '#1F2937',
    });
    cardElements.push(titleText);
    currentY += titleHeight;
    
    // Content/Description section
    if (content) {
      const contentText = await this.createShape({
        shapeType: SHAPE_TYPES.TEXT,
        x: adjustedX + cardPadding,
        y: currentY,
        text: content,
        fontSize: 14,
        fill: '#6B7280',
      });
      cardElements.push(contentText);
    } else {
      // Default description
      const defaultContent = await this.createShape({
        shapeType: SHAPE_TYPES.TEXT,
        x: adjustedX + cardPadding,
        y: currentY,
        text: 'This is a sample card description that provides additional context and information about the content.',
        fontSize: 14,
        fill: '#6B7280',
      });
      cardElements.push(defaultContent);
    }
    
    // Optional: Add action button
    currentY = adjustedY + height - 50;
    const actionButton = await this.createShape({
      shapeType: SHAPE_TYPES.RECTANGLE,
      x: adjustedX + cardPadding,
      y: currentY,
      width: width - (cardPadding * 2),
      height: 35,
      fill: '#3B82F6',
      stroke: '#2563EB',
      strokeWidth: 1,
    });
    cardElements.push(actionButton);
    
    const buttonText = await this.createShape({
      shapeType: SHAPE_TYPES.TEXT,
      x: adjustedX + width/2 - 25,
      y: currentY + 10,
      text: 'Learn More',
      fontSize: 14,
      fill: '#FFFFFF',
    });
    cardElements.push(buttonText);
    
    // Track all card elements for "these shapes" references
    this._trackRecentlyCreated(cardElements);
    
    return { components: cardElements };
  }

  /**
   * DELETE SHAPE - Utility function (supports friendly IDs)
   */
  async deleteShape(shapeIdInput) {
    // Try natural language description first, then fall back to ID
    let shape = this.findShapeByDescription(shapeIdInput);
    if (!shape) {
      shape = this.findShape(shapeIdInput);
    }
    
    if (!shape) {
      throw new Error(`Shape not found: "${shapeIdInput}". Try describing it by color and type (e.g., "blue rectangle").`);
    }

    const description = this.getShapeDescription(shape);
    await this.canvas.deleteShape(shape.id);
    return {
      shapeId: shape.id, 
      description: description, 
      deleted: true 
    };
  }

  // ========================================
  // LAYOUT HELPER FUNCTIONS
  // ========================================

  /**
   * Get center position of the canvas
   */
  getCenterPosition(canvasWidth = 800, canvasHeight = 600) {
    return {
      x: Math.floor(canvasWidth / 2),
      y: Math.floor(canvasHeight / 2)
    };
  }

  /**
   * Arrange selected shapes in a horizontal row
   * Returns error if no shapes selected
   */
  async arrangeInRow(spacing = 50) {
    const selectedShapes = this.canvas.getSelectedShapes();
    
    if (!selectedShapes || selectedShapes.length === 0) {
      throw new Error('No shapes selected. Please select shapes first to arrange them.');
    }
    
    // Sort by current x position
    selectedShapes.sort((a, b) => a.x - b.x);
    
    // Calculate total width needed
    const totalWidth = selectedShapes.reduce((sum, shape) => sum + (shape.width || 100), 0);
    const totalSpacing = (selectedShapes.length - 1) * spacing;
    const totalNeeded = totalWidth + totalSpacing;
    
    // Start position (centered)
    const startX = 400 - (totalNeeded / 2);
    let currentX = startX;
    
    const results = [];
    for (const shape of selectedShapes) {
      const shapeWidth = shape.width || 100;
      const y = 300; // Center vertically
      
      await this.canvas.updateShape(shape.id, { x: currentX, y: y });
      results.push({ shapeId: shape.id, newPosition: { x: currentX, y: y }});
      
      currentX += shapeWidth + spacing;
    }
    
    return {
      success: true,
      shapesArranged: selectedShapes.length,
      pattern: 'horizontal_row',
      results: results
    };
  }

  /**
   * Create a grid of shapes
   */
  async createGrid(rows, columns, shapeType = 'rectangle', spacing = 50) {
    const shapes = [];
    const cellWidth = 100;
    const cellHeight = 100;
    
    const gridWidth = (columns * cellWidth) + ((columns - 1) * spacing);
    const gridHeight = (rows * cellHeight) + ((rows - 1) * spacing);
    
    const startX = 400 - (gridWidth / 2);
    const startY = 300 - (gridHeight / 2);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = startX + (col * (cellWidth + spacing));
        const y = startY + (row * (cellHeight + spacing));
        
        const shape = await this.createShape(shapeType, { x, y, width: cellWidth, height: cellHeight });
        shapes.push(shape);
      }
    }
    
    this._trackRecentlyCreated(shapes);
    
    return {
      success: true,
      shapesCreated: shapes.length,
      pattern: 'grid',
      rows: rows,
      columns: columns,
      shapes: shapes
    };
  }

  /**
   * Distribute selected shapes evenly across available space
   */
  async distributeEvenly(direction = 'horizontal') {
    const selectedShapes = this.canvas.getSelectedShapes();
    
    if (!selectedShapes || selectedShapes.length < 2) {
      throw new Error('Please select at least 2 shapes to distribute evenly.');
    }
    
    // Sort shapes by position
    selectedShapes.sort((a, b) => {
      return direction === 'horizontal' ? a.x - b.x : a.y - b.y;
    });
    
    const first = selectedShapes[0];
    const last = selectedShapes[selectedShapes.length - 1];
    const totalSpace = direction === 'horizontal' 
      ? last.x - first.x 
      : last.y - first.y;
    
    const spacing = totalSpace / (selectedShapes.length - 1);
    
    const results = [];
    for (let i = 1; i < selectedShapes.length - 1; i++) {
      const shape = selectedShapes[i];
      const newPos = direction === 'horizontal'
        ? { x: first.x + (spacing * i), y: shape.y }
        : { x: shape.x, y: first.y + (spacing * i) };
      
      await this.canvas.updateShape(shape.id, newPos);
      results.push({ shapeId: shape.id, newPosition: newPos });
    }
    
    return {
      success: true,
      shapesDistributed: selectedShapes.length,
      direction: direction,
      results: results
    };
  }

  /**
   * Arrange shapes in a horizontal row
   */
  async arrangeInRow(shapeIds, spacing = 50) {
    if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
      throw new Error('Shape IDs array is required for row arrangement');
    }

    const shapes = [];
    for (const shapeId of shapeIds) {
      const shape = this.findShape(shapeId);
      if (shape) shapes.push(shape);
    }

    if (shapes.length === 0) {
      throw new Error('No valid shapes found for arrangement');
    }

    // Calculate total width needed
    const totalWidth = shapes.reduce((sum, shape) => sum + (shape.width || 100), 0);
    const totalSpacing = (shapes.length - 1) * spacing;
    const totalNeeded = totalWidth + totalSpacing;
    
    // Start position (centered)
    const startX = 400 - (totalNeeded / 2);
    let currentX = startX;

    const results = [];
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      const shapeWidth = shape.width || 100;
      
      // Center the shape vertically
      const centerY = 300;
      const shapeHeight = shape.height || 100;
      const y = centerY - (shapeHeight / 2);
      
      await this.canvas.updateShape(shape.id, { x: currentX, y: y });
      results.push({
        shapeId: shape.id,
        newPosition: { x: currentX, y: y }
      });
      
      currentX += shapeWidth + spacing;
    }

    return {
      pattern: 'row',
      shapeCount: shapes.length,
      spacing: spacing,
      results: results
    };
  }

  /**
   * Create a grid layout of shapes
   */
  async createGridLayout(rows, columns, spacing = 50, shapeType = 'rectangle', shapeProps = {}) {
    if (rows <= 0 || columns <= 0) {
      throw new Error('Rows and columns must be positive numbers');
    }

    const totalShapes = rows * columns;
    const shapes = [];
    
    // Calculate grid dimensions
    const cellWidth = 100; // Default shape width
    const cellHeight = 100; // Default shape height
    const gridWidth = (columns * cellWidth) + ((columns - 1) * spacing);
    const gridHeight = (rows * cellHeight) + ((rows - 1) * spacing);
    
    // Start position (centered)
    const startX = 400 - (gridWidth / 2);
    const startY = 300 - (gridHeight / 2);

    // Create shapes in grid pattern
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = startX + (col * (cellWidth + spacing));
        const y = startY + (row * (cellHeight + spacing));
        
        const shapePropsWithPosition = {
          ...shapeProps,
          x,
          y,
          width: cellWidth,
          height: cellHeight
        };
        
        const shape = await this.createShape(shapeType, shapePropsWithPosition);
        shapes.push(shape);
      }
    }

    // Track all created shapes
    this._trackRecentlyCreated(shapes);

    return {
      pattern: 'grid',
      rows: rows,
      columns: columns,
      totalShapes: totalShapes,
      spacing: spacing,
      shapes: shapes
    };
  }

  /**
   * Arrange shapes in a circular pattern
   */
  async arrangeInCircle(shapeIds, radius = 150, centerX = 0, centerY = 0) {
    if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
      throw new Error('Shape IDs array is required for circle arrangement');
    }

    const shapes = [];
    for (const shapeId of shapeIds) {
      const shape = this.findShape(shapeId);
      if (shape) shapes.push(shape);
    }

    if (shapes.length === 0) {
      throw new Error('No valid shapes found for arrangement');
    }

    const results = [];
    const angleStepDegrees = 360 / shapes.length;

    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      const angleDegrees = i * angleStepDegrees;
      const angleRadians = (angleDegrees * Math.PI) / 180;
      
      const x = centerX + (radius * Math.cos(angleRadians));
      const y = centerY + (radius * Math.sin(angleRadians));
      
      await this.canvas.updateShape(shape.id, { x: x, y: y });
      results.push({
        shapeId: shape.id,
        newPosition: { x: x, y: y }
      });
    }

    return {
      pattern: 'circle',
      shapeCount: shapes.length,
      radius: radius,
      center: { x: centerX, y: centerY },
      results: results
    };
  }

  /**
   * Distribute shapes evenly in available space
   */
  async distributeEvenly(shapeIds, bounds = { x: 100, y: 100, width: 600, height: 400 }) {
    if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
      throw new Error('Shape IDs array is required for distribution');
    }

    const shapes = [];
    for (const shapeId of shapeIds) {
      const shape = this.findShape(shapeId);
      if (shape) shapes.push(shape);
    }

    if (shapes.length === 0) {
      throw new Error('No valid shapes found for distribution');
    }

    // Calculate optimal spacing
    const totalShapes = shapes.length;
    const availableWidth = bounds.width;
    const availableHeight = bounds.height;
    
    // Try to create a roughly square grid
    const cols = Math.ceil(Math.sqrt(totalShapes));
    const rows = Math.ceil(totalShapes / cols);
    
    const cellWidth = availableWidth / cols;
    const cellHeight = availableHeight / rows;

    const results = [];
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      const x = bounds.x + (col * cellWidth) + (cellWidth / 2);
      const y = bounds.y + (row * cellHeight) + (cellHeight / 2);
      
      await this.canvas.updateShape(shape.id, { x: x, y: y });
      results.push({
        shapeId: shape.id,
        newPosition: { x: x, y: y }
      });
    }

    return {
      pattern: 'distributed',
      shapeCount: shapes.length,
      grid: { rows, cols },
      bounds: bounds,
      results: results
    };
  }

  // ========================================
  // DESIGN SYSTEM & QUALITY TOOLS
  // ========================================

  /**
   * Auto-align UI elements to grid and fix common issues
   */
  async autoAlignUI() {
    const state = this.getCanvasState();
    let alignedCount = 0;
    
    for (const shape of state.shapes) {
      const snappedX = Math.round(shape.x / 8) * 8;
      const snappedY = Math.round(shape.y / 8) * 8;
      
      if (snappedX !== shape.x || snappedY !== shape.y) {
        await this.moveShape(shape.id, snappedX, snappedY);
        alignedCount++;
      }
    }
    
    return {
      success: true,
      message: `Aligned ${alignedCount} shapes to 8px grid`,
      alignedCount
    };
  }

  /**
   * Check UI quality and return issues
   */
  async checkUIQuality() {
    const { checkUIQuality } = await import('../canvas/quality.js');
    return await checkUIQuality(this);
  }

  /**
   * Auto-fix UI issues
   */
  async autoFixUI() {
    const { autoFixUI } = await import('../canvas/quality.js');
    return await autoFixUI(this);
  }

  /**
   * Layout shapes in a stack (vertical or horizontal)
   */
  async layoutStack({ direction = 'vertical', gap = 16, shapeIds = [] }) {
    if (shapeIds.length === 0) {
      const selectedShapes = this.canvas.getSelectedShapes();
      if (selectedShapes.length === 0) {
        throw new Error('No shapes selected for layout');
      }
      shapeIds = selectedShapes.map(s => s.id);
    }

    const shapes = shapeIds.map(id => this.canvas.getShape(id)).filter(Boolean);
    if (shapes.length === 0) {
      throw new Error('No valid shapes found for layout');
    }

    const startX = 400 - (shapes.reduce((sum, s) => sum + (s.width || 100), 0) + (shapes.length - 1) * gap) / 2;
    const startY = 300 - (shapes.reduce((sum, s) => sum + (s.height || 100), 0) + (shapes.length - 1) * gap) / 2;

    const results = [];
    let currentX = startX;
    let currentY = startY;

    for (const shape of shapes) {
      await this.moveShape(shape.id, currentX, currentY);
      results.push({ shapeId: shape.id, newPosition: { x: currentX, y: currentY } });
      
      if (direction === 'horizontal') {
        currentX += (shape.width || 100) + gap;
      } else {
        currentY += (shape.height || 100) + gap;
      }
    }

    return {
      success: true,
      direction,
      shapesArranged: shapes.length,
      results
    };
  }

  /**
   * Layout shapes in a grid
   */
  async layoutGrid({ rows, cols, gap = 16, shapeIds = [] }) {
    if (shapeIds.length === 0) {
      const selectedShapes = this.canvas.getSelectedShapes();
      if (selectedShapes.length === 0) {
        throw new Error('No shapes selected for grid layout');
      }
      shapeIds = selectedShapes.map(s => s.id);
    }

    const shapes = shapeIds.map(id => this.canvas.getShape(id)).filter(Boolean);
    if (shapes.length === 0) {
      throw new Error('No valid shapes found for grid layout');
    }

    const cellWidth = 100;
    const cellHeight = 100;
    const gridWidth = (cols * cellWidth) + ((cols - 1) * gap);
    const gridHeight = (rows * cellHeight) + ((rows - 1) * gap);
    
    const startX = 400 - (gridWidth / 2);
    const startY = 300 - (gridHeight / 2);

    const results = [];
    for (let i = 0; i < Math.min(shapes.length, rows * cols); i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = startX + (col * (cellWidth + gap));
      const y = startY + (row * (cellHeight + gap));
      
      await this.moveShape(shapes[i].id, x, y);
      results.push({ shapeId: shapes[i].id, newPosition: { x, y } });
    }

    return {
      success: true,
      grid: { rows, cols },
      shapesArranged: Math.min(shapes.length, rows * cols),
      results
    };
  }

  /**
   * Get current selection or recent shapes
   */
  getSelection() {
    const selectedShapes = this.canvas.getSelectedShapes();
    if (selectedShapes.length > 0) {
      return {
        type: 'selected',
        shapes: selectedShapes,
        count: selectedShapes.length
      };
    }

    // Return recently created shapes if no selection
    const recentShapes = this.recentlyCreated.slice(-5); // Last 5 created
    return {
      type: 'recent',
      shapes: recentShapes,
      count: recentShapes.length
    };
  }

  /**
   * Enhanced validation with pre/post-action checks
   */
  async validateAndFix(operationType) {
    const state = this.getCanvasState();
    const issues = [];
    
    // 1. Alignment check
    if (operationType === 'form' || operationType === 'card') {
      const containers = this._identifyContainers(state.shapes);
      containers.forEach(container => {
        const children = container.children;
        const inputs = children.filter(c => c.type === 'rectangle' && c.height <= 50);
        
        // Check input alignment
        const xPositions = inputs.map(i => i.x);
        const uniqueX = [...new Set(xPositions)];
        if (uniqueX.length > 1) {
          issues.push({
            type: 'misalignment',
            severity: 'high',
            fix: () => this._alignLeft(inputs, container.bounds.left)
          });
        }
        
        // Check input width consistency
        const widths = inputs.map(i => i.width);
        const uniqueWidths = [...new Set(widths)];
        if (uniqueWidths.length > 1) {
          issues.push({
            type: 'inconsistent_width',
            severity: 'medium',
            fix: () => this._setConsistentWidth(inputs, Math.max(...widths))
          });
        }
      });
    }
    
    // 2. Spacing check
    const spacing = this._analyzeSpacing(state.shapes);
    spacing.forEach(gap => {
      if (gap.gap < 16 || gap.gap > 32) {
        issues.push({
          type: 'inconsistent_spacing',
          severity: 'medium',
          fix: () => this._adjustSpacing(gap.elements, 24)
        });
      }
    });
    
    // 3. Contrast check
    const textShapes = state.shapes.filter(s => s.type === 'text');
    textShapes.forEach(text => {
      const contrast = this._calculateContrast(text.fill, text.background || '#FFFFFF');
      if (contrast < 4.5) {
        issues.push({
          type: 'low_contrast',
          severity: 'high',
          fix: () => this.changeShapeColor(text.id, '#111827')
        });
      }
    });
    
    // Apply fixes for high-severity issues
    const criticalIssues = issues.filter(i => i.severity === 'high');
    for (const issue of criticalIssues) {
      await issue.fix();
    }
    
    return {
      valid: criticalIssues.length === 0,
      issues: issues,
      fixesApplied: criticalIssues.length
    };
  }

  /**
   * Helper: Align shapes to left edge
   */
  async _alignLeft(shapes, leftX) {
    for (const shape of shapes) {
      await this.moveShape(shape.id, leftX, shape.y);
    }
  }

  /**
   * Helper: Set consistent width for shapes
   */
  async _setConsistentWidth(shapes, width) {
    for (const shape of shapes) {
      await this.resizeShape(shape.id, { width });
    }
  }

  /**
   * Helper: Adjust spacing between elements
   */
  async _adjustSpacing(elements, targetGap) {
    if (elements.length < 2) return;
    
    const sorted = elements.sort((a, b) => a.y - b.y);
    let currentY = sorted[0].y + (sorted[0].height || 0);
    
    for (let i = 1; i < sorted.length; i++) {
      currentY += targetGap;
      await this.moveShape(sorted[i].id, sorted[i].x, currentY);
      currentY += sorted[i].height || 0;
    }
  }

  /**
   * Helper: Calculate contrast ratio
   */
  _calculateContrast(color1, color2) {
    const l1 = this._getLuminance(color1);
    const l2 = this._getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Helper: Get relative luminance
   */
  _getLuminance(hex) {
    const rgb = this._hexToRgb(hex);
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Helper: Convert hex to RGB
   */
  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }

  /**
   * Validate UI layout quality - checks alignment, contrast, spacing, and layout model compliance
   */
  async validateUILayout() {
    const state = this.getCanvasState();
    const issues = [];
    const shapes = state.shapes;
    
    if (shapes.length === 0) {
      return {
        valid: true,
        issues: [],
        score: 100,
        message: 'No shapes to validate'
      };
    }

    // Group shapes by type for analysis
    const textShapes = shapes.filter(s => s.type === 'text');
    const rectangles = shapes.filter(s => s.type === 'rectangle');
    const inputs = shapes.filter(s => s.type === 'text_input' || s.type === 'rectangle');
    
    // 1. Check text contrast (WCAG 4.5:1 minimum)
    textShapes.forEach(text => {
      const textColor = text.fill || '#000000';
      const bgColor = text.background || '#FFFFFF';
      const contrast = this._calculateContrast(textColor, bgColor);
      
      if (contrast < 4.5) {
        issues.push({
          type: 'contrast',
          severity: 'high',
          message: `Text "${text.text || 'unnamed'}" has low contrast (${contrast.toFixed(1)}:1) - WCAG requires 4.5:1`,
          shapeId: text.id,
          fix: `Change text color to high contrast color (#111827 recommended)`
        });
      }
    });

    // 2. Check font sizes (minimum 14px for labels, 16px for body)
    textShapes.forEach(text => {
      const fontSize = text.fontSize || 16;
      const textContent = text.text || '';
      
      // Check if it's a label (short text, likely a label)
      const isLabel = textContent.length < 20 && !textContent.includes(' ');
      const minSize = isLabel ? 14 : 16;
      
      if (fontSize < minSize) {
        issues.push({
          type: 'font_size',
          severity: 'medium',
          message: `Text "${textContent}" font size too small (${fontSize}px) - minimum ${minSize}px required`,
          shapeId: text.id,
          fix: `Increase font size to at least ${minSize}px`
        });
      }
    });

    // 3. Check alignment issues (labels aligned with inputs)
    const alignmentIssues = this._checkAlignment(shapes);
    issues.push(...alignmentIssues);

    // 4. Check spacing consistency (24px between elements)
    const spacingIssues = this._checkSpacing(shapes);
    issues.push(...spacingIssues);

    // 5. Check for overlapping elements
    const overlapIssues = this._checkOverlaps(shapes);
    issues.push(...overlapIssues);

    // 6. Check layout model compliance (forms should be in containers)
    const layoutIssues = this._checkLayoutModel(shapes);
    issues.push(...layoutIssues);

    // 7. Check input field consistency (same width and alignment)
    const inputIssues = this._checkInputConsistency(shapes);
    issues.push(...inputIssues);

    const score = Math.max(0, 100 - (issues.length * 8));
    const valid = issues.filter(i => i.severity === 'high').length === 0;

    return {
      valid,
      issues,
      score,
      message: valid ? 'UI layout is valid and follows design system' : `Found ${issues.length} issues that need attention`
    };
  }

  /**
   * Calculate contrast ratio between two colors
   */
  _calculateContrast(color1, color2) {
    const getLuminance = (hex) => {
      const rgb = hex.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16) / 255);
      return rgb.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
        .reduce((a, b, i) => a + b * [0.2126, 0.7152, 0.0722][i], 0);
    };
    
    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  /**
   * Check alignment issues
   */
  _checkAlignment(shapes) {
    const issues = [];
    const textShapes = shapes.filter(s => s.type === 'text');
    const rectangles = shapes.filter(s => s.type === 'rectangle');
    
    // Check if labels are aligned with inputs
    textShapes.forEach(label => {
      if (label.text && label.text.length < 20) { // Likely a label
        const nearbyInputs = rectangles.filter(rect => 
          Math.abs(rect.x - label.x) < 200 && 
          Math.abs(rect.y - label.y) < 50
        );
        
        if (nearbyInputs.length > 0) {
          const input = nearbyInputs[0];
          if (Math.abs(label.x - input.x) > 20) {
            issues.push({
              type: 'alignment',
              severity: 'medium',
              message: `Label "${label.text}" not aligned with input field`,
              shapeId: label.id,
              fix: `Align label with input field (${input.x}, ${input.y})`
            });
          }
        }
      }
    });

    return issues;
  }

  /**
   * Check spacing consistency
   */
  _checkSpacing(shapes) {
    const issues = [];
    const sortedShapes = shapes.sort((a, b) => a.y - b.y);
    
    for (let i = 1; i < sortedShapes.length; i++) {
      const prev = sortedShapes[i - 1];
      const current = sortedShapes[i];
      const spacing = current.y - (prev.y + (prev.height || 20));
      
      if (spacing < 8) {
        issues.push({
          type: 'spacing',
          severity: 'medium',
          message: `Elements too close together (${spacing}px gap)`,
          shapeId: current.id,
          fix: `Increase spacing to at least 16px`
        });
      }
    }

    return issues;
  }

  /**
   * Check for overlapping elements
   */
  _checkOverlaps(shapes) {
    const issues = [];
    
    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        const shape1 = shapes[i];
        const shape2 = shapes[j];
        
        if (this._shapesOverlap(shape1, shape2)) {
          issues.push({
            type: 'overlap',
            severity: 'high',
            message: `Elements overlap: ${shape1.type} and ${shape2.type}`,
            shapeId: shape1.id,
            fix: `Move elements apart to prevent overlap`
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check if two shapes overlap
   */
  _shapesOverlap(shape1, shape2) {
    const x1 = shape1.x;
    const y1 = shape1.y;
    const w1 = shape1.width || 100;
    const h1 = shape1.height || 100;
    
    const x2 = shape2.x;
    const y2 = shape2.y;
    const w2 = shape2.width || 100;
    const h2 = shape2.height || 100;
    
    return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
  }

  /**
   * Check layout model compliance (forms should be in containers)
   */
  _checkLayoutModel(shapes) {
    const issues = [];
    const rectangles = shapes.filter(s => s.type === 'rectangle');
    const textShapes = shapes.filter(s => s.type === 'text');
    
    // Check if we have form elements without a container
    const hasFormElements = textShapes.some(t => 
      t.text && (t.text.toLowerCase().includes('username') || 
                 t.text.toLowerCase().includes('password') ||
                 t.text.toLowerCase().includes('login'))
    );
    
    if (hasFormElements) {
      // Check if there's a container (large rectangle that could be a form container)
      const containers = rectangles.filter(r => r.width >= 300 && r.height >= 200);
      
      if (containers.length === 0) {
        issues.push({
          type: 'layout_model',
          severity: 'high',
          message: 'Form elements detected but no container found - forms should be grouped in containers',
          shapeId: null,
          fix: 'Create a FormContainer to group form elements together'
        });
      }
    }
    
    return issues;
  }

  /**
   * Check input field consistency (same width and alignment)
   */
  _checkInputConsistency(shapes) {
    const issues = [];
    const rectangles = shapes.filter(s => s.type === 'rectangle');
    const textShapes = shapes.filter(s => s.type === 'text');
    
    // Find input fields (rectangles that are likely inputs)
    const inputFields = rectangles.filter(r => 
      r.width >= 200 && r.width <= 400 && r.height >= 30 && r.height <= 50
    );
    
    if (inputFields.length > 1) {
      // Check if all inputs have the same width
      const widths = inputFields.map(f => f.width);
      const uniqueWidths = [...new Set(widths)];
      
      if (uniqueWidths.length > 1) {
        issues.push({
          type: 'input_consistency',
          severity: 'medium',
          message: `Input fields have inconsistent widths (${uniqueWidths.join(', ')}px)`,
          shapeId: inputFields[0].id,
          fix: 'Make all input fields the same width (280px recommended)'
        });
      }
      
      // Check if all inputs are aligned horizontally
      const xPositions = inputFields.map(f => f.x);
      const uniqueXPositions = [...new Set(xPositions)];
      
      if (uniqueXPositions.length > 1) {
        issues.push({
          type: 'input_alignment',
          severity: 'medium',
          message: `Input fields are not aligned horizontally`,
          shapeId: inputFields[0].id,
          fix: 'Align all input fields to the same x position'
        });
      }
    }
    
    return issues;
  }

  // ========================================
  // LAYOUT MODEL UTILITIES
  // ========================================

  /**
   * Create a FormContainer - a centered container for form elements
   */
  async createFormContainer(width = 360, height = 400, centerX = 0, centerY = 0) {
    try {
      // Get viewport center if not provided
      if (centerX === undefined || centerY === undefined) {
        const center = this.getViewportCenter();
        centerX = centerX ?? center.x;
        centerY = centerY ?? center.y;
      }
      
      console.log('📦 Creating form container...', { width, height, centerX, centerY });
      const container = await this.createShape({
        shapeType: 'rectangle',
        x: centerX,
        y: centerY,
        width: width,
        height: height,
        fill: '#F9FAFB',
        stroke: '#E5E7EB',
        strokeWidth: 2,
        zIndex: 1  // Ensure it's behind other elements
      });
      
      console.log(`📦 Container created at (${centerX}, ${centerY}) with size ${width}x${height}`);
      
      return {
        id: container.id,
        x: centerX,
        y: centerY,
        width: width,
        height: height,
        leftEdge: centerX - width / 2,
        rightEdge: centerX + width / 2,
        topEdge: centerY - height / 2,
        bottomEdge: centerY + height / 2
      };
    } catch (error) {
      console.error('❌ Error creating form container:', error);
      throw error;
    }
  }

  /**
   * Stack elements vertically within a container
   */
  async stackVertically(elements, container, startY, gap = 24) {
    const results = [];
    let currentY = startY;
    
    for (const element of elements) {
      const elementWidth = element.width || 280;
      const elementHeight = element.height || 40;
      
      // Center horizontally within container
      const x = container.x;
      const y = currentY;
      
      // Update element position
      await this.canvas.updateShape(element.id, { x, y });
      
      results.push({
        id: element.id,
        x: x,
        y: y,
        width: elementWidth,
        height: elementHeight
      });
      
      currentY += elementHeight + gap;
    }
    
    return results;
  }

  /**
   * Align elements horizontally at the same x position
   */
  async alignHorizontally(elements, centerX, startY, gap = 16) {
    const results = [];
    let currentY = startY;
    
    for (const element of elements) {
      const elementWidth = element.width || 280;
      const elementHeight = element.height || 40;
      
      // Center horizontally
      const x = centerX;
      const y = currentY;
      
      // Update element position
      await this.canvas.updateShape(element.id, { x, y });
      
      results.push({
        id: element.id,
        x: x,
        y: y,
        width: elementWidth,
        height: elementHeight
      });
      
      currentY += elementHeight + gap;
    }
    
    return results;
  }

  /**
   * Center a container on the canvas
   */
  centerContainer(width, height, canvasWidth = 800, canvasHeight = 600) {
    return {
      x: Math.floor(canvasWidth / 2),
      y: Math.floor(canvasHeight / 2),
      leftEdge: Math.floor(canvasWidth / 2) - Math.floor(width / 2),
      rightEdge: Math.floor(canvasWidth / 2) + Math.floor(width / 2),
      topEdge: Math.floor(canvasHeight / 2) - Math.floor(height / 2),
      bottomEdge: Math.floor(canvasHeight / 2) + Math.floor(height / 2)
    };
  }

  /**
   * Place a shape directly below another shape with specified gap
   */
  async placeBelow(shapeId, referenceShapeId, gap = 24) {
    const shape = this.getCurrentShapes().find(s => s.id === shapeId);
    const referenceShape = this.getCurrentShapes().find(s => s.id === referenceShapeId);
    
    if (!shape || !referenceShape) {
      throw new Error(`Shape not found: ${shapeId} or ${referenceShapeId}`);
    }
    
    const newY = referenceShape.y + (referenceShape.height || 0) + gap;
    await this.moveShape(shapeId, shape.x, newY);
    
    return {
      success: true,
      message: `Placed ${shapeId} below ${referenceShapeId} with ${gap}px gap`,
      newPosition: { x: shape.x, y: newY }
    };
  }

  /**
   * Place a shape to the right of another shape with specified gap
   */
  async placeRightOf(shapeId, referenceShapeId, gap = 16) {
    const shape = this.getCurrentShapes().find(s => s.id === shapeId);
    const referenceShape = this.getCurrentShapes().find(s => s.id === referenceShapeId);
    
    if (!shape || !referenceShape) {
      throw new Error(`Shape not found: ${shapeId} or ${referenceShapeId}`);
    }
    
    const newX = referenceShape.x + (referenceShape.width || 0) + gap;
    await this.moveShape(shapeId, newX, shape.y);
    
    return {
      success: true,
      message: `Placed ${shapeId} to the right of ${referenceShapeId} with ${gap}px gap`,
      newPosition: { x: newX, y: shape.y }
    };
  }

  /**
   * Align a shape with another shape (left, center, right, top, middle, bottom)
   */
  async alignWith(shapeId, referenceShapeId, alignment) {
    const shape = this.getCurrentShapes().find(s => s.id === shapeId);
    const referenceShape = this.getCurrentShapes().find(s => s.id === referenceShapeId);
    
    if (!shape || !referenceShape) {
      throw new Error(`Shape not found: ${shapeId} or ${referenceShapeId}`);
    }
    
    let newX = shape.x;
    let newY = shape.y;
    
    const refBounds = this._getBounds(referenceShape);
    const shapeBounds = this._getBounds(shape);
    
    switch (alignment.toLowerCase()) {
      case 'left':
        newX = refBounds.left;
        break;
      case 'center':
        newX = refBounds.centerX - (shapeBounds.right - shapeBounds.left) / 2;
        break;
      case 'right':
        newX = refBounds.right - (shapeBounds.right - shapeBounds.left);
        break;
      case 'top':
        newY = refBounds.top;
        break;
      case 'middle':
        newY = refBounds.centerY - (shapeBounds.bottom - shapeBounds.top) / 2;
        break;
      case 'bottom':
        newY = refBounds.bottom - (shapeBounds.bottom - shapeBounds.top);
        break;
      default:
        throw new Error(`Invalid alignment: ${alignment}. Use: left, center, right, top, middle, bottom`);
    }
    
    await this.moveShape(shapeId, newX, newY);
    
    return {
      success: true,
      message: `Aligned ${shapeId} ${alignment} with ${referenceShapeId}`,
      newPosition: { x: newX, y: newY }
    };
  }

  /**
   * Center a shape horizontally within its parent container
   */
  async centerInContainer(shapeId, containerId = null) {
    const shape = this.getCurrentShapes().find(s => s.id === shapeId);
    if (!shape) {
      throw new Error(`Shape not found: ${shapeId}`);
    }
    
    let container;
    if (containerId) {
      container = this.getCurrentShapes().find(s => s.id === containerId);
    } else {
      // Auto-detect container
      const containers = this._identifyContainers(this.getCurrentShapes());
      container = containers.find(c => this._isInside(shape, c.bounds));
    }
    
    if (!container) {
      throw new Error(`Container not found for shape ${shapeId}`);
    }
    
    const containerBounds = this._getBounds(container);
    const shapeBounds = this._getBounds(shape);
    const newX = containerBounds.centerX - (shapeBounds.right - shapeBounds.left) / 2;
    
    await this.moveShape(shapeId, newX, shape.y);
    
    return {
      success: true,
      message: `Centered ${shapeId} in container`,
      newPosition: { x: newX, y: shape.y }
    };
  }

  /**
   * Set consistent padding between shape and its container edges
   */
  async setPaddingFromContainer(shapeId, containerId, padding = 24) {
    const shape = this.getCurrentShapes().find(s => s.id === shapeId);
    const container = this.getCurrentShapes().find(s => s.id === containerId);
    
    if (!shape || !container) {
      throw new Error(`Shape or container not found: ${shapeId}, ${containerId}`);
    }
    
    const containerBounds = this._getBounds(container);
    const newX = containerBounds.left + padding;
    const newY = containerBounds.top + padding;
    
    await this.moveShape(shapeId, newX, newY);
    
    return {
      success: true,
      message: `Set ${padding}px padding for ${shapeId} from container`,
      newPosition: { x: newX, y: newY }
    };
  }

  /**
   * Group shapes together to maintain their relative positions
   */
  async groupShapes(shapeIds, groupName = null) {
    const shapes = this.getCurrentShapes().filter(s => shapeIds.includes(s.id));
    
    if (shapes.length === 0) {
      throw new Error('No shapes found to group');
    }
    
    // Store relative positions
    const groupData = {
      id: `group-${Date.now()}`,
      name: groupName || `Group ${shapes.length} shapes`,
      shapes: shapes.map(shape => ({
        id: shape.id,
        relativeX: shape.x - shapes[0].x,
        relativeY: shape.y - shapes[0].y
      })),
      createdAt: Date.now()
    };
    
    // Store group data (in a real implementation, this would be persisted)
    if (!this.shapeGroups) {
      this.shapeGroups = new Map();
    }
    this.shapeGroups.set(groupData.id, groupData);
    
    return {
      success: true,
      message: `Grouped ${shapes.length} shapes as "${groupData.name}"`,
      groupId: groupData.id,
      shapes: shapes.map(s => s.id)
    };
  }

  /**
   * Distribute shapes evenly within a container
   */
  async distributeInContainer(shapeIds, containerId, direction = 'horizontal', margin = 20) {
    const shapes = this.getCurrentShapes().filter(s => shapeIds.includes(s.id));
    const container = this.getCurrentShapes().find(s => s.id === containerId);
    
    if (shapes.length === 0) {
      throw new Error('No shapes found to distribute');
    }
    if (!container) {
      throw new Error(`Container not found: ${containerId}`);
    }
    
    const containerBounds = this._getBounds(container);
    const results = [];
    
    if (direction === 'horizontal') {
      const availableWidth = containerBounds.right - containerBounds.left - (margin * 2);
      const spacing = shapes.length > 1 ? availableWidth / (shapes.length - 1) : 0;
      
      shapes.forEach((shape, index) => {
        const newX = containerBounds.left + margin + (spacing * index);
        this.moveShape(shape.id, newX, shape.y);
        results.push({ shapeId: shape.id, newPosition: { x: newX, y: shape.y } });
      });
    } else { // vertical
      const availableHeight = containerBounds.bottom - containerBounds.top - (margin * 2);
      const spacing = shapes.length > 1 ? availableHeight / (shapes.length - 1) : 0;
      
      shapes.forEach((shape, index) => {
        const newY = containerBounds.top + margin + (spacing * index);
        this.moveShape(shape.id, shape.x, newY);
        results.push({ shapeId: shape.id, newPosition: { x: shape.x, y: newY } });
      });
    }
    
    return {
      success: true,
      message: `Distributed ${shapes.length} shapes ${direction}ly in container`,
      results
    };
  }

  /**
   * Execute blueprint plan for structured UI creation
   */
  async executeBlueprintPlan(blueprint) {
    console.log('📋 Executing blueprint with ABSOLUTE positioning...');
    
    // Step 1: Create container
    const containerSpec = blueprint.layout.container;
    const container = await this.createFormContainer(
      containerSpec.width,
      containerSpec.height,
      containerSpec.centerX,
      containerSpec.centerY
    );
    
    console.log('📦 Container:', {
      x: container.x,
      y: container.y,
      width: container.width,
      height: container.height
    });
    
    // Calculate container bounds with validation
    const containerX = container.x || 400;
    const containerY = container.y || 300;
    const containerWidth = container.width || 360;
    const containerHeight = container.height || 450;
    
    const containerLeft = containerX - containerWidth / 2;
    const containerTop = containerY - containerHeight / 2;
    const containerCenterX = containerX;
    
    console.log('📐 Container bounds:', {
      x: containerX,
      y: containerY,
      width: containerWidth,
      height: containerHeight,
      left: containerLeft,
      top: containerTop,
      centerX: containerCenterX
    });
    
    // Step 2: Create elements with ABSOLUTE coordinates
    const createdElements = {};
    let currentY = containerTop + 50; // Start 50px from top
    
    for (const item of blueprint.layout.hierarchy) {
      console.log(`🎨 Creating element: ${item.element} - ${item.text}`);
      
      let element;
      let elementX;
      let elementY = currentY;
      
      // Calculate X position based on alignment
      if (item.position?.align === 'center' || item.element === 'title' || item.element === 'button') {
        elementX = containerCenterX; // Center aligned
      } else {
        elementX = containerLeft + 40; // Left aligned with 40px padding
      }
      
      // Validate coordinates to prevent NaN
      if (isNaN(elementX) || isNaN(elementY)) {
        console.error(`❌ Invalid coordinates for ${item.element}: x=${elementX}, y=${elementY}`);
        elementX = elementX || 400;
        elementY = elementY || 300;
      }
      
      // Create the element
      if (item.element === 'title') {
        element = await this.createShape({
          shapeType: 'text',
          x: elementX,
          y: elementY,
          text: item.text,
          fontSize: item.style?.fontSize || 24,
          fill: item.style?.color || '#111827',
          align: 'center',
          zIndex: 10
        });
        currentY += 40 + 40; // title height + gap
        
      } else if (item.element === 'label') {
        element = await this.createShape({
          shapeType: 'text',
          x: elementX,
          y: elementY,
          text: item.text,
          fontSize: item.style?.fontSize || 14,
          fill: item.style?.color || '#111827',
          align: 'left',
          zIndex: 110  // Labels above inputs
        });
        currentY += 14 + 8; // label height + small gap
        
      } else if (item.element === 'text_input') {
        element = await this.createShape({
          shapeType: 'text_input',
          x: elementX,
          y: elementY,
          width: item.width || 280,
          height: item.height || 40,
          text: item.text || '',
          fontSize: 16,
          fill: '#1F2937',  // Dark text color for text_input
          background: '#FFFFFF',
          borderColor: '#D1D5DB',
          borderWidth: 1,
          cornerRadius: 6,
          zIndex: 10
        });
        currentY += (item.height || 40) + 20; // input height + gap
        
      } else if (item.element === 'button') {
        // Create button rectangle
        const buttonRect = await this.createShape({
          shapeType: 'rectangle',
          x: elementX,
          y: elementY,
          width: item.width || 280,
          height: item.height || 44,
          fill: item.style?.background || '#3B82F6',
          stroke: '#2563EB',
          strokeWidth: 1,
          zIndex: 10
        });
        
        // Create button text
        const buttonText = await this.createShape({
          shapeType: 'text',
          x: elementX,
          y: elementY,
          text: item.text,
          fontSize: 16,
          fill: '#FFFFFF',
          align: 'center',
          zIndex: 11
        });
        
        element = { button: buttonRect, text: buttonText };
        currentY += (item.height || 44) + 24;
      }
      
      // Track element
      const key = `${item.element}_${Object.keys(createdElements).filter(k => k.startsWith(item.element)).length}`;
      createdElements[key] = element;
      
      console.log(`✅ Created ${item.element} at (${elementX}, ${elementY})`);
    }
    
    return {
      success: true,
      container,
      elements: createdElements,
      message: 'Login form created with absolute positioning'
    };
  }

  /**
   * Create element from blueprint specification
   * @deprecated This method is no longer used since we switched to absolute positioning in executeBlueprintPlan
   */
  async _createElementFromBlueprint(item, container, existingElements) {
    const position = this._calculateRelativePosition(item.position, container, existingElements);
    
    // Map element types to shape types
    const shapeTypeMap = {
      'title': 'text',
      'label': 'text',
      'text_input': 'text_input',  // Add mapping
      'input': 'text_input',  // Backward compatibility
      'button': 'rectangle'
    };
    
    const shapeType = shapeTypeMap[item.element];
    
    // Get base z-index for proper layering (labels must be above inputs)
    const baseZIndex = this.getCurrentShapes().length + 1;
    const zIndex = item.element === 'label' ? baseZIndex + 100 : baseZIndex;
    
    // Handle button as special case - needs both rectangle and text
    if (item.element === 'button') {
      const buttonRect = await this.createShape({
        shapeType: 'rectangle',
        x: position.x,
        y: position.y,
        width: item.width,
        height: item.height,
        fill: item.style?.background || '#3B82F6',
        stroke: '#2563EB',
        strokeWidth: 1,
        zIndex: zIndex
      });
      
      const buttonText = await this.createShape({
        shapeType: 'text',
        x: position.x,
        y: position.y,
        text: item.text,
        fontSize: 16,
        fill: '#FFFFFF',
        align: 'center',
        zIndex: zIndex + 1
      });
      
      return { button: buttonRect, text: buttonText };
    }
    
    // Handle text_input with proper styling
    if (item.element === 'text_input' || item.element === 'input') {
      return await this.createShape({
        shapeType: 'text_input',
        x: position.x,
        y: position.y,
        width: item.width || 280,
        height: item.height || 40,
        text: item.text || 'Enter text',
        fontSize: 16,
        fill: '#1F2937',  // Dark text
        background: '#FFFFFF',  // White background
        borderColor: '#D1D5DB',  // Gray border
        borderWidth: 1,
        cornerRadius: 6,
        zIndex: zIndex
      });
    }
    
    // Handle text elements (title, label)
    const shapeConfig = {
      shapeType,
      x: position.x,
      y: position.y,
      text: item.text,
      fontSize: item.style?.fontSize || (item.element === 'title' ? 24 : 14),
      fill: item.style?.color || '#111827',
      zIndex: zIndex
    };
    
    if (item.element === 'title') {
      shapeConfig.align = 'center';
    }
    
    return await this.createShape(shapeConfig);
  }

  /**
   * Calculate relative position from blueprint specification
   * @deprecated This method is no longer used since we switched to absolute positioning in executeBlueprintPlan
   */
  _calculateRelativePosition(positionSpec, container, existingElements) {
    const { relation, offset, align } = positionSpec;
    
    // Container bounds (container x,y is CENTER)
    const containerCenterX = container.x;
    const containerTop = container.y - container.height / 2;
    const containerLeft = container.x - container.width / 2;
    
    if (relation === 'top') {
      return {
        x: containerCenterX,
        y: containerTop + offset
      };
    }
    
    if (relation.startsWith('below_')) {
      const referenceName = relation.replace('below_', '');
      let referenceElement = existingElements[referenceName];
      
      // Handle arrays (from button creation which returns {button, text})
      if (referenceElement && typeof referenceElement === 'object' && !referenceElement.y) {
        // Take the first element that has position
        referenceElement = referenceElement.button || referenceElement.text || Object.values(referenceElement)[0];
      }
      
      if (referenceElement && referenceElement.y !== undefined) {
        const referenceBottom = referenceElement.y + (referenceElement.height || 20) / 2;
        
        return {
          x: align === 'center' ? containerCenterX : containerLeft + 140,
          y: referenceBottom + offset
        };
      }
    }
    
    // Fallback
    return { x: containerCenterX, y: containerTop + 50 };
  }

  /**
   * Apply constraints from blueprint
   */
  async _applyConstraints(constraints, elements, container) {
    const containerCenterX = container.x;
    const containerLeft = container.x - container.width / 2;
    
    // Apply alignment constraints
    if (constraints.alignment) {
      for (const constraint of constraints.alignment) {
        if (constraint === 'all_inputs_left_aligned') {
          const inputs = Object.values(elements).flat().filter(e => 
            e.type === 'rectangle' && e.width >= 200 && e.height <= 50
          );
          
          if (inputs.length > 0) {
            // Align all inputs to container left + padding
            const targetX = containerLeft + 40;
            for (const input of inputs) {
              await this.moveShape(input.id, targetX, input.y);
            }
          }
        }
        
        if (constraint === 'all_inputs_same_width') {
          const inputs = Object.values(elements).flat().filter(e => 
            e.type === 'rectangle' && e.width >= 200 && e.height <= 50
          );
          
          if (inputs.length > 0) {
            const targetWidth = 280;
            for (const input of inputs) {
              await this.resizeShape(input.id, { width: targetWidth });
            }
          }
        }
        
        if (constraint === 'button_centered') {
          const buttons = Object.values(elements).flat().filter(e => 
            e.type === 'rectangle' && e.fill === '#3B82F6'
          );
          
          for (const button of buttons) {
            await this.moveShape(button.id, containerCenterX - (button.width / 2), button.y);
          }
        }
      }
    }
    
    // Apply spacing constraints
    if (constraints.spacing) {
      for (const constraint of constraints.spacing) {
        if (constraint === 'vertical_rhythm_24px') {
          const allElements = Object.values(elements).flat().filter(e => e.type !== 'rectangle' || e.width < 300);
          const sorted = allElements.sort((a, b) => a.y - b.y);
          
          if (sorted.length > 1) {
            let currentY = sorted[0].y;
            for (let i = 1; i < sorted.length; i++) {
              currentY += (sorted[i - 1].height || 20) + 24;
              await this.moveShape(sorted[i].id, sorted[i].x, currentY);
            }
          }
        }
      }
    }
  }

  /**
   * Generate login form blueprint
   */
  generateLoginFormBlueprint() {
    return {
      type: 'loginForm',
      layout: {
        model: 'FormContainer',
        container: {
          width: 360,
          height: 450,
          centerX: 400,  // Will use viewport center if not provided
          centerY: 300,
          padding: 24,
          fill: '#F9FAFB',
          stroke: '#E5E7EB',
          strokeWidth: 2
        },
        hierarchy: [
          {
            element: 'title',
            text: 'Login',
            style: { fontSize: 24, fontWeight: 'bold', color: '#111827' }
          },
          {
            element: 'label',
            text: 'Username',
            style: { fontSize: 14, color: '#111827' }
          },
          {
            element: 'text_input',
            text: '',  // Empty placeholder
            width: 280,
            height: 40
          },
          {
            element: 'label',
            text: 'Password',
            style: { fontSize: 14, color: '#111827' }
          },
          {
            element: 'text_input',
            text: '',  // Empty placeholder
            width: 280,
            height: 40
          },
          {
            element: 'button',
            text: 'Log In',
            width: 280,
            height: 44,
            style: { background: '#3B82F6', color: '#FFFFFF' }
          }
        ]
      }
    };
  }

  /**
   * Validate and correct login form alignment
   */
  async validateLoginFormAlignment() {
    const shapes = this.getCurrentShapes();
    
    // Find form elements
    const container = shapes.find(s => s.type === 'rectangle' && s.width === 360 && s.height === 450);
    if (!container) return { valid: false, message: 'Container not found' };
    
    const labels = shapes.filter(s => s.type === 'text' && (s.text === 'Username' || s.text === 'Password'));
    const inputs = shapes.filter(s => s.type === 'text_input');
    
    const issues = [];
    const fixes = [];
    
    // Check 1: Inputs should be text_input type, not rectangles
    const rectangleInputs = shapes.filter(s => 
      s.type === 'rectangle' && 
      s.width >= 200 && 
      s.width <= 300 &&
      s.height >= 30 &&
      s.height <= 50 &&
      s.fill === '#FFFFFF'
    );
    
    if (rectangleInputs.length > 0) {
      issues.push({
        type: 'wrong_shape_type',
        message: `Found ${rectangleInputs.length} rectangles that should be text_input shapes`,
        severity: 'critical'
      });
      
      // Fix: Delete rectangles and recreate as text_input
      for (const rect of rectangleInputs) {
        fixes.push(async () => {
          await this.deleteShape(rect.id);
          await this.createShape({
            shapeType: 'text_input',
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            text: 'Enter text',
            fill: '#1F2937',
            background: '#FFFFFF',
            borderColor: '#D1D5DB',
            borderWidth: 1,
            cornerRadius: 6
          });
        });
      }
    }
    
    // Check 2: Labels should be above inputs, not behind
    for (const label of labels) {
      const nearbyInputs = inputs.filter(i => 
        Math.abs(i.x - label.x) < 50 && 
        i.y > label.y &&
        i.y - label.y < 50
      );
      
      if (nearbyInputs.length > 0) {
        const input = nearbyInputs[0];
        if (label.zIndex <= input.zIndex) {
          issues.push({
            type: 'label_z_index',
            message: `Label "${label.text}" has z-index ${label.zIndex} but should be above input (${input.zIndex})`,
            severity: 'high'
          });
          
          fixes.push(async () => {
            await this.canvas.updateShape(label.id, { zIndex: input.zIndex + 100 });
          });
        }
      }
    }
    
    // Check 3: Elements should be within container bounds
    const containerLeft = container.x - container.width / 2;
    const containerRight = container.x + container.width / 2;
    const containerTop = container.y - container.height / 2;
    const containerBottom = container.y + container.height / 2;
    
    const allFormElements = [...labels, ...inputs, ...shapes.filter(s => s.text === 'Login' || s.text === 'Log In')];
    
    for (const element of allFormElements) {
      const elementLeft = element.x - (element.width || 0) / 2;
      const elementRight = element.x + (element.width || 0) / 2;
      
      if (elementLeft < containerLeft || elementRight > containerRight) {
        issues.push({
          type: 'out_of_bounds',
          message: `Element "${element.text}" is outside container bounds`,
          severity: 'medium'
        });
      }
    }
    
    // Apply fixes
    for (const fix of fixes) {
      await fix();
    }
    
    return {
      valid: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
      issues,
      fixesApplied: fixes.length
    };
  }

  /**
   * Create a complete login form with professional layout system
   */
  async createLoginFormWithLayout() {
    console.log('🎨 Creating login form with blueprint system...');
    
    // Generate blueprint
    const blueprint = this.generateLoginFormBlueprint();
    
    // Execute blueprint (this uses the proper positioning system)
    const result = await this.executeBlueprintPlan(blueprint);
    
    // Force validation and auto-fix
    const validation = await this.validateUILayout();
    if (!validation.valid || validation.issues.length > 0) {
      console.log('⚠️ Validation issues found, applying auto-fix...');
      await this.autoFixUI();
    }
    
    // Additional login-form-specific validation
    const loginValidation = await this.validateLoginFormAlignment();
    if (!loginValidation.valid) {
      console.log('⚠️ Login form alignment issues found:', loginValidation.issues);
    }
    
    return {
      success: true,
      ...result,
      validation: loginValidation,
      message: `Professional login form created with blueprint system. ${loginValidation.fixesApplied} alignment fixes applied.`
    };
  }
}

export default CanvasAPI;