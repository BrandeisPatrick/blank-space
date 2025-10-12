import compressedPrompts from "../compressedPrompts.json" with { type: "json" };

/**
 * Validator Agent
 * Fast validation agent for checking generated code
 * Handles syntax, format, packages, and initialization code checks
 */

/**
 * Validation modes
 */
export const ValidationMode = {
  FULL: 'full',       // All checks
  FAST: 'fast',       // Syntax + basic checks
  SYNTAX_ONLY: 'syntax', // Just syntax validation
  FORMAT_ONLY: 'format'  // Just format validation
};

/**
 * Validate generated code
 * @param {Object} options - Validation options
 * @param {string} options.code - Code to validate
 * @param {string} options.filename - File name
 * @param {string} [options.mode='full'] - Validation mode
 * @returns {Object} Validation result
 */
export function validateCode({ code, filename, mode = ValidationMode.FULL }) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    fixes: [],
    code // Return original code by default
  };

  // Run validations based on mode
  if (mode === ValidationMode.SYNTAX_ONLY || mode === ValidationMode.FAST || mode === ValidationMode.FULL) {
    validateSyntax(code, result);
  }

  if (mode === ValidationMode.FORMAT_ONLY || mode === ValidationMode.FULL) {
    validateFormat(code, result);
  }

  if (mode === ValidationMode.FAST || mode === ValidationMode.FULL) {
    validatePackages(code, result);
  }

  if (mode === ValidationMode.FULL) {
    validateInitialization(code, result);
    validateOutput(code, result);
  }

  // Apply auto-fixes if errors found
  if (result.errors.length > 0 && result.fixes.length > 0) {
    result.code = applyFixes(code, result.fixes);
    result.autoFixed = true;
  }

  result.valid = result.errors.length === 0;
  return result;
}

/**
 * Validate syntax (basic checks)
 * @param {string} code - Code to check
 * @param {Object} result - Result object to populate
 */
function validateSyntax(code, result) {
  // Check for balanced braces
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    result.errors.push({
      type: 'syntax',
      message: `Unbalanced braces: ${openBraces} open, ${closeBraces} close`,
      severity: 'critical'
    });
  }

  // Check for balanced parentheses
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    result.errors.push({
      type: 'syntax',
      message: `Unbalanced parentheses: ${openParens} open, ${closeParens} close`,
      severity: 'critical'
    });
  }

  // Check for balanced brackets
  const openBrackets = (code.match(/\[/g) || []).length;
  const closeBrackets = (code.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    result.errors.push({
      type: 'syntax',
      message: `Unbalanced brackets: ${openBrackets} open, ${closeBrackets} close`,
      severity: 'critical'
    });
  }

  // Check for missing export
  if (!code.includes('export default') && !code.includes('export {')) {
    result.warnings.push({
      type: 'syntax',
      message: 'No export statement found',
      severity: 'warning'
    });
  }
}

/**
 * Validate format (double quotes, semicolons)
 * @param {string} code - Code to check
 * @param {Object} result - Result object to populate
 */
function validateFormat(code, result) {
  // Check for single quotes in imports (should be double quotes)
  const singleQuoteImports = code.match(/import\s+.*?\s+from\s+'[^']+'/g);
  if (singleQuoteImports && singleQuoteImports.length > 0) {
    result.warnings.push({
      type: 'format',
      message: 'Use double quotes in imports',
      severity: 'minor',
      pattern: singleQuoteImports[0]
    });

    result.fixes.push({
      type: 'replace-quotes',
      description: 'Convert single quotes to double quotes in imports'
    });
  }

  // Check for single quotes in JSX attributes
  const singleQuoteJSX = code.match(/className='[^']+'/g);
  if (singleQuoteJSX && singleQuoteJSX.length > 0) {
    result.warnings.push({
      type: 'format',
      message: 'Use double quotes in JSX attributes',
      severity: 'minor',
      pattern: singleQuoteJSX[0]
    });

    result.fixes.push({
      type: 'replace-jsx-quotes',
      description: 'Convert single quotes to double quotes in JSX'
    });
  }
}

/**
 * Validate packages (no banned packages)
 * @param {string} code - Code to check
 * @param {Object} result - Result object to populate
 */
function validatePackages(code, result) {
  const bannedPackages = [
    'prop-types',
    'axios',
    'lodash',
    'uuid',
    'moment',
    'class-validator',
    'joi',
    'yup',
    'zod',
    'dotenv',
    'express',
    'mongoose'
  ];

  bannedPackages.forEach(pkg => {
    const importPattern = new RegExp(`import\\s+.*?\\s+from\\s+['"]${pkg}['"]`, 'g');
    const requirePattern = new RegExp(`require\\(['"]${pkg}['"]\\)`, 'g');

    if (importPattern.test(code) || requirePattern.test(code)) {
      result.errors.push({
        type: 'package',
        message: `Banned package '${pkg}' - not available in browser environment`,
        severity: 'critical',
        package: pkg
      });

      // Suggest alternative
      const alternatives = getPackageAlternative(pkg);
      if (alternatives) {
        result.fixes.push({
          type: 'remove-package',
          package: pkg,
          alternative: alternatives
        });
      }
    }
  });

  // Check for any non-react imports
  const allImports = code.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g) || [];
  allImports.forEach(imp => {
    const match = imp.match(/from\s+['"]([^'"]+)['"]/);
    if (match && match[1]) {
      const importPath = match[1];
      // Check if it's not a relative import and not react/react-dom
      if (!importPath.startsWith('.') && !importPath.startsWith('react')) {
        result.warnings.push({
          type: 'package',
          message: `External package '${importPath}' may not be available`,
          severity: 'warning',
          package: importPath
        });
      }
    }
  });
}

