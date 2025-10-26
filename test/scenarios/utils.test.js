/**
 * Utility Integration Tests
 * Tests colorExtractor, PromptLoader, MemoryBank
 */

import { extractColorScheme } from '../../src/services/utils/code/colorExtractor.js';
import { getPromptLoader } from '../../src/services/utils/prompts/PromptLoader.js';
import { MemoryBank } from '../../src/services/utils/memory/MemoryBank.js';

console.log('\n🧪 Starting Utility Integration Tests...\n');

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
// COLOR EXTRACTOR TESTS
// ============================================================================

test('colorExtractor: Extract basic Tailwind colors', () => {
  console.log('   Testing: Basic color extraction');

  const code = `
<div className="bg-blue-500 text-white border-gray-300">
  <button className="bg-blue-600 hover:bg-blue-700">Click</button>
</div>
  `.trim();

  const colors = extractColorScheme(code);

  // Assertions
  if (!colors) throw new Error('No colors extracted');
  if (!colors.backgrounds) throw new Error('Missing backgrounds');
  if (!colors.textColors) throw new Error('Missing textColors');
  if (!colors.borderColors) throw new Error('Missing borderColors');

  if (!colors.backgrounds.includes('bg-blue-')) {
    throw new Error('Failed to extract background colors');
  }

  console.log(`   ✓ Colors extracted successfully`);
  console.log(`   ✓ Backgrounds: ${colors.backgrounds}`);
  console.log(`   ✓ Text: ${colors.textColors}`);
  console.log(`   ✓ Borders: ${colors.borderColors}`);
});

test('colorExtractor: Extract gradient colors', () => {
  console.log('   Testing: Gradient color extraction');

  const code = `
<div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500">
  Gradient Background
</div>
  `.trim();

  const colors = extractColorScheme(code);

  // Assertions
  if (!colors) throw new Error('No colors extracted');
  if (!colors.gradients) throw new Error('Missing gradients');

  if (!colors.gradients.includes('from-purple') &&
      !colors.gradients.includes('via-pink') &&
      !colors.gradients.includes('to-red')) {
    throw new Error('Failed to extract gradient colors');
  }

  console.log(`   ✓ Gradient colors extracted`);
  console.log(`   ✓ Gradients: ${colors.gradients}`);
});

test('colorExtractor: Extract shadow and ring colors', () => {
  console.log('   Testing: Shadow and ring color extraction');

  const code = `
<div className="shadow-lg shadow-blue-500/50 ring-2 ring-green-500">
  Card with shadow and ring
</div>
  `.trim();

  const colors = extractColorScheme(code);

  // Assertions
  if (!colors) throw new Error('No colors extracted');
  if (!colors.shadows) throw new Error('Missing shadows');
  if (!colors.rings) throw new Error('Missing rings');

  console.log(`   ✓ Shadows extracted: ${colors.shadows}`);
  console.log(`   ✓ Rings extracted: ${colors.rings}`);
});

test('colorExtractor: Handle empty/null input', () => {
  console.log('   Testing: Null safety');

  const result1 = extractColorScheme(null);
  const result2 = extractColorScheme('');
  const result3 = extractColorScheme('no colors here');

  if (result1 !== null) throw new Error('Should return null for null input');
  if (result2 !== null) throw new Error('Should return null for empty string');
  if (result3 !== null) throw new Error('Should return null for code with no colors');

  console.log(`   ✓ Null input handled correctly`);
  console.log(`   ✓ Empty input handled correctly`);
  console.log(`   ✓ No colors input handled correctly`);
});

test('colorExtractor: Extract decoration and divide colors', () => {
  console.log('   Testing: New Tailwind pattern extraction');

  const code = `
<div className="decoration-red-500 divide-y divide-gray-300">
  <span>Text with decoration</span>
</div>
  `.trim();

  const colors = extractColorScheme(code);

  // Assertions
  if (!colors) throw new Error('No colors extracted');
  if (!colors.decorations) throw new Error('Missing decorations');
  if (!colors.divides) throw new Error('Missing divides');

  console.log(`   ✓ Decorations extracted: ${colors.decorations}`);
  console.log(`   ✓ Divides extracted: ${colors.divides}`);
});

// ============================================================================
// PROMPT LOADER TESTS
// ============================================================================

await testAsync('PromptLoader: Load planner prompt', async () => {
  console.log('   Testing: Load planner prompt from file');

  const loader = getPromptLoader();
  const prompt = await loader.loadPlannerPrompt({
    persistentRules: 'Test rules',
    filesContext: 'Test context',
    analysisContext: ''
  });

  // Assertions
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('No prompt returned');
  }
  if (prompt.length < 100) {
    throw new Error('Prompt seems too short');
  }

  console.log(`   ✓ Prompt loaded successfully`);
  console.log(`   ✓ Prompt length: ${prompt.length} characters`);
});

