/**
 * Write Tool
 * Create or overwrite a file in virtual filesystem
 */

import { Tool } from '../Tool.js';
import { autoFixCommonIssues } from '../../utils/code/autoFix.js';

export const writeTool = new Tool({
  name: 'write',
  description: 'Create or overwrite a file with content',
  parameters: {
    path: {
      type: 'string',
      description: 'File path (e.g., "App.jsx" or "components/Button.jsx")',
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
    const { fs } = context;

    if (!fs) {
      throw new Error('FileSystem not available in context');
    }

    try {
      // Auto-fix common issues in JS/JSX files (require→import, propTypes, etc.)
      let processedContent = content;
      if (path.endsWith('.js') || path.endsWith('.jsx')) {
        processedContent = autoFixCommonIssues(content, path);
      }

      fs.write(path, processedContent);

      return {
        success: true,
        path,
        size: processedContent.length,
        lines: processedContent.split('\n').length,
        message: `File written: ${path}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path
      };
    }
  }
});

export default writeTool;
