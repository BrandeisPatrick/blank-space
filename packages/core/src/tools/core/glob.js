/**
 * Glob Tool
 * Find files matching a glob pattern
 */

import { Tool } from '../Tool.js';

export const globTool = new Tool({
  name: 'glob',
  description: 'Find files matching a glob pattern',
  parameters: {
    pattern: {
      type: 'string',
      description: 'Glob pattern (e.g., "*.jsx", "components/*.js", "**/*.css")',
      required: true
    }
  },
  execute: async (params, context) => {
    const { pattern } = params;
    const { fs } = context;

    if (!fs) {
      throw new Error('FileSystem not available in context');
    }

    try {
      const matches = fs.glob(pattern);

      if (matches.length === 0) {
        return {
          success: true,
          pattern,
          matches: [],
          count: 0,
          message: `No files matching pattern: ${pattern}`
        };
      }

      return {
        success: true,
        pattern,
        matches,
        count: matches.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        pattern
      };
    }
  }
});

export default globTool;
