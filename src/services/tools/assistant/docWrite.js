/**
 * Doc Write Tool
 * Create or overwrite a document in docs/ folder
 */

import { Tool } from '../Tool.js';

/**
 * Validate and normalize path for docs/ folder
 */
function validateDocsPath(path) {
  let normalizedPath = path.replace(/^\/+/, ''); // Remove leading slashes

  // Auto-prepend docs/ if not present
  if (!normalizedPath.startsWith('docs/')) {
    normalizedPath = `docs/${normalizedPath}`;
  }

  // Auto-add .md extension if no extension present
  if (!normalizedPath.includes('.')) {
    normalizedPath = `${normalizedPath}.md`;
  }

  return { valid: true, path: normalizedPath };
}

export const docWriteTool = new Tool({
  name: 'doc_write',
  description: 'Create or overwrite a document in the docs/ folder. Automatically adds .md extension if none provided.',
  parameters: {
    path: {
      type: 'string',
      description: 'Document path (e.g., "docs/notes.md" or just "notes" which becomes "docs/notes.md")',
      required: true
    },
    content: {
      type: 'string',
      description: 'Document content to write',
      required: true
    }
  },
  execute: async (params, context) => {
    const { path, content } = params;
    const { fs } = context;

    if (!fs) {
      throw new Error('FileSystem not available in context');
    }

    // Validate and normalize path
    const validation = validateDocsPath(path);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        path
      };
    }

    try {
      fs.write(validation.path, content);

      return {
        success: true,
        path: validation.path,
        size: content.length,
        lines: content.split('\n').length,
        message: `Document written: ${validation.path}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        path: validation.path
      };
    }
  }
});

export default docWriteTool;
