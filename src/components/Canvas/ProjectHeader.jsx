import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePresence } from '../../hooks/usePresence';
import InviteCollaboratorsModal from '../Invitations/InviteCollaboratorsModal';

/**
 * Project Header - Header component for canvas view with project info and actions
 */
export default function ProjectHeader({ project, onBackToDashboard }) {
  const { currentUser } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const isOwner = project.ownerId === currentUser?.uid;
  
  // Get online users for this project
  const { onlineUsers } = usePresence(project?.id);

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Back button and project info */}
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Dashboard</span>
            </button>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {project.name}
              </h1>
              <p className="text-sm text-gray-500">
                Created {formatDate(project.createdAt)} • {project.memberIds?.length || 1} member{(project.memberIds?.length || 1) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Center - Online Users */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                {onlineUsers.slice(0, 4).map((user, index) => (
                  <div
                    key={user.uid}
                    className="relative"
                    title={`${user.displayName || user.email} (online)`}
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                ))}
                {onlineUsers.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                    +{onlineUsers.length - 4}
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-600">
                {onlineUsers.length} {onlineUsers.length === 1 ? 'person' : 'people'} online
              </span>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-3">
            {/* Invite Collaborators Button (Owner only) */}
            {isOwner && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Invite
              </button>
            )}

            {/* User Profile Menu */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-medium text-sm">
                    {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="font-medium">
                  {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                </span>
              </div>
              
              {isOwner && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Owner
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Invite Collaborators Modal */}
      {showInviteModal && (
        <InviteCollaboratorsModal
          project={project}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </>
  );
}
