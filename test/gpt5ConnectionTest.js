/**
 * GPT-5 Connection Test
 * Tests connection to both gpt-5-mini and gpt-5-nano models
 */

import dotenv from 'dotenv';
import { callLLM, extractContent } from '../src/services/utils/llmClient.js';
import { getAllModels, logModelConfig } from '../src/services/config/modelConfig.js';

// Load environment variables from .env file
dotenv.config();

console.log('🧪 GPT-5 Connection Test\n');
console.log('━'.repeat(60));

// Display current model configuration
logModelConfig();

async function testModel(modelName, testType) {
  console.log(`\n🔄 Testing ${modelName}...`);
  console.log('─'.repeat(60));

  const startTime = Date.now();

  try {
    const systemPrompt = testType === 'generation'
      ? 'You are a helpful code assistant.'
      : 'You are a classification assistant.';

    const userPrompt = testType === 'generation'
      ? 'Write a simple hello world function in JavaScript.'
      : 'Classify this intent: "create a todo app". Answer with one word: generate, modify, or analyze.';

    const response = await callLLM({
      model: modelName,
      systemPrompt,
      userPrompt,
      maxTokens: 200,
      temperature: 0.7,
      maxRetries: 2,
      timeout: 30000
    });

    const duration = Date.now() - startTime;
    const content = extractContent(response);

    console.log(`✅ Success! (${duration}ms)`);
    console.log(`Model: ${response.model || modelName}`);
    console.log(`Tokens: ${response.usage?.total_tokens || 'N/A'}`);
    console.log(`Response preview: ${content.substring(0, 150)}...`);

    return { success: true, model: modelName, duration, response };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ Failed! (${duration}ms)`);
    console.log(`Error: ${error.message}`);

    return { success: false, model: modelName, duration, error: error.message };
  }
}

async function runTests() {
  console.log('\n📋 Running Connection Tests...\n');

  const results = [];

  // Test gpt-5-mini (major agent model)
  results.push(await testModel('gpt-5-mini', 'generation'));

  // Test gpt-5-nano (lightweight agent model)
  results.push(await testModel('gpt-5-nano', 'classification'));

  // Summary
  console.log('\n━'.repeat(60));
  console.log('📊 TEST SUMMARY\n');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${successful}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n⚠️  Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.model}: ${r.error}`);
    });
  }

  // Show current model assignments
  console.log('\n━'.repeat(60));
  console.log('🎯 CURRENT MODEL ASSIGNMENTS\n');
  const models = getAllModels();
  console.log(`Generator:         ${models.GENERATOR}`);
  console.log(`Modifier:          ${models.MODIFIER}`);
  console.log(`Planner:           ${models.PLANNER}`);
  console.log(`Intent Classifier: ${models.INTENT_CLASSIFIER}`);
  console.log(`Analyzer:          ${models.ANALYZER}`);

  console.log('\n━'.repeat(60));
  console.log(failed === 0 ? '✅ All tests passed!' : '⚠️  Some tests failed. Check errors above.');
  console.log('━'.repeat(60) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test runner failed:', error);
  process.exit(1);
});
