import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserProjects } from '../services/projects';
import { getUserInvitations } from '../services/invitations';
import ProjectsDashboard from '../components/Dashboard/ProjectsDashboard';

/**
 * Dashboard Page - Main projects dashboard
 */
export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user projects and invitations
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch projects and invitations in parallel
        const [userProjects, userInvitations] = await Promise.all([
          getUserProjects(currentUser.uid),
          getUserInvitations(currentUser.email)
        ]);

        setProjects(userProjects);
        setInvitations(userInvitations);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Refresh data when projects or invitations change
  const refreshData = async () => {
    if (!currentUser) return;

    try {
      const [userProjects, userInvitations] = await Promise.all([
        getUserProjects(currentUser.uid),
        getUserInvitations(currentUser.email)
      ]);

      setProjects(userProjects);
      setInvitations(userInvitations);
    } catch (err) {
      console.error('Error refreshing dashboard data:', err);
      setError('Failed to refresh data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProjectsDashboard
      projects={projects}
      invitations={invitations}
      onRefresh={refreshData}
    />
  );
}
