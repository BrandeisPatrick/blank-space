/**
 * Response Normalizer
 * Normalizes responses from different LLM providers to a common format
 */

/**
 * Generate a unique ID for responses
 */
function generateId() {
  return 'resp_' + crypto.randomUUID().replace(/-/g, '').slice(0, 24);
}

/**
 * Normalize OpenAI response to internal format
 * @param {Object} response - OpenAI API response
 * @returns {Object} Normalized response
 */
export function normalizeOpenAIResponse(response) {
  const choice = response.choices?.[0];

  return {
    id: response.id || generateId(),
    provider: 'openai',
    content: choice?.message?.content || '',
    finishReason: choice?.finish_reason || 'stop',
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
    raw: response,
  };
}

/**
 * Normalize Gemini response to internal format
 * @param {Object} response - Gemini API response
 * @returns {Object} Normalized response
 */
export function normalizeGeminiResponse(response) {
  // Extract text content from Gemini response
  let content = '';

  if (response.text) {
    content = response.text;
  } else if (response.candidates?.[0]?.content?.parts) {
    content = response.candidates[0].content.parts
      .filter(part => part.text)
      .map(part => part.text)
      .join('');
  }

  // Extract usage info
  const usageMetadata = response.usageMetadata || {};

  return {
    id: generateId(),
    provider: 'gemini',
    content: content,
    finishReason: response.candidates?.[0]?.finishReason || 'STOP',
    usage: {
      promptTokens: usageMetadata.promptTokenCount || 0,
      completionTokens: usageMetadata.candidatesTokenCount || 0,
      totalTokens: usageMetadata.totalTokenCount || 0,
    },
    raw: response,
  };
}

/**
 * Normalize response from any provider
 * @param {Object} response - Provider response
 * @param {string} provider - Provider name ('openai' or 'gemini')
 * @returns {Object} Normalized response
 */
export function normalizeResponse(response, provider) {
  switch (provider) {
    case 'gemini':
      return normalizeGeminiResponse(response);
    case 'openai':
    default:
      return normalizeOpenAIResponse(response);
  }
}

/**
 * Convert normalized response back to OpenAI format
 * For compatibility with existing code that expects OpenAI format
 * @param {Object} normalized - Normalized response
 * @returns {Object} OpenAI-compatible response
 */
export function toOpenAIFormat(normalized) {
  return {
    id: normalized.id,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: normalized.provider === 'gemini' ? 'gemini-3-flash-preview' : 'unknown',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: normalized.content,
      },
      finish_reason: normalized.finishReason === 'STOP' ? 'stop' : normalized.finishReason,
    }],
    usage: {
      prompt_tokens: normalized.usage.promptTokens,
      completion_tokens: normalized.usage.completionTokens,
      total_tokens: normalized.usage.totalTokens,
    },
  };
}

export default {
  normalizeResponse,
  normalizeOpenAIResponse,
  normalizeGeminiResponse,
  toOpenAIFormat,
};
