/**
 * Test the /api/gemini endpoint directly (simulates client requests)
 * Run with: node test-api-gemini.mjs
 */

const API_URL = 'http://localhost:3000/api/gemini';

// Long system instruction to match production (~7600 chars)
const LONG_SYSTEM_INSTRUCTION = `You are a React code generation assistant.

# CRITICAL RULES
${'This is padding text to make the system instruction longer. '.repeat(150)}

End of rules.`;

console.log('System instruction length:', LONG_SYSTEM_INSTRUCTION.length);

const tools = [{
  functionDeclarations: [{
    name: 'glob',
    description: 'Find files matching a pattern',
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Glob pattern' }
      },
      required: ['pattern']
    }
  }]
}];

async function testApiEndpoint() {
  console.log('=== Step 1: Initial request ===');

  // First request - send message, get function calls
  const req1 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'chat',
      model: 'gemini-3-flash-preview',
      message: 'List all files in the project',
      history: [],
      systemInstruction: LONG_SYSTEM_INSTRUCTION,
      tools,
      thinkingConfig: { thinkingLevel: 'low' }
    })
  });

  const res1 = await req1.json();
  console.log('Status:', req1.status);
  console.log('Response:', JSON.stringify(res1, null, 2).slice(0, 2000));

  if (!req1.ok) {
    console.error('First request failed');
    return;
  }

  if (!res1.functionCalls || res1.functionCalls.length === 0) {
    console.log('No function calls in response');
    return;
  }

  console.log('\n=== Step 2: Send function response ===');
  console.log('History from step 1:', JSON.stringify(res1.history, null, 2).slice(0, 1500));

  // Build function response (matching Code Agent format)
  const functionResponses = [{
    functionResponse: {
      name: 'glob',
      response: {
        result: {
          success: true,
          pattern: '**/*',
          matches: [],
          count: 0,
          message: 'No files matching pattern: **/*',
          tool: 'glob'
        }
      }
    }
  }];

  console.log('Function responses:', JSON.stringify(functionResponses, null, 2));

  // Second request - send function response with history
  const req2 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'chat',
      model: 'gemini-3-flash-preview',
      functionResponses,
      history: res1.history,  // Use history from first response
      systemInstruction: LONG_SYSTEM_INSTRUCTION,
      tools,
      thinkingConfig: { thinkingLevel: 'low' }
    })
  });

  const res2 = await req2.json();
  console.log('\nStatus:', req2.status);
  console.log('Response:', JSON.stringify(res2, null, 2).slice(0, 2000));

  if (req2.ok) {
    console.log('\n✅ SUCCESS! Full flow worked.');
  } else {
    console.log('\n❌ FAILED at step 2');
  }
}

testApiEndpoint().catch(console.error);
