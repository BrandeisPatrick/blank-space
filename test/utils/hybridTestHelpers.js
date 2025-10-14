/**
 * Hybrid Orchestrator Test Helpers
 * Utility functions for testing the hybrid agent system
 */

import { HybridAgentOrchestrator, runHybridOrchestrator } from "../../src/services/hybridOrchestrator.js";
import { AgentOrchestrator } from "../../src/services/agentOrchestrator.js";
import testConfig from "../config/testConfig.js";

/**
 * Create a hybrid orchestrator for testing
 * @param {Object} config - Configuration options
 * @returns {HybridAgentOrchestrator} Configured hybrid orchestrator
 */
export function createHybridOrchestrator(config = {}) {
  const {
    onUpdate = mockHybridUpdate(),
    ...options
  } = config;

  return new HybridAgentOrchestrator();
}

/**
 * Create a mock update callback for hybrid orchestrator
 * @param {Object} options - Options for the callback
 * @returns {Function} Mock update callback
 */
export function mockHybridUpdate(options = {}) {
  const {
    showUpdates = false,
    showPipeline = false,
    showAgents = false,
    showCache = false,
    collectUpdates = false
  } = options;

  const updates = [];
  let pipelineUsed = null;

  const callback = (update) => {
    if (collectUpdates) {
      updates.push(update);
    }

    if (update.type === 'pipeline' && showPipeline) {
      console.log(`  🔀 Pipeline: ${update.message}`);
      pipelineUsed = update.message;
    }

    if (update.type === 'agent' && showAgents) {
      console.log(`  🤖 Agent: ${update.message}`);
    }

    if (update.type === 'cache' && showCache) {
      console.log(`  💾 Cache: ${update.message}`);
    }

    if (update.type === 'file' && showUpdates) {
      console.log(`  📄 File: ${update.message}`);
    }

    if (update.type === 'validation' && showUpdates) {
      console.log(`  ✅ Validation: ${update.message}`);
    }
  };

  callback.getUpdates = () => updates;
  callback.getPipeline = () => pipelineUsed;

  return callback;
}

/**
 * Estimate token usage for a prompt
 * Rough estimation: 1 token ≈ 4 characters
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 */
export function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate total prompt tokens for a result
 * @param {Object} result - Result from orchestrator
 * @param {Object} userMessage - Original user message
 * @returns {number} Estimated total tokens
 */
export function calculatePromptTokens(result, userMessage) {
  // This is a rough estimate - actual implementation would track LLM calls
  const baseTokens = estimateTokens(userMessage);
  
  // Add estimated tokens per agent
  const agentCount = result.metadata?.pipeline?.length || 3;
  const avgTokensPerAgent = 1500;
  
  return baseTokens + (agentCount * avgTokensPerAgent);
}

/**
 * Assert that correct pipeline was used
 * @param {Object} result - Result from orchestrator
 * @param {string} expectedIntent - Expected intent
 * @param {string} testName - Test name
 * @returns {boolean} True if correct pipeline was used
 */
export function assertPipelineUsed(result, expectedIntent, testName) {
  const actualIntent = result.metadata?.intent;

  if (actualIntent === expectedIntent) {
    console.log(`✅ PASS: ${testName}`);
    console.log(`   Pipeline: ${actualIntent}`);
    return true;
  } else {
    console.log(`❌ FAIL: ${testName}`);
    console.log(`   Expected: ${expectedIntent}, Got: ${actualIntent}`);
    return false;
  }
}

/**
 * Assert cache was used
 * @param {Object} result - Result from orchestrator
 * @param {string} testName - Test name
 * @returns {boolean} True if cache was used
 */
export function assertCacheHit(result, testName) {
  const cacheHits = result.metadata?.cacheHits || 0;

  if (cacheHits > 0) {
    console.log(`✅ PASS: ${testName}`);
    console.log(`   Cache hits: ${cacheHits}`);
    return true;
  } else {
    console.log(`❌ FAIL: ${testName}`);
    console.log(`   No cache hits detected`);
    return false;
  }
}

