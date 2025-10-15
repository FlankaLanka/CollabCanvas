import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

function Navbar() {
  const { currentUser, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      // In a real app, show error message to user
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Get user initials for avatar
  const getUserInitials = (user) => {
    if (!user) return 'U';
    
    if (user.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    } else if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  };

  // Get display name
  const getDisplayName = (user) => {
    if (!user) return 'Anonymous User';
    
    return user.displayName || user.email?.split('@')[0] || 'Anonymous User';
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between h-12 sm:h-16">
          {/* Left side - App branding */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg 
                  className="h-3 w-3 sm:h-5 sm:w-5 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
                  />
                </svg>
              </div>
              <h1 className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold text-gray-900">
                <span className="hidden sm:inline">CollabCanvas</span>
                <span className="sm:hidden">Collab</span>
              </h1>
            </div>
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Connection status */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-600">
                {currentUser ? 'Connected' : 'Demo Mode'}
              </span>
            </div>

            {/* User info */}
            {currentUser && (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="hidden sm:inline text-sm text-gray-700">
                  Welcome, {getDisplayName(currentUser)}
                </span>
                
                {/* User avatar */}
                <div className="h-6 w-6 sm:h-8 sm:w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-xs sm:text-sm font-medium text-indigo-600">
                    {getUserInitials(currentUser)}
                  </span>
                </div>
                
                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? (
                    <>
                      <div className="animate-spin rounded-full h-2 w-2 sm:h-3 sm:w-3 border-b-2 border-gray-400 mr-1"></div>
                      <span className="hidden sm:inline">Signing out...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <svg 
                        className="h-3 w-3 sm:mr-1" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" 
                        />
                      </svg>
                      <span className="hidden sm:inline">Sign out</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Demo mode indicator */}
            {!currentUser && (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="hidden sm:inline text-sm text-gray-500">
                  Demo Mode (No Auth)
                </span>
                <span className="sm:hidden text-xs text-gray-500">Demo</span>
                <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-xs sm:text-sm font-medium text-gray-500">D</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;