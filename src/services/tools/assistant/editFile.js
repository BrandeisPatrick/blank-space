/**
 * Edit File Tool
 * Edits a file by replacing text
 */

import { Tool } from '../Tool.js';

export const editFileTool = new Tool({
  name: 'edit_file',
  description: 'Edit a file by replacing text',
  parameters: {
    path: {
      type: 'string',
      description: 'File path (e.g., "docs/todo.md")',
      required: true
    },
    old_string: {
      type: 'string',
      description: 'Text to find and replace',
      required: true
    },
    new_string: {
      type: 'string',
      description: 'Replacement text',
      required: true
    }
  },
  execute: async (params, context) => {
    const { path, old_string, new_string } = params;
    const { fetchFile, writeFile } = context;

    if (!path || old_string === undefined || new_string === undefined) {
      return { success: false, error: 'path, old_string, and new_string are required' };
    }

    if (!fetchFile || !writeFile) {
      throw new Error('fetchFile and writeFile functions not available');
    }

    try {
      // Read current content
      const fileResult = await fetchFile(path);
      if (!fileResult.success) {
        return fileResult;
      }

      const currentContent = fileResult.content;

      // Check if old_string exists
      if (!currentContent.includes(old_string)) {
        return {
          success: false,
          error: `Text not found in file: "${old_string.substring(0, 50)}..."`
        };
      }

      // Replace text
      const newContent = currentContent.replace(old_string, new_string);

      // Write back
      const writeResult = await writeFile(path, newContent);
      return {
        ...writeResult,
        message: `Replaced text in ${path}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
});

export default editFileTool;
