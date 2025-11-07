/**
 * Read Tool
 * Read content of a file from virtual filesystem
 */

import { Tool } from '../Tool.js';

export const readTool = new Tool({
  name: 'read',
  description: 'Read the content of a file',
  parameters: {
    path: {
      type: 'string',
      description: 'File path (e.g., "App.jsx" or "components/Button.jsx")',
      required: true
    }
  },
  execute: async (params, context) => {
    const { path } = params;
    const { fs } = context;

    if (!fs) {
      throw new Error('FileSystem not available in context');
    }

    const content = fs.read(path);

    if (content === null) {
      return {
        success: false,
        error: `File not found: ${path}`
      };
    }

    return {
      success: true,
      path,
      content,
      size: content.length,
      lines: content.split('\n').length
    };
  }
});

export default readTool;
