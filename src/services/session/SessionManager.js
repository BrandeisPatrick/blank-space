/**
 * Session Manager
 * Manages conversation sessions with message history and tool calls
 */

export class SessionManager {
  constructor() {
    this.sessions = new Map(); // sessionId → Session
  }

  /**
   * Create new session
   * @param {string} userId - User ID
   * @returns {Session}
   */
  createSession(userId) {
    const sessionId = this._generateSessionId();
    const session = {
      id: sessionId,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      toolCalls: [],
      status: 'active'
    };

    this.sessions.set(sessionId, session);

    return session;
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session ID
   * @returns {Session|null}
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Add message to session
   * @param {string} sessionId - Session ID
   * @param {string} role - Message role ('user', 'assistant', 'tool')
   * @param {string} content - Message content
   * @param {Object} metadata - Additional metadata
   */
  addMessage(sessionId, role, content, metadata = {}) {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const message = {
      id: this._generateMessageId(),
      role,
      content,
      timestamp: Date.now(),
      ...metadata
    };

    session.messages.push(message);
    session.updatedAt = Date.now();

    return message;
  }

  /**
   * Add tool call to session
   * @param {string} sessionId - Session ID
   * @param {string} toolName - Tool name
   * @param {Object} params - Tool parameters
   * @param {Object} result - Tool result
   */
  addToolCall(sessionId, toolName, params, result) {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const toolCall = {
      id: this._generateToolCallId(),
      tool: toolName,
      params,
      result,
      timestamp: Date.now(),
      success: result.success
    };

    session.toolCalls.push(toolCall);
    session.updatedAt = Date.now();

    return toolCall;
  }

  /**
   * Get session history as messages for LLM
   * @param {string} sessionId - Session ID
   * @returns {Array} - Array of messages for LLM API
   */
  getHistory(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) {
      return [];
    }

    return session.messages.map(msg => {
      if (msg.role === 'tool') {
        return {
          role: 'tool',
          tool_call_id: msg.tool_call_id,
          content: msg.content
        };
      }

      return {
        role: msg.role,
        content: msg.content
      };
    });
  }

  /**
   * Get session statistics
   * @param {string} sessionId - Session ID
   * @returns {Object} - Session stats
   */
  getStats(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) {
      return null;
    }

    return {
      sessionId,
      messageCount: session.messages.length,
      toolCallCount: session.toolCalls.length,
      successfulTools: session.toolCalls.filter(t => t.success).length,
      failedTools: session.toolCalls.filter(t => !t.success).length,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      duration: session.updatedAt - session.createdAt
    };
  }

  /**
   * Get full session transcript
   * @param {string} sessionId - Session ID
   * @returns {Object} - Full session data
   */
  getTranscript(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) {
      return null;
    }

    return {
      ...session,
      stats: this.getStats(sessionId)
    };
  }

  /**
   * Clear session
   * @param {string} sessionId - Session ID
   */
  clearSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  /**
   * Get all sessions
   * @returns {Session[]}
   */
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Generate unique session ID
   * @private
   */
  _generateSessionId() {
    return `session_${Date.now()}_${crypto.randomUUID().substring(0, 9)}`;
  }

  /**
   * Generate unique message ID
   * @private
   */
  _generateMessageId() {
    return `msg_${Date.now()}_${crypto.randomUUID().substring(0, 9)}`;
  }

  /**
   * Generate unique tool call ID
   * @private
   */
  _generateToolCallId() {
    return `call_${Date.now()}_${crypto.randomUUID().substring(0, 9)}`;
  }
}

export default SessionManager;
