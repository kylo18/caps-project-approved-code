// Firebase Auth Service
// Handles all authentication operations

import {
  auth,
} from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

// Auth state listener
export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Email/Password Sign Up
export async function signUpWithEmail(email: string, password: string, displayName: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName,
      });
    }
    
    return {
      success: true,
      user: userCredential.user,
      token: await userCredential.user.getIdToken(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create account',
      code: error.code,
    };
  }
}

// Email/Password Sign In
export async function signInWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    return {
      success: true,
      user: userCredential.user,
      token: await userCredential.user.getIdToken(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to sign in',
      code: error.code,
    };
  }
}

// Sign Out
export async function signOutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to sign out',
    };
  }
}

// Password Reset
export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send reset email',
      code: error.code,
    };
  }
}

// Get current user token
export async function getCurrentUserToken() {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    return await user.getIdToken();
  } catch (error) {
    return null;
  }
}

// Get current user
export function getCurrentUser() {
  return auth.currentUser;
}

// Google Sign In - Simplified for Expo Go
// Uses Firebase's built-in Google provider with a custom token approach

export function useGoogleAuth() {
  // For Expo Go, we use a mock approach
  // In production, you should use react-native-firebase or expo-dev-client
  
  const signInWithGoogle = async () => {
    return {
      success: false,
      error: 'Google Sign-In requires expo-dev-client. Please use Email/Password login for now.',
    };
  };

  return { 
    request: null, 
    response: null, 
    signInWithGoogle 
  };
}

// Error message helper
export function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    default:
      return 'An error occurred. Please try again';
  }
}
