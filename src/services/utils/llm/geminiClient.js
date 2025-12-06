/**
 * Secure Gemini Client
 * Uses Vercel serverless functions to keep API key server-side
 */

/**
 * Check if running in browser environment
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Custom Gemini client that uses our secure serverless API
 */
class SecureGeminiClient {
  constructor() {
    this.chat = {
      completions: {
        create: async (options) => {
          // In browser: use our secure serverless function
          if (isBrowser) {
            console.log('[GeminiClient] Sending request to /api/gemini');
            console.log('[GeminiClient] Model:', options.model || 'gemini-3-pro-preview');
            console.log('[GeminiClient] Messages count:', options.messages?.length);
            console.log('[GeminiClient] Message roles:', options.messages?.map(m => m.role).join(', '));
            console.log('[GeminiClient] Tools count:', options.tools?.length || 0);

            const response = await fetch('/api/gemini', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: options.model || 'gemini-3-pro-preview',
                messages: options.messages,
                tools: options.tools,
                temperature: options.temperature,
                maxOutputTokens: options.max_tokens,
              }),
            });

            console.log('[GeminiClient] Response status:', response.status);

            if (!response.ok) {
              const error = await response.json().catch(() => ({
                error: 'Unknown error',
                message: `HTTP ${response.status}`
              }));
              console.error('[GeminiClient] Error response:', error);

              // Throw error with rate limit info if available
              const err = new Error(error.message || 'Gemini API request failed');
              err.rateLimit = error.rateLimit;
              err.isRateLimit = response.status === 429;
              throw err;
            }

            const jsonResponse = await response.json();
            console.log('[GeminiClient] Success - has choices:', !!jsonResponse.choices);
            return jsonResponse;
          }

          // In Node.js (for tests): use Gemini directly
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable not set');
          }

          // Dynamic import of Google Generative AI for Node.js environment
          const { GoogleGenerativeAI } = await import('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(apiKey);

          // Extract system instruction from messages (Gemini uses systemInstruction parameter)
          const systemMessages = options.messages.filter(msg => msg.role === 'system');
          const systemInstruction = systemMessages.map(msg => msg.content).join('\n');

          // Filter out system messages for chat history
          const chatMessages = options.messages.filter(msg => msg.role !== 'system');

          const model = genAI.getGenerativeModel({
            model: options.model || 'gemini-3-pro-preview',
            systemInstruction: systemInstruction || undefined
          });

          // Convert messages to Gemini format (user/assistant only)
          const geminiContents = chatMessages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          }));

          const chat = model.startChat({
            history: geminiContents.slice(0, -1),
            generationConfig: {
              temperature: options.temperature,
              maxOutputTokens: options.max_tokens
            }
          });

          const lastMessage = geminiContents[geminiContents.length - 1];
          const result = await chat.sendMessage(lastMessage.parts[0].text);
          const response = await result.response;

          return {
            choices: [{
              message: {
                role: 'assistant',
                content: response.text()
              },
              finish_reason: 'stop'
            }],
            model: options.model || 'gemini-3-pro-preview'
          };
        }
      }
    };
  }
}

/**
 * Shared Gemini client instance
 */
export const gemini = new SecureGeminiClient();
