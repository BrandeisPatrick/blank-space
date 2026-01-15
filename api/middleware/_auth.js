/**
 * Authentication Middleware
 * Verifies Firebase JWT tokens for API endpoints
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Check if required environment variables are present
    // IMPORTANT: Trim values to remove any trailing newlines that Vercel might add
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim();

    if (!projectId || !clientEmail || !privateKey) {
      console.error('Missing Firebase Admin credentials in environment variables');
      throw new Error('Firebase Admin credentials not configured');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'), // Handle newlines in private key
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET?.trim() || `${projectId}.appspot.com`,
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
}

/**
 * Verify Firebase ID token from request headers
 * @param {Object} req - Vercel request object
 * @returns {Promise<Object>} Decoded token with userId
 */
export async function verifyAuth(req) {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return {
        error: 'No authorization header',
        status: 401,
      };
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      return {
        error: 'Invalid authorization format. Expected: Bearer <token>',
        status: 401,
      };
    }

    // Verify the token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Return user info
    return {
      userId: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };
  } catch (error) {
    // Handle specific Firebase errors
    if (error.code === 'auth/id-token-expired') {
      return {
        error: 'Token expired. Please sign in again.',
        status: 401,
      };
    }

    if (error.code === 'auth/invalid-id-token') {
      return {
        error: 'Invalid token. Please sign in again.',
        status: 401,
      };
    }

    if (error.code === 'auth/argument-error') {
      return {
        error: 'Invalid token format',
        status: 401,
      };
    }

    // Generic error - include actual error message for debugging
    return {
      error: 'Authentication failed',
      details: error.message,
      status: 401,
    };
  }
}

/**
 * Get Firestore instance (for use in API routes)
 */
export function getFirestore() {
  return admin.firestore();
}

/**
 * Get Storage instance (for use in API routes)
 */
export function getStorage() {
  return admin.storage();
}

export default verifyAuth;
