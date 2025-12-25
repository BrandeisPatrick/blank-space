/**
 * Vercel Serverless Function
 * Securely proxies Google Gemini API requests
 * Keeps GOOGLE_API_KEY server-side only
 *
 * Supports two modes:
 * 1. Simple generation: { action: 'generate', model, contents, ... }
 * 2. Chat with tools: { action: 'chat', model, message, history, tools, ... }
 */

import { verifyAuth } from './middleware/_auth.js';
import { checkQuota } from './middleware/_quota.js';
import { checkRateLimit } from './utils/_rateLimit.js';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check rate limit for burst protection
  const rateLimit = checkRateLimit(req);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Please slow down. Try again in a minute.',
    });
  }

  // Verify authentication
  const authResult = await verifyAuth(req);
  if (authResult.error) {
    return res.status(authResult.status).json({
      error: authResult.error,
      requiresAuth: true,
    });
  }

  const { userId } = authResult;

  // Determine model tier from model name
  const { model = 'gemini-3-flash-preview' } = req.body;
  const modelTier = model === 'gemini-3-pro-preview' ? 'pro' : 'lite';

  // Check user quota
  const quotaResult = await checkQuota(userId, modelTier);
  if (!quotaResult.allowed) {
    return res.status(429).json({
      error: 'Quota exceeded',
      message: quotaResult.error,
      resetAt: quotaResult.resetAt,
      limits: quotaResult.limits,
    });
  }

  // Get API key from environment (server-side only)
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.error('GOOGLE_API_KEY not configured in Vercel environment');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Google API key not configured'
    });
  }

  try {
    const { action = 'generate' } = req.body;

    // Initialize Gemini client
    const ai = new GoogleGenAI({ apiKey });

    if (action === 'chat') {
      return handleChatRequest(req, res, ai);
    } else {
      return handleGenerateRequest(req, res, ai);
    }

  } catch (error) {
    console.error('Gemini API error:', error);
    return handleError(res, error);
  }
}

/**
 * Handle simple content generation
 */
async function handleGenerateRequest(req, res, ai) {
  const {
    model = 'gemini-3-flash-preview',
    contents,
    systemInstruction,
    tools,
    thinkingConfig
  } = req.body;

  if (!contents) {
    return res.status(400).json({
      error: 'Bad request',
      message: 'Missing required field: contents'
    });
  }

  // Build config object
  const config = {};
  if (systemInstruction) config.systemInstruction = systemInstruction;
  if (tools) config.tools = tools;
  if (thinkingConfig) config.thinkingConfig = thinkingConfig;

  const response = await ai.models.generateContent({
    model,
    contents,
    config: Object.keys(config).length > 0 ? config : undefined,
  });

  return res.status(200).json({
    text: response.text || '',
    candidates: response.candidates,
    functionCalls: response.functionCalls || [],
    usageMetadata: response.usageMetadata,
  });
}

/**
 * Handle chat session with tools (for code generation)
 * Uses chat session to properly handle multi-turn with function calling
 */
async function handleChatRequest(req, res, ai) {
  const {
    model = 'gemini-3-flash-preview',
    message,
    history = [],
    systemInstruction,
    tools,
    thinkingConfig,
    functionResponses
  } = req.body;

  // For initial message or continuing with function responses
  if (!message && !functionResponses) {
    return res.status(400).json({
      error: 'Bad request',
      message: 'Missing required field: message or functionResponses'
    });
  }

  // Build config for chat session
  const config = {};
  if (tools) config.tools = tools;
  if (systemInstruction) config.systemInstruction = systemInstruction;
  if (thinkingConfig) config.thinkingConfig = thinkingConfig;

  // Create chat session with history
  const chat = ai.chats.create({
    model,
    history,
    config: Object.keys(config).length > 0 ? config : undefined,
  });

  let response;

  if (functionResponses) {
    // Continue conversation with function call results
    response = await chat.sendMessage({ message: functionResponses });
  } else {
    // Send new user message
    response = await chat.sendMessage({ message });
  }

  return res.status(200).json({
    text: response.text || '',
    candidates: response.candidates,
    functionCalls: response.functionCalls || [],
    usageMetadata: response.usageMetadata,
    // Return updated history for client to use in next request
    history: chat.getHistory ? chat.getHistory() : history,
  });
}

/**
 * Handle errors consistently
 */
function handleError(res, error) {
  if (error.message?.includes('API key')) {
    return res.status(401).json({
      error: 'Authentication error',
      message: 'Invalid Google API key'
    });
  }

  if (error.message?.includes('quota')) {
    return res.status(429).json({
      error: 'Quota exceeded',
      message: 'Google API quota exceeded. Please try again later.'
    });
  }

  if (error.message?.includes('thought_signature')) {
    return res.status(400).json({
      error: 'Function calling error',
      message: 'Missing thought signature. Ensure history is passed correctly.',
      details: error.message
    });
  }

  return res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
}
