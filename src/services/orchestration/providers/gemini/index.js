/**
 * Gemini Provider
 * Handles code generation using Google Gemini models via @google/genai SDK
 * Uses Chat Session pattern for automatic thoughtSignature handling
 */

import { GoogleGenAI } from '@google/genai';
import { VirtualFileSystem } from '../../../filesystem/VirtualFS.js';
import { ToolRegistry } from '../../../tools/ToolRegistry.js';
import { ToolExecutor } from '../../../tools/ToolExecutor.js';
import { SessionManager } from '../../../session/SessionManager.js';
import { coreTools } from '../../../tools/core/index.js';
import { classifyIntent } from '../../../intentClassifier.js';
import { convertToolsToGeminiFormat } from './toolAdapter.js';
import { buildSystemPrompt, CHAT_SYSTEM_PROMPT } from '../../shared/prompts.js';
import { normalizeGeminiResponse } from '../../shared/responseNormalizer.js';
import { getModelForTier } from '../../../config/modelConfig.js';

/**
 * Get Google API key from environment
 */
function getApiKey() {
  // Browser environment (Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.GOOGLE_API_KEY;
  }
  // Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env.GOOGLE_API_KEY;
  }
  return null;
}

/**
 * Generate a short app name from user request (max 3 words)
 * Uses Gemini for name generation
 */
async function generateAppName(ai, userMessage, model) {
  try {
    const prompt = 'Generate a short app name (1-3 words max) from this user request. Return ONLY the name, no quotes, no explanation. Examples: "Todo List", "Weather App", "Quiz Game", "Calculator". User request: ' + userMessage;
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const name = response.text?.trim() || 'New App';
    // Ensure max 3 words and clean up
    return name.split(/\s+/).slice(0, 3).join(' ');
  } catch (error) {
    console.error('[Gemini Provider] Failed to generate app name:', error);
    // Fallback: extract first 3 meaningful words
    const words = userMessage
      .replace(/^(create|build|make|design|generate)\s+(a|an|the)?\s*/i, '')
      .split(/\s+/)
      .slice(0, 3)
      .join(' ');
    return words || 'New App';
  }
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
    useKnowledgeBase = false,
    modelTier = 'lite',
    aiColorPalette = 'matchWallpaper',
    aiUIStyle = 'glassmorphism',
    wallpaperTheme = 'starry',
    isDarkTheme = true,
    isDebugMode = false,
    debugErrors = []
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

  // Check for API key - in browser, need VITE_GOOGLE_API_KEY
  const apiKey = getApiKey();
  if (!apiKey) {
    const isBrowser = typeof window !== 'undefined';
    const envVarName = isBrowser ? 'VITE_GOOGLE_API_KEY' : 'GOOGLE_API_KEY';
    console.error(`[Gemini Provider] ${envVarName} not configured`);
    sendUpdate({
      type: 'thinking',
      content: `Error: Google API key not configured. Add ${envVarName} to your .env file.`
    });
    return {
      success: false,
      error: `Google API key not configured. Please set ${envVarName} in your .env file. Get a key from https://aistudio.google.com/app/apikey`,
      fileOperations: []
    };
  }

  try {
    // Initialize Gemini client
    const ai = new GoogleGenAI({ apiKey });

    // Classify intent first
    const intentResult = classifyIntent(userMessage);
    console.log(`[Gemini Provider] Intent: "${userMessage.slice(0, 50)}..." → ${intentResult.intent}`);

    // Handle chat intent - return conversational response
    if (intentResult.intent === 'chat') {
      sendUpdate({
        type: 'tool_action',
        action: 'Thinking...'
      });

      const chatResponse = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        config: {
          systemInstruction: CHAT_SYSTEM_PROMPT,
        },
      });

      const responseContent = chatResponse.text || 'I can help you build web apps! Try describing what you want to create.';

      sendUpdate({
        type: 'assistant',
        content: responseContent
      });

      return {
        success: true,
        intent: 'chat',
        fileOperations: [],
        response: responseContent
      };
    }

    // Create intent - proceed with code generation
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

    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      currentFiles,
      useKnowledgeBase,
      userMessage,
      aiColorPalette,
      aiUIStyle,
      wallpaperTheme,
      isDarkTheme,
      isDebugMode,
      debugErrors
    });

    sendUpdate({
      type: 'thinking',
      content: 'Analyzing your request with Gemini...'
    });

    const isEditing = Object.keys(currentFiles).length > 0;
    if (isEditing) {
      console.log(`[Gemini Provider] Edit mode for ${Object.keys(currentFiles).length} existing file(s)`);
    }

    // Create Chat Session - SDK handles thoughtSignature automatically!
    const chat = ai.chats.create({
      model,
      config: {
        tools: geminiTools,
        systemInstruction: systemPrompt,
        thinkingConfig: { thinkingLevel: 'low' }, // Balance between speed and quality
      },
    });

    // Tool calling loop using Chat Session
    let loopCount = 0;
    const maxLoops = 15;

    // Send initial message - SDK expects {message: string}
    let response = await chat.sendMessage({ message: userMessage });

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

      // Execute function calls
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

        // Auto-validate write operations
        if (toolName === 'write' && params.path && params.content && result.success) {
          try {
            const validateResult = await executor.execute('validate', {
              filename: params.path,
              content: params.content,
            }, context);

            if (!validateResult.success) {
              functionResponses.push({
                name: 'validate',
                response: {
                  tool: 'validate',
                  filename: params.path,
                  success: false,
                  errors: validateResult.errors,
                  guidance: validateResult.guidance || 'Fix the validation errors above before proceeding.',
                },
              });
            }
          } catch (validateError) {
            console.warn('[Gemini Provider] Validation check failed:', validateError.message);
          }
        }
      }

      // Send function responses back - format as functionResponse parts
      const functionResponseParts = functionResponses.map(fr => ({
        functionResponse: {
          name: fr.name,
          response: fr.response
        }
      }));
      response = await chat.sendMessage({ message: functionResponseParts });
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
    const appName = await generateAppName(ai, userMessage, model);

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

/**
 * Helper to format tool action into human-readable text
 */
function formatToolAction(tool, params) {
  switch (tool) {
    case 'read':
      return `Reading ${params.path}...`;
    case 'write':
      return `Writing ${params.path}...`;
    case 'edit':
      return `Editing ${params.path}...`;
    case 'glob':
      return `Searching files...`;
    case 'grep':
      return `Searching for "${params.pattern}"...`;
    case 'validate':
      return `Validating ${params.filename}...`;
    default:
      return `Running ${tool}...`;
  }
}

export default { processWithGemini };
