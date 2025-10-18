import { callLLMAndExtract } from "../utils/llmClient.js";
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
  PACKAGE_MANAGEMENT_RULES,
  NO_INITIALIZATION_CODE
} from "../promptTemplates.js";
import { consultAgent, ConsultationType } from "../agentConsultation.js";
import { agentConfig } from "../config/agentConfig.js";

/**
 * Code Generator Agent
 * Generates complete code for new files
 *
 * @param {object} planOrOptions - Either the plan object (old signature) or options object (new signature)
 * @param {string} userMessage - User's request (only for old signature)
 * @param {string} filename - File being generated (only for old signature)
 * @returns {string|object} - Either code string (old signature) or { code: string } (new signature)
 */
export async function generateCode(planOrOptions, userMessage, filename) {
  // Support both old signature (positional params) and new signature (object param)
  const isNewSignature = typeof planOrOptions === 'object' && planOrOptions.filename;

  const filename2 = isNewSignature ? planOrOptions.filename : filename;
  const uxDesign = isNewSignature ? planOrOptions.uxDesign : null;
  const architecture = isNewSignature ? planOrOptions.architecture : null;

  // Build a plan from the new signature if needed
  const plan = isNewSignature
    ? {
        ...uxDesign,  // UX design contains colorScheme, designStyle, appIdentity
        ...architecture,  // Architecture contains fileStructure, importPaths
        fileDetails: architecture?.fileDetails || {},
        summary: planOrOptions.purpose || 'Generate React component'
      }
    : planOrOptions;

  userMessage = isNewSignature ? (planOrOptions.purpose || 'Generate component') : userMessage;
  const systemPrompt = `You are an expert React code generator.
Generate clean, modern, production-ready React code with beautiful, contemporary UI/UX.

${PACKAGE_MANAGEMENT_RULES}

${NO_INITIALIZATION_CODE}

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

🎯 GENERATE CODE FOR THIS FILE ONLY: ${filename2}

Import Path Examples Based on File Location:
- If ${filename2} is "App.jsx": import TodoList from './components/TodoList'
- If ${filename2} is "components/TodoList.jsx": import TodoItem from './TodoItem'
- If ${filename2} is "components/TodoList.jsx" importing hook: import { useTodos} from '../hooks/useTodos'

CRITICAL: The code must be complete and functional. Every feature mentioned must work end-to-end.

${SINGLE_FILE_OUTPUT_ONLY}

${RAW_CODE_OUTPUT_ONLY}

FINAL REMINDER: Generate ONLY ${filename2}. Your response must be ONLY raw code for this ONE file. Start with import/const/function, end with closing brace. NO backticks, NO markdown, NO explanations, NO other files.`;

  // Extract detailed specifications for this file (if available)
  const fileSpec = plan.fileDetails?.[filename2];

  // Build dynamic styling and UX instructions from plan
  let customStyleGuide = "";
  if (plan.colorScheme && plan.designStyle) {
    const cs = plan.colorScheme;
    const ds = plan.designStyle;
    const identity = plan.appIdentity || {};
    const ux = plan.uxPatterns || {};
    const content = plan.contentStrategy || {};

    customStyleGuide = `\n\n🎨 DESIGN SYSTEM & UX SPECIFICATIONS (MANDATORY - OVERRIDE DEFAULTS):

════════════════════════════════════════════
📱 APP IDENTITY & BRANDING
════════════════════════════════════════════
**App Name**: ${identity.name || 'Use the planned name, NOT generic titles'}
**Tagline**: ${identity.tagline || 'Use the planned tagline'}
**Tone**: ${identity.tone || 'Match the planned tone/voice'}

🚨 CRITICAL BRANDING RULE - READ CAREFULLY:
The app name "${identity.name}" and tagline "${identity.tagline}" must appear EXACTLY ONCE on the page.
- ❌ DO NOT repeat the app name in multiple places
- ❌ DO NOT add the app name to cards, sections, or containers
- ❌ DO NOT use the app name as a subtitle or secondary heading
- ✅ ONLY place branding where explicitly specified in the branding placement rules below

════════════════════════════════════════════
🎨 VISUAL DESIGN
════════════════════════════════════════════
**Theme**: ${cs.theme}
**Aesthetic**: ${ds.aesthetic}

**Color Palette**:
- Background: ${cs.background}
- Primary: ${cs.primary}
- Secondary: ${cs.secondary}
- Accent: ${cs.accent}
- Text: ${cs.text.primary} (headings), ${cs.text.secondary} (body), ${cs.text.muted} (muted)
- Surface: ${cs.surface}
- Border: ${cs.border}

**Design Style**:
- Corners: ${ds.corners}
- Shadows: ${ds.shadows}
- Effects: ${ds.effects}

════════════════════════════════════════════
✨ UX PATTERNS TO IMPLEMENT
════════════════════════════════════════════
${ux.userFeedback ? `**User Feedback**: ${ux.userFeedback}` : ''}
${ux.informationArchitecture ? `**Information Architecture**: ${ux.informationArchitecture}` : ''}
${ux.emptyStates ? `**Empty States**: ${ux.emptyStates}` : ''}
${ux.microInteractions ? `**Micro-interactions**: ${ux.microInteractions}` : ''}
${ux.visualIndicators ? `**Visual Indicators**: ${ux.visualIndicators}` : ''}

════════════════════════════════════════════
📝 CONTENT STRATEGY
════════════════════════════════════════════
${content.placeholders ? `**Placeholders**: ${content.placeholders}` : ''}
${content.buttonLabels ? `**Button Labels**: ${content.buttonLabels}` : ''}
${content.emptyStateMessage ? `**Empty State**: ${content.emptyStateMessage}` : ''}
${content.feedbackMessages ? `**Feedback**: ${content.feedbackMessages}` : ''}

════════════════════════════════════════════
🚨 IMPLEMENTATION REQUIREMENTS
════════════════════════════════════════════
1. Use the EXACT app name and tagline specified above
2. Implement ALL planned UX patterns (toasts, sections, counts, etc.)
3. Use the specified colors (NOT default slate-900/purple/cyan)
4. Follow the content strategy for all text in the UI
5. Add the planned micro-interactions and feedback mechanisms

════════════════════════════════════════════
🎯 BRANDING PLACEMENT RULES (CRITICAL)
════════════════════════════════════════════
⚠️  PENALTY FOR DUPLICATION: Code with branding appearing more than once WILL BE REJECTED

**WHERE to Place App Name & Tagline:**

IF you are generating a Header component:
  ✅ Put branding in Header component ONLY - ONE TIME
  ❌ DO NOT put it in App.jsx or other components
  ❌ DO NOT repeat it anywhere else in this file

IF you are generating App.jsx and there's NO separate Header:
  ✅ Put branding at the TOP of App.jsx ONCE - LITERALLY ONCE
  ❌ DO NOT repeat it in nested sections, cards, or containers
  ❌ DO NOT add it as a subtitle or secondary title

IF you are generating ANY OTHER component (TodoList, Calculator, Form, etc.):
  ❌ DO NOT include app name or tagline AT ALL
  ❌ DO NOT repeat branding - it's already in Header/App
  ❌ ZERO occurrences of the app name in this file

**Correct Structure (App.jsx with no Header):**
<div className="page-container">
  {/* BRANDING - APPEARS EXACTLY ONCE */}
  <h1>${identity.name}</h1>
  <p>${identity.tagline}</p>

  {/* MAIN CONTENT - NO BRANDING ANYWHERE */}
  <div className="content-section">
    <h2>Section Title (NOT app name)</h2>
    {/* Functional UI only */}
  </div>
</div>

🚨 FOR THE FILE "${filename2}":
${fileSpec?.brandingPlacement
  ? `📍 Branding Guidance: ${fileSpec.brandingPlacement}`
  : filename2.includes('Header') || filename2 === 'App.jsx'
    ? '✅ This file SHOULD contain branding (name + tagline) - ONCE at the top, then NEVER again'
    : '❌ This file should contain ZERO branding - no app name, no tagline anywhere'}

Example Code Patterns:
- Title: <h1 className="text-4xl font-bold ${cs.text.primary}">${identity.name || 'AppName'}</h1>
- Subtitle: <p className="${cs.text.muted}">${identity.tagline || 'Tagline'}</p>
- Primary Button: className="bg-${cs.primary} hover:bg-${cs.primary.replace('-500', '-600')} ${ds.corners}"
- Cards: className="${cs.surface} ${cs.border} ${ds.corners} ${ds.shadows === 'heavy' ? 'shadow-2xl' : 'shadow-lg'}"
`;
  }

  // Build detailed context if specifications exist
  let detailedContext = "";
  if (fileSpec) {
    detailedContext = `\n\n📋 DETAILED SPECIFICATIONS FOR ${filename2}:

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
    // CONSULTATION: Ask analyzer about dependencies before generating (if enabled)
    let dependencyContext = '';
    if (agentConfig.consultationsEnabled) {
      console.log('💬 Generator consulting Analyzer about dependencies...');
      const depConsultation = await consultAgent(
        'generator',
        'analyzer',
        ConsultationType.ASK_DEPENDENCIES,
        `What dependencies are needed for ${filename2}?`,
        {
          userMessage,
          currentFiles: {} // Generator creates new files, so no current files
        }
      );

      if (depConsultation.success && depConsultation.dependencies) {
        dependencyContext = `\n\nREQUIRED DEPENDENCIES (from analysis):\n${depConsultation.dependencies.join(', ')}\n`;
        console.log('✅ Dependencies identified:', depConsultation.dependencies);
      }
    }

    let code = await callLLMAndExtract({
      model: MODELS.GENERATOR,
      systemPrompt,
      userPrompt: `I need you to generate the file: ${filename2}${customStyleGuide}${detailedContext}${dependencyContext}\n\nGeneral Context: ${plan.summary}\n\nUser's request: ${userMessage}\n\nRemember: Generate ONLY the code for ${filename2}. Do not generate any other files. Follow ALL specifications above, especially the color scheme and design style.`,
      maxTokens: 8000,  // Increased for GPT-5 reasoning tokens + output (complex files need more)
      temperature: 0.7
    });

    // Step 1: Clean generated code (remove markdown, etc.)
    code = cleanGeneratedCode(code);

    // Step 2: Auto-fix common issues
    code = autoFixCommonIssues(code, filename2);

    // Step 3: Validate runtime safety
    const validation = validateRuntimeSafety(code, filename2);

    if (!validation.valid) {
      console.warn(`⚠️  Validation errors in ${filename2}:`);
      validation.errors.forEach(err => {
        console.warn(`  Line ${err.line}: ${err.message}`);
      });
    }

    if (validation.warnings.length > 0) {
      console.warn(`⚠️  Validation warnings in ${filename2}:`);
      validation.warnings.forEach(warn => {
        console.warn(`  Line ${warn.line}: ${warn.message}`);
      });
    }

    // Return object for new signature, string for old signature
    return isNewSignature ? { code } : code;
  } catch (error) {
    console.error("Code generation error:", error);
    const errorCode = `// Error generating code for ${filename2}\nexport default function Component() {\n  return <div>Component</div>;\n}`;
    return isNewSignature ? { code: errorCode } : errorCode;
  }
}
