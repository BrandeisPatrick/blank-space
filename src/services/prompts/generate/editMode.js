/**
 * Edit Mode
 * Instructions for modifying existing apps
 */

/**
 * Check if we're editing an existing app
 */
export function isEditingExistingApp(currentFiles) {
  return Object.keys(currentFiles || {}).length > 0;
}

/**
 * Build edit mode instructions
 */
export function buildEditModePrompt(currentFiles) {
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
