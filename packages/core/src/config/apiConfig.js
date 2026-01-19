/**
 * Centralized API Configuration
 * Retry configs, endpoints, and agent-specific settings
 */

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  GEMINI: '/api/gemini',
  CHAT: '/api/chat'
};

/**
 * Retry configurations for each agent type
 */
export const RETRY_CONFIGS = {
  code: {
    timeout: 60000,
    maxRetries: 3,
    baseDelay: 1000,
    context: 'Code Agent'
  },
  assistant: {
    timeout: 60000,
    maxRetries: 3,
    baseDelay: 1000,
    context: 'Assistant Agent'
  },
  chat: {
    timeout: 45000,
    maxRetries: 3,
    baseDelay: 1000,
    context: 'Chat Agent'
  }
};

/**
 * Agent model configuration
 * Maps agent types to their LLM models
 */
export const AGENT_MODELS = {
  chat: 'gpt-5-mini',
  assistant: 'gpt-5-mini'
};

/**
 * Max loop limits for agentic execution
 */
export const AGENT_LOOP_LIMITS = {
  code: {
    planning: 10,
    execution: 15
  },
  assistant: 20,
  chat: 1 // Single call, no loops
};

export default {
  API_ENDPOINTS,
  RETRY_CONFIGS,
  AGENT_MODELS,
  AGENT_LOOP_LIMITS
};
