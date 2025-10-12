import { callLLMAndExtract } from "../utils/llmClient.js";
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
import { consultAgent, ConsultationType } from "../agentConsultation.js";
import { agentConfig } from "../config/agentConfig.js";

/**
 * Extract color scheme from existing code to maintain consistency
 */
function extractColorScheme(code) {
  const colorPatterns = {
    backgrounds: code.match(/bg-[\w-]+/g) || [],
    gradients: code.match(/from-[\w-]+|via-[\w-]+|to-[\w-]+/g) || [],
    text: code.match(/text-[\w-]+/g) || [],
    borders: code.match(/border-[\w-]+/g) || [],
    shadows: code.match(/shadow-[\w-]+/g) || []
  };

  // Find most common colors
  const allColors = [
    ...colorPatterns.backgrounds,
    ...colorPatterns.gradients,
    ...colorPatterns.text
  ];

  if (allColors.length === 0) return null;

  return {
    backgrounds: [...new Set(colorPatterns.backgrounds)].slice(0, 3).join(', '),
    gradients: [...new Set(colorPatterns.gradients)].slice(0, 3).join(', '),
    textColors: [...new Set(colorPatterns.text)].slice(0, 3).join(', '),
    borderColors: [...new Set(colorPatterns.borders)].slice(0, 2).join(', '),
    shadows: [...new Set(colorPatterns.shadows)].slice(0, 2).join(', ')
  };
}

/**
 * Code Modifier Agent
 * Modifies existing code based on requirements
 * Can use analysis results for targeted modifications
 *
 * @param {string|object} currentCodeOrOptions - Either the code string (old signature) or options object (new signature)
 * @param {string} userMessage - User's modification request (only for old signature)
 * @param {string} filename - File being modified (only for old signature)
 * @param {Array} analysisTargets - Specific change targets (only for old signature)
 * @returns {string|object} - Either code string (old signature) or { code: string } (new signature)
 */
export async function modifyCode(currentCodeOrOptions, userMessage, filename, analysisTargets = null) {
  // Support both old signature (positional params) and new signature (object param)
  const isNewSignature = typeof currentCodeOrOptions === 'object' && currentCodeOrOptions.filename;

  const currentCode = isNewSignature ? currentCodeOrOptions.currentCode : currentCodeOrOptions;
  userMessage = isNewSignature ? currentCodeOrOptions.userMessage : userMessage;
  filename = isNewSignature ? currentCodeOrOptions.filename : filename;
  analysisTargets = isNewSignature ? (currentCodeOrOptions.changeTargets || currentCodeOrOptions.analysisTargets) : analysisTargets;
  // If we have specific change targets from the analyzer, include them
  const targetContext = analysisTargets && analysisTargets.length > 0
    ? `\n\nSpecific changes to make in this file:\n${analysisTargets.map(t =>
        `- Replace "${t.pattern}" with "${t.replacement}" (${t.reason})`
      ).join("\n")}`
    : "";

  // Extract existing color scheme to maintain consistency
  const existingColors = extractColorScheme(currentCode);
  const colorContext = existingColors ? `\n\n🎨 EXISTING COLOR SCHEME (MAINTAIN CONSISTENCY):
This file currently uses these colors - maintain this palette when adding new elements:
- Backgrounds: ${existingColors.backgrounds}
- Gradients: ${existingColors.gradients}
- Text Colors: ${existingColors.textColors}
- Border Colors: ${existingColors.borderColors}
- Shadows: ${existingColors.shadows}

CRITICAL: When adding new UI elements, use colors from this existing palette to maintain visual consistency.
DO NOT introduce new random colors that clash with the existing design.` : "";

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
${colorContext}

Import Path Awareness:
- If ${filename} is "App.jsx": keep imports as './components/...', './hooks/...'
- If ${filename} is "components/SomeComponent.jsx": use './' for same folder, '../hooks/...' for hooks
- Maintain consistency with existing import patterns in the file

CRITICAL: Only change what was requested. Everything else must remain identical.

${RAW_CODE_OUTPUT_ONLY}

FINAL REMINDER: Your response must be ONLY raw code. Start with import/const/function, end with closing brace. NO backticks, NO markdown, NO explanations.`;

  try {
    let approachGuidance = '';
    let bestPractices = '';

    // CONSULTATION: Ask planner and reviewer if consultations are enabled
    if (agentConfig.consultationsEnabled) {
      // CONSULTATION: Ask planner if we should modify or create new
      console.log('💬 Modifier consulting Planner about approach...');
      const plannerConsultation = await consultAgent(
        'modifier',
        'planner',
        ConsultationType.ASK_SHOULD_CREATE_NEW,
        `Should I modify ${filename} or create a new component?`,
        {
          currentFiles: { [filename]: currentCode },
          userMessage
        }
      );

      if (plannerConsultation.success) {
        approachGuidance = `\n\nAPPROACH GUIDANCE:\n${plannerConsultation.answer}\nRecommendation: ${plannerConsultation.recommendation}\n`;
        console.log('✅ Planner recommends:', plannerConsultation.recommendation);
      }

      // CONSULTATION: Ask reviewer for best practices
      console.log('💬 Modifier consulting Reviewer for best practices...');
      const reviewerConsultation = await consultAgent(
        'modifier',
        'reviewer',
        ConsultationType.ASK_BEST_PRACTICE,
        `What best practices should I follow when ${userMessage}?`,
        {
          code: currentCode,
          filename,
          userMessage
        }
      );

      if (reviewerConsultation.success) {
        bestPractices = `\n\nBEST PRACTICES TO FOLLOW:\n${reviewerConsultation.answer}\n`;
        console.log('✅ Reviewer advises:', reviewerConsultation.answer);
      }
    }

    const rawCode = await callLLMAndExtract({
      model: MODELS.MODIFIER,
      systemPrompt,
      userPrompt: `Current code:\n\`\`\`\n${currentCode}\n\`\`\`${approachGuidance}${bestPractices}\n\nModification request: ${userMessage}`,
      maxTokens: 2000,
      temperature: 0.7
    });

    const cleanedCode = cleanGeneratedCode(rawCode);

    // Return object for new signature, string for old signature
    return isNewSignature ? { code: cleanedCode } : cleanedCode;
  } catch (error) {
    console.error("Code modification error:", error);
    // Return object for new signature, string for old signature
    return isNewSignature ? { code: currentCode } : currentCode;
  }
}
