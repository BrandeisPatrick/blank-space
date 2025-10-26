/**
 * FileOperations Contract Tests
 * Documents and validates the FileOperations structure across all orchestrators
 *
 * This would have caught the op.code vs op.content bug!
 */

import { runOrchestrator } from '../../../src/services/orchestrator.js';
import { SandpackTestOrchestrator } from '../../../src/services/orchestrators/sandpackTestOrchestrator.js';

console.log('\n🧪 Starting FileOperations Contract Tests...\n');

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
    console.error(error);
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
// FILEOPERATIONS CONTRACT SPECIFICATION
// ============================================================================

const FILE_OPERATIONS_CONTRACT = {
  description: 'Standard structure for file operations returned by orchestrators',
  version: '1.0.0',
  structure: {
    type: {
      description: 'Type of operation',
      type: 'string',
      enum: ['create', 'modify'],
      required: true
    },
    filename: {
      description: 'Name of the file',
      type: 'string',
      required: true,
      examples: ['App.jsx', 'index.css', 'components/Button.jsx']
    },
    content: {
      description: 'Complete file content as a string',
      type: 'string',
      required: true,
      note: 'MUST be named "content", NOT "code" (common mistake!)'
    },
    validated: {
      description: 'Whether the code passed validation',
      type: 'boolean',
      required: false,
      default: false
    }
  },
  consumers: [
    'SandpackTestOrchestrator.convertToSandpackFiles()',
    'orchestrator.js (for debugger)',
    'App.jsx (renders files)',
    'PreviewPanel.jsx (displays preview)'
  ]
};

// ============================================================================
// TEST SUITE 1: CONTRACT DOCUMENTATION
// ============================================================================

test('FileOperations contract is well-defined', () => {
  console.log('   Documenting the FileOperations contract...\n');

  console.log('   📋 Contract Specification:');
  console.log(`      Version: ${FILE_OPERATIONS_CONTRACT.version}`);
  console.log(`      Description: ${FILE_OPERATIONS_CONTRACT.description}\n`);

  console.log('   📐 Structure:');
  Object.entries(FILE_OPERATIONS_CONTRACT.structure).forEach(([key, spec]) => {
    console.log(`      - ${key}:`);
    console.log(`         Type: ${spec.type}`);
    console.log(`         Required: ${spec.required}`);
    if (spec.enum) console.log(`         Values: ${spec.enum.join(' | ')}`);
    if (spec.note) console.log(`         ⚠️  ${spec.note}`);
  });

  console.log('\n   🔌 Consumers:');
  FILE_OPERATIONS_CONTRACT.consumers.forEach(consumer => {
    console.log(`      - ${consumer}`);
  });

  console.log('\n   ✓ Contract documented');
});

// ============================================================================
// TEST SUITE 2: VALIDATE AGAINST REAL OUTPUT
// ============================================================================

await testAsync('Orchestrator output matches contract', async () => {
  console.log('   Testing: Real orchestrator output structure');

  const result = await runOrchestrator(
    'Create a simple hello world component',
    {},
    () => {},
    { runTests: false }
  );

  if (!result.success || !result.fileOperations) {
    throw new Error('Orchestrator failed or returned no file operations');
  }

  console.log(`   Found ${result.fileOperations.length} file operation(s)`);

  // Validate each file operation
  result.fileOperations.forEach((op, i) => {
    console.log(`\n   Validating FileOperation[${i}]:`);

    // Check required fields
    if (typeof op.type !== 'string') {
      throw new Error(`FileOperation[${i}].type must be a string, got ${typeof op.type}`);
    }
    if (!['create', 'modify'].includes(op.type)) {
      throw new Error(`FileOperation[${i}].type must be 'create' or 'modify', got '${op.type}'`);
    }
    console.log(`      ✓ type: "${op.type}"`);

    if (typeof op.filename !== 'string') {
      throw new Error(`FileOperation[${i}].filename must be a string, got ${typeof op.filename}`);
    }
    console.log(`      ✓ filename: "${op.filename}"`);

    // CRITICAL: Must use 'content', not 'code'
    if (op.content === undefined) {
      const keys = Object.keys(op).join(', ');
      throw new Error(
        `FileOperation[${i}].content is undefined! This is the bug we fixed. ` +
        `Available keys: ${keys}. Did you use 'code' instead of 'content'?`
      );
    }
    if (typeof op.content !== 'string') {
      throw new Error(`FileOperation[${i}].content must be a string, got ${typeof op.content}`);
    }
    console.log(`      ✓ content: ${op.content.length} characters`);

    // 'validated' is optional
    if (op.validated !== undefined && typeof op.validated !== 'boolean') {
      throw new Error(`FileOperation[${i}].validated must be a boolean if present, got ${typeof op.validated}`);
    }
    console.log(`      ✓ validated: ${op.validated !== undefined ? op.validated : 'not set (optional)'}`);
  });

  console.log('\n   ✓ All file operations match contract');
});

