/**
 * Vercel Serverless Function
 * Securely proxies Gemini API requests
 * Keeps API key server-side only
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit } from './utils/rateLimit.js';

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
    const { model = 'gemini-3-pro-preview', messages, temperature, maxOutputTokens } = req.body;

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

    // Filter out system messages for chat history (only user/assistant)
    const chatMessages = messages.filter(msg => msg.role !== 'system');

    console.log('[Gemini] System instruction length:', systemInstruction.length);
    console.log('[Gemini] Chat messages count:', chatMessages.length);

    // Initialize Gemini client with system instruction
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({
      model,
      systemInstruction: systemInstruction || undefined
    });

    // Convert OpenAI-style messages to Gemini format (user/assistant only)
    const geminiContents = chatMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Build generation config
    const generationConfig = {};
    if (temperature !== undefined) {
      generationConfig.temperature = temperature;
    }
    if (maxOutputTokens !== undefined) {
      generationConfig.maxOutputTokens = maxOutputTokens;
    }

    // Start chat and send message
    const chat = geminiModel.startChat({
      history: geminiContents.slice(0, -1),
      generationConfig
    });

    const lastMessage = geminiContents[geminiContents.length - 1];
    const result = await chat.sendMessage(lastMessage.parts[0].text);
    const response = await result.response;
    const text = response.text();

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
    console.error('Gemini API error:', error);
    return res.status(500).json({
      error: 'Gemini API error',
      message: error.message
    });
  }
}
