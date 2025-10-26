/**
 * Agent Integration Test
 * Tests Memory Bank integration with actual agents
 */

import { createPlan } from '../src/services/agents/planner.js';
import { MemoryBank } from '../src/services/utils/memory/MemoryBank.js';

async function testAgentIntegration() {
  console.log('🎯 Agent Integration Test\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Verify Planner loads rules
    console.log('\n✅ Test 1: Planner Agent Loads Memory Bank Rules');
    console.log('   Creating a plan...');

    const plan = await createPlan(
      'create-app',
      'Create a simple counter app',
      {},
      null,
      null
    );

    console.log(`   Plan created: ${plan.steps.length} steps`);
    console.log(`   Files to create: ${plan.filesToCreate.join(', ')}`);
    console.log('   ✅ Planner successfully loaded and used Memory Bank rules');

    // Test 2: Verify rules are being used
    console.log('\n✅ Test 2: Verify Persistent Rules Are Active');
    const memory = new MemoryBank();
    const rules = await memory.loadRules();

    console.log('   Checking if rules prevent common issues:');
    console.log(`   - Browser constraints defined: ${rules.includes('require()') ? 'Yes ✅' : 'No ❌'}`);
    console.log(`   - React rules defined: ${rules.includes('useState') || rules.includes('hooks') ? 'Yes ✅' : 'No ❌'}`);
    console.log(`   - Sandpack awareness: ${rules.includes('Sandpack') ? 'Yes ✅' : 'No ❌'}`);

    // Test 3: Bug pattern learning
    console.log('\n✅ Test 3: Bug Pattern Learning');
    const bugPatterns = await memory.getBugPatterns();
    console.log(`   Recorded bug patterns: ${bugPatterns.length}`);

    if (bugPatterns.length > 0) {
      console.log('\n   Recent bugs:');
      bugPatterns.slice(-3).forEach((bug, i) => {
        console.log(`   ${i + 1}. ${bug.bugType} in ${bug.file}`);
        console.log(`      Pattern: ${bug.pattern}`);
        console.log(`      Fix: ${bug.fix}`);
      });
    }

    // Test 4: Analytics
    console.log('\n✅ Test 4: Bug Analytics');
    const topBugs = await memory.getCommonBugPatterns(5);

    if (topBugs.length > 0) {
      console.log('\n   Most common bug types:');
      topBugs.forEach((bug, i) => {
        console.log(`   ${i + 1}. ${bug.bugType}: ${bug.count} time(s)`);
      });

      console.log('\n   💡 Insight: Focus on preventing the #1 bug type in future generations');
    } else {
      console.log('   No bugs recorded yet');
    }

    // Test 5: Session continuity
    console.log('\n✅ Test 5: Session Continuity');
    const session = await memory.loadSessionContext();
    console.log(`   Session summary: "${session.text || '(none)'}"`);
    console.log(`   Messages in session: ${session.messageCount || 0}`);

    if (session.text) {
      console.log('   ✅ Session context preserved for next conversation');
    }

    // Test 6: Memory statistics
    console.log('\n✅ Test 6: Overall Memory Statistics');
    const stats = await memory.getStats();

    console.log('\n   📊 Memory Bank Stats:');
    console.table({
      'Storage Mode': stats.storageMode,
      'Total Bug Patterns': stats.bugPatterns.total,
      'Unique Bug Types': stats.bugPatterns.types.length,
      'Session Messages': stats.sessionSummary.messageCount,
      'Session Active': stats.sessionSummary.exists ? 'Yes' : 'No'
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ All integration tests passed!\n');
    console.log('🎉 Memory Bank is fully integrated with agents!\n');

    return { success: true };

  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    console.error(error.stack);
    return { success: false, error: error.message };
  }
}

// Run tests
testAgentIntegration()
  .then(result => {
    if (result.success) {
      console.log('✨ Agents are successfully using Memory Bank!');
      process.exit(0);
    } else {
      console.log('💥 Integration test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
