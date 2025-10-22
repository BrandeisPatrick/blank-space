import { callLLMForJSON } from "../utils/llm/llmClient.js";
import { MODELS } from "../config/modelConfig.js";
import compressedPrompts from "../compressedPrompts.json" with { type: "json" };
import { modifyCode } from "./modifier.js";
import { validateFix, formatIssuesForLLM } from "../utils/validation/fixValidator.js";
import { convertRequireToImport } from "../utils/code/autoFix.js";
import { scanForIssue } from "./fileScanner.js";

/**
 * Debugger Agent
 * Specialized agent for root cause analysis and bug diagnosis
 * Handles error analysis, pattern recognition, and fix strategies
 */

/**
 * Analyze and diagnose a bug
 * @param {Object} options - Debug options
 * @param {Object} options.errorContext - Error information from analyzer
 * @param {string} options.code - Code where error occurs
 * @param {string} options.userMessage - User's error description
 * @returns {Promise<Object>} Debug analysis with root cause and fix strategy
 */
export async function diagnoseBug({ errorContext, code, userMessage }) {
  const systemPrompt = `You are a React debugging specialist for a BROWSER-BASED Sandpack environment.

🌐 ENVIRONMENT CONSTRAINTS (CRITICAL):
This code runs in a Sandpack preview iframe - a browser-based playground with specific limitations:
- **NO external npm packages** (only React/ReactDOM are available)
- **NO Node.js APIs** (no require(), process, fs, __dirname, etc.)
- **ES6 imports ONLY** (import X from "Y", NOT require())
- **Navigation issues**: <a href="#"> causes white screen/page reload in preview
  → Solution: Use <button onClick={handler}> for navigation instead
- **NO initialization code** (no ReactDOM.render, no document.getElementById)

Your job is to:
1. Identify the root cause of bugs (including Sandpack-specific issues)
2. Explain WHY the bug occurs
3. Provide a targeted fix strategy that works in this environment

${compressedPrompts.DEBUGGER_PATTERNS}

🐛 DIAGNOSIS PROCESS:
1. **Identify Error Type**: Runtime, logic, rendering, state, props, hooks
2. **Trace Root Cause**: Follow data flow to find where it breaks
3. **Explain Why**: What assumption was violated?
4. **Suggest Fix**: Minimal, surgical fix that addresses root cause

Respond ONLY with JSON in this format:
{
  "errorType": "state-mutation | event-handler | hooks-rules | async | props | rendering",
  "rootCause": "Clear explanation of WHY the bug occurs",
  "explanation": "Detailed breakdown of the issue",
  "affectedCode": {
    "location": "Line numbers or function name",
    "problematicPattern": "The code causing the issue",
    "whyItFails": "Why this pattern causes problems"
  },
  "fixStrategy": {
    "approach": "How to fix it (e.g., use functional setState, add cleanup)",
    "minimalChanges": "Specific changes needed",
    "codeExample": "Brief example of the fix (if helpful)"
  },
  "relatedIssues": ["Other potential problems in the same area"],
  "preventionTip": "How to avoid this in the future"
}`;

  const userPrompt = `Debug this issue: "${userMessage}"

${errorContext.errorFile ? `File: ${errorContext.errorFile}` : ''}
${errorContext.errorType ? `Error Type: ${errorContext.errorType}` : ''}
${errorContext.errorMessage ? `Error Message: ${errorContext.errorMessage}` : ''}

Code Context:
\`\`\`
${code}
\`\`\`

${errorContext.stackTrace ? `Stack Trace:\n${errorContext.stackTrace}` : ''}

Analyze the root cause and provide a targeted fix strategy.`;

  try {
    const diagnosis = await callLLMForJSON({
      model: MODELS.MODIFIER, // Use stronger model for complex analysis
      systemPrompt,
      userPrompt,
      maxTokens: 3000,  // Increased for GPT-5 reasoning tokens + output
      temperature: 0.2 // Low temperature for accurate diagnosis
    });

    return {
      ...diagnosis,
      metadata: {
        analyzedAt: new Date().toISOString(),
        file: errorContext.errorFile,
        userMessage
      }
    };
  } catch (error) {
    console.error("Debug diagnosis error:", error);
    // Fallback to basic analysis
    return {
      errorType: "unknown",
      rootCause: "Unable to perform detailed analysis. Please check the code manually.",
      explanation: `Error occurred while analyzing: ${error.message}`,
      affectedCode: {
        location: errorContext.errorFile || "unknown",
        problematicPattern: "Could not identify",
        whyItFails: "Analysis failed"
      },
      fixStrategy: {
        approach: "Manual debugging required",
        minimalChanges: "Review the code carefully and test incrementally",
        codeExample: ""
      },
      relatedIssues: [],
      preventionTip: "Use React DevTools and add error boundaries for better debugging",
      metadata: {
        analyzedAt: new Date().toISOString(),
        file: errorContext.errorFile,
        userMessage,
        fallback: true
      }
    };
  }
}

