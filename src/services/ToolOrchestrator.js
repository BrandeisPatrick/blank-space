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
import { buildStylePrompt } from "./stylePresets/stylePromptBuilder.js";
import { getModelForTier } from "./config/modelConfig.js";
import promptGuidance from "./prompts.json";

/**
 * Get critical guidance rules from prompts.json
 * These rules are essential for preventing runtime errors in the Sandpack preview
 * Note: SANDPACK_NAVIGATION_RULES removed - validator now catches these issues
 */
const getCriticalGuidance = () => {
  const criticalRules = [
    // 'SANDPACK_NAVIGATION_RULES', // Removed - validator catches href="#" and mismatched tags
    'BROWSER_RENDERABILITY_RULES',
    'NO_INITIALIZATION_CODE',
    'PACKAGE_MANAGEMENT_RULES',
    'FRAMER_MOTION_USAGE'
  ];

  return criticalRules
    .filter(key => promptGuidance[key])
    .map(key => promptGuidance[key])
    .join('\n\n');
};

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

# SANDBOX ENVIRONMENT LIMITATIONS
This code runs in Sandpack - an isolated browser sandbox. Understand these constraints:

1. **No External Network Access**
   - fetch() to external APIs will fail (CORS blocked)
   - External images may not load reliably
   - ✅ Use mock data, static JSON, or placeholder content instead

2. **No External Iframes or Embeds**
   - <iframe src="https://..."> will cause CORS errors
   - The sandbox has origin 'null' - external resources are blocked
   - ✅ For "browser" apps: Simulate page content with React components
   - ✅ Use mock HTML strings, placeholder divs, or rendered content

3. **No Real Navigation**
   - window.location changes don't work as expected
   - Links to external sites won't actually navigate
   - ✅ Use React state for "navigation" between views
   - ✅ Simulate routing with conditional rendering

4. **Self-Contained Apps Only**
   - Everything must work offline with no external dependencies
   - All data should be mocked/simulated
   - ✅ Generate realistic fake data inline (users, posts, products, etc.)
   - ✅ Use localStorage for persistence within the sandbox

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

# RESPONSIVE DESIGN (REQUIRED)
All generated apps MUST be mobile-responsive using Tailwind breakpoints:

✅ MOBILE-FIRST APPROACH:
- Start with mobile styles, add md:/lg: for larger screens
- Base: full-width, stacked layout
- md: (768px+): side-by-side, larger spacing
- lg: (1024px+): multi-column grids

✅ RESPONSIVE PATTERNS:
- Layout: "flex flex-col md:flex-row"
- Grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
- Spacing: "p-4 md:p-6 lg:p-8", "gap-4 md:gap-6"
- Text: "text-base md:text-lg", "text-2xl md:text-4xl"
- Hidden elements: "hidden md:block", "md:hidden"

✅ TOUCH-FRIENDLY (Mobile):
- Buttons: min-height 44px, adequate tap targets
- Links: sufficient spacing between tappable elements
- Forms: large input fields (py-3 px-4), visible labels

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
 * @param {string} options.modelTier - Model tier ('lite' or 'pro')
 * @param {string} options.aiColorPalette - AI color palette preference
 * @param {string} options.aiUIStyle - AI UI style preference
 * @param {string} options.wallpaperTheme - Current wallpaper theme key
 * @param {boolean} options.isDarkTheme - Whether current theme is dark
 * @returns {Promise<Object>} Result with {success, fileOperations, plan}
 */
export async function processMessage(userMessage, currentFiles = {}, onUpdate = null, options = {}) {
  const {
    useKnowledgeBase = false,
    modelTier = 'lite',
    aiColorPalette = 'matchWallpaper',
    aiUIStyle = 'glassmorphism',
    wallpaperTheme = 'starry',
    isDarkTheme = true
  } = options;

  // Select model based on user preference tier
  const model = getModelForTier(modelTier);
  console.log(`[ToolOrchestrator] Using model: ${model} (tier: ${modelTier})`);
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

    // Build system prompt with critical guidance and optional knowledge base context
    let systemPrompt = CODE_GENERATION_SYSTEM_PROMPT;

    // Always inject critical guidance rules from prompts.json
    const criticalGuidance = getCriticalGuidance();
    if (criticalGuidance) {
      systemPrompt += '\n\n' + criticalGuidance;
      console.log('[CriticalGuidance] Injected essential rules (navigation, renderability, initialization)');
    }

    // Add knowledge base context if enabled (Pro Mode)
    if (useKnowledgeBase) {
      const knowledgeBaseContext = buildKnowledgeBaseContext(userMessage);
      if (knowledgeBaseContext) {
        systemPrompt += knowledgeBaseContext;
        console.log('[KnowledgeBase] Injected component patterns into system prompt');
      }
    }

    // Add AI style preferences
    const styleContext = buildStylePrompt({
      colorPaletteId: aiColorPalette,
      uiStyleId: aiUIStyle,
      wallpaperTheme,
      isDarkTheme
    });
    if (styleContext) {
      systemPrompt += styleContext;
      console.log(`[StylePresets] Injected style preferences (palette: ${aiColorPalette}, style: ${aiUIStyle})`);
    }

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
