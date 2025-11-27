import { openai } from "./openaiClient.js";
import { ToolExecutor } from "../../tools/ToolExecutor.js";

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
 * @param {string} options.systemPrompt - System prompt (for backwards compatibility, use messages instead)
 * @param {string} options.userPrompt - User prompt (for backwards compatibility, use messages instead)
 * @param {Array} [options.messages] - Messages array (preferred over systemPrompt/userPrompt)
 * @param {Array} [options.tools] - Tool definitions for function calling
 * @param {number} [options.maxTokens=1500] - Max tokens to generate
 * @param {number} [options.temperature=0.7] - Temperature (ignored for GPT-5)
 * @param {number} [options.maxRetries=3] - Max retry attempts
 * @param {number} [options.timeout=45000] - Timeout in milliseconds
 * @param {number} [options.baseDelay=1000] - Base delay for exponential backoff
 * @returns {Promise<Object>} OpenAI API response
 * @throws {Error} If all retries fail or non-retryable error occurs
 */
export async function callLLM({
  model,
  systemPrompt,
  userPrompt,
  messages = null,
  tools = null,
  maxTokens = 1500,
  temperature = 0.7,
  maxRetries = 3,
  timeout = 45000,
  baseDelay = 1000
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

  // Build messages array - use provided messages or fallback to systemPrompt/userPrompt
  let finalMessages = [];
  if (messages && Array.isArray(messages) && messages.length > 0) {
    finalMessages = messages;
  } else {
    // Backwards compatibility with systemPrompt/userPrompt
    if (systemPrompt) {
      finalMessages.push({ role: 'system', content: systemPrompt });
    }
    if (userPrompt) {
      finalMessages.push({ role: 'user', content: userPrompt });
    }
  }

  // Retry loop with exponential backoff
  let lastError = null;
  const startTime = Date.now();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), effectiveTimeout);
      });

      // Build API request parameters
      const apiParams = {
        model,
        messages: finalMessages,
        ...tempParam,
        ...tokenParam,
        stream: false  // Explicitly disable streaming
      };

      // Add tools if provided
      if (tools && Array.isArray(tools) && tools.length > 0) {
        apiParams.tools = tools;
        apiParams.tool_choice = 'auto';
      }

      // Create API call promise
      const apiPromise = openai.chat.completions.create(apiParams);

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
  if (!response || !response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
    console.error('Invalid response structure in extractContent:', response);
    return '';
  }
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
 * Extract JSON from response content with multiple fallback strategies
 */
