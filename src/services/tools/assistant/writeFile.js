/**
 * Write File Tool
 * Creates or overwrites a file
 */

import { Tool } from '../Tool.js';

export const writeFileTool = new Tool({
  name: 'write_file',
  description: 'Create or overwrite a file',
  parameters: {
    path: {
      type: 'string',
      description: 'File path (e.g., "docs/notes.md")',
      required: true
    },
    content: {
      type: 'string',
      description: 'File content to write',
      required: true
    }
  },
  execute: async (params, context) => {
    const { path, content } = params;
    const { writeFile } = context;

    if (!path) {
      return { success: false, error: 'Path is required' };
    }

    if (content === undefined) {
      return { success: false, error: 'Content is required' };
    }

    if (!writeFile) {
      throw new Error('writeFile function not available');
    }

    try {
      const result = await writeFile(path, content);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
});

export default writeFileTool;
