import { nanoid } from 'nanoid';
import { AgentContext, AgentMessage } from '../types';

export interface ContextSession {
  id: string;
  userId?: string;
  createdAt: Date;
  lastActivity: Date;
  metadata: Record<string, any>;
  messages: AgentMessage[];
  variables: Record<string, any>;
}

export interface ContextStorage {
  get(sessionId: string): Promise<ContextSession | null>;
  set(session: ContextSession): Promise<void>;
  delete(sessionId: string): Promise<boolean>;
  list(userId?: string): Promise<ContextSession[]>;
  cleanup(maxAge: number): Promise<number>; // Returns number of cleaned sessions
}

// In-memory storage implementation
export class InMemoryContextStorage implements ContextStorage {
  private sessions = new Map<string, ContextSession>();

  async get(sessionId: string): Promise<ContextSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async set(session: ContextSession): Promise<void> {
    this.sessions.set(session.id, { ...session });
  }

  async delete(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }

  async list(userId?: string): Promise<ContextSession[]> {
    const sessions = Array.from(this.sessions.values());
    if (userId) {
      return sessions.filter(session => session.userId === userId);
    }
    return sessions;
  }

  async cleanup(maxAge: number): Promise<number> {
    const cutoff = new Date(Date.now() - maxAge);
    const toDelete: string[] = [];

    for (const [id, session] of this.sessions) {
      if (session.lastActivity < cutoff) {
        toDelete.push(id);
      }
    }

    toDelete.forEach(id => this.sessions.delete(id));
    return toDelete.length;
  }
}

// Context manager for handling agent communication
export class ContextManager {
  private storage: ContextStorage;
  private sessionTimeout: number; // milliseconds

  constructor(storage?: ContextStorage, sessionTimeout = 30 * 60 * 1000) { // 30 minutes default
    this.storage = storage || new InMemoryContextStorage();
    this.sessionTimeout = sessionTimeout;
  }

  // Session management
  async createSession(userId?: string, metadata?: Record<string, any>): Promise<string> {
    const sessionId = nanoid();
    const session: ContextSession = {
      id: sessionId,
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      metadata: metadata || {},
      messages: [],
      variables: {}
    };

    await this.storage.set(session);
    return sessionId;
  }

  async getSession(sessionId: string): Promise<ContextSession | null> {
    const session = await this.storage.get(sessionId);
    if (session) {
      // Update last activity
      session.lastActivity = new Date();
      await this.storage.set(session);
    }
    return session;
  }

  async updateSession(sessionId: string, updates: Partial<ContextSession>): Promise<boolean> {
    const session = await this.storage.get(sessionId);
    if (!session) return false;

    const updatedSession = {
      ...session,
      ...updates,
      lastActivity: new Date()
    };

    await this.storage.set(updatedSession);
    return true;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return await this.storage.delete(sessionId);
  }

  async listSessions(userId?: string): Promise<ContextSession[]> {
    return await this.storage.list(userId);
  }

  // Context creation and management
  async createContext(sessionId?: string, metadata?: Record<string, any>): Promise<AgentContext> {
    if (!sessionId) {
      sessionId = await this.createSession(undefined, metadata);
    }

    return {
      sessionId,
      timestamp: new Date(),
      metadata
    };
  }

