import { callLLMForJSON } from "../utils/llm/llmClient.js";
import { MODELS } from "../config/modelConfig.js";
import { THINKING_FRAMEWORK } from "../promptTemplates.js";
import compressedPrompts from "../compressedPrompts.json" with { type: "json" };
import { extractUXFromCode } from "./designer.js";

/**
 * Analysis modes for different pipeline types
 */
export const AnalysisMode = {
  MODIFICATION: 'modification',    // Find what files to modify
  DEBUG: 'debug',                  // Identify error location and context
  STYLE_EXTRACTION: 'style-extraction', // Extract current UX patterns
  EXPLAIN: 'explain'               // Explain code functionality
};

/**
 * Enhanced Codebase Analyzer Agent
 * Supports multiple analysis modes for different pipeline types
 * Integrates with UX and Architecture agents
 */

/**
 * Main analysis function with mode support
 * @param {Object} options - Analysis options
 * @param {string} options.userMessage - User's request
 * @param {Object} options.currentFiles - Current files map
 * @param {string} [options.mode='modification'] - Analysis mode
 * @param {ConversationLogger} [options.logger=null] - Optional conversation logger
 * @returns {Promise<Object>} Analysis result
 */
export async function analyze({ userMessage, currentFiles = {}, mode = AnalysisMode.MODIFICATION, logger = null }) {
  // Route to appropriate analysis function based on mode
  switch (mode) {
    case AnalysisMode.MODIFICATION:
      return await analyzeForModification(userMessage, currentFiles, logger);

    case AnalysisMode.DEBUG:
      return await analyzeForDebug(userMessage, currentFiles, logger);

    case AnalysisMode.STYLE_EXTRACTION:
      return await analyzeForStyleExtraction(userMessage, currentFiles, logger);

    case AnalysisMode.EXPLAIN:
      return await analyzeForExplanation(userMessage, currentFiles, logger);

    default:
      return await analyzeForModification(userMessage, currentFiles, logger);
  }
}

/**
 * Analyze codebase for modification (original function, enhanced)
 * @param {string} userMessage - User's modification request
 * @param {Object} currentFiles - Current files map
 * @param {ConversationLogger} logger - Optional conversation logger
 * @returns {Promise<Object>} Modification analysis
 */
async function analyzeForModification(userMessage, currentFiles = {}, logger = null) {
  // If no files exist, nothing to analyze
  if (Object.keys(currentFiles).length === 0) {
    return {
      needsAnalysis: false,
      filesToModify: [],
      changeTargets: {},
      reasoning: "No existing files to analyze"
    };
  }

  // Build file context with content
  const filesContext = Object.entries(currentFiles)
    .map(([filename, content]) => {
      return `File: ${filename}\n\`\`\`\n${content}\n\`\`\``;
    })
    .join("\n\n");

  const systemPrompt = `You are a codebase analysis agent for React applications.

Your job is to analyze ALL files in the codebase and determine EXACTLY which files need to be modified to fulfill the user's request.

${THINKING_FRAMEWORK}

Analysis Guidelines:
- **Read and understand ALL file contents** provided
- **Identify patterns** that need to change (e.g., color classes, function names, component structures)
- **Find all occurrences** across all files, not just one file
- **Be specific** about what needs to change in each file
- **Think holistically** - consider the entire codebase, not individual files

Common modification patterns:
- **Color/Theme changes**: Find all Tailwind color classes (bg-blue-600, text-red-500, etc.) across ALL components
- **Renaming**: Find all imports, exports, and usages of a function/component
- **Feature additions**: Identify which files need updates to integrate the new feature
- **Style changes**: Find all styling-related code (className, style props, CSS)

CRITICAL: When analyzing for color/theme changes:
- Search for Tailwind utility classes in ALL component files
- Look for: bg-*, text-*, border-*, ring-*, from-*, to-* color classes
- CSS files often DON'T control component colors - components use inline Tailwind classes
- Return ALL files that contain the colors to change

🔧 JSON FORMATTING RULES:
1. Output valid, complete JSON only
2. Wrap response: <<<JSON>>> ... <<</JSON>>>
3. Include ALL required fields
4. Close all brackets/braces
5. Verify syntax before responding

Respond ONLY with a JSON object in this format:
{
  "needsAnalysis": true,
  "filesToModify": ["components/TodoList.jsx", "components/TodoItem.jsx"],
  "changeTargets": {
    "components/TodoList.jsx": [
      {
        "pattern": "bg-blue-600",
        "replacement": "bg-red-600",
        "reason": "Primary button background color"
      },
      {
        "pattern": "hover:bg-blue-700",
        "replacement": "hover:bg-red-700",
        "reason": "Primary button hover state"
      }
    ],
    "components/TodoItem.jsx": [
      {
        "pattern": "text-blue-600",
        "replacement": "text-red-600",
        "reason": "Link text color"
      }
    ]
  },
  "reasoning": "Found blue Tailwind classes in 2 component files. These components use inline Tailwind utilities, not CSS classes, so main.css changes won't affect them."
}

If the request doesn't require modification analysis (e.g., creating new files), respond:
{
  "needsAnalysis": false,
  "filesToModify": [],
  "changeTargets": {},
  "reasoning": "This is a creation task, not modification"
}`;

  try {
    const analysis = await callLLMForJSON({
      model: MODELS.ANALYZER,
      systemPrompt,
      userPrompt: `Analyze the codebase for this modification request: "${userMessage}"\n\nCodebase:\n${filesContext}`,
      maxTokens: 10000,  // Increased for GPT-5 reasoning tokens (~4000-5000) + JSON output (~2000-5000)
      temperature: 0.3,
      logger
    });

    // Extract UX from existing code
    analysis.existingUX = extractUXFromCode(currentFiles);

    return analysis;
  } catch (error) {
    console.error("Codebase analysis error:", error);
    return {
      needsAnalysis: false,
      filesToModify: [],
      changeTargets: {},
      reasoning: `Analysis error: ${error.message}`,
      existingUX: extractUXFromCode(currentFiles)
    };
  }
}

