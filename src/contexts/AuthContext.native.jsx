import { createContext, useContext, useMemo } from 'react';

/**
 * AuthContext for React Native (guest-only stub).
 *
 * Metro auto-selects this over AuthContext.jsx on iOS/Android builds.
 *
 * Phase 2.6c will replace this with a full implementation backed by
 * @react-native-firebase/auth + Sign in with Apple + Google via
 * expo-auth-session. Until then, mobile runs in permanent guest mode:
 *
 *   - user is null (so useAuth consumers that gate on isAuthenticated
 *     short-circuit to local-only behavior — exactly what we want for
 *     ConversationContext's local conversations).
 *   - getIdToken returns null so any accidental remote call is visibly
 *     unauthorized.
 *   - All mutation methods (signIn, signUp, etc.) throw so a caller
 *     that reaches them in guest mode crashes loudly instead of silently
 *     doing nothing.
 */

const AuthContext = createContext(null);

const notWired = (name) => () => {
  throw new Error(
    `[AuthContext.native] ${name}() not implemented — Phase 2.6c wires @react-native-firebase/auth.`,
  );
};

export const AuthProvider = ({ children }) => {
  const value = useMemo(
    () => ({
      user: null,
      loading: false,
      error: null,
      signUp: notWired('signUp'),
      signIn: notWired('signIn'),
      signInWithGoogle: notWired('signInWithGoogle'),
      signOut: notWired('signOut'),
      resetPassword: notWired('resetPassword'),
      changePassword: notWired('changePassword'),
      sendVerificationEmail: notWired('sendVerificationEmail'),
      deleteAccount: notWired('deleteAccount'),
      isEmailUser: () => false,
      getIdToken: async () => null,
      clearError: () => {},
    }),
    [],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
