/**
 * API Endpoint Test
 * Tests OpenAI API connection and LLM client functionality
 */

import { openai } from '../src/services/utils/llm/openaiClient.js';
import { callLLMAndExtract } from '../src/services/utils/llm/llmClient.js';
import { MODELS } from '../src/services/config/modelConfig.js';

console.log('\n🔌 Testing API Endpoint Connection\n');
console.log('═'.repeat(50));

// Check environment variable
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('❌ OPENAI_API_KEY environment variable not set');
  process.exit(1);
}

console.log('✅ API Key found:', apiKey.substring(0, 10) + '...' + apiKey.slice(-4));
console.log(`   Length: ${apiKey.length} characters\n`);

// Test 1: Simple API call
console.log('🔍 Test 1: Basic OpenAI API Connection');
try {
  console.log('   Making test request to OpenAI API...');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Say "Hello" in one word.' }
    ],
    max_tokens: 10,
    temperature: 0.7
  });

  const content = response.choices[0].message.content;
  console.log(`   Response: "${content}"`);
  console.log('✅ Test 1: Basic API connection - PASSED\n');
} catch (error) {
  console.error('❌ Test 1: Basic API connection - FAILED');
  console.error(`   Error: ${error.message}`);
  if (error.status) {
    console.error(`   Status: ${error.status}`);
  }
  console.error(`   Full error:`, error);
  process.exit(1);
}

// Test 2: LLM Client with code extraction
console.log('🔍 Test 2: LLM Client with Code Extraction');
try {
  console.log('   Testing callLLMAndExtract...');

  const code = await callLLMAndExtract({
    model: MODELS.CODE_WRITER || 'gpt-4o',
    systemPrompt: 'You are a code generator. Output ONLY raw JavaScript code with no explanations.',
    userPrompt: 'Generate a simple function that adds two numbers.',
    maxTokens: 200,
    temperature: 0.3
  });

  console.log('   Generated code:');
  console.log('   ' + code.split('\n').slice(0, 3).join('\n   ') + '...');

  if (code && code.length > 0) {
    console.log('✅ Test 2: LLM Client extraction - PASSED\n');
  } else {
    console.log('❌ Test 2: No code returned - FAILED\n');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Test 2: LLM Client extraction - FAILED');
  console.error(`   Error: ${error.message}`);
  process.exit(1);
}

// Test 3: Model Configuration
console.log('🔍 Test 3: Model Configuration');
console.log(`   Planner Model:     ${MODELS.PLANNER}`);
console.log(`   Analyzer Model:    ${MODELS.ANALYZER}`);
console.log(`   Code Writer Model: ${MODELS.CODE_WRITER}`);
console.log(`   Designer Model:    ${MODELS.DESIGNER}`);
console.log(`   Debugger Model:    ${MODELS.DEBUGGER}`);
console.log('✅ Test 3: Model config loaded - PASSED\n');

console.log('═'.repeat(50));
console.log('✨ All API tests passed! System is ready.\n');
console.log('📊 API Status:');
console.log('  ✅ OpenAI API connection working');
console.log('  ✅ LLM client functioning correctly');
console.log('  ✅ Code extraction working');
console.log('  ✅ Model configuration loaded\n');
