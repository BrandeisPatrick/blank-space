/**
 * OpenAI Provider
 * Handles code generation using OpenAI models (GPT-4, GPT-5, etc.)
 */

import { VirtualFileSystem } from '../../../filesystem/VirtualFS.js';
import { ToolRegistry } from '../../../tools/ToolRegistry.js';
import { SessionManager } from '../../../session/SessionManager.js';
import { coreTools } from '../../../tools/core/index.js';
import { callLLMWithTools, callLLM } from '../../../utils/llm/llmClient.js';
import { classifyIntent } from '../../../intentClassifier.js';
import { getModelForTier } from '../../../config/modelConfig.js';
import { buildSystemPrompt, CHAT_SYSTEM_PROMPT, generateAppNameOpenAI, formatToolAction } from '../../../prompts/index.js';

/**
 * Process a user message using OpenAI models
 *
 * @param {string} userMessage - User's request for code generation
 * @param {Object} currentFiles - Current file map {filename: content}
 * @param {Function} onUpdate - Callback for streaming updates
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result with {success, fileOperations, plan}
 */
export async function processWithOpenAI(userMessage, currentFiles = {}, onUpdate = null, options = {}) {
  const {
    modelTier = 'lite',
    aiColorPalette = 'matchWallpaper',
    aiUIStyle = 'glassmorphism',
    wallpaperTheme = 'starry',
    isDarkTheme = true,
    isDebugMode = false,
    debugErrors = []
  } = options;

  // Select model based on user preference tier
  const model = getModelForTier(modelTier);
  console.log(`[OpenAI Provider] Using model: ${model} (tier: ${modelTier})`);

  // Callback wrapper for updates
  const sendUpdate = (update) => {
    if (onUpdate) {
      onUpdate(update);
    }
  };

  try {
    // Classify intent first (async - uses AI)
    const hasExistingFiles = Object.keys(currentFiles).length > 0;
    const intentResult = await classifyIntent(userMessage, hasExistingFiles);
    console.log(`[Intent] "${userMessage.slice(0, 50)}..." → ${intentResult.intent} (${intentResult.source})`);

    // Handle chat intent - return conversational response
    if (intentResult.intent === 'chat') {
      sendUpdate({
        type: 'tool_action',
        action: 'Thinking...'
      });

      const chatResponse = await callLLM({
        model,
        systemPrompt: CHAT_SYSTEM_PROMPT,
        userPrompt: userMessage,
        maxTokens: 500,
        temperature: 0.7
      });

      const responseContent = chatResponse.choices[0]?.message?.content || 'I can help you build web apps! Try describing what you want to create.';

      // Send the chat response as an assistant message
      sendUpdate({
        type: 'assistant',
        content: responseContent
      });

      return {
        success: true,
        intent: 'chat',
        fileOperations: [], // No file changes for chat
        response: responseContent
      };
    }

    // Handle debug intent - enable debug mode and continue with code generation
    if (intentResult.intent === 'debug') {
      console.log(`[OpenAI Provider] Debug intent detected, enabling debug mode`);
      // Note: OpenAI provider would need similar updates to use debug prompt
      // For now, continue with normal generation
    }

    // Create/debug intent - proceed with code generation
    // Create session for tracking this conversation
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

    // Send thinking update
    sendUpdate({
      type: 'thinking',
      content: 'Analyzing your request and planning code generation...'
    });

    // Create messages array with user request
    const messages = [
      {
        role: 'user',
        content: userMessage
      }
    ];

    // Callback for tool actions
    const onToolAction = (tool, params, status) => {
      if (status === 'start') {
        sendUpdate({
          type: 'tool_action',
          action: formatToolAction(tool, params),
          tool,
          params
        });
      }
    };

    // Build system prompt with all context
    const systemPrompt = buildSystemPrompt({
      currentFiles,
      aiColorPalette,
      aiUIStyle,
      wallpaperTheme,
      isDarkTheme,
      isDebugMode,
      debugErrors
    });

    const isEditing = Object.keys(currentFiles).length > 0;
    if (isEditing) {
      console.log(`[OpenAI Provider] Edit mode for ${Object.keys(currentFiles).length} existing file(s)`);
    }

    console.log(`[OpenAI Provider] Style preferences: palette=${aiColorPalette}, style=${aiUIStyle}`);

    // Call LLM with tools
    const llmResponse = await callLLMWithTools({
      model,
      systemPrompt,
      messages,
      toolRegistry,
      context: { fs: vfs },
      maxTokens: 4000,
      maxToolLoops: 15,
      timeout: 120000,
      onToolAction
    });

    // Extract final response content
    const finalContent = llmResponse.choices[0]?.message?.content || '';

    sendUpdate({
      type: 'thinking',
      content: 'Collecting generated files...'
    });

    // Get all files from virtual file system
    const generatedFiles = vfs.getAll();

    // Create file operations for the UI
    const fileOperations = Object.entries(generatedFiles).map(([filename, content]) => {
      // Check if file existed before (in currentFiles)
      const existed = filename in currentFiles;
      return {
        type: existed ? 'modify' : 'create',
        filename,
        content
      };
    });

    // Send completion update
    sendUpdate({
      type: 'thinking',
      content: `Generated ${fileOperations.length} file(s)`
    });

    // Generate a short app name (max 3 words)
    const appName = await generateAppNameOpenAI(userMessage);

    return {
      success: true,
      intent: 'create',
      fileOperations,
      plan: {
        summary: appName,
        steps: [
          'Analyzed your request',
          'Generated React components',
          'Created necessary files'
        ]
      },
      sessionId
    };

  } catch (error) {
    console.error('❌ [OpenAI Provider] Code generation failed:', error.message);

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

export default { processWithOpenAI };
