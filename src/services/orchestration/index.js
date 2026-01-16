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

/**
 * Process a user message through the appropriate agent
 *
 * @param {string} userMessage - User's request
 * @param {Object} currentFiles - Current file map {filename: content}
 * @param {Function} onUpdate - Callback for streaming updates
 * @param {Object} options - Additional options (modelTier, conversationIntent, etc.)
 * @returns {Promise<Object>} Result with {success, fileOperations, intent}
 */
export async function processMessage(userMessage, currentFiles = {}, onUpdate = null, options = {}) {
  const { modelTier = 'lite', conversationIntent = null, images = null } = options;

  const sendUpdate = (update) => {
    if (onUpdate) {
      onUpdate(update);
    }
  };

  let intent;

  // Use stored intent if conversation already has one, otherwise classify
  if (conversationIntent) {
    intent = conversationIntent;
    console.log(`[Orchestration] Using stored intent: ${intent}`);
  } else {
    const hasExistingFiles = Object.keys(currentFiles).length > 0;
    const intentResult = await classifyIntent(userMessage, hasExistingFiles);
    intent = intentResult.intent;
    console.log(`[Orchestration] New conversation intent: "${userMessage.slice(0, 50)}..." → ${intent} (${intentResult.source})`);
  }

  // Route based on intent
  if (intent === 'assistant') {
    // Assistant Agent → file operations
    const llmModel = 'gpt-5-mini';
    sendUpdate({
      type: 'intent',
      content: ['Agent: Assistant', `LLM: ${llmModel}`]
    });
    console.log(`[Orchestration] Routing to Assistant Agent${images ? ' with images' : ''}`);
    const { fileContext = {} } = options;
    const result = await processWithAssistantAgent(userMessage, fileContext, onUpdate, { images });
    return { ...result, intent };

  } else if (intent === 'chat') {
    // Chat Agent → conversation with web search
    const llmModel = 'gpt-5-mini';
    sendUpdate({
      type: 'intent',
      content: ['Agent: Chat', `LLM: ${llmModel}`]
    });
    console.log(`[Orchestration] Routing to Chat Agent${images ? ' with images' : ''}`);
    const result = await processWithChatAgent(userMessage, onUpdate, options, images);
    return { ...result, intent };

  } else {
    // Code Agent → code generation (create/debug)
    const agentName = intent === 'create' ? 'Code' : 'Debug';
    const llmModel = modelTier === 'pro' ? 'gemini-3-pro' : 'gemini-3-flash';
    sendUpdate({
      type: 'intent',
      content: [`Agent: ${agentName}`, `LLM: ${llmModel}`]
    });
    console.log(`[Orchestration] Routing to Code Agent (${intent}, tier: ${modelTier})${images ? ' with images' : ''}`);
    const result = await processWithCodeAgent(userMessage, currentFiles, onUpdate, { ...options, images });
    return { ...result, intent };
  }
}

export default { processMessage };
