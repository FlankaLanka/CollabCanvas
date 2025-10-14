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

// Realtime Database paths
export const SESSIONS_PATH = 'sessions';
export const GLOBAL_SESSION_ID = 'global-canvas-v1';

/**
 * Subscribe to all user cursors in the session
 * @param {string} sessionId - Session ID (defaults to global canvas)
 * @param {Function} callback - Callback function to receive cursor updates
 * @returns {Function} Unsubscribe function
 */
export function subscribeToUserCursors(sessionId = GLOBAL_SESSION_ID, callback) {
  if (!hasFirebaseConfig || !rtdb) {
    console.log('🎨 Development mode: Skipping cursor subscription');
    // Return empty unsubscribe function for development mode
    return () => {};
  }

  try {
    const sessionRef = ref(rtdb, `${SESSIONS_PATH}/${sessionId}`);
    
    console.log('👥 Subscribing to user cursors for session:', sessionId);
    
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const sessionData = snapshot.val();
      const cursors = [];
      
      if (sessionData) {
        Object.entries(sessionData).forEach(([userId, userData]) => {
          if (userData && userData.cursor) {
            cursors.push({
              userId,
              ...userData.cursor,
              displayName: userData.displayName || userData.user?.displayName || 'Anonymous',
              color: userData.color || '#3B82F6',
              lastSeen: userData.lastSeen
            });
          }
        });
      }
      
      console.log('👥 Received cursor updates:', cursors.length, 'users');
      callback(cursors);
    }, (error) => {
      console.error('❌ Error subscribing to cursors:', error);
      callback([]);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up cursor subscription:', error);
    return () => {};
  }
}

/**
 * Update current user's cursor position
 * @param {string} sessionId - Session ID
 * @param {Object} cursorData - Cursor position and metadata
 */
export async function updateUserCursor(sessionId = GLOBAL_SESSION_ID, cursorData) {
  if (!hasFirebaseConfig || !rtdb) {
    console.log('🎨 Development mode: Skipping cursor update');
    return;
  }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.log('⚠️ No user logged in, skipping cursor update');
    return;
  }

  try {
    const userRef = ref(rtdb, `${SESSIONS_PATH}/${sessionId}/${currentUser.uid}`);
    
    const updateData = {
      user: {
        uid: currentUser.uid,
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
        email: currentUser.email
      },
      displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
      color: getUserColor(currentUser.uid), // Consistent color for user
      cursor: {
        x: cursorData.x,
        y: cursorData.y,
        canvasX: cursorData.canvasX || cursorData.x,
        canvasY: cursorData.canvasY || cursorData.y,
        timestamp: Date.now()
      },
      lastSeen: serverTimestamp(),
      isActive: true
    };

    await set(userRef, updateData);
    
    // Set up disconnect cleanup
    onDisconnect(userRef).remove();
    
  } catch (error) {
    console.error('❌ Error updating cursor:', error);
  }
}

/**
 * Set user presence (active/inactive)
 * @param {string} sessionId - Session ID
 * @param {boolean} isActive - Whether user is currently active
 */
export async function setUserPresence(sessionId = GLOBAL_SESSION_ID, isActive = true) {
  if (!hasFirebaseConfig || !rtdb) {
    console.log('🎨 Development mode: Skipping presence update');
    return;
  }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.log('⚠️ No current user found for presence update');
    return;
  }
  
  console.log('👥 Setting user presence:', { 
    userId: currentUser.uid, 
    displayName: currentUser.displayName || currentUser.email,
    isActive 
  });

  try {
    const userRef = ref(rtdb, `${SESSIONS_PATH}/${sessionId}/${currentUser.uid}`);
    
    if (isActive) {
      // Join session
      const userData = {
        user: {
          uid: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
          email: currentUser.email
        },
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
        color: getUserColor(currentUser.uid),
        joinedAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        isActive: true,
        cursor: {
          x: 0,
          y: 0,
          canvasX: 0,
          canvasY: 0,
          timestamp: Date.now()
        }
      };
      
      await set(userRef, userData);
      
      // Remove user when they disconnect
      onDisconnect(userRef).remove();
      
      console.log('✅ User presence set to active:', userData.displayName);
    } else {
      // Leave session
      await remove(userRef);
      console.log('✅ User presence removed');
    }
  } catch (error) {
    console.error('❌ Error setting user presence:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error
    });
  }
}

/**
 * Remove user's cursor and presence
 * @param {string} sessionId - Session ID
 */
export async function removeUserPresence(sessionId = GLOBAL_SESSION_ID) {
  if (!hasFirebaseConfig || !rtdb) {
    console.log('🎨 Development mode: Skipping presence removal');
    return;
  }

  const currentUser = getCurrentUser();
  if (!currentUser) return;

  try {
    const userRef = ref(rtdb, `${SESSIONS_PATH}/${sessionId}/${currentUser.uid}`);
    await remove(userRef);
    console.log('✅ User presence removed from session');
  } catch (error) {
    console.error('❌ Error removing user presence:', error);
  }
}

/**
 * Get online users count
 * @param {string} sessionId - Session ID  
 * @param {Function} callback - Callback with user count
 * @returns {Function} Unsubscribe function
 */
export function subscribeToOnlineUsers(sessionId = GLOBAL_SESSION_ID, callback) {
  if (!hasFirebaseConfig || !rtdb) {
    console.log('🎨 Development mode: Skipping online users subscription');
    callback([]);
    return () => {};
  }

  try {
    const sessionRef = ref(rtdb, `${SESSIONS_PATH}/${sessionId}`);
    console.log('👥 Subscribing to online users at path:', `${SESSIONS_PATH}/${sessionId}`);
    
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const sessionData = snapshot.val();
      console.log('📡 Received session data:', sessionData);
      const users = [];
      
      if (sessionData) {
        Object.entries(sessionData).forEach(([userId, userData]) => {
          console.log(`  - Processing user ${userId}:`, userData);
          if (userData && userData.isActive) {
            const user = {
              userId,
              displayName: userData.displayName || 'Anonymous',
              color: userData.color || '#3B82F6',
              joinedAt: userData.joinedAt,
              lastSeen: userData.lastSeen,
              isCurrentUser: getCurrentUser()?.uid === userId
            };
            users.push(user);
            console.log(`    ✅ Added user:`, user);
          } else {
            console.log(`    ❌ Skipping inactive user:`, userId);
          }
        });
      } else {
        console.log('📡 No session data found');
      }
      
      console.log('👥 Final users array:', users);
      callback(users);
    }, (error) => {
      console.error('❌ Realtime Database subscription error:', error);
      callback([]);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error subscribing to online users:', error);
    callback([]);
    return () => {};
  }
}

/**
 * Generate consistent color for user based on their ID
 * @param {string} userId - User ID
 * @returns {string} Hex color code
 */
function getUserColor(userId) {
  const colors = [
    '#3B82F6', // Blue
    '#EF4444', // Red  
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6366F1'  // Indigo
  ];
  
  // Create a simple hash from userId to get consistent color
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Throttle cursor updates to avoid overwhelming the database
 */
let lastCursorUpdate = 0;
const CURSOR_UPDATE_THROTTLE = 50; // 20fps max

export function throttledUpdateUserCursor(sessionId, cursorData) {
  const now = Date.now();
  if (now - lastCursorUpdate >= CURSOR_UPDATE_THROTTLE) {
    lastCursorUpdate = now;
    updateUserCursor(sessionId, cursorData);
  }
}
