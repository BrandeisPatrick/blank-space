import { callLLMForJSON } from "../utils/llmClient.js";
import { MODELS } from "../config/modelConfig.js";
import compressedPrompts from "../compressedPrompts.json" with { type: "json" };

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
  const systemPrompt = `You are a React debugging specialist.
Your job is to:
1. Identify the root cause of bugs
2. Explain WHY the bug occurs
3. Provide a targeted fix strategy

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
      maxTokens: 1500,
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
 * Quick pattern-based bug detection
 * Fast heuristic-based analysis for common issues
 * @param {string} code - Code to analyze
 * @returns {Object} Quick diagnosis
 */
export function quickDiagnose(code) {
  const issues = [];

  // Check for direct state mutation
  if (code.match(/\w+\.(push|pop|shift|unshift|splice)\(/)) {
    issues.push({
      type: "state-mutation",
      pattern: "Direct array mutation (e.g., arr.push())",
      fix: "Use spread operator: setState([...arr, newItem])"
    });
  }

  // Check for missing useEffect dependencies
  if (code.match(/useEffect\([^,]*,\s*\[\s*\]\s*\)/)) {
    issues.push({
      type: "missing-dependencies",
      pattern: "Empty dependency array might be incorrect",
      fix: "Add all used variables to dependency array or use ESLint"
    });
  }

  // Check for function calls in onClick
  if (code.match(/onClick=\{\w+\([^)]*\)\}/)) {
    issues.push({
      type: "event-handler",
      pattern: "Function called immediately: onClick={fn()}",
      fix: "Pass function reference: onClick={() => fn()} or onClick={fn}"
    });
  }

  // Check for missing preventDefault
  if (code.match(/<form[^>]*>/) && !code.includes('preventDefault')) {
    issues.push({
      type: "form-handling",
      pattern: "Form without preventDefault",
      fix: "Add e.preventDefault() in form submit handler"
    });
  }

  // Check for conditional hooks
  if (code.match(/(if|while|for)\s*\([^)]*\)\s*\{[^}]*use[A-Z]/)) {
    issues.push({
      type: "hooks-rules",
      pattern: "Hook called conditionally",
      fix: "Move hook to top level or use conditional logic inside hook"
    });
  }

  // Check for async issues
  if (code.match(/async\s+\([^)]*\)\s*=>\s*\{[^}]*set[A-Z]\w+\(/)) {
    issues.push({
      type: "async-state",
      pattern: "Async function with state updates",
      fix: "Add cleanup to prevent state updates after unmount"
    });
  }

  return {
    quickScan: true,
    issuesFound: issues.length,
    issues,
    recommendation: issues.length > 0
      ? "Found potential issues - review the patterns above"
      : "No obvious issues found - may need deeper analysis"
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
    }
  };

  return suggestions[errorType] || {
    problem: "Unknown error type",
    solution: "Manual debugging required",
    examples: []
  };
}

/**
 * Backward compatibility wrapper for old agentOrchestrator.js
 * Combines diagnosis + fix into one function (old API)
 * @param {string} userMessage - User's error description
 * @param {Object} currentFiles - Current files map
 * @returns {Promise<Object>} Old-style debug result
 */
export async function debugAndFix(userMessage, currentFiles) {
  // Use quick diagnose for fast pattern detection
  const files = Object.values(currentFiles);
  const allCode = files.join('\n');
  const quickResult = quickDiagnose(allCode);

  if (quickResult.issuesFound === 0) {
    return {
      success: false,
      message: 'Could not identify the bug automatically. Please provide more details.',
      diagnosis: 'No obvious issues found',
      bugType: 'unknown',
      severity: 'unknown',
      fixedFiles: []
    };
  }

  // For now, return pattern-based diagnosis
  // In the future, this could integrate with the modifier agent
  const mainIssue = quickResult.issues[0];

  return {
    success: true,
    diagnosis: mainIssue.pattern,
    bugType: mainIssue.type,
    severity: 'medium',
    fixedFiles: [],
    suggestion: mainIssue.fix,
    message: `Detected ${mainIssue.type}: ${mainIssue.pattern}\n\nSuggested fix: ${mainIssue.fix}`
  };
}

export default {
  diagnoseBug,
  quickDiagnose,
  getFixSuggestions,
  debugAndFix
};
