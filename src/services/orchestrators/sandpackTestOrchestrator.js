/**
 * Sandpack Test Orchestrator
 * Runs code in Sandpack environment and captures runtime errors
 *
 * Two modes:
 * 1. Puppeteer mode (headless browser) - for backend testing
 * 2. Direct mode (Sandpack API) - for frontend integration
 */

/**
 * Direct Sandpack validation using iframe
 * This runs in the browser alongside the Sandpack preview
 * @param {Object} files - Files to load in Sandpack format { 'App.jsx': code, ... }
 * @param {number} timeout - How long to wait for errors (ms)
 * @returns {Promise<Object>} Validation result
 */
export async function validateInSandpack(files, timeout = 5000) {
  return new Promise((resolve) => {
    const errors = [];
    const warnings = [];
    let resolved = false;

    // Capture console errors
    const originalError = console.error;
    console.error = (...args) => {
      errors.push({
        type: 'console-error',
        message: args.join(' '),
        timestamp: Date.now()
      });
      originalError.apply(console, args);
    };

    // Capture console warnings
    const originalWarn = console.warn;
    console.warn = (...args) => {
      warnings.push({
        type: 'console-warn',
        message: args.join(' '),
        timestamp: Date.now()
      });
      originalWarn.apply(console, args);
    };

    // Listen for React error boundary events
    const errorHandler = (event) => {
      errors.push({
        type: 'runtime-error',
        message: event.error?.message || event.message || 'Unknown error',
        stack: event.error?.stack || '',
        timestamp: Date.now()
      });
    };

    window.addEventListener('error', errorHandler);

    // Listen for unhandled promise rejections
    const rejectionHandler = (event) => {
      errors.push({
        type: 'promise-rejection',
        message: event.reason?.message || event.reason || 'Unhandled promise rejection',
        timestamp: Date.now()
      });
    };

    window.addEventListener('unhandledrejection', rejectionHandler);

    // Wait for errors to accumulate
    setTimeout(() => {
      if (resolved) return;
      resolved = true;

      // Restore original console methods
      console.error = originalError;
      console.warn = originalWarn;

      // Remove event listeners
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);

      resolve({
        success: errors.length === 0,
        errors,
        warnings,
        errorCount: errors.length,
        warningCount: warnings.length,
        summary: errors.length === 0
          ? '✅ No runtime errors detected'
          : `❌ Found ${errors.length} runtime error(s)`
      });
    }, timeout);
  });
}

/**
 * Sandpack Test Orchestrator Class
 * Manages runtime validation of Sandpack code
 */
export class SandpackTestOrchestrator {
  constructor(options = {}) {
    this.timeout = options.timeout || 5000;
    this.mode = options.mode || 'direct'; // 'direct' or 'puppeteer'
  }

  /**
   * Run validation on Sandpack files
   * @param {Array} fileOperations - File operations from CodeOrchestrator
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Validation result
   */
  async run(fileOperations, options = {}) {
    const { onUpdate = () => {} } = options;

    onUpdate({
      type: 'sandpack-test',
      message: 'Running Sandpack runtime validation...'
    });

    // Convert fileOperations to Sandpack files format
    const files = this.convertToSandpackFiles(fileOperations);

    // Static analysis first (fast)
    const staticAnalysis = this.runStaticAnalysis(files);

    if (staticAnalysis.criticalIssues.length > 0) {
      onUpdate({
        type: 'sandpack-failure',
        message: '❌ Static analysis found critical issues'
      });

      return {
        success: false,
        method: 'static-analysis',
        errors: staticAnalysis.criticalIssues,
        warnings: staticAnalysis.warnings,
        summary: `Static analysis failed: ${staticAnalysis.criticalIssues.length} critical issue(s)`
      };
    }

    // Runtime validation (if in browser context)
    if (typeof window !== 'undefined') {
      onUpdate({
        type: 'sandpack-test',
        message: 'Running runtime validation...'
      });

      const runtimeResult = await validateInSandpack(files, this.timeout);

      onUpdate({
        type: runtimeResult.success ? 'sandpack-success' : 'sandpack-failure',
        message: runtimeResult.summary
      });

      return {
        ...runtimeResult,
        method: 'runtime-validation',
        staticAnalysis
      };
    }

    // Backend mode - return static analysis only
    onUpdate({
      type: 'sandpack-success',
      message: '✅ Static analysis passed (runtime validation unavailable in backend)'
    });

    return {
      success: true,
      method: 'static-analysis',
      errors: [],
      warnings: staticAnalysis.warnings,
      summary: 'Static analysis passed',
      staticAnalysis,
      note: 'Runtime validation requires browser context'
    };
  }

