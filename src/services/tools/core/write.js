/**
 * Write Tool
 * Create or overwrite a file in virtual filesystem
 * Auto-validates JS/JSX files for browser compatibility
 */

import { Tool } from '../Tool.js';
import { validateTool } from './validate.js';

export const writeTool = new Tool({
  name: 'write',
  description: 'Create or overwrite a file with content. JS/JSX files are automatically validated for browser compatibility.',
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

    // Auto-validate JS/JSX files before writing
    const isJsFile = path.endsWith('.js') || path.endsWith('.jsx');
    let validation = null;

    if (isJsFile) {
      validation = await validateTool.execute({ filename: path, content }, context);

      if (!validation.success) {
        return {
          success: false,
          path,
          validation: validation,
          message: `Validation failed for ${path}. Fix errors before writing.`,
          errors: validation.errors,
          guidance: validation.guidance
        };
      }
    }

    try {
      fs.write(path, content);

      const result = {
        success: true,
        path,
        size: content.length,
        lines: content.split('\n').length,
        message: `File written: ${path}`
      };

      // Include validation warnings if any
      if (validation?.warnings) {
        result.warnings = validation.warnings;
      }

      return result;
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
