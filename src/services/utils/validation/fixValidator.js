/**
 * Fix Validation Utility
 * Validates generated fixes before applying them
 * Catches browser incompatibility, syntax errors, and common issues
 */

/**
 * Validate that code is browser-compatible and syntactically correct
 * @param {string} code - The generated fix code
 * @param {Object} context - Context about the fix
 * @returns {Object} - { valid: boolean, issues: Array }
 */
export function validateFix(code, context = {}) {
  const issues = [];

  // Guard: Ensure code is a string
  if (!code || typeof code !== 'string') {
    return {
      valid: false,
      issues: [{ type: 'invalid-input', message: 'Code must be a non-empty string' }]
    };
  }

  // Check 1: Browser incompatibility - require()
  if (code.includes('require(')) {
    issues.push({
      type: 'browser-incompatible',
      pattern: 'require()',
      message: 'Uses require() which is not supported in browser environment',
      suggestion: 'Convert to ES6 import syntax (import X from "Y")',
      severity: 'critical'
    });
  }

  // Check 2: Node.js-only APIs
  const nodeAPIs = [
    { pattern: 'process.', name: 'process' },
    { pattern: '__dirname', name: '__dirname' },
    { pattern: '__filename', name: '__filename' },
    { pattern: 'fs.', name: 'fs (filesystem)' },
    { pattern: 'path.', name: 'path' },
    { pattern: 'Buffer.', name: 'Buffer' },
    { pattern: 'module.exports', name: 'module.exports' },
    { pattern: 'exports.', name: 'exports' }
  ];

  for (const api of nodeAPIs) {
    if (code.includes(api.pattern)) {
      issues.push({
        type: 'nodejs-api',
        pattern: api.pattern,
        message: `Uses Node.js API '${api.name}' which doesn't exist in browser`,
        suggestion: 'Remove or replace with browser-compatible alternative',
        severity: 'critical'
      });
    }
  }

  // Check 3: Basic syntax validation (look for obvious errors)
  const syntaxIssues = validateBasicSyntax(code);
  if (syntaxIssues.length > 0) {
    issues.push(...syntaxIssues);
  }

  // Check 4: Common anti-patterns
  const antiPatterns = detectAntiPatterns(code);
  if (antiPatterns.length > 0) {
    issues.push(...antiPatterns);
  }

  return {
    valid: issues.length === 0,
    issues,
    criticalIssues: issues.filter(i => i.severity === 'critical').length,
    warningIssues: issues.filter(i => i.severity === 'warning').length
  };
}

/**
 * Basic syntax validation (without full parsing)
 * Fix 3: Improved to handle JSX, strings, and template literals better
 */
function validateBasicSyntax(code) {
  const issues = [];

  // Check for unmatched brackets with better context handling
  const brackets = { '{': 0, '[': 0, '(': 0 };
  const closeBrackets = { '}': '{', ']': '[', ')': '(' };

  let inString = false;
  let inTemplate = false;
  let inComment = false;
  let stringChar = null;

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const prevChar = i > 0 ? code[i - 1] : '';
    const nextChar = i < code.length - 1 ? code[i + 1] : '';

    // Handle comments
    if (!inString && !inTemplate) {
      // Start of line comment
      if (char === '/' && nextChar === '/') {
        inComment = true;
        i++; // Skip next char
        continue;
      }
      // End of line comment
      if (inComment && char === '\n') {
        inComment = false;
        continue;
      }
      // Skip if in comment
      if (inComment) continue;

      // Start/end of block comment
      if (char === '/' && nextChar === '*') {
        const endIndex = code.indexOf('*/', i + 2);
        if (endIndex !== -1) {
          i = endIndex + 1; // Skip entire comment
          continue;
        }
      }
    }

    // Handle strings (skip brackets inside strings)
    if ((char === '"' || char === "'" ) && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = null;
      }
      continue;
    }

    // Handle template literals (skip brackets inside templates)
    if (char === '`' && prevChar !== '\\') {
      inTemplate = !inTemplate;
      continue;
    }

    // Skip counting brackets inside strings or templates
    if (inString || inTemplate || inComment) {
      continue;
    }

    // Count brackets
    if (char in brackets) brackets[char]++;
    if (char in closeBrackets) brackets[closeBrackets[char]]--;
  }

  if (brackets['{'] !== 0) {
    issues.push({
      type: 'syntax',
      pattern: 'unmatched-braces',
      message: `Unmatched curly braces (${brackets['{'] > 0 ? 'missing }' : 'extra }'})`,
      severity: 'critical'
    });
  }
  if (brackets['['] !== 0) {
    issues.push({
      type: 'syntax',
      pattern: 'unmatched-brackets',
      message: `Unmatched brackets (${brackets['['] > 0 ? 'missing ]' : 'extra ]'})`,
      severity: 'critical'
    });
  }
  if (brackets['('] !== 0) {
    issues.push({
      type: 'syntax',
      pattern: 'unmatched-parens',
      message: `Unmatched parentheses (${brackets['('] > 0 ? 'missing )' : 'extra )'})`,
      severity: 'critical'
    });
  }

  return issues;
}

/**
 * Detect common anti-patterns
 */
function detectAntiPatterns(code) {
  const issues = [];

  // Anti-pattern 1: Inline event handlers with eval risk
  if (/on\w+\s*=\s*["']/.test(code)) {
    issues.push({
      type: 'anti-pattern',
      pattern: 'inline-event-handlers',
      message: 'Uses inline event handlers (onClick="...")',
      suggestion: 'Use React onClick={handler} instead',
      severity: 'warning'
    });
  }

  // Anti-pattern 2: Direct DOM manipulation in React
  if (/document\.(getElementById|querySelector|createElement)/.test(code)) {
    issues.push({
      type: 'anti-pattern',
      pattern: 'direct-dom',
      message: 'Direct DOM manipulation detected',
      suggestion: 'Use React refs or state instead',
      severity: 'warning'
    });
  }

  // Anti-pattern 3: var declarations (should use const/let)
  if (/\bvar\s+\w+/.test(code)) {
    issues.push({
      type: 'anti-pattern',
      pattern: 'var-declaration',
      message: 'Uses "var" instead of const/let',
      suggestion: 'Use const or let for modern JavaScript',
      severity: 'warning'
    });
  }

  return issues;
}

/**
 * Check if fix appears to be valid React code
 */
export function isValidReactCode(code) {
  // Must have some React-like patterns
  const hasReactPatterns =
    code.includes('function') ||
    code.includes('const') ||
    code.includes('export');

  const hasJSX = code.includes('return') && /[<>]/.test(code);

  return hasReactPatterns || hasJSX;
}

/**
 * Extract specific errors for LLM learning
 */
export function formatIssuesForLLM(issues) {
  if (issues.length === 0) return 'No issues found.';

  const critical = issues.filter(i => i.severity === 'critical');
  const warnings = issues.filter(i => i.severity === 'warning');

  let formatted = '';

  if (critical.length > 0) {
    formatted += '🚨 CRITICAL ISSUES (must fix):\n';
    critical.forEach((issue, i) => {
      formatted += `${i + 1}. ${issue.message}\n`;
      if (issue.suggestion) {
        formatted += `   ✅ Fix: ${issue.suggestion}\n`;
      }
    });
  }

  if (warnings.length > 0) {
    formatted += '\n⚠️ WARNINGS (should fix):\n';
    warnings.forEach((issue, i) => {
      formatted += `${i + 1}. ${issue.message}\n`;
      if (issue.suggestion) {
        formatted += `   💡 Suggestion: ${issue.suggestion}\n`;
      }
    });
  }

  return formatted;
}