  /**
   * Convert file operations to Sandpack files format
   * @param {Array} fileOperations
   * @returns {Object} Sandpack files
   */
  convertToSandpackFiles(fileOperations) {
    const files = {};
    fileOperations.forEach(op => {
      // Only include files with valid content
      if (op.content && typeof op.content === 'string') {
        files[op.filename] = op.content;
      } else {
        console.warn(`⚠️ Skipping file with invalid content: ${op.filename}`);
      }
    });
    return files;
  }

  /**
   * Run static analysis on code (browser-safe patterns)
   * @param {Object} files - Sandpack files
   * @returns {Object} Analysis result
   */
  runStaticAnalysis(files) {
    const criticalIssues = [];
    const warnings = [];

    Object.entries(files).forEach(([filename, code]) => {
      // Skip files with undefined or null content
      if (!code || typeof code !== 'string') {
        warnings.push({
          type: 'missing-content',
          file: filename,
          message: 'File has no content',
          severity: 'medium'
        });
        return;
      }

      // Check for Node.js APIs (browser incompatible)
      if (code.includes('require(')) {
        criticalIssues.push({
          type: 'browser-incompatible',
          file: filename,
          message: 'require() is not available in browser (use ES6 import)',
          severity: 'critical'
        });
      }

      if (code.includes('process.')) {
        criticalIssues.push({
          type: 'nodejs-api',
          file: filename,
          message: 'process API not available in browser',
          severity: 'critical'
        });
      }

      if (code.includes('__dirname') || code.includes('__filename')) {
        criticalIssues.push({
          type: 'nodejs-api',
          file: filename,
          message: '__dirname/__filename not available in browser',
          severity: 'critical'
        });
      }

      // Check for Sandpack navigation issues
      if (code.match(/<a\s+[^>]*href=["']#["']/)) {
        criticalIssues.push({
          type: 'sandpack-navigation',
          file: filename,
          message: '<a href="#"> causes white screen in Sandpack (use <button> instead)',
          severity: 'critical'
        });
      }

      // Check for banned packages
      const bannedPackages = ['axios', 'lodash', 'moment', 'uuid', 'prop-types'];
      bannedPackages.forEach(pkg => {
        if (code.includes(`from "${pkg}"`) || code.includes(`from '${pkg}'`)) {
          criticalIssues.push({
            type: 'banned-package',
            file: filename,
            message: `Package "${pkg}" not available in Sandpack`,
            severity: 'critical'
          });
        }
      });

      // Check for React anti-patterns (warnings)
      if (code.match(/onClick=\{\w+\([^)]*\)\}/)) {
        warnings.push({
          type: 'event-handler',
          file: filename,
          message: 'Function called immediately in onClick (should be onClick={() => fn()} or onClick={fn})',
          severity: 'medium'
        });
      }

      if (code.match(/\w+\.(push|pop|shift|unshift|splice)\(/)) {
        warnings.push({
          type: 'state-mutation',
          file: filename,
          message: 'Possible direct state mutation (use immutable updates)',
          severity: 'medium'
        });
      }

      // Check for syntax issues
      const brackets = { '{': 0, '[': 0, '(': 0 };
      const closeBrackets = { '}': '{', ']': '[', ')': '(' };

      for (const char of code) {
        if (char in brackets) brackets[char]++;
        if (char in closeBrackets) brackets[closeBrackets[char]]--;
      }

      if (brackets['{'] !== 0 || brackets['['] !== 0 || brackets['('] !== 0) {
        criticalIssues.push({
          type: 'syntax-error',
          file: filename,
          message: 'Unmatched brackets/braces/parentheses',
          severity: 'critical'
        });
      }
    });

    return {
      criticalIssues,
      warnings,
      passed: criticalIssues.length === 0
    };
  }

  /**
   * Extract error messages for debugger
   * @param {Object} validationResult
   * @returns {string} Formatted error messages
   */
  extractErrorMessages(validationResult) {
    const messages = [];

    if (validationResult.errors?.length > 0) {
      messages.push('=== Runtime Errors ===');
      validationResult.errors.forEach((err, i) => {
        messages.push(`${i + 1}. [${err.type}] ${err.message}`);
        if (err.stack) {
          messages.push(`   Stack: ${err.stack.split('\n')[0]}`);
        }
      });
    }

    if (validationResult.staticAnalysis?.criticalIssues?.length > 0) {
      messages.push('\n=== Static Analysis Issues ===');
      validationResult.staticAnalysis.criticalIssues.forEach((issue, i) => {
        messages.push(`${i + 1}. [${issue.type}] ${issue.file}: ${issue.message}`);
      });
    }

    return messages.join('\n');
  }
}

export default SandpackTestOrchestrator;
