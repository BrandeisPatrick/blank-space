/**
 * Smart Agent Routing System
 * Determines which agents are needed based on the request type
 * Skips unnecessary agents to optimize performance
 */

/**
 * Route configuration for different intent types
 */
const ROUTING_CONFIG = {
  // Simple text change - skip planner, go straight to modifier
  simpleTextChange: {
    skipPlanner: true,
    skipAnalyzer: false,
    skipReviewer: false,
    estimatedTime: 'fast' // 10-15s instead of 30-40s
  },

  // Bug fix - skip planner and analyzer, go straight to debugger
  bugFix: {
    skipPlanner: true,
    skipAnalyzer: true,
    skipReviewer: false,
    estimatedTime: 'medium' // 20-30s
  },

  // Create new app - use full pipeline
  createNew: {
    skipPlanner: false,
    skipAnalyzer: true, // No existing code to analyze
    skipReviewer: false,
    estimatedTime: 'slow' // 40-60s
  },

  // Modify existing - use full pipeline
  modifyExisting: {
    skipPlanner: false,
    skipAnalyzer: false,
    skipReviewer: false,
    estimatedTime: 'slow' // 40-60s
  },

  // Style change - can skip planner if change is simple
  styleChange: {
    skipPlanner: false, // Dynamic - analyze complexity
    skipAnalyzer: true,
    skipReviewer: false,
    estimatedTime: 'medium' // 25-35s
  },

  // Add feature - use full pipeline
  addFeature: {
    skipPlanner: false,
    skipAnalyzer: false,
    skipReviewer: false,
    estimatedTime: 'slow' // 45-70s
  }
};

/**
 * Analyze request to determine routing strategy
 * @param {string} userMessage - User's request
 * @param {Object} intent - Classified intent result
 * @param {Object} currentFiles - Current project files
 * @returns {Object} Routing decisions
 */
export function determineAgentRoute(userMessage, intent, currentFiles = {}) {
  const hasExistingCode = Object.keys(currentFiles).length > 0;
  const messageLower = userMessage.toLowerCase();

  // Default route (full pipeline)
  let route = {
    skipIntentClassifier: false,
    skipPlanner: false,
    skipAnalyzer: false,
    skipReviewer: false,
    skipReflection: false,
    reason: 'Full pipeline',
    estimatedTime: 'slow'
  };

  // Bug fix - direct route to debugger
  if (intent.intent === 'fix_bug') {
    route = {
      ...route,
      skipPlanner: true,
      skipAnalyzer: true,
      reason: 'Bug fix: Direct to debugger',
      estimatedTime: 'medium'
    };
    return route;
  }

  // Create new app - skip analyzer (no code to analyze)
  if (intent.intent === 'create_new' || !hasExistingCode) {
    route = {
      ...route,
      skipAnalyzer: true,
      reason: 'New project: No code to analyze',
      estimatedTime: 'slow'
    };
    return route;
  }

  // Simple text changes - detect keywords
  const simpleTextPatterns = [
    /change.*text/i,
    /update.*label/i,
    /rename.*button/i,
    /change.*title/i,
    /update.*heading/i,
    /fix.*typo/i,
    /change.*placeholder/i
  ];

  const isSimpleText = simpleTextPatterns.some(pattern => pattern.test(userMessage));
  if (isSimpleText && hasExistingCode) {
    route = {
      ...route,
      skipPlanner: true,
      skipReflection: true, // Skip reflection for simple changes
      reason: 'Simple text change: Fast route',
      estimatedTime: 'fast'
    };
    return route;
  }

  // Simple color changes - can skip planner
  const simpleColorPatterns = [
    /make.*blue/i,
    /change.*color/i,
    /make.*red|green|purple|pink/i,
    /darker|lighter/i
  ];

  const isSimpleColor = simpleColorPatterns.some(pattern => pattern.test(userMessage));
  if (isSimpleColor && hasExistingCode && userMessage.length < 100) {
    route = {
      ...route,
      skipPlanner: true,
      skipAnalyzer: true,
      reason: 'Simple color change: Fast route',
      estimatedTime: 'fast'
    };
    return route;
  }

  // Check request complexity for dynamic routing
  const wordCount = userMessage.split(/\s+/).length;
  const hasMultipleFeatures = messageLower.includes('and') || messageLower.includes(',');
  const isComplex = wordCount > 50 || userMessage.includes('\n') || hasMultipleFeatures;

  // Complex features should use full pipeline
  if (isComplex || wordCount > 30) {
    route = {
      ...route,
      skipPlanner: false,
      skipAnalyzer: false,
      reason: 'Complex request: Full pipeline required',
      estimatedTime: 'slow'
    };
    return route;
  }

  // Short, simple modifications
  if (wordCount < 20 && hasExistingCode && intent.confidence > 0.8) {
    route = {
      ...route,
      skipPlanner: true,
      skipAnalyzer: true,
      reason: 'Simple modification: Optimized route',
      estimatedTime: 'fast'
    };
    return route;
  }

  // Return full pipeline for complex requests
  route = {
    ...route,
    reason: 'Complex request: Full pipeline required',
    estimatedTime: 'slow'
  };

  return route;
}

/**
 * Get estimated time based on route
 * @param {Object} route - Routing decisions
 * @param {number} fileCount - Number of files to generate/modify
 * @returns {string} Time estimate string
 */
export function getEstimatedTime(route, fileCount = 1) {
  const baseTime = {
    fast: { min: 8, max: 15 },
    medium: { min: 20, max: 30 },
    slow: { min: 35, max: 50 }
  };

  const time = baseTime[route.estimatedTime] || baseTime.slow;

  // Adjust for file count (parallel generation helps, but not linearly)
  const fileMultiplier = Math.min(1 + (fileCount - 1) * 0.3, 2);
  const min = Math.round(time.min * fileMultiplier);
  const max = Math.round(time.max * fileMultiplier);

  return `${min}-${max}s`;
}

/**
 * Check if agent should be skipped
 * @param {string} agentName - Agent to check
 * @param {Object} route - Routing decisions
 * @returns {boolean} True if agent should be skipped
 */
export function shouldSkipAgent(agentName, route) {
  switch (agentName) {
    case 'intentClassifier':
      return route.skipIntentClassifier;
    case 'planner':
      return route.skipPlanner;
    case 'analyzer':
      return route.skipAnalyzer;
    case 'reviewer':
      return route.skipReviewer;
    default:
      return false;
  }
}

/**
 * Log routing decision for debugging
 * @param {Object} route - Routing decisions
 * @param {string} userMessage - User's request
 */
export function logRoutingDecision(route, userMessage) {
  console.log('🚦 Agent Routing Decision:', {
    route: route.reason,
    estimatedTime: route.estimatedTime,
    skipped: [
      route.skipPlanner && 'Planner',
      route.skipAnalyzer && 'Analyzer',
      route.skipReviewer && 'Reviewer',
      route.skipReflection && 'Reflection'
    ].filter(Boolean),
    message: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '')
  });
}

export default {
  determineAgentRoute,
  getEstimatedTime,
  shouldSkipAgent,
  logRoutingDecision
};
