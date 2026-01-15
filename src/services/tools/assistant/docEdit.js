/**
 * Doc Edit Tool
 * Edit a document by replacing old text with new text
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

export const docEditTool = new Tool({
  name: 'doc_edit',
  description: 'Edit a document by replacing old text with new text',
  parameters: {
    path: {
      type: 'string',
      description: 'Document path within docs/ folder (e.g., "docs/notes.md")',
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
        error: `Document not found: ${validation.path}`,
        path: validation.path
      };
    }

    // Check if old_str exists
    if (!content.includes(old_str)) {
      return {
        success: false,
        error: `Text not found in document: ${validation.path}`,
        path: validation.path,
        hint: 'The old_str must match exactly (including whitespace)'
      };
    }

    // Replace only first occurrence if multiple exist
    const updated = content.replace(old_str, new_str);

    // Check if replacement actually changed content
    if (updated === content) {
      return {
        success: false,
        error: 'Replacement did not change the document',
        path: validation.path
      };
    }

    fs.write(validation.path, updated);

    return {
      success: true,
      path: validation.path,
      oldSize: content.length,
      newSize: updated.length,
      linesChanged: Math.abs(
        content.split('\n').length - updated.split('\n').length
      ),
      message: `Document edited: ${validation.path}`
    };
  }
});

export default docEditTool;
