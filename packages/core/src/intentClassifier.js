/**
 * Intent Classifier
 * Uses OpenAI gpt-4o-mini to classify user messages into:
 * - create: User wants to build/create an app, website, or code
 * - assistant: User wants to work with their files/folders
 * - chat: General questions or conversation
 *
 * NOTE: 'debug' intent is NOT returned by this classifier.
 * Debug mode is triggered ONLY via explicit @app mentions (handled in useChat.js).
 */

import { fetchWithRetry } from './utils/fetchWithRetry.js';

// Retry configuration for intent classification (lightweight, fast timeout)
const INTENT_RETRY_CONFIG = {
  timeout: 15000,    // 15s timeout for classification
  maxRetries: 2,
  baseDelay: 500,
  context: 'Intent Classifier'
};

// Classification prompt - used for all messages (debug handled separately via @app)
const CLASSIFICATION_PROMPT = `Classify the user's message into ONE intent:
- "create": User is REQUESTING you to build/create an app, website, or code for them
- "assistant": User wants to work with their FILES or FOLDERS (create, edit, read, list, count, summarize, organize)
- "chat": User is ASKING a general question or having a conversation NOT about their files

Key distinction:
- "create a todo app" → create (requesting you to build code)
- "can you make a calculator?" → create (requesting you to build code)
- "add a dark mode" → create (requesting code changes)
- "fix the button" → create (requesting code changes)
- "create a note about..." → assistant (working with files)
- "write a document about..." → assistant (working with files)
- "what files do I have" → assistant (asking about their files)
- "what folders do I have" → assistant (asking about their folders)
- "list my files" → assistant (listing files)
- "read my todo" → assistant (reading a file)
- "create a folder" → assistant (creating folder)
- "does X support Y?" → chat (general question)
- "how do I create X?" → chat (asking for information)
- "what is React?" → chat (general question)

Respond with ONLY ONE WORD: create, assistant, or chat`;

/**
 * Classify user message intent using AI (gpt-4o-mini)
 * @param {string} message - User's message
 * @param {boolean} _hasExistingFiles - Deprecated, kept for backwards compatibility
 * @returns {Promise<{intent: 'create' | 'assistant' | 'chat', confidence: number, source: string}>}
 */
export async function classifyIntent(message, _hasExistingFiles = false) {
  // Quick check for very short greetings (save API call)
  const lowerMessage = message.toLowerCase().trim();
  if (/^(hi|hello|hey|thanks|thank you|ok|okay|yes|no|sure)[\s!.]*$/i.test(lowerMessage)) {
    return { intent: 'chat', confidence: 0.95, source: 'quick-check' };
  }

  try {
    const response = await fetchWithRetry('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: `${CLASSIFICATION_PROMPT}\n\nUser message: "${message}"` }
        ],
        max_tokens: 10
      })
    }, INTENT_RETRY_CONFIG);

    if (!response.ok) {
      console.warn('[Intent Classifier] API error, defaulting to chat');
      return { intent: 'chat', confidence: 0.5, source: 'default' };
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim().toLowerCase();

    // Valid intents (debug is handled separately via @app mentions)
    const validIntents = ['create', 'assistant', 'chat'];

    if (validIntents.includes(result)) {
      console.log(`[Intent Classifier] AI classified: "${message.slice(0, 50)}..." → ${result}`);
      return { intent: result, confidence: 0.9, source: 'ai' };
    }

    // Unexpected AI response, default to chat (safer)
    console.warn(`[Intent Classifier] Unexpected AI response: "${result}", defaulting to chat`);
    return { intent: 'chat', confidence: 0.5, source: 'default' };

  } catch (error) {
    console.warn('[Intent Classifier] Error, defaulting to chat:', error.message);
    return { intent: 'chat', confidence: 0.5, source: 'default' };
  }
}

export default { classifyIntent };
