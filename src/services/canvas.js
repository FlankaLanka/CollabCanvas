import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db, hasFirebaseConfig } from './firebase';
import { getCurrentUser } from './auth';

// Canvas collection and document constants
export const CANVAS_COLLECTION = 'canvas';

/**
 * Subscribe to real-time shape changes
 * @param {string} projectId - Project ID (used as canvas document ID)
 * @param {Function} callback - Callback function to handle shape updates
 * @returns {Function} Unsubscribe function
 */
export function subscribeToShapes(projectId, callback) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping Firestore subscription');
    // Return empty unsubscribe function for development mode
    return () => {};
  }

  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, projectId);
    
    console.log('🔄 Subscribing to canvas changes:', projectId);
    
    const unsubscribe = onSnapshot(canvasRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        console.log('📥 Received shapes update:', data.shapes?.length || 0, 'shapes');
        callback(data.shapes || []);
      } else {
        console.log('📄 Canvas document does not exist, initializing...');
        // Initialize empty canvas if it doesn't exist
        initializeCanvas(projectId).then(() => {
          callback([]);
        });
      }
    }, (error) => {
      console.error('❌ Error subscribing to canvas changes:', error);
      // Call callback with empty array on error
      callback([]);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up canvas subscription:', error);
    return () => {};
  }
}

/**
 * Initialize an empty canvas document
 * @param {string} projectId - Project ID (used as canvas document ID)
 */
export async function initializeCanvas(projectId) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping canvas initialization');
    return;
  }

  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, projectId);
    const currentUser = getCurrentUser();
    
    await setDoc(canvasRef, {
      projectId,
      shapes: [],
      createdAt: serverTimestamp(),
      createdBy: currentUser?.uid || 'anonymous',
      lastUpdated: serverTimestamp(),
      version: 1
    });
    
    console.log('✅ Canvas initialized:', projectId);
  } catch (error) {
    console.error('❌ Error initializing canvas:', error);
    throw error;
  }
}

/**
 * Create a new shape on the canvas
 * @param {string} projectId - Project ID (used as canvas document ID)
 * @param {Object} shapeData - Shape properties
 */
export async function createShape(projectId, shapeData) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping shape creation in Firestore');
    return shapeData; // Return the shape data for local use
  }

  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, projectId);
    const currentUser = getCurrentUser();
    const now = new Date();
    
    const newShape = {
      id: shapeData.id,
      type: shapeData.type || 'rectangle',
      x: shapeData.x || 0,
      y: shapeData.y || 0,
      width: shapeData.width || 100,
      height: shapeData.height || 100,
      fill: shapeData.fill || '#3B82F6',
      stroke: shapeData.stroke || '#1E40AF',
      strokeWidth: shapeData.strokeWidth || 2,
      rotation: shapeData.rotation || 0,
      scaleX: shapeData.scaleX || 1,
      scaleY: shapeData.scaleY || 1,
      createdBy: currentUser?.uid || 'anonymous',
      createdAt: now,
      lastModifiedBy: currentUser?.uid || 'anonymous', 
      lastModifiedAt: now,
      isLocked: false,
      lockedBy: null,
      ...shapeData
    };

    // Add the shape to the shapes array
    await updateDoc(canvasRef, {
      shapes: arrayUnion(newShape),
      lastUpdated: serverTimestamp()
    });
    
    console.log('✅ Shape created in Firestore:', newShape.id);
    return newShape;
  } catch (error) {
    console.error('❌ Error creating shape:', error);
    throw error;
  }
}

/**
 * Update an existing shape on the canvas
 * @param {string} projectId - Project ID (used as canvas document ID)
 * @param {string} shapeId - Shape ID to update
 * @param {Object} updates - Properties to update
 */
export async function updateShape(projectId, shapeId, updates) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping shape update in Firestore');
    return;
  }

  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, projectId);
    const currentUser = getCurrentUser();
    
    // Get current document to find and update the specific shape
    const docSnap = await getDoc(canvasRef);
    if (!docSnap.exists()) {
      throw new Error(`Canvas ${projectId} does not exist`);
    }
    
    const data = docSnap.data();
    const shapes = data.shapes || [];
    
    // Find and update the specific shape
    const updatedShapes = shapes.map(shape => {
      if (shape.id === shapeId) {
        return {
          ...shape,
          ...updates,
          lastModifiedBy: currentUser?.uid || 'anonymous',
          lastModifiedAt: new Date()
        };
      }
      return shape;
    });
    
    // Update the document with the new shapes array
    await updateDoc(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp()
    });
    
    console.log('✅ Shape updated in Firestore:', shapeId);
  } catch (error) {
    console.error('❌ Error updating shape:', error);
    throw error;
  }
}

/**
 * Delete a shape from the canvas
 * @param {string} projectId - Project ID (used as canvas document ID)
 * @param {string} shapeId - Shape ID to delete
 */
