/**
 * Memory Bank Browser Environment Tests
 * Tests MemoryBank behavior in browser mode (localStorage + fetch)
 *
 * This would have caught the designer.md prompt loading bug!
 */

import { JSDOM } from 'jsdom';
import { MemoryBank } from '../../src/services/utils/memory/MemoryBank.js';

console.log('\n🧪 Starting Browser Environment Tests for MemoryBank...\n');

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
 * Setup browser environment
 */
function setupBrowserEnvironment() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost:3000',
    pretendToBeVisual: true
  });

  // Make global browser objects available
  global.window = dom.window;
  global.document = dom.window.document;
  global.localStorage = dom.window.localStorage;
  global.sessionStorage = dom.window.sessionStorage;

  console.log('✓ Browser environment setup (via jsdom)');
  console.log(`  - window: ${typeof global.window !== 'undefined'}`);
  console.log(`  - localStorage: ${typeof global.localStorage !== 'undefined'}`);
}

/**
 * Teardown browser environment
 */
function teardownBrowserEnvironment() {
  delete global.window;
  delete global.document;
  delete global.localStorage;
  delete global.sessionStorage;
  delete global.fetch;
}

// ============================================================================
// TEST SUITE 1: BROWSER MODE DETECTION
// ============================================================================

await testAsync('MemoryBank detects browser environment', async () => {
  console.log('   Testing: Browser mode detection');

  setupBrowserEnvironment();

  const memory = new MemoryBank();

  if (!memory.storage.isBrowser) {
    throw new Error('MemoryBank should detect browser environment');
  }

  console.log('   ✓ Detected browser environment correctly');

  teardownBrowserEnvironment();
});

// ============================================================================
// TEST SUITE 2: LOCALSTORAGE OPERATIONS
// ============================================================================

await testAsync('MemoryBank can write to localStorage', async () => {
  console.log('   Testing: localStorage write operations');

  setupBrowserEnvironment();

  const memory = new MemoryBank();

  // Write test data
  await memory.storage.write('test/data.txt', 'Hello from localStorage');

  // Verify it's in localStorage
  const key = memory.storage.storagePrefix + 'test/data.txt';
  const value = global.localStorage.getItem(key);

  if (!value) {
    throw new Error('Data not found in localStorage');
  }

  if (value !== 'Hello from localStorage') {
    throw new Error(`Expected "Hello from localStorage", got "${value}"`);
  }

  console.log('   ✓ Successfully wrote to localStorage');

  teardownBrowserEnvironment();
});

await testAsync('MemoryBank can read from localStorage', async () => {
  console.log('   Testing: localStorage read operations');

  setupBrowserEnvironment();

  const memory = new MemoryBank();

  // Pre-populate localStorage
  const key = memory.storage.storagePrefix + 'prompts/test.md';
  global.localStorage.setItem(key, 'Test prompt content');

  // Read it back
  const content = await memory.storage.read('prompts/test.md', 'fallback');

  if (content === 'fallback') {
    throw new Error('Should have read from localStorage, not used fallback');
  }

  if (content !== 'Test prompt content') {
    throw new Error(`Expected "Test prompt content", got "${content}"`);
  }

  console.log('   ✓ Successfully read from localStorage');

  teardownBrowserEnvironment();
});

// ============================================================================
// TEST SUITE 3: FETCH FALLBACK
// ============================================================================

await testAsync('MemoryBank falls back to fetch when localStorage is empty', async () => {
  console.log('   Testing: Fetch fallback mechanism');

  setupBrowserEnvironment();

  // Mock fetch
  global.fetch = async (url) => {
    if (url === '/.agent-memory/prompts/designer.md') {
      return {
        ok: true,
        text: async () => 'Designer prompt from server'
      };
    }
    return { ok: false };
  };

  const memory = new MemoryBank();

  // localStorage is empty, should fetch
  const content = await memory.storage.read('prompts/designer.md', 'fallback');

  if (content === 'fallback') {
    throw new Error('Should have fetched from server, not used fallback');
  }

  if (content !== 'Designer prompt from server') {
    throw new Error(`Expected "Designer prompt from server", got "${content}"`);
  }

  console.log('   ✓ Successfully fetched from server');

  teardownBrowserEnvironment();
});

