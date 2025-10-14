import { useState, useEffect } from 'react';
import AuthProvider from './components/Auth/AuthProvider';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Navbar from './components/Layout/Navbar';
import Toolbar from './components/Toolbar';
import OnlineUsers from './components/OnlineUsers';
import Canvas from './components/Canvas/Canvas';
import CanvasControls from './components/Canvas/CanvasControls';
import { CanvasProvider, useCanvas } from './contexts/CanvasContext';
import { useAuth } from './hooks/useAuth';
import './index.css';

// Canvas App component with keyboard shortcuts
function CanvasApp() {
  const { deleteSelectedShape, selectedId } = useCanvas();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Delete selected shape with Delete or Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        deleteSelectedShape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelectedShape, selectedId]);

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <Toolbar />
        
        {/* Main Canvas Area */}
        <div className="flex-1 relative">
          <Canvas />
          <CanvasControls />
        </div>
        
        {/* Right Panel - Online Users */}
        <OnlineUsers />
      </main>
    </div>
  );
}

// Main App component with authentication logic
function AppContent() {
  const { currentUser, loading } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication forms if user is not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        {authMode === 'login' ? (
          <Login onSwitchToSignup={() => setAuthMode('signup')} />
        ) : (
          <Signup onSwitchToLogin={() => setAuthMode('login')} />
        )}
      </div>
    );
  }

  // Show main app if user is authenticated (or in demo mode)
  return (
    <CanvasProvider>
      <CanvasApp />
    </CanvasProvider>
  );
}

// Root App component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;