/**
 * Performance Tests for Phase 1-3 Improvements
 * Tests parallel generation, smart routing, memory, and agent consultation
 */

import { AgentOrchestrator } from '../../src/services/agentOrchestrator.js';
import { getConversationMemory, resetConversationMemory } from '../../src/services/ConversationMemory.js';
import { getProjectContext, resetProjectContext } from '../../src/services/ProjectContext.js';
import { getConsultation } from '../../src/services/agentConsultation.js';
import { determineAgentRoute } from '../../src/services/agentRouter.js';

/**
 * Test configuration
 */
const TEST_TIMEOUT = 120000; // 2 minutes

/**
 * Performance benchmark helper
 */
class PerformanceBenchmark {
  constructor(name) {
    this.name = name;
    this.startTime = null;
    this.endTime = null;
    this.metrics = {};
  }

  start() {
    this.startTime = Date.now();
    console.log(`\n⏱️  Starting: ${this.name}`);
  }

  end() {
    this.endTime = Date.now();
    const duration = this.endTime - this.startTime;
    console.log(`✅ Completed: ${this.name} in ${(duration / 1000).toFixed(2)}s`);
    return duration;
  }

  addMetric(key, value) {
    this.metrics[key] = value;
  }

  getReport() {
    return {
      name: this.name,
      duration: this.endTime - this.startTime,
      durationSeconds: ((this.endTime - this.startTime) / 1000).toFixed(2),
      metrics: this.metrics
    };
  }
}

/**
 * Test 1: Parallel File Generation Performance
 */
async function testParallelGeneration() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: Parallel File Generation Performance');
  console.log('='.repeat(60));

  const benchmark = new PerformanceBenchmark('Parallel 3-File Generation');

  const updates = [];
  const orchestrator = new AgentOrchestrator((update) => {
    updates.push(update);
  });

  benchmark.start();

  try {
    const result = await orchestrator.processUserMessage(
      'Create a simple todo app with App.jsx, TodoList.jsx, and TodoItem.jsx',
      {}
    );

    const duration = benchmark.end();

    // Verify all files were created
    const filesCreated = result.fileOperations?.length || 0;
    benchmark.addMetric('filesCreated', filesCreated);
    benchmark.addMetric('filesPerSecond', (filesCreated / (duration / 1000)).toFixed(2));

    console.log(`\n📊 Results:`);
    console.log(`  Files Created: ${filesCreated}`);
    console.log(`  Total Time: ${(duration / 1000).toFixed(2)}s`);
    console.log(`  Avg per File: ${(duration / filesCreated / 1000).toFixed(2)}s`);
    console.log(`  ${filesCreated === 3 ? '✅ PASS' : '❌ FAIL'}: Expected 3 files`);

    return {
      success: filesCreated === 3,
      ...benchmark.getReport()
    };
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      success: false,
      error: error.message,
      ...benchmark.getReport()
    };
  }
}

/**
 * Test 2: Smart Routing Performance
 */
async function testSmartRouting() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Smart Routing Performance');
  console.log('='.repeat(60));

  const testCases = [
    {
      name: 'Simple text change',
      message: 'Change button text to "Click me"',
      expectedRoute: 'fast',
      shouldSkipPlanner: true
    },
    {
      name: 'Simple color change',
      message: 'Make it blue',
      expectedRoute: 'fast',
      shouldSkipPlanner: true
    },
    {
      name: 'Complex feature',
      message: 'Add user authentication with login form, session management, and protected routes',
      expectedRoute: 'slow',
      shouldSkipPlanner: false
    }
  ];

  const results = [];

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`);

    const route = determineAgentRoute(
      testCase.message,
      { intent: 'modify_existing', confidence: 0.9 },
      { 'App.jsx': 'const App = () => {}' }
    );

    const passed =
      route.estimatedTime === testCase.expectedRoute &&
      route.skipPlanner === testCase.shouldSkipPlanner;

    console.log(`  Route: ${route.reason}`);
    console.log(`  Speed: ${route.estimatedTime}`);
    console.log(`  Skip Planner: ${route.skipPlanner}`);
    console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'}`);

    results.push({
      testCase: testCase.name,
      passed,
      route: route.reason,
      estimatedTime: route.estimatedTime
    });
  }

  const allPassed = results.every(r => r.passed);
  console.log(`\n${allPassed ? '✅' : '❌'} Overall: ${results.filter(r => r.passed).length}/${results.length} tests passed`);

  return {
    success: allPassed,
    results
  };
}

/**
 * Test 3: Conversation Memory
 */
