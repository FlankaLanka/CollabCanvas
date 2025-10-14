import { AuthProvider as AuthContextProvider } from '../../contexts/AuthContext';

/**
 * Auth Provider Wrapper Component
 * Wraps the entire app with AuthContext to provide authentication state
 */
function AuthProvider({ children }) {
  return (
    <AuthContextProvider>
      {children}
    </AuthContextProvider>
  );
}

export default AuthProvider;