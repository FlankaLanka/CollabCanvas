import { 
  ref, 
  onValue, 
  set, 
  remove, 
  onDisconnect,
  serverTimestamp,
  push
} from 'firebase/database';
import { rtdb, hasFirebaseConfig } from './firebase';
import { getCurrentUser } from './auth';

// Simplified presence system
export const PRESENCE_PATH = 'presence';
export const SESSION_ID = 'main';

/**
 * Set user online status
 * @param {boolean} isOnline - Whether user is online
 */
export async function setUserOnline(isOnline = true) {
  if (!hasFirebaseConfig || !rtdb) {
    console.log('🎨 Development mode: Skipping presence update');
    return;
  }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.log('⚠️ No authenticated user for presence');
    return;
  }

  try {
    const userPresenceRef = ref(rtdb, `${PRESENCE_PATH}/${SESSION_ID}/${currentUser.uid}`);
    
    if (isOnline) {
      const userData = {
        uid: currentUser.uid,
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
        email: currentUser.email,
        color: getUserColor(currentUser.uid),
        lastSeen: serverTimestamp(),
        isOnline: true,
        joinedAt: serverTimestamp()
      };
      
      console.log('👥 Setting user online:', userData.displayName);
      await set(userPresenceRef, userData);
      
      // Remove presence when user disconnects
      onDisconnect(userPresenceRef).remove();
      
      console.log('✅ User set online successfully');
    } else {
      console.log('👥 Setting user offline');
      await remove(userPresenceRef);
    }
  } catch (error) {
    console.error('❌ Error updating presence:', error);
  }
}

/**
 * Subscribe to online users
 * @param {Function} callback - Callback with users array
 * @returns {Function} Unsubscribe function
 */
export function subscribeToOnlineUsers(callback) {
  if (!hasFirebaseConfig || !rtdb) {
    console.log('🎨 Development mode: No presence tracking');
    callback([]);
    return () => {};
  }

  const presenceRef = ref(rtdb, `${PRESENCE_PATH}/${SESSION_ID}`);
  console.log('👥 Starting presence subscription...');

  const unsubscribe = onValue(presenceRef, (snapshot) => {
    const presenceData = snapshot.val();
    console.log('📡 Raw presence data:', presenceData);
    
    const users = [];
    const currentUser = getCurrentUser();
    
    if (presenceData) {
      Object.entries(presenceData).forEach(([uid, userData]) => {
        if (userData && userData.isOnline) {
          users.push({
            uid,
            displayName: userData.displayName || 'Anonymous',
            email: userData.email,
            color: userData.color || '#3B82F6',
            lastSeen: userData.lastSeen,
            joinedAt: userData.joinedAt,
            isCurrentUser: currentUser?.uid === uid
          });
        }
      });
    }
    
    console.log('👥 Processed users:', users.map(u => `${u.displayName} (${u.isCurrentUser ? 'You' : 'Other'})`));
    callback(users);
  }, (error) => {
    console.error('❌ Presence subscription error:', error);
    callback([]);
  });

  return unsubscribe;
}

/**
 * Update user cursor position  
 * @param {number} x - Screen X position
 * @param {number} y - Screen Y position
 * @param {number} canvasX - Canvas X position
 * @param {number} canvasY - Canvas Y position
 */
export async function updateUserCursor(x, y, canvasX, canvasY) {
  if (!hasFirebaseConfig || !rtdb) return;

  const currentUser = getCurrentUser();
  if (!currentUser) return;

  try {
    const cursorRef = ref(rtdb, `cursors/${SESSION_ID}/${currentUser.uid}`);
    
    await set(cursorRef, {
      x,
      y,
      canvasX,
      canvasY,
      displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
      color: getUserColor(currentUser.uid),
      timestamp: Date.now(),
      uid: currentUser.uid
    });
    
    // Auto cleanup after 10 seconds of no updates
    onDisconnect(cursorRef).remove();
  } catch (error) {
    console.error('❌ Error updating cursor:', error);
  }
}

/**
 * Subscribe to user cursors
 * @param {Function} callback - Callback with cursors array
 * @returns {Function} Unsubscribe function
 */
export function subscribeToUserCursors(callback) {
  if (!hasFirebaseConfig || !rtdb) {
    callback([]);
    return () => {};
  }

  const cursorsRef = ref(rtdb, `cursors/${SESSION_ID}`);
  
  const unsubscribe = onValue(cursorsRef, (snapshot) => {
    const cursorsData = snapshot.val();
    const cursors = [];
    const currentUser = getCurrentUser();
    const now = Date.now();
    
    if (cursorsData) {
      Object.entries(cursorsData).forEach(([uid, cursorData]) => {
        // Only show cursors from other users and recent ones (< 3 seconds old for faster cleanup)
        if (uid !== currentUser?.uid && cursorData && (now - cursorData.timestamp) < 3000) {
          cursors.push({
            uid,
            x: Math.round(cursorData.x), // Round for pixel-perfect positioning
            y: Math.round(cursorData.y),
            canvasX: Math.round(cursorData.canvasX),
            canvasY: Math.round(cursorData.canvasY),
            displayName: cursorData.displayName,
            color: cursorData.color,
            timestamp: cursorData.timestamp
          });
        }
      });
    }
    
    callback(cursors);
  });

  return unsubscribe;
}

/**
 * Generate consistent color for user
 */
function getUserColor(uid) {
  const colors = [
    '#EF4444', // Red
    '#10B981', // Green  
    '#3B82F6', // Blue
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6366F1'  // Indigo
  ];
  
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// Throttle cursor updates for smooth 30fps
let lastCursorUpdate = 0;
const CURSOR_THROTTLE = 33; // 30fps for smooth movement

export function throttledUpdateUserCursor(x, y, canvasX, canvasY) {
  const now = Date.now();
  if (now - lastCursorUpdate >= CURSOR_THROTTLE) {
    lastCursorUpdate = now;
    updateUserCursor(x, y, canvasX, canvasY);
  }
}
