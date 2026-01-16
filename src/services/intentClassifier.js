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
- "assistant": User wants to work with their FILES or FOLDERS (create, edit, read, list, count, summarize, organize)
- "chat": User is ASKING a general question or having a conversation NOT about their files

Key distinction:
- "create a todo app" → create (requesting you to build code)
- "can you make a calculator?" → create (requesting you to build code)
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

// Classification prompt for EDITING existing app
const EDITING_APP_PROMPT = `Classify the user's message into ONE intent:
- "debug": ANY request to change, fix, modify, or improve the existing app (including adding features, fixing bugs, changing design)
- "assistant": User wants to work with their FILES or FOLDERS (create, edit, read, list, count, summarize, organize)
- "chat": asking general questions, greetings, conversation NOT about their files

The user is editing an existing app. ANY code change request should be "debug".
File/folder operations (what files, list folders, read file, create note) should be "assistant".

Respond with ONLY ONE WORD: debug, assistant, or chat`;

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
    const validIntents = hasExistingFiles ? ['debug', 'assistant', 'chat'] : ['create', 'assistant', 'chat'];

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