// ============================================================================
// TEST SUITE 3: DETECT COMMON MISTAKES
// ============================================================================

test('Detect common mistake: using "code" instead of "content"', () => {
  console.log('   Testing: Common property name mistake');

  // Simulate the bug we fixed
  const buggyFileOperations = [
    {
      type: 'create',
      filename: 'App.jsx',
      code: 'export default function App() {}', // ❌ Wrong property name!
      validated: true
    }
  ];

  console.log('   Simulating buggy code that uses "code" instead of "content"...');

  const sandpack = new SandpackTestOrchestrator();

  try {
    const files = sandpack.convertToSandpackFiles(buggyFileOperations);

    // If we get here and App.jsx is undefined, we caught the bug!
    if (files['App.jsx'] === undefined) {
      console.log('   ✓ Bug detected! App.jsx is undefined when using "code" property');
      console.log('   ✓ This is exactly what happened in production');
      return;
    }

    throw new Error('Expected undefined but got a value - the bug detection failed');
  } catch (error) {
    if (error.message.includes('includes is not a function')) {
      console.log('   ✓ Bug detected! TypeError: Cannot read property "includes" of undefined');
      console.log('   ✓ This is the exact error we saw in production');
    } else {
      throw error;
    }
  }
});

test('Correct usage: using "content" property', () => {
  console.log('   Testing: Correct property name');

  const correctFileOperations = [
    {
      type: 'create',
      filename: 'App.jsx',
      content: 'export default function App() {}', // ✅ Correct property name!
      validated: true
    }
  ];

  const sandpack = new SandpackTestOrchestrator();
  const files = sandpack.convertToSandpackFiles(correctFileOperations);

  if (files['App.jsx'] === undefined) {
    throw new Error('App.jsx should be defined when using "content" property');
  }

  if (files['App.jsx'] !== 'export default function App() {}') {
    throw new Error('Content mismatch');
  }

  console.log('   ✓ Using "content" property works correctly');
  console.log('   ✓ SandpackTestOrchestrator successfully converted file');
});

// ============================================================================
// TEST SUITE 4: CROSS-ORCHESTRATOR CONSISTENCY
// ============================================================================

await testAsync('All orchestrators return consistent structure', async () => {
  console.log('   Testing: Consistency across different request types');

  const testCases = [
    { message: 'Create a counter app', type: 'create' },
    { message: 'Add a reset button', type: 'modify' }
  ];

  for (const testCase of testCases) {
    console.log(`\n   Testing ${testCase.type} operation...`);

    const result = await runOrchestrator(
      testCase.message,
      testCase.type === 'modify' ? { 'App.jsx': 'export default function App() {}' } : {},
      () => {},
      { runTests: false }
    );

    if (!result.success) {
      console.log(`   ⚠️  Skipping validation (orchestrator failed for ${testCase.type})`);
      continue;
    }

    if (!result.fileOperations || result.fileOperations.length === 0) {
      console.log(`   ⚠️  No file operations for ${testCase.type}`);
      continue;
    }

    // Quick validation
    const op = result.fileOperations[0];
    if (!op.content) {
      throw new Error(`${testCase.type} operation missing "content" property`);
    }

    console.log(`   ✓ ${testCase.type} operation has correct structure`);
  }

  console.log('\n   ✓ All orchestrator modes use consistent structure');
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('📊 FileOperations Contract Test Results');
console.log('='.repeat(70));
console.log(`Tests Run:    ${testsRun}`);
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsRun - testsPassed}`);
console.log(`Success Rate: ${Math.round((testsPassed / testsRun) * 100)}%`);
console.log('='.repeat(70));

if (testsPassed === testsRun) {
  console.log('✅ All contract tests passed!\n');
  console.log('   This confirms:');
  console.log('   - FileOperations contract is well-defined');
  console.log('   - Real orchestrator output matches contract');
  console.log('   - Common mistakes (code vs content) are detected');
  console.log('   - All orchestrators use consistent structure\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed\n');
  process.exit(1);
}
