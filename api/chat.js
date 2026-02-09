/**
 * Vercel Serverless Function
 * Securely proxies OpenAI API requests
 * Supports web search for conversational queries
 */

import { checkRateLimit } from './utils/_rateLimit.js';

export const config = {
  maxDuration: 60,
};

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
    const {
      model,
      messages,
      temperature,
      max_tokens,
      max_completion_tokens,
      tools,
      tool_choice,
      web_search = false  // Enable web search for chat intent
    } = req.body;

    // Validate required fields
    if (!model || !messages) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing required fields: model and messages'
      });
    }

    // Use Responses API for web search (gpt-4o and newer support this)
    if (web_search) {
      return handleWebSearchRequest(req, res, apiKey);
    }

    // Standard Chat Completions API
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
    if (tools !== undefined) {
      openaiRequestBody.tools = tools;
    }
    if (tool_choice !== undefined) {
      openaiRequestBody.tool_choice = tool_choice;
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
    return res.status(200).json(data);

  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Handle web search request using OpenAI Responses API
 * Uses gpt-5-mini with web_search_preview tool for real-time information
 */
async function handleWebSearchRequest(req, res, apiKey) {
  const {
    model = 'gpt-5-mini',
    messages,
    max_tokens = 1000,
  } = req.body;

  /**
   * Transform Chat Completions content format to Responses API format
   * - 'text' → 'input_text'
   * - 'image_url' → 'input_image' with flattened URL
   * - 'file' → 'input_file' for PDFs and documents
   */
  function transformContentForResponsesAPI(content) {
    // String content stays as-is
    if (typeof content === 'string') {
      return content;
    }
    // Array content needs type transformation
    if (Array.isArray(content)) {
      return content.map(item => {
        if (item.type === 'text') {
          return { type: 'input_text', text: item.text };
        }
        if (item.type === 'image_url') {
          return {
            type: 'input_image',
            image_url: item.image_url?.url || item.image_url
          };
        }
        if (item.type === 'file') {
          // Handle PDFs and documents - use input_file format for Responses API
          return {
            type: 'input_file',
            filename: item.file?.filename || 'document',
            file_data: item.file?.file_data || item.file
          };
        }
        return item;
      });
    }
    return content;
  }

  // Convert messages to Responses API format
  // Handle both string content and array content (for images)
  const input = messages.map(msg => ({
    role: msg.role === 'system' ? 'developer' : msg.role,
    content: transformContentForResponsesAPI(msg.content)
  }));

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input,
        tools: [{ type: 'web_search' }],
        max_output_tokens: max_tokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI Responses API error:', response.status, errorData);

      return res.status(response.status).json({
        error: 'OpenAI API error',
        message: errorData.error?.message || 'Unknown error from OpenAI',
        details: errorData
      });
    }

    const data = await response.json();
    console.log('[WebSearch] Response received:', JSON.stringify(data, null, 2));

    // Normalize to Chat Completions format for compatibility
    const content = extractResponseContent(data);
    const citations = extractCitations(data);

    if (!content) {
      console.error('[WebSearch] Failed to extract content from response');
    }

    return res.status(200).json({
      id: data.id,
      object: 'chat.completion',
      created: Date.now(),
      model: data.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: content,
        },
        finish_reason: data.status === 'completed' ? 'stop' : data.status,
      }],
      // Include citations for web search results
      citations: citations,
      usage: data.usage ? {
        prompt_tokens: data.usage.input_tokens || 0,
        completion_tokens: data.usage.output_tokens || 0,
        total_tokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
      } : {},
    });

  } catch (error) {
    console.error('Web search request error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Extract text content from Responses API response
 */
function extractResponseContent(data) {
  // Try convenience property first (newer API versions)
  if (data.output_text) {
    return data.output_text;
  }
  // Parse structured output
  if (data.output && Array.isArray(data.output)) {
    const text = data.output
      .filter(item => item.type === 'message' && item.content)
      .flatMap(item => item.content)
      .filter(block => block.type === 'output_text')
      .map(block => block.text)
      .join('');
    if (!text) {
      console.error('[WebSearch] No text found in output items:', JSON.stringify(data.output, null, 2));
    }
    return text;
  }
  console.error('[WebSearch] Unexpected response format - no output_text or output array');
  return '';
}

/**
 * Extract citations from web search results
 */
function extractCitations(data) {
  const citations = [];
  if (data.output && Array.isArray(data.output)) {
    data.output.forEach(item => {
      if (item.type === 'message' && item.content) {
        item.content.forEach(block => {
          if (block.type === 'output_text' && block.annotations) {
            block.annotations.forEach(annotation => {
              if (annotation.type === 'url_citation') {
                citations.push({
                  url: annotation.url,
                  title: annotation.title || annotation.url,
                  start_index: annotation.start_index,
                  end_index: annotation.end_index,
                });
              }
            });
          }
        });
      }
    });
  }
  return citations;
}
