import { openai } from "./openaiClient.js";

/**
 * Shared LLM Client
 * Provides unified interface for making OpenAI API calls with:
 * - Retry logic with exponential backoff
 * - Timeout handling
 * - Rate limit detection
 * - GPT-5 parameter handling
 * - Consistent error handling
 */

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 */
function isRetryableError(error) {
  // Retry on rate limits and temporary server errors
  return (
    error.status === 429 || // Rate limit
    error.status === 500 || // Server error
    error.status === 502 || // Bad gateway
    error.status === 503 || // Service unavailable
    error.status === 504 || // Gateway timeout
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT' ||
    error.message?.includes('timeout')
  );
}

/**
 * Check if error is rate limit
 */
function isRateLimitError(error) {
  return error.status === 429 || error.message?.toLowerCase().includes('rate limit');
}

/**
 * Get user-friendly error message
 */
function getUserFriendlyError(error) {
  if (isRateLimitError(error)) {
    return 'API rate limit reached. Please wait a moment and try again.';
  }
  if (error.status === 401) {
    return 'Authentication error. Please check your API key.';
  }
  if (error.status === 500 || error.status === 503) {
    return 'OpenAI service temporarily unavailable. Please try again.';
  }
  if (error.message?.includes('timeout')) {
    return 'Request timed out. Please try again or simplify your request.';
  }
  return `API error: ${error.message || 'Unknown error'}`;
}

/**
 * Call OpenAI API with retry logic and timeout
 *
 * @param {Object} options - Configuration options
 * @param {string} options.model - Model name (e.g., 'gpt-4o-mini', 'gpt-5-mini')
 * @param {string} options.systemPrompt - System prompt
 * @param {string} options.userPrompt - User prompt
 * @param {number} [options.maxTokens=1500] - Max tokens to generate
 * @param {number} [options.temperature=0.7] - Temperature (ignored for GPT-5)
 * @param {number} [options.maxRetries=3] - Max retry attempts
 * @param {number} [options.timeout=60000] - Timeout in milliseconds
 * @param {number} [options.baseDelay=1000] - Base delay for exponential backoff
 * @returns {Promise<Object>} OpenAI API response
 * @throws {Error} If all retries fail or non-retryable error occurs
 */
export async function callLLM({
  model,
  systemPrompt,
  userPrompt,
  maxTokens = 1500,
  temperature = 0.7,
  maxRetries = 3,
  timeout = 60000,
  baseDelay = 1000
}) {
  // Detect GPT-5 model
  const isGPT5 = model.includes('gpt-5');

  // Build parameters based on model type
  const tokenParam = isGPT5
    ? { max_completion_tokens: maxTokens }
    : { max_tokens: maxTokens };
  const tempParam = isGPT5 ? {} : { temperature };

  // Build messages array
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  // Retry loop with exponential backoff
  let lastError = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });

      // Create API call promise
      const apiPromise = openai.chat.completions.create({
        model,
        messages,
        ...tempParam,
        ...tokenParam
      });

      // Race between API call and timeout
      const response = await Promise.race([apiPromise, timeoutPromise]);

      // Success - return response
      return response;

    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryableError(error)) {
        // Non-retryable error - throw immediately
        throw new Error(getUserFriendlyError(error));
      }

      // Last attempt - throw error
      if (attempt === maxRetries - 1) {
        throw new Error(getUserFriendlyError(error));
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);

      // Log retry attempt
      console.warn(
        `LLM call failed (attempt ${attempt + 1}/${maxRetries}): ${error.message}. ` +
        `Retrying in ${delay}ms...`
      );

      // Wait before retry
      await sleep(delay);
    }
  }

  // Should never reach here, but just in case
  throw new Error(getUserFriendlyError(lastError));
}

/**
 * Extract text content from LLM response
 *
 * @param {Object} response - OpenAI API response
 * @returns {string} Extracted text content
 */
export function extractContent(response) {
  return response.choices[0]?.message?.content || '';
}

/**
 * Call LLM and extract content in one step
 *
 * @param {Object} options - Same as callLLM options
 * @returns {Promise<string>} Extracted text content
 */
export async function callLLMAndExtract(options) {
  const response = await callLLM(options);
  return extractContent(response);
}

/**
 * Call LLM and parse JSON response
 *
 * @param {Object} options - Same as callLLM options
 * @returns {Promise<Object>} Parsed JSON object
 * @throws {Error} If response is not valid JSON
 */
export async function callLLMForJSON(options) {
  const response = await callLLM(options);
  let content = extractContent(response);

  // Clean markdown code fences if present
  content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error.message}\nContent: ${content.substring(0, 200)}...`);
  }
}

export default {
  callLLM,
  extractContent,
  callLLMAndExtract,
  callLLMForJSON
};
