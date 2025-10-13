/**
 * List Artifacts Endpoint
 * GET /api/artifacts/list
 * Returns all artifacts for the authenticated user
 */

import { verifyAuth, getFirestore } from '../middleware/auth.js';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const { userId } = authResult;

    // Get Firestore instance
    const db = getFirestore();

    // Query all artifacts for this user
    const artifactsRef = db
      .collection('users')
      .doc(userId)
      .collection('artifacts')
      .orderBy('updatedAt', 'desc'); // Most recently updated first

    const snapshot = await artifactsRef.get();

    // Convert snapshot to array of artifacts
    const artifacts = [];
    snapshot.forEach((doc) => {
      artifacts.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({
      success: true,
      artifacts,
      count: artifacts.length,
    });
  } catch (error) {
    console.error('List artifacts error:', error);

    // If error is due to missing index, provide helpful message
    if (error.code === 9 || error.message.includes('index')) {
      return res.status(500).json({
        error: 'Database index required',
        message: 'Firestore index is being created. Please try again in a few moments.',
        details: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
