import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './components/Auth/AuthProvider';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import DashboardPage from './pages/DashboardPage';
import CanvasPage from './pages/CanvasPage';
import { useAuth } from './hooks/useAuth';
import './index.css';

// Protected Route component
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

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

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Main App component with routing
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

  // Show main app with routing if user is authenticated
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/project/:projectId" 
          element={
            <ProtectedRoute>
              <CanvasPage />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
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