async function testConversationMemory() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Conversation Memory');
  console.log('='.repeat(60));

  resetConversationMemory();
  const memory = getConversationMemory();

  console.log('\n📝 Test: Pronoun Resolution');

  // Simulate a conversation
  memory.addTurn('user', 'Create a todo app');
  memory.recordFileOperations([
    { type: 'create', filename: 'App.jsx' },
    { type: 'create', filename: 'TodoList.jsx' }
  ]);

  memory.addTurn('assistant', 'Created todo app with 2 files');

  // Test pronoun resolution
  const testMessage = 'make it blue';
  const resolved = memory.resolveReferences(testMessage);

  console.log(`  Original: "${testMessage}"`);
  console.log(`  Resolved: "${resolved}"`);
  console.log(`  ${resolved.includes('App.jsx') ? '✅ PASS' : '❌ FAIL'}: Should reference App.jsx`);

  // Test context summary
  const summary = memory.getContextSummary();
  console.log(`\n📊 Context Summary:`);
  console.log(summary);

  const stats = memory.getStats();
  console.log(`\n📈 Stats:`);
  console.log(`  Turns: ${stats.turnCount}`);
  console.log(`  Files Discussed: ${stats.filesDiscussed}`);

  return {
    success: resolved.includes('App.jsx') && stats.turnCount === 2,
    stats,
    resolvedMessage: resolved
  };
}

/**
 * Test 4: Project Context
 */
async function testProjectContext() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: Project Context');
  console.log('='.repeat(60));

  resetProjectContext();
  const context = getProjectContext();

  // Simulate plan update
  const mockPlan = {
    appIdentity: {
      name: 'TaskFlow',
      tagline: 'Organize your day',
      tone: 'professional'
    },
    colorScheme: {
      theme: 'dark',
      primary: 'blue-500',
      secondary: 'purple-500'
    },
    designStyle: {
      aesthetic: 'glassmorphism',
      corners: 'rounded-xl'
    }
  };

  console.log('\n📝 Updating project context from plan...');
  context.updateFromPlan(mockPlan);

  console.log(`  App Name: ${context.projectInfo.appName}`);
  console.log(`  Theme: ${context.projectInfo.theme}`);
  console.log(`  Primary Color: ${context.projectInfo.colorScheme.primary}`);

  // Test context string generation
  const contextStr = context.getContextString();
  console.log(`\n📄 Context String Generated: ${contextStr.length} chars`);

  const includesAppName = contextStr.includes('TaskFlow');
  console.log(`  ${includesAppName ? '✅ PASS' : '❌ FAIL'}: Context includes app name`);

  const stats = context.getStats();
  console.log(`\n📈 Stats:`);
  console.log(JSON.stringify(stats, null, 2));

  return {
    success: includesAppName && context.isInitialized(),
    stats,
    contextLength: contextStr.length
  };
}

/**
 * Test 5: Agent Consultation Protocol
 */
