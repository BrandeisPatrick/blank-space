/**
 * Chat Agent
 * Handles general conversation using OpenAI with web search
 */

import { CHAT_SYSTEM_PROMPT } from '../../../prompts/index.js';
import { fetchWithRetry } from '../../../utils/fetchWithRetry.js';

// Retry configuration for chat API calls
const CHAT_RETRY_CONFIG = {
  timeout: 45000,
  maxRetries: 3,
  baseDelay: 1000,
  context: 'Chat Agent'
};

/**
 * Process a chat message using OpenAI with web search
 *
 * @param {string} userMessage - User's message
 * @param {Function} onUpdate - Callback for streaming updates
 * @param {Object} options - Additional options
 * @param {Array} files - Optional files (images, PDFs)
 * @returns {Promise<Object>} Result with {success, response}
 */
export async function processWithChatAgent(userMessage, onUpdate = null, options = {}, files = null) {
  const { conversationHistory = [] } = options;

  const sendUpdate = (update) => {
    if (onUpdate) {
      onUpdate(update);
    }
  };

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

  // Add conversation history
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
    const content = [
      { type: 'text', text: userMessage || 'What is in these files?' }
    ];

    files.forEach(file => {
      if (file.mimeType.startsWith('image/')) {
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:${file.mimeType};base64,${file.base64}`
          }
        });
      } else {
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
        web_search: true
      })
    }, CHAT_RETRY_CONFIG);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Chat request failed');
    }

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content;
    const citations = data.citations || [];

    if (!responseContent) {
      console.error('[Chat Agent] Empty response:', JSON.stringify(data, null, 2));
      const errorContent = 'Unable to get a response. Please try again.';
      sendUpdate({ type: 'assistant', content: errorContent });
      return { success: false, response: errorContent };
    }

    // Format response with citations if available
    let finalContent = responseContent;
    if (citations.length > 0) {
      finalContent += '\n\n**Sources:**\n';
      citations.forEach((citation, i) => {
        finalContent += `${i + 1}. [${citation.title}](${citation.url})\n`;
      });
    }

    sendUpdate({
      type: 'assistant',
      content: finalContent
    });

    return {
      success: true,
      intent: 'chat',
      fileOperations: [],
      response: finalContent
    };

  } catch (error) {
    console.error('[Chat Agent] Error:', error.message);

    const fallbackContent = 'Something went wrong. Please try again.';
    sendUpdate({
      type: 'assistant',
      content: fallbackContent
    });

    return {
      success: false,
      fileOperations: [],
      response: fallbackContent
    };
  }
}

export default { processWithChatAgent };
