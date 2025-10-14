import { useState, useEffect, useCallback, useRef } from 'react';
import {
  subscribeToUserCursors,
  updateUserCursor,
  setUserPresence,
  removeUserPresence,
  subscribeToOnlineUsers,
  throttledUpdateUserCursor,
  GLOBAL_SESSION_ID
} from '../services/cursors';
import { getCurrentUser } from '../services/auth';

/**
 * Custom hook for managing cursor presence and tracking
 * @param {string} sessionId - Session ID (defaults to global canvas)
 * @returns {Object} Cursor state and control functions
 */
export function useCursors(sessionId = GLOBAL_SESSION_ID) {
  const [cursors, setCursors] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isPresenceActive, setIsPresenceActive] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const cursorsUnsubscribeRef = useRef(null);
  const usersUnsubscribeRef = useRef(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const lastUpdateRef = useRef(0);

  // Initialize presence and subscriptions
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.log('👥 No user logged in, skipping cursor tracking');
      setLoading(false);
      return;
    }

    console.log('👥 Setting up cursor tracking for user:', currentUser.displayName || currentUser.email);

    // Set user presence as active immediately
    setUserPresence(sessionId, true)
      .then(() => {
        setIsPresenceActive(true);
        console.log('✅ User presence activated for:', currentUser.displayName || currentUser.email);
      })
      .catch((error) => {
        console.error('❌ Error activating presence:', error);
      })
      .finally(() => {
        setLoading(false);
      });

    // Subscribe to all user cursors
    const cursorsUnsubscribe = subscribeToUserCursors(sessionId, (cursorData) => {
      const currentUserId = getCurrentUser()?.uid;
      // Filter out current user's cursor
      const otherCursors = cursorData.filter(cursor => cursor.userId !== currentUserId);
      setCursors(otherCursors);
      console.log('👥 Updated cursors:', otherCursors.length, 'other users');
    });
    cursorsUnsubscribeRef.current = cursorsUnsubscribe;

    // Subscribe to online users
    const usersUnsubscribe = subscribeToOnlineUsers(sessionId, (users) => {
      setOnlineUsers(users);
      console.log('👥 Updated online users:', users.length, 'total users');
      users.forEach(user => {
        console.log(`  - ${user.displayName} (${user.isCurrentUser ? 'You' : 'Other'})`);
      });
    });
    usersUnsubscribeRef.current = usersUnsubscribe;

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up cursor tracking');
      
      if (cursorsUnsubscribeRef.current) {
        cursorsUnsubscribeRef.current();
      }
      if (usersUnsubscribeRef.current) {
        usersUnsubscribeRef.current();
      }
      
      // Remove presence when component unmounts
      removeUserPresence(sessionId).catch(console.error);
      setIsPresenceActive(false);
    };
  }, [sessionId]);

  // Update cursor position (throttled)
  const updateCursorPosition = useCallback((x, y, canvasX, canvasY) => {
    if (!isPresenceActive) return;

    mousePositionRef.current = { x, y };
    
    const cursorData = {
      x,
      y,
      canvasX: canvasX !== undefined ? canvasX : x,
      canvasY: canvasY !== undefined ? canvasY : y
    };

    // Use throttled update to avoid overwhelming the database
    throttledUpdateUserCursor(sessionId, cursorData);
  }, [sessionId, isPresenceActive]);

  // Update cursor position from mouse event
  const updateCursorFromEvent = useCallback((event, stage) => {
    if (!isPresenceActive) return;

    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    let canvasX = x;
    let canvasY = y;
    
    // If stage is provided, convert to canvas coordinates
    if (stage) {
      const stagePos = stage.position();
      const stageScale = stage.scaleX();
      canvasX = (x - stagePos.x) / stageScale;
      canvasY = (y - stagePos.y) / stageScale;
    }

    updateCursorPosition(x, y, canvasX, canvasY);
  }, [updateCursorPosition, isPresenceActive]);

  // Activate cursor tracking
  const activatePresence = useCallback(async () => {
    if (isPresenceActive) return;
    
    try {
      await setUserPresence(sessionId, true);
      setIsPresenceActive(true);
      console.log('✅ Cursor presence activated');
    } catch (error) {
      console.error('❌ Error activating cursor presence:', error);
    }
  }, [sessionId, isPresenceActive]);

  // Deactivate cursor tracking
  const deactivatePresence = useCallback(async () => {
    if (!isPresenceActive) return;
    
    try {
      await removeUserPresence(sessionId);
      setIsPresenceActive(false);
      console.log('✅ Cursor presence deactivated');
    } catch (error) {
      console.error('❌ Error deactivating cursor presence:', error);
    }
  }, [sessionId, isPresenceActive]);

  // Get current user info
  const getCurrentUserInfo = useCallback(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) return null;
    
    return {
      userId: currentUser.uid,
      displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
      email: currentUser.email,
      isActive: isPresenceActive
    };
  }, [isPresenceActive]);

  // Get other users (excluding current user)
  const getOtherUsers = useCallback(() => {
    const currentUserId = getCurrentUser()?.uid;
    return onlineUsers.filter(user => user.userId !== currentUserId);
  }, [onlineUsers]);

  // Get total user count
  const getTotalUserCount = useCallback(() => {
    return onlineUsers.length;
  }, [onlineUsers.length]);

  // Check if user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.some(user => user.userId === userId);
  }, [onlineUsers]);

  return {
    // State
    cursors,
    onlineUsers,
    isPresenceActive,
    loading,
    
    // Cursor control
    updateCursorPosition,
    updateCursorFromEvent,
    activatePresence,
    deactivatePresence,
    
    // User info
    getCurrentUserInfo,
    getOtherUsers,
    getTotalUserCount,
    isUserOnline
  };
}

export default useCursors;
