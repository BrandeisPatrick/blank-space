import { callLLM } from '../llm/llmClient.js';
import { MODELS } from '../../config/modelConfig.js';
import { MemoryBank } from '../memory/MemoryBank.js';

/**
 * Context Compressor
 *
 * Automatically compresses conversation history to prevent token exhaustion.
 * Inspired by Kilo Code's context management system.
 *
 * Features:
 * - Auto-summarize every N turns (default: 20)
 * - Store summaries in Memory Bank
 * - Provide compressed context to agents
 * - Track conversation metadata
 */

export class ContextCompressor {
  constructor(options = {}) {
    this.turnThreshold = options.turnThreshold || 20;
    this.maxSummaryLength = options.maxSummaryLength || 2000;
    this.memory = new MemoryBank();
    this.currentSession = {
      turns: [],
      turnCount: 0,
      summaries: [],
      startTime: new Date().toISOString()
    };
  }

  /**
   * Add a conversation turn
   * @param {Object} turn - { role: 'user'|'assistant', content: string, timestamp: string }
   * @returns {Promise<boolean>} - true if summarization was triggered
   */
  async addTurn(turn) {
    this.currentSession.turns.push({
      ...turn,
      timestamp: turn.timestamp || new Date().toISOString()
    });
    this.currentSession.turnCount++;

    // Check if we should summarize
    const shouldSummarize = this.currentSession.turnCount % this.turnThreshold === 0;

    if (shouldSummarize) {
      await this.summarizeAndCompress();
      return true;
    }

    return false;
  }

  /**
   * Summarize recent conversation and compress context
   */
  async summarizeAndCompress() {
    if (this.currentSession.turns.length === 0) {
      return null;
    }

    console.log(`🗜️ Compressing context (${this.currentSession.turnCount} turns)...`);

    try {
      // Get turns to summarize (last N turns since last summary)
      const turnsToSummarize = this.currentSession.turns;

      // Create summary using LLM
      const summary = await this.createSummary(turnsToSummarize);

      // Store summary
      const summaryObject = {
        timestamp: new Date().toISOString(),
        turnRange: {
          start: Math.max(0, this.currentSession.turnCount - this.turnThreshold),
          end: this.currentSession.turnCount
        },
        summary,
        turnCount: turnsToSummarize.length
      };

      this.currentSession.summaries.push(summaryObject);

      // Save to Memory Bank
      await this.saveSummaryToMemoryBank(summaryObject);

      // Clear compressed turns, keep only recent ones for context
      this.currentSession.turns = this.currentSession.turns.slice(-5);

      console.log(`✅ Context compressed: ${turnsToSummarize.length} turns → ${summary.length} chars`);

      return summaryObject;
    } catch (error) {
      console.error('Error compressing context:', error);
      return null;
    }
  }

  /**
   * Create summary using LLM
   */
  async createSummary(turns) {
    const conversationText = turns
      .map(t => `${t.role === 'user' ? 'User' : 'Assistant'}: ${t.content}`)
      .join('\n\n');

    const systemPrompt = `You are a conversation summarizer. Create a concise, factual summary of the conversation below.

Focus on:
- What the user requested
- What was implemented/changed
- Key technical decisions
- Any errors encountered and how they were fixed
- Current state and next steps

Keep the summary under ${this.maxSummaryLength} characters. Be specific and technical.`;

    const userPrompt = `Summarize this conversation:\n\n${conversationText}`;

    try {
      const summary = await callLLM({
        model: MODELS.ANALYZER || MODELS.PLANNER,
        systemPrompt,
        userPrompt,
        maxTokens: 1000,
        temperature: 0.3
      });

      return summary.trim();
    } catch (error) {
      console.error('Error creating summary:', error);
      // Fallback: create basic summary
      return this.createFallbackSummary(turns);
    }
  }

