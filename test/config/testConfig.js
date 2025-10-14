/**
 * Test Configuration
 * Centralized configuration for all test suites
 */

/**
 * API Key Configuration
 */
export const apiConfig = {
  // Check if OpenAI API key is available
  hasKey: () => !!process.env.OPENAI_API_KEY,

  // Get API key from environment
  getKey: () => process.env.OPENAI_API_KEY,

  // Check if key is set, log warning if not
  checkAndWarn: () => {
    if (!process.env.OPENAI_API_KEY) {
      console.log("\n⚠️  WARNING: OPENAI_API_KEY not set");
      console.log("════════════════════════════════════════════════════════════");
      console.log("Many tests require OpenAI API access to run.");
      console.log("Set the OPENAI_API_KEY environment variable:");
      console.log("  export OPENAI_API_KEY=your_key_here");
      console.log("════════════════════════════════════════════════════════════\n");
      return false;
    }
    return true;
  }
};

/**
 * Test Timeouts (in milliseconds)
 */
export const timeouts = {
  short: 5000,      // 5 seconds - for unit tests
  medium: 30000,    // 30 seconds - for agent tests
  long: 60000,      // 60 seconds - for complex scenarios
  veryLong: 120000  // 2 minutes - for integration tests
};

/**
 * Reflection Configuration
 */
export const reflectionConfig = {
  enabled: true,
  maxIterations: 2,
  qualityThreshold: 75,

  // High quality configuration
  highQuality: {
    enabled: true,
    maxIterations: 3,
    qualityThreshold: 85
  },

  // Fast configuration (no reflection)
  fast: {
    enabled: false,
    maxIterations: 0,
    qualityThreshold: 0
  },

  // Balanced configuration
  balanced: {
    enabled: true,
    maxIterations: 2,
    qualityThreshold: 75
  }
};

/**
 * Quality Thresholds
 */
export const qualityThresholds = {
  excellent: 90,
  good: 75,
  acceptable: 60,
  needsWork: 0
};

/**
 * Test Paths
 */
export const paths = {
  root: '/Users/patrickli/Documents/GitHub/vibe/blank-space',
  test: '/Users/patrickli/Documents/GitHub/vibe/blank-space/test',
  api: '/Users/patrickli/Documents/GitHub/vibe/blank-space/test/api',
  scenarios: '/Users/patrickli/Documents/GitHub/vibe/blank-space/test/api/scenarios',
  config: '/Users/patrickli/Documents/GitHub/vibe/blank-space/test/config',
  utils: '/Users/patrickli/Documents/GitHub/vibe/blank-space/test/utils',
  integration: '/Users/patrickli/Documents/GitHub/vibe/blank-space/test/integration'
};

/**
 * Mock Data Configuration
 */
export const mockConfig = {
  useRealAPI: true,  // Set to false to use mock responses
  cacheMockData: false,
  mockDelay: 100     // Simulated delay for mock responses (ms)
};

/**
 * Logging Configuration
 */
export const loggingConfig = {
  verbose: false,           // Verbose logging
  showThinking: false,      // Show agent thinking updates
  showReviews: true,        // Show review feedback
  showFileOps: true,        // Show file operations
  showQualityReports: true, // Show quality reports
  colors: true              // Use colored output
};

/**
 * Test Runner Configuration
 */
export const runnerConfig = {
  stopOnFailure: false,     // Stop all tests if one fails
  parallel: false,          // Run tests in parallel (experimental)
  retryFailed: false,       // Retry failed tests once
  showSummary: true,        // Show summary table at end
  exitOnError: false        // Exit process on test failure
};

/**
 * Agent Configuration
 */
export const agentConfig = {
  model: {
    generator: "gpt-4o",
    reviewer: "gpt-4o",
    planner: "gpt-4o-mini",
    analyzer: "gpt-4o-mini"
  },
  temperature: {
    generator: 0.7,
    reviewer: 0.3,
    planner: 0.5,
    analyzer: 0.3
  },
  maxTokens: {
    generator: 4000,
    reviewer: 2000,
    planner: 1500,
    analyzer: 1500
  }
};

/**
 * Validation Configuration
 */
export const validationConfig = {
  checkMarkdown: true,
  checkDoubleQuotes: true,
  checkFolderStructure: true,
  checkTailwind: true,
  checkImports: true,
  checkExports: true,
  checkDuplicates: true,
  autoFix: true  // Auto-fix common issues before validation
};

/**
 * Get configuration for a specific test suite
 */
export function getTestConfig(suiteName) {
  const configs = {
    basic: {
      reflection: reflectionConfig.fast,
      timeout: timeouts.short,
      logging: { ...loggingConfig, verbose: false }
    },
    orchestrator: {
      reflection: reflectionConfig.balanced,
      timeout: timeouts.medium,
      logging: { ...loggingConfig, showThinking: true }
    },
    autogen: {
      reflection: reflectionConfig.highQuality,
      timeout: timeouts.long,
      logging: { ...loggingConfig, showReviews: true, showQualityReports: true }
    },
    integration: {
      reflection: reflectionConfig.balanced,
      timeout: timeouts.veryLong,
      logging: { ...loggingConfig, verbose: true }
    },
    debugging: {
      reflection: reflectionConfig.fast,
      timeout: timeouts.medium,
      logging: { ...loggingConfig, verbose: false }
    },
    reliability: {
      reflection: reflectionConfig.fast,
      timeout: timeouts.short,
      logging: { ...loggingConfig, verbose: false }
    }
  };

  return configs[suiteName] || configs.basic;
}

/**
 * Export all configurations
 */
export default {
  api: apiConfig,
  timeouts,
  reflection: reflectionConfig,
  quality: qualityThresholds,
  paths,
  mock: mockConfig,
  logging: loggingConfig,
  runner: runnerConfig,
  agent: agentConfig,
  validation: validationConfig,
  getTestConfig
};
