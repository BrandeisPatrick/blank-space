/**
 * Test Helpers and Utilities
 * Shared helper functions used across test suites
 */

import { AgentOrchestrator } from "../../src/services/agentOrchestrator.js";
import testConfig from "../config/testConfig.js";

/**
 * Check if OpenAI API key is available
 */
export function hasAPIKey() {
  return testConfig.api.hasKey();
}

/**
 * Get OpenAI API key
 */
export function getAPIKey() {
  return testConfig.api.getKey();
}

/**
 * Check API key and show warning if missing
 * @returns {boolean} True if API key is set
 */
export function checkAPIKey() {
  return testConfig.api.checkAndWarn();
}

/**
 * Format test results for display
 * @param {string} name - Test suite name
 * @param {Object} results - Test results object
 * @returns {Object} Formatted results
 */
export function formatResults(name, results) {
  const passRate = results.totalTests > 0
    ? ((results.totalPassed / results.totalTests) * 100).toFixed(1)
    : 'N/A';

  return {
    name,
    passed: results.totalPassed || 0,
    failed: results.totalFailed || 0,
    skipped: results.skipped || 0,
    total: results.totalTests || 0,
    passRate: `${passRate}%`
  };
}

/**
 * Format time duration
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted time
 */
export function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Assert a condition and log result
 * @param {boolean} condition - Condition to check
 * @param {string} testName - Name of the test
 * @param {Object} counters - Test counters object
 */
export function assert(condition, testName, counters) {
  counters.total++;
  if (condition) {
    counters.passed++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    counters.failed++;
    console.log(`❌ FAIL: ${testName}`);
  }
}

/**
 * Assert code quality meets standards
 * @param {string} code - Code to check
 * @param {Array} requiredPatterns - Patterns that must be present
 * @param {string} testName - Name of the test
 * @returns {boolean} True if all patterns found
 */
export function assertCodeQuality(code, requiredPatterns, testName) {
  const missing = requiredPatterns.filter(pattern => !code.includes(pattern));

  if (missing.length === 0) {
    console.log(`✅ PASS: ${testName}`);
    return true;
  } else {
    console.log(`❌ FAIL: ${testName}`);
    console.log(`   Missing patterns: ${missing.join(", ")}`);
    return false;
  }
}

/**
 * Create a mock update callback for testing
 * @param {Object} options - Options for the callback
 * @returns {Function} Mock update callback
 */
export function mockOnUpdate(options = {}) {
  const {
    showThinking = false,
    showReviews = false,
    showFileOps = false,
    showQualityReports = false,
    collectUpdates = false
  } = options;

  const updates = [];

  return (update) => {
    if (collectUpdates) {
      updates.push(update);
    }

    if (showThinking && update.type === "thinking") {
      console.log(`  💭 ${update.content}`);
    }

    if (showReviews && update.type === "review") {
      console.log(`  📝 ${update.content}`);
    }

    if (showFileOps && update.type === "file_operation") {
      console.log(`  ✅ ${update.content}`);
    }

    if (showQualityReports && update.type === "quality_report") {
      console.log(`\n${update.content}\n`);
    }
  };
}

/**
 * Create a test orchestrator with configuration
 * @param {Object} config - Configuration options
 * @returns {AgentOrchestrator} Configured orchestrator
 */
export function createTestOrchestrator(config = {}) {
  const {
    reflection = testConfig.reflection.balanced,
    onUpdate = mockOnUpdate(),
    ...options
  } = config;

  return new AgentOrchestrator(onUpdate, {
    reflectionEnabled: reflection.enabled,
    maxReflectionIterations: reflection.maxIterations,
    qualityThreshold: reflection.qualityThreshold,
    ...options
  });
}

/**
 * Wait for a specific duration
 * @param {number} ms - Milliseconds to wait
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Print a test suite header
 * @param {string} title - Suite title
 * @param {string} subtitle - Optional subtitle
 */
export function printSuiteHeader(title, subtitle = "") {
  const width = 70;
  console.log("\n" + "═".repeat(width));
  console.log(title.toUpperCase().padStart((width + title.length) / 2));
  if (subtitle) {
    console.log(subtitle.padStart((width + subtitle.length) / 2));
  }
  console.log("═".repeat(width) + "\n");
}

/**
 * Print a test section header
 * @param {string} title - Section title
 */
export function printSectionHeader(title) {
  console.log("\n" + "─".repeat(70));
  console.log(title);
  console.log("─".repeat(70) + "\n");
}

/**
 * Print test results summary
 * @param {Object} results - Test results
 */
export function printTestResults(results) {
  const { totalTests, totalPassed, totalFailed, totalSkipped = 0 } = results;

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
  console.log("═".repeat(70) + "\n");
}

