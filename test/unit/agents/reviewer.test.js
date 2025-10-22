/**
 * Test Reviewer Agent
 * Tests code review functionality and quality scoring
 */

import {
  reviewCode,
  generateImprovementInstructions,
  hasImproved,
  aggregateReviews
} from "../../../src/services/agents/reviewer.js";

/**
 * Check if OpenAI API key is available
 */
function hasAPIKey() {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Sample code for testing
 */
const sampleGoodCode = `
import { useState } from "react";

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, completed: false }]);
      setInput("");
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Todos</h1>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addTodo()}
            placeholder="Add a new todo..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addTodo}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>

        <ul className="space-y-2">
          {todos.map(todo => (
            <li
              key={todo.id}
              onClick={() => toggleTodo(todo.id)}
              className={\`p-4 rounded-lg border transition-colors cursor-pointer \${
                todo.completed
                  ? "bg-green-50 border-green-200 line-through text-gray-500"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }\`}
            >
              {todo.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
`;

const sampleBadCode = `
export default function App() {
  let todos = [];

  function addTodo() {
    todos.push({ text: "New todo" });
  }

  return (
    <div>
      <h1>Todos</h1>
      <button onClick={addTodo}>Add</button>
      {todos.map(t => <div>{t.text}</div>)}
    </div>
  );
}
`;

const sampleIncompleteCode = `
import { useState } from "react";

export default function TodoApp() {
  const [todos, setTodos] = useState([]);

  // TODO: Implement add functionality
  // TODO: Implement delete functionality
  // TODO: Add styling

  return (
    <div>
      <h1>Todos</h1>
      {/* Need to add input field */}
      {/* Need to add todo list */}
    </div>
  );
}
`;

/**
 * Test Code Review Scoring
 */
async function testReviewScoring() {
  console.log("\n========================================");
  console.log("TEST SUITE: Code Review Scoring");
  console.log("========================================\n");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 3 };
  }

  const tests = [
    {
      name: "Good code gets high score",
      code: sampleGoodCode,
      filename: "TodoApp.jsx",
      request: "Create a todo app",
      expectMinScore: 75,
      expectApproved: true
    },
    {
      name: "Bad code gets low score",
      code: sampleBadCode,
      filename: "App.jsx",
      request: "Create a todo app",
      expectMaxScore: 70,
      expectApproved: false
    },
    {
      name: "Incomplete code flagged",
      code: sampleIncompleteCode,
      filename: "TodoApp.jsx",
      request: "Create a todo app with add and delete",
      expectMaxScore: 65,
      expectApproved: false
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}...`);

      const review = await reviewCode(
        test.code,
        test.filename,
        test.request
      );

      console.log(`  Score: ${review.qualityScore}/100`);
      console.log(`  Approved: ${review.approved}`);
      console.log(`  Issues: ${review.issues.length}`);

      let testPassed = true;
      let failReason = "";

      if (test.expectMinScore && review.qualityScore < test.expectMinScore) {
        testPassed = false;
        failReason = `Score ${review.qualityScore} below minimum ${test.expectMinScore}`;
      }

      if (test.expectMaxScore && review.qualityScore > test.expectMaxScore) {
        testPassed = false;
        failReason = `Score ${review.qualityScore} above maximum ${test.expectMaxScore}`;
      }

      if (test.expectApproved !== undefined && review.approved !== test.expectApproved) {
        testPassed = false;
        failReason = `Expected approved=${test.expectApproved}, got ${review.approved}`;
      }

      if (testPassed) {
        console.log(`✅ PASS: ${test.name}\n`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${test.name}`);
        console.log(`   Reason: ${failReason}\n`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${test.name}`);
      console.log(`   ${error.message}\n`);
      failed++;
    }
  }

  console.log(`Results: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Test Issue Detection
 */
async function testIssueDetection() {
  console.log("\n========================================");
  console.log("TEST SUITE: Issue Detection");
  console.log("========================================\n");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 1 };
  }

  try {
    console.log("Testing issue detection on bad code...");

    const review = await reviewCode(
      sampleBadCode,
      "App.jsx",
      "Create a functional todo app"
    );

    console.log(`\nIssues found: ${review.issues.length}`);
    review.issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. [${issue.severity}] ${issue.category}: ${issue.description}`);
    });

    console.log(`\nMissing features: ${review.missingFeatures.length}`);
    review.missingFeatures.forEach((feature, i) => {
      console.log(`  ${i + 1}. ${feature}`);
    });

    // Should detect at least one issue
    if (review.issues.length > 0) {
      console.log(`\n✅ PASS: Issues detected\n`);
      return { passed: 1, failed: 0 };
    } else {
      console.log(`\n❌ FAIL: No issues detected in bad code\n`);
      return { passed: 0, failed: 1 };
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}\n`);
    return { passed: 0, failed: 1 };
  }
}

/**
 * Test Improvement Instructions
 */