/**
 * Compare results from old vs. hybrid orchestrator
 * @param {Object} oldResult - Result from old orchestrator
 * @param {Object} hybridResult - Result from hybrid orchestrator
 * @returns {Object} Comparison metrics
 */
export function comparePipelineResults(oldResult, hybridResult) {
  const comparison = {
    fileCount: {
      old: oldResult.fileOperations?.length || 0,
      hybrid: Object.keys(hybridResult.files || {}).length
    },
    success: {
      old: oldResult.success,
      hybrid: hybridResult.success
    },
    tokenEstimate: {
      old: estimateTokens(JSON.stringify(oldResult)),
      hybrid: hybridResult.metadata?.estimatedTokens || 0
    }
  };

  comparison.tokenSavings = comparison.tokenEstimate.old > 0
    ? ((1 - comparison.tokenEstimate.hybrid / comparison.tokenEstimate.old) * 100).toFixed(1)
    : 0;

  return comparison;
}

/**
 * Extract metrics from hybrid orchestrator
 * @param {HybridAgentOrchestrator} orchestrator - Hybrid orchestrator instance
 * @returns {Object} Metrics
 */
export function extractMetrics(orchestrator) {
  return orchestrator.getMetrics();
}

/**
 * Validate specialized agent output format
 * @param {Object} output - Agent output
 * @param {string} agentType - Type of agent (ux, architecture, debugger, validator)
 * @returns {Object} Validation result
 */
export function validateSpecializedAgent(output, agentType) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };

  switch (agentType) {
    case 'ux':
      if (!output.colorScheme) result.errors.push('Missing colorScheme');
      if (!output.designStyle) result.errors.push('Missing designStyle');
      if (!output.uxPatterns) result.errors.push('Missing uxPatterns');
      if (!output.appIdentity) result.warnings.push('Missing appIdentity');
      break;

    case 'architecture':
      if (!output.fileStructure) result.errors.push('Missing fileStructure');
      if (!output.importPaths) result.errors.push('Missing importPaths');
      if (!output.dependencies) result.errors.push('Missing dependencies');
      break;

    case 'debugger':
      if (!output.errorType) result.errors.push('Missing errorType');
      if (!output.rootCause) result.errors.push('Missing rootCause');
      if (!output.fixStrategy) result.errors.push('Missing fixStrategy');
      break;

    case 'validator':
      if (typeof output.valid !== 'boolean') result.errors.push('Missing valid flag');
      if (!Array.isArray(output.errors)) result.errors.push('Missing errors array');
      if (!output.code) result.errors.push('Missing code output');
      break;

    default:
      result.errors.push(`Unknown agent type: ${agentType}`);
  }

  result.valid = result.errors.length === 0;
  return result;
}

/**
 * Assert specialized agent output is valid
 * @param {Object} output - Agent output
 * @param {string} agentType - Type of agent
 * @param {string} testName - Test name
 * @returns {boolean} True if valid
 */
export function assertAgentOutput(output, agentType, testName) {
  const validation = validateSpecializedAgent(output, agentType);

  if (validation.valid) {
    console.log(`✅ PASS: ${testName}`);
    if (validation.warnings.length > 0) {
      console.log(`   ⚠️  Warnings: ${validation.warnings.join(', ')}`);
    }
    return true;
  } else {
    console.log(`❌ FAIL: ${testName}`);
    console.log(`   Errors: ${validation.errors.join(', ')}`);
    return false;
  }
}

/**
 * Create test counters for hybrid tests
 * @returns {Object} Counters object
 */
export function createCounters() {
  return {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    tokensSaved: 0,
    cacheHits: 0
  };
}

