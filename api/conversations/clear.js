/**
 * Clear All Conversations Endpoint
 * DELETE /api/conversations/clear
 * Deletes all conversation history for the authenticated user
 */

import { verifyAuth, getFirestore } from '../middleware/_auth.js';

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
    const db = getFirestore();

    // Get all conversations for this user
    const conversationsRef = db
      .collection('users')
      .doc(userId)
      .collection('conversations');

    const snapshot = await conversationsRef.get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        message: 'No conversations to delete',
        deletedCount: 0,
      });
    }

    // Use batched writes for efficiency (Firestore allows 500 ops per batch)
    const batchSize = 500;
    let deleteCount = 0;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
      deleteCount++;
      batchCount++;

      // Commit batch when it reaches the limit
      if (batchCount >= batchSize) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    // Commit any remaining operations
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`Deleted ${deleteCount} conversations for user ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'All conversations deleted successfully',
      deletedCount: deleteCount,
    });
  } catch (error) {
    console.error('Clear conversations error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
