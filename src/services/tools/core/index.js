/**
 * Core Tools Export
 * All core tools for the tool-based orchestrator
 */

export { readTool } from './read.js';
export { writeTool } from './write.js';
export { editTool } from './edit.js';
export { globTool } from './glob.js';
export { grepTool } from './grep.js';

// Export as array for easy registration
export const coreTools = async () => {
  const { readTool } = await import('./read.js');
  const { writeTool } = await import('./write.js');
  const { editTool } = await import('./edit.js');
  const { globTool } = await import('./glob.js');
  const { grepTool } = await import('./grep.js');

  return [readTool, writeTool, editTool, globTool, grepTool];
};

export default coreTools;
