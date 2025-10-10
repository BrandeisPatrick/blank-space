import { openai } from "../utils/openaiClient.js";
import { MODELS } from "../config/modelConfig.js";
import {
  THINKING_FRAMEWORK,
  IMPORT_RESOLUTION_RULES,
  COMPONENT_GRANULARITY,
  PRE_CHECK_INSTRUCTIONS,
  FILE_NAMING_CONVENTIONS,
  FOLDER_STRUCTURE_REQUIREMENTS,
  DETAILED_PLANNING_GUIDANCE
} from "../promptTemplates.js";

/**
 * Planning Agent
 * Creates a step-by-step plan for code generation/modification
 */
export async function createPlan(intent, userMessage, currentFiles = {}, analysisResult = null) {
  const filesContext = Object.keys(currentFiles).length > 0
    ? `\n\nCurrent files in the project:\n${Object.keys(currentFiles).map(f => `- ${f}`).join("\n")}`
    : "\n\nThis is a new empty project.";

  // Include analysis result if available
  const analysisContext = analysisResult
    ? `\n\nCodebase Analysis Result:\n${JSON.stringify(analysisResult, null, 2)}`
    : "";

  const systemPrompt = `You are a planning agent for React development.
Given a user request and the current project state, create a detailed plan.

${filesContext}

${analysisContext}

${THINKING_FRAMEWORK}

${FOLDER_STRUCTURE_REQUIREMENTS}

${PRE_CHECK_INSTRUCTIONS}

${COMPONENT_GRANULARITY}

${IMPORT_RESOLUTION_RULES}

${FILE_NAMING_CONVENTIONS}

${DETAILED_PLANNING_GUIDANCE}

Planning Guidelines:
- **CRITICAL**: Use proper folder structure - components go in components/, hooks in hooks/
- Analyze if the requested feature/change already exists
- Create separate files for each component or hook
- Keep components focused and under ~100 lines
- Identify all dependencies (both project files and npm packages)
- Plan for complete, functional implementations
- **File paths MUST include folders**: "components/TodoList.jsx" NOT "TodoList.jsx"
- **CRITICAL**: Provide detailed fileDetails for EVERY file you plan to create
${analysisResult ? "- **Use the analysis result** to determine which files to modify" : ""}

Respond ONLY with a JSON object in this format:
{
  "steps": ["Step 1 description", "Step 2 description", ...],
  "filesToCreate": ["App.jsx", "components/Header.jsx", "hooks/useTodos.js"],
  "filesToModify": ["components/TodoList.jsx"],
  "npmPackages": ["package-name"],
  "alreadyExists": false,
  "summary": "Brief summary of what will be done",
  "fileDetails": {
    "App.jsx": {
      "purpose": "Main entry point...",
      "requiredImports": "Import statements needed",
      "requiredState": "State variables (or 'None')",
      "requiredFunctions": "Function names and purposes",
      "keyFeatures": "List of features this file must implement"
    },
    "components/Header.jsx": {
      "purpose": "...",
      "requiredState": "...",
      "keyFeatures": "..."
    }
  }
}

IMPORTANT:
1. File paths in filesToCreate and filesToModify MUST use proper folder structure.
   ✅ Correct: "components/TodoList.jsx", "hooks/useTodos.js"
   ❌ Wrong: "TodoList.jsx", "useTodos.js"

2. EVERY file in filesToCreate MUST have a corresponding entry in fileDetails with:
   - purpose: What this file does
   - requiredState: State variables needed (be specific!)
   - requiredFunctions: Function names and what they do
   - initialData: Exact initial values for complex data (e.g., chess pieces)
   - dataStructure: How data is organized (arrays, objects, nested)
   - keyFeatures: Complete list of features that must work

3. For complex apps (games, forms, dashboards), be VERY detailed in initialData and dataStructure.
   Example: Chess board must specify ALL 32 piece positions, not just "chess pieces".`;

  try {
    // GPT-5 models have different parameter requirements
    const isGPT5 = MODELS.PLANNER.includes("gpt-5");
    const tokenParam = isGPT5 ? { max_completion_tokens: 1500 } : { max_tokens: 1500 };
    const tempParam = isGPT5 ? {} : { temperature: 0.5 }; // GPT-5 only supports default temperature

    const response = await openai.chat.completions.create({
      model: MODELS.PLANNER,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Intent: ${intent}\nRequest: ${userMessage}` }
      ],
      ...tempParam,
      ...tokenParam
    });

    let content = response.choices[0].message.content;

    // Clean markdown code fences if present
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    return JSON.parse(content);
  } catch (error) {
    console.error("Planning error:", error);
    return {
      steps: ["Generate basic component"],
      filesToCreate: ["App.jsx"],
      filesToModify: [],
      summary: "Create a basic React component"
    };
  }
}
