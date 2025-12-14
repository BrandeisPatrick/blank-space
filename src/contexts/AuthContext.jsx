/**
 * AuthContext - Authentication State Management
 * Manages user authentication state and provides auth methods throughout the app
 */

import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  deleteUser,
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    // If Firebase is not configured, set loading to false immediately
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Get Firebase ID token for API authentication
  const getIdToken = async () => {
    if (!auth) {
      throw new Error('Authentication not available in guest mode');
    }
    if (!auth.currentUser) {
      throw new Error('No user logged in');
    }
    // Force token refresh to ensure we get a valid, non-expired token
    const token = await auth.currentUser.getIdToken(true);
    return token;
  };

  // Sign up with email and password
  const signUp = async (email, password, displayName = null) => {
    if (!auth) {
      const error = new Error('Authentication not available in guest mode');
      setError('Authentication is not configured. Please contact the administrator.');
      throw error;
    }
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name if provided
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }

      return result.user;
    } catch (err) {
      console.error('Sign up error:', err);
      setError(getErrorMessage(err.code));
      throw err;
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    if (!auth) {
      const error = new Error('Authentication not available in guest mode');
      setError('Authentication is not configured. Please contact the administrator.');
      throw error;
    }
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      console.error('Sign in error:', err);
      setError(getErrorMessage(err.code));
      throw err;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    if (!auth) {
      const error = new Error('Authentication not available in guest mode');
      setError('Authentication is not configured. Please contact the administrator.');
      throw error;
    }
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (err) {
      console.error('Google sign in error:', err);
      setError(getErrorMessage(err.code));
      throw err;
    }
  };

  // Sign out
  const signOut = async () => {
    if (!auth) {
      const error = new Error('Authentication not available in guest mode');
      setError('Authentication is not configured. Please contact the administrator.');
      throw error;
    }
    try {
      setError(null);
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(getErrorMessage(err.code));
      throw err;
    }
  };

  // Send password reset email
  const resetPassword = async (email) => {
    if (!auth) {
      const error = new Error('Authentication not available in guest mode');
      setError('Authentication is not configured. Please contact the administrator.');
      throw error;
    }
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(getErrorMessage(err.code));
      throw err;
    }
  };

  // Change password (requires current password for reauthentication)
  const changePassword = async (currentPassword, newPassword) => {
    if (!auth) {
      const error = new Error('Authentication not available in guest mode');
      setError('Authentication is not configured. Please contact the administrator.');
      throw error;
    }
    if (!auth.currentUser) {
      const error = new Error('No user logged in');
      setError('You must be logged in to change your password.');
      throw error;
    }
    try {
      setError(null);
      // Reauthenticate first
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      // Update password
      await updatePassword(auth.currentUser, newPassword);
    } catch (err) {
      console.error('Change password error:', err);
      setError(getErrorMessage(err.code));
      throw err;
    }
  };

  // Send email verification
  const sendVerificationEmail = async () => {
    if (!auth) {
      const error = new Error('Authentication not available in guest mode');
      setError('Authentication is not configured. Please contact the administrator.');
      throw error;
    }
    if (!auth.currentUser) {
      const error = new Error('No user logged in');
      setError('You must be logged in to verify your email.');
      throw error;
    }
    try {
      setError(null);
      await sendEmailVerification(auth.currentUser);
    } catch (err) {
      console.error('Send verification email error:', err);
      setError(getErrorMessage(err.code));
      throw err;
    }
  };

  // Delete Firebase Auth account (call after deleting Firestore data)
  const deleteAccount = async (password = null) => {
    if (!auth) {
      const error = new Error('Authentication not available in guest mode');
      setError('Authentication is not configured. Please contact the administrator.');
      throw error;
    }
    if (!auth.currentUser) {
      const error = new Error('No user logged in');
      setError('You must be logged in to delete your account.');
      throw error;
    }
    try {
      setError(null);
      // If password provided, reauthenticate (for email/password users)
      if (password) {
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          password
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
      }
      // Delete the Firebase Auth user
      await deleteUser(auth.currentUser);
    } catch (err) {
      console.error('Delete account error:', err);
      setError(getErrorMessage(err.code));
      throw err;
    }
  };

  // Check if user signed in with email/password (vs Google OAuth)
  const isEmailUser = () => {
    if (!auth?.currentUser) return false;
    return auth.currentUser.providerData.some(
      provider => provider.providerId === 'password'
    );
  };

  // Clear error
  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    changePassword,
    sendVerificationEmail,
    deleteAccount,
    isEmailUser,
    getIdToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to convert Firebase error codes to user-friendly messages
const getErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing.';
    case 'auth/cancelled-popup-request':
      return 'Only one popup request is allowed at a time.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by browser. Please allow popups for this site.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized. Please add it in Firebase Console.';
    case 'auth/internal-error':
      return 'An internal error occurred. Please try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    default:
      return 'An error occurred. Please try again.';
  }
};
