/**
 * Simple End-to-End Test: Create App
 * Tests the entire orchestrator system with conversation logging
 */

import { runOrchestrator } from '../../src/services/orchestrator.js';
import { createLogger } from '../../src/services/utils/llm/conversationLogger.js';
import { createTracker } from '../../src/services/utils/testing/performanceTracker.js';

console.log('\n🧪 Simple End-to-End Test: Create Todo App\n');
console.log('='.repeat(70));

// Setup
const userMessage = "Create a simple todo app";
const currentFiles = {}; // Empty - creating from scratch

// Create logger and performance tracker
const logger = createLogger('orchestrator', {
  enabled: true,
  logLevel: 'INFO',
  sessionId: `test-${Date.now()}`
});

const tracker = createTracker('Create Todo App Test');

console.log('\n📋 Test Setup:');
console.log(`  Request: "${userMessage}"`);
console.log(`  Session ID: ${logger.sessionId}`);
console.log(`  Logging: ${logger.enabled ? 'Enabled' : 'Disabled'}`);

try {
  console.log('\n🚀 Running orchestrator...\n');

  // Run orchestrator
  const result = await runOrchestrator(userMessage, currentFiles, (update) => {
    console.log(`  [${update.type}] ${update.message}`);
  });

  console.log('\n✅ Orchestrator completed successfully!\n');

  // Check results
  console.log('📊 Results:');
  console.log(`  Success: ${result.success}`);
  console.log(`  Files generated: ${result.fileOperations?.length || 0}`);
  console.log(`  Operation: ${result.metadata?.operation}`);
  console.log(`  Planning used: ${result.metadata?.needsPlanning}`);

  if (result.fileOperations && result.fileOperations.length > 0) {
    console.log('\n📄 Generated Files:');
    result.fileOperations.forEach(op => {
      console.log(`  - ${op.filename} (${op.type})`);
      console.log(`    Size: ${op.content?.length || 0} characters`);
      console.log(`    Validated: ${op.validated ? '✓' : '✗'}`);
    });
  }

  // Print logger summary
  console.log('\n');
  logger.printSummary();

  // Save conversation log
  const logPath = await logger.saveToFile();
  if (logPath) {
    console.log(`💾 Conversation log saved: ${logPath}`);
  }

  // Print performance report
  tracker.printReport();

  // Assertions
  const passed = [];
  const failed = [];

  if (result.success) {
    passed.push('✓ Orchestrator succeeded');
  } else {
    failed.push('✗ Orchestrator failed');
  }

  if (result.fileOperations && result.fileOperations.length >= 2) {
    passed.push(`✓ Generated ${result.fileOperations.length} files (expected >= 2)`);
  } else {
    failed.push(`✗ Only generated ${result.fileOperations?.length || 0} files (expected >= 2)`);
  }

  const hasAppJsx = result.fileOperations?.some(op => op.filename === 'App.jsx');
  if (hasAppJsx) {
    passed.push('✓ App.jsx created');
  } else {
    failed.push('✗ App.jsx not created');
  }

  // Check if files have content
  const hasContent = result.fileOperations?.every(op => op.content && op.content.length > 100);
  if (hasContent) {
    passed.push('✓ All files have substantial content (>100 chars)');
  } else {
    failed.push('✗ Some files are too small or empty');
  }

  // Print test results
  console.log('\n' + '='.repeat(70));
  console.log('🧪 Test Results:');
  console.log('='.repeat(70));

  if (passed.length > 0) {
    console.log('\n✅ Passed:');
    passed.forEach(p => console.log(`  ${p}`));
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed:');
    failed.forEach(f => console.log(`  ${f}`));
  }

  const totalTests = passed.length + failed.length;
  const passRate = ((passed.length / totalTests) * 100).toFixed(0);

  console.log(`\n📊 Summary: ${passed.length}/${totalTests} passed (${passRate}%)`);
  console.log('='.repeat(70) + '\n');

  // Exit with appropriate code
  if (failed.length > 0) {
    console.error('❌ Test failed\n');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!\n');
    process.exit(0);
  }

} catch (error) {
  console.error('\n❌ Test Error:', error.message);
  console.error('\nStack trace:');
  console.error(error.stack);

  // Try to save logs even on error
  try {
    await logger.saveToFile();
  } catch (logError) {
    console.error('Failed to save logs:', logError);
  }

  process.exit(1);
}