  async getContext(sessionId: string): Promise<AgentContext | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    return {
      sessionId: session.id,
      userId: session.userId,
      timestamp: new Date(),
      metadata: session.metadata
    };
  }

  // Message management
  async addMessage(sessionId: string, message: AgentMessage): Promise<boolean> {
    const session = await this.storage.get(sessionId);
    if (!session) return false;

    session.messages.push(message);
    session.lastActivity = new Date();
    
    await this.storage.set(session);
    return true;
  }

  async getMessages(sessionId: string, limit?: number): Promise<AgentMessage[]> {
    const session = await this.storage.get(sessionId);
    if (!session) return [];

    let messages = session.messages;
    if (limit && limit > 0) {
      messages = messages.slice(-limit);
    }

    return messages;
  }

  async clearMessages(sessionId: string): Promise<boolean> {
    return await this.updateSession(sessionId, { messages: [] });
  }

  // Variable management for workflow state
  async setVariable(sessionId: string, key: string, value: any): Promise<boolean> {
    const session = await this.storage.get(sessionId);
    if (!session) return false;

    session.variables[key] = value;
    session.lastActivity = new Date();
    
    await this.storage.set(session);
    return true;
  }

  async getVariable(sessionId: string, key: string): Promise<any> {
    const session = await this.storage.get(sessionId);
    return session?.variables[key];
  }

  async setVariables(sessionId: string, variables: Record<string, any>): Promise<boolean> {
    const session = await this.storage.get(sessionId);
    if (!session) return false;

    session.variables = { ...session.variables, ...variables };
    session.lastActivity = new Date();
    
    await this.storage.set(session);
    return true;
  }

  async getVariables(sessionId: string): Promise<Record<string, any>> {
    const session = await this.storage.get(sessionId);
    return session?.variables || {};
  }

  async clearVariables(sessionId: string): Promise<boolean> {
    return await this.updateSession(sessionId, { variables: {} });
  }

  // Metadata management
  async setMetadata(sessionId: string, key: string, value: any): Promise<boolean> {
    const session = await this.storage.get(sessionId);
    if (!session) return false;

    session.metadata[key] = value;
    session.lastActivity = new Date();
    
    await this.storage.set(session);
    return true;
  }

  async getMetadata(sessionId: string, key?: string): Promise<any> {
    const session = await this.storage.get(sessionId);
    if (!session) return null;

    return key ? session.metadata[key] : session.metadata;
  }

  // Conversation history management
  async getConversationHistory(
    sessionId: string, 
    agentId?: string, 
    limit?: number
  ): Promise<AgentMessage[]> {
    const messages = await this.getMessages(sessionId);
    
    let filtered = messages;
    if (agentId) {
      filtered = messages.filter(msg => msg.agentId === agentId);
    }

    if (limit && limit > 0) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  async getLastUserMessage(sessionId: string): Promise<AgentMessage | null> {
    const messages = await this.getMessages(sessionId);
    
    // Find the last message with type 'input'
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === 'input') {
        return messages[i];
      }
    }

    return null;
  }

  async getRecentMessages(sessionId: string, count = 5): Promise<AgentMessage[]> {
    const messages = await this.getMessages(sessionId);
    return messages.slice(-count);
  }

  // Context summarization for long conversations
  async summarizeContext(sessionId: string, maxMessages = 100): Promise<string> {
    const session = await this.storage.get(sessionId);
    if (!session || session.messages.length === 0) {
      return 'No conversation history available.';
    }

    const messages = session.messages.slice(-maxMessages);
    const summary: string[] = [];

    // Add session info
    summary.push(`Session started: ${session.createdAt.toISOString()}`);
    summary.push(`Last activity: ${session.lastActivity.toISOString()}`);

    // Add message summary
    const messageTypes = messages.reduce((acc, msg) => {
      acc[msg.type] = (acc[msg.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    summary.push(`Messages: ${Object.entries(messageTypes)
      .map(([type, count]) => `${count} ${type}`)
      .join(', ')}`);

    // Add agent activity
    const agentActivity = messages.reduce((acc, msg) => {
      acc[msg.agentId] = (acc[msg.agentId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    summary.push(`Agent activity: ${Object.entries(agentActivity)
      .map(([agentId, count]) => `${agentId} (${count})`)
      .join(', ')}`);

    // Add recent context
    const recentMessages = messages.slice(-3);
    if (recentMessages.length > 0) {
      summary.push('Recent activity:');
      recentMessages.forEach(msg => {
        const content = typeof msg.content === 'string' 
          ? msg.content.substring(0, 100) 
          : JSON.stringify(msg.content).substring(0, 100);
        summary.push(`  ${msg.agentId}: ${msg.type} - ${content}...`);
      });
    }

    return summary.join('\n');
  }

  // Cleanup and maintenance
  async cleanupExpiredSessions(): Promise<number> {
    return await this.storage.cleanup(this.sessionTimeout);
  }

  async getSessionStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    averageMessages: number;
    averageAge: number;
  }> {
    const sessions = await this.storage.list();
    const now = Date.now();
    const cutoff = now - this.sessionTimeout;

    const active = sessions.filter(s => s.lastActivity.getTime() > cutoff);
    const expired = sessions.length - active.length;

    const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0);
    const totalAge = sessions.reduce((sum, s) => sum + (now - s.createdAt.getTime()), 0);

    return {
      total: sessions.length,
      active: active.length,
      expired,
      averageMessages: sessions.length > 0 ? totalMessages / sessions.length : 0,
      averageAge: sessions.length > 0 ? totalAge / sessions.length : 0
    };
  }
}