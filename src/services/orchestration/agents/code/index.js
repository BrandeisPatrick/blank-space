/**
 * Code Agent
 * Handles code generation using Google Gemini models
 * Two-phase execution: Planning (read-only) → Execution (all tools)
 */

import { VirtualFileSystem } from '../../../filesystem/VirtualFS.js';
import { ToolRegistry } from '../../../tools/ToolRegistry.js';
import { ToolExecutor } from '../../../tools/ToolExecutor.js';
import { SessionManager } from '../../../session/SessionManager.js';
import { coreTools } from '../../../tools/core/index.js';
import { convertToolsToGeminiFormat } from './toolAdapter.js';
import { buildSystemPrompt, generateAppNameGemini, formatToolAction } from '../../../prompts/index.js';
import { getModelForTier } from '../../../config/modelConfig.js';
import { auth } from '../../../../config/firebase.js';
import { fetchWithRetry } from '../../../utils/fetchWithRetry.js';

// Retry configuration for Gemini API calls
const GEMINI_RETRY_CONFIG = {
  timeout: 60000,
  maxRetries: 3,
  baseDelay: 1000,
  context: 'Code Agent'
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
    console.warn('[Code Agent] Failed to get auth token:', error.message);
  }
  return headers;
}

/**
 * Execute a function call from Gemini
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
 * Process a user message using the Code Agent
 *
 * @param {string} userMessage - User's request for code generation
 * @param {Object} currentFiles - Current file map {filename: content}
 * @param {Function} onUpdate - Callback for streaming updates
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result with {success, fileOperations, plan}
 */
