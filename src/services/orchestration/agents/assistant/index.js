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
  const { images = null, conversationHistory = [] } = options;
  const {
    files = [],
    folders = [],
    fetchFile,
    writeFile,
    deleteFile,
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

    // Auto-prefix paths with assistant/ scope so AI uses relative paths
    const scopePath = (path) => {
      if (!path) return 'assistant';
      const normalized = path.replace(/^\//, '');
      if (normalized.startsWith('assistant/') || normalized === 'assistant') return normalized;
      return `assistant/${normalized}`;
    };

    const scopedWriteFile = async (path, content, options = {}) => {
      return writeFile(scopePath(path), content, { agent: 'assistant', ...options });
    };

    const scopedCreateDirectory = async (path) => {
      return createDirectory(scopePath(path));
    };

    const scopedListDirectory = (path) => {
      return listDirectory(scopePath(path));
    };

    const scopedFetchFile = async (path) => {
      return fetchFile(scopePath(path));
    };

    const scopedDeleteFile = async (path) => {
      return deleteFile(scopePath(path));
    };

    const toolContext = {
      fetchFile: scopedFetchFile,
      writeFile: scopedWriteFile,
      deleteFile: scopedDeleteFile,
      listDirectory: scopedListDirectory,
      createDirectory: scopedCreateDirectory,
      fileList: files,
      folderList: folders,
      scope: 'assistant'
    };

    const openAITools = convertToolsToOpenAIFormat(allTools);
    const systemPrompt = buildAssistantPrompt({ files, folders });
    const headers = await getAuthHeaders(retryConfig.context);

    let messages = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history for multi-turn context
    conversationHistory.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    });

    // Add current user message
    if (images?.length > 0) {
      messages.push({
        role: 'user',
        content: formatFilesForOpenAI(userMessage, images)
      });
    } else {
      messages.push({ role: 'user', content: userMessage });
    }

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

    // Emit plan from initial response, before the tool execution loop
    if (assistantMessage?.content) {
      const planSteps = assistantMessage.content
        .split(/(?=\d+\.\s)/)
        .map(s => s.trim())
        .filter(Boolean);
      sendUpdate({
        type: 'thinking',
        content: planSteps.length > 1 ? planSteps : assistantMessage.content
      });
    }

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

        let params;
        try {
          params = JSON.parse(toolCall.function.arguments || '{}');
        } catch (parseError) {
          console.warn(`[Assistant Agent] Failed to parse arguments for ${toolName}:`, parseError.message);
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: `Invalid JSON in tool arguments: ${parseError.message}. Please retry with valid JSON.` })
          });
          continue;
        }

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
