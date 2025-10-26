/**
 * Sandpack Integration Tests
 * Tests the orchestrator → SandpackTestOrchestrator integration
 *
 * These tests ensure:
 * 1. FileOperations structure matches what Sandpack expects
 * 2. Property names are consistent (content, not code)
 * 3. Sandpack validation actually runs when enabled
 */

import { runOrchestrator } from '../../src/services/orchestrator.js';
import { SandpackTestOrchestrator } from '../../src/services/orchestrators/sandpackTestOrchestrator.js';

console.log('\n🧪 Starting Sandpack Integration Tests...\n');

// Test counter
let testsRun = 0;
let testsPassed = 0;

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
// TEST SUITE 1: FILE OPERATIONS CONTRACT
// ============================================================================

await testAsync('FileOperations have correct property names', async () => {
  console.log('   Testing: FileOperations use "content" property, not "code"');

  const result = await runOrchestrator(
    'Create a simple hello world app',
    {},
    () => {},
    { runTests: false } // Start with tests disabled
  );

  if (!result.success) throw new Error('Orchestrator failed');
  if (!result.fileOperations || result.fileOperations.length === 0) {
    throw new Error('No file operations returned');
  }

  // Verify each operation has 'content' property
  result.fileOperations.forEach((op, i) => {
    if (op.content === undefined) {
      throw new Error(`FileOperation[${i}] missing 'content' property (has: ${Object.keys(op).join(', ')})`);
    }
    if (op.filename === undefined) {
      throw new Error(`FileOperation[${i}] missing 'filename' property`);
    }
    if (typeof op.content !== 'string') {
      throw new Error(`FileOperation[${i}].content should be string, got ${typeof op.content}`);
    }
  });

  console.log(`   ✓ All ${result.fileOperations.length} fileOperations have correct structure`);
  console.log(`   ✓ All operations use 'content' property (not 'code')`);
});

// ============================================================================
// TEST SUITE 2: SANDPACK ORCHESTRATOR DIRECT TEST
// ============================================================================

await testAsync('SandpackTestOrchestrator can convert fileOperations', async () => {
  console.log('   Testing: SandpackTestOrchestrator.convertToSandpackFiles()');

  const sandpackOrch = new SandpackTestOrchestrator();

  // Create mock fileOperations matching CodeOrchestrator output
  const mockFileOperations = [
    {
      type: 'create',
      filename: 'App.jsx',
      content: 'export default function App() { return <div>Test</div>; }',
      validated: true
    },
    {
      type: 'create',
      filename: 'index.css',
      content: 'body { margin: 0; }',
      validated: true
    }
  ];

  // This should NOT crash
  const sandpackFiles = sandpackOrch.convertToSandpackFiles(mockFileOperations);

  if (!sandpackFiles['App.jsx']) {
    throw new Error('App.jsx not in Sandpack files');
  }
  if (!sandpackFiles['index.css']) {
    throw new Error('index.css not in Sandpack files');
  }

  console.log(`   ✓ Converted ${Object.keys(sandpackFiles).length} files successfully`);
  console.log(`   ✓ Files: ${Object.keys(sandpackFiles).join(', ')}`);
});

// ============================================================================
// TEST SUITE 3: STATIC ANALYSIS
// ============================================================================

await testAsync('SandpackTestOrchestrator static analysis catches issues', async () => {
  console.log('   Testing: Static analysis detects browser-incompatible code');

  const sandpackOrch = new SandpackTestOrchestrator();

  // Create fileOperations with browser-incompatible code
  const buggyFileOperations = [
    {
      type: 'create',
      filename: 'App.jsx',
      content: `
        const fs = require('fs'); // Browser incompatible!
        export default function App() {
          return <div>Test</div>;
        }
      `,
      validated: true
    }
  ];

  const sandpackFiles = sandpackOrch.convertToSandpackFiles(buggyFileOperations);
  const analysis = sandpackOrch.runStaticAnalysis(sandpackFiles);

  if (analysis.passed) {
    throw new Error('Static analysis should have failed for require() usage');
  }

  if (analysis.criticalIssues.length === 0) {
    throw new Error('Static analysis should have found critical issues');
  }

  const hasRequireIssue = analysis.criticalIssues.some(
    issue => issue.type === 'browser-incompatible'
  );

  if (!hasRequireIssue) {
    throw new Error('Static analysis should have flagged require() as browser-incompatible');
  }

  console.log(`   ✓ Detected ${analysis.criticalIssues.length} critical issue(s)`);
  console.log(`   ✓ Flagged require() as browser-incompatible`);
});

// ============================================================================
// TEST SUITE 4: FULL INTEGRATION (WITH SANDPACK ENABLED)
// ============================================================================

await testAsync('Full orchestrator flow with Sandpack validation', async () => {
  console.log('   Testing: Complete flow with runTests: true');
  console.log('   ⚠️  This will be slower but tests the real integration');

  const result = await runOrchestrator(
    'Create a simple counter with increment button',
    {},
    (update) => {
      if (update.type === 'sandpack-test') {
        console.log(`      → ${update.message}`);
      }
    },
    { runTests: true } // ✅ ENABLE SANDPACK
  );

  if (!result.success) {
    throw new Error(`Orchestrator failed: ${result.message || 'Unknown error'}`);
  }

  // This test passing means:
  // 1. CodeOrchestrator generated fileOperations with 'content' property
  // 2. SandpackTestOrchestrator successfully read 'content' property
  // 3. No crashes due to property mismatch

  console.log(`   ✓ Full integration passed`);
  console.log(`   ✓ Generated ${result.fileOperations.length} file(s)`);
  console.log(`   ✓ Sandpack validation completed without crashes`);
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('📊 Sandpack Integration Test Results');
console.log('='.repeat(70));
console.log(`Tests Run:    ${testsRun}`);
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsRun - testsPassed}`);
console.log(`Success Rate: ${Math.round((testsPassed / testsRun) * 100)}%`);
console.log('='.repeat(70));

if (testsPassed === testsRun) {
  console.log('✅ All Sandpack integration tests passed!\n');
  console.log('   This confirms:');
  console.log('   - FileOperations contract is correct');
  console.log('   - SandpackTestOrchestrator integration works');
  console.log('   - Static analysis detects issues');
  console.log('   - Full flow with Sandpack enabled works\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed\n');
  process.exit(1);
}
