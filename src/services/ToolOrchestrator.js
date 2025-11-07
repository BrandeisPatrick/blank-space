/**
 * Tool Orchestrator
 * Manages code generation using tool-based LLM orchestration
 * Replaces the old pipeline-based agent orchestrator
 */

import { VirtualFileSystem } from "./filesystem/VirtualFS.js";
import { ToolRegistry } from "./tools/ToolRegistry.js";
import { SessionManager } from "./session/SessionManager.js";
import { coreTools } from "./tools/core/index.js";
import { callLLMWithTools } from "./utils/llm/llmClient.js";

/**
 * System prompt for code generation
 * Guides the LLM to use tools to create React components
 */
const CODE_GENERATION_SYSTEM_PROMPT = `You are an expert React developer. Your task is to generate high-quality React code based on user requests.

You have access to file management tools (read, write, edit, glob, grep) that work with a virtual file system.

# CRITICAL: TOOL USAGE RULES
- ONLY use tools to create and modify code. Do NOT describe code in text responses.
- When the user asks you to create code, IMMEDIATELY start calling write() tools.
- Do NOT plan, explain, or describe what you will do - just execute the tool calls.
- All text you output should only be for communicating results or asking clarifying questions.
- NEVER output code in markdown code blocks - ALWAYS use the write tool instead.

# CODE GENERATION RULES
- Create App.jsx as the main component first
- Create additional components in a 'components/' directory
- Use modern React patterns (hooks, functional components)
- Ensure all imports reference files that actually exist
- Create CSS files if needed for styling
- Make each file self-contained and properly exported

# EXECUTION PATTERN
When you receive a user request:
1. Call the write tool to create App.jsx with complete, working code
2. Call write tool to create component files as needed
3. Call write tool to create style files if needed
4. Do NOT use glob or edit tools unless specifically needed
5. Return results, do NOT describe the code you created

IMPORTANT: Your goal is to generate complete, working React applications through tool calls only.`;

/**
 * Process a user message and generate code using tool-based orchestration
 *
 * @param {string} userMessage - User's request for code generation
 * @param {Object} currentFiles - Current file map {filename: content}
 * @param {Function} onUpdate - Callback for streaming updates
 * @returns {Promise<Object>} Result with {success, fileOperations, plan}
 */
export async function processMessage(userMessage, currentFiles = {}, onUpdate = null) {
  const startTime = Date.now();

  // Callback wrapper for updates
  const sendUpdate = (update) => {
    if (onUpdate) {
      onUpdate(update);
    }
  };

  try {
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

    // Call LLM with tools
    sendUpdate({
      type: 'thinking',
      content: 'Generating code using tool-based orchestration...'
    });

    const llmResponse = await callLLMWithTools({
      model: 'gpt-4o-mini',
      systemPrompt: CODE_GENERATION_SYSTEM_PROMPT,
      messages,
      toolRegistry,
      context: { fs: vfs },
      maxTokens: 4000,
      maxToolLoops: 15,
      timeout: 120000
    });

    // Extract final response content
    const finalContent = llmResponse.choices[0]?.message?.content || '';

    // DEBUG: Log LLM final response
    console.log(`\n📋 LLM Final Response:`);
    console.log(`   Content length: ${finalContent.length} chars`);
    console.log(`   Content preview (first 500 chars):`);
    console.log(`   ${finalContent.substring(0, 500)}`);
    console.log(`   Finish reason: ${llmResponse.choices[0]?.finish_reason}`);

    sendUpdate({
      type: 'thinking',
      content: 'Collecting generated files...'
    });

    // Get all files from virtual file system
    const generatedFiles = vfs.getAll();

    // DEBUG: Log VFS state
    console.log(`\n📁 VirtualFS State After LLM:`);
    console.log(`   File count: ${Object.keys(generatedFiles).length}`);
    console.log(`   Files: ${Object.keys(generatedFiles).join(', ') || '(none)'}`);
    if (Object.keys(generatedFiles).length > 0) {
      Object.entries(generatedFiles).forEach(([name, content]) => {
        console.log(`     - ${name}: ${content.length} chars`);
      });
    }

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

    // Log to console for debugging
    console.log(`✅ Code generation complete in ${Date.now() - startTime}ms`);
    console.log(`Generated ${fileOperations.length} files`);

    // Send completion update
    sendUpdate({
      type: 'thinking',
      content: `Generated ${fileOperations.length} file(s)`
    });

    return {
      success: true,
      fileOperations,
      plan: {
        summary: userMessage.slice(0, 100),
        steps: [
          'Analyzed your request',
          'Generated React components',
          'Created necessary files'
        ]
      },
      sessionId
    };

  } catch (error) {
    console.error('❌ Code generation failed:', error.message);

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

export default { processMessage };
