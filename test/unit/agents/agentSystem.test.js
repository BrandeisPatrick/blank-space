/**
 * Agent System Tests
 * Tests for agentMessenger, agentTools, BaseAgent, and groupChatOrchestrator
 */

import { AgentMessenger } from "../../../src/services/agentMessenger.js";
import { AgentTools } from "../../../src/services/agentTools.js";
import { BaseAgent } from "../../../src/services/agents/BaseAgent.js";
import { GroupChatOrchestrator } from "../../../src/services/groupChatOrchestrator.js";
import { hasAPIKey } from "../../utils/testHelpers.js";

/**
 * Test Agent Messenger (Pub/Sub Communication)
 */
async function testAgentMessenger() {
  console.log("\n========================================");
  console.log("TEST SUITE: Agent Messenger");
  console.log("========================================\n");

  const messenger = new AgentMessenger();
  let passed = 0;
  let failed = 0;

  // Test 1: Subscribe and publish
  try {
    let received = null;
    messenger.subscribe("test_topic", (msg) => {
      received = msg;
    });

    messenger.publish("test_topic", { data: "test_data" });

    if (received && received.data === "test_data") {
      console.log("✅ PASS: Subscribe and publish works");
      passed++;
    } else {
      console.log("❌ FAIL: Subscribe and publish failed");
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failed++;
  }

  // Test 2: Request/response pattern
  try {
    messenger.on("test_request", (msg) => {
      return { response: `Processed: ${msg.data}` };
    });

    const response = await messenger.request("test_request", { data: "hello" });

    if (response && response.response === "Processed: hello") {
      console.log("✅ PASS: Request/response pattern works");
      passed++;
    } else {
      console.log("❌ FAIL: Request/response pattern failed");
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failed++;
  }

  // Test 3: Multiple subscribers
  try {
    let count = 0;
    messenger.subscribe("multi_topic", () => count++);
    messenger.subscribe("multi_topic", () => count++);

    messenger.publish("multi_topic", {});

    if (count === 2) {
      console.log("✅ PASS: Multiple subscribers work");
      passed++;
    } else {
      console.log(`❌ FAIL: Expected 2 subscribers, got ${count}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failed++;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Test Agent Tools (Tool Registry)
 */
async function testAgentTools() {
  console.log("\n========================================");
  console.log("TEST SUITE: Agent Tools");
  console.log("========================================\n");

  const tools = new AgentTools();
  let passed = 0;
  let failed = 0;

  // Test 1: Register and get tool
  try {
    const testTool = {
      name: "test_tool",
      description: "A test tool",
      capabilities: ["testing"],
      execute: (input) => `Executed: ${input}`
    };

    tools.register(testTool);
    const retrieved = tools.get("test_tool");

    if (retrieved && retrieved.name === "test_tool") {
      console.log("✅ PASS: Register and get tool works");
      passed++;
    } else {
      console.log("❌ FAIL: Register and get tool failed");
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failed++;
  }

  // Test 2: Search by capability
  try {
    tools.register({
      name: "code_tool",
      capabilities: ["code_generation"],
      execute: () => {}
    });

    const codeTools = tools.search({ capability: "code_generation" });

    if (codeTools.length > 0 && codeTools[0].name === "code_tool") {
      console.log("✅ PASS: Search by capability works");
      passed++;
    } else {
      console.log("❌ FAIL: Search by capability failed");
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failed++;
  }

  // Test 3: List all tools
  try {
    const allTools = tools.list();

    if (allTools.length >= 2) {
      console.log("✅ PASS: List all tools works");
      passed++;
    } else {
      console.log(`❌ FAIL: Expected at least 2 tools, got ${allTools.length}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failed++;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Test Base Agent
 */
async function testBaseAgent() {
  console.log("\n========================================");
  console.log("TEST SUITE: Base Agent");
  console.log("========================================\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Agent initialization
  try {
    const agent = new BaseAgent({
      name: "test_agent",
      role: "tester",
      capabilities: ["testing"]
    });

    if (agent.name === "test_agent" && agent.role === "tester") {
      console.log("✅ PASS: Agent initialization works");
      passed++;
    } else {
      console.log("❌ FAIL: Agent initialization failed");
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failed++;
  }

  // Test 2: Agent capabilities
  try {
    const agent = new BaseAgent({
      name: "capable_agent",
      capabilities: ["read", "write"]
    });

    if (agent.hasCapability("read") && agent.hasCapability("write")) {
      console.log("✅ PASS: Agent capabilities work");
      passed++;
    } else {
      console.log("❌ FAIL: Agent capabilities failed");
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failed++;
  }

  // Test 3: Execution history
  try {
    const agent = new BaseAgent({ name: "history_agent" });

    agent.recordExecution({
      action: "test_action",
      result: "success"
    });

    const history = agent.getHistory();

    if (history.length === 1 && history[0].action === "test_action") {
      console.log("✅ PASS: Execution history works");
      passed++;
    } else {
      console.log("❌ FAIL: Execution history failed");
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failed++;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Test Group Chat Orchestrator
 */
async function testGroupChatOrchestrator() {
  console.log("\n========================================");
  console.log("TEST SUITE: Group Chat Orchestrator");
  console.log("========================================\n");

  if (!hasAPIKey()) {
    console.log("⚠️  SKIPPED: OPENAI_API_KEY not set\n");
    return { passed: 0, failed: 0, skipped: 3 };
  }

  let passed = 0;
  let failed = 0;

  // Test 1: Orchestrator initialization
  try {
    const agents = [
      { name: "planner", role: "planning" },
      { name: "coder", role: "coding" }
    ];

    const orchestrator = new GroupChatOrchestrator(agents);

    if (orchestrator.agents.length === 2) {
      console.log("✅ PASS: Orchestrator initialization works");
      passed++;
    } else {
      console.log("❌ FAIL: Orchestrator initialization failed");
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failed++;
  }

  // Test 2: Speaker selection
  try {
    const agents = [
      { name: "agent1", role: "role1" },
      { name: "agent2", role: "role2" }
    ];

    const orchestrator = new GroupChatOrchestrator(agents);
    const speaker = orchestrator.selectNextSpeaker("round_robin");

    if (speaker && agents.includes(speaker)) {
      console.log("✅ PASS: Speaker selection works");
      passed++;
    } else {
      console.log("❌ FAIL: Speaker selection failed");
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failed++;
  }

  // Test 3: Message broadcasting
  try {
    const agents = [
      { name: "listener1", onMessage: () => true },
      { name: "listener2", onMessage: () => true }
    ];

    const orchestrator = new GroupChatOrchestrator(agents);
    const result = orchestrator.broadcast({ content: "test message" });

    if (result) {
      console.log("✅ PASS: Message broadcasting works");
      passed++;
    } else {
      console.log("❌ FAIL: Message broadcasting failed");
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failed++;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

/**
 * Run all agent system tests
 */
export async function runAgentSystemTests() {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║     AGENT SYSTEM TEST SUITE            ║");
  console.log("╚════════════════════════════════════════╝");

  const messengerResults = await testAgentMessenger();
  const toolsResults = await testAgentTools();
  const baseAgentResults = await testBaseAgent();
  const groupChatResults = await testGroupChatOrchestrator();

  const totalPassed =
    messengerResults.passed +
    toolsResults.passed +
    baseAgentResults.passed +
    groupChatResults.passed;

  const totalFailed =
    messengerResults.failed +
    toolsResults.failed +
    baseAgentResults.failed +
    groupChatResults.failed;

  const totalTests = totalPassed + totalFailed;

  console.log("\n╔════════════════════════════════════════╗");
  console.log("║      AGENT SYSTEM TEST RESULTS         ║");
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
  runAgentSystemTests();
}
