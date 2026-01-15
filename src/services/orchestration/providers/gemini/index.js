/**
 * Gemini Provider
 * Handles code generation using Google Gemini models via /api/gemini serverless function
 * API key is kept server-side for security - never exposed to browser
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
  timeout: 60000,    // 60s timeout for code generation
  maxRetries: 3,
  baseDelay: 1000,
  context: 'Gemini Provider'
};

/**
 * Get auth headers for API requests
 * Includes Firebase ID token if user is authenticated
 */
async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  try {
    if (auth?.currentUser) {
      const token = await auth.currentUser.getIdToken(true);
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn('[Gemini Provider] Failed to get auth token:', error.message);
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
 * Process a user message using Gemini models
 *
 * @param {string} userMessage - User's request for code generation
 * @param {Object} currentFiles - Current file map {filename: content}
 * @param {Function} onUpdate - Callback for streaming updates
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result with {success, fileOperations, plan}
 */
export async function processWithGemini(userMessage, currentFiles = {}, onUpdate = null, options = {}) {
  const {
    modelTier = 'lite',
    aiColorPalette = 'dark-professional',
    aiUIStyle = 'dark-professional',
    isDarkTheme = true,
    isDebugMode = false,
    debugErrors = [],
    images = null  // Array of {base64, mimeType} for image uploads
  } = options;

  // Get the actual model ID from the tier
  const model = getModelForTier(modelTier);
  console.log(`[Gemini Provider] Starting with model: ${model} (tier: ${modelTier})`);

  // Callback wrapper for updates
  const sendUpdate = (update) => {
    if (onUpdate) {
      onUpdate(update);
    }
  };

  // Track if we should use debug mode for this request
  // Note: Intent is already classified by orchestration layer - this only handles create/debug
  let useDebugMode = isDebugMode;
  let debugContext = options.debugContext || null;

  try {
    // Code generation (for both create and debug intents)
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

    // Convert tools to Gemini format - create two tool sets for two-phase execution
    const allGeminiTools = convertToolsToGeminiFormat(toolRegistry);

    // Phase 1 tools: read-only (glob, read) - for planning
    const readOnlyToolNames = ['glob', 'read'];
    const planningTools = allGeminiTools.filter(toolDef => {
      const funcName = toolDef.functionDeclarations?.[0]?.name;
      return readOnlyToolNames.includes(funcName);
    });

    // Build system prompt (use local debug state which may have been set by intent classification)
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
      console.log(`[Gemini Provider] Edit mode for ${Object.keys(currentFiles).length} existing file(s)`);
    }

    // Get auth headers once for the loop
    const loopHeaders = await getAuthHeaders();

    // Format files for Gemini API (inlineData format)
    // This handles images, PDFs, DOCX, and other binary files sent directly to AI
    let fileParts = null;
    if (images && images.length > 0) {
      fileParts = images.map(file => ({
        inlineData: {
          mimeType: file.mimeType,
          data: file.base64
        }
      }));
      // Log what file types are being sent
      const fileTypes = [...new Set(images.map(f => f.mimeType))];
      console.log(`[Gemini Provider] Sending ${images.length} file(s) to AI: ${fileTypes.join(', ')}`);
    }

    // ========================================
    // PHASE 1: Planning (read-only tools)
    // ========================================
    console.log('[Gemini Provider] Phase 1: Planning (read-only tools)');
    sendUpdate({
      type: 'thinking',
      content: 'Planning...'
    });

    let loopCount = 0;
    const maxPlanningLoops = 10;
    const maxExecutionLoops = 15;
    let history = [];
    let planText = '';

    // Send initial message with planning tools only
    let apiResponse = await fetchWithRetry('/api/gemini', {
      method: 'POST',
      headers: loopHeaders,
      body: JSON.stringify({
        action: 'chat',
        model,
        message: userMessage,
        imageParts: fileParts,  // Images, PDFs, and other files
        history: [],
        systemInstruction: systemPrompt,
        tools: planningTools,  // Read-only tools for planning
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

    // Phase 1 loop: execute read-only tools until we get a plan (text response)
    while (loopCount < maxPlanningLoops) {
      loopCount++;

      // Check for text response (the plan)
      if (response.text && response.text.trim()) {
        planText = response.text.trim();
        console.log(`[Gemini Provider] Plan received after ${loopCount} loop(s)`);
        sendUpdate({
          type: 'plan',
          content: planText
        });
        break;
      }

      // Check for function calls
      const functionCalls = response.functionCalls;
      if (!functionCalls || functionCalls.length === 0) {
        console.log(`[Gemini Provider] No function calls or plan in loop ${loopCount}`);
        break;
      }

      console.log(`[Gemini Provider] Loop ${loopCount}: ${functionCalls.length} function call(s)`);

      // Execute read-only function calls
      const functionResponses = [];
      for (const fc of functionCalls) {
        const toolName = fc.name;
        const params = fc.args || {};

        // Only allow read-only tools in planning phase
        if (!readOnlyToolNames.includes(toolName)) {
          console.warn(`[Gemini Provider] Blocked non-read tool in planning phase: ${toolName}`);
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

      // Send function responses back
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
          tools: planningTools,  // Still read-only tools
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
    console.log('[Gemini Provider] Phase 2: Execution (all tools)');
    sendUpdate({
      type: 'thinking',
      content: 'Implementing...'
    });

    // DON'T send new message - just continue processing pending function calls
    // The last response from Phase 1 might have function calls waiting to be executed
    // History is already preserved from Phase 1

    // Phase 2 loop: execute all tools (including write/validate now)
    let executionLoops = 0;
    while (executionLoops < maxExecutionLoops) {
      executionLoops++;
      loopCount++;

      // Check for function calls
      const functionCalls = response.functionCalls;
      if (!functionCalls || functionCalls.length === 0) {
        console.log(`[Gemini Provider] Completed after ${loopCount} total loop(s)`);
        break;
      }

      console.log(`[Gemini Provider] Loop ${loopCount}: ${functionCalls.length} function call(s)`);

      // Execute all function calls
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

      // Send function responses back
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
      console.warn('[Gemini Provider] Max loops reached');
    }

    sendUpdate({
      type: 'thinking',
      content: 'Collecting generated files...'
    });

    // Get all files from virtual file system
    const generatedFiles = vfs.getAll();

    // Create file operations for the UI
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

    // Generate app name
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
    console.error('❌ [Gemini Provider] Code generation failed:', error.message);

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

export default { processWithGemini };
