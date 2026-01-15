/**
 * Assistant Provider
 * Handles document operations using OpenAI gpt-5-mini with function calling
 * Single-phase workflow: agent has all tools and decides when to use them
 */

import { VirtualFileSystem } from '../../../filesystem/VirtualFS.js';
import { ToolRegistry } from '../../../tools/ToolRegistry.js';
import { ToolExecutor } from '../../../tools/ToolExecutor.js';
import { assistantTools } from '../../../tools/assistant/index.js';
import { buildAssistantPrompt } from '../../../prompts/assistant/index.js';
import { auth } from '../../../../config/firebase.js';
import { fetchWithRetry } from '../../../utils/fetchWithRetry.js';

// Retry configuration for OpenAI API calls
const OPENAI_RETRY_CONFIG = {
  timeout: 60000,    // 60s timeout
  maxRetries: 3,
  baseDelay: 1000,
  context: 'Assistant Provider'
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
    console.warn('[Assistant Provider] Failed to get auth token:', error.message);
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
 * Format tool action for display with details
 */
function formatToolAction(toolName, params) {
  switch (toolName) {
    case 'doc_read':
      return `doc_read("${params.path}")`;
    case 'doc_write':
      return `doc_write("${params.path}", ${params.content?.length || 0} chars)`;
    case 'doc_edit':
      return `doc_edit("${params.path}")`;
    case 'doc_list':
      return params.pattern ? `doc_list("${params.pattern}")` : 'doc_list()';
    default:
      return `${toolName}(${JSON.stringify(params)})`;
  }
}

/**
 * Process a user message using the Assistant Agent
 *
 * @param {string} userMessage - User's request for document operations
 * @param {Object} currentFiles - Current file map {filename: content}
 * @param {Function} onUpdate - Callback for streaming updates
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result with {success, fileOperations}
 */
export async function processWithAssistantAgent(userMessage, currentFiles = {}, onUpdate = null, options = {}) {
  const {
    images = null  // Array of {base64, mimeType} for file uploads
  } = options;

  console.log('[Assistant Provider] Starting document operation');
  console.log('[Assistant Provider] Current files:', Object.keys(currentFiles));

  // Callback wrapper for updates
  const sendUpdate = (update) => {
    if (onUpdate) {
      onUpdate(update);
    }
  };

  try {
    // Create virtual file system with current files
    const vfs = new VirtualFileSystem();
    Object.entries(currentFiles).forEach(([filename, content]) => {
      vfs.write(filename, content);
    });

    // Initialize tool registry with all assistant tools
    const toolRegistry = new ToolRegistry();
    const allTools = await assistantTools();

    allTools.forEach(tool => {
      toolRegistry.registerTool(tool);
    });

    const executor = new ToolExecutor(toolRegistry);
    const context = { fs: vfs };

    // Convert tools to OpenAI format
    const openAITools = convertToolsToOpenAIFormat(allTools);

    // Build system prompt
    const systemPrompt = buildAssistantPrompt({ currentFiles });

    // Get auth headers
    const headers = await getAuthHeaders();

    // Build messages
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
      content: 'Processing...'
    });

    // Single-phase loop: agent has all tools, decides what to use
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

      // Check for tool calls
      const toolCalls = assistantMessage?.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        // No tool calls - agent is done, return the response
        console.log(`[Assistant Provider] Completed after ${loopCount} loop(s)`);
        break;
      }

      // Add assistant message with tool calls to history
      messages.push(assistantMessage);

      console.log(`[Assistant Provider] Loop ${loopCount}: ${toolCalls.length} tool call(s)`);

      // Execute all tool calls
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const params = JSON.parse(toolCall.function.arguments || '{}');

        sendUpdate({
          type: 'tool_action',
          action: formatToolAction(toolName, params),
          tool: toolName,
          params
        });

        const toolResult = await executeFunction(toolName, params, executor, context);
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
      console.warn('[Assistant Provider] Max loops reached');
    }

    // Get final response text
    const responseText = assistantMessage?.content || '';

    if (responseText) {
      sendUpdate({
        type: 'assistant',
        content: responseText
      });
    }

    // Get all files from virtual file system
    const allFiles = vfs.getAll();

    // Create file operations only for files that were actually changed
    const fileOperations = Object.entries(allFiles)
      .filter(([filename]) => filename.startsWith('docs/'))
      .filter(([filename, content]) => {
        // Only include if file is new or content changed
        const originalContent = currentFiles[filename];
        return originalContent === undefined || originalContent !== content;
      })
      .map(([filename, content]) => {
        const existed = filename in currentFiles;
        return {
          type: existed ? 'modify' : 'create',
          filename,
          content
        };
      });

    // Only report file changes if there were actual modifications
    if (fileOperations.length > 0) {
      sendUpdate({
        type: 'thinking',
        content: `Updated ${fileOperations.length} document(s)`
      });
    }

    return {
      success: true,
      intent: 'assistant',
      fileOperations,
      response: responseText
    };

  } catch (error) {
    console.error('[Assistant Provider] Document operation failed:', error.message);

    sendUpdate({
      type: 'thinking',
      content: `Error: ${error.message}`
    });

    return {
      success: false,
      error: error.message,
      fileOperations: []
    };
  }
}

export default { processWithAssistantAgent };
