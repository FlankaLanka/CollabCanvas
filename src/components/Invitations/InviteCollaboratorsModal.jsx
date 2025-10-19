import { useState } from 'react';
import { createInvitation, getProjectInvitations, cancelInvitation } from '../../services/invitations';

/**
 * Invite Collaborators Modal - Modal for inviting users to a project
 */
export default function InviteCollaboratorsModal({ project, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);

  // Load pending invitations when modal opens
  useState(() => {
    const loadInvitations = async () => {
      try {
        setLoadingInvitations(true);
        const invitations = await getProjectInvitations(project.id);
        setPendingInvitations(invitations.filter(inv => inv.status === 'pending'));
      } catch (err) {
        console.error('Error loading invitations:', err);
      } finally {
        setLoadingInvitations(false);
      }
    };

    loadInvitations();
  }, [project.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await createInvitation(project.id, email.trim());
      setSuccess(`Invitation sent to ${email}`);
      setEmail('');
      
      // Refresh pending invitations
      const invitations = await getProjectInvitations(project.id);
      setPendingInvitations(invitations.filter(inv => inv.status === 'pending'));
    } catch (err) {
      console.error('Error creating invitation:', err);
      setError(err.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    try {
      await cancelInvitation(invitationId);
      
      // Refresh pending invitations
      const invitations = await getProjectInvitations(project.id);
      setPendingInvitations(invitations.filter(inv => inv.status === 'pending'));
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      setError('Failed to cancel invitation');
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Invite Collaborators</h3>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Invite others to collaborate on "{project.name}"
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {/* Invite Form */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-4">
              <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loading}
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
              {success && (
                <p className="mt-2 text-sm text-green-600">{success}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </form>

          {/* Pending Invitations */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Pending Invitations</h4>
            
            {loadingInvitations ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading...</p>
              </div>
            ) : pendingInvitations.length > 0 ? (
              <div className="space-y-2">
                {pendingInvitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{invitation.invitedUserEmail}</p>
                      <p className="text-xs text-gray-500">
                        Sent {new Date(invitation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No pending invitations</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={loading}
            className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
