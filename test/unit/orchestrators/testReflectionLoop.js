/**
 * Test Reflection Loop
 * Tests iterative code improvement through Generator → Reviewer cycles
 */

import { AgentOrchestrator } from "../../../src/services/agentOrchestrator.js";

/**
 * Check if OpenAI API key is available
 */
function hasAPIKey() {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Test Basic Reflection Loop
 */
async function testBasicReflection() {
  console.log("\n========================================");
  console.log("TEST SUITE: Basic Reflection Loop");
  console.log("========================================\n");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 1 };
  }

  try {
    console.log("Testing: Simple component generation with reflection...");

    const updates = [];
    const orchestrator = new AgentOrchestrator(
      (update) => {
        updates.push(update);
        if (update.type === "review" || update.type === "thinking") {
          console.log(`  ${update.content}`);
        }
      },
      {
        reflectionEnabled: true,
        maxReflectionIterations: 2,
        qualityThreshold: 75
      }
    );

    const result = await orchestrator.processUserMessage(
      "Create a simple counter component with increment and decrement buttons",
      {}
    );

    console.log("\nReflection Results:");
    console.log("─".repeat(50));

    result.fileOperations.forEach(op => {
      console.log(`File: ${op.filename}`);
      console.log(`  Quality Score: ${op.qualityScore}/100`);
      console.log(`  Iterations: ${op.reflectionHistory?.length || 0}`);

      if (op.reflectionHistory) {
        op.reflectionHistory.forEach((h, i) => {
          console.log(`    Iteration ${h.iteration}: Score ${h.qualityScore}, Issues: ${h.issueCount}`);
        });
      }
    });

    // Check if reflection occurred and improved quality
    const hasReflection = result.fileOperations.some(op => op.reflectionHistory && op.reflectionHistory.length > 0);
    const hasQualityScore = result.fileOperations.every(op => op.qualityScore !== undefined);

    if (hasReflection && hasQualityScore && result.success) {
      console.log(`\n✅ PASS: Reflection loop executed successfully\n`);
      return { passed: 1, failed: 0 };
    } else {
      console.log(`\n❌ FAIL: Reflection loop incomplete`);
      console.log(`   Has reflection: ${hasReflection}`);
      console.log(`   Has quality scores: ${hasQualityScore}`);
      console.log(`   Success: ${result.success}\n`);
      return { passed: 0, failed: 1 };
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}\n`);
    console.error(error);
    return { passed: 0, failed: 1 };
  }
}

/**
 * Test Quality Threshold
 */
async function testQualityThreshold() {
  console.log("\n========================================");
  console.log("TEST SUITE: Quality Threshold");
  console.log("========================================\n");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 1 };
  }

  try {
    console.log("Testing: High quality threshold termination...");

    const orchestrator = new AgentOrchestrator(
      (update) => {
        if (update.type === "review") {
          console.log(`  ${update.content}`);
        }
      },
      {
        reflectionEnabled: true,
        maxReflectionIterations: 3,
        qualityThreshold: 80 // Higher threshold
      }
    );

    const result = await orchestrator.processUserMessage(
      "Create a button component",
      {}
    );

    // Check if quality meets or exceeds threshold
    const meetsThreshold = result.fileOperations.every(
      op => op.qualityScore >= 80 || op.reflectionHistory.length === 3
    );

    console.log("\nQuality Threshold Results:");
    result.fileOperations.forEach(op => {
      console.log(`  ${op.filename}: ${op.qualityScore}/100 (threshold: 80)`);
    });

    if (meetsThreshold && result.success) {
      console.log(`\n✅ PASS: Quality threshold enforced\n`);
      return { passed: 1, failed: 0 };
    } else {
      console.log(`\n❌ FAIL: Quality threshold not met\n`);
      return { passed: 0, failed: 1 };
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}\n`);
    return { passed: 0, failed: 1 };
  }
}

/**
 * Test Max Iterations Limit
 */
async function testMaxIterations() {
  console.log("\n========================================");
  console.log("TEST SUITE: Max Iterations Limit");
  console.log("========================================\n");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 1 };
  }

  try {
    console.log("Testing: Max iteration limit enforcement...");

    const orchestrator = new AgentOrchestrator(
      (update) => {},
      {
        reflectionEnabled: true,
        maxReflectionIterations: 1, // Only 1 iteration
        qualityThreshold: 100 // Impossible threshold
      }
    );

    const result = await orchestrator.processUserMessage(
      "Create a simple div component",
      {}
    );

    // Should stop at max iterations even if quality not perfect
    const respectsLimit = result.fileOperations.every(
      op => !op.reflectionHistory || op.reflectionHistory.length <= 1
    );

    console.log("\nMax Iterations Results:");
    result.fileOperations.forEach(op => {
      console.log(`  ${op.filename}: ${op.reflectionHistory?.length || 0} iterations (max: 1)`);
    });

    if (respectsLimit && result.success) {
      console.log(`\n✅ PASS: Max iterations respected\n`);
      return { passed: 1, failed: 0 };
    } else {
      console.log(`\n❌ FAIL: Max iterations exceeded\n`);
      return { passed: 0, failed: 1 };
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}\n`);
    return { passed: 0, failed: 1 };
  }
}

/**
 * Test Reflection Disabled
 */
async function testReflectionDisabled() {
  console.log("\n========================================");
  console.log("TEST SUITE: Reflection Disabled");
  console.log("========================================\n");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 1 };
  }

  try {
    console.log("Testing: Generation without reflection...");

    const orchestrator = new AgentOrchestrator(
      (update) => {},
      {
        reflectionEnabled: false // Disabled
      }
    );

    const result = await orchestrator.processUserMessage(
      "Create a simple button",
      {}
    );

    // Should have no reflection history when disabled
    const noReflection = result.fileOperations.every(
      op => !op.reflectionHistory || op.reflectionHistory.length === 0
    );

    console.log("\nDisabled Reflection Results:");
    result.fileOperations.forEach(op => {
      console.log(`  ${op.filename}: Reflection history: ${op.reflectionHistory?.length || 0}`);
    });

    if (noReflection && result.success) {
      console.log(`\n✅ PASS: Reflection properly disabled\n`);
      return { passed: 1, failed: 0 };
    } else {
      console.log(`\n❌ FAIL: Reflection still occurred when disabled\n`);
      return { passed: 0, failed: 1 };
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}\n`);
    return { passed: 0, failed: 1 };
  }
}

