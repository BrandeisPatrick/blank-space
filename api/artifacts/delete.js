/**
 * Delete Artifact Endpoint
 * DELETE /api/artifacts/delete
 * Deletes an artifact for the authenticated user
 */

import { verifyAuth, getFirestore } from '../middleware/auth.js';

export default async function handler(req, res) {
  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const { userId } = authResult;

    // Get artifact ID from query parameters
    const { id: artifactId } = req.query;

    // Validate artifact ID
    if (!artifactId || typeof artifactId !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Artifact ID is required in query parameters',
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
        message: 'Artifact not found or you do not have permission to delete it',
      });
    }

    // Delete the artifact
    await artifactRef.delete();

    return res.status(200).json({
      success: true,
      message: 'Artifact deleted successfully',
      artifactId,
    });
  } catch (error) {
    console.error('Delete artifact error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
