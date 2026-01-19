/**
 * Create Directory Tool
 * Creates a new folder
 */

import { Tool } from '../Tool.js';

export const createDirectoryTool = new Tool({
  name: 'create_directory',
  description: 'Create a new folder',
  parameters: {
    path: {
      type: 'string',
      description: 'Folder path to create (e.g., "projects", "docs/archives")',
      required: true
    }
  },
  execute: async (params, context) => {
    const { path } = params;
    const { createDirectory } = context;

    if (!path) {
      return { success: false, error: 'Path is required' };
    }

    if (!createDirectory) {
      throw new Error('createDirectory function not available');
    }

    try {
      const result = await createDirectory(path);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
});

export default createDirectoryTool;
