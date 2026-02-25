/**
 * Orchestration Router
 * Routes requests based on intent:
 * - assistant → Assistant Agent (file operations)
 * - chat → Chat Agent (conversation with web search)
 * - create/debug → Code Agent (code generation via Gemini)
 */

import { processWithCodeAgent } from './agents/code/index.js';
import { processWithAssistantAgent } from './agents/assistant/index.js';
import { processWithChatAgent } from './agents/chat/index.js';
import { classifyIntent } from '../intentClassifier.js';
import { AGENT_MODELS } from '../config/apiConfig.js';
import { getModelForTier } from '../config/modelConfig.js';
import { generateSuggestions } from './suggestions.js';

/**
 * Process a user message through the appropriate agent
 *
 * @param {string} userMessage - User's request
 * @param {Object} currentFiles - Current file map {filename: content}
 * @param {Function} onUpdate - Callback for streaming updates
 * @param {Object} options - Additional options (modelTier, conversationHistory, etc.)
 * @returns {Promise<Object>} Result with {success, fileOperations, intent}
 */
export async function processMessage(userMessage, currentFiles = {}, onUpdate = null, options = {}) {
  const { modelTier = 'lite', isDebugMode = false, images = null, conversationHistory = [] } = options;

  const sendUpdate = (update) => onUpdate?.(update);

  let intent;

  if (isDebugMode) {
    intent = 'debug';
    console.log(`[Orchestration] Using debug mode intent`);
  } else {
    const hasExistingFiles = Object.keys(currentFiles).length > 0;
    const intentResult = await classifyIntent(userMessage, hasExistingFiles, conversationHistory);
    intent = intentResult.intent;
    console.log(`[Orchestration] Classified intent: "${userMessage.slice(0, 50)}..." → ${intent} (${intentResult.source})`);
  }

  // Route based on intent
  let result;

  if (intent === 'assistant') {
    sendUpdate({
      type: 'intent',
      content: ['Agent: Assistant', `LLM: ${AGENT_MODELS.assistant}`]
    });
    console.log(`[Orchestration] Routing to Assistant Agent${images ? ' with images' : ''}`);
    const { fileContext = {} } = options;
    result = await processWithAssistantAgent(userMessage, fileContext, onUpdate, { images, conversationHistory });

  } else if (intent === 'chat') {
    sendUpdate({
      type: 'intent',
      content: ['Agent: Chat', `LLM: ${AGENT_MODELS.chat}`]
    });
    console.log(`[Orchestration] Routing to Chat Agent${images ? ' with images' : ''}`);
    result = await processWithChatAgent(userMessage, onUpdate, options, images);

  } else {
    // Code Agent → code generation (create/debug)
    const agentName = intent === 'create' ? 'Code' : 'Debug';
    const llmModel = getModelForTier(modelTier);
    sendUpdate({
      type: 'intent',
      content: [`Agent: ${agentName}`, `LLM: ${llmModel}`]
    });
    console.log(`[Orchestration] Routing to Code Agent (${intent}, tier: ${modelTier})${images ? ' with images' : ''}`);
    result = await processWithCodeAgent(userMessage, currentFiles, onUpdate, { ...options, images });
  }

  // Generate follow-up suggestions (non-blocking on failure)
  // Code agent has no .response field — fall back to plan summary or file list
  const responseContent = result.response
    || (result.plan?.summary ? `Built: ${result.plan.summary}` : '')
    || result.fileOperations?.map(f => f.filename).join(', ')
    || '';
  const suggestions = await generateSuggestions(userMessage, responseContent, intent);

  return { ...result, intent, suggestions };
}

export default { processMessage };
