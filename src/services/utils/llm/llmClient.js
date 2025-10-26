import { openai } from "./openaiClient.js";
import { ConversationLogger } from "./conversationLogger.js";

/**
 * Shared LLM Client
 * Provides unified interface for making OpenAI API calls with:
 * - Retry logic with exponential backoff
 * - Timeout handling
 * - Rate limit detection
 * - GPT-5 parameter handling
 * - Consistent error handling
 * - Conversation logging for debugging and testing
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
 * @param {number} [options.timeout=45000] - Timeout in milliseconds
 * @param {number} [options.baseDelay=1000] - Base delay for exponential backoff
 * @param {ConversationLogger} [options.logger=null] - Optional conversation logger
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
  timeout = 45000,
  baseDelay = 1000,
  logger = null
}) {
  // Detect GPT-5 model
  const isGPT5 = model.includes('gpt-5');

  // Warn if temperature is specified for GPT-5 (it doesn't support it)
  if (isGPT5 && temperature !== 0.7) {
    console.warn(`⚠️  WARNING: Temperature parameter (${temperature}) specified for GPT-5 model "${model}"`);
    console.warn(`   GPT-5 models do not support temperature parameter and will use their default.`);
    console.warn(`   Consider adjusting prompts or model selection if deterministic output is required.`);
  }

  // Increase timeout for GPT-5 models (they may be slower for complex tasks)
  const effectiveTimeout = isGPT5 && timeout === 45000 ? 120000 : timeout;

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

  // Log request to conversation logger
  if (logger) {
    logger.logRequest({ model, systemPrompt, userPrompt, maxTokens, temperature });
  }

  // Retry loop with exponential backoff
  let lastError = null;
  const startTime = Date.now();

  // Log request details
  console.log(`\n🔄 LLM Request: ${model} (timeout: ${effectiveTimeout}ms, max_tokens: ${maxTokens})`);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), effectiveTimeout);
      });

      // Create API call promise
      const apiPromise = openai.chat.completions.create({
        model,
        messages,
        ...tempParam,
        ...tokenParam,
        stream: false  // Explicitly disable streaming
      });

      // Race between API call and timeout
      const response = await Promise.race([apiPromise, timeoutPromise]);

      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new Error(`Invalid response from ${model}: response is not an object`);
      }

      if (!response.choices || !Array.isArray(response.choices)) {
        throw new Error(`Invalid response from ${model}: missing or invalid 'choices' array`);
      }

      if (response.choices.length === 0) {
        throw new Error(`Invalid response from ${model}: 'choices' array is empty`);
      }

      if (!response.choices[0]?.message) {
        throw new Error(`Invalid response from ${model}: missing message in first choice`);
      }

      // Log response details
      const duration = Date.now() - startTime;
      const content = response.choices[0].message.content || '';
      const finishReason = response.choices[0].finish_reason || 'unknown';

      console.log(`✅ LLM Response: ${model} completed in ${duration}ms`);
      console.log(`   Finish reason: ${finishReason}`);
      console.log(`   Content length: ${content.length} characters`);
      console.log(`   Tokens used: ${response.usage?.total_tokens || 'N/A'}`);

      if (content.length === 0) {
        console.warn(`⚠️  WARNING: Empty response received from ${model}`);
        console.warn(`   Finish reason: ${finishReason}`);
        console.warn(`   This may indicate the model hit token limits or content filtering.`);
        if (isGPT5) {
          const reasoningTokens = response.usage?.completion_tokens_details?.reasoning_tokens || 0;
          if (reasoningTokens > 0) {
            console.warn(`   Reasoning tokens used: ${reasoningTokens}`);
            console.warn(`   Consider increasing maxTokens if the limit was exhausted.`);
          }
        }
      }

      // Log response to conversation logger
      if (logger) {
        logger.logResponse({ response });
      }

      // Success - return response
      return response;

    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryableError(error)) {
        // Log error to conversation logger
        if (logger) {
          logger.logResponse({ error });
        }
        // Non-retryable error - throw immediately
        throw new Error(getUserFriendlyError(error));
      }

      // Last attempt - throw error
      if (attempt === maxRetries - 1) {
        // Log error to conversation logger
        if (logger) {
          logger.logResponse({ error });
        }
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
  if (!response || !response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
    console.error('Invalid response structure in extractContent:', response);
    return '';
  }
  return response.choices[0]?.message?.content || '';
}

/**
 * Call LLM and extract content in one step
 *
 * @param {Object} options - Same as callLLM options (including optional logger)
 * @returns {Promise<string>} Extracted text content
 */
