/**
 * App Name Generator
 * Shared utility for generating short app names from user requests
 */

import { callLLM } from '../../utils/llm/llmClient.js';
import { auth } from '../../../config/firebase.js';

const APP_NAME_PROMPT = 'Generate a short app name (1-3 words max) from the user request. Return ONLY the name, no quotes, no explanation. Examples: "Todo List", "Weather App", "Quiz Game", "Calculator"';

/**
 * Extract fallback app name from user message
 * @param {string} userMessage - User's request
 * @returns {string} Extracted name or "New App"
 */
function extractFallbackName(userMessage) {
  const words = userMessage
    .replace(/^(create|build|make|design|generate)\s+(a|an|the)?\s*/i, '')
    .split(/\s+/)
    .slice(0, 3)
    .join(' ');
  return words || 'New App';
}

/**
 * Get auth headers for Gemini API requests
 */
async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  try {
    if (auth?.currentUser) {
      const token = await auth.currentUser.getIdToken(true);
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn('[AppNameGenerator] Failed to get auth token:', error.message);
  }
  return headers;
}

/**
 * Generate app name using OpenAI
 * @param {string} userMessage - User's request
 * @returns {Promise<string>} Generated app name (max 3 words)
 */
export async function generateAppNameOpenAI(userMessage) {
  try {
    const response = await callLLM({
      model: 'gpt-4o-mini',
      systemPrompt: APP_NAME_PROMPT,
      userPrompt: userMessage,
      maxTokens: 20,
      temperature: 0.3
    });

    const name = response.choices[0]?.message?.content?.trim() || 'New App';
    return name.split(/\s+/).slice(0, 3).join(' ');
  } catch (error) {
    console.error('[AppNameGenerator] OpenAI failed:', error);
    return extractFallbackName(userMessage);
  }
}

/**
 * Generate app name using Gemini
 * @param {string} userMessage - User's request
 * @param {string} model - Gemini model to use
 * @returns {Promise<string>} Generated app name (max 3 words)
 */
export async function generateAppNameGemini(userMessage, model) {
  try {
    const prompt = APP_NAME_PROMPT + ' User request: ' + userMessage;
    const headers = await getAuthHeaders();

    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'generate',
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const name = data.text?.trim() || 'New App';
    return name.split(/\s+/).slice(0, 3).join(' ');
  } catch (error) {
    console.error('[AppNameGenerator] Gemini failed:', error);
    return extractFallbackName(userMessage);
  }
}
