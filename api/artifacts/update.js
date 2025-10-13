/**
 * Update Artifact Endpoint
 * PUT /api/artifacts/update
 * Updates an existing artifact for the authenticated user
 */

import { verifyAuth, getFirestore } from '../middleware/auth.js';

export default async function handler(req, res) {
  // Only allow PUT requests
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const { userId } = authResult;
    const { artifactId, updates } = req.body;

    // Validate request body
    if (!artifactId || typeof artifactId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Artifact ID is required and must be a string',
      });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Updates object is required',
      });
    }

    // Get Firestore instance
    const db = getFirestore();

    // Reference to the artifact
    const artifactRef = db
      .collection('users')
      .doc(userId)
      .collection('artifacts')
      .doc(artifactId);

    // Check if artifact exists and belongs to user
    const artifactDoc = await artifactRef.get();

    if (!artifactDoc.exists) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Artifact not found or you do not have permission to update it',
      });
    }

    // Prepare update data
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Remove id field from updates if present (can't update document ID)
    delete updateData.id;
    delete updateData.createdAt; // Don't allow updating createdAt

    // Update the artifact
    await artifactRef.update(updateData);

    // Get updated artifact
    const updatedDoc = await artifactRef.get();
    const updatedArtifact = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    };

    return res.status(200).json({
      success: true,
      artifact: updatedArtifact,
    });
  } catch (error) {
    console.error('Update artifact error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
