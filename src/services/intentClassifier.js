/**
 * Intent Classifier
 * Uses OpenAI gpt-4o-mini to classify user messages into:
 * - Without existing files: create or chat
 * - With existing files: debug or chat
 */

// Classification prompt for NEW app (no existing files)
const NEW_APP_PROMPT = `Classify the user's message into ONE intent:
- "create": build an app, make something, generate code, design UI
- "chat": asking questions, greetings, conversation, help requests

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

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: `${prompt}\n\nUser message: "${message}"` }
        ],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      console.warn('[Intent Classifier] API error, using fallback');
      return fallbackClassify(message, hasExistingFiles);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim().toLowerCase();

    // Validate response based on context
    const validIntents = hasExistingFiles ? ['debug', 'chat'] : ['create', 'chat'];

    if (validIntents.includes(result)) {
      console.log(`[Intent Classifier] AI classified: "${message.slice(0, 50)}..." → ${result}`);
      return { intent: result, confidence: 0.9, source: 'ai' };
    }

    // Unexpected response, use fallback
    console.warn(`[Intent Classifier] Unexpected AI response: "${result}", using fallback`);
    return fallbackClassify(message, hasExistingFiles);

  } catch (error) {
    console.warn('[Intent Classifier] Error, using fallback:', error.message);
    return fallbackClassify(message, hasExistingFiles);
  }
}

/**
 * Simple keyword-based fallback classifier
 */
function fallbackClassify(message, hasExistingFiles = false) {
  // Check for chat patterns first
  const chatPatterns = [
    /^(what|how|why|when|where|who|which)\s/i,
    /\?$/,
    /^(can|could|do|does|is|are)\s+(you|it|this)/i,
    /^(tell|explain|help)\s+me/i,
  ];

  for (const pattern of chatPatterns) {
    if (pattern.test(message)) {
      return { intent: 'chat', confidence: 0.7, source: 'fallback' };
    }
  }

  // Default based on context
  if (hasExistingFiles) {
    return { intent: 'debug', confidence: 0.6, source: 'fallback' };
  } else {
    return { intent: 'create', confidence: 0.6, source: 'fallback' };
  }
}

/**
 * @deprecated Use classifyIntent() instead
 */
export function isCreateIntent(message) {
  return fallbackClassify(message, false).intent === 'create';
}

/**
 * @deprecated Use classifyIntent() instead
 */
export function isChatIntent(message) {
  return fallbackClassify(message, false).intent === 'chat';
}

export default { classifyIntent, isCreateIntent, isChatIntent };
