/**
 * Generate Intent Prompt
 * System prompt for code generation (create new apps or edit existing)
 */

import rules from '../rules.json';
import { buildStylePrompt } from '../../stylePresets/stylePromptBuilder.js';

/**
 * Check if we're editing an existing app
 */
export function isEditingExistingApp(currentFiles) {
  return Object.keys(currentFiles || {}).length > 0;
}

/**
 * Build edit mode section
 */
function buildEditSection(currentFiles) {
  const fileList = Object.keys(currentFiles).map(f => `- ${f}`).join('\n');

  return `
# EDITING AN EXISTING APP (CRITICAL - READ THIS FIRST)
You are modifying an EXISTING application, not creating a new one from scratch.

## MANDATORY FIRST STEP:
Before making ANY changes, you MUST use read() to read the existing files.
This is NON-NEGOTIABLE. Do NOT skip this step.

## CURRENT FILES (READ THESE FIRST):
${fileList}

## STRICT RULES FOR EDITING:
1. READ FIRST: Use read('App.jsx') and read other files BEFORE writing anything
2. PRESERVE APP TYPE: If it's a browser app, keep it as a browser. If it's a calculator, keep it as a calculator.
3. TARGETED CHANGES ONLY: Make ONLY the specific changes the user requested
4. KEEP ALL FEATURES: Do NOT remove or change existing features unless explicitly asked
5. MAINTAIN STRUCTURE: Keep the existing code structure, imports, state variables, and handlers
6. NO REWRITES: Do NOT rewrite files from scratch - modify the existing code

## WHAT NOT TO DO:
- Do NOT change the app's purpose or type
- Do NOT remove existing functionality
- Do NOT ignore the existing code structure
- Do NOT start writing without reading first
- Do NOT assume what the app does - READ IT

## CORRECT WORKFLOW:
1. read('App.jsx') - Understand the current app
2. read() other files if they exist
3. Identify what specific code needs to change
4. write() only the modified file(s) with targeted changes
`;
}

/**
 * Build browser constraints section from rules
 */
function buildBrowserConstraints() {
  const { browserConstraints: bc, noInitializationCode: nic, packageManagement: pm, framerMotion: fm } = rules;

  const banned = Object.entries(pm.banned)
    .map(([pkg, alt]) => `- ${pkg} → ${alt}`)
    .join('\n');

  return `
# ${bc.title}

ABSOLUTELY FORBIDDEN:
${bc.forbidden.map(f => `- ${f}`).join('\n')}

REQUIRED:
${bc.required.map(r => `- ${r}`).join('\n')}

Will cause white screen:
${bc.whiteScreenCauses.map(c => `- ${c}`).join('\n')}

# ${nic.title}
${nic.description}

FORBIDDEN: ${nic.forbidden.join(', ')}

CORRECT: ${nic.correct}

# ${pm.title}

SUPPORTED:
${pm.supported.map(s => `- ${s}`).join('\n')}

BANNED (use alternatives):
${banned}

# ${fm.title}
${fm.description}
CORRECT: ${fm.correct}
DO NOT: ${fm.forbidden.join(', ')}
`;
}

/**
 * Build sandbox limitations section
 */
function buildSandboxLimitations() {
  const { sandboxLimitations: sl } = rules;

  return `
# ${sl.title}

${sl.constraints.map(c => `**${c.name}**: ${c.problem} → ${c.solution}`).join('\n')}
`;
}

/**
 * Build styling section
 */
function buildStylingRules() {
  const { styling: s, responsiveDesign: rd } = rules;

  return `
# ${s.title}
${s.rules.map(r => `- ${r}`).join('\n')}

# ${rd.title}
${rd.approach}

Patterns: Layout "${rd.patterns.layout}", Grid "${rd.patterns.grid}", Spacing "${rd.patterns.spacing}"

Touch-friendly: ${rd.touchFriendly.join('; ')}
`;
}

/**
 * Build validation section
 */
function buildValidationRules() {
  const { validation: v } = rules;

  const errors = Object.entries(v.commonErrors)
    .map(([err, fix]) => `- "${err}" → ${fix}`)
    .join('\n');

  return `
# ${v.title}
${v.workflow.join(' → ')}

Common fixes:
${errors}
`;
}

/**
 * Build the complete generate prompt
 * @param {Object} options - Generation options
 * @returns {string} Complete system prompt for code generation
 */
export function buildGeneratePrompt(options = {}) {
  const {
    currentFiles = {},
    aiColorPalette = 'dark-professional',
    aiUIStyle = 'glassmorphism',
    isDarkTheme = true
  } = options;

  const isEditing = isEditingExistingApp(currentFiles);
  const { toolUsage } = rules;

  let prompt = `You are an expert React developer. Your task is to generate high-quality React code based on user requests.

You have access to file management tools (read, write, edit, glob, grep, validate) that work with a virtual file system.

# CRITICAL: ${toolUsage.title}
${toolUsage.rules.map(r => `- ${r}`).join('\n')}
`;

  // Add edit section first if editing
  if (isEditing) {
    prompt = buildEditSection(currentFiles) + '\n\n' + prompt;
  }

  // Add core rules
  prompt += buildBrowserConstraints();
  prompt += buildSandboxLimitations();
  prompt += buildStylingRules();
  prompt += buildValidationRules();

  // Add execution pattern
  prompt += `
# SELF-CHECK BEFORE WRITING
Before calling write(), verify:
- ES6 imports only (not require)
- Only React/ReactDOM or local imports (not external packages)
- Functional components only (no class components)
- No initialization code (no createRoot, render, document.getElementById)
- Proper exports (export default or export const)

# EXECUTION PATTERN
1. IF existing files: Use read() FIRST
2. Understand current code before modifications
3. Call write() to create/modify files
4. Fix validation errors immediately
5. Return results, do NOT describe the code
`;

  // Add style system
  const stylePrompt = buildStylePrompt({
    colorPaletteId: aiColorPalette,
    uiStyleId: aiUIStyle,
    isDarkTheme
  });

  if (stylePrompt) {
    prompt += stylePrompt;
  }

  return prompt;
}
