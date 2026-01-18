/**
 * Artifacts API Endpoint
 * Combined CRUD operations for artifacts
 *
 * GET    /api/artifacts       - List all artifacts
 * POST   /api/artifacts       - Create new artifact
 * PUT    /api/artifacts       - Update existing artifact
 * DELETE /api/artifacts?id=X  - Delete artifact
 */

import { verifyAuth, getFirestore } from './middleware/_auth.js';

export default async function handler(req, res) {
  try {
    // Verify authentication for all operations
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const { userId } = authResult;
    const db = getFirestore();

    switch (req.method) {
      case 'GET':
        return handleList(db, userId, res);
      case 'POST':
        return handleCreate(db, userId, req.body, res);
      case 'PUT':
        return handleUpdate(db, userId, req.body, res);
      case 'DELETE':
        return handleDelete(db, userId, req.query.id, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Artifacts API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * List all artifacts for user
 */
async function handleList(db, userId, res) {
  const artifactsRef = db
    .collection('users')
    .doc(userId)
    .collection('artifacts')
    .orderBy('updatedAt', 'desc');

  const snapshot = await artifactsRef.get();

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
}

/**
 * Create new artifact (metadata only - files stored separately in FileSystem)
 */
async function handleCreate(db, userId, body, res) {
  const { name, projectSlug, icon } = body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Artifact name is required and must be a string',
    });
  }

  // Artifacts are now lightweight metadata - no files or chatHistory
  const artifactData = {
    name,
    projectSlug: projectSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50),
    icon: icon || 'app',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const artifactRef = await db
    .collection('users')
    .doc(userId)
    .collection('artifacts')
    .add(artifactData);

  return res.status(201).json({
    success: true,
    artifact: {
      id: artifactRef.id,
      ...artifactData,
    },
  });
}

/**
 * Update existing artifact (metadata only)
 */
async function handleUpdate(db, userId, body, res) {
  const { artifactId, updates } = body;

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

  const artifactRef = db
    .collection('users')
    .doc(userId)
    .collection('artifacts')
    .doc(artifactId);

  const artifactDoc = await artifactRef.get();

  if (!artifactDoc.exists) {
    return res.status(404).json({
      error: 'Not found',
      message: 'Artifact not found or you do not have permission to update it',
    });
  }

  // Only allow metadata updates (name, icon) - files/chatHistory no longer stored in artifact
  const allowedFields = ['name', 'icon'];
  const updateData = {
    updatedAt: new Date().toISOString(),
  };

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateData[field] = updates[field];
    }
  }

  await artifactRef.update(updateData);

  const updatedDoc = await artifactRef.get();

  return res.status(200).json({
    success: true,
    artifact: {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    },
  });
}

/**
 * Delete artifact with cascade delete of associated code files
 */
async function handleDelete(db, userId, artifactId, res) {
  if (!artifactId || typeof artifactId !== 'string') {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Artifact ID is required in query parameters',
    });
  }

  const artifactRef = db
    .collection('users')
    .doc(userId)
    .collection('artifacts')
    .doc(artifactId);

  const artifactDoc = await artifactRef.get();

  if (!artifactDoc.exists) {
    return res.status(404).json({
      error: 'Not found',
      message: 'Artifact not found or you do not have permission to delete it',
    });
  }

  // Get projectSlug for cascade delete
  const { projectSlug } = artifactDoc.data();

  // Delete the artifact
  await artifactRef.delete();

  // Cascade delete: Remove all files in code/{projectSlug}/
  let deletedFilesCount = 0;
  if (projectSlug) {
    try {
      const filesRef = db
        .collection('users')
        .doc(userId)
        .collection('files');

      // Query files that start with code/{projectSlug}/
      // Note: Firestore doesn't support startsWith directly, so we use range query
      const prefix = `code/${projectSlug}/`;
      const endPrefix = `code/${projectSlug}0`; // '0' comes after '/' in ASCII

      const codeFilesSnapshot = await filesRef
        .where('path', '>=', prefix)
        .where('path', '<', endPrefix)
        .get();

      // Delete each file in a batch
      if (!codeFilesSnapshot.empty) {
        const batch = db.batch();
        codeFilesSnapshot.forEach(doc => {
          batch.delete(doc.ref);
          deletedFilesCount++;
        });
        await batch.commit();
        console.log(`[Artifacts] Cascade deleted ${deletedFilesCount} files for project ${projectSlug}`);
      }
    } catch (err) {
      // Log but don't fail - artifact is already deleted
      console.error(`[Artifacts] Cascade delete failed for project ${projectSlug}:`, err);
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Artifact deleted successfully',
    artifactId,
    deletedFilesCount,
  });
}
