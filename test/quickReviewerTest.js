/**
 * Quick Reviewer Test
 * Tests if the reviewer agent works after token limit fix
 */

import { reviewCode } from "../src/services/agents/reviewer.js";

const sampleCode = `
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

  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6">My Todos</h1>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a todo..."
          className="w-full px-4 py-2 border rounded-lg mb-4"
        />
        <button
          onClick={addTodo}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          Add
        </button>
      </div>
    </div>
  );
}
`;

console.log("\n🧪 Testing Reviewer Agent with GPT-5 Token Fix");
console.log("═".repeat(60));

try {
  console.log("\n📝 Reviewing sample React code...");

  const review = await reviewCode(
    sampleCode,
    "TodoApp.jsx",
    "Create a simple todo app"
  );

  console.log("\n✅ Review completed successfully!");
  console.log("═".repeat(60));
  console.log(`📊 Quality Score: ${review.qualityScore}/100`);
  console.log(`✓ Approved: ${review.approved}`);
  console.log(`✓ Needs Revision: ${review.needsRevision}`);
  console.log(`✓ Issues Found: ${review.issues.length}`);
  console.log(`✓ Missing Features: ${review.missingFeatures.length}`);
  console.log(`✓ Strengths: ${review.strengths.length}`);

  console.log("\n📋 Overall Feedback:");
  console.log(review.overallFeedback);

  if (review.issues.length > 0) {
    console.log("\n⚠️  Issues:");
    review.issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. [${issue.severity}] ${issue.description}`);
    });
  }

  console.log("\n═".repeat(60));
  console.log("🎉 TEST PASSED - Reviewer is working correctly!");
  console.log("═".repeat(60) + "\n");

} catch (error) {
  console.error("\n❌ TEST FAILED");
  console.error("═".repeat(60));
  console.error("Error:", error.message);
  console.error("\nStack:", error.stack);
  console.error("═".repeat(60) + "\n");
  process.exit(1);
}
