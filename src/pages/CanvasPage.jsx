import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getProject, userHasProjectAccess } from '../services/projects';
import { CanvasProvider } from '../contexts/ModernCanvasContext';
import ProjectHeader from '../components/Canvas/ProjectHeader';
import Toolbar from '../components/Toolbar';
import Inspector from '../components/Canvas/Inspector';
import Canvas from '../components/Canvas/Canvas';
import CanvasControls from '../components/Canvas/CanvasControls';
import AIChatButton from '../components/AI/AIChatButton';

/**
 * Canvas Page - Individual project canvas view
 */
export default function CanvasPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);

  // Grid and snapping state
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);

  // Check project access and load project data
  useEffect(() => {
    const checkAccess = async () => {
      if (!currentUser || !projectId) return;

      try {
        setLoading(true);
        setError(null);

        // Check if user has access to this project
        const access = await userHasProjectAccess(projectId, currentUser.uid);
        if (!access) {
          setError('You do not have access to this project');
          setLoading(false);
          return;
        }

        // Load project details
        const projectData = await getProject(projectId);
        if (!projectData) {
          setError('Project not found');
          setLoading(false);
          return;
        }

        setProject(projectData);
        setHasAccess(true);
      } catch (err) {
        console.error('Error checking project access:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [currentUser, projectId]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Keyboard shortcuts can be added here if needed
      // Note: Backspace/Delete key deletion has been removed
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccess || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">This project may have been deleted or you may not have access to it.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <CanvasProvider projectId={projectId}>
      <div className="h-screen bg-gray-50 flex flex-col">
        <ProjectHeader 
          project={project}
          onBackToDashboard={() => navigate('/dashboard')}
        />
        
        <main className="flex-1 flex overflow-hidden">
          {/* Left Toolbar */}
          <Toolbar 
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            snapToGrid={snapToGrid}
            setSnapToGrid={setSnapToGrid}
          />
          
          {/* Inspector Panel */}
          <Inspector />
          
          {/* Main Canvas Area */}
          <div className="flex-1 relative min-w-0">
            <Canvas 
              showGrid={showGrid}
              snapToGrid={snapToGrid}
            />
            <CanvasControls />
          </div>
        </main>
        
        {/* Floating AI Chat Button */}
        <AIChatButton />
      </div>
    </CanvasProvider>
  );
}
