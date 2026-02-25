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

/**
 * Bug #9 fix: Validate message structure
 * Returns sanitized message or null if invalid
 */
function validateMessage(msg) {
  if (!msg || typeof msg !== 'object') return null;

  // Explicit allowlist of known message fields
  const validated = {
    id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: msg.type || msg.role || 'user',
    content: typeof msg.content === 'string' ? msg.content : '',
    timestamp: msg.timestamp || Date.now(),
  };

  // Optional fields — only copy if present
  if (msg.role) validated.role = msg.role;
  if (msg.images) validated.images = msg.images;
  if (msg.thinking) validated.thinking = msg.thinking;
  if (msg.thinkingDuration != null) validated.thinkingDuration = msg.thinkingDuration;
  if (msg.isLoading != null) validated.isLoading = msg.isLoading;
  if (msg.error) validated.error = msg.error;

  return validated;
}

/**
 * Validate and sanitize messages array
 */
function validateMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map(validateMessage).filter(Boolean);
}

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
      messages: data.messages || [],
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

  // Bug #9 fix: Validate and sanitize messages
  const validatedMessages = validateMessages(messages);

  const conversationData = {
    title: title || 'New conversation',
    messages: validatedMessages,
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
      messageCount: validatedMessages.length,
    },
  });
}

/**
 * Update existing conversation
 * Supports: adding messages, updating title, linking artifact
 * Bug #10 fix: Uses transaction for message appending to prevent race conditions
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

  // Check if this requires message appending (needs transaction)
  const needsTransaction = updates.appendMessage || updates.appendMessages;

  let result;

  if (needsTransaction) {
    // Bug #10 fix: Use transaction for atomic message appending
    result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(conversationRef);

      if (!doc.exists) {
        throw new Error('NOT_FOUND');
      }

      const currentData = doc.data();
      let newMessages = currentData.messages || [];

      // Handle appending
      if (updates.appendMessage) {
        const validated = validateMessage(updates.appendMessage);
        if (validated) {
          newMessages = [...newMessages, validated];
        }
        delete updates.appendMessage;
      } else if (updates.appendMessages) {
        const validated = validateMessages(updates.appendMessages);
        newMessages = [...newMessages, ...validated];
        delete updates.appendMessages;
      }

      updates.messages = newMessages;

      // Auto-generate title from first user message if not set
      if (newMessages.length > 0 && currentData.title === 'New conversation') {
        const firstUserMsg = newMessages.find(m => m.type === 'user' || m.role === 'user');
        if (firstUserMsg && firstUserMsg.content) {
          updates.title = firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
        }
      }

      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      delete updateData.id;
      delete updateData.createdAt;

      transaction.update(conversationRef, updateData);

      return {
        id: doc.id,
        title: updateData.title || currentData.title,
        messageCount: newMessages.length,
        artifactId: updateData.artifactId || currentData.artifactId || null,
        createdAt: currentData.createdAt,
        updatedAt: updateData.updatedAt,
      };
    });
  } else {
    // Non-transactional update (no message appending)
    const conversationDoc = await conversationRef.get();

    if (!conversationDoc.exists) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Conversation not found or you do not have permission to update it',
      });
    }

    const currentData = conversationDoc.data();

    // Validate messages if being replaced
    if (updates.messages) {
      updates.messages = validateMessages(updates.messages);
    }

    // Auto-generate title from first user message if not set
    if (updates.messages && updates.messages.length > 0 && currentData.title === 'New conversation') {
      const firstUserMsg = updates.messages.find(m => m.type === 'user' || m.role === 'user');
      if (firstUserMsg && firstUserMsg.content) {
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

    result = {
      id: updatedDoc.id,
      title: updatedData.title,
      messageCount: updatedData.messages?.length || 0,
      artifactId: updatedData.artifactId || null,
      createdAt: updatedData.createdAt,
      updatedAt: updatedData.updatedAt,
    };
  }

  return res.status(200).json({
    success: true,
    conversation: result,
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
 * Validates and sanitizes messages before returning
 */
export async function getConversation(db, userId, conversationId) {
  if (!conversationId || typeof conversationId !== 'string') {
    return null;
  }

  const conversationRef = db
    .collection('users')
    .doc(userId)
    .collection('conversations')
    .doc(conversationId);

  const conversationDoc = await conversationRef.get();

  if (!conversationDoc.exists) {
    return null;
  }

  const data = conversationDoc.data();

  return {
    id: conversationDoc.id,
    title: data.title || 'New conversation',
    messages: validateMessages(data.messages || []),
    artifactId: data.artifactId || null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