/**
 * ============================================================================
 * INTELLIGENT ERROR DIAGNOSIS SYSTEM
 * Hybrid approach: Error-first categorization + Multi-layer pattern scanning
 * ============================================================================
 */

/**
 * Categorize error by type based on error message
 * Maps runtime errors to diagnostic categories for targeted scanning
 * @param {string} errorMessage - Runtime error message from browser/console
 * @returns {string} - Error category (BROWSER_INCOMPATIBILITY, NULL_ACCESS, etc.)
 */
function categorizeError(errorMessage) {
  if (!errorMessage || typeof errorMessage !== 'string') return 'UNKNOWN';

  const msg = errorMessage.toLowerCase();

  // Browser incompatibility patterns (Node.js code in browser)
  if (msg.includes('require is not defined') ||
      msg.includes('process is not defined') ||
      msg.includes('__dirname') || msg.includes('__filename') ||
      msg.includes('module is not defined') ||
      msg.includes('exports is not defined')) {
    return 'BROWSER_INCOMPATIBILITY';
  }

  // Null/undefined access errors
  if (msg.includes('cannot read propert') ||
      msg.includes('cannot access') ||
      msg.includes('undefined is not') ||
      msg.includes('null is not')) {
    return 'NULL_ACCESS';
  }

  // React rendering issues
  if (msg.includes('too many re-renders') ||
      msg.includes('maximum update depth exceeded') ||
      msg.includes('maximum call stack')) {
    return 'INFINITE_RENDER';
  }

  // Type errors
  if (msg.includes('is not a function') ||
      msg.includes('is not iterable') ||
      msg.includes('is not defined')) {
    return 'TYPE_MISMATCH';
  }

  // Hook violations
  if (msg.includes('hook') && (msg.includes('called conditionally') ||
      msg.includes('rendered more hooks') ||
      msg.includes('rendered fewer hooks'))) {
    return 'HOOKS_VIOLATION';
  }

  // Syntax errors
  if (msg.includes('unexpected token') ||
      msg.includes('unexpected end of input') ||
      msg.includes('syntaxerror') ||
      msg.includes('unexpected identifier')) {
    return 'SYNTAX_ERROR';
  }

  // Async unmount issues (Fix 2: categorize unmount errors)
  if (msg.includes('unmounted') ||
      msg.includes('memory leak') ||
      msg.includes('state update on unmounted')) {
    return 'ASYNC_UNMOUNT';
  }

  // Sandpack-specific issues (Sandpack awareness)
  if (msg.includes('white screen') ||
      msg.includes('cors') ||
      msg.includes('failed to load resource') ||
      msg.includes('preview broke') ||
      msg.includes('page reload')) {
    return 'SANDPACK_NAVIGATION';
  }

  // Package not available (Sandpack awareness)
  if (msg.includes('cannot find module') ||
      msg.includes('is not defined') && (msg.includes('axios') || msg.includes('lodash') || msg.includes('uuid'))) {
    return 'BANNED_PACKAGE';
  }

  return 'UNKNOWN';
}

/**
 * Scan for browser incompatibility issues
 * Detects Node.js-specific code that won't work in browsers
 * @param {string} code - Code to scan
 * @param {string} errorMessage - Optional error message for prioritization
 * @returns {Array} - Array of browser compatibility issues with scores
 */
function scanBrowserCompatibility(code, errorMessage = '') {
  const issues = [];

  // Priority 1: require() usage (CommonJS syntax)
  if (code.includes('require(')) {
    issues.push({
      type: 'browser-incompatible',
      pattern: 'require() syntax (Node.js only)',
      fix: 'Convert to ES6 import statements',
      severity: 'critical',
      score: errorMessage.includes('require') ? 100 : 80
    });
  }

  // Priority 2: Node.js global APIs
  const nodeAPIs = [
    { pattern: 'process.', name: 'process' },
    { pattern: '__dirname', name: '__dirname' },
    { pattern: '__filename', name: '__filename' },
    { pattern: 'module.exports', name: 'module.exports' },
    { pattern: 'exports.', name: 'exports' }
  ];

  nodeAPIs.forEach(api => {
    if (code.includes(api.pattern)) {
      issues.push({
        type: 'nodejs-api',
        pattern: `${api.name} (Node.js only)`,
        fix: 'Remove or replace with browser-compatible alternative',
        severity: 'critical',
        score: errorMessage.toLowerCase().includes(api.name) ? 100 : 70
      });
    }
  });

  return issues;
}

/**
 * Scan for React-specific pattern issues
 * Detects common React anti-patterns and violations
 * @param {string} code - Code to scan
 * @param {string} errorMessage - Optional error message for prioritization
 * @returns {Array} - Array of React pattern issues with scores
 */
