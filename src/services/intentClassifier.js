/**
 * Intent Classifier
 * Uses OpenAI gpt-4o-mini to classify user messages into:
 * - Without existing files: create or chat
 * - With existing files: debug or chat
 */

import { fetchWithRetry } from './utils/fetchWithRetry.js';

// Retry configuration for intent classification (lightweight, fast timeout)
const INTENT_RETRY_CONFIG = {
  timeout: 15000,    // 15s timeout for classification
  maxRetries: 2,
  baseDelay: 500,
  context: 'Intent Classifier'
};

// Classification prompt for NEW app (no existing files)
const NEW_APP_PROMPT = `Classify the user's message into ONE intent:
- "create": User is REQUESTING you to build/create an app, website, or code for them
- "chat": User is ASKING a question, seeking information, or having a conversation

Key distinction:
- "create a todo app" → create (requesting you to build)
- "can you make a calculator?" → create (requesting you to build)
- "does X support Y?" → chat (asking a question)
- "how do I create X?" → chat (asking for information)
- "what is React?" → chat (asking a question)

Respond with ONLY ONE WORD: create or chat`;

// Classification prompt for EDITING existing app
const EDITING_APP_PROMPT = `Classify the user's message into ONE intent:
- "debug": ANY request to change, fix, modify, or improve the existing app (including adding features, fixing bugs, changing design)
- "chat": asking questions, greetings, conversation, help requests

The user is editing an existing app. ANY code change request should be "debug".

Respond with ONLY ONE WORD: debug or chat`;

/**
 * Classify user message intent using AI (gpt-4o-mini)
 * @param {string} message - User's message
 * @param {boolean} hasExistingFiles - Whether there are existing files
 * @returns {Promise<{intent: 'create' | 'chat' | 'debug', confidence: number, source: string}>}
 */
export async function classifyIntent(message, hasExistingFiles = false) {
  // Quick check for very short greetings (save API call)
  const lowerMessage = message.toLowerCase().trim();
  if (/^(hi|hello|hey|thanks|thank you|ok|okay|yes|no|sure)[\s!.]*$/i.test(lowerMessage)) {
    return { intent: 'chat', confidence: 0.95, source: 'quick-check' };
  }

  try {
    // Use different prompts based on context
    const prompt = hasExistingFiles ? EDITING_APP_PROMPT : NEW_APP_PROMPT;

    const response = await fetchWithRetry('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: `${prompt}\n\nUser message: "${message}"` }
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

    // Validate response based on context
    const validIntents = hasExistingFiles ? ['debug', 'chat'] : ['create', 'chat'];

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
