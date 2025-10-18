import { ref, set, onValue, serverTimestamp } from 'firebase/database';
import { rtdb } from './firebase';
import { getCurrentUser } from './auth';

const REALTIME_SHAPES_PATH = 'canvas/shapes';
const GLOBAL_CANVAS_ID = 'main';

// High-frequency position updates (60fps)
const POSITION_UPDATE_THROTTLE = 16; // 16ms = 60fps
let lastPositionUpdate = 0;
const shapeThrottleMap = new Map(); // Per-shape throttling

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
    
    // Enhanced data structure with timestamp for page refresh recovery
    const positionData = {
      x: Math.round(position.x * 100) / 100, // Round to 2 decimal places
      y: Math.round(position.y * 100) / 100,
      updatedBy: currentUser.uid,
      timestamp: Date.now() // Use local timestamp for speed
    };
    
    // Fire-and-forget update for maximum performance
    set(positionRef, positionData);
    
    // Only log in development for performance
    if (process.env.NODE_ENV === 'development') {
      console.log('⚡ Position updated (realtime):', shapeId, positionData);
    }
  } catch (error) {
    console.error('❌ Error updating realtime position:', error);
  }
}

/**
 * Throttled position update for 60fps performance (per-shape throttling)
 */
export function throttledUpdateShapePosition(shapeId, position) {
  const now = Date.now();
  const lastUpdate = shapeThrottleMap.get(shapeId) || 0;
  
  if (now - lastUpdate >= POSITION_UPDATE_THROTTLE) {
    shapeThrottleMap.set(shapeId, now);
    updateShapePositionRealtime(shapeId, position);
  }
}

/**
 * Force immediate position update (used for drag end)
 */
export function forceUpdateShapePosition(shapeId, position) {
  updateShapePositionRealtime(shapeId, position);
  shapeThrottleMap.set(shapeId, Date.now());
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
  
  // Debounce rapid updates to prevent excessive re-renders
  let updateTimeout = null;
  const debouncedCallback = (updates) => {
    if (updateTimeout) clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      callback(updates);
    }, 5); // 5ms debounce for smoother updates
  };
  
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
               y: shapeData.position.y,
               updatedBy: shapeData.position.updatedBy,
               timestamp: shapeData.position.timestamp
             };
           }
         }
       });
      
      if (Object.keys(positionUpdates).length > 0) {
        // Only log in development for performance
        if (process.env.NODE_ENV === 'development') {
          console.log('⚡ Received realtime position updates:', Object.keys(positionUpdates));
        }
        debouncedCallback(positionUpdates);
      }
    }
  }, (error) => {
    console.error('❌ Realtime positions subscription error:', error);
  });

  return () => {
    if (updateTimeout) clearTimeout(updateTimeout);
    unsubscribe();
  };
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
