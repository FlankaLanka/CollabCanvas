import { ref, set, onValue, serverTimestamp } from 'firebase/database';
import { rtdb } from './firebase';
import { getCurrentUser } from './auth';

const REALTIME_SHAPES_PATH = 'canvas/shapes';
const GLOBAL_CANVAS_ID = 'main';

// High-frequency position updates (60fps)
const POSITION_UPDATE_THROTTLE = 16; // 16ms = 60fps
let lastPositionUpdate = 0;

/**
 * Update shape position in Realtime Database for ultra-low latency
 * This is used for high-frequency updates during drag operations
 */
export async function updateShapePositionRealtime(shapeId, position) {
  if (!rtdb) {
    console.log('🎨 Development mode: Skipping realtime position update');
    return;
  }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.log('⚠️ No current user found for position update');
    return;
  }

  try {
    const positionRef = ref(rtdb, `${REALTIME_SHAPES_PATH}/${GLOBAL_CANVAS_ID}/${shapeId}/position`);
    
    // Fire-and-forget update for maximum performance
    set(positionRef, {
      x: position.x,
      y: position.y,
      updatedBy: currentUser.uid,
      timestamp: serverTimestamp()
    });
    
    console.log('⚡ Position updated (realtime):', shapeId, position);
  } catch (error) {
    console.error('❌ Error updating realtime position:', error);
  }
}

/**
 * Throttled position update for 60fps performance
 */
export function throttledUpdateShapePosition(shapeId, position) {
  const now = Date.now();
  if (now - lastPositionUpdate >= POSITION_UPDATE_THROTTLE) {
    lastPositionUpdate = now;
    updateShapePositionRealtime(shapeId, position);
  }
}

/**
 * Subscribe to real-time position updates for all shapes
 */
export function subscribeToRealtimePositions(callback) {
  if (!rtdb) {
    console.log('🎨 Development mode: Skipping realtime position subscription');
    return () => {};
  }

  const positionsRef = ref(rtdb, `${REALTIME_SHAPES_PATH}/${GLOBAL_CANVAS_ID}`);
  
  console.log('⚡ Subscribing to realtime positions');
  
  const unsubscribe = onValue(positionsRef, (snapshot) => {
    const positionsData = snapshot.val();
    const currentUser = getCurrentUser();
    
    if (positionsData) {
      const positionUpdates = {};
      
      Object.entries(positionsData).forEach(([shapeId, shapeData]) => {
        if (shapeData.position) {
          // Don't apply updates from current user (avoid feedback loop)
          if (shapeData.position.updatedBy !== currentUser?.uid) {
            positionUpdates[shapeId] = {
              x: shapeData.position.x,
              y: shapeData.position.y
            };
          }
        }
      });
      
      if (Object.keys(positionUpdates).length > 0) {
        console.log('⚡ Received realtime position updates:', Object.keys(positionUpdates));
        callback(positionUpdates);
      }
    }
  }, (error) => {
    console.error('❌ Realtime positions subscription error:', error);
  });

  return unsubscribe;
}

/**
 * Mark shape as being dragged (for cursor sync)
 */
export async function setShapeDragState(shapeId, isDragging, cursorPosition = null) {
  if (!rtdb) return;

  const currentUser = getCurrentUser();
  if (!currentUser) return;

  try {
    const dragRef = ref(rtdb, `${REALTIME_SHAPES_PATH}/${GLOBAL_CANVAS_ID}/${shapeId}/dragState`);
    
    if (isDragging && cursorPosition) {
      await set(dragRef, {
        isDragging: true,
        draggedBy: currentUser.uid,
        cursorX: cursorPosition.x,
        cursorY: cursorPosition.y,
        timestamp: serverTimestamp()
      });
    } else {
      await set(dragRef, null); // Remove drag state
    }
  } catch (error) {
    console.error('❌ Error updating drag state:', error);
  }
}

/**
 * Subscribe to drag states for cursor sync during drag
 */
export function subscribeToDragStates(callback) {
  if (!rtdb) {
    console.log('🎨 Development mode: Skipping drag state subscription');
    return () => {};
  }

  const dragStatesRef = ref(rtdb, `${REALTIME_SHAPES_PATH}/${GLOBAL_CANVAS_ID}`);
  
  const unsubscribe = onValue(dragStatesRef, (snapshot) => {
    const data = snapshot.val();
    const currentUser = getCurrentUser();
    const dragStates = [];
    
    if (data) {
      Object.entries(data).forEach(([shapeId, shapeData]) => {
        if (shapeData.dragState && shapeData.dragState.draggedBy !== currentUser?.uid) {
          dragStates.push({
            shapeId,
            ...shapeData.dragState
          });
        }
      });
    }
    
    callback(dragStates);
  }, (error) => {
    console.error('❌ Drag states subscription error:', error);
  });

  return unsubscribe;
}
