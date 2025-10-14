import { createContext, useContext, useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { DEFAULT_SHAPE, SHAPE_COLORS } from '../utils/constants';
import { getCurrentUser } from '../services/auth';
import useCanvasSync from '../hooks/useCanvasSync';
import useRealtimePositions from '../hooks/useRealtimePositions';
import useCanvasStore from '../stores/canvasStore';
import { throttledUpdateShapePosition, forceUpdateShapePosition } from '../services/realtimeShapes';

/**
 * Modern Canvas Context - Uses Zustand Store for Predictable State Management
 * 
 * This context acts as a bridge between:
 * - Zustand store (local state management)  
 * - Firebase hooks (database synchronization)
 * - React components (UI bindings)
 */

const CanvasContext = createContext({});

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
}

export function CanvasProvider({ children }) {
  // SIMPLIFIED: Get the store instance directly for immediate functionality
  const store = useCanvasStore();
  
  // Reactive state that triggers re-renders when store changes
  const [, forceUpdate] = useState({});
  const triggerUpdate = useCallback(() => forceUpdate({}), []);

  // Basic reactive state (keep it simple for now)
  const shapes = store.shapes ? Array.from(store.shapes.values()) : [];
  const selectedIds = store.selectedIds ? Array.from(store.selectedIds) : [];
  const selectedId = selectedIds.length > 0 ? selectedIds[0] : null;
  const stageScale = store.stageScale || 1;
  const stagePosition = store.stagePosition || { x: 0, y: 0 };
  const syncStatus = store.syncStatus || 'connecting';
  const syncLoading = store.syncLoading || false;
  const isDragging = store.isDragging || false;
  
  // Firebase sync hooks
  const {
    shapes: syncedShapes,
    syncStatus: firebaseSyncStatus,
    loading: firebaseSyncLoading,
    createShape: createSyncedShape,
    updateShape: updateSyncedShape,
    deleteShape: deleteSyncedShape
  } = useCanvasSync();

  const stageRef = useRef(null);

  // ===== SYNC SHAPES FROM FIREBASE TO STORE =====
  useEffect(() => {
    if (syncedShapes && syncedShapes.length >= 0) {
      // Update store directly (simple approach)
      store.shapes.clear();
      syncedShapes.forEach(shape => {
        store.shapes.set(shape.id, shape);
        
        // Apply any pending position updates for this shape
        const pendingUpdate = pendingUpdatesRef.current.get(shape.id);
        if (pendingUpdate) {
          console.log('🔄 Applying cached position update for newly loaded shape:', shape.id, {
            x: pendingUpdate.x, 
            y: pendingUpdate.y,
            age: Date.now() - pendingUpdate.timestamp + 'ms'
          });
          shape.x = pendingUpdate.x;
          shape.y = pendingUpdate.y;
          pendingUpdatesRef.current.delete(shape.id);
        }
      });
      triggerUpdate(); // Force React re-render when shapes sync from database
      console.log('🔄 Synced shapes to store:', syncedShapes.length);
    }
  }, [syncedShapes, store, triggerUpdate]);

  // ===== REAL-TIME POSITION UPDATES =====
  // RACE CONDITION HANDLING:
  // In collaborative environments, position updates from Realtime Database may arrive 
  // before shape creation from Firestore. This is expected behavior due to:
  // - Firestore: Persistent shape data (slower, consistent)
  // - Realtime DB: High-frequency position updates (faster, transient)
  const pendingUpdatesRef = useRef(new Map()); // Cache updates for unknown shapes
  const unknownShapeLogThrottle = useRef(new Map()); // Throttle unknown shape logs

  const handleRealtimePositionUpdate = useCallback((positionUpdates) => {
    let updatedAny = false;
    
    // positionUpdates is an object, not a Map, so we iterate over its keys
    Object.entries(positionUpdates).forEach(([id, pos]) => {
      const shape = store.shapes.get(id);
      
      if (shape) {
        // Clear any pending updates for this shape since we now have it
        pendingUpdatesRef.current.delete(id);
        
        // Only block real-time updates if WE are currently dragging this shape locally
        // Allow updates from other users even if the shape is selected
        if (!store.isDragging) {
          console.log('📡 Applying real-time update for shape:', id, shape.type, 'from:', {x: shape.x, y: shape.y}, 'to:', pos);
          shape.x = pos.x;
          shape.y = pos.y;
          updatedAny = true;
        } else {
          console.log('🚫 Blocked real-time update (local drag active) for shape:', id, shape.type, pos);
        }
      } else {
        // Shape doesn't exist yet - this is normal in collaborative environments
        // Cache the update with timestamp for cleanup
        pendingUpdatesRef.current.set(id, {
          ...pos,
          timestamp: Date.now()
        });
        
        // Throttle console warnings to prevent spam (max 1 per shape per 5 seconds)
        const now = Date.now();
        const lastLog = unknownShapeLogThrottle.current.get(id) || 0;
        if (now - lastLog > 5000 && process.env.NODE_ENV === 'development') {
          console.warn('⏳ Position update received for pending shape:', id.substring(0, 20) + '...', 
            '(Normal in collaborative mode - cached for when shape loads)');
          unknownShapeLogThrottle.current.set(id, now);
        }
      }
    });
    
    // Trigger re-render if any positions were updated
    if (updatedAny) {
      triggerUpdate();
    }
  }, [store, triggerUpdate]);

  useRealtimePositions(handleRealtimePositionUpdate);

  // Cleanup stale pending updates periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 30000; // 30 seconds
      
      // Clean up pending updates older than threshold
      for (const [shapeId, update] of pendingUpdatesRef.current.entries()) {
        if (update.timestamp && (now - update.timestamp > staleThreshold)) {
          console.log('🧹 Cleaning up stale pending update for shape:', shapeId);
          pendingUpdatesRef.current.delete(shapeId);
        }
      }
      
      // Clean up throttle map entries older than threshold
      for (const [shapeId, timestamp] of unknownShapeLogThrottle.current.entries()) {
        if (now - timestamp > staleThreshold) {
          unknownShapeLogThrottle.current.delete(shapeId);
        }
      }
    }, 60000); // Run cleanup every minute
    
    return () => clearInterval(cleanupInterval);
  }, []);

  // ===== SIMPLE ACTION IMPLEMENTATIONS =====

  /**
   * Select a shape 
   */
  const selectShape = useCallback((id) => {
    store.selectedIds.clear();
    store.selectedIds.add(id);
    triggerUpdate(); // Force React re-render
    console.log('🎯 Shape selected:', id);
  }, [store, triggerUpdate]);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    store.selectedIds.clear();
    triggerUpdate(); // Force React re-render
    console.log('🎯 All selections cleared');
  }, [store, triggerUpdate]);

  // Drag state refs (simplified - Konva handles the mechanics)

  /**
   * Start drag operation (simplified for Konva)
   */
  const startDrag = useCallback((initialPos) => {    
    if (store.selectedIds.size === 0) {
      console.warn('⚠️ Cannot start drag: no shapes selected');
      return false;
    }

    store.isDragging = true;
    console.log('🚀 Drag started for', store.selectedIds.size, 'shapes');
    return true;
  }, [store]);

  /**
   * Update drag positions - For Konva drag events (simplified)
   */
  const updateDragPositions = useCallback((currentPosition) => {
    if (!store.isDragging) {
      console.log('⚠️ updateDragPositions called but not dragging');
      return;
    }

    console.log('🎯 Updating drag position:', currentPosition, 'for', store.selectedIds.size, 'shapes');

    // Update selected shapes in store and send real-time updates
    store.selectedIds.forEach(shapeId => {
      const shape = store.shapes.get(shapeId);
      
      if (shape) {
        console.log('📦 Updating shape in store:', shapeId, 'type:', shape.type, 'from:', {x: shape.x, y: shape.y}, 'to:', currentPosition);
        
        // Update shape position in store for immediate visual feedback
        shape.x = currentPosition.x;
        shape.y = currentPosition.y;
        
        // Send real-time position to other users immediately (throttled internally)
        throttledUpdateShapePosition(shapeId, currentPosition);
        console.log('📡 Sent real-time update for shape:', shapeId, shape.type, currentPosition);
      } else {
        console.log('❌ Shape not found in store:', shapeId);
      }
    });

    // Trigger React re-render for smooth visual dragging
    triggerUpdate();
    console.log('🔄 Triggered React re-render after drag position update');
  }, [store, triggerUpdate]);

  /**
   * End drag - Sync final positions to database for persistence (simplified)
   */
  const endDrag = useCallback(async () => {
    if (!store.isDragging) return;

    const finalPositions = [];
    
    // Collect final positions of all dragged shapes
    store.selectedIds.forEach(shapeId => {
      const shape = store.shapes.get(shapeId);
      if (shape) {
        finalPositions.push({
          id: shapeId,
          x: Math.round(shape.x * 100) / 100, // Round to avoid float precision issues
          y: Math.round(shape.y * 100) / 100
        });
      }
    });

    store.isDragging = false;
    console.log('🏁 Drag ended with final positions:', finalPositions);

    // Sync all final positions to database AND real-time
    if (finalPositions.length > 0) {
      try {
        // Send final positions to real-time database immediately (no throttling)
        finalPositions.forEach(({ id, x, y }) => {
          forceUpdateShapePosition(id, { x, y });
        });

        // Sync to Firestore for persistence
        const updatePromises = finalPositions.map(({ id, x, y }) => 
          updateSyncedShape(id, {
            x,
            y,
            lastModified: Date.now(),
            lastModifiedBy: getCurrentUser()?.uid || 'anonymous'
          })
        );

        await Promise.all(updatePromises);
        console.log('✅ Drag completed - synced', finalPositions.length, 'shapes to database and real-time');
      } catch (error) {
        console.error('❌ Error syncing drag to database:', error);
      }
    }
  }, [store, updateSyncedShape]);

  /**
   * Add new shape with database sync
   */
  const addShape = useCallback(async (shapeData) => {
    const currentUser = getCurrentUser();
    const timestamp = Date.now();
    const userId = currentUser?.uid?.substring(0, 8) || 'anon';
    const random = Math.random().toString(36).substring(2, 8);
    
    const newShape = {
      id: `shape-${userId}-${timestamp}-${random}`,
      type: shapeData.type || 'rectangle',
      x: shapeData.x || 100,
      y: shapeData.y || 100,
      width: shapeData.width || DEFAULT_SHAPE.width,
      height: shapeData.height || DEFAULT_SHAPE.height,
      fill: shapeData.fill || SHAPE_COLORS[shapes.length % SHAPE_COLORS.length],
      rotation: shapeData.rotation || 0,
      scaleX: shapeData.scaleX || 1,
      scaleY: shapeData.scaleY || 1,
      createdBy: currentUser?.uid || 'anonymous',
      createdAt: timestamp,
      ...shapeData
    };

    try {
      // Add to store immediately for responsive UI
      store.shapes.set(newShape.id, newShape);
      selectShape(newShape.id); // This already triggers re-render
      
      // Send position to real-time for immediate visibility to other users
      forceUpdateShapePosition(newShape.id, { x: newShape.x, y: newShape.y });
      
      // Sync to database for persistence
      await createSyncedShape(newShape);
      
      console.log('✅ Shape created locally and synced to database + real-time:', newShape.id);
      return newShape;
      
    } catch (error) {
      console.error('❌ Error creating shape:', error);
      // Remove from store on error
      store.shapes.delete(newShape.id);
      triggerUpdate(); // Re-render after cleanup
      throw error;
    }
  }, [store, selectShape, createSyncedShape]);

  /**
   * Update existing shape with immediate local update + database sync
   */
  const updateShape = useCallback(async (id, updates) => {
    try {
      // Update local shape immediately for responsive UI
      const shape = store.shapes.get(id);
      if (shape) {
        Object.assign(shape, updates);
        
        // If position changed, send real-time update to other users immediately
        if (updates.x !== undefined || updates.y !== undefined) {
          forceUpdateShapePosition(id, { x: shape.x, y: shape.y });
        }
      }

      // Sync to database for persistence and other users
      await updateSyncedShape(id, {
        ...updates,
        lastModified: Date.now(),
        lastModifiedBy: getCurrentUser()?.uid || 'anonymous'
      });
      
      console.log('📝 Shape updated locally and synced to database + real-time:', id, updates);
    } catch (error) {
      console.error('❌ Error updating shape:', error);
      throw error;
    }
  }, [store, updateSyncedShape]);

  /**
   * Delete shape with database sync
   */
  const deleteShape = useCallback(async (id) => {
    try {
      // Remove from store immediately 
      store.shapes.delete(id);
      store.selectedIds.delete(id);
      triggerUpdate(); // Force React re-render
      
      // Sync to database
      await deleteSyncedShape(id);
      
      console.log('🗑️ Shape deleted from database:', id);
    } catch (error) {
      console.error('❌ Error deleting shape:', error);
      throw error;
    }
  }, [store, deleteSyncedShape, triggerUpdate]);

  /**
   * Delete selected shapes with database sync
   */
  const deleteSelectedShapes = useCallback(async () => {    
    if (selectedIds.length === 0) return;
    
    try {
      // Remove from store immediately
      selectedIds.forEach(id => {
        store.shapes.delete(id);
        store.selectedIds.delete(id);
      });
      triggerUpdate(); // Force React re-render
      
      // Sync to database
      const deletePromises = selectedIds.map(id => deleteSyncedShape(id));
      await Promise.all(deletePromises);
      
      console.log('🗑️ Deleted from database:', selectedIds.length, 'shapes');
    } catch (error) {
      console.error('❌ Error deleting selected shapes:', error);
    }
  }, [selectedIds, store, deleteSyncedShape, triggerUpdate]);

  /**
   * Delete all shapes with database sync
   */
  const deleteAllShapes = useCallback(async () => {    
    if (shapes.length === 0) return;
    
    try {
      // Clear store immediately
      store.shapes.clear();
      store.selectedIds.clear();
      triggerUpdate(); // Force React re-render
      
      // Sync to database
      const deletePromises = shapes.map(shape => deleteSyncedShape(shape.id));
      await Promise.all(deletePromises);
      
      console.log('🗑️ Deleted all shapes from database:', shapes.length);
    } catch (error) {
      console.error('❌ Error deleting all shapes:', error);
    }
  }, [shapes, store, deleteSyncedShape, triggerUpdate]);

  /**
   * Get next color for shapes
   */
  const getNextColor = useCallback(() => {
    const colorIndex = shapes.length % SHAPE_COLORS.length;
    return SHAPE_COLORS[colorIndex];
  }, [shapes]);

  // ===== CONTEXT VALUE =====

  const value = {
    // State from store (reactive)
    shapes,
    selectedIds,
    selectedId,
    stageRef,
    stageScale,
    stagePosition,
    syncStatus,
    syncLoading,
    isDragging,
    
    // Shape management
    addShape,
    updateShape,
    deleteShape,
    deleteSelectedShapes,
    deleteAllShapes,
    
    // Selection (single-select only) 
    selectShape,
    clearSelection,
    isShapeSelected: (id) => store.selectedIds.has(id),
    
    // Drag operations 
    startDrag,
    updateDragPositions,
    endDrag,
    
    // Utilities
    updateStageTransform: (scale, position) => {
      if (scale !== undefined) store.stageScale = scale;
      if (position !== undefined) store.stagePosition = position;
    },
    getShape: (id) => shapes.find(shape => shape.id === id),
    getSelectedShape: () => {
      const selected = shapes.filter(shape => store.selectedIds.has(shape.id));
      return selected.length > 0 ? selected[0] : null;
    },
    getSelectedShapes: () => {
      return shapes.filter(shape => store.selectedIds.has(shape.id));
    },
    getNextColor,
    
    // Legacy compatibility
    localDragStates: store.locallyDraggedShapes || new Set(),
    clearRealtimePosition: (id) => {
      // Not needed with new architecture but kept for compatibility
    }
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}
