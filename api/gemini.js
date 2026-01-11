/**
 * Vercel Serverless Function
 * Securely proxies Google Gemini API requests
 * Keeps GEMINI_API_KEY server-side only
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

  // Determine model tier from model name
  const { model = 'gemini-3-flash-preview' } = req.body;
  const modelTier = model === 'gemini-3-pro-preview' ? 'pro' : 'lite';

  // Verify authentication
  const authResult = await verifyAuth(req);

  // Pro mode requires authentication
  if (modelTier === 'pro' && authResult.error) {
    return res.status(authResult.status).json({
      error: authResult.error,
      requiresAuth: true,
    });
  }

  // For guests (lite mode only), use IP-based identifier for rate limiting
  const userId = authResult.userId || `guest_${req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'}`;
  const isGuest = !authResult.userId;

  // Check user quota (skip for guests - they only have rate limiting)
  if (!isGuest) {
    const quotaResult = await checkQuota(userId, modelTier);
    if (!quotaResult.allowed) {
      return res.status(429).json({
        error: 'Quota exceeded',
        message: quotaResult.error,
        resetAt: quotaResult.resetAt,
        limits: quotaResult.limits,
      });
    }
  }

  // Get API key from environment (server-side only)
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('GEMINI_API_KEY not configured in environment');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Gemini API key not configured'
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
    imageParts,  // Array of {inlineData: {mimeType, data}} for image uploads
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
  } else if (imageParts && imageParts.length > 0) {
    // Build multimodal message with text and images
    const parts = [
      { text: message || 'What is in this image?' },
      ...imageParts  // Already in {inlineData: {mimeType, data}} format
    ];
    response = await chat.sendMessage({ message: parts });
  } else {
    // Send new user message (text only)
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
