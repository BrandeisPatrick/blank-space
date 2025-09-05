import { z } from 'zod';
import { nanoid } from 'nanoid';

// Session state schema
export const SessionStateSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  created: z.date(),
  updated: z.date(),
  metadata: z.record(z.any()).optional(),
  active: z.boolean().default(true),
});

export type SessionState = z.infer<typeof SessionStateSchema>;

// Agent execution state
export const AgentExecutionStateSchema = z.object({
  sessionId: z.string(),
  agentId: z.string(),
  taskId: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  startTime: z.date(),
  endTime: z.date().optional(),
  input: z.any(),
  output: z.any().optional(),
  error: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type AgentExecutionState = z.infer<typeof AgentExecutionStateSchema>;

// Context variables for agent execution
export const ContextVariablesSchema = z.object({
  sessionId: z.string(),
  variables: z.record(z.any()),
  lastUpdated: z.date(),
});

export type ContextVariables = z.infer<typeof ContextVariablesSchema>;

// State storage interface
export interface StateStorage {
  // Sessions
  createSession(session: Omit<SessionState, 'id' | 'created' | 'updated'>): Promise<SessionState>;
  getSession(id: string): Promise<SessionState | null>;
  updateSession(id: string, updates: Partial<SessionState>): Promise<SessionState>;
  deleteSession(id: string): Promise<boolean>;
  listSessions(userId?: string): Promise<SessionState[]>;

  // Agent executions
  saveExecution(execution: AgentExecutionState): Promise<void>;
  getExecution(sessionId: string, taskId: string): Promise<AgentExecutionState | null>;
  listExecutions(sessionId: string): Promise<AgentExecutionState[]>;
  updateExecution(sessionId: string, taskId: string, updates: Partial<AgentExecutionState>): Promise<void>;

  // Context variables
  setVariables(sessionId: string, variables: Record<string, any>): Promise<void>;
  getVariables(sessionId: string): Promise<ContextVariables | null>;
  setVariable(sessionId: string, key: string, value: any): Promise<void>;
  getVariable(sessionId: string, key: string): Promise<any>;
  deleteVariable(sessionId: string, key: string): Promise<boolean>;
}

// In-memory state storage implementation
export class InMemoryStateStorage implements StateStorage {
  private sessions = new Map<string, SessionState>();
  private executions = new Map<string, Map<string, AgentExecutionState>>();
  private contextVariables = new Map<string, ContextVariables>();

  async createSession(session: Omit<SessionState, 'id' | 'created' | 'updated'>): Promise<SessionState> {
    const now = new Date();
    const newSession: SessionState = {
      ...session,
      id: nanoid(),
      created: now,
      updated: now,
    };

    this.sessions.set(newSession.id, newSession);
    this.executions.set(newSession.id, new Map());
    
    return newSession;
  }

  async getSession(id: string): Promise<SessionState | null> {
    return this.sessions.get(id) || null;
  }

  async updateSession(id: string, updates: Partial<SessionState>): Promise<SessionState> {
    const existing = this.sessions.get(id);
    if (!existing) {
      throw new Error(`Session ${id} not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      updated: new Date(),
    };

    this.sessions.set(id, updated);
    return updated;
  }

  async deleteSession(id: string): Promise<boolean> {
    const deleted = this.sessions.delete(id);
    this.executions.delete(id);
    this.contextVariables.delete(id);
    return deleted;
  }

  async listSessions(userId?: string): Promise<SessionState[]> {
    const sessions = Array.from(this.sessions.values());
    if (userId) {
      return sessions.filter(session => session.userId === userId);
    }
    return sessions;
  }

  async saveExecution(execution: AgentExecutionState): Promise<void> {
    const sessionExecutions = this.executions.get(execution.sessionId);
    if (!sessionExecutions) {
      throw new Error(`Session ${execution.sessionId} not found`);
    }

    sessionExecutions.set(execution.taskId, execution);
  }

  async getExecution(sessionId: string, taskId: string): Promise<AgentExecutionState | null> {
    const sessionExecutions = this.executions.get(sessionId);
    return sessionExecutions?.get(taskId) || null;
  }

  async listExecutions(sessionId: string): Promise<AgentExecutionState[]> {
    const sessionExecutions = this.executions.get(sessionId);
    return sessionExecutions ? Array.from(sessionExecutions.values()) : [];
  }

  async updateExecution(sessionId: string, taskId: string, updates: Partial<AgentExecutionState>): Promise<void> {
    const existing = await this.getExecution(sessionId, taskId);
    if (!existing) {
      throw new Error(`Execution ${taskId} not found in session ${sessionId}`);
    }

    const updated = { ...existing, ...updates };
    await this.saveExecution(updated);
  }

  async setVariables(sessionId: string, variables: Record<string, any>): Promise<void> {
    const contextVars: ContextVariables = {
      sessionId,
      variables,
      lastUpdated: new Date(),
    };

    this.contextVariables.set(sessionId, contextVars);
  }

  async getVariables(sessionId: string): Promise<ContextVariables | null> {
    return this.contextVariables.get(sessionId) || null;
  }

  async setVariable(sessionId: string, key: string, value: any): Promise<void> {
    let contextVars = this.contextVariables.get(sessionId);
    if (!contextVars) {
      contextVars = {
        sessionId,
        variables: {},
        lastUpdated: new Date(),
      };
    }

    contextVars.variables[key] = value;
    contextVars.lastUpdated = new Date();
    this.contextVariables.set(sessionId, contextVars);
  }

  async getVariable(sessionId: string, key: string): Promise<any> {
    const contextVars = this.contextVariables.get(sessionId);
    return contextVars?.variables[key];
  }

  async deleteVariable(sessionId: string, key: string): Promise<boolean> {
    const contextVars = this.contextVariables.get(sessionId);
    if (contextVars && key in contextVars.variables) {
      delete contextVars.variables[key];
      contextVars.lastUpdated = new Date();
      return true;
    }
    return false;
  }

  // Utility methods for debugging and management
  clear(): void {
    this.sessions.clear();
    this.executions.clear();
    this.contextVariables.clear();
  }

  getStats(): { sessions: number; executions: number; variables: number } {
    let totalExecutions = 0;
    for (const sessionExecutions of this.executions.values()) {
      totalExecutions += sessionExecutions.size;
    }

    return {
      sessions: this.sessions.size,
      executions: totalExecutions,
      variables: this.contextVariables.size,
    };
  }
}

// Main state manager
export class StateManager {
  private storage: StateStorage;

  constructor(storage: StateStorage = new InMemoryStateStorage()) {
    this.storage = storage;
  }

  // Session management
  async createSession(userId?: string, metadata?: Record<string, any>): Promise<SessionState> {
    return this.storage.createSession({
      userId,
      metadata,
      active: true,
    });
  }

  async getSession(id: string): Promise<SessionState | null> {
    return this.storage.getSession(id);
  }

  async updateSession(id: string, updates: Partial<SessionState>): Promise<SessionState> {
    return this.storage.updateSession(id, updates);
  }

  async endSession(id: string): Promise<SessionState> {
    return this.storage.updateSession(id, { active: false });
  }

  async deleteSession(id: string): Promise<boolean> {
    return this.storage.deleteSession(id);
  }

  async listActiveSessions(userId?: string): Promise<SessionState[]> {
    const sessions = await this.storage.listSessions(userId);
    return sessions.filter(session => session.active);
  }

  // Agent execution tracking
  async startExecution(
    sessionId: string,
    agentId: string,
    taskId: string,
    input: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    const execution: AgentExecutionState = {
      sessionId,
      agentId,
      taskId,
      status: 'running',
      startTime: new Date(),
      input,
      metadata,
    };

    await this.storage.saveExecution(execution);
  }

  async completeExecution(
    sessionId: string,
    taskId: string,
    output: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.storage.updateExecution(sessionId, taskId, {
      status: 'completed',
      endTime: new Date(),
      output,
      metadata,
    });
  }

  async failExecution(
    sessionId: string,
    taskId: string,
    error: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.storage.updateExecution(sessionId, taskId, {
      status: 'failed',
      endTime: new Date(),
      error,
      metadata,
    });
  }

  async getExecutionHistory(sessionId: string): Promise<AgentExecutionState[]> {
    return this.storage.listExecutions(sessionId);
  }

  // Context variable management
  async setSessionVariable(sessionId: string, key: string, value: any): Promise<void> {
    return this.storage.setVariable(sessionId, key, value);
  }

  async getSessionVariable(sessionId: string, key: string): Promise<any> {
    return this.storage.getVariable(sessionId, key);
  }

  async getSessionVariables(sessionId: string): Promise<Record<string, any>> {
    const contextVars = await this.storage.getVariables(sessionId);
    return contextVars?.variables || {};
  }

  async deleteSessionVariable(sessionId: string, key: string): Promise<boolean> {
    return this.storage.deleteVariable(sessionId, key);
  }

  // Utility methods
  getStorage(): StateStorage {
    return this.storage;
  }

  async cleanup(maxAge: number = 24 * 60 * 60 * 1000): Promise<number> {
    const cutoff = new Date(Date.now() - maxAge);
    const sessions = await this.storage.listSessions();
    
    let deletedCount = 0;
    for (const session of sessions) {
      if (!session.active && session.updated < cutoff) {
        await this.storage.deleteSession(session.id);
        deletedCount++;
      }
    }

    return deletedCount;
  }
}