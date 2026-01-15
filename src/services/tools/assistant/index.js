/**
 * Assistant Tools Export
 * Document tools for the Assistant Agent
 */

export { docReadTool } from './docRead.js';
export { docWriteTool } from './docWrite.js';
export { docEditTool } from './docEdit.js';
export { docListTool } from './docList.js';

// Export as array for easy registration
export const assistantTools = async () => {
  const { docReadTool } = await import('./docRead.js');
  const { docWriteTool } = await import('./docWrite.js');
  const { docEditTool } = await import('./docEdit.js');
  const { docListTool } = await import('./docList.js');

  return [docReadTool, docWriteTool, docEditTool, docListTool];
};

// Read-only tools for planning phase
export const assistantReadOnlyTools = async () => {
  const { docReadTool } = await import('./docRead.js');
  const { docListTool } = await import('./docList.js');

  return [docReadTool, docListTool];
};

export default assistantTools;
