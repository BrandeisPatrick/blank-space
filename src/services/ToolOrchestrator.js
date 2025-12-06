/**
 * Tool Orchestrator
 * Manages code generation using tool-based LLM orchestration
 * Replaces the old pipeline-based agent orchestrator
 */

import { VirtualFileSystem } from "./filesystem/VirtualFS.js";
import { ToolRegistry } from "./tools/ToolRegistry.js";
import { SessionManager } from "./session/SessionManager.js";
import { coreTools } from "./tools/core/index.js";
import { callLLMWithTools, callLLM } from "./utils/llm/llmClient.js";
import { classifyIntent } from "./intentClassifier.js";
import { buildKnowledgeBaseContext } from "./knowledgeBase/promptBuilder.js";

/**
 * System prompt for code generation
 * Guides the LLM to use tools to create React components
 */
const CODE_GENERATION_SYSTEM_PROMPT = `You are an expert React developer. Your task is to generate high-quality React code based on user requests.

You have access to file management tools (read, write, edit, glob, grep, validate) that work with a virtual file system.

# CRITICAL: TOOL USAGE RULES
- ONLY use tools to create and modify code. Do NOT describe code in text responses.
- When the user asks you to create code, IMMEDIATELY start calling write() tools.
- Do NOT plan, explain, or describe what you will do - just execute the tool calls.
- All text you output should only be for communicating results or asking clarifying questions.
- NEVER output code in markdown code blocks - ALWAYS use the write tool instead.

# BROWSER ENVIRONMENT CONSTRAINTS (CRITICAL)
This is a BROWSER-BASED preview system. Follow these STRICT rules:

❌ ABSOLUTELY FORBIDDEN:
1. require() statements - causes "ReferenceError: require is not defined"
   - ❌ const React = require("react");
   - ❌ const { useState } = require("react");
   - ✅ Use: import X from "react";

2. External npm packages (except React/ReactDOM)
   - ❌ import axios from "axios";
   - ❌ import { v4 as uuidv4 } from "uuid";
   - ✅ Use: fetch() API, crypto.randomUUID(), native Date

3. React initialization code (system handles this)
   - ❌ ReactDOM.createRoot(document.getElementById("root"))
   - ❌ root.render(<App />)
   - ❌ document.getElementById("root")

4. Class components
   - ❌ class Component extends React.Component { ... }
   - ✅ Use: function Component() { ... } with hooks

✅ REQUIRED:
1. App.jsx MUST exist with: function App() { return (...); }
2. All components must be FUNCTIONAL (use hooks: useState, useEffect, etc.)
3. ES6 imports ONLY: import X from "react" or import X from "./components/X"
4. Use browser APIs: fetch, localStorage, crypto.randomUUID(), native Date
5. Components in components/ folder (except App.jsx)
6. Hooks in hooks/ folder

# STYLING REQUIREMENTS (MANDATORY)
🎨 BEAUTIFUL BY DEFAULT - Every component must be visually polished

✅ USE TAILWIND CSS FOR ALL STYLING:
- NO inline styles, NO plain CSS (Tailwind utilities only)
- Tailwind CDN is pre-loaded and ready to use

✅ DEFAULT MODERN LIGHT THEME:
- Background: "min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"
- Container: max-w-4xl mx-auto px-4 py-12

✅ HERO HEADER (Include in every app):
- Title: "text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
- Subtitle: "text-xl text-gray-600 mt-4 mb-12"
- Example: <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Todo List</h1>

✅ GLASSMORPHISM CONTAINERS:
- "bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl p-8"
- Add subtle glow: "shadow-blue-100/50"

✅ BUTTONS:
- Primary: "bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all"
- Secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-xl transition-all"

✅ INPUT FIELDS:
- "bg-white border border-gray-300 text-gray-900 rounded-xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-500"

✅ TYPOGRAPHY:
- Headings: "text-3xl font-bold text-gray-900" (h2), "text-2xl font-semibold text-gray-800" (h3)
- Body: "text-base text-gray-700"
- Muted/labels: "text-sm text-gray-600"

✅ SPACING (Avoid excessive empty space):
- Section gaps: gap-8, gap-10 (NOT gap-20 or gap-32)
- Between items: gap-4, space-y-3
- Container padding: p-8, px-6 py-8

✅ INTERACTIVE EFFECTS:
- Smooth transitions: "transition-all duration-300"
- Shadows with glow: "shadow-xl shadow-blue-100/50"
- Hover states: "hover:shadow-xl hover:scale-[1.02]"
- Focus states: "focus:ring-2 focus:ring-blue-500"

✅ EMPTY STATES (Make them elegant):
- Center with padding: "py-16 text-center"
- Styling: "text-gray-600 text-lg"
- Encouraging copy: "Your list is empty. Add your first item to get started!"

✅ LIST ITEMS (for todo lists, etc.):
- "flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all"

# VALIDATION & ERROR CORRECTION WORKFLOW
When you write code, it will be automatically validated. If validation fails:

1. You will receive a validation error message in the tool results
2. The error message tells you EXACTLY what's wrong
3. Fix the issue by rewriting the file with corrected code
4. Call write() again with the fixed version
5. Validation continues until code passes

❌ Common Errors & Fixes:
- "require is not defined" → Change require() to import
- "Cannot resolve module 'uuid'" → Use crypto.randomUUID() instead
- "module.exports not allowed" → Use export default / export const
- "class components not allowed" → Rewrite as functional component with hooks

# CODE GENERATION RULES
- Create App.jsx as the main component first
- Create additional components in a 'components/' directory
- Use modern React patterns (hooks, functional components)
- Ensure all imports reference files that actually exist
- Make each file self-contained and properly exported
- AVOID: require(), npm imports, class components, React initialization code

# SELF-CHECKING BEFORE WRITING FILES
Before calling write(), mentally verify:
✓ Am I using ES6 imports? (not require)
✓ Am I importing only React/ReactDOM or local files? (not external packages)
✓ Are all components functional? (no class components)
✓ Is there NO initialization code? (no createRoot, render, document.getElementById)
✓ Does each file export properly? (export default or export const)

# EXECUTION PATTERN
When you receive a user request:
1. Call the write tool to create App.jsx with complete, working code
2. Call write tool to create component files as needed
3. Create style files if needed
4. When validation errors occur, fix and rewrite immediately
5. Continue until all code passes validation
6. Return results, do NOT describe the code you created

IMPORTANT: Your goal is to generate complete, working, VALIDATED React applications through tool calls only.`;

