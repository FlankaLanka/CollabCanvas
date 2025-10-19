import { useState } from 'react';
import { acceptInvitation, declineInvitation } from '../../services/invitations';

/**
 * Invitation Card - Component for displaying and handling project invitations
 */
export default function InvitationCard({ invitation, onAction }) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState(null);

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString();
  };

  const handleAccept = async () => {
    try {
      setLoading(true);
      setAction('accepting');
      await acceptInvitation(invitation.id);
      onAction();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setAction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      setLoading(true);
      setAction('declining');
      await declineInvitation(invitation.id);
      onAction();
    } catch (error) {
      console.error('Error declining invitation:', error);
      setAction(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {invitation.projectName}
          </h3>
          <p className="text-sm text-gray-600">
            Invited by {invitation.invitedByName}
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          You've been invited to collaborate on this project. Accept to start working together.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Invited {formatDate(invitation.createdAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleAccept}
          disabled={loading}
          className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {action === 'accepting' && (
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {action === 'accepting' ? 'Accepting...' : 'Accept'}
        </button>
        <button
          onClick={handleDecline}
          disabled={loading}
          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {action === 'declining' && (
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {action === 'declining' ? 'Declining...' : 'Decline'}
        </button>
      </div>
    </div>
  );
}
