/**
 * Orchestration Router
 * Routes requests to the appropriate LLM provider (OpenAI or Gemini)
 */

import { processWithOpenAI } from './providers/openai/index.js';
import { processWithGemini } from './providers/gemini/index.js';
import { getModelForTier, isGeminiModel } from '../config/modelConfig.js';

/**
 * Process a user message through the appropriate LLM provider
 *
 * @param {string} userMessage - User's request
 * @param {Object} currentFiles - Current file map {filename: content}
 * @param {Function} onUpdate - Callback for streaming updates
 * @param {Object} options - Additional options (modelTier, etc.)
 * @returns {Promise<Object>} Result with {success, fileOperations, plan}
 */
export async function processMessage(userMessage, currentFiles = {}, onUpdate = null, options = {}) {
  const { modelTier = 'lite' } = options;
  const model = getModelForTier(modelTier);

  console.log(`[Orchestration] Routing to provider for model: ${model} (tier: ${modelTier})`);

  // Route based on model type
  if (isGeminiModel(model)) {
    console.log(`[Orchestration] Using Gemini provider`);
    return processWithGemini(userMessage, currentFiles, onUpdate, options);
  } else {
    console.log(`[Orchestration] Using OpenAI provider`);
    return processWithOpenAI(userMessage, currentFiles, onUpdate, options);
  }
}

export default { processMessage };
