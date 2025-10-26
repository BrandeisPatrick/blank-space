/**
 * Individual Agent Tests
 * Tests each agent independently
 */

import { createPlan } from '../../src/services/agents/planner.js';
import { designUX } from '../../src/services/agents/designer.js';
import { writeCode } from '../../src/services/agents/codeWriter.js';
import { analyze, AnalysisMode } from '../../src/services/agents/analyzer.js';
import { quickDiagnose } from '../../src/services/agents/debugger.js';
import { validateCode, ValidationMode } from '../../src/services/agents/validator.js';

console.log('\n🧪 Starting Individual Agent Tests...\n');

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

/**
 * Sync test helper
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

// ============================================================================
// PLANNER AGENT TESTS
// ============================================================================

await testAsync('Planner: Create plan for new app', async () => {
  console.log('   Testing: Planner agent with "create" intent');

  const intent = 'create';
  const userMessage = 'Create a calculator app';
  const currentFiles = {};

  const plan = await createPlan(intent, userMessage, currentFiles, null);

  // Assertions
  if (!plan) throw new Error('No plan returned');
  if (!plan.summary) throw new Error('Plan missing summary');
  if (!Array.isArray(plan.steps)) throw new Error('Plan missing steps array');

  console.log(`   ✓ Plan generated successfully`);
  console.log(`   ✓ Summary: ${plan.summary}`);
  console.log(`   ✓ Steps: ${plan.steps?.length || 0}`);
});

await testAsync('Planner: Handle modification intent', async () => {
  console.log('   Testing: Planner agent with "modify" intent');

  const intent = 'modify';
  const userMessage = 'Add dark mode toggle';
  const currentFiles = {
    'App.jsx': '// Existing app code'
  };

  const plan = await createPlan(intent, userMessage, currentFiles, null);

  // Assertions
  if (!plan) throw new Error('No plan returned');
  console.log(`   ✓ Modification plan generated`);
  console.log(`   ✓ Has filesToModify: ${!!plan.filesToModify}`);
});

// ============================================================================
// DESIGNER AGENT TESTS
// ============================================================================

await testAsync('Designer: Generate UX design', async () => {
  console.log('   Testing: Designer agent UX generation');

  const userRequest = 'Create a modern todo app';
  const appIdentity = {
    name: 'TaskMaster',
    tagline: 'Organize your life effortlessly',
    tone: 'professional'
  };

  const design = await designUX({
    appIdentity,
    userRequest,
    mode: 'create_new'
  });

  // Assertions
  if (!design) throw new Error('No design returned');
  if (!design.designDirections || !Array.isArray(design.designDirections)) {
    throw new Error('Missing designDirections');
  }

  const direction = design.designDirections[0];
  if (!direction?.colorScheme) throw new Error('Missing colorScheme');
  if (!direction?.designStyle) throw new Error('Missing designStyle');

  console.log(`   ✓ Design generated successfully`);
  console.log(`   ✓ Design directions: ${design.designDirections.length}`);
  console.log(`   ✓ Theme: ${direction.colorScheme.theme}`);
  console.log(`   ✓ Aesthetic: ${direction.designStyle.aesthetic}`);
});

// ============================================================================
// CODEWRITER AGENT TESTS
// ============================================================================

await testAsync('CodeWriter: Generate new code', async () => {
  console.log('   Testing: CodeWriter in generate mode');

  const options = {
    mode: 'generate',
    filename: 'Counter.jsx',
    userMessage: 'Simple counter component',
    purpose: 'Counter with increment and decrement',
    features: ['increment button', 'decrement button', 'display count']
  };

  const code = await writeCode(options);

  // Assertions
  if (!code || typeof code !== 'string') {
    throw new Error('No code returned or invalid type');
  }
  if (code.length < 50) {
    throw new Error('Generated code seems too short');
  }
  if (!code.includes('export')) {
    throw new Error('Code missing export statement');
  }

  console.log(`   ✓ Code generated successfully`);
  console.log(`   ✓ Code length: ${code.length} characters`);
  console.log(`   ✓ Has export: true`);
});

await testAsync('CodeWriter: Modify existing code', async () => {
  console.log('   Testing: CodeWriter in modify mode');

  const currentCode = `
import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}
  `.trim();

  const options = {
    mode: 'modify',
    filename: 'Counter.jsx',
    currentCode,
    userMessage: 'Add a reset button'
  };

  const code = await writeCode(options);

  // Assertions
  if (!code || typeof code !== 'string') {
    throw new Error('No modified code returned');
  }
  if (!code.includes('export')) {
    throw new Error('Modified code missing export');
  }
  // Should still have the original functionality
  if (!code.includes('count')) {
    throw new Error('Modified code lost original state');
  }

  console.log(`   ✓ Code modified successfully`);
  console.log(`   ✓ Code length: ${code.length} characters`);
});

// ============================================================================
// ANALYZER AGENT TESTS
// ============================================================================

await testAsync('Analyzer: Analyze for modification', async () => {
  console.log('   Testing: Analyzer in modification mode');

  const userMessage = 'Change blue to red';
  const currentFiles = {
    'App.jsx': `
export default function App() {
  return (
    <div className="bg-blue-500 text-blue-600">
      <button className="bg-blue-700 hover:bg-blue-800">Click</button>
    </div>
  );
}
    `.trim()
  };

  const analysis = await analyze({
    userMessage,
    currentFiles,
    mode: AnalysisMode.MODIFICATION
  });

  // Assertions
  if (!analysis) throw new Error('No analysis returned');
  if (typeof analysis.needsAnalysis !== 'boolean') {
    throw new Error('Missing needsAnalysis field');
  }

  console.log(`   ✓ Analysis completed`);
  console.log(`   ✓ Needs analysis: ${analysis.needsAnalysis}`);
  console.log(`   ✓ Files to modify: ${analysis.filesToModify?.length || 0}`);
});

// ============================================================================
// DEBUGGER AGENT TESTS
// ============================================================================

test('Debugger: Quick diagnose browser error', () => {
  console.log('   Testing: Debugger quick diagnosis');

  const buggyCode = `
const App = () => {
  const [count, setCount] = useState(0);

  require('axios'); // Node.js require in browser!

  return <div>{count}</div>;
};
  `.trim();

  const diagnosis = quickDiagnose(buggyCode);

  // Assertions
  if (!diagnosis) throw new Error('No diagnosis returned');
  if (typeof diagnosis.issuesFound !== 'number') {
    throw new Error('Missing issuesFound count');
  }
  if (!Array.isArray(diagnosis.issues)) {
    throw new Error('Missing issues array');
  }

  // Should detect browser incompatibility
  const hasBrowserIssue = diagnosis.issues.some(
    issue => issue.type === 'browser-incompatible'
  );

  if (!hasBrowserIssue) {
    throw new Error('Failed to detect browser incompatibility (require)');
  }

  console.log(`   ✓ Diagnosis completed`);
  console.log(`   ✓ Issues found: ${diagnosis.issuesFound}`);
  console.log(`   ✓ Detected require() incompatibility: true`);
});

// ============================================================================
// VALIDATOR AGENT TESTS
// ============================================================================

test('Validator: Validate clean code', () => {
  console.log('   Testing: Validator with clean code');

  const cleanCode = `
import React from 'react';

export default function App() {
  return <div>Hello World</div>;
}
  `.trim();

  const result = validateCode({
    code: cleanCode,
    filename: 'App.jsx',
    mode: ValidationMode.FAST
  });

  // Assertions
  if (!result) throw new Error('No validation result');
  if (typeof result.valid !== 'boolean') {
    throw new Error('Missing valid field');
  }
  if (!Array.isArray(result.errors)) {
    throw new Error('Missing errors array');
  }

  if (!result.valid) {
    throw new Error(`Clean code marked as invalid: ${result.errors[0]?.message}`);
  }

  console.log(`   ✓ Validation completed`);
  console.log(`   ✓ Valid: ${result.valid}`);
  console.log(`   ✓ Errors: ${result.errors.length}`);
});

test('Validator: Detect syntax errors', () => {
  console.log('   Testing: Validator with syntax errors');

  const badCode = `
import React from 'react';

export default function App() {
  return <div>Hello{
  // Missing closing braces!
  `.trim();

  const result = validateCode({
    code: badCode,
    filename: 'App.jsx',
    mode: ValidationMode.SYNTAX_ONLY
  });

  // Assertions
  if (result.valid) {
    throw new Error('Failed to detect syntax errors');
  }
  if (result.errors.length === 0) {
    throw new Error('No errors reported for invalid syntax');
  }

  console.log(`   ✓ Syntax errors detected`);
  console.log(`   ✓ Errors found: ${result.errors.length}`);
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('📊 Individual Agent Test Results');
console.log('='.repeat(70));
console.log(`Tests Run:    ${testsRun}`);
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsRun - testsPassed}`);
console.log(`Success Rate: ${Math.round((testsPassed / testsRun) * 100)}%`);
console.log('='.repeat(70));

if (testsPassed === testsRun) {
  console.log('✅ All agent tests passed!\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed\n');
  process.exit(1);
}