/**
 * System prompt for chat/conversational responses
 */
/**
 * Generate a short app name from user request (max 3 words)
 */
async function generateAppName(userMessage) {
  try {
    const response = await callLLM({
      model: 'gpt-4o-mini',
      systemPrompt: 'Generate a short app name (1-3 words max) from the user request. Return ONLY the name, no quotes, no explanation. Examples: "Todo List", "Weather App", "Quiz Game", "Calculator"',
      userPrompt: userMessage,
      maxTokens: 20,
      temperature: 0.3
    });

    const name = response.choices[0]?.message?.content?.trim() || 'New App';
    // Ensure max 3 words and clean up
    return name.split(/\s+/).slice(0, 3).join(' ');
  } catch (error) {
    console.error('Failed to generate app name:', error);
    // Fallback: extract first 3 meaningful words
    const words = userMessage
      .replace(/^(create|build|make|design|generate)\s+(a|an|the)?\s*/i, '')
      .split(/\s+/)
      .slice(0, 3)
      .join(' ');
    return words || 'New App';
  }
}

const CHAT_SYSTEM_PROMPT = `You are Bina, a friendly AI assistant for a web app builder called Blank Space.

You help users understand what you can do and answer their questions. Keep responses concise and helpful.

About Blank Space:
- It's a tool that creates React web applications from natural language descriptions
- Users can describe what they want to build, and you generate the code
- You can create: landing pages, dashboards, games, tools, calculators, todo apps, and much more
- The apps use React with Tailwind CSS for beautiful, modern styling

When users ask what you can do, give them examples like:
- "Create a todo list app with dark mode"
- "Build a weather dashboard"
- "Make a simple calculator"
- "Design a landing page for a startup"
- "Create a quiz game"

Keep your tone friendly, helpful, and encouraging. If users seem unsure, suggest they try a simple example to get started.`;

/**
 * Process a user message and generate code using tool-based orchestration
 *
 * @param {string} userMessage - User's request for code generation
 * @param {Object} currentFiles - Current file map {filename: content}
 * @param {Function} onUpdate - Callback for streaming updates
 * @param {Object} options - Additional options
 * @param {boolean} options.useKnowledgeBase - Whether to use the component knowledge base
 * @returns {Promise<Object>} Result with {success, fileOperations, plan}
 */
export async function processMessage(userMessage, currentFiles = {}, onUpdate = null, options = {}) {
  const { useKnowledgeBase = false, useGemini = false } = options;
  const provider = useGemini ? 'gemini' : 'openai';
  const startTime = Date.now();

  // Callback wrapper for updates
  const sendUpdate = (update) => {
    if (onUpdate) {
      onUpdate(update);
    }
  };

  try {
    // Classify intent first
    const intentResult = classifyIntent(userMessage);
    console.log(`[Intent] "${userMessage.slice(0, 50)}..." → ${intentResult.intent} (${intentResult.confidence}, ${intentResult.reason})`);

    // Handle chat intent - return conversational response
    if (intentResult.intent === 'chat') {
      sendUpdate({
        type: 'tool_action',
        action: 'Thinking...'
      });

      const chatModel = provider === 'gemini' ? 'gemini-3-pro-preview' : 'gpt-4o-mini';
      if (provider === 'gemini') {
        console.log('[Gemini] Using Gemini 3 Pro Preview for chat');
      }
      const chatResponse = await callLLM({
        model: chatModel,
        systemPrompt: CHAT_SYSTEM_PROMPT,
        userPrompt: userMessage,
        maxTokens: 500,
        temperature: 0.7,
        provider
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

    // Create intent - proceed with code generation
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

    // Helper to format tool action into human-readable text
    const formatToolAction = (tool, params) => {
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
    };

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

    // Build system prompt with optional knowledge base context
    let systemPrompt = CODE_GENERATION_SYSTEM_PROMPT;
    if (useKnowledgeBase) {
      const knowledgeBaseContext = buildKnowledgeBaseContext(userMessage);
      if (knowledgeBaseContext) {
        systemPrompt += knowledgeBaseContext;
        console.log('[KnowledgeBase] Injected component patterns into system prompt');
      }
    }

    // Call LLM with tools
    const model = provider === 'gemini' ? 'gemini-3-pro-preview' : 'gpt-4o-mini';
    if (provider === 'gemini') {
      console.log('[Gemini] Using Gemini 3 Pro Preview');
    }
    const llmResponse = await callLLMWithTools({
      model,
      systemPrompt,
      messages,
      toolRegistry,
      context: { fs: vfs },
      maxTokens: 4000,
      maxToolLoops: 15,
      timeout: 120000,
      onToolAction,
      provider
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
    const appName = await generateAppName(userMessage);

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