/**
 * Analyze codebase for debugging
 * Identifies error location, type, and provides context
 * @param {string} userMessage - User's error description
 * @param {Object} currentFiles - Current files map
 * @param {ConversationLogger} logger - Optional conversation logger
 * @returns {Promise<Object>} Debug analysis
 */
async function analyzeForDebug(userMessage, currentFiles, logger = null) {
  if (Object.keys(currentFiles).length === 0) {
    return {
      errorFile: null,
      errorType: 'unknown',
      errorMessage: 'No files to analyze',
      possibleCauses: []
    };
  }

  const filesContext = Object.entries(currentFiles)
    .map(([filename, content]) => `File: ${filename}\n\`\`\`\n${content}\n\`\`\``)
    .join("\n\n");

  const systemPrompt = `You are a debugging analysis agent for React applications.
Analyze the code to identify where and why an error is occurring.

${THINKING_FRAMEWORK}

${compressedPrompts.DEBUGGER_PATTERNS}

Respond ONLY with JSON in this format:
{
  "errorFile": "components/TodoList.jsx",
  "errorType": "state-mutation | event-handler | hooks-rules | async | props | rendering",
  "errorMessage": "Brief description of the error",
  "errorLocation": "Line numbers or function name",
  "possibleCauses": ["Cause 1", "Cause 2"],
  "relatedFiles": ["Other files that might be involved"],
  "codeContext": "Relevant code snippet around the error"
}`;

  try {
    const analysis = await callLLMForJSON({
      model: MODELS.ANALYZER,
      systemPrompt,
      userPrompt: `Analyze this error: "${userMessage}"\n\nCodebase:\n${filesContext}`,
      maxTokens: 8000,  // Increased for GPT-5 reasoning tokens (~3000-4000) + JSON output (~2000-3000)
      temperature: 0.2,
      logger
    });

    return analysis;
  } catch (error) {
    console.error("Debug analysis error:", error);
    return {
      errorFile: null,
      errorType: 'unknown',
      errorMessage: `Analysis failed: ${error.message}`,
      possibleCauses: ['Unable to analyze - manual debugging required']
    };
  }
}

/**
 * Analyze codebase for style extraction
 * Extracts current UX patterns and prepares for redesign
 * @param {string} userMessage - User's style change request
 * @param {Object} currentFiles - Current files map
 * @param {ConversationLogger} logger - Optional conversation logger
 * @returns {Promise<Object>} Style extraction analysis
 */
