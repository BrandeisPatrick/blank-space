import fs from 'fs';
import path from 'path';
import { ContextCompressor } from '../compression/ContextCompressor.js';

/**
 * Conversation Logger
 *
 * Logs all LLM interactions for debugging, performance tracking, and fixture generation
 * Saves to .logs/conversations/{YYYY-MM-DD}/{timestamp}-{agent}.json
 *
 * Now with context compression support to prevent token exhaustion
 */

/**
 * Model pricing (per 1M tokens)
 * Updated as of October 2024
 */
const MODEL_PRICING = {
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-5-mini': { input: 2.50, output: 10.00 },  // Assume same as gpt-4o for now
  'gpt-5-nano': { input: 0.15, output: 0.60 },   // Assume same as gpt-4o-mini for now
};

/**
 * Calculate cost for a model and token usage
 */
function calculateCost(model, promptTokens, completionTokens) {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4o-mini'];
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Get environment-safe method to check if we're in browser
 */
function isBrowser() {
  return typeof window !== 'undefined';
}

/**
 * ConversationLogger class
 */
export class ConversationLogger {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.logLevel = options.logLevel || 'INFO'; // DEBUG, INFO, ERROR
    this.sessionId = options.sessionId || Date.now().toString();
    this.agentName = options.agentName || 'unknown';
    this.conversations = [];
    this.currentRequest = null;
    this.startTime = null;

    // Context compression support
    this.compressionEnabled = options.compressionEnabled !== false;
    this.compressor = this.compressionEnabled ? new ContextCompressor({
      turnThreshold: options.turnThreshold || 20,
      maxSummaryLength: options.maxSummaryLength || 2000
    }) : null;
  }

  /**
   * Log LLM request (before API call)
   */
  logRequest({ model, systemPrompt, userPrompt, maxTokens, temperature }) {
    if (!this.enabled) return;

    this.startTime = Date.now();
    this.currentRequest = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      agent: this.agentName,
      model,
      request: {
        systemPrompt: this._truncate(systemPrompt, 1000),
        userPrompt: this._truncate(userPrompt, 1000),
        systemPromptLength: systemPrompt?.length || 0,
        userPromptLength: userPrompt?.length || 0,
        maxTokens,
        temperature
      }
    };

    if (this.logLevel === 'DEBUG') {
      console.log(`\n📝 [${this.agentName}] LLM Request:`, {
        model,
        promptLength: this.currentRequest.request.systemPromptLength + this.currentRequest.request.userPromptLength,
        maxTokens
      });
    }
  }

  /**
   * Log LLM response (after API call)
   */
  logResponse({ response, error = null }) {
    if (!this.enabled || !this.currentRequest) return;

    const duration = Date.now() - this.startTime;

    if (error) {
      this.currentRequest.error = {
        message: error.message,
        status: error.status,
        code: error.code,
        duration
      };

      if (this.logLevel === 'DEBUG' || this.logLevel === 'ERROR') {
        console.error(`\n❌ [${this.agentName}] LLM Error:`, {
          message: error.message,
          duration: `${duration}ms`
        });
      }
    } else {
      const content = response?.choices?.[0]?.message?.content || '';
      const usage = response?.usage || {};
      const model = response?.model || this.currentRequest.model;

      this.currentRequest.response = {
        content: this._truncate(content, 2000),
        contentLength: content.length,
        finishReason: response?.choices?.[0]?.finish_reason,
        usage: {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0
        },
        cost: calculateCost(
          model,
          usage.prompt_tokens || 0,
          usage.completion_tokens || 0
        ),
        duration
      };

      if (this.logLevel === 'DEBUG' || this.logLevel === 'INFO') {
        console.log(`\n✅ [${this.agentName}] LLM Response:`, {
          tokens: this.currentRequest.response.usage.totalTokens,
          cost: `$${this.currentRequest.response.cost.toFixed(4)}`,
          duration: `${duration}ms`,
          contentLength: content.length
        });
      }
    }

    this.conversations.push({ ...this.currentRequest });
    this.currentRequest = null;
  }

  /**
   * Get all conversations in this session
   */
  getConversations() {
    return this.conversations;
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const totalTokens = this.conversations.reduce((sum, conv) =>
      sum + (conv.response?.usage?.totalTokens || 0), 0
    );

    const totalCost = this.conversations.reduce((sum, conv) =>
      sum + (conv.response?.cost || 0), 0
    );

    const totalDuration = this.conversations.reduce((sum, conv) =>
      sum + (conv.response?.duration || conv.error?.duration || 0), 0
    );

    const errors = this.conversations.filter(conv => conv.error).length;

    return {
      sessionId: this.sessionId,
      agent: this.agentName,
      totalCalls: this.conversations.length,
      totalTokens,
      totalCost,
      totalDuration,
      errors,
      avgTokensPerCall: this.conversations.length > 0 ? totalTokens / this.conversations.length : 0,
      avgCostPerCall: this.conversations.length > 0 ? totalCost / this.conversations.length : 0,
      avgDurationPerCall: this.conversations.length > 0 ? totalDuration / this.conversations.length : 0
    };
  }

  /**
   * Save conversations to file
   * Only works in Node.js environment (not browser)
   */
  async saveToFile() {
    if (isBrowser() || !this.enabled) return;
    if (this.conversations.length === 0) return;

    try {
      // Create directory structure: .logs/conversations/YYYY-MM-DD/
      const date = new Date().toISOString().split('T')[0];
      const logDir = path.join(process.cwd(), '.logs', 'conversations', date);

      // Create directory if it doesn't exist
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Create filename: timestamp-agent.json
      const timestamp = Date.now();
      const filename = `${timestamp}-${this.agentName}.json`;
      const filepath = path.join(logDir, filename);

      // Save conversations + summary
      const data = {
        summary: this.getSummary(),
        conversations: this.conversations
      };

      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

      if (this.logLevel === 'DEBUG') {
        console.log(`\n💾 Saved conversation log: ${filepath}`);
      }

      return filepath;
    } catch (error) {
      console.error('Failed to save conversation log:', error);
    }
  }

  /**
   * Truncate long strings for logging
   */
  _truncate(str, maxLength) {
    if (!str) return str;
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '... [truncated]';
  }

  /**
   * Print summary to console
   */
  printSummary() {
    const summary = this.getSummary();
    console.log('\n📊 Conversation Summary:');
    console.log('━'.repeat(50));
    console.log(`Session ID:        ${summary.sessionId}`);
    console.log(`Agent:             ${summary.agent}`);
    console.log(`Total Calls:       ${summary.totalCalls}`);
    console.log(`Total Tokens:      ${summary.totalTokens.toLocaleString()}`);
    console.log(`Total Cost:        $${summary.totalCost.toFixed(4)}`);
    console.log(`Total Duration:    ${(summary.totalDuration / 1000).toFixed(2)}s`);
    console.log(`Errors:            ${summary.errors}`);
    console.log(`Avg Tokens/Call:   ${Math.round(summary.avgTokensPerCall)}`);
    console.log(`Avg Cost/Call:     $${summary.avgCostPerCall.toFixed(4)}`);
    console.log(`Avg Duration/Call: ${Math.round(summary.avgDurationPerCall)}ms`);
    console.log('━'.repeat(50));
  }

  /**
   * Add user turn to conversation (for context compression)
   */
  async addUserTurn(content) {
    if (!this.compressor) return;

    const summarized = await this.compressor.addTurn({
      role: 'user',
      content
    });

    if (summarized && this.logLevel === 'DEBUG') {
      const metadata = this.compressor.getSessionMetadata();
      console.log(`🗜️ Context compressed at turn ${metadata.turnCount}`);
    }
  }

  /**
   * Add assistant turn to conversation (for context compression)
   */
  async addAssistantTurn(content) {
    if (!this.compressor) return;

    const summarized = await this.compressor.addTurn({
      role: 'assistant',
      content
    });

    if (summarized && this.logLevel === 'DEBUG') {
      const metadata = this.compressor.getSessionMetadata();
      console.log(`🗜️ Context compressed at turn ${metadata.turnCount}`);
    }
  }

  /**
   * Get compressed context for prompts
   * Returns summaries + recent conversation
   */
  getCompressedContext() {
    if (!this.compressor) return '';
    return this.compressor.getCompressedContext();
  }

  /**
   * Get compression metadata
   */
  getCompressionMetadata() {
    if (!this.compressor) return null;
    return this.compressor.getSessionMetadata();
  }

  /**
   * Save final session and compression summary
   */
  async saveSession() {
    if (this.compressor) {
      await this.compressor.saveSessionSummary();
    }
    return await this.saveToFile();
  }
}

/**
 * Create a logger instance
 */
export function createLogger(agentName, options = {}) {
  return new ConversationLogger({
    agentName,
    ...options
  });
}

export default ConversationLogger;
