/**
 * Chat Agent
 * Handles general conversation using OpenAI with web search
 */

import { CHAT_SYSTEM_PROMPT } from '../../../prompts/index.js';
import { fetchWithRetry } from '../../../utils/fetchWithRetry.js';
import { RETRY_CONFIGS, API_ENDPOINTS, AGENT_MODELS } from '../../../config/apiConfig.js';
import { formatFilesForOpenAI, analyzeFileTypes, getFileActionText } from '../../../utils/fileFormatters.js';

const retryConfig = RETRY_CONFIGS.chat;

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

  const sendUpdate = (update) => onUpdate?.(update);

  const fileAnalysis = analyzeFileTypes(files);
  sendUpdate({
    type: 'tool_action',
    action: getFileActionText(fileAnalysis)
  });

  // Build messages with conversation history
  const messages = [{ role: 'system', content: CHAT_SYSTEM_PROMPT }];

  conversationHistory.forEach(msg => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: msg.content });
    }
  });

  // Add current user message (with files if provided)
  if (fileAnalysis.hasFiles) {
    const content = formatFilesForOpenAI(userMessage || 'What is in these files?', files);
    messages.push({ role: 'user', content });
  } else {
    messages.push({ role: 'user', content: userMessage });
  }

  try {
    const response = await fetchWithRetry(API_ENDPOINTS.CHAT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AGENT_MODELS.chat,
        messages,
        max_tokens: 4096,
        web_search: true
      })
    }, retryConfig);

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

    sendUpdate({ type: 'assistant', content: finalContent });

    return {
      success: true,
      intent: 'chat',
      fileOperations: [],
      response: finalContent
    };

  } catch (error) {
    console.error('[Chat Agent] Error:', error.message);

    const fallbackContent = 'Something went wrong. Please try again.';
    sendUpdate({ type: 'assistant', content: fallbackContent });

    return {
      success: false,
      fileOperations: [],
      response: fallbackContent
    };
  }
}

export default { processWithChatAgent };
