/**
 * Assistant Agent
 * Handles file operations using OpenAI with function calling
 * Lazy-loading architecture: tools fetch from Firebase on-demand
 */

import { ToolRegistry } from '../../../tools/ToolRegistry.js';
import { ToolExecutor } from '../../../tools/ToolExecutor.js';
import { assistantTools } from '../../../tools/assistant/index.js';
import { buildAssistantPrompt } from '../../../prompts/assistant/index.js';
import { fetchWithRetry } from '../../../utils/fetchWithRetry.js';
import { RETRY_CONFIGS, API_ENDPOINTS, AGENT_MODELS, AGENT_LOOP_LIMITS } from '../../../config/apiConfig.js';
import { getAuthHeaders, executeFunction } from '../../../utils/apiUtils.js';
import { formatFilesForOpenAI } from '../../../utils/fileFormatters.js';
import { formatToolAction, formatToolResult } from './formatters.js';

const retryConfig = RETRY_CONFIGS.assistant;
const maxLoops = AGENT_LOOP_LIMITS.assistant;

/**
 * Convert tools to OpenAI format
 */
function convertToolsToOpenAIFormat(tools) {
  return tools.map(tool => tool.toOpenAISchema());
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
  const { images = null } = options;
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

  const sendUpdate = (update) => onUpdate?.(update);

  try {
    // Initialize tool registry
    const toolRegistry = new ToolRegistry();
    const allTools = await assistantTools();
    allTools.forEach(tool => toolRegistry.registerTool(tool));

    const executor = new ToolExecutor(toolRegistry);

    // Wrap writeFile to auto-add agent scope
    const scopedWriteFile = async (path, content) => {
      return writeFile(path, content, { agent: 'assistant' });
    };

    const toolContext = {
      fetchFile,
      writeFile: scopedWriteFile,
      listDirectory,
      createDirectory,
      fileList: files,
      folderList: folders,
      scope: 'assistant'
    };

    const openAITools = convertToolsToOpenAIFormat(allTools);
    const systemPrompt = buildAssistantPrompt({ files, folders });
    const headers = await getAuthHeaders(retryConfig.context);

    let messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    // Add files if provided (images, PDFs, etc.)
    if (images?.length > 0) {
      messages[1] = {
        role: 'user',
        content: formatFilesForOpenAI(userMessage, images)
      };
    }

    sendUpdate({
      type: 'thinking',
      content: `Context: ${files.length} files, ${folders.length} folders`
    });

    let loopCount = 0;

    // Initial API call
    let response = await fetchWithRetry(API_ENDPOINTS.CHAT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: AGENT_MODELS.assistant,
        messages,
        tools: openAITools,
        tool_choice: 'auto'
      })
    }, retryConfig);

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
      if (!toolCalls?.length) {
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
      response = await fetchWithRetry(API_ENDPOINTS.CHAT, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: AGENT_MODELS.assistant,
          messages,
          tools: openAITools,
          tool_choice: 'auto'
        })
      }, retryConfig);

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
      sendUpdate({ type: 'assistant', content: responseText });
    }

    return {
      success: true,
      intent: 'assistant',
      response: responseText
    };

  } catch (error) {
    console.error('[Assistant Agent] File operation failed:', error.message);
    sendUpdate({ type: 'thinking', content: `Error: ${error.message}` });

    return {
      success: false,
      error: error.message
    };
  }
}

export default { processWithAssistantAgent };
