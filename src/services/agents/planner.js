import { callLLMForJSON } from "../utils/llm/llmClient.js";
import { MODELS } from "../config/modelConfig.js";
import {
  THINKING_FRAMEWORK,
  IMPORT_RESOLUTION_RULES,
  COMPONENT_GRANULARITY,
  PRE_CHECK_INSTRUCTIONS,
  FILE_NAMING_CONVENTIONS,
  FOLDER_STRUCTURE_REQUIREMENTS,
  DETAILED_PLANNING_GUIDANCE,
  UNIVERSAL_UX_PRINCIPLES
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

${UNIVERSAL_UX_PRINCIPLES}

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
- **File paths MUST include folders**: "components/MainComponent.jsx" NOT "MainComponent.jsx"
- **CRITICAL**: Provide detailed fileDetails for EVERY file you plan to create
${analysisResult ? "- **Use the analysis result** to determine which files to modify" : ""}

🎨 DESIGN & UX PHILOSOPHY:

**Your Goal**: Create a beautiful, modern, polished app that feels professional and complete.

**Design Principles** (use your judgment):
- **Visual Appeal**: Make it look modern and attractive. Choose colors, styles, and layouts that work well together.
- **Creative Freedom**: You decide the color scheme, design style (glassmorphism, minimalist, gradient-heavy, etc.), and visual approach.
- **Quality Bar**: The app should look production-ready, not like a basic tutorial example.

**UX Essentials** (think about what makes sense for THIS app):
- **User Feedback**: Users should know when their actions succeed (confirmations, animations, visual feedback)
- **Information Architecture**: Organize content logically (sections, groupings, clear hierarchy)
- **Empty States**: Show helpful messages when there's no data, not just blank screens
- **Micro-interactions**: Smooth transitions and hover effects where appropriate
- **Copy Quality**: Use specific, engaging text (placeholders, button labels, messages)

**App Identity**:
- **Name**: Choose a creative, memorable name that fits the app's purpose
- **Tagline**: Write a compelling description that captures what the app does
- **Tone**: Match the personality to the use case (professional, playful, minimal, etc.)

**Layout Decisions** (you decide what works best):
- Component structure (header, main area, sidebar, etc.)
- Where to show branding (app name + tagline should appear once, in the most logical place)
- Information density and spacing
- Visual hierarchy and emphasis

**Remember**: These are guidelines, not rigid rules. Use your design judgment to create something that looks great and works well for the specific app being built.

🔧 CRITICAL JSON FORMATTING RULES (GPT-5 SPECIFIC):
1. Your response MUST be valid, complete JSON - no truncation allowed
2. Start your response with: <<<JSON>>>
3. End your response with: <<</JSON>>>
4. Include ALL required fields listed below - no omissions
5. Ensure all brackets [], braces {}, and quotes are properly closed
6. Before responding, verify your JSON is syntactically complete
7. If you're running out of space, prioritize completing the JSON structure over adding extra details

Respond ONLY with a JSON object in this EXACT format (wrapped in delimiters):
{
  "steps": ["Step 1 description", "Step 2 description", ...],
  "filesToCreate": ["App.jsx", "components/Header.jsx", "hooks/useData.js"],
  "filesToModify": ["components/SomeComponent.jsx"],
  "npmPackages": ["package-name"],
  "alreadyExists": false,
  "summary": "Brief summary of what will be done",
  "appIdentity": {
    "name": "Creative app name (not generic)",
    "tagline": "Compelling description",
    "tone": "professional | playful | motivational | minimal | friendly"
  },
  "designConcept": {
    "description": "Brief description of your design vision for this app",
    "colorScheme": "Your chosen color palette and theme (dark/light)",
    "visualStyle": "Your chosen aesthetic approach (glassmorphism, minimalist, etc.)",
    "layoutApproach": "How you're structuring the UI (header + main, sidebar layout, centered cards, etc.)"
  },
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
    },
    "components/MainFeature.jsx": {
      "purpose": "...",
      "keyFeatures": "..."
    }
  }
}

IMPORTANT:
1. File paths in filesToCreate and filesToModify MUST use proper folder structure.
   ✅ Correct: "components/ListComponent.jsx", "hooks/useData.js"
   ❌ Wrong: "ListComponent.jsx", "useData.js"

2. EVERY file in filesToCreate MUST have a corresponding entry in fileDetails with:
   - purpose: What this file does
   - requiredState: State variables needed (be specific!)
   - requiredFunctions: Function names and what they do
   - initialData: Exact initial values for complex data (e.g., chess pieces)
   - dataStructure: How data is organized (arrays, objects, nested)
   - keyFeatures: Complete list of features that must work

3. For complex apps (games, forms, dashboards), be VERY detailed in initialData and dataStructure.
   Example: Chess board must specify ALL 32 piece positions, not just "chess pieces".

4. Branding (app name + tagline) should appear once in the most logical location based on your layout design.`;

  try {
    return await callLLMForJSON({
      model: MODELS.PLANNER,
      systemPrompt,
      userPrompt: `Intent: ${intent}\nRequest: ${userMessage}`,
      maxTokens: 6000,  // Increased for GPT-5 reasoning tokens + output
      temperature: 0.5
    });
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
