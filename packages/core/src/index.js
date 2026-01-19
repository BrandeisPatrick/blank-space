/**
 * @blankspace/core
 *
 * Portable backend business logic for AI code generation.
 * Can be deployed on any JavaScript runtime (Node.js, AWS Lambda, Cloudflare Workers, etc.)
 *
 * This package contains:
 * - Orchestration: Multi-agent routing (Code, Chat, Assistant)
 * - Tools: File operations, code validation, search
 * - Prompts: LLM prompt templates and builders
 * - Utils: HTTP clients, retry logic, formatters
 */

// Orchestration - Agent routing and coordination
export { processMessage } from './orchestration/index.js';
export { processWithCodeAgent } from './orchestration/agents/code/index.js';
export { processWithChatAgent } from './orchestration/agents/chat/index.js';
export { processWithAssistantAgent } from './orchestration/agents/assistant/index.js';

// Intent Classification
export { classifyIntent } from './intentClassifier.js';

// Tools
export { ToolRegistry } from './tools/ToolRegistry.js';
export { ToolExecutor } from './tools/ToolExecutor.js';
export { Tool } from './tools/Tool.js';
export { coreTools } from './tools/core/index.js';
export { assistantTools } from './tools/assistant/index.js';

// File System
export { VirtualFileSystem } from './filesystem/VirtualFS.js';

// Session Management
export { SessionManager } from './session/SessionManager.js';

// Configuration
export { RETRY_CONFIGS, API_ENDPOINTS, AGENT_MODELS, AGENT_LOOP_LIMITS } from './config/apiConfig.js';
export { getModel, getModelForTier, MODELS, MODEL_TIERS } from './config/modelConfig.js';

// Utilities
export { fetchWithRetry, fetchJSONWithRetry } from './utils/fetchWithRetry.js';
export { getAuthHeaders, executeFunction, handleAPIError, createQuotaError } from './utils/apiUtils.js';
export { formatFilesForGemini, formatFilesForOpenAI, analyzeFileTypes, getFileActionText } from './utils/fileFormatters.js';

// Prompts
export { buildSystemPrompt, generateAppNameGemini, formatToolAction } from './prompts/index.js';
export { buildAssistantPrompt } from './prompts/assistant/index.js';
export { CHAT_SYSTEM_PROMPT } from './prompts/chat/index.js';
