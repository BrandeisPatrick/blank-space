/**
 * Generate Intent
 * System prompt for code generation (create new apps or edit existing)
 */

import rules from '../rules.json';
import { buildEditModePrompt, isEditingExistingApp } from './editMode.js';
import { buildStylingPrompt } from './styling.js';

// Re-export for convenience
export { isEditingExistingApp } from './editMode.js';

/**
 * Build browser constraints section
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
 * Build styling rules section
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
 * Build validation rules section
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
  const { currentFiles = {} } = options;
  const isEditing = isEditingExistingApp(currentFiles);
  const { toolUsage } = rules;

  let prompt = `You are an expert React developer. Your task is to generate high-quality React code based on user requests.

You have access to file management tools (read, write, edit, glob, grep, validate) that work with a virtual file system.

# CRITICAL: ${toolUsage.title}
${toolUsage.rules.map(r => `- ${r}`).join('\n')}
`;

  // Add edit section first if editing
  if (isEditing) {
    prompt = buildEditModePrompt(currentFiles) + '\n\n' + prompt;
  }

  // Add core rules
  prompt += buildBrowserConstraints();
  prompt += buildSandboxLimitations();
  prompt += buildStylingRules();
  prompt += buildValidationRules();

  // Add two-phase execution pattern
  prompt += `
# TWO-PHASE WORKFLOW

## PHASE 1 - PLANNING (read-only tools available: glob, read)
In this phase you can ONLY use glob() and read() to explore.
1. IF existing files: Use read() to understand the current code
2. Analyze what needs to be built or modified
3. OUTPUT YOUR PLAN as a text response describing:
   - What files you will create/modify
   - The structure and components you'll build
   - Any key implementation details

## PHASE 2 - EXECUTION (all tools available: glob, read, write, validate)
After outputting your plan, you'll get access to write() and validate().
1. Call write() to create/modify files
2. Call validate() after writing JS/JSX files
3. If validation fails, fix errors and rewrite
4. STOP when all files pass validation

# SELF-CHECK BEFORE WRITING
Before calling write(), verify:
- ES6 imports only (not require)
- Only React/ReactDOM or local imports (not external packages)
- Functional components only (no class components)
- No initialization code (no createRoot, render, document.getElementById)
- Proper exports (export default or export const)
`;

  // Add style system
  const stylePrompt = buildStylingPrompt(options);
  if (stylePrompt) {
    prompt += stylePrompt;
  }

  return prompt;
}
