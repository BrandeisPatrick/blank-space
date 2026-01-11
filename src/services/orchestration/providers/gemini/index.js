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

    // Convert tools to Gemini format
    const geminiTools = convertToolsToGeminiFormat(toolRegistry);

    // Build system prompt (use local debug state which may have been set by intent classification)
    const systemPrompt = buildSystemPrompt({
      currentFiles,
      aiColorPalette,
      aiUIStyle,
      isDarkTheme,
      isDebugMode: useDebugMode,
      debugContext: debugContext,
    });

    sendUpdate({
      type: 'thinking',
      content: images ? 'Analyzing image with Gemini...' : 'Analyzing your request with Gemini...'
    });

    const isEditing = Object.keys(currentFiles).length > 0;
    if (isEditing) {
      console.log(`[Gemini Provider] Edit mode for ${Object.keys(currentFiles).length} existing file(s)`);
    }

    // Tool calling loop using /api/gemini serverless function
    let loopCount = 0;
    const maxLoops = 15;
    let history = [];

    // Get auth headers once for the loop
    const loopHeaders = await getAuthHeaders();

    // Format images for Gemini API (inlineData format)
    const imageParts = images ? images.map(img => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64
      }
    })) : null;

    // Send initial message to /api/gemini (with retry/timeout)
    let apiResponse = await fetchWithRetry('/api/gemini', {
      method: 'POST',
      headers: loopHeaders,
      body: JSON.stringify({
        action: 'chat',
        model,
        message: userMessage,
        imageParts,  // Include images if provided
        history: [],
        systemInstruction: systemPrompt,
        tools: geminiTools,
        thinkingConfig: { thinkingLevel: 'low' }
      })
    }, GEMINI_RETRY_CONFIG);

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      // Handle quota exceeded (429) with proper error structure
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

    while (loopCount < maxLoops) {
      loopCount++;

      // Check for function calls
      const functionCalls = response.functionCalls;
      if (!functionCalls || functionCalls.length === 0) {
        // No more function calls - we're done
        console.log(`[Gemini Provider] Completed after ${loopCount} loop(s)`);
        break;
      }

      console.log(`[Gemini Provider] Loop ${loopCount}: ${functionCalls.length} function call(s)`);

      // Execute function calls locally
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

      // Send function responses back via /api/gemini (with retry/timeout)
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
          tools: geminiTools,
          thinkingConfig: { thinkingLevel: 'low' }
        })
      }, GEMINI_RETRY_CONFIG);

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        // Handle quota exceeded (429) with proper error structure
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

    if (loopCount >= maxLoops) {
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