async function analyzeForStyleExtraction(userMessage, currentFiles, logger = null) {
  if (Object.keys(currentFiles).length === 0) {
    return {
      styledFiles: [],
      currentStyles: null
    };
  }

  // Use the extractUXFromCode function to get current styles
  const currentStyles = extractUXFromCode(currentFiles);

  // Identify files that contain visual elements
  const styledFiles = Object.keys(currentFiles).filter(filename => {
    const code = currentFiles[filename];
    return (
      filename.match(/\.(jsx|tsx)$/) && // Component files
      (code.includes('className=') || code.includes('style=')) // Has styling
    );
  });

  const filesContext = styledFiles
    .map(filename => `File: ${filename}\n\`\`\`\n${currentFiles[filename]}\n\`\`\``)
    .join("\n\n");

  const systemPrompt = `You are a UX analysis agent.
Identify which files need style updates and what changes are needed.

${compressedPrompts.STYLE_EXTRACTION_GUIDE}

🔧 JSON FORMATTING RULES:
1. Output valid, complete JSON only
2. Wrap response: <<<JSON>>> ... <<</JSON>>>
3. Include ALL required fields
4. Close all brackets/braces

Respond ONLY with JSON:
{
  "styledFiles": ["components/Header.jsx", "components/TodoList.jsx"],
  "styleChanges": {
    "components/Header.jsx": ["Update background gradient", "Change text colors"],
    "components/TodoList.jsx": ["Update button colors", "Change card backgrounds"]
  },
  "currentTheme": "dark | light",
  "reasoning": "Why these files need updates"
}`;

  try {
    const analysis = await callLLMForJSON({
      model: MODELS.ANALYZER,
      systemPrompt,
      userPrompt: `Analyze style changes for: "${userMessage}"\n\nStyled Files:\n${filesContext}`,
      maxTokens: 8000,  // Increased for GPT-5 reasoning tokens (~3000-4000) + JSON output (~2000-3000)
      temperature: 0.3,
      logger
    });

    analysis.currentStyles = currentStyles;
    analysis.styledFiles = styledFiles; // Override with our detection

    return analysis;
  } catch (error) {
    console.error("Style extraction error:", error);
    return {
      styledFiles,
      currentStyles,
      styleChanges: {},
      reasoning: `Extraction failed: ${error.message}`
    };
  }
}

/**
 * Analyze codebase for explanation
 * Provides understanding of code functionality
 * @param {string} userMessage - User's question about code
 * @param {Object} currentFiles - Current files map
 * @param {ConversationLogger} logger - Optional conversation logger
 * @returns {Promise<Object>} Explanation
 */
async function analyzeForExplanation(userMessage, currentFiles, logger = null) {
  if (Object.keys(currentFiles).length === 0) {
    return {
      explanation: 'No code to explain',
      relevantFiles: []
    };
  }

  const filesContext = Object.entries(currentFiles)
    .map(([filename, content]) => `File: ${filename}\n\`\`\`\n${content}\n\`\`\``)
    .join("\n\n");

  const systemPrompt = `You are a code explanation agent for React applications.
Explain the code functionality in clear, understandable terms.

${THINKING_FRAMEWORK}

Focus on:
- What the code does
- How components are structured
- Key functionality and features
- Data flow and state management

Respond ONLY with JSON:
{
  "explanation": "Clear explanation of the code",
  "relevantFiles": ["files related to the question"],
  "keyFeatures": ["Feature 1", "Feature 2"],
  "architecture": "Brief overview of code structure",
  "suggestions": ["Optional improvement suggestions"]
}`;

  try {
    const analysis = await callLLMForJSON({
      model: MODELS.ANALYZER,
      systemPrompt,
      userPrompt: `Explain: "${userMessage}"\n\nCodebase:\n${filesContext}`,
      maxTokens: 8000,  // Increased for GPT-5 reasoning tokens (~3000-4000) + JSON output (~2000-3000)
      temperature: 0.5,
      logger
    });

    return analysis;
  } catch (error) {
    console.error("Explanation error:", error);
    return {
      explanation: `Unable to generate explanation: ${error.message}`,
      relevantFiles: Object.keys(currentFiles),
      keyFeatures: []
    };
  }
}

// Keep backward compatibility
export const analyzeCodebaseForModification = analyzeForModification;

export default {
  analyze,
  analyzeCodebaseForModification,
  AnalysisMode
};
