/**
 * Secure OpenAI Client
 * Uses Vercel serverless functions to keep API key server-side
 */

/**
 * Check if running in browser environment
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Custom OpenAI client that uses our secure serverless API
 */
class SecureOpenAIClient {
  constructor() {
    this.chat = {
      completions: {
        create: async (options) => {
          // In browser: use our secure serverless function
          if (isBrowser) {
            const response = await fetch('/api/chat', {
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
              }),
            });

            if (!response.ok) {
              const error = await response.json().catch(() => ({
                error: 'Unknown error',
                message: `HTTP ${response.status}`
              }));

              // Throw error with rate limit info if available
              const err = new Error(error.message || 'OpenAI API request failed');
              err.rateLimit = error.rateLimit;
              err.isRateLimit = response.status === 429;
              throw err;
            }

            return await response.json();
          }

          // In Node.js (for tests): use OpenAI directly
          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable not set');
          }

          // Dynamic import of OpenAI for Node.js environment only
          const { default: OpenAI } = await import('openai');
          const client = new OpenAI({ apiKey });
          return await client.chat.completions.create(options);
        }
      }
    };
  }
}

/**
 * Shared OpenAI client instance
 */
export const openai = new SecureOpenAIClient();