  /**
   * Create fallback summary without LLM
   */
  createFallbackSummary(turns) {
    const userMessages = turns.filter(t => t.role === 'user');
    const requests = userMessages.map(m => m.content.substring(0, 100)).join('; ');
    return `Session summary (${turns.length} turns): ${requests.substring(0, this.maxSummaryLength)}`;
  }

  /**
   * Save summary to Memory Bank
   */
  async saveSummaryToMemoryBank(summaryObject) {
    try {
      // Load existing summaries
      const existingSummaries = await this.memory.storage.read(
        'context/conversation-summaries.json',
        '[]',
        true
      );

      // Add new summary
      existingSummaries.push(summaryObject);

      // Keep only last 50 summaries
      const trimmed = existingSummaries.slice(-50);

      // Save back
      await this.memory.storage.write('context/conversation-summaries.json', trimmed);
    } catch (error) {
      console.warn('Failed to save summary to Memory Bank:', error.message);
    }
  }

  /**
   * Get compressed context for agents
   * Returns summaries + recent turns
   */
  getCompressedContext() {
    const summariesText = this.currentSession.summaries
      .map((s, i) => `[Summary ${i + 1} (turns ${s.turnRange.start}-${s.turnRange.end})]:\n${s.summary}`)
      .join('\n\n');

    const recentTurns = this.currentSession.turns
      .map(t => `${t.role === 'user' ? 'User' : 'Assistant'}: ${t.content}`)
      .join('\n\n');

    if (summariesText && recentTurns) {
      return `CONVERSATION HISTORY:\n\n${summariesText}\n\n---\n\nRECENT CONVERSATION:\n\n${recentTurns}`;
    } else if (summariesText) {
      return `CONVERSATION HISTORY:\n\n${summariesText}`;
    } else if (recentTurns) {
      return `RECENT CONVERSATION:\n\n${recentTurns}`;
    }

    return '';
  }

  /**
   * Get full conversation (uncompressed)
   * For debugging or final session save
   */
  getFullConversation() {
    return this.currentSession.turns;
  }

  /**
   * Get session metadata
   */
  getSessionMetadata() {
    return {
      startTime: this.currentSession.startTime,
      turnCount: this.currentSession.turnCount,
      summaryCount: this.currentSession.summaries.length,
      currentTurns: this.currentSession.turns.length
    };
  }

  /**
   * Load previous session summaries from Memory Bank
   */
  async loadPreviousSummaries(limit = 5) {
    try {
      const summaries = await this.memory.storage.read(
        'context/conversation-summaries.json',
        '[]',
        true
      );

      return summaries.slice(-limit);
    } catch (error) {
      console.warn('Failed to load previous summaries:', error.message);
      return [];
    }
  }

  /**
   * Clear current session (for testing or reset)
   */
  clearSession() {
    this.currentSession = {
      turns: [],
      turnCount: 0,
      summaries: [],
      startTime: new Date().toISOString()
    };
  }

  /**
   * Save final session summary to Memory Bank
   */
  async saveSessionSummary() {
    // Force final summarization if there are pending turns
    if (this.currentSession.turns.length > 0) {
      await this.summarizeAndCompress();
    }

    // Save session metadata
    const sessionSummary = {
      timestamp: new Date().toISOString(),
      startTime: this.currentSession.startTime,
      totalTurns: this.currentSession.turnCount,
      summaries: this.currentSession.summaries,
      duration: new Date() - new Date(this.currentSession.startTime)
    };

    try {
      await this.memory.storage.write('context/session-summary.json', sessionSummary);
      console.log('✅ Session summary saved to Memory Bank');
    } catch (error) {
      console.warn('Failed to save session summary:', error.message);
    }

    return sessionSummary;
  }
}

/**
 * Singleton instance (optional)
 */
let compressorInstance = null;

export function getContextCompressor(options = {}) {
  if (!compressorInstance) {
    compressorInstance = new ContextCompressor(options);
  }
  return compressorInstance;
}

export default ContextCompressor;