/**
 * Print summary table for multiple test suites
 * @param {Array} suiteResults - Array of suite result objects
 */
export function printSummaryTable(suiteResults) {
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║              TEST SUITE SUMMARY                           ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  console.log("Test Suite                    Passed  Failed  Total  Pass Rate");
  console.log("─".repeat(65));

  suiteResults.forEach(result => {
    const name = result.name.padEnd(28);
    const passed = result.passed.toString().padStart(6);
    const failed = result.failed.toString().padStart(7);
    const total = result.total.toString().padStart(6);
    const passRate = result.passRate.padStart(10);

    console.log(`${name} ${passed} ${failed} ${total} ${passRate}`);
  });

  console.log("─".repeat(65));

  const totalPassed = suiteResults.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = suiteResults.reduce((sum, r) => sum + r.failed, 0);
  const totalTests = totalPassed + totalFailed;
  const overallPassRate = totalTests > 0
    ? ((totalPassed / totalTests) * 100).toFixed(1)
    : 'N/A';

  const totalsLine = `${"TOTAL".padEnd(28)} ${totalPassed.toString().padStart(6)} ${totalFailed.toString().padStart(7)} ${totalTests.toString().padStart(6)} ${(overallPassRate + '%').padStart(10)}`;
  console.log(totalsLine);
  console.log("\n");

  // Overall status
  if (totalFailed === 0 && totalTests > 0) {
    console.log("🎉 ALL TESTS PASSED! 🎉\n");
  } else if (totalTests === 0) {
    console.log("⚠️  NO TESTS RUN - Set OPENAI_API_KEY to run tests\n");
  } else {
    const passPercentage = parseFloat(overallPassRate);
    if (passPercentage >= 90) {
      console.log("✅ EXCELLENT - Most tests passing\n");
    } else if (passPercentage >= 75) {
      console.log("⚠️  GOOD - Some failures need attention\n");
    } else {
      console.log("❌ NEEDS WORK - Many failures detected\n");
    }
  }
}

/**
 * Validate file against requirements
 * @param {string} filename - File name
 * @param {string} code - File code
 * @param {Object} requirements - Requirements object
 * @returns {Object} Validation result
 */
export function validateFileRequirements(filename, code, requirements) {
  const issues = [];
  const checks = requirements[filename];

  if (!checks) return { valid: true, issues: [] };

  // Check imports
  if (checks.mustImport) {
    checks.mustImport.forEach(imp => {
      if (!code.includes(imp)) {
        issues.push(`Missing import: ${imp}`);
      }
    });
  }

  if (checks.mustNotImport) {
    checks.mustNotImport.forEach(imp => {
      if (code.includes(`import`) && code.includes(imp)) {
        issues.push(`Should not import: ${imp}`);
      }
    });
  }

  // Check exports
  if (checks.mustExport) {
    if (!code.includes(`export ${checks.mustExport}`)) {
      issues.push(`Missing export: ${checks.mustExport}`);
    }
  }

  // Check Tailwind
  if (checks.mustHaveTailwind) {
    const hasTailwind = /className=["'][^"']*(?:bg-|text-|p-|m-|flex|grid|rounded|shadow)/i.test(code);
    if (!hasTailwind) {
      issues.push(`Missing Tailwind classes`);
    }
  }

  // Check required patterns
  if (checks.requiredPatterns) {
    checks.requiredPatterns.forEach(pattern => {
      if (!code.includes(pattern)) {
        issues.push(`Missing pattern: ${pattern}`);
      }
    });
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Create test counters object
 * @returns {Object} Counters object
 */
export function createCounters() {
  return {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };
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
    successRate: counters.total > 0
      ? ((counters.passed / counters.total) * 100).toFixed(1)
      : 0
  };
}

/**
 * Retry a test function if it fails
 * @param {Function} testFn - Test function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries (ms)
 * @returns {Promise} Test result
 */
export async function retryTest(testFn, maxRetries = 1, delay = 1000) {
  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await testFn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        console.log(`  ⚠️  Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Run tests with timeout
 * @param {Function} testFn - Test function
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise} Test result
 */
export async function runWithTimeout(testFn, timeout) {
  return Promise.race([
    testFn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout)
    )
  ]);
}

/**
 * Export all helpers
 */
export default {
  hasAPIKey,
  getAPIKey,
  checkAPIKey,
  formatResults,
  formatTime,
  assert,
  assertCodeQuality,
  mockOnUpdate,
  createTestOrchestrator,
  sleep,
  printSuiteHeader,
  printSectionHeader,
  printTestResults,
  printSummaryTable,
  validateFileRequirements,
  createCounters,
  countersToResults,
  retryTest,
  runWithTimeout
};
