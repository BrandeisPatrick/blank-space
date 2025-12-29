/**
 * Prompts Module
 * Centralized prompt management organized by intent
 */

// Chat intent
import { buildChatPrompt, CHAT_SYSTEM_PROMPT } from './chat/index.js';

// Generate intent
import { buildGeneratePrompt, isEditingExistingApp } from './generate/index.js';

// Debug intent
import { buildDebugPrompt, isInteractionIssue } from './debug/index.js';

// Utilities
import { generateAppNameOpenAI, generateAppNameGemini } from './utils/appNameGenerator.js';
import { formatToolAction } from './utils/toolFormatter.js';
import { replaceColorTokens } from './utils/tokenReplacer.js';

// Re-export all
export {
  // Chat
  buildChatPrompt,
  CHAT_SYSTEM_PROMPT,
  // Generate
  buildGeneratePrompt,
  isEditingExistingApp,
  // Debug
  buildDebugPrompt,
  isInteractionIssue,
  // Utilities
  generateAppNameOpenAI,
  generateAppNameGemini,
  formatToolAction,
  replaceColorTokens
};

/**
 * Build system prompt based on intent
 * Main entry point
 *
 * @param {Object} options - Options including currentFiles and style preferences
 * @returns {string} Complete system prompt
 */
export function buildSystemPrompt(options = {}) {
  const {
    isDebugMode = false,
    debugContext = null,
    debugErrors = [],
    currentFiles = {}
  } = options;

  // Debug intent
  if (isDebugMode) {
    const context = debugContext || { errors: debugErrors, userDescription: '' };
    if (context.errors?.length > 0 || context.userDescription) {
      return buildDebugPrompt(context, currentFiles);
    }
  }

  // Generate intent (default)
  return buildGeneratePrompt(options);
}
