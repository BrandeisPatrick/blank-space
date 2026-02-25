/**
 * Follow-up Suggestion Generator
 * Generates contextual follow-up suggestions after any agent response
 */

import { fetchWithRetry } from '../utils/fetchWithRetry.js';
import { API_ENDPOINTS } from '../config/apiConfig.js';

const SUGGESTION_PROMPT = `Based on the user's message and the AI's response, generate exactly 2 short follow-up questions or actions the user might want to ask next.

Rules:
- Each suggestion must be under 60 characters
- Phrase them from the user's perspective (as if they are asking)
- Make them contextually relevant and useful
- Do NOT repeat what was already asked
- Return ONLY a JSON array of 2 strings, nothing else

Example output:
["How do I customize the colors?", "Can you add a dark mode?"]`;

/**
 * Generate follow-up suggestions based on conversation context
 *
 * @param {string} userMessage - The user's original message
 * @param {string} responseContent - The AI's response content
 * @param {string} intent - The classified intent (chat, create, debug, assistant)
 * @returns {Promise<string[]>} Array of 2 suggestion strings
 */
export async function generateSuggestions(userMessage, responseContent, intent) {
  try {
    const contextMessage = `User asked: "${userMessage.slice(0, 200)}"
AI responded (${intent} intent): "${(responseContent || '').slice(0, 300)}"

Generate 2 follow-up suggestions:`;

    const response = await fetchWithRetry(API_ENDPOINTS.CHAT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SUGGESTION_PROMPT },
          { role: 'user', content: contextMessage }
        ],
        max_tokens: 150,
        temperature: 0.8
      })
    }, { timeout: 10000, maxRetries: 1, baseDelay: 500, context: 'Suggestions' });

    if (!response.ok) return [];

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return [];

    const suggestions = JSON.parse(content);
    if (
      Array.isArray(suggestions) &&
      suggestions.length >= 2 &&
      suggestions.every(s => typeof s === 'string' && s.trim().length > 0)
    ) {
      return suggestions.slice(0, 2).map(s => s.trim());
    }

    return [];
  } catch (error) {
    // Suggestions are non-critical — fail silently
    console.warn('[Suggestions] Failed to generate:', error.message);
    return [];
  }
}
