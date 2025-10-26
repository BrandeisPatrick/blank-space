/**
 * Memory Bank Test Suite
 * Comprehensive tests for the Memory Bank system
 *
 * Run in browser console or Node.js
 */

import { MemoryBank } from '../src/services/utils/memory/MemoryBank.js';

/**
 * Test suite runner
 */
async function runMemoryBankTests() {
  console.log('🧪 Memory Bank Test Suite\n');
  console.log('='.repeat(60));

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Initialize Memory Bank
  await runTest('Initialize Memory Bank', async () => {
    const memory = new MemoryBank();
    if (!memory || !memory.storage) {
      throw new Error('MemoryBank failed to initialize');
    }
    console.log('✅ MemoryBank initialized successfully');
    console.log(`   Storage mode: ${memory.storage.isBrowser ? 'Browser (localStorage)' : 'Node.js (filesystem)'}`);
    return true;
  }, results);

  // Test 2: Load Global Rules
  await runTest('Load Global Rules', async () => {
    const memory = new MemoryBank();
    const globalRules = await memory.loadGlobalRules();

    if (!globalRules) {
      throw new Error('Failed to load global rules');
    }

    console.log('✅ Global rules loaded successfully');
    console.log(`   Length: ${globalRules.length} characters`);
    console.log(`   Contains browser constraints: ${globalRules.includes('require()') ? 'Yes' : 'No'}`);
    console.log(`   Contains React rules: ${globalRules.includes('useState') || globalRules.includes('hooks') ? 'Yes' : 'No'}`);

    return globalRules.length > 0;
  }, results);

  // Test 3: Load Project Rules
  await runTest('Load Project Rules', async () => {
    const memory = new MemoryBank();
    const projectRules = await memory.loadProjectRules();

    console.log('✅ Project rules loaded successfully');
    console.log(`   Length: ${projectRules.length} characters`);
    console.log(`   (Empty is OK - user can customize this)`);

    return true; // Empty is valid for project rules
  }, results);

  // Test 4: Load Combined Rules
  await runTest('Load Combined Rules', async () => {
    const memory = new MemoryBank();
    const allRules = await memory.loadRules();

    if (!allRules || allRules.length === 0) {
      throw new Error('Combined rules should not be empty');
    }

    console.log('✅ Combined rules loaded successfully');
    console.log(`   Total length: ${allRules.length} characters`);

    return allRules.length > 0;
  }, results);

  // Test 5: Record Bug Pattern
  await runTest('Record Bug Pattern', async () => {
    const memory = new MemoryBank();

    await memory.recordBugPattern(
      'browser-incompatible',
      'require() usage detected',
      'Convert to ES6 import statements',
      'App.jsx'
    );

    console.log('✅ Bug pattern recorded successfully');
    console.log('   Type: browser-incompatible');
    console.log('   File: App.jsx');

    return true;
  }, results);

  // Test 6: Record Multiple Bug Patterns
  await runTest('Record Multiple Bug Patterns', async () => {
    const memory = new MemoryBank();

    const testBugs = [
      {
        type: 'sandpack-navigation',
        pattern: '<a href="#"> causes white screen',
        fix: 'Replace with <button onClick={}>',
        file: 'components/Header.jsx'
      },
      {
        type: 'state-mutation',
        pattern: 'Direct array mutation (arr.push())',
        fix: 'Use spread operator: setArr([...arr, item])',
        file: 'components/TodoList.jsx'
      },
      {
        type: 'browser-incompatible',
        pattern: 'process.env usage',
        fix: 'Remove Node.js API usage',
        file: 'config.js'
      },
      {
        type: 'hooks-rules',
        pattern: 'Hook called conditionally',
        fix: 'Move hook to top level',
        file: 'components/Dashboard.jsx'
      }
    ];

    for (const bug of testBugs) {
      await memory.recordBugPattern(bug.type, bug.pattern, bug.fix, bug.file);
    }

    console.log(`✅ Recorded ${testBugs.length} bug patterns`);

    return true;
  }, results);

  // Test 7: Get All Bug Patterns
  await runTest('Get All Bug Patterns', async () => {
    const memory = new MemoryBank();
    const patterns = await memory.getBugPatterns();

    console.log(`✅ Retrieved ${patterns.length} bug patterns`);

    if (patterns.length > 0) {
      console.log('\n   Sample bug pattern:');
      const sample = patterns[0];
      console.log(`   - Type: ${sample.bugType}`);
      console.log(`   - Pattern: ${sample.pattern}`);
      console.log(`   - Fix: ${sample.fix}`);
      console.log(`   - File: ${sample.file}`);
      console.log(`   - Timestamp: ${sample.timestamp}`);
    }

    return patterns.length >= 5; // Should have at least 5 from our tests
  }, results);

  // Test 8: Get Bug Patterns by Type
  await runTest('Get Bug Patterns by Type', async () => {
    const memory = new MemoryBank();
    const browserBugs = await memory.getBugPatternsByType('browser-incompatible');

    console.log(`✅ Found ${browserBugs.length} browser-incompatible bugs`);

    return browserBugs.length >= 2; // We recorded 2 browser-incompatible bugs
  }, results);

  // Test 9: Get Common Bug Patterns
  await runTest('Get Common Bug Patterns', async () => {
    const memory = new MemoryBank();
    const topBugs = await memory.getCommonBugPatterns(5);

    console.log(`✅ Top bug patterns:`);
    topBugs.forEach((bug, i) => {
      console.log(`   ${i + 1}. ${bug.bugType} (${bug.count} occurrence${bug.count > 1 ? 's' : ''})`);
    });

    return topBugs.length > 0;
  }, results);

  // Test 10: Session Summary
  await runTest('Save Session Summary', async () => {
    const memory = new MemoryBank();

    await memory.saveSessionSummary({
      text: 'User created a todo app with 3 components. Fixed require() bug in App.jsx. Added dark mode toggle to Header component.',
      messageCount: 15
    });

    console.log('✅ Session summary saved');

    return true;
  }, results);

  // Test 11: Load Session Context
  await runTest('Load Session Context', async () => {
    const memory = new MemoryBank();
    const context = await memory.loadSessionContext();

    console.log('✅ Session context loaded');
    console.log(`   Summary: ${context.text?.substring(0, 50)}...`);
    console.log(`   Message count: ${context.messageCount}`);
    console.log(`   Timestamp: ${context.timestamp}`);

    return context.text && context.messageCount > 0;
  }, results);

  // Test 12: Get Memory Statistics
  await runTest('Get Memory Statistics', async () => {
    const memory = new MemoryBank();
    const stats = await memory.getStats();

    console.log('✅ Memory statistics:');
    console.log(`   Storage mode: ${stats.storageMode}`);
    console.log(`   Session summary exists: ${stats.sessionSummary.exists}`);
    console.log(`   Session messages: ${stats.sessionSummary.messageCount}`);
    console.log(`   Total bug patterns: ${stats.bugPatterns.total}`);
    console.log(`   Bug types: ${stats.bugPatterns.types.join(', ')}`);
    console.log(`   Most recent bugs: ${stats.bugPatterns.mostRecent.length}`);

    return stats.bugPatterns.total > 0;
  }, results);

  // Test 13: Export All Data
  await runTest('Export All Data', async () => {
    const memory = new MemoryBank();
    const backup = await memory.exportAll();

    console.log('✅ Data exported successfully');
    console.log(`   Rules included: ${backup.rules ? 'Yes' : 'No'}`);
    console.log(`   Context included: ${backup.context ? 'Yes' : 'No'}`);
    console.log(`   Learnings included: ${backup.learnings ? 'Yes' : 'No'}`);
    console.log(`   Bug patterns count: ${backup.learnings?.bugPatterns?.length || 0}`);

    return backup.rules && backup.context && backup.learnings;
  }, results);

  // Test 14: Clear Session Context
  await runTest('Clear Session Context', async () => {
    const memory = new MemoryBank();
    await memory.clearSessionContext();

    const context = await memory.loadSessionContext();

    console.log('✅ Session context cleared');
    console.log(`   Summary text: "${context.text || '(empty)'}"`);
    console.log(`   Message count: ${context.messageCount}`);

    return context.text === '' && context.messageCount === 0;
  }, results);

  // Test 15: Storage Persistence (Browser-specific)
  if (typeof window !== 'undefined') {
    await runTest('Verify localStorage Persistence', async () => {
      // Check if data is actually in localStorage
      const keys = Object.keys(localStorage).filter(k => k.startsWith('agent-memory:'));

      console.log('✅ localStorage persistence verified');
      console.log(`   Keys found: ${keys.length}`);
      keys.slice(0, 5).forEach(key => {
        console.log(`   - ${key}`);
      });

      return keys.length > 0;
    }, results);
  }

  // Print final results
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary\n');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Total: ${results.tests.length}`);
  console.log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`);

  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`   - ${t.name}: ${t.error}`);
      });
  }

  console.log('\n' + '='.repeat(60));

  return results;
}

/**
 * Helper: Run a single test
 */
async function runTest(name, testFn, results) {
  console.log(`\n🧪 Test: ${name}`);
  console.log('-'.repeat(60));

  try {
    const result = await testFn();

    if (result) {
      results.passed++;
      results.tests.push({ name, passed: true });
    } else {
      throw new Error('Test returned false');
    }
  } catch (error) {
    console.error(`❌ FAILED: ${error.message}`);
    results.failed++;
    results.tests.push({ name, passed: false, error: error.message });
  }
}

/**
 * Quick demo of Memory Bank features
 */
async function demoMemoryBank() {
  console.log('🎬 Memory Bank Demo\n');
  console.log('='.repeat(60));

  const memory = new MemoryBank();

  // 1. Show storage mode
  console.log('\n📦 Storage Mode:');
  console.log(`   ${memory.storage.isBrowser ? '🌐 Browser (localStorage)' : '💾 Node.js (filesystem)'}`);

  // 2. Load and show rules
  console.log('\n📚 Persistent Rules:');
  const rules = await memory.loadRules();
  console.log(`   Length: ${rules.length} characters`);
  console.log(`   Preview: ${rules.substring(0, 200)}...`);

  // 3. Record some bugs
  console.log('\n🐛 Recording Bug Patterns:');
  await memory.recordBugPattern(
    'browser-incompatible',
    'require() detected in generated code',
    'Convert to ES6 import',
    'App.jsx'
  );
  console.log('   ✅ Recorded: browser-incompatible bug');

  await memory.recordBugPattern(
    'sandpack-navigation',
    '<a href="#"> causing reload',
    'Use <button onClick={}> instead',
    'Header.jsx'
  );
  console.log('   ✅ Recorded: sandpack-navigation bug');

  // 4. Get statistics
  console.log('\n📊 Statistics:');
  const stats = await memory.getStats();
  console.table({
    'Total Bugs': stats.bugPatterns.total,
    'Bug Types': stats.bugPatterns.types.length,
    'Session Messages': stats.sessionSummary.messageCount,
    'Storage': stats.storageMode
  });

  // 5. Show top bugs
  console.log('\n🏆 Top Bug Patterns:');
  const topBugs = await memory.getCommonBugPatterns(5);
  topBugs.forEach((bug, i) => {
    console.log(`   ${i + 1}. ${bug.bugType}: ${bug.count} occurrence${bug.count > 1 ? 's' : ''}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✨ Demo complete!\n');
}

// Export functions
export { runMemoryBankTests, demoMemoryBank };

// Auto-run if executed directly
if (typeof window !== 'undefined') {
  console.log('💡 Memory Bank Test Suite loaded!');
  console.log('   Run tests: window.runMemoryBankTests()');
  console.log('   Run demo: window.demoMemoryBank()');

  // Make functions globally available
  window.runMemoryBankTests = runMemoryBankTests;
  window.demoMemoryBank = demoMemoryBank;
}