function scanReactPatterns(code, errorMessage = '') {
  const issues = [];

  // State mutation (array methods)
  if (code.match(/\w+\.(push|pop|shift|unshift|splice)\(/)) {
    issues.push({
      type: 'state-mutation',
      pattern: 'Direct array mutation (e.g., arr.push())',
      fix: 'Use spread operator: setState([...arr, newItem])',
      severity: 'medium',
      score: 40
    });
  }

  // Missing useEffect dependencies
  if (code.match(/useEffect\([^,]*,\s*\[\s*\]\s*\)/)) {
    issues.push({
      type: 'missing-dependencies',
      pattern: 'Empty dependency array might be incorrect',
      fix: 'Add all used variables to dependency array or use ESLint',
      severity: 'low',
      score: 20
    });
  }

  // Event handler called immediately
  if (code.match(/onClick=\{\w+\([^)]*\)\}/)) {
    issues.push({
      type: 'event-handler',
      pattern: 'Function called immediately: onClick={fn()}',
      fix: 'Pass function reference: onClick={() => fn()} or onClick={fn}',
      severity: 'medium',
      score: 50
    });
  }

  // Form without preventDefault
  if (code.match(/<form[^>]*>/) && !code.includes('preventDefault')) {
    issues.push({
      type: 'form-handling',
      pattern: 'Form without preventDefault',
      fix: 'Add e.preventDefault() in form submit handler',
      severity: 'medium',
      score: 30
    });
  }

  // Conditional hooks (React rules violation)
  if (code.match(/(if|while|for)\s*\([^)]*\)\s*\{[^}]*use[A-Z]/)) {
    issues.push({
      type: 'hooks-rules',
      pattern: 'Hook called conditionally',
      fix: 'Move hook to top level or use conditional logic inside hook',
      severity: 'critical',
      score: errorMessage.toLowerCase().includes('hook') ? 90 : 60
    });
  }

  // Async state updates
  if (code.match(/async\s+\([^)]*\)\s*=>\s*\{[^}]*set[A-Z]\w+\(/)) {
    issues.push({
      type: 'async-state',
      pattern: 'Async function with state updates',
      fix: 'Add cleanup to prevent state updates after unmount',
      severity: 'medium',
      score: 35
    });
  }

  // Async state updates in useEffect without cleanup (Fix 2: detect unmount issues)
  // Detects: useEffect(() => { fetch(...).then(...setData(...)) }, [...])
  // Use a more flexible regex that handles nested braces
  if (code.match(/useEffect\s*\([\s\S]*?\.then\s*\([\s\S]*?set[A-Z]\w+/) &&
      code.includes('useEffect')) {
    // Check if cleanup function exists in any useEffect
    const hasCleanup = code.match(/useEffect\s*\([\s\S]*?return\s*\(\s*\)\s*=>/) ||
                       code.match(/useEffect\s*\([\s\S]*?return\s+function/) ||
                       code.match(/useEffect\s*\([\s\S]*?return\s*\(\)/);

    if (!hasCleanup) {
      issues.push({
        type: 'async-unmount',
        pattern: 'Async state update in useEffect without cleanup',
        fix: 'Add cleanup: let mounted=true; return () => {mounted=false}',
        severity: 'high',
        score: errorMessage.toLowerCase().includes('unmount') ? 85 : 45
      });
    }
  }

  // Sandpack navigation issues (Sandpack awareness: detect white screen bugs)
  // Detects: <a href="#"> which causes page reload in Sandpack iframe
  if (code.match(/<a\s+[^>]*href=["']#["']/)) {
    issues.push({
      type: 'sandpack-navigation',
      pattern: '<a href="#"> causes white screen in Sandpack preview',
      fix: 'Replace with <button onClick={handler}> to prevent page reload',
      severity: 'critical',
      score: errorMessage.toLowerCase().includes('white screen') ||
             errorMessage.toLowerCase().includes('cors') ||
             errorMessage.toLowerCase().includes('reload') ? 95 : 60
    });
  }

  // Banned packages detection (Sandpack awareness)
  const bannedPackages = ['prop-types', 'axios', 'lodash', 'moment', 'uuid'];
  for (const pkg of bannedPackages) {
    if (code.includes(`from "${pkg}"`) || code.includes(`from '${pkg}'`)) {
      issues.push({
        type: 'banned-package',
        pattern: `Import from "${pkg}" (not available in Sandpack)`,
        fix: `Remove "${pkg}" - use native browser APIs instead`,
        severity: 'critical',
        score: 80
      });
    }
  }

  return issues;
}

/**
 * Scan for syntax issues
 * Detects unmatched brackets, braces, and parentheses
 * @param {string} code - Code to scan
 * @returns {Array} - Array of syntax issues with scores
 */
function scanSyntaxIssues(code) {
  const issues = [];

  // Check for unmatched brackets
  const brackets = { '{': 0, '[': 0, '(': 0 };
  const closeBrackets = { '}': '{', ']': '[', ')': '(' };

  for (const char of code) {
    if (char in brackets) brackets[char]++;
    if (char in closeBrackets) brackets[closeBrackets[char]]--;
  }

  if (brackets['{'] !== 0) {
    issues.push({
      type: 'syntax-error',
      pattern: 'Unmatched curly braces',
      fix: brackets['{'] > 0 ? 'Add missing closing }' : 'Remove extra closing }',
      severity: 'critical',
      score: 95
    });
  }

  if (brackets['['] !== 0) {
    issues.push({
      type: 'syntax-error',
      pattern: 'Unmatched brackets',
      fix: brackets['['] > 0 ? 'Add missing closing ]' : 'Remove extra closing ]',
      severity: 'critical',
      score: 95
    });
  }

  if (brackets['('] !== 0) {
    issues.push({
      type: 'syntax-error',
      pattern: 'Unmatched parentheses',
      fix: brackets['('] > 0 ? 'Add missing closing )' : 'Remove extra closing )',
      severity: 'critical',
      score: 95
    });
  }

  return issues;
}

/**
 * Parse error message for direct clues about the issue
 * Priority 1: Trust the error message as source of truth
 * This handles cases where error comes from transpiled/runtime code not in source
 *
 * @param {string} errorMessage - Runtime error message
 * @returns {Object|null} - Direct issue from error message, or null if no clear match
 */
function parseErrorForDirectClues(errorMessage) {
  if (!errorMessage || typeof errorMessage !== 'string') return null;

  const msg = errorMessage.toLowerCase();

  // Direct evidence of browser incompatibility
  if (msg.includes('require is not defined')) {
    return {
      type: 'browser-incompatible',
      pattern: 'require() usage (detected from error)',
      fix: 'Convert require() statements to ES6 import syntax',
      severity: 'critical',
      score: 100,
      source: 'error-message'
    };
  }

  if (msg.includes('process is not defined')) {
    return {
      type: 'nodejs-api',
      pattern: 'process API usage (detected from error)',
      fix: 'Remove process API - it only works in Node.js, not browsers',
      severity: 'critical',
      score: 100,
      source: 'error-message'
    };
  }

  if (msg.includes('module is not defined') || msg.includes('exports is not defined')) {
    return {
      type: 'nodejs-api',
      pattern: 'CommonJS module syntax (detected from error)',
      fix: 'Use ES6 modules (import/export) instead of CommonJS (module.exports)',
      severity: 'critical',
      score: 100,
      source: 'error-message'
    };
  }

  if (msg.includes('__dirname') || msg.includes('__filename')) {
    return {
      type: 'nodejs-api',
      pattern: '__dirname or __filename usage (detected from error)',
      fix: 'Remove Node.js-specific path variables',
      severity: 'critical',
      score: 100,
      source: 'error-message'
    };
  }

  return null;
}

/**
 * Intelligent error diagnosis - HYBRID APPROACH
 * Combines error-first categorization with comprehensive pattern scanning
 * Uses scoring system to prioritize most relevant issues
 *
 * @param {string} errorMessage - Runtime error message from browser/console
 * @param {string} code - Code to analyze
 * @returns {Object} Diagnosis with prioritized issues
 */
function diagnoseIntelligent(errorMessage, code) {
  // Guard: ensure we have valid code
  if (!code || typeof code !== 'string') {
    return {
      category: 'UNKNOWN',
      issuesFound: 0,
      issues: [],
      primaryIssue: null,
      recommendation: 'No code provided for diagnosis'
    };
  }

  // PRIORITY 0: Check if error message directly tells us the issue
  // This handles cases where the error is from transpiled/runtime code not visible in source
  const errorClue = parseErrorForDirectClues(errorMessage);
  if (errorClue) {
    console.log(`🎯 Direct clue from error message: ${errorClue.pattern}`);
    return {
      category: categorizeError(errorMessage),
      issuesFound: 1,
      issues: [errorClue],
      primaryIssue: errorClue,
      recommendation: `Error message directly indicates: ${errorClue.pattern}`,
      source: 'error-message-parsing'
    };
  }

  // Layer 1: Categorize the error by type
  const category = categorizeError(errorMessage);

  // Layer 2: Run targeted scan based on error category
  let primaryIssues = [];

  if (category === 'BROWSER_INCOMPATIBILITY') {
    // Focus on browser compatibility issues first
    primaryIssues = scanBrowserCompatibility(code, errorMessage);
  } else if (category === 'SYNTAX_ERROR') {
    // Focus on syntax issues first
    primaryIssues = scanSyntaxIssues(code);
  } else if (category === 'HOOKS_VIOLATION') {
    // Focus on React hooks violations
    primaryIssues = scanReactPatterns(code, errorMessage)
      .filter(i => i.type === 'hooks-rules');
  } else if (category === 'INFINITE_RENDER') {
    // Focus on state mutation and event handler issues
    primaryIssues = scanReactPatterns(code, errorMessage)
      .filter(i => i.type === 'state-mutation' || i.type === 'event-handler');
  } else if (category === 'ASYNC_UNMOUNT') {
    // Focus on async state update issues (Fix 2: targeted scan)
    primaryIssues = scanReactPatterns(code, errorMessage)
      .filter(i => i.type === 'async-unmount' || i.type === 'async-state');
  } else if (category === 'SANDPACK_NAVIGATION') {
    // Focus on Sandpack navigation issues (Sandpack awareness)
    primaryIssues = scanReactPatterns(code, errorMessage)
      .filter(i => i.type === 'sandpack-navigation');
  } else if (category === 'BANNED_PACKAGE') {
    // Focus on banned package imports (Sandpack awareness)
    primaryIssues = scanReactPatterns(code, errorMessage)
      .filter(i => i.type === 'banned-package');
  }

  // Layer 3: Run comprehensive scan for additional issues (fallback)
  const allIssues = [
    ...primaryIssues,
    ...scanBrowserCompatibility(code, errorMessage),
    ...scanReactPatterns(code, errorMessage),
    ...scanSyntaxIssues(code)
  ];

  // Remove duplicates (based on pattern)
  const uniqueIssues = Array.from(
    new Map(allIssues.map(i => [i.pattern, i])).values()
  );

  // Sort by score (highest first = most relevant)
  uniqueIssues.sort((a, b) => b.score - a.score);

  // Build recommendation message
  let recommendation;
  if (uniqueIssues.length === 0) {
    recommendation = 'No obvious issues found - may need deeper analysis or LLM diagnosis';
  } else {
    const primary = uniqueIssues[0];
    recommendation = `Found ${uniqueIssues.length} issue(s). Primary: ${primary.pattern} (severity: ${primary.severity})`;
  }

  return {
    category,
    issuesFound: uniqueIssues.length,
    issues: uniqueIssues,
    primaryIssue: uniqueIssues[0] || null,
    recommendation
  };
}

/**
 * Quick pattern-based bug detection
 * Fast heuristic-based analysis for common issues
 * @deprecated Use diagnoseIntelligent() for better error-first diagnosis
 * @param {string} code - Code to analyze
 * @returns {Object} Quick diagnosis (legacy format for backward compatibility)
 */
export function quickDiagnose(code) {
  // Use new intelligent diagnosis without error message (pattern-only fallback)
  const result = diagnoseIntelligent('', code);

  // Convert to legacy format for backward compatibility
  return {
    quickScan: true,
    issuesFound: result.issuesFound,
    issues: result.issues.map(issue => ({
      type: issue.type,
      pattern: issue.pattern,
      fix: issue.fix
      // Note: severity and score omitted for backward compatibility
    })),
    recommendation: result.recommendation
  };
}

/**
 * Generate fix suggestions for common patterns
 * @param {string} errorType - Type of error
 * @returns {Object} Fix suggestions
 */
export function getFixSuggestions(errorType) {
  const suggestions = {
    "state-mutation": {
      problem: "Direct state mutation doesn't trigger re-render",
      solution: "Use immutable updates",
      examples: [
        "❌ arr.push(item) → ✅ setArr([...arr, item])",
        "❌ obj.key = val → ✅ setObj({...obj, key: val})"
      ]
    },
    "event-handler": {
      problem: "Function called immediately instead of on event",
      solution: "Pass function reference or use arrow function",
      examples: [
        "❌ onClick={handleClick()} → ✅ onClick={handleClick}",
        "❌ onClick={handleClick(id)} → ✅ onClick={() => handleClick(id)}"
      ]
    },
    "hooks-rules": {
      problem: "Hooks must be called in same order every render",
      solution: "Move hooks to top level",
      examples: [
        "❌ if (x) { useState(0); } → ✅ const [val, setVal] = useState(x ? 0 : null);"
      ]
    },
    "async-state": {
      problem: "State update on unmounted component",
      solution: "Add cleanup or check mounted status",
      examples: [
        "useEffect(() => { let mounted = true; fetchData().then(d => mounted && setData(d)); return () => mounted = false; }, []);"
      ]
    },
    "missing-dependencies": {
      problem: "useEffect may use stale values",
      solution: "Add all dependencies or use functional updates",
      examples: [
        "✅ useEffect(() => {...}, [dep1, dep2]);",
        "✅ setCount(c => c + 1); // functional update doesn't need count in deps"
      ]
    },
    "async-unmount": {
      problem: "Async state update after component unmounts causes memory leak",
      solution: "Add cleanup function to track mounted state",
      examples: [
        "useEffect(() => { let mounted = true; fetch(...).then(d => mounted && setData(d)); return () => { mounted = false; }; }, []);"
      ]
    },
    "sandpack-navigation": {
      problem: "Navigation links with href='#' cause page reload in Sandpack iframe, breaking the preview",
      solution: "Use buttons for navigation instead of anchor tags",
      examples: [
        "❌ <a href=\"#\" onClick={handleClick}>Link</a>",
        "✅ <button onClick={handleClick} className=\"text-blue-600 hover:underline\">Link</button>"
      ]
    },
    "banned-package": {
      problem: "External packages not available in Sandpack browser environment",
      solution: "Use native browser APIs instead",
      examples: [
        "❌ import axios from 'axios'; → ✅ use fetch()",
        "❌ import _ from 'lodash'; → ✅ use native Array methods",
        "❌ import { v4 } from 'uuid'; → ✅ use crypto.randomUUID()"
      ]
    }
  };

  return suggestions[errorType] || {
    problem: "Unknown error type",
    solution: "Manual debugging required",
    examples: []
  };
}

/**
 * Extract filename from error message
 * @param {string} errorMessage - Error message containing filename
 * @returns {string|null} Extracted filename or null
 */
function extractFilenameFromError(errorMessage) {
  // Try to match patterns like:
  // - "components/TodoList.jsx:142"
  // - "Syntax error in components/TodoList.jsx: ..."
  // - "Source: components/TodoList.jsx:142"
  const patterns = [
    /(?:in|Source:)\s+([^\s:]+\.(jsx?|tsx?)):(\d+)/,  // "in file.jsx:line"
    /([^\s:]+\.(jsx?|tsx?)):(\d+)/,  // "file.jsx:line"
    /([^\s]+\.(jsx?|tsx?))/  // just "file.jsx"
  ];

  for (const pattern of patterns) {
    const match = errorMessage.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Backward compatibility wrapper for old agentOrchestrator.js
 * Combines diagnosis + fix into one function (old API)
 * @param {string} userMessage - User's error description
 * @param {Object} currentFiles - Current files map
 * @returns {Promise<Object>} Old-style debug result
 */
export async function debugAndFix(userMessage, currentFiles) {
  try {
    // Step 1: Use intelligent diagnose with error message (Fix 2: better detection)
    const files = Object.values(currentFiles);
    const allCode = files.join('\n');
    const diagnosis = diagnoseIntelligent(userMessage, allCode);

    if (diagnosis.issuesFound === 0) {
      return {
        success: false,
        message: 'Could not identify the bug automatically. Please provide more details.',
        diagnosis: 'No obvious issues found',
        bugType: 'unknown',
        severity: 'unknown',
        fixedFiles: []
      };
    }

    const mainIssue = diagnosis.primaryIssue || diagnosis.issues[0];

    // Step 2: Extract target file from error message
    const targetFile = extractFilenameFromError(userMessage);

    if (!targetFile) {
      // If we can't identify the specific file, return diagnosis without fix
      return {
        success: true,
        diagnosis: mainIssue.pattern,
        bugType: mainIssue.type,
        severity: 'medium',
        fixedFiles: [],
        suggestion: mainIssue.fix,
        message: `Detected ${mainIssue.type}: ${mainIssue.pattern}\n\nSuggested fix: ${mainIssue.fix}\n\nNote: Could not identify specific file to fix. Please specify the file name.`
      };
    }

    // Step 3: Check if the target file exists in currentFiles
    if (!currentFiles[targetFile]) {
      return {
        success: false,
        message: `File not found: ${targetFile}`,
        diagnosis: mainIssue.pattern,
        bugType: mainIssue.type,
        severity: 'medium',
        fixedFiles: []
      };
    }

    // Step 4: Use modifier agent to generate fixed code (Tier 1: single file only)
    console.log(`🔧 Fixing bug in ${targetFile}...`);

    const fixPrompt = `Fix this bug in the code:

Bug Type: ${mainIssue.type}
Issue: ${mainIssue.pattern}
Suggested Fix: ${mainIssue.fix}

IMPORTANT:
- Make ONLY the minimal changes needed to fix this specific bug
- Do not change functionality, styling, or structure unless directly related to the bug
- Preserve all existing code that is not part of the bug fix
- Return COMPLETE, working code`;

    const result = await modifyCode({
      currentCode: currentFiles[targetFile],
      userMessage: fixPrompt,
      filename: targetFile
    });

    // Extract code from result (modifyCode returns { code: "..." })
    const fixedCode = result.code || result;

    // Step 5: Return fixed file
    return {
      success: true,
      diagnosis: mainIssue.pattern,
      bugType: mainIssue.type,
      severity: 'medium',
      fixedFiles: [{
        filename: targetFile,
        fixedCode: fixedCode
      }],
      suggestion: mainIssue.fix,
      message: `Detected ${mainIssue.type}: ${mainIssue.pattern}\n\nFixed in: ${targetFile}`
    };

  } catch (error) {
    console.error('Error in debugAndFix:', error);
    return {
      success: false,
      message: `Failed to fix bug: ${error.message}`,
      diagnosis: 'Error during fix generation',
      bugType: 'unknown',
      severity: 'unknown',
      fixedFiles: []
    };
  }
}

/**
 * ITERATIVE DEBUGGER - Learn from failures and retry
 * Industry-standard pattern: validate → fix → test → learn → retry
 */

/**
 * Check if we're stuck in a loop (same error twice)
 */
function isStuckInLoop(attemptHistory) {
  if (attemptHistory.length < 2) return false;

  const lastTwo = attemptHistory.slice(-2);
  const lastErrors = JSON.stringify(lastTwo[1].validation.issues.map(i => i.pattern).sort());
  const prevErrors = JSON.stringify(lastTwo[0].validation.issues.map(i => i.pattern).sort());

  return lastErrors === prevErrors;
}

/**
 * Build prompt with learnings from previous attempts
 */
function buildPromptWithHistory({ diagnosis, attemptHistory, attempt, fixPrompt }) {
  let prompt = fixPrompt;

  if (attemptHistory.length === 0) {
    return prompt; // First attempt, no history yet
  }

  // Add learnings from previous attempts
  prompt += `\n\n⚠️ PREVIOUS ATTEMPTS FAILED - LEARN FROM THESE MISTAKES:\n`;

  attemptHistory.forEach((history, i) => {
    prompt += `\nAttempt ${i + 1} validation issues:\n`;
    prompt += formatIssuesForLLM(history.validation.issues);
  });

  prompt += `\n\n🎯 For attempt ${attempt}, you MUST:\n`;
  prompt += generateSpecificInstructions(attemptHistory);
  prompt += `\n\nIMPORTANT: This is a BROWSER environment. DO NOT use Node.js syntax or APIs.`;

  return prompt;
}

/**
 * Generate specific instructions based on what failed
 */
function generateSpecificInstructions(history) {
  const instructions = [];
  const lastAttempt = history[history.length - 1];
  const seenTypes = new Set();

  lastAttempt.validation.issues.forEach(issue => {
    if (seenTypes.has(issue.type)) return; // Avoid duplicate instructions
    seenTypes.add(issue.type);

    switch (issue.type) {
      case 'browser-incompatible':
        instructions.push('- Use ONLY ES6 import syntax: import X from "Y"');
        instructions.push('- NEVER use require() - it crashes in browsers');
        break;
      case 'nodejs-api':
        instructions.push('- Remove ALL Node.js APIs (process, fs, __dirname, etc.)');
        instructions.push('- This code runs in a browser, not Node.js');
        break;
      case 'syntax':
        instructions.push('- Fix syntax errors - check matching brackets/braces/parens');
        break;
      case 'anti-pattern':
        instructions.push('- Follow React best practices');
        instructions.push('- Use React patterns (state, refs) instead of direct DOM');
        break;
    }
  });

  if (instructions.length === 0) {
    instructions.push('- Review the validation errors above carefully');
    instructions.push('- Make surgical, minimal changes to fix ONLY those issues');
  }

  return instructions.join('\n');
}

/**
 * Iterative Debug and Fix - Learns from failures
 * @param {Object} params - Same as debugAndFix
 * @returns {Promise<Object>} - Fix result with iteration history
 */
export async function debugAndFixIterative({
  errorMessage,
  currentFiles,
  userMessage
}) {
  const maxAttempts = 3;
  const attemptHistory = [];

  try {
    // Step 1: Intelligent diagnosis (error-first approach)
    const files = Object.values(currentFiles);
    const allCode = files.join('\n');
    const diagnosis = diagnoseIntelligent(errorMessage, allCode);

    console.log(`🔍 Diagnosis category: ${diagnosis.category}`);
    console.log(`🔍 Found ${diagnosis.issuesFound} issue(s)`);

    // Debug: Log all issues with scores
    if (diagnosis.issues && diagnosis.issues.length > 0) {
      console.log(`📊 All issues found:`);
      diagnosis.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. [Score: ${issue.score}] ${issue.type}: ${issue.pattern}`);
      });
      console.log(`✨ Primary issue selected: ${diagnosis.primaryIssue?.type} (${diagnosis.primaryIssue?.pattern})`);
    }

    const mainIssue = diagnosis.primaryIssue || {
      type: 'unknown-error',
      pattern: errorMessage || 'Unknown error',
      fix: 'Review the error message and code',
      severity: 'medium',
      score: 0
    };

    // Step 2: Invoke File Scanner Agent to find the actual file with the bug
    // AutoGen Pattern: Agent delegation - debugger invokes specialist scanner agent
    let targetFile = extractFilenameFromError(errorMessage) || Object.keys(currentFiles)[0];
    let scanResult = null;

    // For browser incompatibility issues, use File Scanner Agent to find the culprit
    if (diagnosis.category === 'BROWSER_INCOMPATIBILITY') {
      // Determine what pattern to search for based on the issue
      let searchPattern = 'require(';
      if (mainIssue.pattern.toLowerCase().includes('process')) {
        searchPattern = 'process.';
      } else if (mainIssue.pattern.toLowerCase().includes('module.exports')) {
        searchPattern = 'module.exports';
      } else if (mainIssue.pattern.toLowerCase().includes('exports.')) {
        searchPattern = 'exports.';
      } else if (mainIssue.pattern.toLowerCase().includes('__dirname')) {
        searchPattern = '__dirname';
      } else if (mainIssue.pattern.toLowerCase().includes('__filename')) {
        searchPattern = '__filename';
      }

      console.log(`🤖 Invoking File Scanner Agent to find: "${searchPattern}"`);

      // Invoke File Scanner Agent as a tool (AutoGen pattern)
      scanResult = await scanForIssue({
        currentFiles,
        startFile: targetFile,
        searchPattern,
        maxDepth: 5
      });

      if (scanResult.found) {
        console.log(`✅ File Scanner Agent found bug in: ${scanResult.filename}`);
        console.log(`   Import path: ${scanResult.importPath.join(' → ')}`);
        console.log(`   Scanned ${scanResult.scannedFiles.length} file(s)`);
        targetFile = scanResult.filename;
      } else {
        console.warn(`⚠️ File Scanner Agent: Pattern "${searchPattern}" not found`);
        console.warn(`   Scanned files: ${scanResult.scannedFiles.join(', ')}`);
        console.warn(`   Will attempt to fix ${targetFile} based on error message`);
      }
    }

    if (!currentFiles[targetFile]) {
      return {
        success: false,
        message: `File not found: ${targetFile}`,
        attempts: 0,
        iterations: [],
        scannedFiles: scanResult?.scannedFiles || []
      };
    }

    console.log(`🔧 Starting iterative fix for ${targetFile}...`);

    // Base fix prompt
    const baseFixPrompt = `Fix this bug in the code:

Bug Type: ${mainIssue.type}
Issue: ${mainIssue.pattern}
Suggested Fix: ${mainIssue.fix}

CRITICAL REQUIREMENTS:
- Make ONLY minimal changes to fix the bug
- Preserve existing functionality
- Return COMPLETE, working code
- This is BROWSER code - NO Node.js syntax`;

    // Iteration loop
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🔧 Attempt ${attempt}/${maxAttempts}...`);

      // Pre-process the code BEFORE sending to LLM (Fix 1: prevent LLM from reintroducing bugs)
      let codeToFix = currentFiles[targetFile];
      if (codeToFix.includes('require(')) {
        console.log(`⚙️ Pre-converting require() to import before LLM call...`);
        codeToFix = convertRequireToImport(codeToFix);
      }

      // Build prompt with learnings
      const enhancedPrompt = buildPromptWithHistory({
        diagnosis,
        attemptHistory,
        attempt,
        fixPrompt: baseFixPrompt
      });

      // Add critical constraint to prevent LLM from reintroducing require()
      const constrainedPrompt = enhancedPrompt +
        (codeToFix !== currentFiles[targetFile]
          ? `\n\n🚨 CRITICAL: The input code has already been converted from require() to ES6 import.
DO NOT reintroduce require() statements under ANY circumstance.
The code you receive already uses import syntax - keep it that way.`
          : '');

      // Generate fix with pre-processed code
      const result = await modifyCode({
        currentCode: codeToFix,
        userMessage: constrainedPrompt,
        filename: targetFile
      });

      let fixedCode = result.code || result;

      // Double-check: Auto-fix any remaining issues (backup safety net)
      if (fixedCode.includes('require(')) {
        console.log(`⚠️ LLM reintroduced require() - auto-converting again...`);
        fixedCode = convertRequireToImport(fixedCode);
      }

      // Validate the fix
      const validation = validateFix(fixedCode, {
        originalError: errorMessage,
        environment: 'browser',
        attempt
      });

      // Record attempt
      const attemptRecord = {
        attempt,
        code: fixedCode,
        validation,
        timestamp: Date.now()
      };
      attemptHistory.push(attemptRecord);

      // Success!
      if (validation.valid) {
        console.log(`✅ Fix succeeded on attempt ${attempt}`);
        return {
          success: true,
          diagnosis: mainIssue.pattern,
          bugType: mainIssue.type,
          severity: 'medium',
          fixedFiles: [{
            filename: targetFile,
            fixedCode: fixedCode
          }],
          suggestion: mainIssue.fix,
          message: `Fixed ${mainIssue.type} after ${attempt} attempt${attempt > 1 ? 's' : ''}`,
          attempts: attempt,
          iterations: attemptHistory
        };
      }

      // Failed - log issues
      console.log(`❌ Attempt ${attempt} failed with ${validation.issues.length} issue(s):`);
      validation.issues.forEach(issue => {
        console.log(`   - ${issue.type}: ${issue.message}`);
      });

      // Check if stuck in loop
      if (isStuckInLoop(attemptHistory)) {
        console.log('🔄 Detected infinite loop - breaking');
        break;
      }

      // Continue to next attempt
      if (attempt < maxAttempts) {
        console.log(`🔄 Retrying with enhanced prompt...`);
      }
    }

    // All attempts exhausted
    const finalValidation = attemptHistory[attemptHistory.length - 1].validation;
    return {
      success: false,
      message: `Failed to fix after ${maxAttempts} attempts\n\n${formatIssuesForLLM(finalValidation.issues)}`,
      diagnosis: mainIssue.pattern,
      bugType: mainIssue.type,
      severity: 'high',
      fixedFiles: [],
      attempts: maxAttempts,
      iterations: attemptHistory,
      finalIssues: finalValidation.issues
    };

  } catch (error) {
    console.error('Error in debugAndFixIterative:', error);
    return {
      success: false,
      message: `Iteration error: ${error.message}`,
      diagnosis: 'Error during iterative fix',
      bugType: 'unknown',
      severity: 'unknown',
      fixedFiles: [],
      attempts: attemptHistory.length,
      iterations: attemptHistory
    };
  }
}

export default {
  diagnoseBug,
  quickDiagnose,
  getFixSuggestions,
  debugAndFix,
  debugAndFixIterative
};