async function testImprovementInstructions() {
  console.log("\n========================================");
  console.log("TEST SUITE: Improvement Instructions");
  console.log("========================================\n");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 1 };
  }

  try {
    console.log("Testing improvement instruction generation...");

    const review = await reviewCode(
      sampleBadCode,
      "App.jsx",
      "Create a todo app"
    );

    const instructions = generateImprovementInstructions(review, sampleBadCode);

    if (instructions) {
      console.log("\nGenerated Instructions:");
      console.log("─".repeat(50));
      console.log(instructions);
      console.log("─".repeat(50));

      // Instructions should mention specific issues
      const hasContent = instructions.length > 100;
      const mentionsScore = instructions.includes(review.qualityScore.toString());

      if (hasContent && mentionsScore) {
        console.log(`\n✅ PASS: Instructions generated with details\n`);
        return { passed: 1, failed: 0 };
      } else {
        console.log(`\n❌ FAIL: Instructions missing expected content\n`);
        return { passed: 0, failed: 1 };
      }
    } else {
      console.log(`\n❌ FAIL: No instructions generated for poor code\n`);
      return { passed: 0, failed: 1 };
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}\n`);
    return { passed: 0, failed: 1 };
  }
}

/**
 * Test Improvement Detection
 */
function testHasImproved() {
  console.log("\n========================================");
  console.log("TEST SUITE: Improvement Detection");
  console.log("========================================\n");

  const tests = [
    {
      name: "Score improved by 10 points",
      prev: { qualityScore: 60, issues: [{ severity: "high" }] },
      curr: { qualityScore: 70, issues: [] },
      expect: true
    },
    {
      name: "Critical issue resolved",
      prev: { qualityScore: 70, issues: [{ severity: "critical" }], missingFeatures: [] },
      curr: { qualityScore: 70, issues: [], missingFeatures: [] },
      expect: true
    },
    {
      name: "No improvement",
      prev: { qualityScore: 70, issues: [], missingFeatures: [] },
      curr: { qualityScore: 70, issues: [], missingFeatures: [] },
      expect: false
    },
    {
      name: "Score decreased",
      prev: { qualityScore: 80, issues: [], missingFeatures: [] },
      curr: { qualityScore: 70, issues: [], missingFeatures: [] },
      expect: false
    }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(test => {
    const result = hasImproved(test.prev, test.curr);

    if (result === test.expect) {
      console.log(`✅ PASS: ${test.name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${test.name}`);
      console.log(`   Expected: ${test.expect}, Got: ${result}`);
      failed++;
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Test Review Aggregation
 */
function testAggregateReviews() {
  console.log("\n========================================");
  console.log("TEST SUITE: Review Aggregation");
  console.log("========================================\n");

  const reviews = [
    { qualityScore: 85, approved: true, issues: [], filename: "App.jsx" },
    { qualityScore: 75, approved: true, issues: [{ severity: "low" }], filename: "TodoList.jsx" },
    { qualityScore: 90, approved: true, issues: [], filename: "TodoItem.jsx" }
  ];

  try {
    const aggregate = aggregateReviews(reviews);

    console.log("Aggregated Results:");
    console.log(`  Average Score: ${aggregate.averageScore}/100`);
    console.log(`  All Approved: ${aggregate.allApproved}`);
    console.log(`  Total Issues: ${aggregate.totalIssues}`);
    console.log(`  Critical Issues: ${aggregate.criticalIssues}`);

    const expectedAvg = Math.round((85 + 75 + 90) / 3);

    if (aggregate.averageScore === expectedAvg && aggregate.allApproved === true) {
      console.log(`\n✅ PASS: Aggregation correct\n`);
      return { passed: 1, failed: 0 };
    } else {
      console.log(`\n❌ FAIL: Aggregation incorrect`);
      console.log(`   Expected average: ${expectedAvg}, got ${aggregate.averageScore}\n`);
      return { passed: 0, failed: 1 };
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}\n`);
    return { passed: 0, failed: 1 };
  }
}

/**
 * Run all reviewer tests
 */
export async function runReviewerTests() {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║      REVIEWER AGENT TEST SUITE         ║");
  console.log("╚════════════════════════════════════════╝");

  if (!hasAPIKey()) {
    console.log("\n⚠️  WARNING: OPENAI_API_KEY not set - some tests will be skipped");
    console.log("Set OPENAI_API_KEY environment variable to run all tests\n");
  }

  const scoringResults = await testReviewScoring();
  const issueResults = await testIssueDetection();
  const instructionResults = await testImprovementInstructions();
  const improvementResults = testHasImproved();
  const aggregateResults = testAggregateReviews();

  const totalPassed =
    scoringResults.passed +
    issueResults.passed +
    instructionResults.passed +
    improvementResults.passed +
    aggregateResults.passed;

  const totalFailed =
    scoringResults.failed +
    issueResults.failed +
    instructionResults.failed +
    improvementResults.failed +
    aggregateResults.failed;

  const totalTests = totalPassed + totalFailed;

  console.log("\n╔════════════════════════════════════════╗");
  console.log("║        REVIEWER TEST RESULTS           ║");
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
  runReviewerTests();
}
