import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  subscribeToShapes, 
  createShape as createShapeInFirestore,
  updateShape as updateShapeInFirestore,
  deleteShape as deleteShapeInFirestore,
  batchCreateShapes,
  batchDeleteShapes,
  batchUpdateShapes,
  lockShape,
  unlockShape,
  getCanvasState
} from '../services/canvas';
import { getCurrentUser } from '../services/auth';

/**
 * Custom hook for real-time canvas synchronization
 * Manages local state and sync with Firestore
 */
export function useCanvasSync(projectId) {
  const [shapes, setShapes] = useState([]);
  const [syncStatus, setSyncStatus] = useState('connecting'); // 'connecting', 'connected', 'error', 'offline'
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef(null);
  const pendingOperations = useRef(new Set());

  // Handle shape updates from Firestore
  const handleShapesUpdate = useCallback((firestoreShapes) => {
    setShapes(firestoreShapes);
    setSyncStatus('connected');
    setLoading(false);
    console.log('🔄 Shapes synced from Firestore:', firestoreShapes.length);
  }, []);

  // Set up Firestore subscription
  useEffect(() => {
    if (!projectId) {
      console.log('⚠️ No projectId provided to useCanvasSync');
      setLoading(false);
      setSyncStatus('error');
      return;
    }

    console.log('🚀 Setting up canvas sync for:', projectId);
    
    try {
      // Subscribe to real-time updates
      const unsubscribe = subscribeToShapes(projectId, handleShapesUpdate);
      unsubscribeRef.current = unsubscribe;
      
      // Handle connection status
      setSyncStatus('connected');
      
    } catch (error) {
      console.error('❌ Error setting up canvas sync:', error);
      setSyncStatus('error');
      setLoading(false);
    }

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        console.log('🔌 Cleaning up canvas sync');
        unsubscribeRef.current();
      }
    };
  }, [projectId, handleShapesUpdate]);

  // Create shape with Firestore sync
  const createShape = useCallback(async (shapeData) => {
    const operationId = `create-${Date.now()}`;
    
    try {
      pendingOperations.current.add(operationId);
      
      // Optimistically add shape locally
      const tempShape = {
        ...shapeData,
        id: shapeData.id || `shape-${Date.now()}`,
        createdBy: getCurrentUser()?.uid || 'anonymous',
        createdAt: new Date(),
        lastModifiedBy: getCurrentUser()?.uid || 'anonymous',
        lastModifiedAt: new Date(),
        isLocked: false,
        lockedBy: null
      };
      
      setShapes(prevShapes => [...prevShapes, tempShape]);
      
      // Sync to Firestore
      await createShapeInFirestore(projectId, tempShape);
      
      console.log('✅ Shape created and synced:', tempShape.id);
      return tempShape;
      
    } catch (error) {
      console.error('❌ Error creating shape:', error);
      
      // Remove optimistically added shape on error
      setShapes(prevShapes => 
        prevShapes.filter(shape => shape.id !== shapeData.id)
      );
      
      throw error;
    } finally {
      pendingOperations.current.delete(operationId);
    }
  }, [projectId]);

  // Update shape with Firestore sync
  const updateShape = useCallback(async (shapeId, updates) => {
    const operationId = `update-${shapeId}-${Date.now()}`;
    
    try {
      pendingOperations.current.add(operationId);
      
      // Optimistically update shape locally
      setShapes(prevShapes => 
        prevShapes.map(shape =>
          shape.id === shapeId 
            ? { 
                ...shape, 
                ...updates, 
                lastModifiedBy: getCurrentUser()?.uid || 'anonymous',
                lastModifiedAt: new Date()
              }
            : shape
        )
      );
      
      // Sync to Firestore
      await updateShapeInFirestore(projectId, shapeId, updates);
      
      console.log('✅ Shape updated and synced:', shapeId);
      
    } catch (error) {
      console.error('❌ Error updating shape:', error);
      
      // Revert optimistic update on error
      // In a production app, you might want to reload from Firestore
      throw error;
    } finally {
      pendingOperations.current.delete(operationId);
    }
  }, [projectId]);

  // Delete shape with Firestore sync  
  const deleteShape = useCallback(async (shapeId) => {
    const operationId = `delete-${shapeId}-${Date.now()}`;
    
    try {
      pendingOperations.current.add(operationId);
      
      // Store shape for potential rollback
      const shapeToDelete = shapes.find(shape => shape.id === shapeId);
      
      // Optimistically remove shape locally
      setShapes(prevShapes => 
        prevShapes.filter(shape => shape.id !== shapeId)
      );
      
      // Sync to Firestore
      await deleteShapeInFirestore(projectId, shapeId);
      
      console.log('✅ Shape deleted and synced:', shapeId);
      
    } catch (error) {
      console.error('❌ Error deleting shape:', error);
      
      // Restore shape on error
      const shapeToRestore = shapes.find(shape => shape.id === shapeId);
      if (shapeToRestore) {
        setShapes(prevShapes => [...prevShapes, shapeToRestore]);
      }
      
      throw error;
    } finally {
      pendingOperations.current.delete(operationId);
    }
  }, [projectId, shapes]);

  // Lock shape for collaborative editing
  const lockShapeForEditing = useCallback(async (shapeId) => {
    try {
      await lockShape(projectId, shapeId);
      console.log('🔒 Shape locked for editing:', shapeId);
    } catch (error) {
      console.error('❌ Error locking shape:', error);
      throw error;
    }
  }, [projectId]);

  // Unlock shape after editing
  const unlockShapeAfterEditing = useCallback(async (shapeId) => {
    try {
      await unlockShape(projectId, shapeId);
      console.log('🔓 Shape unlocked after editing:', shapeId);
    } catch (error) {
      console.error('❌ Error unlocking shape:', error);
      throw error;
    }
  }, [projectId]);

  // Check if shape is locked by current user
  const isShapeLockedByCurrentUser = useCallback((shape) => {
    const currentUser = getCurrentUser();
    return shape.isLocked && shape.lockedBy === currentUser?.uid;
  }, []);

  // Check if shape is locked by another user
  const isShapeLockedByOther = useCallback((shape) => {
    const currentUser = getCurrentUser();
    return shape.isLocked && shape.lockedBy && shape.lockedBy !== currentUser?.uid;
  }, []);

  // Get sync statistics
  const getSyncStats = useCallback(() => {
    return {
      totalShapes: shapes.length,
      pendingOperations: pendingOperations.current.size,
      syncStatus,
      lastSync: new Date().toISOString()
    };
  }, [shapes.length, syncStatus]);

  // Batch create multiple shapes atomically
  const createShapesBatch = useCallback(async (shapesData) => {
    const operationId = `batch-create-${Date.now()}`;
    
    try {
      pendingOperations.current.add(operationId);
      
      // Optimistically add shapes locally
      const tempShapes = shapesData.map(shapeData => ({
        ...shapeData,
        id: shapeData.id || `shape-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        createdBy: getCurrentUser()?.uid || 'anonymous',
        createdAt: new Date(),
        lastModifiedBy: getCurrentUser()?.uid || 'anonymous',
        lastModifiedAt: new Date(),
        isLocked: false,
        lockedBy: null
      }));
      
      setShapes(prevShapes => [...prevShapes, ...tempShapes]);
      
      // Sync to Firestore using batch creation
      await batchCreateShapes(projectId, tempShapes);
      
      console.log('✅ Batch shapes created and synced:', tempShapes.length, 'shapes');
      return tempShapes;
      
    } catch (error) {
      console.error('❌ Error batch creating shapes:', error);
      
      // Remove optimistically added shapes on error
      setShapes(prevShapes => 
        prevShapes.filter(shape => !shapesData.some(data => data.id === shape.id))
      );
      
      throw error;
    } finally {
      pendingOperations.current.delete(operationId);
    }
  }, [projectId]);

  // Batch delete multiple shapes atomically
  const deleteShapesBatch = useCallback(async (shapeIds) => {
    const operationId = `batch-delete-${Date.now()}`;
    
    try {
      pendingOperations.current.add(operationId);
      
      // Optimistically remove shapes locally
      setShapes(prevShapes => 
        prevShapes.filter(shape => !shapeIds.includes(shape.id))
      );
      
      // Sync to Firestore using batch deletion
      await batchDeleteShapes(projectId, shapeIds);
      
      console.log('✅ Batch shapes deleted and synced:', shapeIds.length, 'shapes');
      
    } catch (error) {
      console.error('❌ Error batch deleting shapes:', error);
      
      // Revert optimistic deletion on error
      // In a production app, you might want to reload from Firestore
      throw error;
    } finally {
      pendingOperations.current.delete(operationId);
    }
  }, [projectId]);

  // Batch update multiple shapes atomically
  const updateShapesBatch = useCallback(async (updates) => {
    const operationId = `batch-update-${Date.now()}`;
    
    try {
      pendingOperations.current.add(operationId);
      
      // Optimistically update shapes locally
      setShapes(prevShapes => 
        prevShapes.map(shape => {
          const update = updates.find(u => u.id === shape.id);
          if (update) {
            return { 
              ...shape, 
              x: update.x,
              y: update.y,
              lastModifiedBy: update.lastModifiedBy || getCurrentUser()?.uid || 'anonymous',
              lastModifiedAt: update.lastModified || new Date()
            };
          }
          return shape;
        })
      );
      
      // Sync to Firestore using batch update
      await batchUpdateShapes(projectId, updates);
      
      console.log('✅ Batch shape updates completed atomically:', updates.length, 'shapes');
      
    } catch (error) {
      console.error('❌ Error batch updating shapes:', error);
      
      // Revert optimistic updates on error
      // In a production app, you might want to reload from Firestore
      throw error;
    } finally {
      pendingOperations.current.delete(operationId);
    }
  }, [projectId]);

  // Force refresh from Firestore
  const refreshCanvas = useCallback(async () => {
    try {
      setLoading(true);
      const freshShapes = await getCanvasState(projectId);
      setShapes(freshShapes);
      console.log('🔄 Canvas refreshed from Firestore');
    } catch (error) {
      console.error('❌ Error refreshing canvas:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  return {
    // State
    shapes,
    syncStatus,
    loading,
    
    // Shape operations
    createShape,
    createShapesBatch,
    updateShape,
    deleteShape,
    deleteShapesBatch,
    updateShapesBatch,
    
    // Collaboration features
    lockShapeForEditing,
    unlockShapeAfterEditing,
    isShapeLockedByCurrentUser,
    isShapeLockedByOther,
    
    // Utilities
    getSyncStats,
    refreshCanvas
  };
}

export default useCanvasSync;
