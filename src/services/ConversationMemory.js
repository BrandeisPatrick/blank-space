/**
 * Conversation Memory System
 * Remembers context within a session to handle follow-up requests
 * Enables pronoun resolution and context-aware responses
 */

/**
 * ConversationMemory Class
 * Stores and retrieves conversation history and extracted entities
 */
export class ConversationMemory {
  constructor(maxTurns = 10) {
    this.maxTurns = maxTurns;
    this.conversationHistory = []; // Array of {role, message, timestamp, entities}
    this.extractedEntities = {
      files: new Set(), // File names mentioned
      colors: new Set(), // Colors mentioned
      features: new Set(), // Features mentioned
      components: new Set(), // Components mentioned
      lastCreatedFiles: [], // Most recently created files
      lastModifiedFiles: [], // Most recently modified files
      lastMentionedFile: null // Most recently referenced file
    };
    this.sessionStartTime = Date.now();
  }

  /**
   * Add a turn to the conversation history
   * @param {string} role - 'user' | 'assistant'
   * @param {string} message - Message content
   * @param {Object} metadata - Additional metadata (intent, plan, etc.)
   */
  addTurn(role, message, metadata = {}) {
    const entities = this.extractEntities(message);

    const turn = {
      role,
      message,
      timestamp: Date.now(),
      entities,
      metadata
    };

    this.conversationHistory.push(turn);

    // Update extracted entities
    this.mergeEntities(entities);

    // Trim history if too long
    if (this.conversationHistory.length > this.maxTurns) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxTurns);
    }

    return turn;
  }

  /**
   * Extract entities from a message
   * @param {string} message - Message to analyze
   * @returns {Object} Extracted entities
   */
  extractEntities(message) {
    const entities = {
      files: [],
      colors: [],
      features: [],
      components: []
    };

    const messageLower = message.toLowerCase();

    // Extract file names (common patterns)
    const filePatterns = [
      /(\w+\.(jsx?|tsx?|css|html))/gi,
      /(App|Header|Footer|Sidebar|Button|Card|Form|Input|List)\.(jsx?|tsx?)/gi
    ];

    filePatterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) {
        entities.files.push(...matches);
      }
    });

    // Extract colors
    const colorWords = [
      'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'cyan',
      'teal', 'indigo', 'violet', 'magenta', 'lime', 'emerald', 'rose',
      'amber', 'slate', 'gray', 'white', 'black', 'dark', 'light'
    ];

    colorWords.forEach(color => {
      if (messageLower.includes(color)) {
        entities.colors.push(color);
      }
    });

    // Extract feature keywords
    const featureKeywords = [
      'todo', 'task', 'form', 'button', 'input', 'card', 'list', 'table',
      'modal', 'dialog', 'dropdown', 'menu', 'navbar', 'sidebar', 'footer',
      'header', 'search', 'filter', 'sort', 'pagination', 'authentication',
      'login', 'signup', 'profile', 'settings', 'dashboard', 'chart', 'graph'
    ];

    featureKeywords.forEach(keyword => {
      if (messageLower.includes(keyword)) {
        entities.features.push(keyword);
      }
    });

    // Extract component names (capitalized words)
    const componentPattern = /\b([A-Z][a-zA-Z]+(?:List|Form|Button|Card|Item|Panel|View|Page))\b/g;
    const components = message.match(componentPattern);
    if (components) {
      entities.components.push(...components);
    }

    return entities;
  }

  /**
   * Merge extracted entities into global entity store
   * @param {Object} entities - Entities to merge
   */
  mergeEntities(entities) {
    entities.files.forEach(file => this.extractedEntities.files.add(file));
    entities.colors.forEach(color => this.extractedEntities.colors.add(color));
    entities.features.forEach(feature => this.extractedEntities.features.add(feature));
    entities.components.forEach(comp => this.extractedEntities.components.add(comp));
  }

  /**
   * Record file operations for reference tracking
   * @param {Array} fileOperations - Array of {type, filename, ...}
   */
  recordFileOperations(fileOperations) {
    const created = fileOperations.filter(op => op.type === 'create').map(op => op.filename);
    const modified = fileOperations.filter(op => op.type === 'modify').map(op => op.filename);

    if (created.length > 0) {
      this.extractedEntities.lastCreatedFiles = created;
      this.extractedEntities.lastMentionedFile = created[created.length - 1];
    }

    if (modified.length > 0) {
      this.extractedEntities.lastModifiedFiles = modified;
      this.extractedEntities.lastMentionedFile = modified[modified.length - 1];
    }
  }

  /**
   * Resolve pronouns and context references in user message
   * @param {string} message - User message
   * @returns {string} Resolved message with context
   */
  resolveReferences(message) {
    let resolved = message;

    // Resolve "it" to last mentioned file/component (prefer first created over last)
    if (/\bit\b/i.test(message) && this.extractedEntities.lastMentionedFile) {
      // Prefer first created file (usually the main file like App.jsx)
      const replacement = this.extractedEntities.lastCreatedFiles.length > 0
        ? this.extractedEntities.lastCreatedFiles[0]  // Use first created file
        : this.extractedEntities.lastMentionedFile;
      resolved = resolved.replace(/\bit\b/gi, `"${replacement}"`);
    }

    // Resolve "them" to last created files
    if (/\bthem\b/i.test(message) && this.extractedEntities.lastCreatedFiles.length > 0) {
      const files = this.extractedEntities.lastCreatedFiles.join(', ');
      resolved = resolved.replace(/\bthem\b/gi, `the files (${files})`);
    }

    // Resolve "that" to last created component
    if (/\bthat\b/i.test(message) && this.extractedEntities.lastCreatedFiles.length > 0) {
      const lastFile = this.extractedEntities.lastCreatedFiles[this.extractedEntities.lastCreatedFiles.length - 1];
      resolved = resolved.replace(/\bthat\b/gi, lastFile);
    }

    // Resolve "the app" context
    if (/the app/i.test(message) && this.extractedEntities.lastCreatedFiles.length > 0) {
      resolved += ` (referring to files: ${this.extractedEntities.lastCreatedFiles.join(', ')})`;
    }

    return resolved;
  }

  /**
   * Get context summary for including in agent prompts
   * @returns {string} Context summary
   */
  getContextSummary() {
    const recentTurns = this.conversationHistory.slice(-3);
    let summary = '';

    if (recentTurns.length > 0) {
      summary += 'Recent conversation:\n';
      recentTurns.forEach((turn, i) => {
        summary += `${i + 1}. ${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.message.substring(0, 100)}...\n`;
      });
    }

    if (this.extractedEntities.lastCreatedFiles.length > 0) {
      summary += `\nLast created files: ${this.extractedEntities.lastCreatedFiles.join(', ')}`;
    }

    if (this.extractedEntities.lastModifiedFiles.length > 0) {
      summary += `\nLast modified files: ${this.extractedEntities.lastModifiedFiles.join(', ')}`;
    }

    const colors = Array.from(this.extractedEntities.colors);
    if (colors.length > 0) {
      summary += `\nColors mentioned: ${colors.join(', ')}`;
    }

    const features = Array.from(this.extractedEntities.features);
    if (features.length > 0) {
      summary += `\nFeatures discussed: ${features.slice(0, 5).join(', ')}`;
    }

    return summary;
  }

  /**
   * Get last N messages
   * @param {number} count - Number of messages
   * @returns {Array} Last N messages
   */
  getRecentMessages(count = 5) {
    return this.conversationHistory.slice(-count);
  }

  /**
   * Clear conversation history
   */
  clear() {
    this.conversationHistory = [];
    this.extractedEntities = {
      files: new Set(),
      colors: new Set(),
      features: new Set(),
      components: new Set(),
      lastCreatedFiles: [],
      lastModifiedFiles: [],
      lastMentionedFile: null
    };
  }

  /**
   * Get conversation statistics
   * @returns {Object} Stats
   */
  getStats() {
    return {
      turnCount: this.conversationHistory.length,
      userTurns: this.conversationHistory.filter(t => t.role === 'user').length,
      assistantTurns: this.conversationHistory.filter(t => t.role === 'assistant').length,
      sessionDuration: Math.round((Date.now() - this.sessionStartTime) / 1000), // seconds
      filesDiscussed: this.extractedEntities.files.size,
      colorsDiscussed: this.extractedEntities.colors.size,
      featuresDiscussed: this.extractedEntities.features.size
    };
  }
}

/**
 * Global conversation memory instance (singleton)
 */
let globalMemory = null;

/**
 * Get or create global conversation memory
 * @returns {ConversationMemory} Global memory instance
 */
export function getConversationMemory() {
  if (!globalMemory) {
    globalMemory = new ConversationMemory();
  }
  return globalMemory;
}

/**
 * Reset global conversation memory
 */
export function resetConversationMemory() {
  if (globalMemory) {
    globalMemory.clear();
  } else {
    globalMemory = new ConversationMemory();
  }
}

export default {
  ConversationMemory,
  getConversationMemory,
  resetConversationMemory
};