await testAsync('PromptLoader: Load codewriter-generate prompt', async () => {
  console.log('   Testing: Load codewriter-generate prompt');

  const loader = getPromptLoader();
  const prompt = await loader.loadCodeWriterGeneratePrompt({
    persistentRules: 'Test rules',
    filename: 'App.jsx',
    purpose: 'Test component'
  });

  // Assertions
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('No prompt returned');
  }

  console.log(`   ✓ CodeWriter generate prompt loaded`);
  console.log(`   ✓ Prompt length: ${prompt.length} characters`);
});

await testAsync('PromptLoader: Replace placeholders correctly', async () => {
  console.log('   Testing: Placeholder replacement');

  const loader = getPromptLoader();

  // Test direct placeholder replacement
  const template = 'Hello {{NAME}}, your score is {{SCORE}}';
  const result = loader.replacePlaceholders(template, {
    NAME: 'Alice',
    SCORE: '100'
  });

  if (!result.includes('Alice')) {
    throw new Error('Failed to replace NAME placeholder');
  }
  if (!result.includes('100')) {
    throw new Error('Failed to replace SCORE placeholder');
  }
  if (result.includes('{{')) {
    throw new Error('Placeholders not fully replaced');
  }

  console.log(`   ✓ Placeholders replaced correctly`);
  console.log(`   ✓ Result: ${result}`);
});

await testAsync('PromptLoader: Handle missing prompts gracefully', async () => {
  console.log('   Testing: Fallback for missing prompts');

  const loader = getPromptLoader();
  const fallback = 'Fallback prompt content';

  const prompt = await loader.loadPrompt('nonexistent-prompt-file', {}, fallback);

  if (prompt !== fallback) {
    throw new Error('Did not use fallback for missing prompt');
  }

  console.log(`   ✓ Fallback used for missing prompt`);
});

// ============================================================================
// MEMORY BANK TESTS
// ============================================================================

await testAsync('MemoryBank: Load global rules', async () => {
  console.log('   Testing: Load global rules from memory');

  const memory = new MemoryBank();
  const rules = await memory.loadRules();

  // Assertions
  if (typeof rules !== 'string') {
    throw new Error('Rules should be a string');
  }

  // Rules should exist (from .agent-memory/rules/global.md)
  console.log(`   ✓ Rules loaded`);
  console.log(`   ✓ Rules length: ${rules.length} characters`);
  console.log(`   ✓ Has content: ${rules.length > 0}`);
});

await testAsync('MemoryBank: Record and retrieve bug pattern', async () => {
  console.log('   Testing: Bug pattern recording');

  const memory = new MemoryBank();

  // Record a bug pattern
  await memory.recordBugPattern(
    'browser-incompatible',
    'require() syntax',
    'Convert to ES6 import',
    'TestFile.js'
  );

  // Retrieve bug patterns
  const patterns = await memory.getBugPatterns();

  // Assertions
  if (!Array.isArray(patterns)) {
    throw new Error('Bug patterns should be an array');
  }

  // Find our recorded pattern
  const recorded = patterns.find(p =>
    p.bugType === 'browser-incompatible' && p.pattern === 'require() syntax'
  );

  if (!recorded) {
    throw new Error('Failed to retrieve recorded bug pattern');
  }

  console.log(`   ✓ Bug pattern recorded`);
  console.log(`   ✓ Total patterns: ${patterns.length}`);
  console.log(`   ✓ Latest pattern: ${patterns[patterns.length - 1]?.bugType}`);
});

await testAsync('MemoryBank: Save and load session summary', async () => {
  console.log('   Testing: Session summary storage');

  const memory = new MemoryBank();

  const summary = {
    text: 'User asked to create a todo app',
    messageCount: 5,
    timestamp: new Date().toISOString()
  };

  // Save summary
  await memory.saveSessionSummary(summary);

  // Load session summary
  const loadedSummary = await memory.loadSessionContext();

  // Assertions
  if (!loadedSummary) {
    throw new Error('Session summary should be returned');
  }

  if (!loadedSummary.text) {
    throw new Error('Summary missing text field');
  }

  if (typeof loadedSummary.messageCount !== 'number') {
    throw new Error('Summary missing messageCount field');
  }

  if (loadedSummary.text !== summary.text) {
    throw new Error('Summary text mismatch');
  }

  console.log(`   ✓ Summary saved and loaded`);
  console.log(`   ✓ Summary text: ${loadedSummary.text.substring(0, 50)}...`);
  console.log(`   ✓ Message count: ${loadedSummary.messageCount}`);
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('📊 Utility Integration Test Results');
console.log('='.repeat(70));
console.log(`Tests Run:    ${testsRun}`);
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsRun - testsPassed}`);
console.log(`Success Rate: ${Math.round((testsPassed / testsRun) * 100)}%`);
console.log('='.repeat(70));

if (testsPassed === testsRun) {
  console.log('✅ All utility tests passed!\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed\n');
  process.exit(1);
}
