/**
 * Delete User Account Endpoint
 * DELETE /api/user/delete
 * Deletes all user data (profile, artifacts) from Firestore
 * Note: Firebase Auth user deletion is handled client-side after this succeeds
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
    const userRef = db.collection('users').doc(userId);

    // Delete all artifacts in subcollection
    const artifactsSnapshot = await userRef.collection('artifacts').get();

    // Use batched writes for efficiency (Firestore allows 500 ops per batch)
    const batch = db.batch();
    let deleteCount = 0;

    artifactsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deleteCount++;
    });

    // Delete the user document itself
    batch.delete(userRef);

    // Commit the batch
    await batch.commit();

    console.log(`Deleted user ${userId} with ${deleteCount} artifacts`);

    return res.status(200).json({
      success: true,
      message: 'Account data deleted successfully',
      deletedArtifacts: deleteCount,
    });
  } catch (error) {
    console.error('Delete user account error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
