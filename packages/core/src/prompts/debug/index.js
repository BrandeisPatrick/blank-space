/**
 * Debug Intent
 * System prompt for fixing runtime errors and behavioral issues
 */

import { isInteractionIssue, buildInteractionDebugging } from './interaction.js';

// Re-export for convenience
export { isInteractionIssue } from './interaction.js';

/**
 * Build generic debugging instructions
 */
function buildGenericDebugging(hasUserDescription, hasErrors) {
  return `
# DIAGNOSTIC STEPS:

## Step 1: READ the code first
Use read() to examine App.jsx and ALL component files.

## Step 2: Diagnose the issue
${hasUserDescription ? `### For user-reported behavioral issues:
- TRACE the interaction flow from user action to expected result
- Find the event handler (onClick, onChange, etc.)
- Check if handler is attached to the correct element
- Check if handler function has correct logic
- Check if state updates trigger re-renders
- Look for CSS that might block interactions
` : ''}
${hasErrors ? `### For runtime errors:
- Identify the exact line/component causing the error
- Check for undefined variables, missing imports, or null references
` : ''}

## Step 3: Fix the root cause
Make targeted fixes, don't rewrite entire files.
`;
}

/**
 * Build common fixes section
 */
function buildCommonFixes() {
  return `
# COMMON ISSUES AND FIXES:

## Interaction not working
- Event handler not attached: Add onClick/onChange to the element
- Handler attached to wrong element: Move to the clickable element
- Wrong state variable: Check which state controls the behavior
- CSS blocking: Remove pointer-events: none

## "X is not defined"
- External library missing: CREATE a working replacement
- Variable typo: Fix the variable name
- Missing import: Add the import statement

## "Cannot read property of undefined"
- Add null checks: value?.property
- Add default values: data?.items || []
- Initialize state properly
`;
}

/**
 * Build the complete debug prompt
 * @param {Object} debugContext - { errors: [], userDescription: '' }
 * @param {Object} currentFiles - Current file map {filename: content}
 * @returns {string} Complete system prompt for debugging
 */
export function buildDebugPrompt(debugContext, currentFiles) {
  const { errors = [], userDescription = '' } = debugContext || {};
  const fileList = Object.keys(currentFiles || {}).map(f => `- ${f}`).join('\n');

  // Build problem section
  let problemSection = '';

  if (userDescription) {
    problemSection += `# USER REPORTS:
"${userDescription}"

This is a BEHAVIORAL issue - the app runs but doesn't work correctly.
`;
  }

  if (errors.length > 0) {
    const errorList = errors.map((err, i) =>
      `${i + 1}. ${err.message}${err.source ? ` (in ${err.source}${err.line ? `:${err.line}` : ''})` : ''}`
    ).join('\n');
    problemSection += `# RUNTIME ERRORS:
${errorList}
`;
  }

  // Choose debugging approach based on issue type
  const hasInteractionIssue = isInteractionIssue(userDescription);
  const debuggingSection = hasInteractionIssue
    ? buildInteractionDebugging()
    : buildGenericDebugging(!!userDescription, errors.length > 0);

  return `You are debugging a React application. Your job is to FIX the code so it WORKS.

${problemSection}
# CURRENT FILES:
${fileList}

# TWO-PHASE WORKFLOW

## PHASE 1 - PLANNING (read-only tools available: glob, read)
In this phase you can ONLY use glob() and read() to explore.
1. Use read() on EACH file listed above
2. Do NOT skip this step. Do NOT assume you know what the code does.
3. After reading, OUTPUT YOUR ANALYSIS as a text response:
   - What is the root cause of the error?
   - Which file(s) need to be modified?
   - What specific changes will you make?

## PHASE 2 - EXECUTION (all tools available: glob, read, write, validate)
After outputting your plan, you'll get access to write() and validate().
1. Implement your fix using write()
2. Call validate() to check for errors
3. If validation fails, fix and rewrite

${debuggingSection}

${buildCommonFixes()}

# CRITICAL RULES:
- READ ALL FILES FIRST before making changes
- Fix the ROOT CAUSE, not symptoms
- For interaction bugs: check EVENT HANDLERS first, not game logic
- DO NOT add console.logs as the fix
- DO NOT just add placeholder text
- The app MUST work after your fix
- Use Tailwind CSS for styling
- Keep the app's original purpose

Start by reading ALL the files listed above.`;
}