async function testAgentConsultation() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 5: Agent Consultation Protocol');
  console.log('='.repeat(60));

  const consultation = getConsultation();
  consultation.clear();

  console.log('\n💬 Test: Generator → Analyzer (Dependencies)');
  const benchmark1 = new PerformanceBenchmark('Dependency Consultation');
  benchmark1.start();

  try {
    const result1 = await consultation.requestConsultation({
      fromAgent: 'generator',
      toAgent: 'analyzer',
      consultationType: 'ask-dependencies',
      question: 'What dependencies needed for Header.jsx?',
      context: {
        userMessage: 'Create a header component',
        currentFiles: {}
      }
    });

    const duration1 = benchmark1.end();

    console.log(`  Success: ${result1.success ? '✅' : '❌'}`);
    console.log(`  Dependencies: ${result1.dependencies?.join(', ')}`);
    console.log(`  Duration: ${duration1}ms`);

    console.log('\n💬 Test: Modifier → Reviewer (Best Practices)');
    const benchmark2 = new PerformanceBenchmark('Best Practice Consultation');
    benchmark2.start();

    const result2 = await consultation.requestConsultation({
      fromAgent: 'modifier',
      toAgent: 'reviewer',
      consultationType: 'ask-best-practice',
      question: 'Best practices for adding a form?',
      context: {
        code: 'const App = () => {}',
        filename: 'App.jsx',
        userMessage: 'Add a form'
      }
    });

    const duration2 = benchmark2.end();

    console.log(`  Success: ${result2.success ? '✅' : '❌'}`);
    console.log(`  Advice: ${result2.answer}`);
    console.log(`  Duration: ${duration2}ms`);

    const stats = consultation.getStats();
    console.log(`\n📈 Consultation Stats:`);
    console.log(`  Total: ${stats.total}`);
    console.log(`  Success Rate: ${stats.successRate}%`);
    console.log(`  Avg Duration: ${stats.averageDuration}ms`);

    return {
      success: result1.success && result2.success,
      consultations: stats.total,
      successRate: stats.successRate
    };
  } catch (error) {
    console.error('❌ Consultation failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 6: End-to-End Performance Comparison
 */
async function testEndToEndPerformance() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 6: End-to-End Performance');
  console.log('='.repeat(60));

  const scenarios = [
    {
      name: 'Simple Request (Smart Routing Optimization)',
      message: 'Change heading text to "Welcome"',
      currentFiles: { 'App.jsx': 'const App = () => <h1>Hello</h1>' },
      expectedFast: true
    },
    {
      name: 'Medium Request (Context-Aware)',
      message: 'Add a button',
      currentFiles: { 'App.jsx': 'const App = () => <div>App</div>' },
      expectedFast: false
    }
  ];

  const results = [];

  for (const scenario of scenarios) {
    console.log(`\n📝 Testing: ${scenario.name}`);

    const benchmark = new PerformanceBenchmark(scenario.name);
    const updates = [];

    const orchestrator = new AgentOrchestrator((update) => {
      updates.push(update);
    });

    benchmark.start();

    try {
      const result = await orchestrator.processUserMessage(
        scenario.message,
        scenario.currentFiles
      );

      const duration = benchmark.end();

      const isFast = duration < 20000; // Less than 20 seconds
      const matchesExpectation = isFast === scenario.expectedFast;

      console.log(`  Duration: ${(duration / 1000).toFixed(2)}s`);
      console.log(`  Is Fast: ${isFast ? 'Yes' : 'No'}`);
      console.log(`  Success: ${result.success ? '✅' : '❌'}`);
      console.log(`  ${matchesExpectation ? '✅ PASS' : '⚠️  Unexpected Speed'}`);

      results.push({
        scenario: scenario.name,
        duration: duration / 1000,
        success: result.success,
        matchesExpectation
      });
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      results.push({
        scenario: scenario.name,
        error: error.message,
        success: false
      });
    }
  }

  const allSucceeded = results.every(r => r.success);
  console.log(`\n${allSucceeded ? '✅' : '❌'} Overall: ${results.filter(r => r.success).length}/${results.length} scenarios succeeded`);

  return {
    success: allSucceeded,
    results
  };
}

/**
 * Main test runner
 */
async function runPerformanceTests() {
  console.log('\n' + '█'.repeat(60));
  console.log('  PERFORMANCE TEST SUITE - Phase 1-3 Improvements');
  console.log('█'.repeat(60));

  const testResults = {
    startTime: new Date().toISOString(),
    tests: []
  };

  try {
    // Run all tests
    testResults.tests.push({
      name: 'Parallel File Generation',
      result: await testParallelGeneration()
    });

    testResults.tests.push({
      name: 'Smart Routing',
      result: await testSmartRouting()
    });

    testResults.tests.push({
      name: 'Conversation Memory',
      result: await testConversationMemory()
    });

    testResults.tests.push({
      name: 'Project Context',
      result: await testProjectContext()
    });

    testResults.tests.push({
      name: 'Agent Consultation',
      result: await testAgentConsultation()
    });

    // Uncomment to test end-to-end (requires API key)
    // testResults.tests.push({
    //   name: 'End-to-End Performance',
    //   result: await testEndToEndPerformance()
    // });

  } catch (error) {
    console.error('\n❌ Test suite error:', error);
    testResults.error = error.message;
  }

  testResults.endTime = new Date().toISOString();

  // Summary
  console.log('\n' + '█'.repeat(60));
  console.log('  TEST SUMMARY');
  console.log('█'.repeat(60));

  const passed = testResults.tests.filter(t => t.result.success).length;
  const total = testResults.tests.length;

  testResults.tests.forEach(test => {
    const status = test.result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${test.name}`);
  });

  console.log(`\n${passed === total ? '🎉' : '⚠️'} Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('\n✨ All performance improvements verified!');
    console.log('   - Parallel generation working');
    console.log('   - Smart routing optimizing requests');
    console.log('   - Memory & context tracking conversations');
    console.log('   - Agent consultations enabling collaboration');
  }

  return testResults;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPerformanceTests()
    .then(results => {
      const passed = results.tests.filter(t => t.result.success).length;
      const total = results.tests.length;
      process.exit(passed === total ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runPerformanceTests };
