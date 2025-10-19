import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  setUserOnline, 
  subscribeToOnlineUsers,
  updateUserCursor,
  subscribeToUserCursors,
  throttledUpdateUserCursor
} from '../services/presence';
import { getCurrentUser } from '../services/auth';

/**
 * Simplified presence hook for real-time collaboration
 * @param {string} projectId - Project ID to track presence for
 */
export function usePresence(projectId) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userCursors, setUserCursors] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const presenceUnsubscribe = useRef(null);
  const cursorsUnsubscribe = useRef(null);

  // Initialize presence when component mounts
  useEffect(() => {
    const currentUser = getCurrentUser();
    
    if (!currentUser || !projectId) {
      console.log('👥 No user logged in or no projectId, skipping presence setup');
      setLoading(false);
      return;
    }

    console.log('👥 Initializing presence for project:', projectId, 'user:', currentUser.displayName || currentUser.email);
    
    // Set user online for this specific project
    setUserOnline(true, projectId)
      .then(() => {
        setIsActive(true);
        console.log('✅ User presence activated for project:', projectId);
      })
      .catch(error => {
        console.error('❌ Error activating presence:', error);
      })
      .finally(() => {
        setLoading(false);
      });

    // Subscribe to online users for this project
    const unsubscribeUsers = subscribeToOnlineUsers(projectId, (users) => {
      console.log('👥 Project users update:', users);
      setOnlineUsers(users);
    });
    presenceUnsubscribe.current = unsubscribeUsers;

    // Subscribe to user cursors for this project
    const unsubscribeCursors = subscribeToUserCursors(projectId, (cursors) => {
      console.log('👆 Project cursors update:', cursors.length, 'cursors');
      setUserCursors(cursors);
    });
    cursorsUnsubscribe.current = unsubscribeCursors;

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up presence');
      
      if (presenceUnsubscribe.current) {
        presenceUnsubscribe.current();
      }
      if (cursorsUnsubscribe.current) {
        cursorsUnsubscribe.current();
      }
      
      // Set user offline for this project
      setUserOnline(false, projectId).catch(console.error);
      setIsActive(false);
    };
  }, [projectId]);

  // Update cursor position (throttled)
  const updateCursor = useCallback((x, y, canvasX, canvasY) => {
    if (isActive) {
      throttledUpdateUserCursor(projectId, x, y, canvasX, canvasY);
    }
  }, [isActive, projectId]);

  // Update cursor from mouse event with optimized coordinate handling
  const updateCursorFromEvent = useCallback((event, stage = null) => {
    if (!isActive) return;

    const rect = event.target.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left); // Pixel-perfect screen coordinates
    const y = Math.round(event.clientY - rect.top);
    
    let canvasX = x;
    let canvasY = y;
    
    // Convert to canvas coordinates if stage is provided
    if (stage) {
      const stagePos = stage.position();
      const stageScale = stage.scaleX();
      canvasX = Math.round((x - stagePos.x) / stageScale);
      canvasY = Math.round((y - stagePos.y) / stageScale);
    }

    updateCursor(x, y, canvasX, canvasY);
  }, [updateCursor, isActive]);

  // Get current user info
  const getCurrentUserInfo = useCallback(() => {
    const currentUser = getCurrentUser();
    return currentUser ? {
      uid: currentUser.uid,
      displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
      email: currentUser.email,
      isActive
    } : null;
  }, [isActive]);

  // Get other users (excluding current user)
  const getOtherUsers = useCallback(() => {
    const currentUser = getCurrentUser();
    return onlineUsers.filter(user => user.uid !== currentUser?.uid);
  }, [onlineUsers]);

  // Get total user count
  const getTotalUserCount = useCallback(() => {
    return onlineUsers.length;
  }, [onlineUsers.length]);

  return {
    // State
    onlineUsers,
    userCursors,
    isActive,
    loading,
    
    // Methods
    updateCursor,
    updateCursorFromEvent,
    getCurrentUserInfo,
    getOtherUsers,
    getTotalUserCount
  };
}

export default usePresence;
