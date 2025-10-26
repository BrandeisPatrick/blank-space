import { callLLMAndExtract } from "../utils/llm/llmClient.js";
import { MODELS } from "../config/modelConfig.js";
import { MemoryBank } from "../utils/memory/MemoryBank.js";
import { getPromptLoader } from "../utils/prompts/PromptLoader.js";
import { cleanGeneratedCode } from "../utils/code/codeCleanup.js";
import { validateRuntimeSafety } from "../utils/validation/runtimeValidation.js";
import { autoFixCommonIssues } from "../utils/code/autoFix.js";
import { extractColorScheme } from "../utils/code/colorExtractor.js";

/**
 * Code Writer Agent
 * Unified agent for both generating new code and modifying existing code
 *
 * Replaces: generator.js + modifier.js
 */

/**
 * Main code writing function
 * @param {Object} options - Configuration options
 * @param {string} options.mode - 'generate' | 'modify'
 * @param {string} options.filename - File being written
 * @param {string} [options.currentCode] - Current code (for modify mode)
 * @param {Object} [options.plan] - Plan object (for generate mode)
 * @param {Object} [options.uxDesign] - UX design system
 * @param {Object} [options.architecture] - File architecture
 * @param {Array} [options.features] - Features to implement
 * @param {Array} [options.dependencies] - Dependencies
 * @param {Array} [options.changeTargets] - Specific changes (for modify mode)
 * @param {string} [options.userMessage] - User's request
 * @param {ConversationLogger} [options.logger=null] - Optional conversation logger
 * @returns {Promise<string>} Generated or modified code
 */
export async function writeCode(options) {
  const {
    mode = 'generate',
    filename,
    currentCode,
    plan,
    uxDesign,
    architecture,
    features = [],
    dependencies = [],
    changeTargets = [],
    userMessage = '',
    purpose = '',
    logger = null
  } = options;

  if (mode === 'generate') {
    return await generateCode({
      filename,
      plan,
      uxDesign,
      architecture,
      features,
      dependencies,
      purpose,
      userMessage,
      logger
    });
  } else {
    return await modifyCode({
      filename,
      currentCode,
      userMessage,
      changeTargets,
      uxDesign,
      logger
    });
  }
}

/**
 * Generate new code
 */
async function generateCode({
  filename,
  plan,
  uxDesign,
  architecture,
  features,
  dependencies,
  purpose,
  userMessage,
  logger = null
}) {
  // Load persistent rules from Memory Bank
  const memory = new MemoryBank();
  const persistentRules = await memory.loadRules();

  // Load externalized prompt using PromptLoader
  const promptLoader = getPromptLoader();
  const systemPrompt = await promptLoader.loadCodeWriterGeneratePrompt({
    persistentRules,
    filename,
    purpose,
    uxDesign: uxDesign ? `🎨 DESIGN SYSTEM:\n${JSON.stringify(uxDesign, null, 2)}\n\nApply this design system consistently to all elements.` : '',
    architecture: architecture ? `📁 FILE ARCHITECTURE:\n${JSON.stringify(architecture, null, 2)}` : '',
    features: Array.isArray(features) && features.length > 0 ? `✨ FEATURES TO IMPLEMENT:\n${features.map((f, i) => `${i + 1}. ${f}`).join('\n')}` : '',
    dependencies: Array.isArray(dependencies) && dependencies.length > 0 ? `📦 DEPENDENCIES:\n${dependencies.join(', ')}` : ''
  });

  const userPrompt = `Generate complete, production-ready code for ${filename}.

Purpose: ${purpose || userMessage || 'React component'}

${plan?.fileDetails?.[filename] ? `File Specification:
${JSON.stringify(plan.fileDetails[filename], null, 2)}` : ''}

Generate the COMPLETE code now. Output ONLY the code, no explanations.`;

  try {
    let code = await callLLMAndExtract({
      model: MODELS.CODE_WRITER || MODELS.GENERATOR,
      systemPrompt,
      userPrompt,
      maxTokens: 4000,
      temperature: 0.7,
      logger
    });

    // Clean and validate
    code = cleanGeneratedCode(code);
    code = autoFixCommonIssues(code, filename);

    // Runtime safety validation
    const safetyCheck = validateRuntimeSafety(code);
    if (!safetyCheck.valid) {
      console.warn(`⚠️ Safety issues in ${filename}:`, safetyCheck.errors);
    }

    return code;
  } catch (error) {
    console.error(`Error generating code for ${filename}:`, error);
    // Return error fallback
    const errorCode = `// Error generating code for ${filename}\nexport default function Component() {\n  return <div>Component</div>;\n}`;
    return errorCode;
  }
}

/**
 * Modify existing code
 */
async function modifyCode({
  filename,
  currentCode,
  userMessage,
  changeTargets,
  uxDesign,
  logger = null
}) {
  // Load persistent rules from Memory Bank
  const memory = new MemoryBank();
  const persistentRules = await memory.loadRules();

  // Extract existing color scheme
  const existingColors = extractColorScheme(currentCode);

  // Build change targets context
  const targetContext = changeTargets && changeTargets.length > 0
    ? `\n\nSpecific changes to make:\n${changeTargets
        .map(t => `- ${t.pattern || t.description}: ${t.replacement || t.suggestion} (${t.reason || 'requested'})`).join('\n')}`
    : '';

  const colorContext = existingColors ? `\n\n🎨 EXISTING COLOR SCHEME (MAINTAIN CONSISTENCY):
- Backgrounds: ${existingColors.backgrounds}
- Gradients: ${existingColors.gradients}
- Text Colors: ${existingColors.textColors}
- Border Colors: ${existingColors.borderColors}
- Shadows: ${existingColors.shadows}

When adding new elements, use colors from this existing palette.` : '';

  // Load externalized prompt using PromptLoader
  const promptLoader = getPromptLoader();
  const systemPrompt = await promptLoader.loadCodeWriterModifyPrompt({
    persistentRules,
    colorContext,
    changeTargets: targetContext
  });

  const userPrompt = `Modify ${filename} based on this request:

${userMessage}

CURRENT CODE:
\`\`\`javascript
${currentCode}
\`\`\`

Return the COMPLETE modified code. Output ONLY the code, no explanations.`;

  try {
    let code = await callLLMAndExtract({
      model: MODELS.CODE_WRITER || MODELS.MODIFIER,
      systemPrompt,
      userPrompt,
      maxTokens: 4000,
      temperature: 0.7,
      logger
    });

    // Clean and validate
    code = cleanGeneratedCode(code);
    code = autoFixCommonIssues(code, filename);

    return code;
  } catch (error) {
    console.error(`Error modifying code for ${filename}:`, error);
    // Return original code if modification fails
    return currentCode;
  }
}

export default {
  writeCode
};
