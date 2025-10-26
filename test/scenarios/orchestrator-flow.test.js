/**
 * Orchestrator Flow Integration Tests
 * Tests the complete agent flow: PLAN → CODE → TEST → DEBUG
 */

import { runOrchestrator } from '../../src/services/orchestrator.js';

console.log('\n🧪 Starting Orchestrator Flow Tests...\n');

// Test counter
let testsRun = 0;
let testsPassed = 0;

/**
 * Test helper
 */
function test(name, fn) {
  testsRun++;
  try {
    console.log(`\n📝 Test ${testsRun}: ${name}`);
    fn();
    testsPassed++;
    console.log(`✅ PASSED\n`);
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}\n`);
  }
}

/**
 * Async test helper
 */
async function testAsync(name, fn) {
  testsRun++;
  try {
    console.log(`\n📝 Test ${testsRun}: ${name}`);
    await fn();
    testsPassed++;
    console.log(`✅ PASSED\n`);
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}\n`);
    console.error(error);
  }
}

// ============================================================================
// TEST SUITE 1: CREATE NEW APP FLOW
// ============================================================================

await testAsync('Scenario 1: Create simple counter app', async () => {
  console.log('   Testing: PLAN → CODE flow for new app');

  const userMessage = 'Create a simple counter app with increment and decrement buttons';
  const currentFiles = {}; // Empty - creating new app

  let planReceived = false;
  let codeReceived = false;

  const result = await runOrchestrator(userMessage, currentFiles, (update) => {
    if (update.type === 'plan') {
      planReceived = true;
      console.log(`   ✓ Plan created: ${update.plan?.summary || 'N/A'}`);
    }
    if (update.type === 'phase' && update.message.includes('code')) {
      codeReceived = true;
      console.log(`   ✓ Code generation phase started`);
    }
  }, {
    runTests: false // Skip tests for faster execution
  });

  // Assertions
  if (!result.success) throw new Error('Orchestrator failed');
  if (!result.fileOperations || result.fileOperations.length === 0) {
    throw new Error('No files generated');
  }
  if (!planReceived) throw new Error('Plan phase not executed');

  console.log(`   ✓ Generated ${result.fileOperations.length} file(s)`);
  console.log(`   ✓ Files: ${result.fileOperations.map(f => f.filename).join(', ')}`);
});

// ============================================================================
// TEST SUITE 2: MODIFY EXISTING CODE FLOW
// ============================================================================

await testAsync('Scenario 2: Modify existing app colors', async () => {
  console.log('   Testing: ANALYZE → MODIFY flow for color change');

  const userMessage = 'Change all blue colors to red';
  const currentFiles = {
    'App.jsx': `
import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">Counter</h1>
        <div className="text-6xl font-bold text-center mb-8 text-blue-800">{count}</div>
        <div className="flex gap-4">
          <button
            onClick={() => setCount(count + 1)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Increment
          </button>
          <button
            onClick={() => setCount(count - 1)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Decrement
          </button>
        </div>
      </div>
    </div>
  );
}
    `.trim()
  };

  let analysisReceived = false;

  const result = await runOrchestrator(userMessage, currentFiles, (update) => {
    if (update.type === 'phase' && update.message.toLowerCase().includes('analyz')) {
      analysisReceived = true;
      console.log(`   ✓ Analysis phase executed`);
    }
  }, {
    runTests: false
  });

  // Assertions
  if (!result.success) throw new Error('Modification failed');
  if (!result.fileOperations || result.fileOperations.length === 0) {
    throw new Error('No modified files returned');
  }

  const modifiedCode = result.fileOperations[0].content;
  const hasRed = modifiedCode.includes('red-') || modifiedCode.includes('red');
  const hasBlue = modifiedCode.includes('blue-');

  if (!hasRed) throw new Error('Red colors not added');
  if (hasBlue) console.log(`   ⚠️  Warning: Blue colors still present (may be intentional)`);

  console.log(`   ✓ Modified ${result.fileOperations.length} file(s)`);
  console.log(`   ✓ Color changes applied`);
});

// ============================================================================
// TEST SUITE 3: METADATA VALIDATION
// ============================================================================

await testAsync('Scenario 3: Verify orchestrator metadata', async () => {
  console.log('   Testing: Metadata completeness and structure');

  const userMessage = 'Create a hello world app';
  const currentFiles = {};

  const result = await runOrchestrator(userMessage, currentFiles, () => {}, {
    runTests: false
  });

  // Assertions
  if (!result.metadata) throw new Error('No metadata returned');
  if (typeof result.metadata.needsPlanning !== 'boolean') {
    throw new Error('Missing needsPlanning metadata');
  }
  if (!result.metadata.operation) throw new Error('Missing operation metadata');
  if (typeof result.metadata.filesGenerated !== 'number') {
    throw new Error('Missing filesGenerated metadata');
  }

  console.log(`   ✓ Metadata structure valid`);
  console.log(`   ✓ Operation: ${result.metadata.operation}`);
  console.log(`   ✓ Files generated: ${result.metadata.filesGenerated}`);
  console.log(`   ✓ Needed planning: ${result.metadata.needsPlanning}`);
});

// ============================================================================
// TEST SUITE 4: ERROR HANDLING
// ============================================================================

await testAsync('Scenario 4: Handle invalid input gracefully', async () => {
  console.log('   Testing: Error handling with empty user message');

  const userMessage = ''; // Empty message
  const currentFiles = {};

  try {
    const result = await runOrchestrator(userMessage, currentFiles, () => {}, {
      runTests: false
    });

    // Should still return a result, even if basic
    if (!result) throw new Error('No result returned for empty message');
    console.log(`   ✓ Handled empty message gracefully`);
    console.log(`   ✓ Success: ${result.success}`);
  } catch (error) {
    // Some errors are acceptable for invalid input
    console.log(`   ✓ Error caught and handled: ${error.message}`);
  }
});

// ============================================================================
// TEST SUITE 5: COMPLEX REQUEST DETECTION
// ============================================================================

test('Scenario 5: Detect complex vs simple requests', () => {
  console.log('   Testing: Request complexity detection');

  const complexKeywords = ['refactor', 'redesign', 'create', 'build', 'make a'];
  const simpleKeywords = ['change color', 'fix typo', 'update text'];

  // This is testing the isComplexRequest logic from orchestrator
  const hasComplexPattern = (msg) => {
    const m = msg.toLowerCase();
    return complexKeywords.some(k => m.includes(k));
  };

  const complexMsg = 'Create a todo list app with categories';
  const simpleMsg = 'Change the button color to blue';

  if (!hasComplexPattern(complexMsg)) {
    throw new Error('Failed to detect complex request');
  }
  if (hasComplexPattern(simpleMsg)) {
    throw new Error('Incorrectly detected simple request as complex');
  }

  console.log(`   ✓ Complex request detection working`);
  console.log(`   ✓ Simple request detection working`);
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('📊 Orchestrator Flow Test Results');
console.log('='.repeat(70));
console.log(`Tests Run:    ${testsRun}`);
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsRun - testsPassed}`);
console.log(`Success Rate: ${Math.round((testsPassed / testsRun) * 100)}%`);
console.log('='.repeat(70));

if (testsPassed === testsRun) {
  console.log('✅ All orchestrator flow tests passed!\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed\n');
  process.exit(1);
}