function extractJSONFromContent(content) {
  // Strategy 1: Extract JSON between delimiters <<<JSON>>> and <<</JSON>>>
  const delimiterMatch = content.match(/<<<JSON>>>([\s\S]*?)<<<\/JSON>>>/);
  if (delimiterMatch) {
    return delimiterMatch[1].trim();
  }

  // Strategy 2: Extract from markdown code fences
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Strategy 3: Find JSON-like content (starts with { or [)
  const jsonMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }

  // Fallback: return cleaned content
  return content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
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
 * @param {Object} options - Same as callLLM options
 * @returns {Promise<Object>} Parsed JSON object
 * @throws {Error} If response is not valid JSON
 */
export async function callLLMForJSON(options) {
  const response = await callLLM(options);
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

/**
 * Call LLM with tool calling support
 * Implements the tool calling loop where LLM can request tool execution
 *
 * @param {Object} options - Configuration options
 * @param {string} options.model - Model name (e.g., 'gpt-4o', 'gpt-4-turbo')
 * @param {string} options.systemPrompt - System prompt
 * @param {Array} options.messages - Initial messages array (can include user/assistant messages)
 * @param {Object} options.toolRegistry - ToolRegistry instance with registered tools
 * @param {Object} options.context - Execution context (passed to tools, should include 'fs')
 * @param {number} [options.maxTokens=2000] - Max tokens to generate
 * @param {number} [options.temperature=0.7] - Temperature (ignored for GPT-5)
 * @param {number} [options.maxRetries=3] - Max retry attempts per LLM call
 * @param {number} [options.timeout=60000] - Timeout for LLM calls
 * @param {number} [options.maxToolLoops=10] - Maximum number of tool calling loops
 * @param {number} [options.baseDelay=1000] - Base delay for exponential backoff
 * @param {Function} [options.onToolAction] - Callback for tool action events: (tool, params, status) => void
 * @returns {Promise<Object>} Final LLM response after tool calling loop completes
 * @throws {Error} If tool execution fails or max loops exceeded
 */
export async function callLLMWithTools({
  model,
  systemPrompt,
  messages = [],
  toolRegistry,
  context,
  maxTokens = 2000,
  temperature = 0.7,
  maxRetries = 3,
  timeout = 60000,
  maxToolLoops = 10,
  baseDelay = 1000,
  onToolAction = null
}) {
  // Validate inputs
  if (!toolRegistry) {
    throw new Error('toolRegistry is required for callLLMWithTools');
  }
  if (!context) {
    throw new Error('context is required for callLLMWithTools');
  }

  // Build messages array with system prompt if provided
  const conversationMessages = [];
  if (systemPrompt) {
    conversationMessages.push({ role: 'system', content: systemPrompt });
  }
  conversationMessages.push(...messages);

  // Get tools in OpenAI schema format
  const tools = toolRegistry.toOpenAISchema();
  const executor = new ToolExecutor(toolRegistry);

  let loopCount = 0;

  // Track recent tool calls for doom loop detection
  const recentToolCalls = [];
  const DOOM_LOOP_THRESHOLD = 3;

  // Tool calling loop
  while (loopCount < maxToolLoops) {
    loopCount++;

    try {
      // Call LLM with tools
      const response = await callLLM({
        model,
        messages: conversationMessages,
        tools,
        maxTokens,
        temperature,
        maxRetries,
        timeout,
        baseDelay
      });

      // Check if response has tool calls
      const firstChoice = response.choices[0];
      const toolCalls = firstChoice.message.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        // No tool calls - LLM is done, return final response
        return response;
      }

      // Add assistant message to conversation
      conversationMessages.push({
        role: 'assistant',
        content: firstChoice.message.content || '',
        tool_calls: toolCalls
      });

      // Execute each tool call
      const toolResults = [];
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const toolCallId = toolCall.id;
        const callSignature = `${toolName}:${toolCall.function.arguments}`;

        try {
          // Parse tool parameters
          let params = {};
          try {
            params = JSON.parse(toolCall.function.arguments);
          } catch (parseError) {
            throw new Error(`Failed to parse tool arguments: ${parseError.message}`);
          }

          // Notify about tool execution start
          if (onToolAction) {
            onToolAction(toolName, params, 'start');
          }

          // Execute the tool
          const toolResult = await executor.execute(toolName, params, context);

          // Notify about tool execution complete
          if (onToolAction) {
            onToolAction(toolName, params, toolResult.success ? 'complete' : 'error');
          }

          // Add tool result to messages
          conversationMessages.push({
            role: 'tool',
            tool_call_id: toolCallId,
            content: JSON.stringify(toolResult)
          });

          toolResults.push({
            toolName,
            toolCallId,
            success: toolResult.success
          });

          if (toolResult.success) {
            // AUTO-VALIDATE: If write tool succeeded, auto-validate the file
            if (toolName === 'write' && params.path && params.content) {
              try {
                const validateResult = await executor.execute('validate', {
                  filename: params.path,
                  content: params.content
                }, context);

                if (!validateResult.success) {
                  // Add validation error as tool result so LLM sees it
                  conversationMessages.push({
                    role: 'tool',
                    tool_call_id: `validate_${toolCallId}`,
                    content: JSON.stringify({
                      tool: 'validate',
                      filename: params.path,
                      success: false,
                      errors: validateResult.errors,
                      guidance: validateResult.guidance || 'Fix the validation errors above before proceeding.'
                    })
                  });
                }
              } catch (validateError) {
                // Validation check skipped
              }
            }
          }

          // DOOM LOOP DETECTION: Track recent tool calls
          recentToolCalls.push(callSignature);
          if (recentToolCalls.length > DOOM_LOOP_THRESHOLD) {
            recentToolCalls.shift(); // Keep only last N calls
          }

          // Check if last N calls are identical (doom loop)
          if (recentToolCalls.length === DOOM_LOOP_THRESHOLD) {
            const allSame = recentToolCalls.every(call => call === recentToolCalls[0]);
            if (allSame) {
              // Add feedback to conversation
              conversationMessages.push({
                role: 'user',
                content: `⚠️ ATTENTION: You called the same tool with identical parameters ${DOOM_LOOP_THRESHOLD} times in a row. This indicates a loop. ` +
                  `Try a different approach, use different parameters, or use a different tool. ` +
                  `If the previous tool call failed with validation errors, fix those errors and try again with corrected code.`
              });
            }
          }

        } catch (error) {
          // Add error result to messages
          conversationMessages.push({
            role: 'tool',
            tool_call_id: toolCallId,
            content: JSON.stringify({
              success: false,
              error: error.message
            })
          });

          toolResults.push({
            toolName,
            toolCallId,
            success: false,
            error: error.message
          });
        }
      }

    } catch (error) {
      // LLM call failed
      throw error;
    }
  }

  // Max loops exceeded
  throw new Error(
    `Tool calling loop exceeded maximum iterations (${maxToolLoops}). ` +
    `LLM may be stuck in a tool-calling loop. Consider adjusting prompts or max loop count.`
  );
}

/**
 * Call LLM with tools and extract content
 *
 * @param {Object} options - Same as callLLMWithTools options
 * @returns {Promise<string>} Extracted text content from final response
 */
export async function callLLMWithToolsAndExtract(options) {
  const response = await callLLMWithTools(options);
  return extractContent(response);
}

export default {
  callLLM,
  callLLMWithTools,
  callLLMWithToolsAndExtract,
  extractContent,
  callLLMAndExtract,
  callLLMForJSON
};
