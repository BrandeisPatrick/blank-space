/**
 * Vercel Serverless Function
 * Securely proxies Google Gemini API requests
 * Keeps GOOGLE_API_KEY server-side only
 */

import { checkRateLimit } from './utils/rateLimit.js';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check rate limit
  const rateLimit = checkRateLimit(req);

  // Add rate limit headers to response
  res.setHeader('X-RateLimit-Limit', rateLimit.limit.toString());
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
  res.setHeader('X-RateLimit-Reset', rateLimit.reset);

  // If rate limit exceeded, return 429
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Daily limit reached. Your quota will reset at midnight UTC.',
      rateLimit: {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        reset: rateLimit.reset,
        used: rateLimit.used
      }
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
    // Extract request body
    const {
      model = 'gemini-3-flash-preview',
      contents,
      systemInstruction,
      tools,
      thinkingConfig
    } = req.body;

    // Validate required fields
    if (!contents) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing required field: contents'
      });
    }

    // Initialize Gemini client
    const ai = new GoogleGenAI({ apiKey });

    // Build config object
    const config = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (tools) {
      config.tools = tools;
    }
    if (thinkingConfig) {
      config.thinkingConfig = thinkingConfig;
    }

    // Make request to Gemini API
    const response = await ai.models.generateContent({
      model,
      contents,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    // Extract response data
    const result = {
      text: response.text || '',
      candidates: response.candidates,
      functionCalls: response.functionCalls || [],
      usageMetadata: response.usageMetadata,
      rateLimit: {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        reset: rateLimit.reset,
        used: rateLimit.used
      }
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('Gemini API error:', error);

    // Handle specific Gemini errors
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
        message: 'Missing thought signature. This may be a client-side issue with multi-turn function calling.',
        details: error.message
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