export async function processWithCodeAgent(userMessage, currentFiles = {}, onUpdate = null, options = {}) {
  const {
    modelTier = 'lite',
    aiColorPalette = 'dark-professional',
    aiUIStyle = 'dark-professional',
    isDarkTheme = true,
    isDebugMode = false,
    debugErrors = [],
    images = null
  } = options;

  const model = getModelForTier(modelTier);
  console.log(`[Code Agent] Starting with model: ${model} (tier: ${modelTier})`);

  const sendUpdate = (update) => {
    if (onUpdate) {
      onUpdate(update);
    }
  };

  let useDebugMode = isDebugMode;
  let debugContext = options.debugContext || null;

  try {
    const sessionManager = new SessionManager();
    const sessionId = sessionManager.createSession('user-session').id;

    // Create virtual file system with current files
    const vfs = new VirtualFileSystem();
    Object.entries(currentFiles).forEach(([filename, content]) => {
      vfs.write(filename, content);
    });

    // Initialize tool registry with core tools
    const toolRegistry = new ToolRegistry();
    const tools = await coreTools();
    tools.forEach(tool => {
      toolRegistry.registerTool(tool);
    });

    const executor = new ToolExecutor(toolRegistry);
    const context = { fs: vfs };

    // Convert tools to Gemini format
    const allGeminiTools = convertToolsToGeminiFormat(toolRegistry);

    // Phase 1 tools: read-only (glob, read) - for planning
    const readOnlyToolNames = ['glob', 'read'];
    const planningTools = allGeminiTools.filter(toolDef => {
      const funcName = toolDef.functionDeclarations?.[0]?.name;
      return readOnlyToolNames.includes(funcName);
    });

    const systemPrompt = buildSystemPrompt({
      currentFiles,
      aiColorPalette,
      aiUIStyle,
      isDarkTheme,
      isDebugMode: useDebugMode,
      debugContext: debugContext,
    });

    const isEditing = Object.keys(currentFiles).length > 0;
    if (isEditing) {
      console.log(`[Code Agent] Edit mode for ${Object.keys(currentFiles).length} existing file(s)`);
    }

    const loopHeaders = await getAuthHeaders();

    // Format files for Gemini API (inlineData format)
    let fileParts = null;
    if (images && images.length > 0) {
      fileParts = images.map(file => ({
        inlineData: {
          mimeType: file.mimeType,
          data: file.base64
        }
      }));
      const fileTypes = [...new Set(images.map(f => f.mimeType))];
      console.log(`[Code Agent] Sending ${images.length} file(s) to AI: ${fileTypes.join(', ')}`);
    }

    // ========================================
    // PHASE 1: Planning (read-only tools)
    // ========================================
    console.log('[Code Agent] Phase 1: Planning (read-only tools)');
    sendUpdate({
      type: 'thinking',
      content: 'Planning...'
    });

    let loopCount = 0;
    const maxPlanningLoops = 10;
    const maxExecutionLoops = 15;
    let history = [];
    let planText = '';

    let apiResponse = await fetchWithRetry('/api/gemini', {
      method: 'POST',
      headers: loopHeaders,
      body: JSON.stringify({
        action: 'chat',
        model,
        message: userMessage,
        imageParts: fileParts,
        history: [],
        systemInstruction: systemPrompt,
        tools: planningTools,
        thinkingConfig: { thinkingLevel: 'low' }
      })
    }, GEMINI_RETRY_CONFIG);

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      if (apiResponse.status === 429 && errorData.quota) {
        const err = new Error(errorData.message || 'Quota exceeded');
        err.isQuotaExceeded = true;
        err.quota = errorData.quota;
        err.upgradeUrl = errorData.upgradeUrl || '/pricing';
        throw err;
      }
      throw new Error(errorData.message || `API error: ${apiResponse.status}`);
    }

    let response = await apiResponse.json();
    history = response.history || [];

    // Phase 1 loop: execute read-only tools until we get a plan
    while (loopCount < maxPlanningLoops) {
      loopCount++;

      if (response.text && response.text.trim()) {
        planText = response.text.trim();
        console.log(`[Code Agent] Plan received after ${loopCount} loop(s)`);
        sendUpdate({
          type: 'plan',
          content: planText
        });
        break;
      }

      const functionCalls = response.functionCalls;
      if (!functionCalls || functionCalls.length === 0) {
        console.log(`[Code Agent] No function calls or plan in loop ${loopCount}`);
        break;
      }

      console.log(`[Code Agent] Loop ${loopCount}: ${functionCalls.length} function call(s)`);

      const functionResponses = [];
      for (const fc of functionCalls) {
        const toolName = fc.name;
        const params = fc.args || {};

        if (!readOnlyToolNames.includes(toolName)) {
          console.warn(`[Code Agent] Blocked non-read tool in planning phase: ${toolName}`);
          functionResponses.push({
            name: toolName,
            response: { success: false, error: 'Tool not available in planning phase. Output your plan first.' },
          });
          continue;
        }

        sendUpdate({
          type: 'tool_action',
          action: formatToolAction(toolName, params),
          tool: toolName,
          params
        });

        const result = await executeFunction(toolName, params, executor, context);
        functionResponses.push({
          name: toolName,
          response: result,
        });
      }

      const functionResponseParts = functionResponses.map(fr => ({
        functionResponse: {
          name: fr.name,
          response: fr.response
        }
      }));

      apiResponse = await fetchWithRetry('/api/gemini', {
        method: 'POST',
        headers: loopHeaders,
        body: JSON.stringify({
          action: 'chat',
          model,
          history,
          functionResponses: functionResponseParts,
          systemInstruction: systemPrompt,
          tools: planningTools,
          thinkingConfig: { thinkingLevel: 'low' }
        })
      }, GEMINI_RETRY_CONFIG);

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        if (apiResponse.status === 429 && errorData.quota) {
          const err = new Error(errorData.message || 'Quota exceeded');
          err.isQuotaExceeded = true;
          err.quota = errorData.quota;
          err.upgradeUrl = errorData.upgradeUrl || '/pricing';
          throw err;
        }
        throw new Error(errorData.message || `API error: ${apiResponse.status}`);
      }

      response = await apiResponse.json();
      history = response.history || history;
    }

    // ========================================
    // PHASE 2: Execution (all tools)
    // ========================================
    console.log('[Code Agent] Phase 2: Execution (all tools)');
    sendUpdate({
      type: 'thinking',
      content: 'Implementing...'
    });

    let executionLoops = 0;
    while (executionLoops < maxExecutionLoops) {
      executionLoops++;
      loopCount++;

      const functionCalls = response.functionCalls;
      if (!functionCalls || functionCalls.length === 0) {
        console.log(`[Code Agent] Completed after ${loopCount} total loop(s)`);
        break;
      }

      console.log(`[Code Agent] Loop ${loopCount}: ${functionCalls.length} function call(s)`);

      const functionResponses = [];
      for (const fc of functionCalls) {
        const toolName = fc.name;
        const params = fc.args || {};

        sendUpdate({
          type: 'tool_action',
          action: formatToolAction(toolName, params),
          tool: toolName,
          params
        });

        const result = await executeFunction(toolName, params, executor, context);
        functionResponses.push({
          name: toolName,
          response: result,
        });
      }

      const functionResponseParts = functionResponses.map(fr => ({
        functionResponse: {
          name: fr.name,
          response: fr.response
        }
      }));

      apiResponse = await fetchWithRetry('/api/gemini', {
        method: 'POST',
        headers: loopHeaders,
        body: JSON.stringify({
          action: 'chat',
          model,
          history,
          functionResponses: functionResponseParts,
          systemInstruction: systemPrompt,
          tools: allGeminiTools,
          thinkingConfig: { thinkingLevel: 'low' }
        })
      }, GEMINI_RETRY_CONFIG);

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        if (apiResponse.status === 429 && errorData.quota) {
          const err = new Error(errorData.message || 'Quota exceeded');
          err.isQuotaExceeded = true;
          err.quota = errorData.quota;
          err.upgradeUrl = errorData.upgradeUrl || '/pricing';
          throw err;
        }
        throw new Error(errorData.message || `API error: ${apiResponse.status}`);
      }

      response = await apiResponse.json();
      history = response.history || history;
    }

    if (loopCount >= maxPlanningLoops + maxExecutionLoops) {
      console.warn('[Code Agent] Max loops reached');
    }

    sendUpdate({
      type: 'thinking',
      content: 'Collecting generated files...'
    });

    const generatedFiles = vfs.getAll();

    const fileOperations = Object.entries(generatedFiles).map(([filename, content]) => {
      const existed = filename in currentFiles;
      return {
        type: existed ? 'modify' : 'create',
        filename,
        content
      };
    });

    sendUpdate({
      type: 'thinking',
      content: `Generated ${fileOperations.length} file(s)`
    });

    const appName = await generateAppNameGemini(userMessage, model);

    return {
      success: true,
      intent: 'create',
      fileOperations,
      plan: {
        summary: appName,
        steps: [
          'Analyzed your request with Gemini',
          'Generated React components',
          'Created necessary files'
        ]
      },
      sessionId
    };

  } catch (error) {
    console.error('❌ [Code Agent] Code generation failed:', error.message);

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

export default { processWithCodeAgent };