/**
 * Validate initialization code (no ReactDOM.createRoot)
 * @param {string} code - Code to check
 * @param {Object} result - Result object to populate
 */
function validateInitialization(code, result) {
  // Check for ReactDOM imports
  if (code.match(/import\s+.*?ReactDOM.*?from\s+['"]react-dom/)) {
    result.errors.push({
      type: 'initialization',
      message: 'Do not import ReactDOM - initialization is handled by the system',
      severity: 'critical'
    });

    result.fixes.push({
      type: 'remove-reactdom',
      description: 'Remove ReactDOM import and initialization code'
    });
  }

  // Check for createRoot calls
  if (code.includes('createRoot') || code.includes('.render(')) {
    result.errors.push({
      type: 'initialization',
      message: 'Do not call createRoot or render - system handles initialization',
      severity: 'critical'
    });

    result.fixes.push({
      type: 'remove-initialization',
      description: 'Remove createRoot/render calls'
    });
  }

  // Check for document.getElementById('root')
  if (code.includes('document.getElementById')) {
    result.warnings.push({
      type: 'initialization',
      message: 'Avoid direct DOM access - let system handle mounting',
      severity: 'warning'
    });
  }
}

/**
 * Validate output format (no markdown)
 * @param {string} code - Code to check
 * @param {Object} result - Result object to populate
 */
function validateOutput(code, result) {
  // Check for markdown code fences
  if (code.includes('```')) {
    result.errors.push({
      type: 'format',
      message: 'Code contains markdown backticks - should be raw code only',
      severity: 'critical'
    });

    result.fixes.push({
      type: 'remove-markdown',
      description: 'Remove markdown code fences'
    });
  }

  // Check if code starts with explanatory text
  if (!code.trim().startsWith('import') && !code.trim().startsWith('const') && !code.trim().startsWith('function') && !code.trim().startsWith('export')) {
    result.warnings.push({
      type: 'format',
      message: 'Code should start directly with imports or declarations',
      severity: 'warning'
    });
  }
}

/**
 * Apply auto-fixes to code
 * @param {string} code - Original code
 * @param {Array} fixes - List of fixes to apply
 * @returns {string} Fixed code
 */
function applyFixes(code, fixes) {
  let fixedCode = code;

  fixes.forEach(fix => {
    switch (fix.type) {
      case 'replace-quotes':
        // Convert single to double quotes in imports
        fixedCode = fixedCode.replace(/import\s+(.*?)\s+from\s+'([^']+)'/g, 'import $1 from "$2"');
        break;

      case 'replace-jsx-quotes':
        // Convert single to double quotes in JSX
        fixedCode = fixedCode.replace(/className='([^']+)'/g, 'className="$1"');
        fixedCode = fixedCode.replace(/(\w+)='([^']+)'/g, '$1="$2"');
        break;

      case 'remove-markdown':
        // Remove markdown code fences
        fixedCode = fixedCode.replace(/```(?:jsx|javascript|js|tsx)?\s*/g, '').replace(/```\s*/g, '');
        break;

      case 'remove-reactdom':
        // Remove ReactDOM imports
        fixedCode = fixedCode.replace(/import\s+.*?ReactDOM.*?from\s+['"]react-dom['"];\s*/g, '');
        break;

      case 'remove-initialization':
        // Remove initialization code
        fixedCode = fixedCode.replace(/const\s+root\s+=\s+.*?createRoot\(.*?\);\s*/g, '');
        fixedCode = fixedCode.replace(/root\.render\(.*?\);\s*/g, '');
        fixedCode = fixedCode.replace(/ReactDOM\.render\(.*?\);\s*/g, '');
        break;

      case 'remove-package':
        // Remove banned package imports
        if (fix.package) {
          const pattern = new RegExp(`import\\s+.*?\\s+from\\s+['"]${fix.package}['"];?\\s*`, 'g');
          fixedCode = fixedCode.replace(pattern, '');
        }
        break;
    }
  });

  return fixedCode.trim();
}

/**
 * Get alternative for banned package
 * @param {string} packageName - Banned package name
 * @returns {string} Alternative solution
 */
function getPackageAlternative(packageName) {
  const alternatives = {
    'axios': 'Use native fetch() API',
    'lodash': 'Use native JavaScript methods (map, filter, reduce)',
    'uuid': 'Use crypto.randomUUID() or Date.now()',
    'moment': 'Use native Date object or date-fns',
    'prop-types': 'Remove PropTypes - not needed (just delete)',
    'class-validator': 'Use manual validation logic',
    'joi': 'Use manual validation logic',
    'yup': 'Use manual validation logic',
    'zod': 'Use manual validation logic'
  };

  return alternatives[packageName] || 'Not available in browser - use alternative approach';
}

/**
 * Quick validation (syntax only, no LLM)
 * @param {string} code - Code to validate
 * @returns {boolean} True if basic checks pass
 */
export function quickValidate(code) {
  const result = { valid: true, errors: [], warnings: [], fixes: [] };
  validateSyntax(code, result);
  return result.valid;
}

export default {
  validateCode,
  quickValidate,
  ValidationMode
};
