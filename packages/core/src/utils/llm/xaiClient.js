/**
 * Secure xAI (Grok) Client
 * Uses Vercel serverless functions to keep API key server-side
 */

/**
 * Check if running in browser environment
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Custom xAI client that uses our secure serverless API
 */
class SecureXAIClient {
  constructor() {
    this.chat = {
      completions: {
        create: async (options) => {
          // In browser: use our secure serverless function
          if (isBrowser) {
            const response = await fetch('/api/grok', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: options.model,
                messages: options.messages,
                temperature: options.temperature,
                max_tokens: options.max_tokens,
                max_completion_tokens: options.max_completion_tokens,
                tools: options.tools,
                tool_choice: options.tool_choice,
              }),
            });

            if (!response.ok) {
              const error = await response.json().catch(() => ({
                error: 'Unknown error',
                message: `HTTP ${response.status}`
              }));

              // Throw error with rate limit info if available
              const err = new Error(error.message || 'xAI API request failed');
              err.rateLimit = error.rateLimit;
              err.isRateLimit = response.status === 429;
              throw err;
            }

            return await response.json();
          }

          // In Node.js (for tests): use xAI API directly
          const apiKey = process.env.XAI_API_KEY;
          if (!apiKey) {
            throw new Error('XAI_API_KEY environment variable not set');
          }

          // Direct API call for Node.js environment
          const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: options.model,
              messages: options.messages,
              temperature: options.temperature,
              max_tokens: options.max_tokens,
              ...(options.tools && { tools: options.tools }),
              ...(options.tool_choice && { tool_choice: options.tool_choice }),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.error?.message || `HTTP ${response.status}`);
            error.status = response.status;
            throw error;
          }

          return await response.json();
        }
      }
    };
  }
}

/**
 * Shared xAI client instance
 */
export const xai = new SecureXAIClient();
