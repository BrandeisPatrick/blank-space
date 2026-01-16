/**
 * List Directory Tool
 * Lists files and folders at a given path
 */

import { Tool } from '../Tool.js';

export const listDirectoryTool = new Tool({
  name: 'list_directory',
  description: 'List files and folders. Use path to list specific directory, or omit for root.',
  parameters: {
    path: {
      type: 'string',
      description: 'Directory path (e.g., "docs", "Photos"). Omit for root.',
      required: false
    }
  },
  execute: async (params, context) => {
    const { path = '' } = params;
    const { listDirectory } = context;

    if (!listDirectory) {
      throw new Error('listDirectory function not available');
    }

    try {
      const result = await listDirectory(path);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
});

export default listDirectoryTool;
