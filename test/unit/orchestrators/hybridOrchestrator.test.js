/**
 * Test Hybrid Orchestrator
 * End-to-end tests for intent-specific pipelines
 */

import { runHybridOrchestrator } from "../../../src/services/hybridOrchestrator.js";
import { completeTodoApp, basicTodoAppNoDelete, simpleCounterApp, todoAppBrokenDelete } from "../../__mocks__/mockExistingProjects.js";
import { hasAPIKey, checkAPIKey, assertPipelineUsed, createCounters, assert, countersToResults, printHybridSuiteHeader, printHybridTestResults, mockHybridUpdate } from "../../utils/hybridTestHelpers.js";

/**
 * Test Intent Classification and Routing
 */
async function testIntentRouting() {
  printHybridSuiteHeader("INTENT ROUTING TESTS", "Verify correct pipeline selection");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 5 };
  }

  const counters = createCounters();
  const updateCallback = mockHybridUpdate({ showPipeline: true });

  const tests = [
    { request: "build a weather app", currentFiles: {}, expectedIntent: "CREATE_NEW" },
    { request: "change the button color to green", currentFiles: completeTodoApp, expectedIntent: "MODIFY" },
    { request: "fix the delete button", currentFiles: todoAppBrokenDelete, expectedIntent: "DEBUG" },
    { request: "make it dark mode", currentFiles: completeTodoApp, expectedIntent: "STYLE_CHANGE" },
    { request: "explain how this works", currentFiles: completeTodoApp, expectedIntent: "EXPLAIN" }
  ];

  for (const test of tests) {
    try {
      console.log(`
📝 Testing: "${test.request}"`);
      const result = await runHybridOrchestrator(test.request, test.currentFiles, updateCallback);
      
      const passed = result.metadata?.intent === test.expectedIntent;
      assert(
        passed,
        `${test.request} → ${test.expectedIntent}`,
        counters,
        { reason: `Got: ${result.metadata?.intent}` }
      );
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      counters.failed++;
      counters.total++;
    }
  }

  return countersToResults(counters);
}

/**
 * Test CREATE_NEW Pipeline
 */
async function testCreateNewPipeline() {
  printHybridSuiteHeader("CREATE_NEW PIPELINE TESTS", "Full stack creation with UX and architecture");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 3 };
  }

  const counters = createCounters();
  const updateCallback = mockHybridUpdate({ showAgents: true, showCache: true });

  try {
    console.log("\n📝 Test: Build a simple counter app");
    const result = await runHybridOrchestrator(
      "build a counter with increment and decrement buttons",
      {},
      updateCallback
    );

    // Test 1: Pipeline used
    assert(
      result.metadata?.intent === "CREATE_NEW",
      "Used CREATE_NEW pipeline",
      counters
    );

    // Test 2: Files generated
    const fileCount = Object.keys(result.files || {}).length;
    assert(
      fileCount > 0,
      `Generated ${fileCount} files`,
      counters
    );

    // Test 3: Has UX design
    assert(
      result.uxDesign && result.uxDesign.colorScheme,
      "Includes UX design system",
      counters
    );

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    counters.failed += 3;
    counters.total += 3;
  }

  return countersToResults(counters);
}

/**
 * Test MODIFY Pipeline
 */
async function testModifyPipeline() {
  printHybridSuiteHeader("MODIFY PIPELINE TESTS", "Lightweight modifications");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 3 };
  }

  const counters = createCounters();
  const updateCallback = mockHybridUpdate({ showAgents: true });

  try {
    console.log("\n📝 Test: Add delete functionality");
    const result = await runHybridOrchestrator(
      "add a delete button to each todo item",
      basicTodoAppNoDelete,
      updateCallback
    );

    // Test 1: Pipeline used
    assert(
      result.metadata?.intent === "MODIFY",
      "Used MODIFY pipeline",
      counters
    );

    // Test 2: Modified correct files
    const modifiedFiles = Object.keys(result.files || {});
    const hasCorrectFiles = modifiedFiles.some(f => f.includes("TodoItem") || f.includes("TodoList"));
    assert(
      hasCorrectFiles,
      `Modified relevant files: ${modifiedFiles.join(", ")}`,
      counters
    );

    // Test 3: Token savings estimate
    const estimatedTokens = result.metadata?.estimatedTokens || 0;
    assert(
      estimatedTokens < 10000,
      `Token efficient: ~${estimatedTokens} tokens`,
      counters,
      { tokensSaved: 20000 - estimatedTokens }
    );

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    counters.failed += 3;
    counters.total += 3;
  }

  return countersToResults(counters);
}

/**
 * Test DEBUG Pipeline
 */
