/**
 * Assistant Agent
 * Handles file operations using OpenAI gpt-5-mini with function calling
 * Lazy-loading architecture: tools fetch from Firebase on-demand
 */

import { ToolRegistry } from '../../../tools/ToolRegistry.js';
import { ToolExecutor } from '../../../tools/ToolExecutor.js';
import { assistantTools } from '../../../tools/assistant/index.js';
import { buildAssistantPrompt } from '../../../prompts/assistant/index.js';
import { auth } from '../../../../config/firebase.js';
import { fetchWithRetry } from '../../../utils/fetchWithRetry.js';
import { formatToolAction, formatToolResult } from './formatters.js';

// Retry configuration for OpenAI API calls
const OPENAI_RETRY_CONFIG = {
  timeout: 60000,
  maxRetries: 3,
  baseDelay: 1000,
  context: 'Assistant Agent'
};

/**
 * Get auth headers for API requests
 */
async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  try {
    if (auth?.currentUser) {
      const token = await auth.currentUser.getIdToken(true);
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn('[Assistant Agent] Failed to get auth token:', error.message);
  }
  return headers;
}

/**
 * Convert tools to OpenAI format
 */
function convertToolsToOpenAIFormat(tools) {
  return tools.map(tool => tool.toOpenAISchema());
}

/**
 * Execute a function call
 */
async function executeFunction(name, args, executor, context) {
  try {
    const result = await executor.execute(name, args, context);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Process a user message using the Assistant Agent
 *
 * @param {string} userMessage - User's request for file operations
 * @param {Object} fileContext - File system context with metadata and operations
 * @param {Function} onUpdate - Callback for streaming updates
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result with {success, response}
 */
export async function processWithAssistantAgent(userMessage, fileContext = {}, onUpdate = null, options = {}) {
  const {
    images = null
  } = options;

  const {
    files = [],
    folders = [],
    fetchFile,
    writeFile,
    listDirectory,
    createDirectory
  } = fileContext;

  console.log('[Assistant Agent] Starting file operation');
  console.log('[Assistant Agent] Files available:', files.length);
  console.log('[Assistant Agent] Folders available:', folders.length);

  const sendUpdate = (update) => {
    if (onUpdate) {
      onUpdate(update);
    }
  };

  try {
    // Initialize tool registry
    const toolRegistry = new ToolRegistry();
    const allTools = await assistantTools();

    allTools.forEach(tool => {
      toolRegistry.registerTool(tool);
    });

    const executor = new ToolExecutor(toolRegistry);

    // Context passed to tools
    const toolContext = {
      fetchFile,
      writeFile,
      listDirectory,
      createDirectory,
      fileList: files,
      folderList: folders
    };

    const openAITools = convertToolsToOpenAIFormat(allTools);
    const systemPrompt = buildAssistantPrompt({ files, folders });
    const headers = await getAuthHeaders();

    let messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    // Add files if provided (images, PDFs, etc.)
    if (images && images.length > 0) {
      const content = [
        { type: 'text', text: userMessage }
      ];
      images.forEach(file => {
        if (file.mimeType.startsWith('image/')) {
          content.push({
            type: 'image_url',
            image_url: {
              url: `data:${file.mimeType};base64,${file.base64}`
            }
          });
        } else {
          content.push({
            type: 'file',
            file: {
              filename: file.filename || file.path || 'document',
              file_data: `data:${file.mimeType};base64,${file.base64}`
            }
          });
        }
      });
      messages[1] = { role: 'user', content };
    }

    sendUpdate({
      type: 'thinking',
      content: `Context: ${files.length} files, ${folders.length} folders`
    });

    const maxLoops = 20;
    let loopCount = 0;

    // Initial API call
    let response = await fetchWithRetry('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages,
        tools: openAITools,
        tool_choice: 'auto'
      })
    }, OPENAI_RETRY_CONFIG);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    let result = await response.json();
    let assistantMessage = result.choices?.[0]?.message;

    // Loop until agent responds with text (no tool calls)
    while (loopCount < maxLoops) {
      loopCount++;

      const toolCalls = assistantMessage?.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        console.log(`[Assistant Agent] Completed after ${loopCount} loop(s)`);
        break;
      }

      messages.push(assistantMessage);
      console.log(`[Assistant Agent] Loop ${loopCount}: ${toolCalls.length} tool call(s)`);

      // Execute all tool calls
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const params = JSON.parse(toolCall.function.arguments || '{}');

        const toolResult = await executeFunction(toolName, params, executor, toolContext);
        const resultSummary = formatToolResult(toolName, toolResult);

        sendUpdate({
          type: 'tool_action',
          action: `${formatToolAction(toolName, params)} → ${resultSummary}`,
          tool: toolName,
          params,
          result: toolResult
        });

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult)
        });
      }

      // Continue conversation
      response = await fetchWithRetry('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'gpt-5-mini',
          messages,
          tools: openAITools,
          tool_choice: 'auto'
        })
      }, OPENAI_RETRY_CONFIG);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      result = await response.json();
      assistantMessage = result.choices?.[0]?.message;
    }

    if (loopCount >= maxLoops) {
      console.warn('[Assistant Agent] Max loops reached');
    }

    const responseText = assistantMessage?.content || '';

    if (responseText) {
      sendUpdate({
        type: 'assistant',
        content: responseText
      });
    }

    return {
      success: true,
      intent: 'assistant',
      response: responseText
    };

  } catch (error) {
    console.error('[Assistant Agent] File operation failed:', error.message);

    sendUpdate({
      type: 'thinking',
      content: `Error: ${error.message}`
    });

    return {
      success: false,
      error: error.message
    };
  }
}

export default { processWithAssistantAgent };
