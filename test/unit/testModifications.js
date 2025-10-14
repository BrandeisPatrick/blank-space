/**
 * Test Modifications
 * Tests the agent's ability to correctly modify existing files
 */

import { validateFiles, validateFile } from "./validators.js";
import modificationScenarios from "../fixtures/modifications.js";
import { completeTodoApp, basicTodoAppNoDelete } from "../__mocks__/mockExistingProjects.js";
import { analyzeCodebaseForModification } from "../../src/services/agents/analyzer.js";
import { modifyCode } from "../../src/services/agents/modifier.js";

/**
 * Check if OpenAI API key is available
 */
function hasAPIKey() {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Test that modifications preserve existing code
 */
function testPreservesExistingCode() {
  console.log("\n========================================");
  console.log("TEST SUITE: Modification Preservation");
  console.log("========================================\n");

  const tests = [
    {
      name: "Adding delete button preserves todo display",
      originalCode: basicTodoAppNoDelete["components/TodoItem.jsx"],
      modifiedCode: completeTodoApp["components/TodoItem.jsx"],
      shouldPreserve: ["todo.text", "flex", "rounded-lg", "bg-gray-50"]
    },
    {
      name: "Adding delete button preserves existing imports",
      originalCode: `import React from "react";\n\nfunction TodoItem({ todo }) { return <li>{todo.text}</li>; }`,
      modifiedCode: `import React from "react";\n\nfunction TodoItem({ todo, onRemove }) { return <li>{todo.text} <button onClick={() => onRemove(todo.id)}>Delete</button></li>; }`,
      shouldPreserve: ['import React from "react"', "function TodoItem"]
    }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test) => {
    const allPreserved = test.shouldPreserve.every(pattern =>
      test.modifiedCode.includes(pattern)
    );

    if (allPreserved) {
      console.log(`✅ PASS: ${test.name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${test.name}`);
      const missing = test.shouldPreserve.filter(pattern =>
        !test.modifiedCode.includes(pattern)
      );
      console.log(`   Missing patterns: ${missing.join(", ")}`);
      failed++;
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Test that modifications maintain code quality
 */
function testModificationQuality() {
  console.log("\n========================================");
  console.log("TEST SUITE: Modification Quality");
  console.log("========================================\n");

  const tests = [
    {
      name: "Modified TodoItem maintains Tailwind classes",
      filename: "components/TodoItem.jsx",
      code: completeTodoApp["components/TodoItem.jsx"],
      shouldHaveTailwind: true
    },
    {
      name: "Modified TodoList maintains proper imports",
      filename: "components/TodoList.jsx",
      code: completeTodoApp["components/TodoList.jsx"],
      shouldImport: ["useState", "useTodos", "TodoItem"]
    },
    {
      name: "Modified hook exports correctly",
      filename: "hooks/useTodos.js",
      code: completeTodoApp["hooks/useTodos.js"],
      shouldExport: "useTodos"
    }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test) => {
    const validation = validateFile(test.filename, test.code);

    if (validation.valid) {
      console.log(`✅ PASS: ${test.name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${test.name}`);
      console.log(`   Errors: ${validation.errors.join(", ")}`);
      failed++;
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Test that planning identifies correct files to modify
 */
async function testPlanningIdentification() {
  console.log("\n========================================");
  console.log("TEST SUITE: Planning Identification");
  console.log("========================================\n");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: modificationScenarios.length };
  }

  const tests = modificationScenarios.map((scenario) => ({
    name: scenario.name,
    userRequest: scenario.userRequest,
    currentFiles: scenario.currentFiles,
    expectedFilesToModify: scenario.expectedPlan.filesToModify,
    shouldNotCreate: scenario.expectedPlan.filesToCreate.length === 0
  }));

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      // Use real analyzer agent
      const analysisResult = await analyzeCodebaseForModification(
        test.userRequest,
        test.currentFiles
      );

      const identifiedFiles = analysisResult.filesToModify || [];

      const correctlyIdentified = test.expectedFilesToModify.every(file =>
        identifiedFiles.includes(file)
      );

      if (correctlyIdentified && identifiedFiles.length > 0) {
        console.log(`✅ PASS: ${test.name}`);
        console.log(`   Correctly identified: ${identifiedFiles.join(", ")}`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${test.name}`);
        console.log(`   Expected: ${test.expectedFilesToModify.join(", ")}`);
        console.log(`   Got: ${identifiedFiles.join(", ")}`);
        console.log(`   Reasoning: ${analysisResult.reasoning}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${test.name}`);
      console.log(`   ${error.message}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Test modification requirements
 */
function testModificationRequirements() {
  console.log("\n========================================");
  console.log("TEST SUITE: Modification Requirements");
  console.log("========================================\n");

  const tests = [];

  // Test: Add delete button scenario
  const deleteScenario = modificationScenarios.find(s => s.name === "Add Delete Functionality to Todos");
  if (deleteScenario) {
    const modifiedItem = completeTodoApp["components/TodoItem.jsx"];
    const modifiedHook = completeTodoApp["hooks/useTodos.js"];

    tests.push({
      name: "TodoItem has delete button",
      code: modifiedItem,
      mustHave: ["button", "Delete", "onRemove", "onClick"]
    });

    tests.push({
      name: "useTodos has removeTodo function",
      code: modifiedHook,
      mustHave: ["removeTodo", "filter", "setTodos"]
    });
  }

  let passed = 0;
  let failed = 0;

  tests.forEach((test) => {
    const hasAll = test.mustHave.every(pattern => test.code.includes(pattern));

    if (hasAll) {
      console.log(`✅ PASS: ${test.name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${test.name}`);
      const missing = test.mustHave.filter(pattern => !test.code.includes(pattern));
      console.log(`   Missing: ${missing.join(", ")}`);
      failed++;
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Test that modifications don't introduce duplicates
 */
function testNoDuplicates() {
  console.log("\n========================================");
  console.log("TEST SUITE: No Duplicate Code");
  console.log("========================================\n");

  const tests = [
    {
      name: "Modified TodoItem has no duplicate imports",
      filename: "components/TodoItem.jsx",
      code: completeTodoApp["components/TodoItem.jsx"]
    },
    {
      name: "Modified TodoList has no duplicate state",
      filename: "components/TodoList.jsx",
      code: completeTodoApp["components/TodoList.jsx"]
    },
    {
      name: "Modified hook has no duplicate functions",
      filename: "hooks/useTodos.js",
      code: completeTodoApp["hooks/useTodos.js"]
    }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach((test) => {
    const validation = validateFile(test.filename, test.code);
    const duplicateErrors = validation.errors.filter(err => err.includes("Duplicate"));

    if (duplicateErrors.length === 0) {
      console.log(`✅ PASS: ${test.name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${test.name}`);
      console.log(`   ${duplicateErrors.join(", ")}`);
      failed++;
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Run all modification tests
 */
export async function runModificationTests() {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   MODIFICATION TEST SUITE              ║");
  console.log("╚════════════════════════════════════════╝");

  if (!hasAPIKey()) {
    console.log("\n⚠️  WARNING: OPENAI_API_KEY not set");
    console.log("Some tests (Planning Identification) will be skipped\n");
  }

  const preservationResults = testPreservesExistingCode();
  const qualityResults = testModificationQuality();
  const planningResults = await testPlanningIdentification();
  const requirementsResults = testModificationRequirements();
  const duplicatesResults = testNoDuplicates();

  const totalPassed =
    preservationResults.passed +
    qualityResults.passed +
    planningResults.passed +
    requirementsResults.passed +
    duplicatesResults.passed;

  const totalFailed =
    preservationResults.failed +
    qualityResults.failed +
    planningResults.failed +
    requirementsResults.failed +
    duplicatesResults.failed;

  const totalTests = totalPassed + totalFailed;

  console.log("\n╔════════════════════════════════════════╗");
  console.log("║       MODIFICATION TEST RESULTS        ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  if (totalTests > 0) {
    console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%\n`);
  } else {
    console.log(`No tests were run\n`);
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
  runModificationTests();
}
