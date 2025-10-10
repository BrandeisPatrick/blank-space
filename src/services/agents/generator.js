import { openai } from "../utils/openaiClient.js";
import { MODELS } from "../config/modelConfig.js";
import { cleanGeneratedCode } from "../utils/codeCleanup.js";
import { validateRuntimeSafety } from "../utils/runtimeValidation.js";
import { autoFixCommonIssues } from "../utils/autoFix.js";
import {
  THINKING_FRAMEWORK,
  CODE_FORMATTING_STANDARDS,
  MODERN_UI_STANDARDS,
  FOLDER_STRUCTURE_REQUIREMENTS,
  COMPLETENESS_PRINCIPLES,
  SIMPLICITY_GUIDELINES,
  IMPORT_RESOLUTION_RULES,
  COMPONENT_GRANULARITY,
  SINGLE_FILE_OUTPUT_ONLY,
  RAW_CODE_OUTPUT_ONLY,
  PACKAGE_MANAGEMENT_RULES
} from "../promptTemplates.js";

/**
 * Code Generator Agent
 * Generates complete code for new files
 */
export async function generateCode(plan, userMessage, filename) {
  const systemPrompt = `You are an expert React code generator.
Generate clean, modern, production-ready React code with beautiful, contemporary UI/UX.

${PACKAGE_MANAGEMENT_RULES}

${SINGLE_FILE_OUTPUT_ONLY}

${RAW_CODE_OUTPUT_ONLY}

${THINKING_FRAMEWORK}

${CODE_FORMATTING_STANDARDS}

${MODERN_UI_STANDARDS}

${FOLDER_STRUCTURE_REQUIREMENTS}

${COMPLETENESS_PRINCIPLES}

${SIMPLICITY_GUIDELINES}

${IMPORT_RESOLUTION_RULES}

${COMPONENT_GRANULARITY}

Code Generation Guidelines:
- Use functional components with hooks
- **CRITICAL**: Apply modern Tailwind CSS styling to ALL components (shadows, rounded corners, proper colors, hover states)
- **CRITICAL**: Use correct import paths based on file location
  * If generating App.jsx: import from './components/...', './hooks/...'
  * If generating a component: import other components from './ComponentName' or '../hooks/...'
- Include ALL necessary imports (both npm packages and local files)
- Generate COMPLETE, FULLY FUNCTIONAL code
- No placeholders, no TODOs, no partial implementations
- Keep components under ~100 lines when possible
- Use modern ES6+ syntax
- Make the UI beautiful and polished (not basic/unstyled)
- Add helpful comments only where complexity requires explanation
- Make code readable and maintainable
- Don't overengineer - create the minimum viable solution

🎯 GENERATE CODE FOR THIS FILE ONLY: ${filename}

Import Path Examples Based on File Location:
- If ${filename} is "App.jsx": import TodoList from './components/TodoList'
- If ${filename} is "components/TodoList.jsx": import TodoItem from './TodoItem'
- If ${filename} is "components/TodoList.jsx" importing hook: import { useTodos } from '../hooks/useTodos'

CRITICAL: The code must be complete and functional. Every feature mentioned must work end-to-end.

${SINGLE_FILE_OUTPUT_ONLY}

${RAW_CODE_OUTPUT_ONLY}

FINAL REMINDER: Generate ONLY ${filename}. Your response must be ONLY raw code for this ONE file. Start with import/const/function, end with closing brace. NO backticks, NO markdown, NO explanations, NO other files.`;

  // Extract detailed specifications for this file (if available)
  const fileSpec = plan.fileDetails?.[filename];

  // Build detailed context if specifications exist
  let detailedContext = "";
  if (fileSpec) {
    detailedContext = `\n\n📋 DETAILED SPECIFICATIONS FOR ${filename}:

Purpose: ${fileSpec.purpose || "N/A"}

${fileSpec.requiredState ? `Required State Variables: ${fileSpec.requiredState}` : ""}

${fileSpec.requiredFunctions ? `Required Functions: ${fileSpec.requiredFunctions}` : ""}

${fileSpec.requiredImports ? `Required Imports: ${fileSpec.requiredImports}` : ""}

${fileSpec.initialData ? `Initial Data: ${fileSpec.initialData}` : ""}

${fileSpec.dataStructure ? `Data Structure: ${fileSpec.dataStructure}` : ""}

${fileSpec.keyFeatures ? `Key Features to Implement: ${fileSpec.keyFeatures}` : ""}

${fileSpec.styling ? `Styling Requirements: ${fileSpec.styling}` : ""}

${fileSpec.layoutStructure ? `Layout Structure: ${fileSpec.layoutStructure}` : ""}

${fileSpec.exports ? `Exports: ${fileSpec.exports}` : ""}

${fileSpec.returnedFunctions ? `Returned Functions: ${fileSpec.returnedFunctions}` : ""}

🎯 YOU MUST IMPLEMENT ALL THE ABOVE SPECIFICATIONS. Do not use placeholders or TODO comments.
If initialData is specified, initialize with REAL data, not empty arrays/null values.`;
  }

  try {
    // GPT-5 models have different parameter requirements
    const isGPT5 = MODELS.GENERATOR.includes("gpt-5");
    const tokenParam = isGPT5 ? { max_completion_tokens: 2000 } : { max_tokens: 2000 };
    const tempParam = isGPT5 ? {} : { temperature: 0.7 }; // GPT-5 only supports default temperature

    const response = await openai.chat.completions.create({
      model: MODELS.GENERATOR,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `I need you to generate the file: ${filename}${detailedContext}\n\nGeneral Context: ${plan.summary}\n\nUser's request: ${userMessage}\n\nRemember: Generate ONLY the code for ${filename}. Do not generate any other files. Follow ALL specifications above.` }
      ],
      ...tempParam,
      ...tokenParam
    });

    let code = response.choices[0].message.content;

    // Step 1: Clean generated code (remove markdown, etc.)
    code = cleanGeneratedCode(code);

    // Step 2: Auto-fix common issues
    code = autoFixCommonIssues(code, filename);

    // Step 3: Validate runtime safety
    const validation = validateRuntimeSafety(code, filename);

    if (!validation.valid) {
      console.warn(`⚠️  Validation errors in ${filename}:`);
      validation.errors.forEach(err => {
        console.warn(`  Line ${err.line}: ${err.message}`);
      });
    }

    if (validation.warnings.length > 0) {
      console.warn(`⚠️  Validation warnings in ${filename}:`);
      validation.warnings.forEach(warn => {
        console.warn(`  Line ${warn.line}: ${warn.message}`);
      });
    }

    return code;
  } catch (error) {
    console.error("Code generation error:", error);
    return `// Error generating code for ${filename}\nexport default function Component() {\n  return <div>Component</div>;\n}`;
  }
}
