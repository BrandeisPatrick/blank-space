/**
 * Web Search Tool
 * Searches the web for real-time information via the Chat API
 */

import { Tool } from '../Tool.js';
import { fetchWithRetry } from '../../utils/fetchWithRetry.js';
import { RETRY_CONFIGS, API_ENDPOINTS, AGENT_MODELS } from '../../config/apiConfig.js';

export const webSearchTool = new Tool({
  name: 'web_search',
  description: 'Search the web for real-time information like weather, news, prices, sports scores, etc.',
  parameters: {
    query: {
      type: 'string',
      description: 'The search query (e.g., "current temperature in Atlanta")',
      required: true
    }
  },
  execute: async (params) => {
    const { query } = params;

    if (!query) {
      return { success: false, error: 'Query is required' };
    }

    try {
      const response = await fetchWithRetry(API_ENDPOINTS.CHAT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: AGENT_MODELS.chat,
          messages: [{ role: 'user', content: query }],
          web_search: true
        })
      }, RETRY_CONFIGS.chat);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Web search request failed');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      const citations = data.citations || [];

      if (!content) {
        return { success: false, error: 'No results returned from web search' };
      }

      return { success: true, result: content, citations };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

export default webSearchTool;
