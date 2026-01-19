/**
 * User Profile Endpoint
 * GET /api/user/profile - Fetch user profile (auto-creates if not exists)
 * PUT /api/user/profile - Update user profile
 */

import { verifyAuth, getFirestore } from '../middleware/_auth.js';

// Default profile for new users
function createDefaultProfile(authResult) {
  return {
    displayName: authResult.email?.split('@')[0] || 'User',
    email: authResult.email || '',
    photoURL: null,
    bio: '',
    settings: {
      theme: 'gradient',
      aiColorPalette: 'vibrant',
      aiUIStyle: 'glassmorphism',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    emailVerified: authResult.emailVerified || false,
    authProvider: 'email', // Will be updated if Google OAuth
  };
}

export default async function handler(req, res) {
  // Only allow GET and PUT
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const { userId } = authResult;
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);

    if (req.method === 'GET') {
      // Fetch user profile
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        // Auto-create profile for new users
        const defaultProfile = createDefaultProfile(authResult);
        await userRef.set(defaultProfile);

        return res.status(200).json({
          success: true,
          profile: defaultProfile,
          isNew: true,
        });
      }

      return res.status(200).json({
        success: true,
        profile: userDoc.data(),
        isNew: false,
      });
    }

    if (req.method === 'PUT') {
      // Update user profile
      const { displayName, bio, photoURL, settings } = req.body;

      // Build update object (only include provided fields)
      const updates = {
        updatedAt: new Date().toISOString(),
      };

      // Validate and add displayName
      if (displayName !== undefined) {
        if (typeof displayName !== 'string' || displayName.length > 50) {
          return res.status(400).json({
            error: 'Invalid displayName',
            message: 'Display name must be a string with max 50 characters',
          });
        }
        updates.displayName = displayName.trim();
      }

      // Validate and add bio
      if (bio !== undefined) {
        if (typeof bio !== 'string' || bio.length > 500) {
          return res.status(400).json({
            error: 'Invalid bio',
            message: 'Bio must be a string with max 500 characters',
          });
        }
        updates.bio = bio;
      }

      // Validate and add photoURL
      if (photoURL !== undefined) {
        if (photoURL !== null && typeof photoURL !== 'string') {
          return res.status(400).json({
            error: 'Invalid photoURL',
            message: 'Photo URL must be a string or null',
          });
        }
        updates.photoURL = photoURL;
      }

      // Validate and add settings
      if (settings !== undefined) {
        if (typeof settings !== 'object' || settings === null) {
          return res.status(400).json({
            error: 'Invalid settings',
            message: 'Settings must be an object',
          });
        }
        // Merge with existing settings
        const userDoc = await userRef.get();
        const existingSettings = userDoc.exists ? userDoc.data().settings || {} : {};
        updates.settings = { ...existingSettings, ...settings };
      }

      // Check if profile exists, create if not
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        // Create with defaults + updates
        const defaultProfile = createDefaultProfile(authResult);
        const newProfile = { ...defaultProfile, ...updates };
        await userRef.set(newProfile);

        return res.status(200).json({
          success: true,
          profile: newProfile,
        });
      }

      // Update existing profile
      await userRef.update(updates);

      // Fetch updated profile
      const updatedDoc = await userRef.get();

      return res.status(200).json({
        success: true,
        profile: updatedDoc.data(),
      });
    }
  } catch (error) {
    console.error('User profile error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
