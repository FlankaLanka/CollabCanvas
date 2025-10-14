import React from 'react';
import { usePresence } from '../../hooks/usePresence';
import { useAuth } from '../../hooks/useAuth';

function UserNamesList() {
  const { onlineUsers, loading, isActive } = usePresence();
  const { currentUser } = useAuth();

  // Don't show if no users or loading
  if (loading || onlineUsers.length === 0) {
    return null;
  }

  // Filter and format user names
  const userNames = onlineUsers.map(user => {
    if (user.isCurrentUser) {
      return `${user.displayName} (You)`;
    }
    return user.displayName;
  });

  return (
    <div className="absolute bottom-4 left-48 bg-white bg-opacity-90 rounded-lg px-3 py-2 border border-gray-300 shadow-sm">
      <div className="text-xs font-medium text-gray-700 mb-1">
        Online Users ({onlineUsers.length})
      </div>
      <div className="flex flex-wrap gap-2">
        {userNames.map((name, index) => (
          <div 
            key={index}
            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
          >
            {name}
          </div>
        ))}
      </div>
      {!currentUser && (
        <div className="text-xs text-gray-500 mt-1">
          Sign in to see other users
        </div>
      )}
    </div>
  );
}

export default UserNamesList;