/**
 * Test Multiple Files
 */
async function testMultipleFiles() {
  console.log("\n========================================");
  console.log("TEST SUITE: Multiple Files Reflection");
  console.log("========================================\n");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 1 };
  }

  try {
    console.log("Testing: Reflection with multiple files...");

    const orchestrator = new AgentOrchestrator(
      (update) => {
        if (update.type === "file_operation" || update.type === "quality_report") {
          console.log(`  ${update.content}`);
        }
      },
      {
        reflectionEnabled: true,
        maxReflectionIterations: 2,
        qualityThreshold: 75
      }
    );

    const result = await orchestrator.processUserMessage(
      "Create a todo app with separate TodoList and TodoItem components",
      {}
    );

    console.log("\nMultiple Files Results:");
    console.log(`Files generated: ${result.fileOperations.length}`);

    result.fileOperations.forEach(op => {
      console.log(`\n  ${op.filename}:`);
      console.log(`    Quality: ${op.qualityScore}/100`);
      console.log(`    Iterations: ${op.reflectionHistory?.length || 0}`);
    });

    // All files should have quality scores
    const allHaveScores = result.fileOperations.every(op => op.qualityScore !== undefined);
    const hasMultipleFiles = result.fileOperations.length >= 2;

    if (allHaveScores && hasMultipleFiles && result.success) {
      console.log(`\n✅ PASS: Multiple files handled correctly\n`);
      return { passed: 1, failed: 0 };
    } else {
      console.log(`\n❌ FAIL: Multiple files not handled correctly\n`);
      return { passed: 0, failed: 1 };
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}\n`);
    console.error(error);
    return { passed: 0, failed: 1 };
  }
}

/**
 * Test Quality Improvement
 */
async function testQualityImprovement() {
  console.log("\n========================================");
  console.log("TEST SUITE: Quality Improvement");
  console.log("========================================\n");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 1 };
  }

  try {
    console.log("Testing: Quality improvement across iterations...");

    const orchestrator = new AgentOrchestrator(
      (update) => {},
      {
        reflectionEnabled: true,
        maxReflectionIterations: 3,
        qualityThreshold: 90 // High threshold to force iterations
      }
    );

    const result = await orchestrator.processUserMessage(
      "Create a complex form with validation",
      {}
    );

    console.log("\nQuality Improvement Analysis:");

    let passed = 0;
    let failed = 0;

    result.fileOperations.forEach(op => {
      console.log(`\n  ${op.filename}:`);

      if (op.reflectionHistory && op.reflectionHistory.length > 1) {
        const scores = op.reflectionHistory.map(h => h.qualityScore);
        console.log(`    Iterations: ${scores.join(" → ")}`);

        // Check if quality improved or stayed high
        let improved = true;
        for (let i = 1; i < scores.length; i++) {
          if (scores[i] < scores[i - 1] - 5) { // Allow small variance
            improved = false;
          }
        }

        if (improved) {
          console.log(`    ✅ Quality maintained or improved`);
          passed++;
        } else {
          console.log(`    ❌ Quality decreased`);
          failed++;
        }
      } else {
        console.log(`    Single iteration (already good quality)`);
        passed++;
      }
    });

    if (failed === 0) {
      console.log(`\n✅ PASS: Quality improvement verified\n`);
      return { passed: 1, failed: 0 };
    } else {
      console.log(`\n❌ FAIL: Quality degraded in some files\n`);
      return { passed: 0, failed: 1 };
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}\n`);
    return { passed: 0, failed: 1 };
  }
}

/**
 * Run all reflection loop tests
 */
export async function runReflectionLoopTests() {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║     REFLECTION LOOP TEST SUITE         ║");
  console.log("╚════════════════════════════════════════╝");

  if (!hasAPIKey()) {
    console.log("\n⚠️  WARNING: OPENAI_API_KEY not set - all tests will be skipped");
    console.log("Set OPENAI_API_KEY environment variable to run these tests\n");
  }

  const basicResults = await testBasicReflection();
  const thresholdResults = await testQualityThreshold();
  const iterationsResults = await testMaxIterations();
  const disabledResults = await testReflectionDisabled();
  const multiFileResults = await testMultipleFiles();
  const improvementResults = await testQualityImprovement();

  const totalPassed =
    basicResults.passed +
    thresholdResults.passed +
    iterationsResults.passed +
    disabledResults.passed +
    multiFileResults.passed +
    improvementResults.passed;

  const totalFailed =
    basicResults.failed +
    thresholdResults.failed +
    iterationsResults.failed +
    disabledResults.failed +
    multiFileResults.failed +
    improvementResults.failed;

  const totalTests = totalPassed + totalFailed;

  console.log("\n╔════════════════════════════════════════╗");
  console.log("║     REFLECTION LOOP TEST RESULTS       ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  if (totalTests > 0) {
    console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%\n`);
  }

  return {
    totalPassed,
    totalFailed,
    totalTests,
    successRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0
  };
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runReflectionLoopTests();
}