export async function callLLMAndExtract(options) {
  const response = await callLLM(options); // Pass through all options including logger
  const content = extractContent(response);

  // Check for empty response
  if (!content || content.trim().length === 0) {
    const reasoningTokens = response.usage?.completion_tokens_details?.reasoning_tokens || 0;
    throw new Error(
      `Empty response from ${options.model}. ` +
      `Reasoning tokens used: ${reasoningTokens}. ` +
      `This may indicate the token limit was exhausted by internal reasoning. Try increasing maxTokens.`
    );
  }

  return content;
}

/**
 * Strip comments from JSON string
 * LLMs sometimes return JSON with comments which breaks JSON.parse()
 */
function stripJSONComments(jsonString) {
  let result = jsonString;

  // Remove single-line comments: // comment
  // But preserve // inside strings
  result = result.replace(/("(?:[^"\\]|\\.)*")|\/\/[^\n]*/g, (match, stringMatch) => {
    return stringMatch || ''; // Keep strings, remove comments
  });

  // Remove multi-line comments: /* comment */
  // But preserve /* inside strings
  result = result.replace(/("(?:[^"\\]|\\.)*")|\/\*[\s\S]*?\*\//g, (match, stringMatch) => {
    return stringMatch || ''; // Keep strings, remove comments
  });

  // Remove trailing commas before } or ] (another common LLM mistake)
  result = result.replace(/,(\s*[}\]])/g, '$1');

  return result;
}

/**
 * Extract JSON from response content with multiple fallback strategies
 */
function extractJSONFromContent(content) {
  // Strategy 1: Extract JSON between delimiters <<<JSON>>> and <<</JSON>>>
  const delimiterMatch = content.match(/<<<JSON>>>([\s\S]*?)<<<\/JSON>>>/);
  if (delimiterMatch) {
    return stripJSONComments(delimiterMatch[1].trim());
  }

  // Strategy 2: Extract from markdown code fences
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return stripJSONComments(codeBlockMatch[1].trim());
  }

  // Strategy 3: Find JSON-like content (starts with { or [)
  const jsonMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return stripJSONComments(jsonMatch[1].trim());
  }

  // Fallback: return cleaned content
  const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return stripJSONComments(cleaned);
}

/**
 * Attempt to auto-complete truncated JSON and handle trailing content
 */
function attemptJSONCompletion(jsonString) {
  try {
    // Try parsing as-is first
    return JSON.parse(jsonString);
  } catch (error) {
    // Strategy 1: Try to extract just the JSON object/array if there's trailing content
    // Find the position where the first complete JSON object ends
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let startChar = jsonString.trim()[0];

    if (startChar === '{' || startChar === '[') {
      const closingChar = startChar === '{' ? '}' : ']';

      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === '\\') {
          escapeNext = true;
          continue;
        }

        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === startChar) depth++;
          if (char === closingChar) depth--;

          if (depth === 0 && i > 0) {
            // Found the end of the JSON - try parsing just this part
            const cleanJson = jsonString.substring(0, i + 1);
            try {
              return JSON.parse(cleanJson);
            } catch (e) {
              // Continue to next strategy
            }
            break;
          }
        }
      }
    }

    // Strategy 2: Try auto-completing if truncated
    let openBraces = (jsonString.match(/\{/g) || []).length;
    let closeBraces = (jsonString.match(/\}/g) || []).length;
    let openBrackets = (jsonString.match(/\[/g) || []).length;
    let closeBrackets = (jsonString.match(/\]/g) || []).length;

    // Try adding missing closing characters
    let completed = jsonString;

    // Add missing closing brackets first (arrays)
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      completed += ']';
    }

    // Add missing closing braces (objects)
    for (let i = 0; i < openBraces - closeBraces; i++) {
      completed += '}';
    }

    // Try parsing completed version
    try {
      return JSON.parse(completed);
    } catch (completionError) {
      // If auto-completion failed, throw original error with context
      throw new Error(`JSON parsing failed. Missing ${openBraces - closeBraces} closing braces, ${openBrackets - closeBrackets} closing brackets. Original error: ${error.message}`);
    }
  }
}

/**
 * Call LLM and parse JSON response
 *
 * @param {Object} options - Same as callLLM options (including optional logger)
 * @returns {Promise<Object>} Parsed JSON object
 * @throws {Error} If response is not valid JSON
 */
export async function callLLMForJSON(options) {
  const response = await callLLM(options); // Pass through all options including logger
  let content = extractContent(response);

  // Extract JSON using multiple strategies
  const jsonContent = extractJSONFromContent(content);

  // Attempt to parse with auto-completion for truncated JSON
  try {
    return attemptJSONCompletion(jsonContent);
  } catch (error) {
    // Provide detailed error message
    const preview = jsonContent.substring(0, 300);
    const suffix = jsonContent.length > 300 ? '...' : '';
    throw new Error(`Failed to parse JSON response: ${error.message}\nContent preview: ${preview}${suffix}`);
  }
}

export default {
  callLLM,
  extractContent,
  callLLMAndExtract,
  callLLMForJSON
};
