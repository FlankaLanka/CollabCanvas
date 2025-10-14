import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  subscribeToShapes, 
  createShape as createShapeInFirestore,
  updateShape as updateShapeInFirestore,
  deleteShape as deleteShapeInFirestore,
  lockShape,
  unlockShape,
  getCanvasState,
  GLOBAL_CANVAS_ID
} from '../services/canvas';
import { getCurrentUser } from '../services/auth';

/**
 * Custom hook for real-time canvas synchronization
 * Manages local state and sync with Firestore
 */
export function useCanvasSync(canvasId = GLOBAL_CANVAS_ID) {
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
    console.log('🚀 Setting up canvas sync for:', canvasId);
    
    try {
      // Subscribe to real-time updates
      const unsubscribe = subscribeToShapes(canvasId, handleShapesUpdate);
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
  }, [canvasId, handleShapesUpdate]);

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
      await createShapeInFirestore(canvasId, tempShape);
      
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
  }, [canvasId]);

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
      await updateShapeInFirestore(canvasId, shapeId, updates);
      
      console.log('✅ Shape updated and synced:', shapeId);
      
    } catch (error) {
      console.error('❌ Error updating shape:', error);
      
      // Revert optimistic update on error
      // In a production app, you might want to reload from Firestore
      throw error;
    } finally {
      pendingOperations.current.delete(operationId);
    }
  }, [canvasId]);

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
      await deleteShapeInFirestore(canvasId, shapeId);
      
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
  }, [canvasId, shapes]);

  // Lock shape for collaborative editing
  const lockShapeForEditing = useCallback(async (shapeId) => {
    try {
      await lockShape(canvasId, shapeId);
      console.log('🔒 Shape locked for editing:', shapeId);
    } catch (error) {
      console.error('❌ Error locking shape:', error);
      throw error;
    }
  }, [canvasId]);

  // Unlock shape after editing
  const unlockShapeAfterEditing = useCallback(async (shapeId) => {
    try {
      await unlockShape(canvasId, shapeId);
      console.log('🔓 Shape unlocked after editing:', shapeId);
    } catch (error) {
      console.error('❌ Error unlocking shape:', error);
      throw error;
    }
  }, [canvasId]);

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

  // Force refresh from Firestore
  const refreshCanvas = useCallback(async () => {
    try {
      setLoading(true);
      const freshShapes = await getCanvasState(canvasId);
      setShapes(freshShapes);
      console.log('🔄 Canvas refreshed from Firestore');
    } catch (error) {
      console.error('❌ Error refreshing canvas:', error);
    } finally {
      setLoading(false);
    }
  }, [canvasId]);

  return {
    // State
    shapes,
    syncStatus,
    loading,
    
    // Shape operations
    createShape,
    updateShape,
    deleteShape,
    
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
