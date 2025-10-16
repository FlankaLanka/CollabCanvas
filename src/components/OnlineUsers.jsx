import React, { useEffect, useState } from 'react';
import { usePresence } from '../hooks/usePresence';
import { useAuth } from '../hooks/useAuth';
import AIChat from './AI/AIChat';

function OnlineUsers() {
  const { onlineUsers, loading, getTotalUserCount, isActive } = usePresence();
  const { currentUser } = useAuth();
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Update timestamp when users list changes
  useEffect(() => {
    setLastUpdate(Date.now());
  }, [onlineUsers]);

  // Get user color style
  const getUserColorStyle = (color) => ({
    backgroundColor: color || '#3B82F6'
  });

  // Format display name
  const getDisplayName = (user) => {
    if (user.isCurrentUser) {
      return `${user.displayName} (You)`;
    }
    return user.displayName;
  };

  // Format join time
  const getJoinTime = (joinedAt) => {
    if (!joinedAt) return '';
    const now = Date.now();
    const joined = typeof joinedAt === 'number' ? joinedAt : new Date(joinedAt).getTime();
    const diffMs = now - joined;
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'Just joined';
    if (diffMin === 1) return '1 min ago';
    if (diffMin < 60) return `${diffMin} min ago`;
    
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour === 1) return '1 hour ago';
    if (diffHour < 24) return `${diffHour} hours ago`;
    
    return new Date(joined).toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="w-56 sm:w-64 lg:w-72 bg-white border-l border-gray-300 flex flex-col">
        <div className="p-3 sm:p-4 border-b border-gray-300">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Online Users</h3>
        </div>
        <div className="flex items-center justify-center py-6 sm:py-8">
          <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const totalUsers = getTotalUserCount();

  return (
    <div className="w-56 sm:w-64 lg:w-72 bg-white border-l border-gray-300 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-300">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Online Users</h3>
        <p className="text-xs text-gray-500 mt-1">{totalUsers} users online</p>
        
        {/* Connection status */}
        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                currentUser && isActive ? 'bg-green-400' : 'bg-yellow-400'
              }`}></div>
              <span className={`text-xs ${
                currentUser && isActive ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {currentUser && isActive ? 'Real-time sync' : currentUser ? 'Connecting...' : 'Demo Mode'}
              </span>
            </div>
            {totalUsers > 0 && (
              <span className="text-xs text-gray-400">
                Live
              </span>
            )}
          </div>
          {currentUser && (
            <div className="text-xs text-gray-500 mt-1">
              {currentUser.displayName || currentUser.email?.split('@')[0]}
            </div>
          )}
        </div>
      </div>

      {/* Users list */}
      <div className="flex-1 p-3 sm:p-4">
        {totalUsers === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <div className="text-xs sm:text-sm">No users online</div>
            {!currentUser && (
              <div className="text-xs mt-2">
                Sign in to see other users
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {onlineUsers.map(user => (
              <div 
                key={user.uid} 
                className={`flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg transition-all duration-200 ${
                  user.isCurrentUser ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {/* User avatar with color */}
                <div 
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium flex-shrink-0"
                  style={getUserColorStyle(user.color)}
                >
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                
                {/* User info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                    {getDisplayName(user)}
                  </p>
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <p className="text-xs text-gray-500">Online</p>
                    </div>
                    <span className="text-xs text-gray-400 hidden sm:inline">
                      {getJoinTime(user.joinedAt)}
                    </span>
                  </div>
                </div>

                {/* Current user badge */}
                {user.isCurrentUser && (
                  <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex-shrink-0">
                    You
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      
      {/* AI Chat Assistant - Always at bottom */}
      <div className="mt-auto">
        <AIChat />
      </div>
    </div>
  );
}

export default OnlineUsers;