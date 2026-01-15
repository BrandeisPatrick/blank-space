/**
 * Doc Read Tool
 * Read content of a document from docs/ folder
 */

import { Tool } from '../Tool.js';

/**
 * Validate that path is within docs/ folder
 */
function validateDocsPath(path) {
  const normalizedPath = path.replace(/^\/+/, ''); // Remove leading slashes
  if (!normalizedPath.startsWith('docs/')) {
    return { valid: false, error: 'Path must be within the docs/ folder' };
  }
  return { valid: true, path: normalizedPath };
}

export const docReadTool = new Tool({
  name: 'doc_read',
  description: 'Read the content of a document from the docs/ folder',
  parameters: {
    path: {
      type: 'string',
      description: 'Document path within docs/ folder (e.g., "docs/notes.md")',
      required: true
    }
  },
  execute: async (params, context) => {
    const { path } = params;
    const { fs } = context;

    if (!fs) {
      throw new Error('FileSystem not available in context');
    }

    // Validate path is within docs/
    const validation = validateDocsPath(path);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        path
      };
    }

    const content = fs.read(validation.path);

    if (content === null) {
      return {
        success: false,
        error: `Document not found: ${validation.path}`
      };
    }

    return {
      success: true,
      path: validation.path,
      content,
      size: content.length,
      lines: content.split('\n').length
    };
  }
});

export default docReadTool;
