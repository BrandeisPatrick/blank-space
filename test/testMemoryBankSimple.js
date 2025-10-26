/**
 * Simple Memory Bank Test
 * Tests Memory Bank in Node.js environment
 */

import { MemoryBank } from '../src/services/utils/memory/MemoryBank.js';

async function testMemoryBank() {
  console.log('🧪 Memory Bank Test Suite\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Initialize
    console.log('\n✅ Test 1: Initialize Memory Bank');
    const memory = new MemoryBank();
    console.log(`   Storage mode: ${memory.storage.isBrowser ? 'Browser' : 'Node.js'}`);

    // Test 2: Load Global Rules
    console.log('\n✅ Test 2: Load Global Rules');
    const globalRules = await memory.loadGlobalRules();
    console.log(`   Loaded ${globalRules.length} characters`);
    console.log(`   Contains "require()": ${globalRules.includes('require()') ? 'Yes' : 'No'}`);

    // Test 3: Load All Rules
    console.log('\n✅ Test 3: Load All Rules');
    const allRules = await memory.loadRules();
    console.log(`   Total: ${allRules.length} characters`);

    // Test 4: Record Bug Pattern
    console.log('\n✅ Test 4: Record Bug Pattern');
    await memory.recordBugPattern(
      'browser-incompatible',
      'require() usage detected',
      'Convert to ES6 import',
      'App.jsx'
    );
    console.log('   Recorded: browser-incompatible bug');

    // Test 5: Record More Bugs
    console.log('\n✅ Test 5: Record Multiple Bug Patterns');
    const testBugs = [
      ['sandpack-navigation', '<a href="#"> issue', 'Use <button>', 'Header.jsx'],
      ['state-mutation', 'arr.push() detected', 'Use spread operator', 'TodoList.jsx'],
      ['browser-incompatible', 'process.env usage', 'Remove Node.js API', 'config.js']
    ];

    for (const [type, pattern, fix, file] of testBugs) {
      await memory.recordBugPattern(type, pattern, fix, file);
    }
    console.log(`   Recorded ${testBugs.length} more bugs`);

    // Test 6: Get All Patterns
    console.log('\n✅ Test 6: Get All Bug Patterns');
    const patterns = await memory.getBugPatterns();
    console.log(`   Total patterns: ${patterns.length}`);

    if (patterns.length > 0) {
      console.log('\n   Sample pattern:');
      const sample = patterns[0];
      console.log(`   - Type: ${sample.bugType}`);
      console.log(`   - Pattern: ${sample.pattern}`);
      console.log(`   - Fix: ${sample.fix}`);
      console.log(`   - File: ${sample.file}`);
    }

    // Test 7: Get Common Bugs
    console.log('\n✅ Test 7: Get Common Bug Patterns');
    const topBugs = await memory.getCommonBugPatterns(5);
    console.log('\n   Top bugs:');
    topBugs.forEach((bug, i) => {
      console.log(`   ${i + 1}. ${bug.bugType}: ${bug.count} occurrence(s)`);
    });

    // Test 8: Session Summary
    console.log('\n✅ Test 8: Save Session Summary');
    await memory.saveSessionSummary({
      text: 'User created todo app. Fixed 4 bugs. Added dark mode.',
      messageCount: 12
    });
    console.log('   Session summary saved');

    // Test 9: Load Session
    console.log('\n✅ Test 9: Load Session Context');
    const session = await memory.loadSessionContext();
    console.log(`   Summary: ${session.text}`);
    console.log(`   Messages: ${session.messageCount}`);

    // Test 10: Statistics
    console.log('\n✅ Test 10: Get Statistics');
    const stats = await memory.getStats();
    console.log(`   Storage: ${stats.storageMode}`);
    console.log(`   Total bugs: ${stats.bugPatterns.total}`);
    console.log(`   Bug types: ${stats.bugPatterns.types.join(', ')}`);
    console.log(`   Session messages: ${stats.sessionSummary.messageCount}`);

    // Test 11: Export
    console.log('\n✅ Test 11: Export All Data');
    const backup = await memory.exportAll();
    console.log(`   Rules length: ${backup.rules.global.length}`);
    console.log(`   Bug patterns: ${backup.learnings.bugPatterns.length}`);
    console.log(`   Export timestamp: ${backup.exportedAt}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed!\n');

    return { success: true, stats };

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    return { success: false, error: error.message };
  }
}

// Run tests
testMemoryBank()
  .then(result => {
    if (result.success) {
      console.log('🎉 Memory Bank is working correctly!');
      process.exit(0);
    } else {
      console.log('💥 Memory Bank test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
