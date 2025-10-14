import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { auth, hasFirebaseConfig } from '../services/firebase';

// Create the context
const AuthContext = createContext({
  currentUser: null,
  loading: true,
  login: () => {},
  signup: () => {},
  logout: () => {},
  updateUserProfile: () => {}
});

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth Provider Component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to extract display name from user
  const getDisplayName = (user) => {
    if (user.displayName) {
      // Use Firebase display name (from Google auth)
      return user.displayName.length > 20 
        ? user.displayName.substring(0, 20) + '...' 
        : user.displayName;
    } else if (user.email) {
      // Extract name from email prefix
      const emailPrefix = user.email.split('@')[0];
      return emailPrefix.length > 20 
        ? emailPrefix.substring(0, 20) + '...' 
        : emailPrefix;
    }
    return 'Anonymous User';
  };

  // Update user profile (display name)
  async function updateUserProfile(displayName) {
    if (!currentUser) throw new Error('No user logged in');
    
    try {
      await updateProfile(currentUser, { displayName });
      // Trigger a re-render by updating state
      setCurrentUser({ ...currentUser, displayName });
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Logout function
  async function logout() {
    if (!hasFirebaseConfig || !auth) {
      // In demo mode, just clear the user
      setCurrentUser(null);
      return true;
    }

    try {
      setLoading(true);
      await firebaseSignOut(auth);
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Listen to auth state changes
  useEffect(() => {
    // If Firebase auth is not available (development mode), skip authentication
    if (!hasFirebaseConfig || !auth) {
      console.log('🎨 Development mode: Skipping Firebase authentication');
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        setCurrentUser({
          ...user,
          displayName: getDisplayName(user)
        });
      } else {
        // User is signed out
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe; // Cleanup subscription
  }, []);

  // Context value
  const value = {
    currentUser,
    loading,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;