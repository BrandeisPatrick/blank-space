/**
 * Delete File Tool
 * Deletes a file permanently
 */

import { Tool } from '../Tool.js';

export const deleteFileTool = new Tool({
  name: 'delete_file',
  description: 'Delete a file permanently',
  parameters: {
    path: {
      type: 'string',
      description: 'File path to delete (e.g., "notes.md")',
      required: true
    }
  },
  execute: async (params, context) => {
    const { path } = params;
    const { deleteFile } = context;

    if (!path) {
      return { success: false, error: 'Path is required' };
    }

    if (!deleteFile) {
      throw new Error('deleteFile function not available');
    }

    try {
      const result = await deleteFile(path);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
});

export default deleteFileTool;
