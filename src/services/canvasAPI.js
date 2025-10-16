import { SHAPE_TYPES, DEFAULT_SHAPE_PROPS, COLOR_PALETTE } from '../utils/constants';

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
    
    console.log('🔧 CanvasAPI initialized with context:', {
      hasShapes: !!canvasContext.shapes,
      shapesCount: canvasContext.shapes?.length || 0,
      hasSelectedIds: !!canvasContext.selectedIds,
      hasStore: !!canvasContext.store,
      contextKeys: Object.keys(canvasContext)
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
      console.log('🔄 Refreshing canvas context from store:', {
        shapesInStore: state.shapes?.size || 0
      });
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
    
    console.log('🔖 Tracked recently created shapes:', {
      count: shapesToTrack.length,
      recentOperations: this.recentlyCreated.length
    });
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
    
    console.log('📋 Retrieved recently created shapes:', {
      count: recent.length,
      ids: recent.map(s => this.extractFriendlyId(s.id))
    });
    
    return recent;
  }

  /**
   * Resolve "these shapes" reference to actual shapes
   */
  resolveTheseShapes() {
    // Try selected shapes first
    const selectedShapes = this.canvas.getSelectedShapes ? this.canvas.getSelectedShapes() : [];
    if (selectedShapes && selectedShapes.length > 0) {
      console.log('📌 Using selected shapes for "these shapes":', selectedShapes.length);
      return selectedShapes;
    }
    
    // Fall back to recently created shapes
    const recentShapes = this.getRecentlyCreatedShapes();
    if (recentShapes.length > 0) {
      console.log('🕒 Using recently created shapes for "these shapes":', recentShapes.length);
      return recentShapes;
    }
    
    console.warn('⚠️ No shapes found for "these shapes" reference');
    return [];
  }

  /**
   * Check if a position would cause a collision with existing shapes
   */
  checkCollision(x, y, width = 100, height = 100, excludeIds = []) {
    const shapes = this.getCurrentShapes();
    const buffer = 20; // Minimum space between shapes
    
    for (const shape of shapes) {
      if (excludeIds.includes(shape.id)) continue;
      
      // Calculate shape bounds
      let shapeLeft, shapeRight, shapeTop, shapeBottom;
      
      if (shape.type === SHAPE_TYPES.CIRCLE) {
        const radiusX = shape.radiusX || 50;
        const radiusY = shape.radiusY || 50;
        shapeLeft = shape.x - radiusX;
        shapeRight = shape.x + radiusX;
        shapeTop = shape.y - radiusY;
        shapeBottom = shape.y + radiusY;
      } else {
        // Rectangle, text, etc.
        const shapeWidth = shape.width || 100;
        const shapeHeight = shape.height || 100;
        shapeLeft = shape.x;
        shapeRight = shape.x + shapeWidth;
        shapeTop = shape.y;
        shapeBottom = shape.y + shapeHeight;
      }
      
      // Check if new shape would overlap (with buffer)
      const newLeft = x;
      const newRight = x + width;
      const newTop = y;
      const newBottom = y + height;
      
      const hasCollision = !(
        newRight + buffer < shapeLeft ||
        newLeft - buffer > shapeRight ||
        newBottom + buffer < shapeTop ||
        newTop - buffer > shapeBottom
      );
      
      if (hasCollision) {
        console.log('💥 Collision detected with shape:', this.extractFriendlyId(shape.id));
        return { collision: true, shape };
      }
    }
    
    return { collision: false };
  }

  /**
   * Find a collision-free position near the desired location
   */
  findSafePosition(desiredX, desiredY, width = 100, height = 100, maxAttempts = 10) {
    // First check if desired position is already safe
    const initialCheck = this.checkCollision(desiredX, desiredY, width, height);
    if (!initialCheck.collision) {
      return { x: desiredX, y: desiredY, adjusted: false };
    }
    
    console.log('🔄 Finding safe position near:', desiredX, desiredY);
    
    // Try positions in expanding spiral pattern
    const stepSize = Math.max(width, height) + 20;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const radius = attempt * stepSize;
      const angles = [0, Math.PI/2, Math.PI, 3*Math.PI/2, Math.PI/4, 3*Math.PI/4, 5*Math.PI/4, 7*Math.PI/4];
      
      for (const angle of angles) {
        const testX = desiredX + Math.cos(angle) * radius;
        const testY = desiredY + Math.sin(angle) * radius;
        
        const collision = this.checkCollision(testX, testY, width, height);
        if (!collision.collision) {
          console.log('✅ Found safe position at:', testX, testY, 'after', attempt, 'attempts');
          return { x: testX, y: testY, adjusted: true };
        }
      }
    }
    
    // Fallback: use original position with warning
    console.warn('⚠️ Could not find collision-free position, using original');
    return { x: desiredX, y: desiredY, adjusted: false, warning: true };
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
        console.log('📊 Using shapes from store.shapes Map');
      }
    }
    
    // 2. Fallback to processed shapes array from context
    if (shapes.length === 0 && this.canvas.shapes) {
      if (this.canvas.shapes instanceof Map) {
        shapes = Array.from(this.canvas.shapes.values());
        console.log('📊 Using shapes from context.shapes Map');
      } else if (Array.isArray(this.canvas.shapes)) {
        shapes = this.canvas.shapes;
        console.log('📊 Using shapes from context.shapes Array');
      }
    }
    
    // 3. Final fallback - empty array
    if (shapes.length === 0) {
      console.warn('⚠️ No shapes found in any source. Context keys:', Object.keys(this.canvas));
      console.warn('⚠️ Store details:', {
        hasStore: !!this.canvas.store,
        storeKeys: this.canvas.store ? Object.keys(this.canvas.store) : 'N/A',
        storeShapesType: this.canvas.store?.shapes ? typeof this.canvas.store.shapes : 'N/A',
        storeShapesSize: this.canvas.store?.shapes?.size || 'N/A'
      });
    }
    
    console.log('🔍 getCurrentShapes result:', {
      shapesCount: shapes.length,
      shapes: shapes.slice(0, 3).map(s => ({ 
        id: s.id, 
        friendlyId: this.extractFriendlyId(s.id),
        type: s.type, 
        x: s.x, 
        y: s.y 
      })),
      truncated: shapes.length > 3 ? `... and ${shapes.length - 3} more` : false
    });
    
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
    const desc = description.toLowerCase().trim();
    
    console.log('🔍 Finding shape by description:', desc, 'Available shapes:', shapes.length);
    
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
          console.log(`✅ Color match: ${shape.fill} matches ${mentionedColor}`);
        }
      }
      
      // Check shape type
      const typeWords = Object.keys(shapeTypes);
      const mentionedType = typeWords.find(type => desc.includes(type));
      if (mentionedType) {
        totalCriteria++;
        if (shape.type === shapeTypes[mentionedType]) {
          matches++;
          console.log(`✅ Type match: ${shape.type} matches ${mentionedType}`);
        }
      }
      
        // Check text content (both exact and partial matches)
        if (shape.text) {
          const shapeTextLower = shape.text.toLowerCase();
          if (desc.includes(shapeTextLower) || shapeTextLower.includes(desc.replace(/text|label|input|field/g, '').trim())) {
            matches++;
            totalCriteria++;
            console.log(`✅ Text match: "${shape.text}"`);
          }
        }
      
      // Check size descriptors
      if (desc.includes('large') || desc.includes('big')) {
        totalCriteria++;
        const isLarge = (shape.width > 150) || (shape.height > 150) || 
                       (shape.radiusX > 75) || (shape.radiusY > 75);
        if (isLarge) {
          matches++;
          console.log(`✅ Size match: large shape`);
        }
      }
      
      if (desc.includes('small') || desc.includes('tiny')) {
        totalCriteria++;
        const isSmall = (shape.width < 80) || (shape.height < 80) || 
                       (shape.radiusX < 40) || (shape.radiusY < 40);
        if (isSmall) {
          matches++;
          console.log(`✅ Size match: small shape`);
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
      console.log(`✅ Found ${candidates.length} shape(s) matching "${description}"`);
      return candidates[0]; // Return best match
    }
    
    console.log(`❌ No shapes found matching "${description}"`);
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
    
    console.log('🔍 findShape called with:', idInput, 'Available shapes:', shapes.length);
    
    // Try exact match first
    let shape = shapes.find(s => s.id === idInput);
    if (shape) {
      console.log('✅ Found exact match:', shape.id);
      return shape;
    }
    
    // Try friendly ID match
    shape = shapes.find(s => this.extractFriendlyId(s.id) === idInput);
    if (shape) {
      console.log('✅ Found friendly ID match:', shape.id, 'for', idInput);
      return shape;
    }
    
    // Try partial match (case insensitive)
    shape = shapes.find(s => 
      s.id.toLowerCase().includes(idInput.toLowerCase()) ||
      this.extractFriendlyId(s.id).toLowerCase().includes(idInput.toLowerCase())
    );
    
    if (shape) {
      console.log('✅ Found partial match:', shape.id, 'for', idInput);
    } else {
      console.log('❌ No shape found for:', idInput);
      console.log('Available friendly IDs:', shapes.map(s => this.extractFriendlyId(s.id)));
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
    return { x: 400, y: 300 };
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
    skipCollisionCheck = false
  }) {
    const defaults = DEFAULT_SHAPE_PROPS[shapeType];
    if (!defaults) {
      throw new Error(`Invalid shape type: ${shapeType}`);
    }

    // Calculate dimensions for collision detection
    let shapeWidth = width || defaults.width || (radiusX ? radiusX * 2 : 0) || 100;
    let shapeHeight = height || defaults.height || (radiusY ? radiusY * 2 : 0) || 100;
    
    // Use viewport center if no position specified
    if (x === undefined || y === undefined) {
      const center = this.getViewportCenter();
      x = x ?? center.x;
      y = y ?? center.y;
    }
    
    // Check for collisions and adjust position if needed (unless creating multiple shapes)
    let finalX = x;
    let finalY = y;
    let positionAdjusted = false;
    
    if (!skipCollisionCheck) {
      const safePosition = this.findSafePosition(x, y, shapeWidth, shapeHeight);
      finalX = safePosition.x;
      finalY = safePosition.y;
      positionAdjusted = safePosition.adjusted;
      
      if (positionAdjusted) {
        console.log('📍 Adjusted position to avoid collision:', `(${x}, ${y})` + ' → ' + `(${finalX}, ${finalY})`);
      }
    }

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

    const newShape = {
        type: shapeType,
      x: finalX,
      y: finalY,
      fill: finalFill,
      zIndex: (this.canvas.shapes?.length || 0) + 1
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
      case SHAPE_TYPES.TEXT_INPUT:
        newShape.text = text || defaults.text;
        newShape.fontSize = fontSize || defaults.fontSize;
        newShape.fontFamily = defaults.fontFamily;
        newShape.width = width || defaults.width;
        newShape.height = height || defaults.height;
        // Text color logic is now handled above
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

    // Add to canvas using context method
    await this.canvas.addShape(newShape);
    
    // Track for "these shapes" references
    this._trackRecentlyCreated(newShape);
    
    console.log('✅ Created shape:', newShape.type, 'at', `(${newShape.x}, ${newShape.y})`);
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
    
    await this.canvas.updateShape(shape.id, { x, y });
    const description = this.getShapeDescription(shape);
    console.log('✅ Moved shape:', description, 'to', `(${x}, ${y})`);
    return {
      shapeId: shape.id, 
      description: description,
      x, 
      y 
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
    console.log('✅ Resized shape:', description, updates);
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

    await this.canvas.updateShape(shape.id, { rotation: degrees });
    const description = this.getShapeDescription(shape);
    console.log('✅ Rotated shape:', description, 'to', degrees, 'degrees');
    return { 
      shapeId: shape.id, 
      description: description, 
      rotation: degrees 
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
    console.log('✅ Changed shape color:', description, 'to', parsedColor);
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
    console.log('✅ Changed text content:', description, 'to:', `"${newText}"`);
    return {
      shapeId: shape.id, 
      description: description, 
      text: newText,
      oldText: shape.text 
    };
  }

  /**
   * CREATE MULTIPLE SHAPES - Layout function with smart spacing
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
    height
  }) {
    const shapes = [];
    const defaults = DEFAULT_SHAPE_PROPS[shapeType];
    const color = this.parseColor(fill) || defaults.fill;
    
    // Calculate shape dimensions for smart spacing
    const shapeWidth = width || defaults.width || defaults.radiusX * 2 || 100;
    const shapeHeight = height || defaults.height || defaults.radiusY * 2 || 100;
    
    // Calculate smart spacing if not provided
    let calculatedSpacing = spacing;
    if (!calculatedSpacing) {
      // Dynamic spacing based on shape size with buffer
      const buffer = Math.min(shapeWidth, shapeHeight) * 0.3; // 30% buffer
      calculatedSpacing = Math.max(shapeWidth, shapeHeight) + buffer;
      console.log('📏 Calculated smart spacing:', calculatedSpacing, 'for shapes:', `${shapeWidth}x${shapeHeight}`);
    }
    
    // Use viewport center if no start position specified
    if (startX === undefined || startY === undefined) {
      const center = this.getViewportCenter();
      startX = startX || center.x;
      startY = startY || center.y;
      console.log('🎯 Using viewport center for positioning:', center);
    }
    
    // For grid arrangement, calculate actual layout
    let rows, cols;
    if (arrangement === 'grid') {
      if (gridRows && gridCols) {
        rows = gridRows;
        cols = gridCols;
        // Update count to match grid if needed
        count = rows * cols;
      } else {
        // Auto-calculate grid dimensions
        cols = Math.ceil(Math.sqrt(count));
        rows = Math.ceil(count / cols);
      }
      console.log('🏗️ Grid layout:', `${rows}x${cols}`, `(${count} total shapes)`);
    }
    
    // Calculate starting position to center the entire arrangement
    let adjustedStartX = startX;
    let adjustedStartY = startY;
    
    if (arrangement === 'row') {
      // Center the row horizontally
      adjustedStartX = startX - ((count - 1) * calculatedSpacing) / 2;
    } else if (arrangement === 'column') {
      // Center the column vertically
      adjustedStartY = startY - ((count - 1) * calculatedSpacing) / 2;
    } else if (arrangement === 'grid') {
      // Center the entire grid
      adjustedStartX = startX - ((cols - 1) * calculatedSpacing) / 2;
      adjustedStartY = startY - ((rows - 1) * calculatedSpacing) / 2;
    }
    
    // Create shapes with calculated positions
    for (let i = 0; i < count; i++) {
      let x = adjustedStartX;
      let y = adjustedStartY;
      
      switch (arrangement) {
        case 'row':
          x = adjustedStartX + (i * calculatedSpacing);
          break;
        case 'column':
          y = adjustedStartY + (i * calculatedSpacing);
          break;
        case 'grid':
          x = adjustedStartX + ((i % cols) * calculatedSpacing);
          y = adjustedStartY + (Math.floor(i / cols) * calculatedSpacing);
          break;
      }
      
      const shape = await this.createShape({
        shapeType,
        x,
        y,
        width,
        height,
        fill: color,
        skipCollisionCheck: true // Skip individual collision checks since we handle spacing
      });
      
      shapes.push(shape);
    }
    
    // Track all created shapes for "these shapes" references
    this._trackRecentlyCreated(shapes);
    
    console.log('✅ Created', count, shapeType, 'shapes in', arrangement, 'arrangement with smart spacing:', calculatedSpacing);
    return {
      shapes,
      arrangement,
      shapeType,
      count,
      spacing: calculatedSpacing
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
          const angle = (i / shapes.length) * 2 * Math.PI;
          const radius = spacing;
          x = centerX + Math.cos(angle) * radius;
          y = centerY + Math.sin(angle) * radius;
          break;
      }
      
      await this.moveShape(shapes[i].id, x, y);
      arrangements.push({ shapeId: shapes[i].id, x, y });
    }
    
    console.log('✅ Arranged', shapes.length, 'shapes in', arrangement, 'pattern');
    return arrangements;
  }

  /**
   * CREATE LOGIN FORM - Enhanced user-friendly form with proper alignment
   */
  async createLoginForm({ x, y, width = 320 }) {
    // Use viewport center if no position specified
    if (x === undefined || y === undefined) {
      const center = this.getViewportCenter();
      x = x ?? center.x - width / 2; // Center the form
      y = y ?? center.y - 180; // Position above center
    }
    
    // Enhanced form dimensions and spacing
    const formHeight = 320;
    const padding = 24;
    const fieldSpacing = 20;
    const labelSpacing = 8;
    
    // Check for collisions and adjust position if needed
    const safePosition = this.findSafePosition(x, y, width, formHeight);
    const adjustedX = safePosition.x;
    const adjustedY = safePosition.y;
    
    if (safePosition.adjusted) {
      console.log('📍 Adjusted login form position to avoid collision');
    }
    
    const formElements = [];
    let currentY = adjustedY;
    
    // Form Background Container
    const formBackground = await this.createShape({
      shapeType: SHAPE_TYPES.RECTANGLE,
      x: adjustedX,
      y: adjustedY,
      width: width,
      height: formHeight,
      fill: '#FFFFFF',
      stroke: '#E5E7EB',
      strokeWidth: 1,
      skipCollisionCheck: true
    });
    formElements.push(formBackground);
    
    // Form Shadow (subtle depth)
    const formShadow = await this.createShape({
      shapeType: SHAPE_TYPES.RECTANGLE,
      x: adjustedX + 2,
      y: adjustedY + 2,
      width: width,
      height: formHeight,
      fill: '#F3F4F6',
      skipCollisionCheck: true
    });
    formElements.push(formShadow);
    
    // Move form background to front
    formBackground.zIndex = 10;
    formShadow.zIndex = 5;
    
    currentY += padding + 20; // Top padding + title space
    
    // Title - Properly centered
    const title = await this.createShape({
      shapeType: SHAPE_TYPES.TEXT,
      x: adjustedX + width/2 - 30, // Better centering
      y: currentY,
      text: 'Welcome Back',
      fontSize: 28,
      fill: '#1F2937',
      skipCollisionCheck: true
    });
    formElements.push(title);
    currentY += 50;

    // Username Section
    currentY += labelSpacing;
    
    // Username label - Better positioning
    const usernameLabel = await this.createShape({
      shapeType: SHAPE_TYPES.TEXT,
      x: adjustedX + padding,
      y: currentY,
      text: 'Username',
      fontSize: 14,
      fill: '#374151',
      skipCollisionCheck: true
    });
    formElements.push(usernameLabel);
    currentY += 25;
    
    // Username input - Better styling
    const usernameInput = await this.createShape({
      shapeType: SHAPE_TYPES.TEXT_INPUT,
      x: adjustedX + padding,
      y: currentY,
      width: width - (padding * 2),
      height: 44,
      text: '',
      fill: '#F9FAFB',
      stroke: '#D1D5DB',
      strokeWidth: 1,
      skipCollisionCheck: true
    });
    formElements.push(usernameInput);
    currentY += 44 + fieldSpacing;

    // Password Section
    currentY += labelSpacing;
    
    // Password label
    const passwordLabel = await this.createShape({
      shapeType: SHAPE_TYPES.TEXT,
      x: adjustedX + padding,
      y: currentY,
      text: 'Password',
      fontSize: 14,
      fill: '#374151',
      skipCollisionCheck: true
    });
    formElements.push(passwordLabel);
    currentY += 25;
    
    // Password input
    const passwordInput = await this.createShape({
      shapeType: SHAPE_TYPES.TEXT_INPUT,
      x: adjustedX + padding,
      y: currentY,
      width: width - (padding * 2),
      height: 44,
      text: '',
      fill: '#F9FAFB',
      stroke: '#D1D5DB',
      strokeWidth: 1,
      skipCollisionCheck: true
    });
    formElements.push(passwordInput);
    currentY += 44 + fieldSpacing + 10;

    // Submit Button - Better positioning and styling
    const buttonWidth = 140;
    const buttonHeight = 44;
    const submitButton = await this.createShape({
      shapeType: SHAPE_TYPES.RECTANGLE,
      x: adjustedX + (width - buttonWidth) / 2, // Perfectly centered
      y: currentY,
      width: buttonWidth,
      height: buttonHeight,
      fill: '#3B82F6',
      stroke: '#2563EB',
      strokeWidth: 1,
      skipCollisionCheck: true
    });
    formElements.push(submitButton);
    
    // Button text - Better centering
    const buttonText = await this.createShape({
      shapeType: SHAPE_TYPES.TEXT,
      x: adjustedX + width/2 - 20, // Better text centering
      y: currentY + 14,
      text: 'Sign In',
      fontSize: 16,
      fill: '#FFFFFF',
      skipCollisionCheck: true
    });
    formElements.push(buttonText);
    
    // Optional: Add "Forgot Password?" link
    currentY += buttonHeight + 15;
    const forgotPassword = await this.createShape({
      shapeType: SHAPE_TYPES.TEXT,
      x: adjustedX + width/2 - 50,
      y: currentY,
      text: 'Forgot Password?',
      fontSize: 12,
      fill: '#6B7280',
      skipCollisionCheck: true
    });
    formElements.push(forgotPassword);
    
    // Track all form elements for "these shapes" references
    this._trackRecentlyCreated(formElements);
    
    console.log('✅ Created enhanced login form with', formElements.length, 'elements');
    return { components: formElements };
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
      console.log('📍 Adjusted navigation bar position to avoid collision');
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
      skipCollisionCheck: true
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
      skipCollisionCheck: true
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
        skipCollisionCheck: true
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
        skipCollisionCheck: true
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
      skipCollisionCheck: true
    });
    navElements.push(logoArea);
    
    // Track all navigation elements for "these shapes" references
    this._trackRecentlyCreated(navElements);
    
    console.log('✅ Created enhanced navigation bar with', menuItems.length, 'menu items');
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
      console.log('📍 Adjusted card layout position to avoid collision');
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
      skipCollisionCheck: true
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
      skipCollisionCheck: true
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
        skipCollisionCheck: true
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
        skipCollisionCheck: true
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
        skipCollisionCheck: true
      });
      cardElements.push(imageBg);
      
      const imagePlaceholder = await this.createShape({
        shapeType: SHAPE_TYPES.TEXT,
        x: adjustedX + width/2 - 25,
        y: currentY + imageHeight/2 - 8,
        text: '📷 Image',
        fontSize: 16,
        fill: '#9CA3AF',
        skipCollisionCheck: true
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
      skipCollisionCheck: true
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
        skipCollisionCheck: true
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
        skipCollisionCheck: true
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
      skipCollisionCheck: true
    });
    cardElements.push(actionButton);
    
    const buttonText = await this.createShape({
      shapeType: SHAPE_TYPES.TEXT,
      x: adjustedX + width/2 - 25,
      y: currentY + 10,
      text: 'Learn More',
      fontSize: 14,
      fill: '#FFFFFF',
      skipCollisionCheck: true
    });
    cardElements.push(buttonText);
    
    // Track all card elements for "these shapes" references
    this._trackRecentlyCreated(cardElements);
    
    console.log('✅ Created enhanced card layout with title:', title);
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
    console.log('✅ Deleted shape:', description);
    return {
      shapeId: shape.id, 
      description: description, 
      deleted: true 
    };
  }
}

export default CanvasAPI;