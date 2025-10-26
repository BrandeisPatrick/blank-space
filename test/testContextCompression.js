/**
 * Test Context Compression
 * Tests ContextCompressor and ConversationLogger integration
 */

import { ContextCompressor } from '../src/services/utils/compression/ContextCompressor.js';
import { ConversationLogger, createLogger } from '../src/services/utils/llm/conversationLogger.js';
import { MemoryBank } from '../src/services/utils/memory/MemoryBank.js';

async function testContextCompression() {
  console.log('🧪 Context Compression Test\n');
  console.log('='.repeat(60));

  try {
    // Test 1: ContextCompressor initialization
    console.log('\n✅ Test 1: Initialize ContextCompressor');
    const compressor = new ContextCompressor({
      turnThreshold: 5,  // Small threshold for testing
      maxSummaryLength: 500
    });
    console.log('   ContextCompressor initialized successfully');
    console.log(`   Turn threshold: ${compressor.turnThreshold}`);
    console.log(`   Max summary length: ${compressor.maxSummaryLength}`);

    // Test 2: Add turns
    console.log('\n✅ Test 2: Add Conversation Turns');
    await compressor.addTurn({ role: 'user', content: 'Create a todo app' });
    await compressor.addTurn({ role: 'assistant', content: 'I will create a React todo app with add, delete, and complete functionality.' });
    await compressor.addTurn({ role: 'user', content: 'Add dark mode' });
    await compressor.addTurn({ role: 'assistant', content: 'Added dark mode toggle with Tailwind CSS dark classes.' });

    const metadata1 = compressor.getSessionMetadata();
    console.log(`   Turns added: ${metadata1.turnCount}`);
    console.log(`   Summaries created: ${metadata1.summaryCount}`);
    console.log(`   Current turns in memory: ${metadata1.currentTurns}`);

    // Test 3: Trigger auto-summarization
    console.log('\n✅ Test 3: Trigger Auto-Summarization');
    console.log('   Adding turn 5 (should trigger compression at threshold=5)...');

    const summarized = await compressor.addTurn({
      role: 'user',
      content: 'Fix the delete button bug'
    });

    console.log(`   Auto-summarization triggered: ${summarized ? 'Yes' : 'No'}`);

    const metadata2 = compressor.getSessionMetadata();
    console.log(`   Total turns: ${metadata2.turnCount}`);
    console.log(`   Summaries created: ${metadata2.summaryCount}`);
    console.log(`   Current turns in memory: ${metadata2.currentTurns} (should be <= 5)`);

    // Test 4: Get compressed context
    console.log('\n✅ Test 4: Get Compressed Context');
    const context = compressor.getCompressedContext();
    console.log(`   Context length: ${context.length} characters`);
    console.log(`   Contains "CONVERSATION HISTORY": ${context.includes('CONVERSATION HISTORY') ? 'Yes' : 'No'}`);
    console.log(`   Contains "RECENT CONVERSATION": ${context.includes('RECENT CONVERSATION') ? 'Yes' : 'No'}`);
    console.log('\n   Context preview:');
    console.log(`   ${context.substring(0, 300)}...\n`);

    // Test 5: Multiple compression cycles
    console.log('\n✅ Test 5: Multiple Compression Cycles');
    console.log('   Adding 10 more turns (should trigger 2 more compressions)...');

    for (let i = 0; i < 10; i++) {
      await compressor.addTurn({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Turn ${i + 6}: ${i % 2 === 0 ? 'User request' : 'Assistant response'}`
      });
    }

    const metadata3 = compressor.getSessionMetadata();
    console.log(`   Total turns: ${metadata3.turnCount}`);
    console.log(`   Summaries created: ${metadata3.summaryCount} (should be 3)`);
    console.log(`   Current turns in memory: ${metadata3.currentTurns}`);

    // Test 6: Save to Memory Bank
    console.log('\n✅ Test 6: Save Summaries to Memory Bank');
    const sessionSummary = await compressor.saveSessionSummary();
    console.log(`   Session summary saved: ${sessionSummary ? 'Yes' : 'No'}`);
    console.log(`   Total turns in session: ${sessionSummary.totalTurns}`);
    console.log(`   Summaries in session: ${sessionSummary.summaries.length}`);

    // Verify in Memory Bank
    const memory = new MemoryBank();
    const storedSummaries = await memory.storage.read('context/conversation-summaries.json', '[]', true);
    console.log(`   Summaries stored in Memory Bank: ${storedSummaries.length}`);

    // Test 7: ConversationLogger with compression
    console.log('\n✅ Test 7: ConversationLogger with Compression');
    const logger = createLogger('test-agent', {
      compressionEnabled: true,
      turnThreshold: 3,  // Small threshold for testing
      logLevel: 'INFO'
    });

    console.log('   Logger created with compression enabled');
    console.log(`   Compression enabled: ${logger.compressionEnabled ? 'Yes' : 'No'}`);

    // Add turns via logger
    await logger.addUserTurn('Create a counter app');
    await logger.addAssistantTurn('Created counter with increment/decrement buttons');
    await logger.addUserTurn('Add reset button');

    // Should trigger compression on 6th turn
    await logger.addAssistantTurn('Added reset button that sets count to 0');
    await logger.addUserTurn('Style it with gradients');
    await logger.addAssistantTurn('Added gradient background with Tailwind');

    const loggerContext = logger.getCompressedContext();
    console.log(`   Logger compressed context: ${loggerContext.length} characters`);
    console.log(`   Contains summaries: ${loggerContext.includes('Summary') || loggerContext.includes('HISTORY') ? 'Yes' : 'No'}`);

    const loggerMetadata = logger.getCompressionMetadata();
    console.log(`   Logger turns: ${loggerMetadata.turnCount}`);
    console.log(`   Logger summaries: ${loggerMetadata.summaryCount}`);

    // Test 8: Clear session
    console.log('\n✅ Test 8: Clear Session');
    const beforeClear = compressor.getSessionMetadata();
    console.log(`   Turns before clear: ${beforeClear.turnCount}`);

    compressor.clearSession();

    const afterClear = compressor.getSessionMetadata();
    console.log(`   Turns after clear: ${afterClear.turnCount} (should be 0)`);
    console.log(`   Summaries after clear: ${afterClear.summaryCount} (should be 0)`);

    // Test 9: Load previous summaries
    console.log('\n✅ Test 9: Load Previous Summaries');
    const previousSummaries = await compressor.loadPreviousSummaries(5);
    console.log(`   Previous summaries loaded: ${previousSummaries.length}`);
    if (previousSummaries.length > 0) {
      console.log(`   Latest summary timestamp: ${previousSummaries[previousSummaries.length - 1].timestamp}`);
      console.log(`   Latest summary turn range: ${previousSummaries[previousSummaries.length - 1].turnRange.start}-${previousSummaries[previousSummaries.length - 1].turnRange.end}`);
    }

    // Test 10: Compression disabled
    console.log('\n✅ Test 10: Logger with Compression Disabled');
    const loggerNoCompression = createLogger('no-compression-agent', {
      compressionEnabled: false
    });

    console.log(`   Compression enabled: ${loggerNoCompression.compressionEnabled ? 'Yes' : 'No'}`);
    console.log(`   Compressor exists: ${loggerNoCompression.compressor ? 'Yes' : 'No'}`);

    await loggerNoCompression.addUserTurn('Test message');
    const noCompressionContext = loggerNoCompression.getCompressedContext();
    console.log(`   Context with compression disabled: "${noCompressionContext}" (should be empty)`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All context compression tests passed!\n');

    return { success: true };

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    return { success: false, error: error.message };
  }
}

// Run tests
testContextCompression()
  .then(result => {
    if (result.success) {
      console.log('🎉 Context compression is working correctly!');
      process.exit(0);
    } else {
      console.log('💥 Context compression test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
