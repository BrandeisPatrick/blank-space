/**
 * Conversations API Endpoint
 * Combined CRUD operations for chat conversations
 *
 * GET    /api/conversations       - List all conversations
 * POST   /api/conversations       - Create new conversation
 * PUT    /api/conversations       - Update existing conversation
 * DELETE /api/conversations?id=X  - Delete conversation
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
    console.error('Conversations API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * List all conversations for user
 */
async function handleList(db, userId, res) {
  const conversationsRef = db
    .collection('users')
    .doc(userId)
    .collection('conversations')
    .orderBy('updatedAt', 'desc');

  const snapshot = await conversationsRef.get();

  const conversations = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    conversations.push({
      id: doc.id,
      title: data.title,
      messageCount: data.messages?.length || 0,
      artifactId: data.artifactId || null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  });

  return res.status(200).json({
    success: true,
    conversations,
    count: conversations.length,
  });
}

/**
 * Create new conversation
 */
async function handleCreate(db, userId, body, res) {
  const { title, messages = [], artifactId = null } = body;

  const conversationData = {
    title: title || 'New conversation',
    messages,
    artifactId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const conversationRef = await db
    .collection('users')
    .doc(userId)
    .collection('conversations')
    .add(conversationData);

  return res.status(201).json({
    success: true,
    conversation: {
      id: conversationRef.id,
      ...conversationData,
      messageCount: messages.length,
    },
  });
}

/**
 * Update existing conversation
 * Supports: adding messages, updating title, linking artifact
 */
async function handleUpdate(db, userId, body, res) {
  const { conversationId, updates } = body;

  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Conversation ID is required and must be a string',
    });
  }

  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Updates object is required',
    });
  }

  const conversationRef = db
    .collection('users')
    .doc(userId)
    .collection('conversations')
    .doc(conversationId);

  const conversationDoc = await conversationRef.get();

  if (!conversationDoc.exists) {
    return res.status(404).json({
      error: 'Not found',
      message: 'Conversation not found or you do not have permission to update it',
    });
  }

  const currentData = conversationDoc.data();

  // Handle message appending vs replacement
  let newMessages = currentData.messages || [];
  if (updates.appendMessage) {
    // Append single message
    newMessages = [...newMessages, updates.appendMessage];
    delete updates.appendMessage;
    updates.messages = newMessages;
  } else if (updates.appendMessages) {
    // Append multiple messages
    newMessages = [...newMessages, ...updates.appendMessages];
    delete updates.appendMessages;
    updates.messages = newMessages;
  }

  // Auto-generate title from first user message if not set
  if (updates.messages && updates.messages.length > 0 && currentData.title === 'New conversation') {
    const firstUserMsg = updates.messages.find(m => m.type === 'user' || m.role === 'user');
    if (firstUserMsg) {
      updates.title = firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
    }
  }

  const updateData = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  delete updateData.id;
  delete updateData.createdAt;

  await conversationRef.update(updateData);

  const updatedDoc = await conversationRef.get();
  const updatedData = updatedDoc.data();

  return res.status(200).json({
    success: true,
    conversation: {
      id: updatedDoc.id,
      title: updatedData.title,
      messageCount: updatedData.messages?.length || 0,
      artifactId: updatedData.artifactId || null,
      createdAt: updatedData.createdAt,
      updatedAt: updatedData.updatedAt,
    },
  });
}

/**
 * Delete conversation
 */
async function handleDelete(db, userId, conversationId, res) {
  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Conversation ID is required in query parameters',
    });
  }

  const conversationRef = db
    .collection('users')
    .doc(userId)
    .collection('conversations')
    .doc(conversationId);

  const conversationDoc = await conversationRef.get();

  if (!conversationDoc.exists) {
    return res.status(404).json({
      error: 'Not found',
      message: 'Conversation not found or you do not have permission to delete it',
    });
  }

  await conversationRef.delete();

  return res.status(200).json({
    success: true,
    message: 'Conversation deleted successfully',
    conversationId,
  });
}

/**
 * Get single conversation with full messages (for internal use)
 */
export async function getConversation(db, userId, conversationId) {
  const conversationRef = db
    .collection('users')
    .doc(userId)
    .collection('conversations')
    .doc(conversationId);

  const conversationDoc = await conversationRef.get();

  if (!conversationDoc.exists) {
    return null;
  }

  return {
    id: conversationDoc.id,
    ...conversationDoc.data(),
  };
}
