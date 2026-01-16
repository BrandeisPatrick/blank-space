/**
 * Read File Tool
 * Reads file content from storage
 */

import { Tool } from '../Tool.js';

export const readFileTool = new Tool({
  name: 'read_file',
  description: 'Read the content of a file',
  parameters: {
    path: {
      type: 'string',
      description: 'File path (e.g., "docs/todo.md")',
      required: true
    }
  },
  execute: async (params, context) => {
    const { path } = params;
    const { fetchFile } = context;

    if (!path) {
      return { success: false, error: 'Path is required' };
    }

    if (!fetchFile) {
      throw new Error('fetchFile function not available');
    }

    try {
      const result = await fetchFile(path);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
});

export default readFileTool;
