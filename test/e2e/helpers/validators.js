/**
 * Code Validators for E2E Tests
 * Validates generated code quality and correctness
 */

/**
 * Validate that code has valid syntax
 */
export function validateSyntax(code) {
  const errors = [];

  // Check balanced braces
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
  }

  // Check balanced parentheses
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
  }

  // Check balanced brackets
  const openBrackets = (code.match(/\[/g) || []).length;
  const closeBrackets = (code.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    errors.push(`Unbalanced brackets: ${openBrackets} open, ${closeBrackets} close`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate that code has proper imports
 */
export function validateImports(code) {
  const errors = [];

  // Check if code needs React import (has JSX or React hooks)
  const hasJSX = /<[A-Z][a-zA-Z0-9]*[\s/>]/.test(code) || // Component JSX like <App />
                 /<[a-z]+[\s>]/.test(code); // HTML JSX like <div>

  const hasReactHooks = /\b(useState|useEffect|useContext|useReducer|useCallback|useMemo|useRef|useImperativeHandle|useLayoutEffect|useDebugValue)\s*\(/.test(code);

  // If code uses JSX or React hooks, it must have React import
  if (hasJSX || hasReactHooks) {
    const hasReactImport = code.includes('import React') ||
                           code.includes('import * as React') ||
                           (code.includes('import {') && /from ['"]react['"]/.test(code));

    if (!hasReactImport) {
      errors.push('Missing React import');
    }
  }

  // Should not use require()
  if (code.includes('require(')) {
    errors.push('Uses require() instead of ES6 imports (browser incompatible)');
  }

  // Should not import Node.js modules
  const nodeModules = ['fs', 'path', 'process', 'child_process'];
  nodeModules.forEach(mod => {
    if (code.includes(`from '${mod}'`) || code.includes(`from "${mod}"`)) {
      errors.push(`Imports Node.js module '${mod}' (browser incompatible)`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate that code has proper exports
 */
export function validateExports(code) {
  const errors = [];

  // Should have export default or export
  if (!code.includes('export default') && !code.includes('export {')) {
    errors.push('Missing export statement');
  }

  // Should not use module.exports
  if (code.includes('module.exports')) {
    errors.push('Uses module.exports instead of ES6 exports');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate React component structure
 */
export function validateReactComponent(code) {
  const errors = [];

  // Should have a function or class component
  const hasFunctionComponent = code.includes('function') && code.includes('return');
  const hasArrowComponent = code.includes('=>') && code.includes('return');

  if (!hasFunctionComponent && !hasArrowComponent) {
    errors.push('No React component found (missing function with return)');
  }

  // Should return JSX
  if (!code.includes('<') || !code.includes('>')) {
    errors.push('No JSX found in component');
  }

  // Should not have common React anti-patterns
  if (code.match(/useState\([^)]*\)[^;]*;[\s\n]*set[A-Z]/)) {
    errors.push('Potential infinite loop: setState called outside handler/effect');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: []
  };
}

/**
 * Validate code quality
 */
export function validateCodeQuality(code) {
  const warnings = [];

  // Check for console.log (might be debugging code)
  if (code.includes('console.log')) {
    warnings.push('Contains console.log statements');
  }

  // Check for TODO comments
  if (code.includes('TODO') || code.includes('FIXME')) {
    warnings.push('Contains TODO/FIXME comments');
  }

  // Check for very long files
  const lines = code.split('\n').length;
  if (lines > 500) {
    warnings.push(`File is very long (${lines} lines)`);
  }

  return {
    warnings,
    metrics: {
      lines,
      characters: code.length,
      functions: (code.match(/function\s+\w+/g) || []).length
    }
  };
}

/**
 * Run all validators
 */
export function validateAll(code, filename = 'Unknown') {
  console.log(`\n   📋 Validating ${filename}...`);

  const results = {
    syntax: validateSyntax(code),
    imports: validateImports(code),
    exports: validateExports(code),
    react: validateReactComponent(code),
    quality: validateCodeQuality(code)
  };

  const allErrors = [
    ...results.syntax.errors,
    ...results.imports.errors,
    ...results.exports.errors,
    ...results.react.errors
  ];

  const allWarnings = [
    ...results.quality.warnings
  ];

  // Log results
  if (allErrors.length === 0) {
    console.log(`   ✅ All validations passed`);
  } else {
    console.log(`   ❌ ${allErrors.length} error(s) found:`);
    allErrors.forEach(err => console.log(`      - ${err}`));
  }

  if (allWarnings.length > 0) {
    console.log(`   ⚠️  ${allWarnings.length} warning(s):`);
    allWarnings.forEach(warn => console.log(`      - ${warn}`));
  }

  console.log(`   📊 Metrics: ${results.quality.metrics.lines} lines, ${results.quality.metrics.functions} functions`);

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    results,
    metrics: results.quality.metrics
  };
}

export default {
  validateSyntax,
  validateImports,
  validateExports,
  validateReactComponent,
  validateCodeQuality,
  validateAll
};