await testAsync('MemoryBank caches fetched content in localStorage', async () => {
  console.log('   Testing: Fetch result caching');

  setupBrowserEnvironment();

  let fetchCalled = 0;
  global.fetch = async (url) => {
    fetchCalled++;
    if (url === '/.agent-memory/prompts/planner.md') {
      return {
        ok: true,
        text: async () => 'Planner prompt content'
      };
    }
    return { ok: false };
  };

  const memory = new MemoryBank();

  // First read - should fetch
  const content1 = await memory.storage.read('prompts/planner.md', 'fallback');

  if (fetchCalled !== 1) {
    throw new Error(`Expected 1 fetch call, got ${fetchCalled}`);
  }

  // Second read - should use cache
  const content2 = await memory.storage.read('prompts/planner.md', 'fallback');

  if (fetchCalled !== 1) {
    throw new Error(`Expected 1 fetch call (cached), got ${fetchCalled}`);
  }

  if (content1 !== content2) {
    throw new Error('Cached content should match fetched content');
  }

  console.log('   ✓ Cached fetched content in localStorage');
  console.log(`   ✓ Fetch called only once, subsequent reads used cache`);

  teardownBrowserEnvironment();
});

await testAsync('MemoryBank uses fallback when fetch fails', async () => {
  console.log('   Testing: Fallback when fetch fails');

  setupBrowserEnvironment();

  // Mock failing fetch
  global.fetch = async (url) => {
    return { ok: false, status: 404 };
  };

  const memory = new MemoryBank();

  const content = await memory.storage.read('prompts/missing.md', 'FALLBACK_CONTENT');

  if (content !== 'FALLBACK_CONTENT') {
    throw new Error(`Expected fallback, got "${content}"`);
  }

  console.log('   ✓ Used fallback when fetch failed');

  teardownBrowserEnvironment();
});

// ============================================================================
// TEST SUITE 4: REAL-WORLD SCENARIO (DESIGNER BUG)
// ============================================================================

await testAsync('Simulate the designer.md loading bug scenario', async () => {
  console.log('   Testing: Exact scenario that caused the designer bug');

  setupBrowserEnvironment();

  // Mock fetch to return actual designer prompt
  global.fetch = async (url) => {
    if (url === '/.agent-memory/prompts/designer.md') {
      return {
        ok: true,
        text: async () => `# Designer Agent System Prompt

You are a world-class UX/UI designer.

## RESPONSE FORMAT:

Respond ONLY with JSON in this format:

\`\`\`json
{
  "designDirections": [
    {
      "directionName": "Modern Design",
      "appIdentity": { "name": "App", "tagline": "Tagline", "tone": "professional" }
    }
  ]
}
\`\`\``
      };
    }
    return { ok: false };
  };

  const memory = new MemoryBank();

  // Try to load designer prompt (like the real code does)
  const prompt = await memory.storage.read('prompts/designer.md', '');

  // Should NOT be empty
  if (prompt === '') {
    throw new Error('Designer prompt should not be empty! This is the bug.');
  }

  // Should contain JSON format instructions
  if (!prompt.includes('Respond ONLY with JSON')) {
    throw new Error('Designer prompt missing JSON instructions');
  }

  console.log('   ✓ Designer prompt loaded successfully via fetch');
  console.log('   ✓ Contains JSON format instructions');
  console.log('   ✓ This bug would have been caught!');

  teardownBrowserEnvironment();
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('📊 Browser Environment Test Results');
console.log('='.repeat(70));
console.log(`Tests Run:    ${testsRun}`);
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsRun - testsPassed}`);
console.log(`Success Rate: ${Math.round((testsPassed / testsRun) * 100)}%`);
console.log('='.repeat(70));

if (testsPassed === testsRun) {
  console.log('✅ All browser environment tests passed!\n');
  console.log('   This confirms:');
  console.log('   - Browser mode detection works');
  console.log('   - localStorage operations work');
  console.log('   - Fetch fallback mechanism works');
  console.log('   - Caching works correctly');
  console.log('   - The designer.md bug would have been caught!\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed\n');
  process.exit(1);
}
