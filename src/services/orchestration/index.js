/**
 * Orchestration Router
 * Routes requests based on intent:
 * - create/debug intent → Gemini (code generation)
 * - chat intent → OpenAI with web search (conversation)
 */

import { processWithGemini } from './providers/gemini/index.js';
import { classifyIntent } from '../intentClassifier.js';
import { CHAT_SYSTEM_PROMPT } from '../prompts/index.js';
import { fetchWithRetry } from '../utils/fetchWithRetry.js';

// Retry configuration for chat API calls (web search may be slow)
const CHAT_RETRY_CONFIG = {
  timeout: 45000,    // 45s timeout for chat with web search
  maxRetries: 3,
  baseDelay: 1000,
  context: 'Chat Handler'
};

/**
 * Process a user message through the appropriate LLM provider
 * Routes based on intent classification:
 * - create/debug → Gemini for code generation
 * - chat → OpenAI with web search for conversation
 *
 * Intent is only classified once at conversation start.
 * Subsequent messages use the stored conversationIntent.
 *
 * @param {string} userMessage - User's request
 * @param {Object} currentFiles - Current file map {filename: content}
 * @param {Function} onUpdate - Callback for streaming updates
 * @param {Object} options - Additional options (modelTier, conversationIntent, etc.)
 * @returns {Promise<Object>} Result with {success, fileOperations, intent}
 */
export async function processMessage(userMessage, currentFiles = {}, onUpdate = null, options = {}) {
  const { modelTier = 'lite', conversationIntent = null, images = null } = options;

  // Callback wrapper for updates
  const sendUpdate = (update) => {
    if (onUpdate) {
      onUpdate(update);
    }
  };

  let intent;

  // Use stored intent if conversation already has one, otherwise classify
  if (conversationIntent) {
    intent = conversationIntent;
    console.log(`[Orchestration] Using stored intent: ${intent}`);
  } else {
    // First message - classify intent
    const hasExistingFiles = Object.keys(currentFiles).length > 0;
    const intentResult = await classifyIntent(userMessage, hasExistingFiles);
    intent = intentResult.intent;
    console.log(`[Orchestration] New conversation intent: "${userMessage.slice(0, 50)}..." → ${intent} (${intentResult.source})`);
  }

  // Route based on intent and show agent info
  if (intent === 'chat') {
    // Chat intent → OpenAI with web search
    const llmModel = 'gpt-5-mini';
    sendUpdate({
      type: 'intent',
      content: ['Agent: Chat', `LLM: ${llmModel}`]
    });
    console.log(`[Orchestration] Routing to OpenAI (chat with web search)${images ? ' with images' : ''}`);
    return handleChatIntent(userMessage, sendUpdate, options, intent, images);
  } else {
    // Create/debug intent → Gemini for code generation
    const agentName = intent === 'create' ? 'Code' : 'Debug';
    const llmModel = modelTier === 'pro' ? 'gemini-3-pro' : 'gemini-3-flash';
    sendUpdate({
      type: 'intent',
      content: [`Agent: ${agentName}`, `LLM: ${llmModel}`]
    });
    console.log(`[Orchestration] Routing to Gemini (code generation, tier: ${modelTier})${images ? ' with images' : ''}`);
    const result = await processWithGemini(userMessage, currentFiles, onUpdate, { ...options, images });
    return { ...result, intent };
  }
}

/**
 * Handle chat intent using OpenAI with web search
 * Uses gpt-5-mini with web_search_preview for real-time information
 */
async function handleChatIntent(userMessage, sendUpdate, options, intent, files = null) {
  const { conversationHistory = [] } = options;

  // Determine what types of files we have
  const hasFiles = files && files.length > 0;
  const fileTypes = hasFiles ? [...new Set(files.map(f => f.mimeType.split('/')[0]))] : [];
  const hasImages = fileTypes.includes('image');
  const hasDocs = files?.some(f =>
    f.mimeType === 'application/pdf' ||
    f.mimeType.includes('document') ||
    f.mimeType.includes('text')
  );

  let actionText = 'Searching and thinking...';
  if (hasImages && hasDocs) actionText = 'Analyzing files...';
  else if (hasImages) actionText = 'Analyzing image...';
  else if (hasDocs) actionText = 'Reading document...';

  sendUpdate({
    type: 'tool_action',
    action: actionText
  });

  // Build messages with conversation history
  const messages = [
    { role: 'system', content: CHAT_SYSTEM_PROMPT }
  ];

  // Add conversation history (convert to OpenAI format)
  conversationHistory.forEach(msg => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }
  });

  // Add current user message (with files if provided)
  if (hasFiles) {
    // Format as multimodal content for OpenAI
    // OpenAI supports images via image_url and files via file object
    const content = [
      { type: 'text', text: userMessage || 'What is in these files?' }
    ];

    files.forEach(file => {
      if (file.mimeType.startsWith('image/')) {
        // Images use image_url format
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:${file.mimeType};base64,${file.base64}`
          }
        });
      } else {
        // PDFs and documents use file format (OpenAI's newer format)
        // For models that support it, send as input_file
        content.push({
          type: 'file',
          file: {
            filename: file.filename || file.path || 'document',
            file_data: `data:${file.mimeType};base64,${file.base64}`
          }
        });
      }
    });

    messages.push({ role: 'user', content });
  } else {
    messages.push({ role: 'user', content: userMessage });
  }

  try {
    const response = await fetchWithRetry('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages,
        max_tokens: 4096,
        web_search: true  // Enable web search
      })
    }, CHAT_RETRY_CONFIG);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Chat request failed');
    }

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content;
    const citations = data.citations || [];

    // Handle empty response
    if (!responseContent) {
      console.error('[Orchestration] Empty chat response:', JSON.stringify(data, null, 2));
      const errorContent = 'Unable to get a response. Please try again.';
      sendUpdate({ type: 'assistant', content: errorContent });
      return { success: false, intent, fileOperations: [], response: errorContent };
    }

    // Format response with citations if available
    let finalContent = responseContent;
    if (citations.length > 0) {
      finalContent += '\n\n**Sources:**\n';
      citations.forEach((citation, i) => {
        finalContent += `${i + 1}. [${citation.title}](${citation.url})\n`;
      });
    }

    // Send the chat response as an assistant message
    sendUpdate({
      type: 'assistant',
      content: finalContent
    });

    return {
      success: true,
      intent,
      fileOperations: [], // No file changes for chat
      response: finalContent
    };

  } catch (error) {
    console.error('[Orchestration] Chat error:', error.message);

    // Simple error response
    const fallbackContent = 'Something went wrong. Please try again.';
    sendUpdate({
      type: 'assistant',
      content: fallbackContent
    });

    return {
      success: false,
      intent,
      fileOperations: [],
      response: fallbackContent
    };
  }
}

export default { processMessage };
