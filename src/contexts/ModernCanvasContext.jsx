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

export function CanvasProvider({ children, projectId }) {
  // SIMPLIFIED: Get the store instance directly for immediate functionality
  const store = useCanvasStore();
  
  // Reactive state that triggers re-renders when store changes
  const [, forceUpdate] = useState({});
  const triggerUpdate = useCallback(() => forceUpdate({}), []);

  // Drawing mode state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentDrawingPath, setCurrentDrawingPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Transform mode state
  const [isTransforming, setIsTransforming] = useState(false);

  // Basic reactive state (keep it simple for now)
  const shapes = store.shapes ? Array.from(store.shapes.values()) : [];
  const selectedIds = store.selectedIds ? Array.from(store.selectedIds) : [];
  const selectedId = selectedIds.length > 0 ? selectedIds[0] : null;
  const stageScale = store.stageScale || 1;
  const stagePosition = store.stagePosition || { x: 0, y: 0 };
  const syncStatus = store.syncStatus || 'connecting';
  const syncLoading = store.syncLoading || false;
  const isDragging = store.isDragging || false;
  
  // Ensure store values are properly tracked for re-renders
  useEffect(() => {
    const unsubscribe = useCanvasStore.subscribe(
      (state) => state.stageScale,
      () => {
        triggerUpdate();
      }
    );
    const unsubscribe2 = useCanvasStore.subscribe(
      (state) => state.stagePosition,
      () => {
        triggerUpdate();
      }
    );
    return () => {
      unsubscribe();
      unsubscribe2();
    };
  }, [triggerUpdate]);
  
  // Firebase sync hooks
  const {
    shapes: syncedShapes,
    syncStatus: firebaseSyncStatus,
    loading: firebaseSyncLoading,
    createShape: createSyncedShape,
    updateShape: updateSyncedShape,
    deleteShape: deleteSyncedShape,
    updateShapesBatch
  } = useCanvasSync(projectId);

  const stageRef = useRef(null);

  // ===== SYNC SHAPES FROM FIREBASE TO STORE =====
  useEffect(() => {
    if (syncedShapes && syncedShapes.length >= 0) {
      console.log('🔄 Syncing shapes from Firestore:', syncedShapes.length, 'shapes');
      
      // Update store directly (simple approach)
      store.shapes.clear();
      syncedShapes.forEach(shape => {
        store.shapes.set(shape.id, shape);
        
        // Apply any pending position updates for this shape
        const pendingUpdate = pendingUpdatesRef.current.get(shape.id);
        if (pendingUpdate) {
          const originalPosition = { x: shape.x, y: shape.y };
          shape.x = pendingUpdate.x;
          shape.y = pendingUpdate.y;
          pendingUpdatesRef.current.delete(shape.id);
          
          // Log successful application of cached update
          console.log(`✅ Applied cached position update for shape ${shape.id.substring(0, 20)}...:`, 
            `(${originalPosition.x}, ${originalPosition.y}) → (${shape.x}, ${shape.y})`);
        }
      });
      
      // INCOMPLETE DRAG RECOVERY: Check for shapes that might be in an incomplete drag state
      // This handles cases where a user refreshed during a drag and the final positions weren't synced
      const currentUser = getCurrentUser();
      const now = Date.now();
      let recoveredShapes = 0;
      
      syncedShapes.forEach(shape => {
        // Check if this shape has recent real-time position data that's newer than Firestore
        const realtimeData = pendingUpdatesRef.current.get(shape.id);
        if (realtimeData && realtimeData.timestamp) {
          const timeDiff = now - realtimeData.timestamp;
          // If real-time data is recent (within 30 seconds) and from another user, apply it
          if (timeDiff < 30000 && realtimeData.updatedBy !== currentUser?.uid) {
            console.log(`🔄 INCOMPLETE DRAG RECOVERY: Applying real-time position for shape ${shape.id.substring(0, 20)}...`);
            shape.x = realtimeData.x;
            shape.y = realtimeData.y;
            recoveredShapes++;
          }
        }
      });
      
      if (recoveredShapes > 0) {
        console.log(`🔄 Recovered ${recoveredShapes} shapes from incomplete drag operations`);
      }
      
      triggerUpdate(); // Force React re-render when shapes sync from database
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
    const currentUser = getCurrentUser();
    
    console.log('📡 Received real-time position updates:', Object.keys(positionUpdates).length, 'shapes');
    
    // positionUpdates is an object, not a Map, so we iterate over its keys
    Object.entries(positionUpdates).forEach(([id, pos]) => {
      const shape = store.shapes.get(id);
      
      if (shape) {
        // Clear any pending updates for this shape since we now have it
        pendingUpdatesRef.current.delete(id);
        
        // ENHANCED ANTI-JITTER: Check user ownership to allow updates from other users
        const isLocallyDragged = store.locallyDraggedShapes && store.locallyDraggedShapes.has(id);
        const isFromCurrentUser = pos.updatedBy === currentUser?.uid;
        
        // PAGE REFRESH RECOVERY: Always apply position updates after page refresh
        // to ensure the refreshed user gets the latest positions from ongoing drags
        const isRecentUpdate = pos.timestamp && (Date.now() - pos.timestamp) < 10000; // Within 10 seconds
        const isPageRefresh = !isFromCurrentUser && isRecentUpdate;
        
        // Only block if WE are dragging it locally AND the update is from us (prevent echo)
        // Allow updates from OTHER users even if we have the shape selected
        // Allow recent updates during page refresh recovery
        if (!isLocallyDragged || !isFromCurrentUser || isPageRefresh) {
          const oldPosition = { x: shape.x, y: shape.y };
          shape.x = pos.x;
          shape.y = pos.y;
          updatedAny = true;
          
          if (isPageRefresh) {
            console.log('🔄 PAGE REFRESH RECOVERY: Applied position update:', id, 'from', oldPosition, 'to', pos);
          } else {
            console.log('📡 Applied real-time update:', id, 'from user:', pos.updatedBy || 'unknown');
          }
        } else {
          console.log('🚫 BLOCKED real-time update (anti-jitter):', id, 'is being dragged locally by us');
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
          console.warn('Position update received for unknown shape:', id.substring(0, 20) + '...', '(Normal in collaborative mode - cached for when shape loads)');
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

  // ===== INCOMPLETE DRAG DETECTION ON PAGE LOAD =====
  // Check for incomplete drags from previous sessions and sync them
  useEffect(() => {
    const checkForIncompleteDrags = async () => {
      // This runs once on component mount to handle incomplete drags from previous sessions
      console.log('🔍 Checking for incomplete drags from previous sessions...');
      
      // The real-time position updates will handle most cases,
      // but we can also check if there are any shapes that need position sync
      if (store.shapes.size > 0) {
        const currentUser = getCurrentUser();
        const now = Date.now();
        let needsSync = false;
        
        // Check if any shapes have recent real-time data that needs to be synced to Firestore
        store.shapes.forEach((shape, shapeId) => {
          const realtimeData = pendingUpdatesRef.current.get(shapeId);
          if (realtimeData && realtimeData.timestamp) {
            const timeDiff = now - realtimeData.timestamp;
            // If real-time data is recent (within 60 seconds) and from another user, sync it
            if (timeDiff < 60000 && realtimeData.updatedBy !== currentUser?.uid) {
              console.log(`🔄 Found incomplete drag for shape ${shapeId.substring(0, 20)}... - syncing to Firestore`);
              needsSync = true;
            }
          }
        });
        
        if (needsSync) {
          // Trigger a sync to Firestore for any shapes that need it
          const positionsToSync = [];
          store.shapes.forEach((shape, shapeId) => {
            positionsToSync.push({
              id: shapeId,
              x: shape.x,
              y: shape.y,
              lastModified: Date.now(),
              lastModifiedBy: currentUser?.uid || 'anonymous'
            });
          });
          
          try {
            await updateShapesBatch(positionsToSync);
            console.log('✅ Synced incomplete drag positions to Firestore');
          } catch (error) {
            console.error('❌ Error syncing incomplete drag positions:', error);
          }
        }
      }
    };
    
    // Run the check after a short delay to allow real-time updates to arrive first
    const timeoutId = setTimeout(checkForIncompleteDrags, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [store.shapes, updateShapesBatch]);


  // ===== PERIODIC SYNC TO FIRESTORE =====
  // Sync real-time positions to Firestore periodically to prevent desync
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (store.shapes.size > 0) {
        const positionsToSync = [];
        
        // Collect all current positions
        store.shapes.forEach((shape, shapeId) => {
          positionsToSync.push({
            id: shapeId,
            x: shape.x,
            y: shape.y,
            lastModified: Date.now(),
            lastModifiedBy: getCurrentUser()?.uid || 'anonymous'
          });
        });
        
        if (positionsToSync.length > 0) {
          try {
            await updateShapesBatch(positionsToSync);
            console.log('🔄 Periodic sync: Updated', positionsToSync.length, 'shapes in Firestore');
          } catch (error) {
            console.error('❌ Error in periodic sync:', error);
          }
        }
      }
    }, 30000); // Sync every 30 seconds
    
    return () => clearInterval(syncInterval);
  }, [store.shapes, updateShapesBatch]);

  // ===== ORPHANED UPDATE CLEANUP SYSTEM =====
  
  /**
   * Clean up orphaned position updates that have been cached for too long
   * This prevents memory buildup from stale updates that will never be applied
   */
  const cleanupOrphanedUpdates = useCallback((timeoutMs = 60000) => {
    const now = Date.now();
    const staleThreshold = timeoutMs;
    let removedCount = 0;
    const removedShapeIds = [];
    
    // Clean up pending updates older than threshold
    for (const [shapeId, update] of pendingUpdatesRef.current.entries()) {
      if (update.timestamp && (now - update.timestamp > staleThreshold)) {
        // Check if shape exists in current canvas state before removing
        const shapeExists = store.shapes.has(shapeId);
        if (!shapeExists) {
          pendingUpdatesRef.current.delete(shapeId);
          removedCount++;
          removedShapeIds.push(shapeId);
        }
      }
    }
    
    // Clean up throttle map entries older than threshold
    for (const [shapeId, timestamp] of unknownShapeLogThrottle.current.entries()) {
      if (now - timestamp > staleThreshold) {
        unknownShapeLogThrottle.current.delete(shapeId);
      }
    }
    
    // Log cleanup results
    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} orphaned position updates:`, 
        removedShapeIds.map(id => id.substring(0, 20) + '...'));
    }
    
    return { removedCount, removedShapeIds };
  }, [store.shapes]);

  /**
   * Get current count of orphaned updates for monitoring
   */
  const getOrphanedUpdateCount = useCallback(() => {
    return pendingUpdatesRef.current.size;
  }, []);

  // Schedule periodic cleanup and metrics logging
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const beforeCount = getOrphanedUpdateCount();
      const result = cleanupOrphanedUpdates(60000); // 1 minute timeout
      const afterCount = getOrphanedUpdateCount();
      
      // Log metrics every cleanup cycle
      console.log(`📊 Orphaned Updates Metrics: ${beforeCount} → ${afterCount} (removed: ${result.removedCount})`);
    }, 120000); // Run cleanup every 2 minutes
    
    return () => clearInterval(cleanupInterval);
  }, [cleanupOrphanedUpdates, getOrphanedUpdateCount]);

  // ===== SIMPLE ACTION IMPLEMENTATIONS =====

  /**
   * Select a shape (single select)
   */
  const selectShape = useCallback((id) => {
    store.selectedIds.clear();
    store.selectedIds.add(id);
    triggerUpdate(); // Force React re-render
  }, [store, triggerUpdate]);

  /**
   * Toggle shape selection (for Ctrl+click and Shift+click)
   */
  const toggleShapeSelection = useCallback((id) => {
    if (store.selectedIds.has(id)) {
      store.selectedIds.delete(id);
    } else {
      store.selectedIds.add(id);
    }
    triggerUpdate(); // Force React re-render
  }, [store, triggerUpdate]);

  /**
   * Add shape to selection (for Shift+click)
   */
  const addToSelection = useCallback((id) => {
    store.selectedIds.add(id);
    triggerUpdate(); // Force React re-render
    console.log('🎯 Shape added to selection:', id);
  }, [store, triggerUpdate]);

  /**
   * Select all shapes
   */
  const selectAllShapes = useCallback(() => {
    store.selectedIds.clear();
    shapes.forEach(shape => {
      store.selectedIds.add(shape.id);
    });
    triggerUpdate(); // Force React re-render
    console.log('🎯 All shapes selected:', store.selectedIds.size, 'shapes');
  }, [store, triggerUpdate, shapes]);

  /**
   * Select shapes by type
   */
  const selectShapesByType = useCallback((shapeType) => {
    store.selectedIds.clear();
    shapes.forEach(shape => {
      if (shape.type === shapeType) {
        store.selectedIds.add(shape.id);
      }
    });
    triggerUpdate(); // Force React re-render
    console.log('🎯 Shapes selected by type:', shapeType, store.selectedIds.size, 'shapes');
  }, [store, triggerUpdate, shapes]);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    store.selectedIds.clear();
    triggerUpdate(); // Force React re-render
    console.log('🎯 All selections cleared');
  }, [store, triggerUpdate]);

  // Drag state refs (simplified - Konva handles the mechanics)
  const dragStartPositions = useRef(new Map()); // Store original positions for group dragging

  /**
   * Start drag operation (simplified for Konva)
   */
  const startDrag = useCallback((draggedShapeId) => {    
    if (store.selectedIds.size === 0) {
      console.warn('⚠️ Cannot start drag: no shapes selected');
      return false;
    }

    store.isDragging = true;
    
    // Store original positions of all selected shapes for group dragging
    dragStartPositions.current.clear();
    store.selectedIds.forEach(shapeId => {
      const shape = store.shapes.get(shapeId);
      if (shape) {
        dragStartPositions.current.set(shapeId, { x: shape.x, y: shape.y });
      }
    });
    
    // ANTI-JITTER: Mark all selected shapes as being dragged locally
    // This prevents remote updates from interfering with local drag
    if (!store.locallyDraggedShapes) {
      store.locallyDraggedShapes = new Set();
    }
    store.selectedIds.forEach(shapeId => {
      store.locallyDraggedShapes.add(shapeId);
    });
    
    console.log('🚀 Drag started for', store.selectedIds.size, 'shapes (anti-jitter enabled)');
    return true;
  }, [store]);

  /**
   * Update drag positions - For multi-select group dragging
   */
  const updateDragPositions = useCallback((draggedShapeId, newPosition) => {
    if (!store.isDragging) {
      console.log('⚠️ updateDragPositions called but not dragging');
      return;
    }

    const draggedShapeOriginalPos = dragStartPositions.current.get(draggedShapeId);
    if (!draggedShapeOriginalPos) {
      console.log('❌ No original position found for dragged shape:', draggedShapeId);
      return;
    }

    // Calculate the offset from the dragged shape's original position
    const deltaX = newPosition.x - draggedShapeOriginalPos.x;
    const deltaY = newPosition.y - draggedShapeOriginalPos.y;

    console.log('🎯 Group drag update - delta:', { deltaX, deltaY }, 'for', store.selectedIds.size, 'shapes');

    // Update all selected shapes maintaining their relative positions
    let shapesUpdated = 0;
    store.selectedIds.forEach(shapeId => {
      const shape = store.shapes.get(shapeId);
      const originalPos = dragStartPositions.current.get(shapeId);
      
      if (shape && originalPos) {
        const newX = originalPos.x + deltaX;
        const newY = originalPos.y + deltaY;
        
        console.log('📦 Moving shape:', shapeId, 'from original:', originalPos, 'to:', {x: newX, y: newY});
        
        // Update shape position in store for immediate visual feedback
        shape.x = newX;
        shape.y = newY;
        
        // Send real-time position to other users immediately (throttled internally)
        throttledUpdateShapePosition(shapeId, { x: newX, y: newY });
        shapesUpdated++;
      } else {
        console.log('❌ Shape or original position not found:', shapeId);
      }
    });
    
    console.log('🚀 Multi-drag update: Updated', shapesUpdated, 'shapes with real-time sync');

    // Trigger React re-render for smooth visual dragging
    triggerUpdate();
  }, [store, triggerUpdate]);

  /**
   * End drag - Sync final positions to database for persistence (atomic batch update)
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
    
    // Clear drag start positions
    dragStartPositions.current.clear();
    
    // ANTI-JITTER: Clear locally dragged shapes after a delay
    // This allows the final positions to propagate before allowing remote updates
    setTimeout(() => {
      if (store.locallyDraggedShapes) {
        store.locallyDraggedShapes.clear();
        console.log('🔓 Cleared locally dragged shapes (anti-jitter)');
      }
    }, 500);
    
    console.log('🏁 Drag ended with final positions:', finalPositions);

    // Sync all final positions to database AND real-time
    if (finalPositions.length > 0) {
      try {
        // Send final positions to real-time database immediately (no throttling)
        finalPositions.forEach(({ id, x, y }) => {
          forceUpdateShapePosition(id, { x, y });
        });

        // ATOMIC BATCH UPDATE: Sync to Firestore for persistence
        const batchUpdates = finalPositions.map(({ id, x, y }) => ({
          id,
          x,
          y,
          lastModified: Date.now(),
          lastModifiedBy: getCurrentUser()?.uid || 'anonymous'
        }));

        await updateShapesBatch(batchUpdates);
        console.log('✅ Drag completed - synced', finalPositions.length, 'shapes atomically to database and real-time');
      } catch (error) {
        console.error('❌ Error syncing drag to database:', error);
      }
    }
  }, [store, updateShapesBatch]);

  // ===== PAGE UNLOAD HANDLING =====
  // Ensure drag operations complete before page unload/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (store.isDragging) {
        console.log('🔄 Page unloading during drag - completing drag operation');
        // Use synchronous approach for beforeunload since async might not complete
        const finalPositions = [];
        store.selectedIds.forEach(shapeId => {
          const shape = store.shapes.get(shapeId);
          if (shape) {
            finalPositions.push({
              id: shapeId,
              x: Math.round(shape.x * 100) / 100,
              y: Math.round(shape.y * 100) / 100
            });
          }
        });
        
        if (finalPositions.length > 0) {
          // Send final positions to real-time database immediately (synchronous)
          finalPositions.forEach(({ id, x, y }) => {
            forceUpdateShapePosition(id, { x, y });
          });
          console.log('🔄 Synced', finalPositions.length, 'shapes to real-time database before unload');
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && store.isDragging) {
        console.log('🔄 Page hidden during drag - completing drag operation');
        endDrag(); // This will sync all positions to database
      }
    };

    // Handle page refresh/close
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Handle tab switching (also triggers on mobile app switching)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [store.isDragging, store.selectedIds, store.shapes, endDrag]);

  // ===== LAYER MANAGEMENT FUNCTIONS =====
  // (Defined early to be used by addShape and other functions)

  /**
   * Get the highest z-index among all shapes
   */
  const getMaxZIndex = useCallback(() => {
    let maxZ = 0;
    shapes.forEach(shape => {
      if (shape.zIndex && shape.zIndex > maxZ) {
        maxZ = shape.zIndex;
      }
    });
    return maxZ;
  }, [shapes]);

  /**
   * Get the lowest z-index among all shapes
   */
  const getMinZIndex = useCallback(() => {
    let minZ = 0;
    shapes.forEach(shape => {
      if (shape.zIndex !== undefined && shape.zIndex < minZ) {
        minZ = shape.zIndex;
      }
    });
    return minZ;
  }, [shapes]);

  /**
   * Add new shape with database sync
   */
  const addShape = useCallback(async (shapeData) => {
    console.log(`🎨 addShape called with data:`, shapeData);
    
    const currentUser = getCurrentUser();
    const timestamp = Date.now();
    const userId = currentUser?.uid?.substring(0, 8) || 'anon';
    const random = Math.random().toString(36).substring(2, 8);
    
    const newShape = {
      id: `shape-${userId}-${timestamp}-${random}`,
      type: shapeData.type || 'rectangle',
      x: shapeData.x || 0,
      y: shapeData.y || 0,
      zIndex: getMaxZIndex() + 1, // Place new shapes on top
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
    
    console.log(`🎨 Created new shape object:`, newShape);

    try {
      // Add to store immediately for responsive UI
      console.log(`📦 Adding shape to store:`, newShape.id);
      store.shapes.set(newShape.id, newShape);
      console.log(`📦 Store now has ${store.shapes.size} shapes`);
      selectShape(newShape.id); // This already triggers re-render
      
      // Send position to real-time for immediate visibility to other users
      forceUpdateShapePosition(newShape.id, { x: newShape.x, y: newShape.y });
      
      // Sync to database for persistence
      console.log(`🔄 Syncing shape ${newShape.id} to database...`);
      try {
        await createSyncedShape(newShape);
        console.log('✅ Shape synced to database successfully:', newShape.id);
      } catch (syncError) {
        console.error('❌ Failed to sync shape to database:', syncError);
        console.error('❌ Shape will remain in local store but may not persist:', newShape.id);
        // Don't throw here - the shape is already in the local store
      }
      
      console.log('✅ Shape created locally and synced to database + real-time:', newShape.id);
      
      // Trigger cleanup after shape creation to clean up any orphaned updates
      cleanupOrphanedUpdates(30000); // 30 second timeout for immediate cleanup
      
      return newShape;
      
    } catch (error) {
      console.error('❌ Error creating shape:', error);
      // Remove from store on error
      store.shapes.delete(newShape.id);
      triggerUpdate(); // Re-render after cleanup
      throw error;
    }
  }, [store, selectShape, createSyncedShape, getMaxZIndex]);

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
   * Bring selected shapes to front
   */
  const bringToFront = useCallback(async () => {
    if (selectedIds.length === 0) return;

    const maxZ = getMaxZIndex();
    let newZ = maxZ + 1;

    // Update each selected shape
    for (const shapeId of selectedIds) {
      await updateShape(shapeId, { zIndex: newZ });
      newZ++; // Ensure multiple shapes maintain their relative order
    }

    console.log('📤 Brought', selectedIds.length, 'shapes to front');
  }, [selectedIds, getMaxZIndex, updateShape]);

  /**
   * Send selected shapes to back
   */
  const sendToBack = useCallback(async () => {
    if (selectedIds.length === 0) return;

    const minZ = getMinZIndex();
    let newZ = minZ - 1;

    // Update each selected shape (reverse order to maintain relative positioning)
    for (let i = selectedIds.length - 1; i >= 0; i--) {
      await updateShape(selectedIds[i], { zIndex: newZ });
      newZ--; // Ensure multiple shapes maintain their relative order
    }

    console.log('📥 Sent', selectedIds.length, 'shapes to back');
  }, [selectedIds, getMinZIndex, updateShape]);

  /**
   * Move selected shapes forward one layer
   */
  const moveForward = useCallback(async () => {
    if (selectedIds.length === 0) return;

    // Sort shapes by current z-index to maintain relative order
    const selectedShapes = selectedIds.map(id => shapes.find(s => s.id === id)).filter(Boolean);
    selectedShapes.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // Move each shape forward
    for (const shape of selectedShapes) {
      const currentZ = shape.zIndex || 0;
      await updateShape(shape.id, { zIndex: currentZ + 1 });
    }

    console.log('⬆️ Moved', selectedIds.length, 'shapes forward');
  }, [selectedIds, shapes, updateShape]);

  /**
   * Move selected shapes backward one layer
   */
  const moveBackward = useCallback(async () => {
    if (selectedIds.length === 0) return;

    // Sort shapes by current z-index (reverse order) to maintain relative order
    const selectedShapes = selectedIds.map(id => shapes.find(s => s.id === id)).filter(Boolean);
    selectedShapes.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

    // Move each shape backward
    for (const shape of selectedShapes) {
      const currentZ = shape.zIndex || 0;
      await updateShape(shape.id, { zIndex: currentZ - 1 });
    }

    console.log('⬇️ Moved', selectedIds.length, 'shapes backward');
  }, [selectedIds, shapes, updateShape]);

  /**
   * Set specific z-index for a shape
   */
  const setShapeZIndex = useCallback(async (shapeId, zIndex) => {
    await updateShape(shapeId, { zIndex });
    console.log('🎚️ Set z-index', zIndex, 'for shape:', shapeId);
  }, [updateShape]);

  /**
   * Add anchor point to bezier curve
   */
  const addBezierPoint = useCallback(async (shapeId) => {
    console.log('🔍 Adding bezier point to shape:', shapeId);
    const shape = store.shapes.get(shapeId);
    console.log('🔍 Shape found:', shape?.id, 'type:', shape?.type);
    
    if (!shape || shape.type !== 'bezier_curve') {
      console.warn('❌ Cannot add point: shape not found or not a bezier curve', {
        shapeExists: !!shape,
        shapeType: shape?.type,
        expectedType: 'bezier_curve'
      });
      return;
    }

    const currentPoints = shape.anchorPoints || [];
    if (currentPoints.length < 2) {
      console.warn('❌ Cannot add point: curve needs at least 2 anchor points');
      return;
    }

    // Add new point at the end, extending the curve naturally
    const lastPoint = currentPoints[currentPoints.length - 1];
    const secondLastPoint = currentPoints[currentPoints.length - 2];
    
    // Calculate direction vector and extend the curve
    const direction = {
      x: lastPoint.x - secondLastPoint.x,
      y: lastPoint.y - secondLastPoint.y
    };
    
    const newPoint = {
      x: lastPoint.x + direction.x * 0.8,
      y: lastPoint.y + direction.y * 0.8
    };

    const newAnchorPoints = [...currentPoints, newPoint];
    
    await updateShape(shapeId, { anchorPoints: newAnchorPoints });
    console.log('➕ Added bezier point to curve:', shapeId, newPoint);
  }, [store, updateShape]);

  /**
   * Remove anchor point from bezier curve
   */
  const removeBezierPoint = useCallback(async (shapeId, pointIndex) => {
    const shape = store.shapes.get(shapeId);
    if (!shape || shape.type !== 'bezier_curve') {
      console.warn('❌ Cannot remove point: shape not found or not a bezier curve');
      return;
    }

    const currentPoints = shape.anchorPoints || [];
    if (currentPoints.length <= 2) {
      console.warn('❌ Cannot remove point: curve needs at least 2 anchor points');
      return;
    }

    if (pointIndex < 0 || pointIndex >= currentPoints.length) {
      console.warn('❌ Cannot remove point: invalid index');
      return;
    }

    const newAnchorPoints = currentPoints.filter((_, index) => index !== pointIndex);
    
    await updateShape(shapeId, { anchorPoints: newAnchorPoints });
    console.log('➖ Removed bezier point from curve:', shapeId, pointIndex);
  }, [store, updateShape]);

  /**
   * Update anchor point position in bezier curve (immediate for smooth dragging)
   */
  const updateBezierPoint = useCallback((shapeId, pointIndex, newPosition) => {
    const shape = store.shapes.get(shapeId);
    if (!shape || shape.type !== 'bezier_curve') {
      return;
    }

    const currentPoints = shape.anchorPoints || [];
    if (pointIndex < 0 || pointIndex >= currentPoints.length) {
      return;
    }

    const newAnchorPoints = [...currentPoints];
    newAnchorPoints[pointIndex] = { ...newPosition };
    
    // Update local shape immediately for smooth visual feedback
    shape.anchorPoints = newAnchorPoints;
    triggerUpdate(); // Force React re-render
    
    console.log('📍 Updated bezier anchor point:', pointIndex, 'to:', newPosition);
  }, [store, triggerUpdate]);

  /**
   * Sync bezier point changes to database (called on drag end)
   */
  const syncBezierPoints = useCallback(async (shapeId) => {
    const shape = store.shapes.get(shapeId);
    if (!shape || shape.type !== 'bezier_curve') {
      return;
    }

    try {
      await updateShape(shapeId, { 
        anchorPoints: shape.anchorPoints,
        lastModified: Date.now(),
        lastModifiedBy: getCurrentUser()?.uid || 'anonymous'
      });
      console.log('✅ Synced bezier points to database:', shapeId);
    } catch (error) {
      console.error('❌ Error syncing bezier points:', error);
    }
  }, [store, updateShape]);

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

  /**
   * Toggle drawing mode on/off
   */
  const toggleDrawingMode = useCallback(() => {
    setIsDrawingMode(prev => {
      const newMode = !prev;
      if (!newMode) {
        // Clear any current drawing when exiting drawing mode
        setCurrentDrawingPath([]);
        setIsDrawing(false);
      }
      return newMode;
    });
  }, []);

  /**
   * Start drawing a new path
   */
  const startDrawing = useCallback((point) => {
    if (!isDrawingMode) return false;
    
    // Validate coordinates before starting
    if (isNaN(point.x) || isNaN(point.y) || !isFinite(point.x) || !isFinite(point.y)) {
      console.warn('Invalid drawing start point:', point);
      return false; // Don't start drawing with invalid coordinates
    }
    
    setIsDrawing(true);
    setCurrentDrawingPath([point.x, point.y]);
    console.log('🎨 Drawing started at:', { x: point.x, y: point.y });
    return true;
  }, [isDrawingMode]);

  /**
   * Add point to current drawing path (with validation to prevent artifacts)
   */
  const addDrawingPoint = useCallback((point) => {
    if (!isDrawing) return;
    
    setCurrentDrawingPath(prev => {
      // Validate point coordinates first
      if (isNaN(point.x) || isNaN(point.y) || !isFinite(point.x) || !isFinite(point.y)) {
        console.warn('Invalid drawing point detected:', point);
        return prev; // Skip invalid points
      }
      
      if (prev.length >= 2) {
        const lastX = prev[prev.length - 2];
        const lastY = prev[prev.length - 1];
        const distance = Math.sqrt(Math.pow(point.x - lastX, 2) + Math.pow(point.y - lastY, 2));
        
        // Skip points that are too close (prevents over-dense paths)
        if (distance < 2) {
          return prev;
        }
        
        // Skip points that are too far away (prevents zig-zag artifacts from coordinate errors)
        // This is especially important when zoomed in/out
        if (distance > 500) {
          console.warn('Drawing point too far from previous point (likely coordinate error):', {
            prev: { x: lastX, y: lastY },
            current: point,
            distance: distance
          });
          return prev; // Skip this point to prevent large jumps
        }
      }
      
      return [...prev, point.x, point.y];
    });
  }, [isDrawing]);

  /**
   * Finish current drawing and create a line shape
   */
  const finishDrawing = useCallback(async () => {
    if (!isDrawing || currentDrawingPath.length < 4) {
      // Need at least 2 points (4 coordinates) to make a line
      setIsDrawing(false);
      setCurrentDrawingPath([]);
      return;
    }

    // Create a line shape from the drawn path
    const currentUser = getCurrentUser();
    const timestamp = Date.now();
    
    const newShape = {
      id: `shape_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'line',
      x: 0, // Points are absolute, so shape position is at origin
      y: 0,
      points: currentDrawingPath,
      stroke: getNextColor(),
      strokeWidth: 3,
      closed: false,
      createdBy: currentUser?.uid || 'anonymous',
      createdAt: new Date(),
      lastModifiedBy: currentUser?.uid || 'anonymous',
      lastModifiedAt: new Date()
    };

    // Add to store and sync to database
    store.shapes.set(newShape.id, newShape);
    triggerUpdate();

    try {
      await createSyncedShape(newShape);
      console.log('✅ Drawing saved as shape:', newShape.id);
      
      // Trigger cleanup after drawing completion
      cleanupOrphanedUpdates(30000); // 30 second timeout for immediate cleanup
    } catch (error) {
      console.error('❌ Error saving drawing:', error);
    }

    // Reset drawing state
    setIsDrawing(false);
    setCurrentDrawingPath([]);
  }, [isDrawing, currentDrawingPath, getNextColor, triggerUpdate, createSyncedShape]);

  /**
   * Cancel current drawing without saving
   */
  const cancelDrawing = useCallback(() => {
    setIsDrawing(false);
    setCurrentDrawingPath([]);
  }, []);

  /**
   * Set transform mode (used by ShapeTransformer)
   */
  const setTransformMode = useCallback((transforming) => {
    setIsTransforming(transforming);
    console.log(transforming ? '🔄 Transform mode ENABLED' : '✅ Transform mode DISABLED');
  }, []);


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
    store, // Add store for direct access to shape objects
    
    // Shape management
    addShape,
    updateShape,
    deleteShape,
    deleteSelectedShapes,
    deleteAllShapes,
    
    // Selection (enhanced multi-select)
    selectShape,
    toggleShapeSelection,
    addToSelection,
    selectAllShapes,
    selectShapesByType,
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
      triggerUpdate(); // Force React re-render when stage transform changes
    },
    
    // Grid snapping utilities (passed from Canvas component)
    snapToGrid: false, // Will be overridden by Canvas
    setSnapToGrid: () => {}, // Will be overridden by Canvas
    getShape: (id) => shapes.find(shape => shape.id === id),
    getSelectedShape: () => {
      const selected = shapes.filter(shape => store.selectedIds.has(shape.id));
      return selected.length > 0 ? selected[0] : null;
    },
    getSelectedShapes: () => {
      return shapes.filter(shape => store.selectedIds.has(shape.id));
    },
    getNextColor,
    
    // Drawing mode functions
    isDrawingMode,
    currentDrawingPath,
    isDrawing,
    toggleDrawingMode,
    startDrawing,
    addDrawingPoint,
    finishDrawing,
    cancelDrawing,
    
    // Transform mode functions
    isTransforming,
    setTransformMode,
    
    // Layer management functions
    getMaxZIndex,
    getMinZIndex,
    bringToFront,
    sendToBack,
    moveForward,
    moveBackward,
    setShapeZIndex,
    
    // Bezier curve functions
    addBezierPoint,
    removeBezierPoint,
    updateBezierPoint,
    syncBezierPoints,
    
    // Legacy compatibility
    localDragStates: store.locallyDraggedShapes || new Set(),
    clearRealtimePosition: (id) => {
      // Not needed with new architecture but kept for compatibility
    },
    
    // Orphaned update cleanup functions
    cleanupOrphanedUpdates,
    getOrphanedUpdateCount,
    
    // Force re-render function
    triggerUpdate
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}