async function testDebugPipeline() {
  printHybridSuiteHeader("DEBUG PIPELINE TESTS", "Bug diagnosis and fix");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 3 };
  }

  const counters = createCounters();
  const updateCallback = mockHybridUpdate({ showAgents: true });

  try {
    console.log("\n📝 Test: Fix broken delete button");
    const result = await runHybridOrchestrator(
      "the delete button isn't working - it doesn't remove items",
      todoAppBrokenDelete,
      updateCallback
    );

    // Test 1: Pipeline used
    assert(
      result.metadata?.intent === "DEBUG",
      "Used DEBUG pipeline",
      counters
    );

    // Test 2: Identified error file
    const fixedFile = result.files?.["hooks/useTodos.js"];
    assert(
      fixedFile !== undefined,
      "Fixed the hooks/useTodos.js file",
      counters
    );

    // Test 3: Diagnosis provided
    assert(
      result.diagnosis,
      "Provided diagnosis",
      counters
    );

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    counters.failed += 3;
    counters.total += 3;
  }

  return countersToResults(counters);
}

/**
 * Test STYLE_CHANGE Pipeline
 */
async function testStyleChangePipeline() {
  printHybridSuiteHeader("STYLE_CHANGE PIPELINE TESTS", "UX redesign");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 2 };
  }

  const counters = createCounters();
  const updateCallback = mockHybridUpdate({ showAgents: true });

  try {
    console.log("\n📝 Test: Dark mode redesign");
    const result = await runHybridOrchestrator(
      "make it dark theme",
      simpleCounterApp,
      updateCallback
    );

    // Test 1: Pipeline used
    assert(
      result.metadata?.intent === "STYLE_CHANGE",
      "Used STYLE_CHANGE pipeline",
      counters
    );

    // Test 2: UX design provided
    assert(
      result.uxDesign && result.uxDesign.colorScheme?.theme === "dark",
      "Generated dark theme design",
      counters
    );

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    counters.failed += 2;
    counters.total += 2;
  }

  return countersToResults(counters);
}

/**
 * Test EXPLAIN Pipeline
 */
async function testExplainPipeline() {
  printHybridSuiteHeader("EXPLAIN PIPELINE TESTS", "Code explanation");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 2 };
  }

  const counters = createCounters();
  const updateCallback = mockHybridUpdate({ showAgents: true });

  try {
    console.log("\n📝 Test: Explain todo app");
    const result = await runHybridOrchestrator(
      "explain how this todo app works",
      completeTodoApp,
      updateCallback
    );

    // Test 1: Pipeline used
    assert(
      result.metadata?.intent === "EXPLAIN",
      "Used EXPLAIN pipeline",
      counters
    );

    // Test 2: Explanation provided
    assert(
      result.explanation,
      "Generated explanation",
      counters
    );

  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    counters.failed += 2;
    counters.total += 2;
  }

  return countersToResults(counters);
}

/**
 * Run all hybrid orchestrator tests
 */
export async function runHybridOrchestratorTests() {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   HYBRID ORCHESTRATOR TEST SUITE       ║");
  console.log("╚════════════════════════════════════════╝");

  if (!checkAPIKey()) {
    return { totalPassed: 0, totalFailed: 0, totalTests: 0, skipped: true };
  }

  const routingResults = await testIntentRouting();
  const createResults = await testCreateNewPipeline();
  const modifyResults = await testModifyPipeline();
  const debugResults = await testDebugPipeline();
  const styleResults = await testStyleChangePipeline();
  const explainResults = await testExplainPipeline();

  const totalPassed =
    routingResults.totalPassed +
    createResults.totalPassed +
    modifyResults.totalPassed +
    debugResults.totalPassed +
    styleResults.totalPassed +
    explainResults.totalPassed;

  const totalFailed =
    routingResults.totalFailed +
    createResults.totalFailed +
    modifyResults.totalFailed +
    debugResults.totalFailed +
    styleResults.totalFailed +
    explainResults.totalFailed;

  const totalTokensSaved =
    (routingResults.totalTokensSaved || 0) +
    (createResults.totalTokensSaved || 0) +
    (modifyResults.totalTokensSaved || 0) +
    (debugResults.totalTokensSaved || 0) +
    (styleResults.totalTokensSaved || 0) +
    (explainResults.totalTokensSaved || 0);

  const totalCacheHits =
    (routingResults.totalCacheHits || 0) +
    (createResults.totalCacheHits || 0) +
    (modifyResults.totalCacheHits || 0) +
    (debugResults.totalCacheHits || 0) +
    (styleResults.totalCacheHits || 0) +
    (explainResults.totalCacheHits || 0);

  const totalTests = totalPassed + totalFailed;

  printHybridTestResults({
    totalTests,
    totalPassed,
    totalFailed,
    totalSkipped: 0,
    totalTokensSaved,
    totalCacheHits
  });

  return {
    totalPassed,
    totalFailed,
    totalTests,
    totalTokensSaved,
    totalCacheHits,
    successRate: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0
  };
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runHybridOrchestratorTests();
}

export default {
  testIntentRouting,
  testCreateNewPipeline,
  testModifyPipeline,
  testDebugPipeline,
  testStyleChangePipeline,
  testExplainPipeline,
  runHybridOrchestratorTests
};
