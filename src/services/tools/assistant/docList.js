/**
 * Doc List Tool
 * List all documents in the docs/ folder
 */

import { Tool } from '../Tool.js';

export const docListTool = new Tool({
  name: 'doc_list',
  description: 'List all documents in the docs/ folder',
  parameters: {
    pattern: {
      type: 'string',
      description: 'Optional glob pattern to filter files (e.g., "*.md", "*.txt"). Defaults to all files.',
      required: false
    }
  },
  execute: async (params, context) => {
    const { pattern = '*' } = params;
    const { fs } = context;

    if (!fs) {
      throw new Error('FileSystem not available in context');
    }

    try {
      // Use glob to find files in docs/ folder
      const globPattern = `docs/${pattern}`;
      const matches = fs.glob(globPattern);

      if (matches.length === 0) {
        return {
          success: true,
          documents: [],
          count: 0,
          message: 'No documents found in docs/ folder'
        };
      }

      // Get file info for each match
      const documents = matches.map(filePath => {
        const content = fs.read(filePath);
        const extension = filePath.split('.').pop() || '';
        return {
          path: filePath,
          name: filePath.replace('docs/', ''),
          extension,
          size: content ? content.length : 0,
          lines: content ? content.split('\n').length : 0
        };
      });

      return {
        success: true,
        documents,
        count: documents.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
});

export default docListTool;
