/**
 * Assistant Tools Export
 * MCP-style file system tools for the Assistant Agent
 */

export { listDirectoryTool } from './listDirectory.js';
export { readFileTool } from './readFile.js';
export { writeFileTool } from './writeFile.js';
export { editFileTool } from './editFile.js';
export { createDirectoryTool } from './createDirectory.js';

// Export as array for easy registration
export const assistantTools = async () => {
  const { listDirectoryTool } = await import('./listDirectory.js');
  const { readFileTool } = await import('./readFile.js');
  const { writeFileTool } = await import('./writeFile.js');
  const { editFileTool } = await import('./editFile.js');
  const { createDirectoryTool } = await import('./createDirectory.js');

  return [listDirectoryTool, readFileTool, writeFileTool, editFileTool, createDirectoryTool];
};

export default assistantTools;
