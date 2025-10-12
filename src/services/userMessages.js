/**
 * User-Friendly Message System
 * Converts technical agent operations into friendly, understandable messages
 */

/**
 * Agent metadata with icons and friendly names
 */
export const AGENT_INFO = {
  intentClassifier: {
    emoji: '🎯',
    name: 'Intent Analyzer',
    color: '#3b82f6' // blue
  },
  planner: {
    emoji: '🎨',
    name: 'Planner',
    color: '#8b5cf6' // purple
  },
  analyzer: {
    emoji: '🔍',
    name: 'Code Analyzer',
    color: '#06b6d4' // cyan
  },
  generator: {
    emoji: '⚡',
    name: 'Code Generator',
    color: '#f59e0b' // amber
  },
  modifier: {
    emoji: '✏️',
    name: 'Code Modifier',
    color: '#10b981' // emerald
  },
  debugger: {
    emoji: '🐛',
    name: 'Debugger',
    color: '#ef4444' // red
  },
  reviewer: {
    emoji: '👁️',
    name: 'Code Reviewer',
    color: '#ec4899' // pink
  },
  planReviewer: {
    emoji: '📋',
    name: 'Plan Reviewer',
    color: '#6366f1' // indigo
  }
};

/**
 * Friendly message templates for each operation
 */
export const MESSAGE_TEMPLATES = {
  // Intent Classification
  classifyingIntent: {
    message: 'Understanding your request',
    detail: 'Analyzing what you want to build...',
    estimatedTime: '2-3s'
  },
  intentClassified: {
    message: 'Request understood',
    detail: (intent) => `Detected: ${getIntentDisplay(intent)}`,
    estimatedTime: null
  },

  // Planning
  creatingPlan: {
    message: 'Designing your app',
    detail: 'Creating a detailed plan...',
    estimatedTime: '10-15s'
  },
  reviewingPlan: {
    message: 'Reviewing the plan',
    detail: 'Checking quality and completeness...',
    estimatedTime: '5-8s'
  },
  refiningPlan: {
    message: 'Improving the plan',
    detail: (iteration) => `Refinement ${iteration}/2...`,
    estimatedTime: '8-12s'
  },
  planApproved: {
    message: 'Plan approved',
    detail: (score) => `Quality score: ${score}/100`,
    estimatedTime: null
  },

  // Analysis
  analyzingCodebase: {
    message: 'Analyzing your code',
    detail: 'Finding what needs to change...',
    estimatedTime: '5-8s'
  },
  analysisComplete: {
    message: 'Analysis complete',
    detail: (fileCount) => `Found ${fileCount} file${fileCount !== 1 ? 's' : ''} to modify`,
    estimatedTime: null
  },

  // Code Generation
  generatingFile: {
    message: 'Writing code',
    detail: (filename) => `Generating ${filename}...`,
    estimatedTime: '15-20s'
  },
  generatingMultipleFiles: {
    message: 'Writing code',
    detail: (count) => `Generating ${count} files in parallel...`,
    estimatedTime: (count) => `${15 + count * 5}-${20 + count * 8}s`
  },
  reviewingCode: {
    message: 'Reviewing code quality',
    detail: (filename) => `Checking ${filename}...`,
    estimatedTime: '5-8s'
  },
  refiningCode: {
    message: 'Improving code',
    detail: (filename, iteration) => `Refining ${filename} (iteration ${iteration}/2)...`,
    estimatedTime: '12-18s'
  },
  codeApproved: {
    message: 'Code approved',
    detail: (filename, score) => `${filename}: ${score}/100`,
    estimatedTime: null
  },

  // Code Modification
  modifyingFile: {
    message: 'Updating code',
    detail: (filename) => `Modifying ${filename}...`,
    estimatedTime: '12-18s'
  },

  // Debugging
  debuggingCode: {
    message: 'Finding the bug',
    detail: 'Analyzing code for issues...',
    estimatedTime: '10-15s'
  },
  bugFound: {
    message: 'Bug identified',
    detail: (bugType) => `Found: ${bugType}`,
    estimatedTime: null
  },
  fixingBug: {
    message: 'Fixing the bug',
    detail: 'Applying the fix...',
    estimatedTime: '12-18s'
  },

  // Validation
  validatingConsistency: {
    message: 'Validating code',
    detail: 'Checking cross-file consistency...',
    estimatedTime: '3-5s'
  },

  // Completion
  complete: {
    message: 'All done',
    detail: 'Your code is ready!',
    estimatedTime: null
  },

  // Errors
  error: {
    message: 'Something went wrong',
    detail: (errorMsg) => errorMsg,
    estimatedTime: null
  }
};

/**
 * Get user-friendly display for intent
 */
