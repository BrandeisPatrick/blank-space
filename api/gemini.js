/**
 * Vercel Serverless Function
 * Securely proxies Gemini API requests with function calling support
 * Keeps API key server-side only
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit } from './utils/rateLimit.js';

/**
 * Generate a unique ID for tool calls
 */
function generateToolCallId() {
  return 'call_' + Math.random().toString(36).substring(2, 15);
}

/**
 * Convert OpenAI tool format to Gemini function declarations
 * OpenAI: { type: "function", function: { name, description, parameters } }
 * Gemini: { name, description, parameters }
 */
function convertToolsToGemini(openAITools) {
  if (!openAITools || !Array.isArray(openAITools)) return null;

  const functionDeclarations = openAITools
    .filter(tool => tool.type === 'function' && tool.function)
    .map(tool => ({
      name: tool.function.name,
      description: tool.function.description || '',
      parameters: tool.function.parameters || { type: 'object', properties: {} }
    }));

  if (functionDeclarations.length === 0) return null;

  return [{ functionDeclarations }];
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check rate limit (gemini service)
  const rateLimit = await checkRateLimit(req, 'gemini');

  // Add rate limit headers to response
  res.setHeader('X-RateLimit-Limit', rateLimit.limit.toString());
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
  res.setHeader('X-RateLimit-Reset', rateLimit.reset);

  // If rate limit exceeded, return 429
  if (!rateLimit.allowed) {
    const isGlobalLimit = rateLimit.reason === 'global_limit_exceeded';
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: isGlobalLimit
        ? 'Global daily limit reached. The free tier quota is exhausted for today.'
        : 'Your daily limit reached. Your quota will reset at midnight UTC.',
      rateLimit: {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        reset: rateLimit.reset,
        used: rateLimit.used,
        global: rateLimit.global
      }
    });
  }

  // Get API key from environment (server-side only)
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('GEMINI_API_KEY not configured in Vercel environment');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Gemini API key not configured'
    });
  }

  try {
    // Extract request body
    const { model = 'gemini-3-pro-preview', messages, tools, temperature, maxOutputTokens } = req.body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing required field: messages (array)'
      });
    }

    // Extract system instruction from messages (Gemini uses systemInstruction parameter, not system role)
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const systemInstruction = systemMessages.map(msg => msg.content).join('\n');

    // Filter out system messages for chat history (only user/assistant/tool)
    const chatMessages = messages.filter(msg => msg.role !== 'system');

    // Convert OpenAI tools to Gemini format
    const geminiTools = convertToolsToGemini(tools);

    console.log('[Gemini API] System instruction length:', systemInstruction.length);
    console.log('[Gemini API] Chat messages count:', chatMessages.length);
    console.log('[Gemini API] Tools count:', tools?.length || 0);
    console.log('[Gemini API] Gemini tools:', geminiTools ? 'configured' : 'none');

    // Initialize Gemini client with system instruction and tools
    console.log('[Gemini API] Initializing GoogleGenerativeAI...');
    const genAI = new GoogleGenerativeAI(apiKey);

    const modelConfig = {
      model,
      systemInstruction: systemInstruction || undefined
    };

    // Add tools if provided
    if (geminiTools) {
      modelConfig.tools = geminiTools;
    }

    const geminiModel = genAI.getGenerativeModel(modelConfig);
    console.log('[Gemini API] Model initialized:', model);

    // Convert OpenAI-style messages to Gemini format
    const geminiContents = [];
    for (const msg of chatMessages) {
      if (msg.role === 'assistant') {
        // Check if this is a tool call message
        if (msg.tool_calls && msg.tool_calls.length > 0) {
          // Convert tool calls to Gemini function call format
          const parts = msg.tool_calls.map(tc => ({
            functionCall: {
              name: tc.function.name,
              args: JSON.parse(tc.function.arguments || '{}')
            }
          }));
          geminiContents.push({ role: 'model', parts });
        } else {
          geminiContents.push({
            role: 'model',
            parts: [{ text: msg.content || '' }]
          });
        }
      } else if (msg.role === 'tool') {
        // Convert tool result to Gemini function response format
        geminiContents.push({
          role: 'function',
          parts: [{
            functionResponse: {
              name: msg.name || 'unknown',
              response: JSON.parse(msg.content || '{}')
            }
          }]
        });
      } else {
        // User message
        geminiContents.push({
          role: 'user',
          parts: [{ text: msg.content || '' }]
        });
      }
    }
    console.log('[Gemini API] Converted to Gemini format:', geminiContents.length, 'messages');

    // Build generation config
    const generationConfig = {};
    if (temperature !== undefined) {
      generationConfig.temperature = temperature;
    }
    if (maxOutputTokens !== undefined) {
      generationConfig.maxOutputTokens = maxOutputTokens;
    }
    console.log('[Gemini API] Generation config:', JSON.stringify(generationConfig));

    // Start chat and send message
    const historyMessages = geminiContents.slice(0, -1);
    console.log('[Gemini API] Starting chat with', historyMessages.length, 'history messages');

    const chat = geminiModel.startChat({
      history: historyMessages,
      generationConfig
    });

    const lastMessage = geminiContents[geminiContents.length - 1];
    const lastMessageText = lastMessage.parts[0]?.text || lastMessage.parts[0]?.functionResponse?.name || 'function response';
    console.log('[Gemini API] Sending message type:', lastMessage.role);
    console.log('[Gemini API] Message preview:', typeof lastMessageText === 'string' ? lastMessageText.substring(0, 100) : JSON.stringify(lastMessageText));

    // Send the message content (text or function response)
    let result;
    if (lastMessage.parts[0]?.text) {
      result = await chat.sendMessage(lastMessage.parts[0].text);
    } else if (lastMessage.parts[0]?.functionResponse) {
      // For function responses, we need to send as structured content
      result = await chat.sendMessage(lastMessage.parts);
    } else {
      result = await chat.sendMessage(lastMessage.parts);
    }

    console.log('[Gemini API] Received result, getting response...');
    const response = await result.response;

    // Check for function calls in response
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      console.log('[Gemini API] Response has', functionCalls.length, 'function calls');

      // Convert Gemini function calls to OpenAI tool_calls format
      const toolCalls = functionCalls.map(fc => ({
        id: generateToolCallId(),
        type: 'function',
        function: {
          name: fc.name,
          arguments: JSON.stringify(fc.args || {})
        }
      }));

      return res.status(200).json({
        choices: [{
          message: {
            role: 'assistant',
            content: null,
            tool_calls: toolCalls
          },
          finish_reason: 'tool_calls'
        }],
        model,
        rateLimit: {
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
          reset: rateLimit.reset,
          used: rateLimit.used
        }
      });
    }

    // Regular text response
    const text = response.text();
    console.log('[Gemini API] Response text length:', text.length);
    console.log('[Gemini API] Response preview:', text.substring(0, 200), '...');

    // Return response in OpenAI-compatible format
    return res.status(200).json({
      choices: [{
        message: {
          role: 'assistant',
          content: text
        },
        finish_reason: 'stop'
      }],
      model,
      rateLimit: {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        reset: rateLimit.reset,
        used: rateLimit.used
      }
    });

  } catch (error) {
    console.error('[Gemini API] ERROR:', error.message);
    console.error('[Gemini API] Error stack:', error.stack);
    console.error('[Gemini API] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return res.status(500).json({
      error: 'Gemini API error',
      message: error.message,
      details: error.toString()
    });
  }
}
