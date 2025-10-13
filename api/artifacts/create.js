/**
 * Create Artifact Endpoint
 * POST /api/artifacts/create
 * Creates a new artifact for the authenticated user
 */

import { verifyAuth, getFirestore } from '../middleware/auth.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const { userId } = authResult;
    const { name, files } = req.body;

    // Validate request body
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Artifact name is required and must be a string',
      });
    }

    if (!files || typeof files !== 'object') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Files object is required',
      });
    }

    // Get Firestore instance
    const db = getFirestore();

    // Create artifact document
    const artifactData = {
      name,
      files,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to Firestore: /users/{userId}/artifacts/{artifactId}
    const artifactRef = await db
      .collection('users')
      .doc(userId)
      .collection('artifacts')
      .add(artifactData);

    // Return created artifact with ID
    const createdArtifact = {
      id: artifactRef.id,
      ...artifactData,
    };

    return res.status(201).json({
      success: true,
      artifact: createdArtifact,
    });
  } catch (error) {
    console.error('Create artifact error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
