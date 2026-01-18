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
 * Create new artifact
 */
async function handleCreate(db, userId, body, res) {
  const { name, files, projectSlug, icon, chatHistory } = body;

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

  const artifactData = {
    name,
    files,
    projectSlug: projectSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50),
    icon: icon || 'app',
    chatHistory: chatHistory || [],
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
 * Update existing artifact
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

  const updateData = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  delete updateData.id;
  delete updateData.createdAt;

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
 * Delete artifact
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

  await artifactRef.delete();

  return res.status(200).json({
    success: true,
    message: 'Artifact deleted successfully',
    artifactId,
  });
}
