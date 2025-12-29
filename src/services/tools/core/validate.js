/**
 * Validate Tool
 * Validates JavaScript/JSX code for browser renderability
 * Checks for forbidden patterns, syntax errors, and import rules
 */

import { Tool } from '../Tool.js';
import * as parser from '@babel/parser';

export const validateTool = new Tool({
  name: 'validate',
  description: 'Validate JavaScript/JSX code for browser renderability. Checks for forbidden patterns like require(), npm imports, and other browser constraints.',
  parameters: {
    filename: {
      type: 'string',
      description: 'File path (e.g., "App.jsx" or "components/Button.jsx")',
      required: true
    },
    content: {
      type: 'string',
      description: 'File content to validate',
      required: true
    }
  },
  execute: async (params, context) => {
    const { filename, content } = params;
    const errors = [];
    const warnings = [];

    try {
      // 1. Check for syntax errors
      try {
        parser.parse(content, {
          sourceType: 'module',
          plugins: ['jsx', 'classProperties', ['decorators', { decoratorsBeforeExport: false }]]
        });
      } catch (parseError) {
        return {
          success: false,
          filename,
          errors: [
            {
              type: 'SYNTAX_ERROR',
              message: `Syntax error: ${parseError.message}`,
              line: parseError.loc?.line,
              column: parseError.loc?.column
            }
          ]
        };
      }

      // 2. Check for forbidden patterns
      checkForbiddenPatterns(content, filename, errors, warnings);

      // 3. Check import rules
      checkImportRules(content, filename, errors);

      // 4. Check for initialization code
      checkInitializationCode(content, filename, errors);

      // 5. Check for class components
      checkClassComponents(content, filename, errors);

      // 6. Check for navigation patterns that break Sandpack
      checkNavigationPatterns(content, filename, errors);

      // 7. Check for mismatched tags (e.g., <button>...</a>)
      checkMismatchedTags(content, filename, errors);

      // 8. Check for unsupported folder structures
      checkSupportedFolders(filename, errors);

      // If errors exist, return early
      if (errors.length > 0) {
        return {
          success: false,
          filename,
          errors,
          guidance: getGuidanceForErrors(errors)
        };
      }

      // 6. Warnings for style issues
      checkStyleWarnings(content, filename, warnings);

      return {
        success: true,
        filename,
        message: 'Code validation passed',
        lines: content.split('\n').length,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      return {
        success: false,
        filename,
        errors: [
          {
            type: 'VALIDATION_ERROR',
            message: `Unexpected validation error: ${error.message}`
          }
        ]
      };
    }
  }
});

/**
 * Check for forbidden patterns in code
 */
function checkForbiddenPatterns(content, filename, errors, warnings) {
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check for require() statements
    if (/\brequire\s*\(/g.test(line) && !line.trim().startsWith('//')) {
      errors.push({
        type: 'FORBIDDEN_PATTERN',
        message: 'require() is not allowed in browser code. Use ES6 imports instead: import X from "module"',
        line: lineNum,
        pattern: 'require()',
        fix: 'Change to: import X from "module"'
      });
    }

    // Check for module.exports
    if (/\bmodule\s*\.\s*exports\b/.test(line) && !line.trim().startsWith('//')) {
      errors.push({
        type: 'FORBIDDEN_PATTERN',
        message: 'module.exports is not allowed in browser code. Use ES6 exports instead: export default',
        line: lineNum,
        pattern: 'module.exports',
        fix: 'Change to: export default or export const'
      });
    }

    // Check for ReactDOM.createRoot()
    if (/ReactDOM\s*\.\s*createRoot\s*\(/.test(line) && !line.trim().startsWith('//')) {
      errors.push({
        type: 'FORBIDDEN_PATTERN',
        message: 'ReactDOM.createRoot() should not be included. The preview system handles initialization automatically.',
        line: lineNum,
        pattern: 'ReactDOM.createRoot()',
        fix: 'Remove this line - system handles React initialization'
      });
    }

    // Check for root.render()
    if (/\broot\s*\.\s*render\s*\(/.test(line) && !line.trim().startsWith('//')) {
      errors.push({
        type: 'FORBIDDEN_PATTERN',
        message: 'root.render() should not be included. The preview system handles rendering automatically.',
        line: lineNum,
        pattern: 'root.render()',
        fix: 'Remove this line - system handles React initialization'
      });
    }

    // Check for legacy ReactDOM.render()
    if (/ReactDOM\s*\.\s*render\s*\(/.test(line) && !line.trim().startsWith('//')) {
      errors.push({
        type: 'FORBIDDEN_PATTERN',
        message: 'ReactDOM.render() is legacy and should not be included. Remove all initialization code.',
        line: lineNum,
        pattern: 'ReactDOM.render()',
        fix: 'Remove this line - system handles React initialization'
      });
    }

    // Check for document.getElementById('root')
    if (/document\s*\.\s*getElementById\s*\(\s*['"]root['"]\s*\)/.test(line) && !line.trim().startsWith('//')) {
      errors.push({
        type: 'FORBIDDEN_PATTERN',
        message: 'Accessing document root element should not be needed. System handles mounting automatically.',
        line: lineNum,
        pattern: "document.getElementById('root')",
        fix: 'Remove this code - system handles initialization'
      });
    }

    // Check for PropTypes (deprecated)
    if (/\bPropTypes\b/.test(line) && !line.trim().startsWith('//')) {
      warnings.push({
        type: 'DEPRECATED_PATTERN',
        message: 'PropTypes is deprecated. Use JSDoc comments for type hints instead.',
        line: lineNum,
        pattern: 'PropTypes'
      });
    }
  });
}

/**
 * Check import/export rules
 */
function checkImportRules(content, filename, errors) {
  const importLines = content.split('\n').filter(line => {
    const trimmed = line.trim();
    return (trimmed.startsWith('import ') || trimmed.includes(' from ')) && !line.trim().startsWith('//');
  });

  // List of allowed third-party imports (must match CDN libraries in PreviewPanel)
  const allowedThirdParty = ['react', 'react-dom', 'framer-motion'];

  importLines.forEach((line, index) => {
    // Extract the module name from import statement
    const fromMatch = line.match(/from\s+['"]([^'"]+)['"]/);
    if (!fromMatch) return;

    const moduleName = fromMatch[1];
    const isRelativeImport = moduleName.startsWith('.') || moduleName.startsWith('/');

    // Check if it's an external package import
    if (!isRelativeImport && !allowedThirdParty.includes(moduleName)) {
      // Check if it's trying to import from node_modules (npm package)
      if (!moduleName.startsWith('react')) {
        const lineNum = content.split('\n').indexOf(line) + 1;
        errors.push({
          type: 'FORBIDDEN_IMPORT',
          message: `Cannot import from npm package "${moduleName}" in browser environment. Only React/ReactDOM are available.`,
          line: lineNum,
          pattern: `from "${moduleName}"`,
          fix: `Use browser APIs instead of external packages. For example:\n- crypto.randomUUID() instead of uuid\n- fetch() instead of axios\n- native Date instead of moment`
        });
      }
    }
  });
}

/**
 * Check for initialization code that system handles
 */
function checkInitializationCode(content, filename, errors) {
  const lines = content.split('\n');

  let hasCreateRoot = false;
  let hasRender = false;

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    if (/ReactDOM\s*\.\s*createRoot/.test(line)) hasCreateRoot = true;
    if (/\broot\s*\.\s*render\s*\(/.test(line)) hasRender = true;
    if (/ReactDOM\s*\.\s*render\s*\(/.test(line)) hasRender = true;
  });

  if (hasCreateRoot || hasRender) {
    errors.push({
      type: 'INITIALIZATION_ERROR',
      message: 'Remove all React initialization code (ReactDOM.createRoot, root.render, etc.). System handles this automatically.',
      fix: 'Keep only component definitions, exports, and hooks. Remove all ReactDOM mounting code.'
    });
  }
}

/**
 * Check for class components (should use functional)
 */
function checkClassComponents(content, filename, errors) {
  if (/\bclass\s+\w+\s+extends\s+(React\.)?(Pure)?Component\b/.test(content)) {
    const lineNum = content.split('\n').findIndex(line =>
      /\bclass\s+\w+\s+extends/.test(line)
    ) + 1;

    errors.push({
      type: 'COMPONENT_TYPE_ERROR',
      message: 'Class components are not allowed. Use functional components with hooks instead.',
      line: lineNum,
      pattern: 'class Component extends React.Component',
      fix: 'Rewrite as: function Component() { return (...); } with hooks for state/effects'
    });
  }
}

/**
 * Check for problematic navigation patterns that break Sandpack
 */
function checkNavigationPatterns(content, filename, errors) {
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check for <a href="#"> or <a href="#something"> patterns
    // These cause page reload/white screen in Sandpack preview
    if (/href\s*=\s*["']#[^"']*["']/.test(line) && !line.trim().startsWith('//')) {
      errors.push({
        type: 'NAVIGATION_ERROR',
        message: 'href="#" causes page reload/white screen in Sandpack preview. Use button with onClick instead.',
        line: lineNum,
        pattern: 'href="#"',
        fix: 'Replace <a href="#"> with: <button onClick={handleClick} className="...">Label</button>'
      });
    }

    // Check for external URLs in href (will fail in Sandpack)
    if (/href\s*=\s*["']https?:\/\//.test(line) && !line.trim().startsWith('//')) {
      // This is a warning, not an error - external links don't crash, they just don't navigate
      // We don't add to errors, but could add to warnings if needed
    }
  });
}

/**
 * Check for mismatched opening/closing tags (common LLM error)
 */
function checkMismatchedTags(content, filename, errors) {
  // Check for <button>...</a> pattern (button opened, anchor closed)
  if (/<button[^>]*>(?:(?!<\/button>).)*?<\/a>/s.test(content)) {
    errors.push({
      type: 'MISMATCHED_TAGS',
      message: 'Mismatched tags: <button> opened but </a> closed. Tags must match.',
      pattern: '<button>...</a>',
      fix: 'Use matching tags: <button onClick={handleClick}>Text</button>'
    });
  }

  // Check for <a>...</button> pattern (anchor opened, button closed)
  if (/<a[^>]*>(?:(?!<\/a>).)*?<\/button>/s.test(content)) {
    errors.push({
      type: 'MISMATCHED_TAGS',
      message: 'Mismatched tags: <a> opened but </button> closed. Tags must match.',
      pattern: '<a>...</button>',
      fix: 'For navigation, use: <button onClick={handleClick}>Text</button>'
    });
  }

  // Check for duplicate className attributes on same element
  if (/className\s*=\s*["'][^"']*["']\s+className\s*=\s*["'][^"']*["']/.test(content)) {
    errors.push({
      type: 'DUPLICATE_ATTRIBUTE',
      message: 'Duplicate className attributes on same element. Merge them into one.',
      pattern: 'className="..." className="..."',
      fix: 'Combine into single className: className="class1 class2 class3"'
    });
  }
}

/**
 * Check for unsupported folder structures
 * Only components/, utils/, hooks/, data/ are supported
 */
function checkSupportedFolders(filename, errors) {
  // Skip root-level files
  if (!filename.includes('/')) return;

  // Supported folder prefixes
  const supportedFolders = ['components/', 'utils/', 'hooks/', 'data/'];

  // Check if file is in a supported folder
  const isSupported = supportedFolders.some(folder => filename.startsWith(folder));

  if (!isSupported) {
    // Extract the folder name for the error message
    const folderName = filename.split('/')[0];

    errors.push({
      type: 'UNSUPPORTED_FOLDER',
      message: `Folder "${folderName}/" is not supported by the preview system. Supported folders: components/, utils/, hooks/, data/`,
      pattern: `${folderName}/`,
      fix: `Move file to a supported folder:\n- React components → components/\n- Utility functions → utils/\n- Custom hooks → hooks/\n- Data/constants → data/\n- Or keep in root level (e.g., App.jsx)`
    });
  }
}

/**
 * Check for code style warnings
 */
function checkStyleWarnings(content, filename, warnings) {
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check for console statements (in production code, should be removed before finishing)
    if (/console\.(log|debug|info)/.test(line) && !line.trim().startsWith('//')) {
      warnings.push({
        type: 'DEBUG_CODE',
        message: 'Remove console.log statements before finalizing code',
        line: lineNum
      });
    }
  });
}

/**
 * Generate helpful guidance based on error types
 */
function getGuidanceForErrors(errors) {
  const errorTypes = new Set(errors.map(e => e.type));
  const guidance = [];

  if (errorTypes.has('FORBIDDEN_PATTERN')) {
    guidance.push('Remove all require() calls and use ES6 imports instead.');
    guidance.push('Remove all React initialization code (ReactDOM.createRoot, root.render).');
  }

  if (errorTypes.has('FORBIDDEN_IMPORT')) {
    guidance.push('Only React/ReactDOM are available as npm imports. Use browser APIs for everything else (fetch, crypto.randomUUID, localStorage, etc.)');
  }

  if (errorTypes.has('SYNTAX_ERROR')) {
    guidance.push('Fix the syntax error shown above. Check for missing brackets, quotes, or semicolons.');
  }

  if (errorTypes.has('COMPONENT_TYPE_ERROR')) {
    guidance.push('Rewrite class components as functional components using hooks (useState, useEffect, etc.)');
  }

  if (errorTypes.has('NAVIGATION_ERROR')) {
    guidance.push('Use buttons with onClick handlers for navigation, not <a href="#">. Example: <button onClick={() => handleNav("page")} className="text-blue-600">Link</button>');
  }

  if (errorTypes.has('MISMATCHED_TAGS')) {
    guidance.push('Fix mismatched tags - opening and closing tags must match. For navigation use: <button onClick={handler}>Text</button> (NOT <button>...</a>)');
  }

  if (errorTypes.has('DUPLICATE_ATTRIBUTE')) {
    guidance.push('Merge duplicate className attributes into one: className="class1 class2 class3"');
  }

  if (errorTypes.has('UNSUPPORTED_FOLDER')) {
    guidance.push('Only these folders are supported: components/, utils/, hooks/, data/. Move files to supported folders or keep at root level.');
  }

  return guidance.length > 0 ? guidance.join(' ') : undefined;
}

export default validateTool;
