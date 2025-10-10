import { openai } from "../utils/openaiClient.js";
import { MODELS } from "../config/modelConfig.js";
import { THINKING_FRAMEWORK } from "../promptTemplates.js";

/**
 * Codebase Analyzer Agent
 * Analyzes the entire codebase to determine what needs to be modified
 * This agent has full context of all files to make intelligent decisions
 */
export async function analyzeCodebaseForModification(userMessage, currentFiles = {}) {
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
    // GPT-5 models have different parameter requirements
    const isGPT5 = MODELS.ANALYZER.includes("gpt-5");
    const tokenParam = isGPT5 ? { max_completion_tokens: 1500 } : { max_tokens: 1500 };
    const tempParam = isGPT5 ? {} : { temperature: 0.3 }; // GPT-5 only supports default temperature

    const response = await openai.chat.completions.create({
      model: MODELS.ANALYZER,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analyze the codebase for this modification request: "${userMessage}"\n\nCodebase:\n${filesContext}`
        }
      ],
      ...tempParam,
      ...tokenParam
    });

    let content = response.choices[0].message.content;

    // Clean markdown code fences if present
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    return JSON.parse(content);
  } catch (error) {
    console.error("Codebase analysis error:", error);
    return {
      needsAnalysis: false,
      filesToModify: [],
      changeTargets: {},
      reasoning: `Analysis error: ${error.message}`
    };
  }
}
