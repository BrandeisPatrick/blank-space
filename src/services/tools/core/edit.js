/**
 * Edit Tool
 * Edit a file by replacing old text with new text
 */

import { Tool } from '../Tool.js';

export const editTool = new Tool({
  name: 'edit',
  description: 'Edit a file by replacing old text with new text',
  parameters: {
    path: {
      type: 'string',
      description: 'File path (e.g., "App.jsx" or "components/Button.jsx")',
      required: true
    },
    old_str: {
      type: 'string',
      description: 'Old text to replace (must be exact match)',
      required: true
    },
    new_str: {
      type: 'string',
      description: 'New text to replace with',
      required: true
    }
  },
  execute: async (params, context) => {
    const { path, old_str, new_str } = params;
    const { fs } = context;

    if (!fs) {
      throw new Error('FileSystem not available in context');
    }

    const content = fs.read(path);

    if (content === null) {
      return {
        success: false,
        error: `File not found: ${path}`,
        path
      };
    }

    // Check if old_str exists
    if (!content.includes(old_str)) {
      return {
        success: false,
        error: `Text not found in file: ${path}`,
        path,
        hint: 'The old_str must match exactly (including whitespace)'
      };
    }

    // Replace only first occurrence if multiple exist
    const updated = content.replace(old_str, new_str);

    // Check if replacement actually changed content
    if (updated === content) {
      return {
        success: false,
        error: 'Replacement did not change the file',
        path
      };
    }

    fs.write(path, updated);

    return {
      success: true,
      path,
      oldSize: content.length,
      newSize: updated.length,
      linesChanged: Math.abs(
        content.split('\n').length - updated.split('\n').length
      ),
      message: `File edited: ${path}`
    };
  }
});

export default editTool;
