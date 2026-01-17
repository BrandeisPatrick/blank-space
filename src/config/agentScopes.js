/**
 * Agent Scope Configuration
 * Defines which file paths each agent can access
 * Enforced server-side in api/files.js
 */

export const AGENT_SCOPES = {
  assistant: {
    root: 'assistant',
    description: 'User files and assistant-managed content',
    canRead: ['assistant'],
    canWrite: ['assistant']
  },
  code: {
    root: 'code',
    description: 'Generated code projects',
    canRead: ['code'],
    canWrite: ['code']
  },
  user: {
    root: null,
    description: 'Direct user uploads and file browsing',
    canRead: ['assistant', 'code'],
    canWrite: ['assistant']
  }
};

/**
 * Get the scope prefix for a path
 * @param {string} path - File path (e.g., 'assistant/notes.md')
 * @returns {string|null} - Scope prefix or null if invalid
 */
export function getPathScope(path) {
  if (!path || typeof path !== 'string') return null;
  const normalized = path.replace(/^\//, '');
  const firstSegment = normalized.split('/')[0];
  return firstSegment || null;
}

/**
 * Check if an agent can perform an operation on a path
 * @param {string} agent - Agent identifier ('assistant', 'code', 'user')
 * @param {string} path - File path
 * @param {string} operation - 'read' or 'write'
 * @returns {{ allowed: boolean, error?: string }}
 */
export function checkAccess(agent, path, operation) {
  const agentConfig = AGENT_SCOPES[agent];
  if (!agentConfig) {
    return { allowed: false, error: `Unknown agent: ${agent}` };
  }

  const pathScope = getPathScope(path);
  if (!pathScope) {
    return { allowed: false, error: 'Invalid path' };
  }

  const allowedPaths = operation === 'write' ? agentConfig.canWrite : agentConfig.canRead;

  if (!allowedPaths.includes(pathScope)) {
    return {
      allowed: false,
      error: `Agent '${agent}' cannot ${operation} in '${pathScope}/'`
    };
  }

  return { allowed: true };
}
