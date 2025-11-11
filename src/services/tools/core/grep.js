/**
 * Grep Tool
 * Search for text in files
 */

import { Tool } from '../Tool.js';

export const grepTool = new Tool({
  name: 'grep',
  description: 'Search for text in files',
  parameters: {
    pattern: {
      type: 'string',
      description: 'Search pattern (can be regex)',
      required: true
    },
    file_pattern: {
      type: 'string',
      description: 'Glob pattern to filter files (e.g., "*.jsx")',
      required: false
    }
  },
  execute: async (params, context) => {
    const { pattern, file_pattern } = params;
    const { fs } = context;

    if (!fs) {
      throw new Error('FileSystem not available in context');
    }

    try {
      // Try to create regex from pattern
      let regex;
      try {
        regex = new RegExp(pattern, 'gi');
      } catch {
        // If not valid regex, use as literal string
        regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      }

      const results = fs.grep(regex);

      // Filter by file_pattern if provided
      let filtered = results;
      if (file_pattern) {
        const fileRegex = new RegExp(
          file_pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '.')
        );
        filtered = results.filter(r => fileRegex.test(r.path));
      }

      if (filtered.length === 0) {
        return {
          success: true,
          pattern,
          results: [],
          count: 0,
          message: 'No matches found'
        };
      }

      return {
        success: true,
        pattern,
        results: filtered.map(r => ({
          path: r.path,
          matches: r.matches,
          lines: r.lines
        })),
        count: filtered.length,
        totalMatches: filtered.reduce((sum, r) => sum + r.matches, 0)
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

export default grepTool;
