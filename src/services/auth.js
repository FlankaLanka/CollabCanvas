import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut
} from 'firebase/auth';
import { auth, hasFirebaseConfig } from './firebase';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account' // Force account selection
});

/**
 * Sign up with email and password
 * @param {string} email - User email
 * @param {string} password - User password  
 * @param {string} displayName - Optional display name
 * @returns {Promise<User>} Firebase user object
 */
export async function signUp(email, password, displayName = null) {
  if (!hasFirebaseConfig || !auth) {
    throw new Error('Firebase authentication is not configured. Running in demo mode.');
  }

  try {
    // Create the user account
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Set display name if provided, otherwise use email prefix
    const nameToSet = displayName || email.split('@')[0];
    
    if (nameToSet) {
      await updateProfile(user, {
        displayName: nameToSet.length > 20 
          ? nameToSet.substring(0, 20) + '...' 
          : nameToSet
      });
    }
    
    console.log('✅ User signed up successfully:', user.email);
    return user;
  } catch (error) {
    console.error('❌ Sign up error:', error);
    
    // Provide user-friendly error messages
    switch (error.code) {
      case 'auth/email-already-in-use':
        throw new Error('An account with this email already exists.');
      case 'auth/invalid-email':
        throw new Error('Please enter a valid email address.');
      case 'auth/operation-not-allowed':
        throw new Error('Email/password accounts are not enabled.');
      case 'auth/weak-password':
        throw new Error('Password should be at least 6 characters.');
      default:
        throw new Error('Failed to create account. Please try again.');
    }
  }
}

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<User>} Firebase user object
 */
export async function signIn(email, password) {
  if (!hasFirebaseConfig || !auth) {
    throw new Error('Firebase authentication is not configured. Running in demo mode.');
  }

  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ User signed in successfully:', user.email);
    return user;
  } catch (error) {
    console.error('❌ Sign in error:', error);
    
    // Provide user-friendly error messages
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        throw new Error('Invalid email or password.');
      case 'auth/invalid-email':
        throw new Error('Please enter a valid email address.');
      case 'auth/user-disabled':
        throw new Error('This account has been disabled.');
      case 'auth/too-many-requests':
        throw new Error('Too many failed attempts. Please try again later.');
      default:
        throw new Error('Failed to sign in. Please try again.');
    }
  }
}

/**
 * Sign in with Google
 * @returns {Promise<User>} Firebase user object
 */
export async function signInWithGoogle() {
  if (!hasFirebaseConfig || !auth) {
    throw new Error('Firebase authentication is not configured. Running in demo mode.');
  }

  try {
    const { user } = await signInWithPopup(auth, googleProvider);
    
    // Google auth automatically provides display name
    console.log('✅ User signed in with Google:', user.email);
    console.log('Display name:', user.displayName);
    
    return user;
  } catch (error) {
    console.error('❌ Google sign in error:', error);
    
    // Provide user-friendly error messages
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        throw new Error('Sign in was cancelled.');
      case 'auth/popup-blocked':
        throw new Error('Popup was blocked by browser. Please allow popups and try again.');
      case 'auth/account-exists-with-different-credential':
        throw new Error('An account already exists with the same email address.');
      case 'auth/operation-not-allowed':
        throw new Error('Google sign-in is not enabled.');
      case 'auth/unauthorized-domain':
        throw new Error('This domain is not authorized for Google sign-in.');
      default:
        throw new Error('Failed to sign in with Google. Please try again.');
    }
  }
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export async function signOutUser() {
  if (!hasFirebaseConfig || !auth) {
    console.log('✅ Demo mode: User signed out');
    return;
  }

  try {
    await signOut(auth);
    console.log('✅ User signed out successfully');
  } catch (error) {
    console.error('❌ Sign out error:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
}

/**
 * Update user profile information
 * @param {string} displayName - New display name
 * @returns {Promise<void>}
 */
export async function updateUserProfile(displayName) {
  if (!hasFirebaseConfig || !auth || !auth.currentUser) {
    throw new Error('No user is currently logged in.');
  }
  
  try {
    const truncatedName = displayName.length > 20 
      ? displayName.substring(0, 20) + '...' 
      : displayName;
      
    await updateProfile(auth.currentUser, {
      displayName: truncatedName
    });
    
    console.log('✅ Profile updated successfully');
  } catch (error) {
    console.error('❌ Profile update error:', error);
    throw new Error('Failed to update profile. Please try again.');
  }
}

/**
 * Get current authenticated user
 * @returns {User|null} Current user or null if not authenticated
 */
export function getCurrentUser() {
  if (!hasFirebaseConfig || !auth) return null;
  return auth.currentUser;
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is logged in
 */
export function isAuthenticated() {
  if (!hasFirebaseConfig || !auth) return false;
  return !!auth.currentUser;
}