function getIntentDisplay(intent) {
  const intentMap = {
    'create_new': 'Create new app',
    'modify_existing': 'Modify existing code',
    'fix_bug': 'Fix a bug',
    'add_feature': 'Add a feature',
    'style_change': 'Change styling',
    'refactor': 'Refactor code',
    'explain': 'Explain code'
  };
  return intentMap[intent] || intent;
}

/**
 * Create a user-friendly update message
 * @param {string} agent - Agent name (e.g., 'planner', 'generator')
 * @param {string} operation - Operation key from MESSAGE_TEMPLATES
 * @param {Object} context - Additional context (iteration, filename, etc.)
 * @param {string} status - 'active' | 'complete' | 'error'
 * @returns {Object} Formatted update object
 */
export function createUserMessage(agent, operation, context = {}, status = 'active') {
  const agentInfo = AGENT_INFO[agent] || { emoji: '🤖', name: 'Agent', color: '#6b7280' };
  const template = MESSAGE_TEMPLATES[operation];

  if (!template) {
    console.warn(`Unknown operation: ${operation}`);
    return {
      agent: agentInfo.name,
      emoji: agentInfo.emoji,
      message: operation,
      detail: null,
      estimatedTime: null,
      status,
      color: agentInfo.color
    };
  }

  // Resolve detail if it's a function
  let detail = template.detail;
  if (typeof detail === 'function') {
    detail = detail(context.value || context.filename || context.iteration || context);
  }

  // Resolve estimated time if it's a function
  let estimatedTime = template.estimatedTime;
  if (typeof estimatedTime === 'function') {
    estimatedTime = estimatedTime(context.count || context.value || 1);
  }

  return {
    agent: agentInfo.name,
    emoji: agentInfo.emoji,
    message: template.message,
    detail,
    estimatedTime,
    status,
    color: agentInfo.color
  };
}

/**
 * Progress tracker for multi-step operations
 */
export class ProgressTracker {
  constructor(totalSteps = 0) {
    this.totalSteps = totalSteps;
    this.currentStep = 0;
    this.startTime = Date.now();
  }

  /**
   * Move to next step
   * @returns {Object} Progress info
   */
  next() {
    this.currentStep++;
    return this.getProgress();
  }

  /**
   * Get current progress
   * @returns {Object} Progress info with percentage and text
   */
  getProgress() {
    const percentage = this.totalSteps > 0
      ? Math.round((this.currentStep / this.totalSteps) * 100)
      : 0;

    return {
      current: this.currentStep,
      total: this.totalSteps,
      percentage,
      text: this.totalSteps > 0 ? `${this.currentStep}/${this.totalSteps}` : null
    };
  }

  /**
   * Get elapsed time
   * @returns {number} Elapsed time in seconds
   */
  getElapsedTime() {
    return Math.round((Date.now() - this.startTime) / 1000);
  }

  /**
   * Set total steps (useful when count is unknown initially)
   * @param {number} total - Total steps
   */
  setTotal(total) {
    this.totalSteps = total;
  }
}

/**
 * Format time estimate for display
 * @param {string} estimate - Time estimate (e.g., "10-15s")
 * @returns {string} Formatted time
 */
export function formatTimeEstimate(estimate) {
  if (!estimate) return null;
  return `~${estimate}`;
}

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @param {string} context - What was being done when error occurred
 * @returns {Object} User-friendly error message with suggestion
 */
export function getUserFriendlyError(error, context = '') {
  // Common error patterns
  const errorPatterns = [
    {
      pattern: /rate limit/i,
      message: 'API rate limit reached',
      suggestion: 'Please wait a moment and try again. The service is temporarily busy.'
    },
    {
      pattern: /timeout/i,
      message: 'Request took too long',
      suggestion: 'Try simplifying your request or breaking it into smaller parts.'
    },
    {
      pattern: /network|fetch/i,
      message: 'Network connection issue',
      suggestion: 'Check your internet connection and try again.'
    },
    {
      pattern: /API key|unauthorized|authentication/i,
      message: 'Authentication issue',
      suggestion: 'Please check your API key configuration.'
    },
    {
      pattern: /token|context/i,
      message: 'Request too complex',
      suggestion: 'Try simplifying your request or working on smaller sections.'
    }
  ];

  const errorMessage = error.message || error.toString();

  // Find matching pattern
  const match = errorPatterns.find(p => p.pattern.test(errorMessage));

  if (match) {
    return {
      message: match.message,
      suggestion: match.suggestion,
      technical: errorMessage, // Keep for console logging
      context
    };
  }

  // Default friendly error
  return {
    message: 'Something unexpected happened',
    suggestion: 'Please try again. If the problem persists, try simplifying your request.',
    technical: errorMessage,
    context
  };
}

export default {
  AGENT_INFO,
  MESSAGE_TEMPLATES,
  createUserMessage,
  ProgressTracker,
  formatTimeEstimate,
  getUserFriendlyError
};
