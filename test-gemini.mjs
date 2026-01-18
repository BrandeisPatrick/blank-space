/**
 * Manual test script for Gemini API with function calling
 * Run with: node test-gemini.mjs
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env vars
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env.local') });

const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey) {
  console.error('GEMINI_API_KEY not found');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// Define a simple tool
const tools = [{
  functionDeclarations: [{
    name: 'glob',
    description: 'Find files matching a pattern',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Glob pattern to match files'
        }
      },
      required: ['pattern']
    }
  }]
}];

async function testGemini() {
  const model = 'gemini-3-flash-preview';

  console.log('=== Step 1: Initial request with tools ===');

  try {
    // Create chat session (matching production config)
    const chat = ai.chats.create({
      model,
      history: [],
      config: {
        tools,
        systemInstruction: 'You are a helpful assistant. Use the glob tool to list files.',
        thinkingConfig: { thinkingLevel: 'low' }
      }
    });

    // Send initial message
    const response1 = await chat.sendMessage({ message: 'List all files in the project' });

    console.log('Response text:', response1.text);
    console.log('Function calls:', JSON.stringify(response1.functionCalls, null, 2));

    if (!response1.functionCalls || response1.functionCalls.length === 0) {
      console.log('No function calls received, exiting');
      return;
    }

    // Get history after first response
    const history = chat.getHistory();
    console.log('\n=== History after first response ===');
    console.log(JSON.stringify(history, null, 2));

    console.log('\n=== Step 2: Send function response ===');

    // Build function response - MATCH PRODUCTION (empty matches)
    const functionResponse = {
      functionResponse: {
        name: 'glob',
        response: {
          result: {
            success: true,
            pattern: '**/*',
            matches: [],  // Empty like in production
            count: 0,
            message: 'No files matching pattern: **/*',
            tool: 'glob'  // Extra field from production
          }
        }
      }
    };

    console.log('Sending function response:', JSON.stringify(functionResponse, null, 2));

    // Method 1: Try chat.sendMessage (same session)
    console.log('\n--- Method 1: chat.sendMessage (same session) ---');
    try {
      const response2 = await chat.sendMessage({ message: [functionResponse] });
      console.log('SUCCESS! Response:', response2.text);
      console.log('Function calls:', response2.functionCalls);
    } catch (err) {
      console.log('Method 1 failed:', err.message);
    }

    // Method 1b: Create NEW chat with history and send function response
    console.log('\n--- Method 1b: NEW chat session with history ---');
    try {
      const chat2 = ai.chats.create({
        model,
        history: history,  // Use history from first chat
        config: {
          tools,
          systemInstruction: 'You are a helpful assistant.',
          thinkingConfig: { thinkingLevel: 'low' }
        }
      });

      const response3 = await chat2.sendMessage({ message: [functionResponse] });
      console.log('SUCCESS! Response:', response3.text);
    } catch (err) {
      console.log('Method 1b failed:', err.message);
    }

  } catch (error) {
    console.error('Error:', error);
  }

  // Method 2: Try generateContent directly
  console.log('\n=== Method 2: generateContent directly ===');
  try {
    const contents = [
      { role: 'user', parts: [{ text: 'List all files' }] },
      {
        role: 'model',
        parts: [{
          functionCall: {
            name: 'glob',
            args: { pattern: '**/*' }
          }
        }]
      },
      {
        role: 'user',
        parts: [{
          functionResponse: {
            name: 'glob',
            response: {
              result: { success: true, matches: ['a.js', 'b.js'] }
            }
          }
        }]
      }
    ];

    console.log('Contents:', JSON.stringify(contents, null, 2));

    const response = await ai.models.generateContent({
      model,
      contents,
      config: { tools }
    });

    console.log('SUCCESS! Response:', response.text);
  } catch (error) {
    console.error('Method 2 failed:', error.message);
  }

  // Method 3: Try without result wrapper
  console.log('\n=== Method 3: Without result wrapper ===');
  try {
    const contents = [
      { role: 'user', parts: [{ text: 'List all files' }] },
      {
        role: 'model',
        parts: [{
          functionCall: {
            name: 'glob',
            args: { pattern: '**/*' }
          }
        }]
      },
      {
        role: 'user',
        parts: [{
          functionResponse: {
            name: 'glob',
            response: { success: true, matches: ['a.js', 'b.js'] }
          }
        }]
      }
    ];

    const response = await ai.models.generateContent({
      model,
      contents,
      config: { tools }
    });

    console.log('SUCCESS! Response:', response.text);
  } catch (error) {
    console.error('Method 3 failed:', error.message);
  }

  // Method 4: Try with function role
  console.log('\n=== Method 4: With function role ===');
  try {
    const contents = [
      { role: 'user', parts: [{ text: 'List all files' }] },
      {
        role: 'model',
        parts: [{
          functionCall: {
            name: 'glob',
            args: { pattern: '**/*' }
          }
        }]
      },
      {
        role: 'function',
        parts: [{
          functionResponse: {
            name: 'glob',
            response: { success: true, matches: ['a.js', 'b.js'] }
          }
        }]
      }
    ];

    const response = await ai.models.generateContent({
      model,
      contents,
      config: { tools }
    });

    console.log('SUCCESS! Response:', response.text);
  } catch (error) {
    console.error('Method 4 failed:', error.message);
  }
}

testGemini();
