import { openai } from "../utils/openaiClient.js";
import { MODELS } from "../config/modelConfig.js";
import { cleanGeneratedCode } from "../utils/codeCleanup.js";
import {
  THINKING_FRAMEWORK,
  CODE_FORMATTING_STANDARDS,
  MODERN_UI_STANDARDS,
  FOLDER_STRUCTURE_REQUIREMENTS,
  PRE_CHECK_INSTRUCTIONS,
  SIMPLICITY_GUIDELINES,
  COMPLETENESS_PRINCIPLES,
  IMPORT_RESOLUTION_RULES,
  RAW_CODE_OUTPUT_ONLY
} from "../promptTemplates.js";

/**
 * Code Modifier Agent
 * Modifies existing code based on requirements
 * Can use analysis results for targeted modifications
 */
export async function modifyCode(currentCode, userMessage, filename, analysisTargets = null) {
  // If we have specific change targets from the analyzer, include them
  const targetContext = analysisTargets && analysisTargets.length > 0
    ? `\n\nSpecific changes to make in this file:\n${analysisTargets.map(t =>
        `- Replace "${t.pattern}" with "${t.replacement}" (${t.reason})`
      ).join("\n")}`
    : "";

  const systemPrompt = `You are an expert code modification agent.
Given existing code and a modification request, generate the COMPLETE updated code with modern, beautiful styling.

${RAW_CODE_OUTPUT_ONLY}

${THINKING_FRAMEWORK}

${CODE_FORMATTING_STANDARDS}

${MODERN_UI_STANDARDS}

${FOLDER_STRUCTURE_REQUIREMENTS}

${PRE_CHECK_INSTRUCTIONS}

${SIMPLICITY_GUIDELINES}

${COMPLETENESS_PRINCIPLES}

${IMPORT_RESOLUTION_RULES}

Code Modification Guidelines:
- **First, check if the requested change already exists** in the code
- Make ONLY the minimal changes needed to fulfill the request
- Preserve existing functionality unless explicitly asked to change it
- Maintain existing code style and structure
- **Maintain or improve modern Tailwind styling** - if code lacks modern styling, enhance it when modifying
- **Maintain proper folder structure and import paths**
  * If in App.jsx: imports should be './components/...', './hooks/...'
  * If in a component: imports should use relative paths based on folder location
- Add ALL necessary imports for new dependencies
- Generate COMPLETE, FULLY FUNCTIONAL code (no TODOs or placeholders)
- Don't overengineer - avoid adding complex error handling unless requested
- Add helpful comments only for new complex logic
- Ensure the code remains clean, readable, and visually appealing
${targetContext ? "\n- **CRITICAL**: Apply the specific changes listed above - these are targeted modifications based on codebase analysis" : ""}

Modify the code in: ${filename}
${targetContext}

Import Path Awareness:
- If ${filename} is "App.jsx": keep imports as './components/...', './hooks/...'
- If ${filename} is "components/SomeComponent.jsx": use './' for same folder, '../hooks/...' for hooks
- Maintain consistency with existing import patterns in the file

CRITICAL: Only change what was requested. Everything else must remain identical.

${RAW_CODE_OUTPUT_ONLY}

FINAL REMINDER: Your response must be ONLY raw code. Start with import/const/function, end with closing brace. NO backticks, NO markdown, NO explanations.`;

  try {
    // GPT-5 models have different parameter requirements
    const isGPT5 = MODELS.MODIFIER.includes("gpt-5");
    const tokenParam = isGPT5 ? { max_completion_tokens: 2000 } : { max_tokens: 2000 };
    const tempParam = isGPT5 ? {} : { temperature: 0.7 }; // GPT-5 only supports default temperature

    const response = await openai.chat.completions.create({
      model: MODELS.MODIFIER,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Current code:\n\`\`\`\n${currentCode}\n\`\`\`\n\nModification request: ${userMessage}` }
      ],
      ...tempParam,
      ...tokenParam
    });

    const rawCode = response.choices[0].message.content;
    return cleanGeneratedCode(rawCode);
  } catch (error) {
    console.error("Code modification error:", error);
    return currentCode; // Return original code on error
  }
}