/**
 * Assert test result and update counters
 * @param {boolean} condition - Condition to check
 * @param {string} testName - Name of the test
 * @param {Object} counters - Test counters object
 * @param {Object} metadata - Optional metadata
 */
export function assert(condition, testName, counters, metadata = {}) {
  counters.total++;
  if (condition) {
    counters.passed++;
    console.log(`✅ PASS: ${testName}`);
    
    if (metadata.tokensSaved) {
      counters.tokensSaved += metadata.tokensSaved;
      console.log(`   💰 Tokens saved: ${metadata.tokensSaved}`);
    }
    
    if (metadata.cacheHits) {
      counters.cacheHits += metadata.cacheHits;
      console.log(`   💾 Cache hits: ${metadata.cacheHits}`);
    }
  } else {
    counters.failed++;
    console.log(`❌ FAIL: ${testName}`);
    
    if (metadata.reason) {
      console.log(`   Reason: ${metadata.reason}`);
    }
  }
}

/**
 * Convert counters to result object
 * @param {Object} counters - Counters object
 * @returns {Object} Result object
 */
export function countersToResults(counters) {
  return {
    totalTests: counters.total,
    totalPassed: counters.passed,
    totalFailed: counters.failed,
    totalSkipped: counters.skipped || 0,
    totalTokensSaved: counters.tokensSaved || 0,
    totalCacheHits: counters.cacheHits || 0,
    successRate: counters.total > 0
      ? ((counters.passed / counters.total) * 100).toFixed(1)
      : 0
  };
}

/**
 * Check if API key is available
 * @returns {boolean} True if API key is set
 */
export function hasAPIKey() {
  return testConfig.api.hasKey();
}

/**
 * Check API key and show warning if missing
 * @returns {boolean} True if API key is set
 */
export function checkAPIKey() {
  return testConfig.api.checkAndWarn();
}

/**
 * Print test suite header for hybrid tests
 * @param {string} title - Suite title
 * @param {string} subtitle - Optional subtitle
 */
export function printHybridSuiteHeader(title, subtitle = "") {
  const width = 70;
  console.log("\n" + "═".repeat(width));
  console.log(("HYBRID " + title).toUpperCase().padStart((width + title.length) / 2));
  if (subtitle) {
    console.log(subtitle.padStart((width + subtitle.length) / 2));
  }
  console.log("═".repeat(width) + "\n");
}

/**
 * Print test results with hybrid-specific metrics
 * @param {Object} results - Test results
 */
export function printHybridTestResults(results) {
  const { totalTests, totalPassed, totalFailed, totalSkipped, totalTokensSaved, totalCacheHits } = results;

  console.log("\n" + "═".repeat(70));
  console.log("TEST RESULTS SUMMARY");
  console.log("═".repeat(70));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed:  ${totalPassed}`);
  console.log(`❌ Failed:  ${totalFailed}`);
  if (totalSkipped > 0) {
    console.log(`⏭️  Skipped: ${totalSkipped}`);
  }

  if (totalTests > 0) {
    const successRate = ((totalPassed / totalTests) * 100).toFixed(1);
    console.log(`Success Rate: ${successRate}%`);
  }

  if (totalTokensSaved > 0) {
    console.log(`💰 Total Tokens Saved: ~${totalTokensSaved}`);
  }

  if (totalCacheHits > 0) {
    console.log(`💾 Total Cache Hits: ${totalCacheHits}`);
  }

  console.log("═".repeat(70) + "\n");
}

/**
 * Export all helpers
 */
export default {
  createHybridOrchestrator,
  mockHybridUpdate,
  estimateTokens,
  calculatePromptTokens,
  assertPipelineUsed,
  assertCacheHit,
  comparePipelineResults,
  extractMetrics,
  validateSpecializedAgent,
  assertAgentOutput,
  createCounters,
  assert,
  countersToResults,
  hasAPIKey,
  checkAPIKey,
  printHybridSuiteHeader,
  printHybridTestResults
};