export async function deleteShape(projectId, shapeId) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping shape deletion in Firestore');
    return;
  }

  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, projectId);
    
    // Get current document to find the shape to remove
    const docSnap = await getDoc(canvasRef);
    if (!docSnap.exists()) {
      throw new Error(`Canvas ${projectId} does not exist`);
    }
    
    const data = docSnap.data();
    const shapes = data.shapes || [];
    const shapeToDelete = shapes.find(shape => shape.id === shapeId);
    
    if (!shapeToDelete) {
      console.warn('⚠️ Shape not found for deletion:', shapeId);
      return;
    }
    
    // Remove the shape from the array
    await updateDoc(canvasRef, {
      shapes: arrayRemove(shapeToDelete),
      lastUpdated: serverTimestamp()
    });
    
    console.log('✅ Shape deleted from Firestore:', shapeId);
  } catch (error) {
    console.error('❌ Error deleting shape:', error);
    throw error;
  }
}

/**
 * Lock a shape for editing (prevents others from editing)
 * @param {string} projectId - Project ID (used as canvas document ID)
 * @param {string} shapeId - Shape ID to lock  
 */
export async function lockShape(projectId, shapeId) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping shape locking');
    return;
  }

  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to lock shapes');
    }

    await updateShape(projectId, shapeId, {
      isLocked: true,
      lockedBy: currentUser.uid,
      lockedAt: new Date()
    });
    
    console.log('🔒 Shape locked:', shapeId);
  } catch (error) {
    console.error('❌ Error locking shape:', error);
    throw error;
  }
}

/**
 * Unlock a shape (allows others to edit)
 * @param {string} projectId - Project ID (used as canvas document ID)
 * @param {string} shapeId - Shape ID to unlock
 */
export async function unlockShape(projectId, shapeId) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping shape unlocking');
    return;
  }

  try {
    await updateShape(projectId, shapeId, {
      isLocked: false,
      lockedBy: null,
      lockedAt: null
    });
    
    console.log('🔓 Shape unlocked:', shapeId);
  } catch (error) {
    console.error('❌ Error unlocking shape:', error);
    throw error;
  }
}

/**
 * Batch update multiple shapes atomically
 * @param {string} projectId - Project ID (used as canvas document ID)
 * @param {Array} updates - Array of shape updates [{id, x, y, lastModified, lastModifiedBy}, ...]
 */
export async function batchUpdateShapes(projectId, updates) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping batch shape updates in Firestore');
    return;
  }

  if (!updates || updates.length === 0) {
    console.warn('⚠️ No updates provided for batch update');
    return;
  }

  try {
    const currentUser = getCurrentUser();
    const canvasRef = doc(db, CANVAS_COLLECTION, projectId);
    
    // Get current document to find and update the specific shapes
    const docSnap = await getDoc(canvasRef);
    if (!docSnap.exists()) {
      throw new Error(`Canvas ${projectId} does not exist`);
    }
    
    const data = docSnap.data();
    const shapes = data.shapes || [];
    
    // Create a map of updates for quick lookup
    const updatesMap = new Map();
    updates.forEach(update => {
      updatesMap.set(update.id, update);
    });
    
    // Find and update the specific shapes
    const updatedShapes = shapes.map(shape => {
      const update = updatesMap.get(shape.id);
      if (update) {
        return {
          ...shape,
          x: update.x,
          y: update.y,
          lastModifiedBy: update.lastModifiedBy || currentUser?.uid || 'anonymous',
          lastModifiedAt: update.lastModified || new Date()
        };
      }
      return shape;
    });
    
    // Use batch write for atomic update
    const batch = writeBatch(db);
    batch.update(canvasRef, {
      shapes: updatedShapes,
      lastUpdated: serverTimestamp()
    });
    
    await batch.commit();
    
    console.log('✅ Batch shape updates completed atomically:', updates.length, 'shapes');
  } catch (error) {
    console.error('❌ Error batch updating shapes:', error);
    throw error;
  }
}

/**
 * Delete all canvas data for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<void>}
 */
export async function deleteProjectCanvas(projectId) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping canvas deletion');
    return;
  }

  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, projectId);
    await deleteDoc(canvasRef);
    
    console.log('✅ Project canvas deleted:', projectId);
  } catch (error) {
    console.error('❌ Error deleting project canvas:', error);
    throw error;
  }
}

/**
 * Get current canvas state
 * @param {string} projectId - Project ID (used as canvas document ID)
 * @returns {Promise<Array>} Array of shapes
 */
export async function getCanvasState(projectId) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Returning empty canvas state');
    return [];
  }

  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, projectId);
    const docSnap = await getDoc(canvasRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.shapes || [];
    } else {
      console.log('📄 Canvas does not exist, initializing...');
      await initializeCanvas(projectId);
      return [];
    }
  } catch (error) {
    console.error('❌ Error getting canvas state:', error);
    return [];
  }
}
