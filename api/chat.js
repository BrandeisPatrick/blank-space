/**
 * Vercel Serverless Function
 * Securely proxies OpenAI API requests
 * Keeps API key server-side only
 */

import { checkRateLimit } from './utils/rateLimit.js';

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
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('OPENAI_API_KEY not configured in Vercel environment');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'OpenAI API key not configured'
    });
  }

  try {
    // Extract request body
    const { model, messages, temperature, max_tokens, max_completion_tokens } = req.body;

    // Validate required fields
    if (!model || !messages) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing required fields: model and messages'
      });
    }

    // Build request body for OpenAI
    const openaiRequestBody = {
      model,
      messages,
    };

    // Add optional parameters if provided
    if (temperature !== undefined) {
      openaiRequestBody.temperature = temperature;
    }
    if (max_tokens !== undefined) {
      openaiRequestBody.max_tokens = max_tokens;
    }
    if (max_completion_tokens !== undefined) {
      openaiRequestBody.max_completion_tokens = max_completion_tokens;
    }

    // Make request to OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(openaiRequestBody),
    });

    // Handle OpenAI API errors
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('OpenAI API error:', openaiResponse.status, errorData);

      return res.status(openaiResponse.status).json({
        error: 'OpenAI API error',
        message: errorData.error?.message || 'Unknown error from OpenAI',
        details: errorData
      });
    }

    // Parse and return successful response
    const data = await openaiResponse.json();

    // Include rate limit info in response body
    return res.status(200).json({
      ...data,
      rateLimit: {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        reset: rateLimit.reset,
        used: rateLimit.used
      }
    });

  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
