/**
 * Comprehensive Test Runner for New Tests
 * Runs all newly created tests that would have caught the recent bugs
 */

import { spawn } from 'child_process';

console.log('\n' + '█'.repeat(80));
console.log('█'.repeat(80));
console.log('   COMPREHENSIVE TEST SUITE - Bug Prevention Tests');
console.log('█'.repeat(80));
console.log('█'.repeat(80));

console.log('\n📝 This test suite includes tests that would have caught:');
console.log('   1. Designer JSON parsing error (browser localStorage issue)');
console.log('   2. SandpackTestOrchestrator crash (op.code vs op.content)');
console.log('\n' + '='.repeat(80) + '\n');

// Test suites to run
const testSuites = [
  {
    name: 'Sandpack Integration Tests',
    script: 'test/scenarios/sandpack-integration.test.js',
    description: 'Tests FileOperations contract and Sandpack integration'
  },
  {
    name: 'Browser Environment Tests',
    script: 'test/browser/memory-bank-browser.test.js',
    description: 'Tests MemoryBank browser mode (localStorage + fetch)'
  },
  {
    name: 'FileOperations Contract Tests',
    script: 'test/unit/contracts/file-operations.test.js',
    description: 'Documents and validates FileOperations structure'
  }
];

// Track results
const results = {
  total: testSuites.length,
  passed: 0,
  failed: 0,
  details: []
};

/**
 * Run a test suite
 */
async function runTest(suite) {
  return new Promise((resolve) => {
    console.log('\n' + '▓'.repeat(80));
    console.log(`▓  Running: ${suite.name}`);
    console.log(`▓  ${suite.description}`);
    console.log('▓'.repeat(80) + '\n');

    const startTime = Date.now();
    const proc = spawn('node', [suite.script], {
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      const duration = Date.now() - startTime;
      const success = code === 0;

      results.details.push({
        name: suite.name,
        success,
        duration,
        code
      });

      if (success) {
        results.passed++;
        console.log('\n✅ ' + suite.name + ' PASSED');
      } else {
        results.failed++;
        console.log('\n❌ ' + suite.name + ' FAILED (exit code: ' + code + ')');
      }

      console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s\n`);
      resolve(success);
    });

    proc.on('error', (error) => {
      results.failed++;
      results.details.push({
        name: suite.name,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      });
      console.log('\n❌ ' + suite.name + ' ERROR:', error.message + '\n');
      resolve(false);
    });
  });
}

/**
 * Run all tests sequentially
 */
async function runAllTests() {
  for (const suite of testSuites) {
    await runTest(suite);
  }

  // Print summary
  console.log('\n' + '█'.repeat(80));
  console.log('█'.repeat(80));
  console.log('   FINAL TEST RESULTS');
  console.log('█'.repeat(80));
  console.log('█'.repeat(80) + '\n');

  console.log(`📊 Summary:`);
  console.log(`   Total Suites:  ${results.total}`);
  console.log(`   Passed:        ${results.passed} ✅`);
  console.log(`   Failed:        ${results.failed} ${results.failed > 0 ? '❌' : ''}`);
  console.log(`   Success Rate:  ${Math.round((results.passed / results.total) * 100)}%\n`);

  console.log('📋 Details:\n');
  results.details.forEach((result, i) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const duration = `${(result.duration / 1000).toFixed(2)}s`;
    console.log(`   ${i + 1}. ${status} - ${result.name} (${duration})`);
  });

  console.log('\n' + '='.repeat(80));

  if (results.passed === results.total) {
    console.log('\n🎉 ALL TESTS PASSED! 🎉\n');
    console.log('✅ The recent bugs (designer JSON, Sandpack crash) would have been caught!');
    console.log('✅ Browser environment testing is working');
    console.log('✅ Contract validation is in place');
    console.log('✅ Sandpack integration is tested\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  SOME TESTS FAILED\n');
    console.log(`${results.failed} out of ${results.total} test suite(s) failed.`);
    console.log('Please review the output above for details.\n');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test runner error:', error);
  process.exit(1);
});
