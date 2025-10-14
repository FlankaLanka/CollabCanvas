import { createContext, useContext, useState, useRef, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEFAULT_SHAPE, SHAPE_COLORS } from '../utils/constants';
import useCanvasSync from '../hooks/useCanvasSync';
import useRealtimePositions from '../hooks/useRealtimePositions';

// Create Canvas Context
const CanvasContext = createContext({
  shapes: [],
  selectedId: null,
  stageRef: null,
  stageScale: 1,
  stagePosition: { x: 0, y: 0 },
  addShape: () => {},
  updateShape: () => {},
  deleteShape: () => {},
  selectShape: () => {},
  clearSelection: () => {},
  updateStageTransform: () => {},
  getNextColor: () => DEFAULT_SHAPE.fill
});

// Custom hook to use canvas context
export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
}

// Canvas Provider Component
export function CanvasProvider({ children }) {
  // Real-time sync hook
  const {
    shapes: syncedShapes,
    syncStatus,
    loading: syncLoading,
    createShape: createSyncedShape,
    updateShape: updateSyncedShape,
    deleteShape: deleteSyncedShape,
    lockShapeForEditing,
    unlockShapeAfterEditing,
    isShapeLockedByCurrentUser,
    isShapeLockedByOther
  } = useCanvasSync();

  // Local UI state
  const [selectedId, setSelectedId] = useState(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);
  const nextShapeId = useRef(1);

  // Local position overrides for real-time updates
  const [positionOverrides, setPositionOverrides] = useState({});

  // Apply real-time position updates
  const handleRealtimePositionUpdate = useCallback((positionUpdates) => {
    setPositionOverrides(prev => ({
      ...prev,
      ...positionUpdates
    }));
    
    // Clear overrides after a delay to let Firestore sync catch up
    setTimeout(() => {
      setPositionOverrides(prev => {
        const newOverrides = { ...prev };
        Object.keys(positionUpdates).forEach(shapeId => {
          delete newOverrides[shapeId];
        });
        return newOverrides;
      });
    }, 1000); // 1 second delay
  }, []);

  // Subscribe to real-time position updates
  useRealtimePositions(handleRealtimePositionUpdate);

  // Merge synced shapes with real-time position overrides
  const shapes = syncedShapes.map(shape => {
    const positionOverride = positionOverrides[shape.id];
    return positionOverride ? { ...shape, ...positionOverride } : shape;
  });

  // Get next color for shapes (cycles through colors)
  const getNextColor = useCallback(() => {
    const colorIndex = (shapes.length) % SHAPE_COLORS.length;
    return SHAPE_COLORS[colorIndex];
  }, [shapes.length]);

  // Add a new shape to the canvas (with real-time sync)
  const addShape = useCallback(async (shapeData) => {
    try {
      const newShape = {
        id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: shapeData.type || 'rectangle', // Use provided type or default to rectangle
        x: shapeData.x || 100,
        y: shapeData.y || 100,
        width: shapeData.width || DEFAULT_SHAPE.width,
        height: shapeData.height || DEFAULT_SHAPE.height,
        fill: shapeData.fill || getNextColor(),
        rotation: shapeData.rotation || 0,
        scaleX: shapeData.scaleX || 1,
        scaleY: shapeData.scaleY || 1,
        ...shapeData
      };

      // No bounds checking for infinite canvas

      // Create shape with real-time sync
      await createSyncedShape(newShape);
      setSelectedId(newShape.id);
      
      console.log('✅ Shape added and synced:', newShape.id);
      return newShape;
    } catch (error) {
      console.error('❌ Error adding shape:', error);
      throw error;
    }
  }, [getNextColor, createSyncedShape]);

  // Update an existing shape (with real-time sync)
  const updateShape = useCallback(async (id, updates) => {
    try {
      await updateSyncedShape(id, updates);
      console.log('📝 Shape updated and synced:', id, updates);
    } catch (error) {
      console.error('❌ Error updating shape:', error);
      throw error;
    }
  }, [updateSyncedShape]);

  // Delete a shape (with real-time sync)
  const deleteShape = useCallback(async (id) => {
    try {
      await deleteSyncedShape(id);
      if (selectedId === id) {
        setSelectedId(null);
      }
      console.log('🗑️ Shape deleted and synced:', id);
    } catch (error) {
      console.error('❌ Error deleting shape:', error);
      throw error;
    }
  }, [selectedId, deleteSyncedShape]);

  // Select a shape
  const selectShape = useCallback((id) => {
    setSelectedId(id);
    console.log('🎯 Shape selected:', id);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedId(null);
    console.log('❌ Selection cleared');
  }, []);

  // Update stage transform (for pan/zoom)
  const updateStageTransform = useCallback((newScale, newPosition) => {
    if (newScale !== undefined) {
      setStageScale(newScale);
    }
    if (newPosition !== undefined) {
      setStagePosition(newPosition);
    }
  }, []);

  // Get shape by ID
  const getShape = useCallback((id) => {
    return shapes.find(shape => shape.id === id);
  }, [shapes]);

  // Get selected shape
  const getSelectedShape = useCallback(() => {
    return selectedId ? getShape(selectedId) : null;
  }, [selectedId, getShape]);

  // Delete selected shape (keyboard shortcut handler)
  const deleteSelectedShape = useCallback(async () => {
    if (selectedId) {
      try {
        await deleteShape(selectedId);
      } catch (error) {
        console.error('❌ Error deleting selected shape:', error);
      }
    }
  }, [selectedId, deleteShape]);

  // Context value
  const value = {
    // State
    shapes,
    selectedId,
    stageRef,
    stageScale,
    stagePosition,
    syncStatus,
    syncLoading,
    
    // Shape management
    addShape,
    updateShape,
    deleteShape,
    selectShape,
    clearSelection,
    getShape,
    getSelectedShape,
    deleteSelectedShape,
    
    // Transform management
    updateStageTransform,
    
    // Collaboration features
    lockShapeForEditing,
    unlockShapeAfterEditing,
    isShapeLockedByCurrentUser,
    isShapeLockedByOther,
    
    // Utilities
    getNextColor
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}

export default CanvasContext;