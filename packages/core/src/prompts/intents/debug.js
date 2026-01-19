/**
 * Debug Intent Prompt
 * System prompt for fixing runtime errors and behavioral issues
 */

/**
 * Check if description indicates an interaction issue
 */
export function isInteractionIssue(userDescription) {
  const lowerDesc = (userDescription || '').toLowerCase();
  return /can('t|not)?\s*(click|move|drag|select|interact|tap|touch|press)/i.test(lowerDesc) ||
    /not\s*(working|responding|clickable|draggable)/i.test(lowerDesc) ||
    /won('t|t)\s*(move|click|work|respond)/i.test(lowerDesc);
}

/**
 * Build interaction-specific debugging section
 */
function buildInteractionDebugging() {
  return `
# INTERACTION BUG DEBUGGING (CRITICAL)

The user reports they cannot click/move/interact with something. Check IN THIS ORDER:

## 1. EVENT HANDLER NOT ATTACHED
Find the element the user is trying to interact with. Does it have onClick, onMouseDown, etc.?

EXAMPLE BUG:
  <div className="chess-piece">{piece}</div>  // No onClick!

FIX:
  <div className="chess-piece" onClick={() => handleClick(row, col)}>{piece}</div>

## 2. EVENT HANDLER ON WRONG ELEMENT
The handler might be on a parent/sibling instead of the clickable element.

## 3. CSS BLOCKING CLICKS
Search for: pointer-events: none, z-index issues, overlays

## 4. HANDLER FUNCTION NOT DOING ANYTHING
- Empty or has early return
- Updates the wrong state
- Condition inside never passes

## 5. STATE NOT CONNECTED TO RENDER
State updates but component doesn't use that state to show the change.

# DEBUGGING PROCESS:
1. READ App.jsx - find all event handlers
2. FIND the element user interacts with
3. CHECK if that element has the right handler attached
4. IF NO HANDLER: Add it
5. IF HANDLER EXISTS: Trace the function logic
6. CHECK CSS for pointer-events issues
`;
}

/**
 * Build generic debugging section
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

  // Detect interaction issues
  const hasInteractionIssue = isInteractionIssue(userDescription);
  const debuggingSection = hasInteractionIssue
    ? buildInteractionDebugging()
    : buildGenericDebugging(!!userDescription, errors.length > 0);

  return `You are debugging a React application. Your job is to FIX the code so it WORKS.

${problemSection}
# CURRENT FILES:
${fileList}

# MANDATORY FIRST STEP - READ EVERYTHING:
You MUST read ALL files before making any changes. Use read() on each file listed above.
Do NOT skip this step. Do NOT assume you know what the code does.

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

Start by reading ALL the files listed above, then apply your fix.`;
}
