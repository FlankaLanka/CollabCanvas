import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db, hasFirebaseConfig } from './firebase';
import { getCurrentUser } from './auth';

// Canvas collection and document constants
export const CANVAS_COLLECTION = 'canvas';
export const GLOBAL_CANVAS_ID = 'global-canvas-v1';

/**
 * Subscribe to real-time shape changes
 * @param {string} canvasId - Canvas document ID
 * @param {Function} callback - Callback function to handle shape updates
 * @returns {Function} Unsubscribe function
 */
export function subscribeToShapes(canvasId = GLOBAL_CANVAS_ID, callback) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping Firestore subscription');
    // Return empty unsubscribe function for development mode
    return () => {};
  }

  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
    
    console.log('🔄 Subscribing to canvas changes:', canvasId);
    
    const unsubscribe = onSnapshot(canvasRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        console.log('📥 Received shapes update:', data.shapes?.length || 0, 'shapes');
        callback(data.shapes || []);
      } else {
        console.log('📄 Canvas document does not exist, initializing...');
        // Initialize empty canvas if it doesn't exist
        initializeCanvas(canvasId).then(() => {
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
 * @param {string} canvasId - Canvas document ID
 */
export async function initializeCanvas(canvasId = GLOBAL_CANVAS_ID) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping canvas initialization');
    return;
  }

  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
    const currentUser = getCurrentUser();
    
    await setDoc(canvasRef, {
      canvasId,
      shapes: [],
      createdAt: serverTimestamp(),
      createdBy: currentUser?.uid || 'anonymous',
      lastUpdated: serverTimestamp(),
      version: 1
    });
    
    console.log('✅ Canvas initialized:', canvasId);
  } catch (error) {
    console.error('❌ Error initializing canvas:', error);
    throw error;
  }
}

/**
 * Create a new shape on the canvas
 * @param {string} canvasId - Canvas document ID
 * @param {Object} shapeData - Shape properties
 */
export async function createShape(canvasId = GLOBAL_CANVAS_ID, shapeData) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping shape creation in Firestore');
    return shapeData; // Return the shape data for local use
  }

  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
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
 * @param {string} canvasId - Canvas document ID
 * @param {string} shapeId - Shape ID to update
 * @param {Object} updates - Properties to update
 */
export async function updateShape(canvasId = GLOBAL_CANVAS_ID, shapeId, updates) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping shape update in Firestore');
    return;
  }

  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
    const currentUser = getCurrentUser();
    
    // Get current document to find and update the specific shape
    const docSnap = await getDoc(canvasRef);
    if (!docSnap.exists()) {
      throw new Error(`Canvas ${canvasId} does not exist`);
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
 * @param {string} canvasId - Canvas document ID 
 * @param {string} shapeId - Shape ID to delete
 */
export async function deleteShape(canvasId = GLOBAL_CANVAS_ID, shapeId) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping shape deletion in Firestore');
    return;
  }

  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
    
    // Get current document to find the shape to remove
    const docSnap = await getDoc(canvasRef);
    if (!docSnap.exists()) {
      throw new Error(`Canvas ${canvasId} does not exist`);
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
 * @param {string} canvasId - Canvas document ID
 * @param {string} shapeId - Shape ID to lock  
 */
export async function lockShape(canvasId = GLOBAL_CANVAS_ID, shapeId) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping shape locking');
    return;
  }

  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be authenticated to lock shapes');
    }

    await updateShape(canvasId, shapeId, {
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
 * @param {string} canvasId - Canvas document ID
 * @param {string} shapeId - Shape ID to unlock
 */
export async function unlockShape(canvasId = GLOBAL_CANVAS_ID, shapeId) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Skipping shape unlocking');
    return;
  }

  try {
    await updateShape(canvasId, shapeId, {
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
 * Get current canvas state
 * @param {string} canvasId - Canvas document ID
 * @returns {Promise<Array>} Array of shapes
 */
export async function getCanvasState(canvasId = GLOBAL_CANVAS_ID) {
  if (!hasFirebaseConfig || !db) {
    console.log('🎨 Development mode: Returning empty canvas state');
    return [];
  }

  try {
    const canvasRef = doc(db, CANVAS_COLLECTION, canvasId);
    const docSnap = await getDoc(canvasRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.shapes || [];
    } else {
      console.log('📄 Canvas does not exist, initializing...');
      await initializeCanvas(canvasId);
      return [];
    }
  } catch (error) {
    console.error('❌ Error getting canvas state:', error);
    return [];
  }
}
