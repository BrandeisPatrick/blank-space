/**
 * E2E Test Runner
 * Validates environment and runs the E2E tests
 *
 * Usage:
 *   export OPENAI_API_KEY="your-key"  # or set in .env
 *   node test/run-e2e-tests.js
 */

// Validate API key is set
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is not set');
  console.error('Please set it before running tests:');
  console.error('  export OPENAI_API_KEY="your-key"');
  console.error('  or add it to your .env file');
  process.exit(1);
}

console.log('✅ Environment configured');
console.log('🔑 API Key set:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');
console.log('');

// Import and run the E2E tests
import('./e2e/prompt-to-product.test.js');
