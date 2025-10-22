/**
 * End-to-End Integration Tests
 * Tests complete workflows from user input to final code output
 */

import { AgentOrchestrator } from "../../src/services/agentOrchestrator.js";
import { validateFiles } from "../unit/validators/codeQuality.test.js";
import { hasAPIKey, formatTime } from "../utils/testHelpers.js";

/**
 * Test: Create new project from scratch
 */
async function testCreateNewProject() {
  console.log("\n========================================");
  console.log("TEST: Create New Project");
  console.log("========================================\n");

  if (!hasAPIKey()) {
    console.log("⏭️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 1 };
  }

  try {
    console.log("Creating a simple counter app...\n");

    const startTime = Date.now();
    const orchestrator = new AgentOrchestrator(
      (update) => {
        if (update.type === "file_operation") {
          console.log(`  📄 ${update.content}`);
        }
      },
      { reflectionEnabled: false }
    );

    const result = await orchestrator.processUserMessage(
      "Create a simple counter with increment and decrement buttons",
      {}
    );

    const duration = Date.now() - startTime;

    console.log(`\n⏱️  Duration: ${formatTime(duration)}`);
    console.log(`📁 Files created: ${result.fileOperations.length}`);

    // Validate
    const filesObj = {};
    result.fileOperations.forEach(op => {
      filesObj[op.filename] = op.content;
    });

    const validation = validateFiles(filesObj);

    if (result.success && result.fileOperations.length > 0 && validation.valid) {
      console.log(`\n✅ PASS: Project created successfully\n`);
      return { passed: 1, failed: 0 };
    } else {
      console.log(`\n❌ FAIL: Project creation issues`);
      console.log(`  Success: ${result.success}`);
      console.log(`  Files: ${result.fileOperations.length}`);
      console.log(`  Valid: ${validation.valid}\n`);
      return { passed: 0, failed: 1 };
    }
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}\n`);
    return { passed: 0, failed: 1 };
  }
}

/**
 * Test: Modify existing code
 */
async function testModifyExisting() {
  console.log("\n========================================");
  console.log("TEST: Modify Existing Code");
  console.log("========================================\n");

  if (!hasAPIKey()) {
    console.log("⏭️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 1 };
  }

  try {
    console.log("Modifying existing counter to add reset button...\n");

    const existingCode = {
      "App.jsx": `
import React, { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-8">
      <h1 className="text-2xl">Count: {count}</h1>
      <button onClick={() => setCount(count + 1)} className="bg-blue-500 p-2">
        Increment
      </button>
    </div>
  );
}

export default App;
      `
    };

    const startTime = Date.now();
    const orchestrator = new AgentOrchestrator(
      (update) => {
        if (update.type === "file_operation") {
          console.log(`  📝 ${update.content}`);
        }
      },
      { reflectionEnabled: false }
    );

    const result = await orchestrator.processUserMessage(
      "Add a reset button that sets count back to 0",
      existingCode
    );

    const duration = Date.now() - startTime;

    console.log(`\n⏱️  Duration: ${formatTime(duration)}`);

    // Check if modification preserves existing code
    const modifiedCode = result.fileOperations.find(op => op.filename === "App.jsx")?.content;
    const hasReset = modifiedCode && modifiedCode.includes("reset");
    const preservesCount = modifiedCode && modifiedCode.includes("setCount");

    if (result.success && hasReset && preservesCount) {
      console.log(`\n✅ PASS: Code modified successfully\n`);
      return { passed: 1, failed: 0 };
    } else {
      console.log(`\n❌ FAIL: Modification issues\n`);
      return { passed: 0, failed: 1 };
    }
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}\n`);
    return { passed: 0, failed: 1 };
  }
}

/**
 * Test: Multi-file project creation
 */
async function testMultiFileProject() {
  console.log("\n========================================");
  console.log("TEST: Multi-File Project");
  console.log("========================================\n");

  if (!hasAPIKey()) {
    console.log("⏭️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 1 };
  }

  try {
    console.log("Creating a todo list with multiple files...\n");

    const startTime = Date.now();
    const orchestrator = new AgentOrchestrator(
      (update) => {
        if (update.type === "file_operation") {
          console.log(`  📄 ${update.content}`);
        }
      },
      { reflectionEnabled: false }
    );

    const result = await orchestrator.processUserMessage(
      "Build a todo list with separate components for TodoList and TodoItem",
      {}
    );

    const duration = Date.now() - startTime;

    console.log(`\n⏱️  Duration: ${formatTime(duration)}`);
    console.log(`📁 Files created: ${result.fileOperations.length}`);

    // Check for proper file structure
    const filenames = result.fileOperations.map(op => op.filename);
    const hasApp = filenames.some(f => f.includes("App.jsx"));
    const hasComponents = filenames.some(f => f.includes("components/"));
    const hasMultipleFiles = result.fileOperations.length >= 2;

    if (result.success && hasApp && hasComponents && hasMultipleFiles) {
      console.log(`\n✅ PASS: Multi-file project created successfully\n`);
      return { passed: 1, failed: 0 };
    } else {
      console.log(`\n❌ FAIL: Multi-file project issues`);
      console.log(`  Has App.jsx: ${hasApp}`);
      console.log(`  Has components/: ${hasComponents}`);
      console.log(`  Multiple files: ${hasMultipleFiles}\n`);
      return { passed: 0, failed: 1 };
    }
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}\n`);
    return { passed: 0, failed: 1 };
  }
}

/**
 * Run all integration tests
 */
export async function runIntegrationTests() {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║    END-TO-END INTEGRATION TESTS        ║");
  console.log("╚════════════════════════════════════════╝");

  if (!hasAPIKey()) {
    console.log("\n⚠️  WARNING: OPENAI_API_KEY not set");
    console.log("All integration tests will be skipped\n");
  }

  const testStartTime = Date.now();

  const createResults = await testCreateNewProject();
  const modifyResults = await testModifyExisting();
  const multiFileResults = await testMultiFileProject();

  const totalTime = Date.now() - testStartTime;

  const totalPassed = createResults.passed + modifyResults.passed + multiFileResults.passed;
  const totalFailed = createResults.failed + modifyResults.failed + multiFileResults.failed;
  const totalSkipped = (createResults.skipped || 0) + (modifyResults.skipped || 0) + (multiFileResults.skipped || 0);
  const totalTests = totalPassed + totalFailed;

  console.log("\n╔════════════════════════════════════════╗");
  console.log("║     INTEGRATION TEST RESULTS           ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  if (totalSkipped > 0) {
    console.log(`⏭️  Skipped: ${totalSkipped}`);
  }
  console.log(`⏱️  Total Time: ${formatTime(totalTime)}`);
  if (totalTests > 0) {
    console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%\n`);
  } else {
    console.log(`No tests were run\n`);
  }

  return {
    totalPassed,
    totalFailed,
    totalTests,
    totalSkipped,
    successRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0
  };
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests();
}
