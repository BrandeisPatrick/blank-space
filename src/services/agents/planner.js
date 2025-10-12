import { callLLMForJSON } from "../utils/llmClient.js";
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
- **NEW**: Choose a unique color scheme and design style for this app
${analysisResult ? "- **Use the analysis result** to determine which files to modify" : ""}

🎨 DESIGN SYSTEM & UX REQUIREMENTS:
You MUST design a complete, polished user experience. Think holistically:

**1. Visual Design & COLOR CREATIVITY** (CRITICAL):

🚨 FORBIDDEN - Boring Color Patterns (WILL BE REJECTED):
- ❌ Monochrome palettes (all blue, all gray, single color family)
- ❌ Generic corporate: blue-500 + white + gray (BORING!)
- ❌ Plain solid backgrounds: bg-white, bg-gray-50, bg-blue-50 without gradients
- ❌ No contrast: using only similar shades throughout
- ❌ Single accent color: one primary color + only neutrals

✅ REQUIRED - Creative & Memorable Colors:
- **Use 3+ DISTINCT colors** (not just shades of one color)
- **Bold contrasts**: Dark bg with bright accents OR vibrant backgrounds with contrasting elements
- **Unexpected combinations**: orange+teal, pink+green, purple+yellow, rose+cyan, emerald+amber
- **Multi-color gradients**: from-[color1] via-[color2] to-[color3] for backgrounds
- **Variety across UI**: Different colors for buttons, cards, text, borders, accents

🎨 EXCITING PALETTE INSPIRATION:
- **Sunset**: orange-500, pink-500, rose-600 with slate-900 bg
- **Ocean**: teal-400, cyan-500, indigo-600
- **Forest**: emerald-500, lime-400, green-700
- **Neon**: fuchsia-500, cyan-400, purple-600 on dark
- **Tropical**: orange-400, yellow-500, pink-500
- **Aurora**: violet-500, purple-400, pink-500, blue-500

**Design Style**: Pick aesthetics that enhance colors (glassmorphism, gradient-heavy, vibrant minimalist)
**Theme**: Choose dark OR light, but make it VIBRANT and memorable

**2. App Identity & Branding**:
- **Unique Name**: NOT generic titles - think creative, memorable names
  - Give the app personality that matches its purpose
  - Make it engaging and distinctive, not boring
- **Tagline**: Compelling description, not boring "Organize your tasks"
  - Make it engaging and match the app's tone
  - Examples: "Organize your day, accomplish your goals" vs "Manage your tasks efficiently"

**3. UX Patterns** (adapt to app type):
- **User Feedback**: How users know their actions worked (toasts, animations, confirmations)
- **Information Architecture**: Sections, categories, groupings (e.g., "COMPLETED (2)", "ACTIVE")
- **State Management**: Empty states, loading states, error states with helpful messages
- **Micro-interactions**: Smooth transitions, hover effects, satisfying animations
- **Visual Indicators**: Counts, badges, progress indicators where relevant

**4. Content Strategy**:
- **Tone/Voice**: Professional, playful, motivational, minimal - match to purpose
- **Copy Quality**: Thoughtful labels, placeholders, empty state messages
- **Button Labels**: Specific and action-oriented (not just "Submit", "Add")

**CRITICAL**: These aren't templates - think intelligently about what THIS specific app needs.

Respond ONLY with a JSON object in this format:
{
  "steps": ["Step 1 description", "Step 2 description", ...],
  "filesToCreate": ["App.jsx", "components/Header.jsx", "hooks/useData.js"],
  "filesToModify": ["components/SomeComponent.jsx"],
  "npmPackages": ["package-name"],
  "alreadyExists": false,
  "summary": "Brief summary of what will be done",
  "appIdentity": {
    "name": "TaskFlow (NOT generic 'To-Do List')",
    "tagline": "Organize your day, accomplish your goals (compelling, not boring)",
    "tone": "professional | playful | motivational | minimal | friendly"
  },
  "colorScheme": {
    "theme": "dark or light",
    "background": "bg-gradient-to-br from-[color] via-[color] to-[color]",
    "primary": "color-500 (e.g., blue-500, rose-500)",
    "secondary": "color-500",
    "accent": "color-400",
    "text": {
      "primary": "color for headings",
      "secondary": "color for body text",
      "muted": "color for subtle text"
    },
    "surface": "bg-color for cards/containers",
    "border": "border-color"
  },
  "designStyle": {
    "aesthetic": "glassmorphism | minimalist | brutalist | gradient-heavy | neumorphism | flat",
    "corners": "rounded-xl | rounded-2xl | rounded-lg | rounded-sm",
    "shadows": "heavy | moderate | subtle | none",
    "effects": "backdrop-blur, glows, animations",
    "styleRationale": "Why this style fits this app"
  },
  "uxPatterns": {
    "userFeedback": "toast notifications for add/delete/complete actions",
    "informationArchitecture": "sections like COMPLETED (2), ACTIVE (5)",
    "emptyStates": "helpful message when no data",
    "microInteractions": "smooth transitions on check/delete, hover effects",
    "visualIndicators": "count badges, progress bars, status icons"
  },
  "contentStrategy": {
    "placeholders": "Add a new task... (specific and engaging)",
    "buttonLabels": "Use action verbs that match context",
    "emptyStateMessage": "Your task list is ready! (not just 'No items')",
    "feedbackMessages": "Task added successfully (confirm actions)"
  },
  "fileDetails": {
    "App.jsx": {
      "purpose": "Main entry point...",
      "requiredImports": "Import statements needed",
      "requiredState": "State variables (or 'None')",
      "requiredFunctions": "Function names and purposes",
      "keyFeatures": "List of features this file must implement",
      "brandingPlacement": "IF NO HEADER: Show app name + tagline ONCE at top, then NEVER again. IF HEADER EXISTS: NO BRANDING"
    },
    "components/Header.jsx": {
      "purpose": "...",
      "requiredState": "...",
      "keyFeatures": "...",
      "brandingPlacement": "Show app name + tagline ONCE - this is the ONLY file with branding"
    },
    "components/MainFeature.jsx": {
      "purpose": "...",
      "keyFeatures": "...",
      "brandingPlacement": "NO BRANDING - zero occurrences of app name/tagline in this file"
    },
    "components/SecondaryFeature.jsx": {
      "purpose": "...",
      "brandingPlacement": "NO BRANDING - do not use app name or tagline anywhere"
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
   - brandingPlacement: WHERE app name/tagline should appear (CRITICAL to avoid duplication!)

3. BRANDING PLACEMENT RULES (MANDATORY FOR EVERY FILE):
   🚨 CRITICAL: Branding (app name + tagline) must appear EXACTLY ONCE across all files
   - If you plan a Header component → branding goes in Header ONLY, specify "Show app name + tagline ONCE at top"
   - If no Header component → branding goes in App.jsx ONLY, specify "Show app name + tagline ONCE at top"
   - ALL other components → MUST specify "NO BRANDING - zero occurrences of app name/tagline"
   - ❌ WRONG: "Show app name" (ambiguous)
   - ✅ CORRECT: "NO BRANDING - do not use app name or tagline anywhere in this file"
   - ❌ PENALTY: If multiple files have branding, the plan will be rejected

4. For complex apps (games, forms, dashboards), be VERY detailed in initialData and dataStructure.
   Example: Chess board must specify ALL 32 piece positions, not just "chess pieces".`;

  try {
    return await callLLMForJSON({
      model: MODELS.PLANNER,
      systemPrompt,
      userPrompt: `Intent: ${intent}\nRequest: ${userMessage}`,
      maxTokens: 1500,
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
