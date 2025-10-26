/**
 * Memory Bank
 * Persistent memory system for agents across sessions
 *
 * Features:
 * - Load global and project-specific rules
 * - Save/load session summaries for context compression
 * - Record bug patterns for learning
 * - Works in both browser (localStorage) and Node.js (file system)
 *
 * Pattern from: Kilo Code's .kilocode/ folder
 */

/**
 * Storage adapter - abstracts browser vs Node.js storage
 */
class StorageAdapter {
  constructor() {
    this.isBrowser = typeof window !== 'undefined';
    this.storagePrefix = 'agent-memory:';
  }

  /**
   * Read a file/key
   * @param {string} path - Path relative to .agent-memory/
   * @param {string} defaultValue - Default if not found
   * @param {boolean} parseJSON - Whether to parse as JSON
   * @returns {any} Content
   */
  async read(path, defaultValue = '', parseJSON = false) {
    if (this.isBrowser) {
      // Browser: Try localStorage first, then fetch from filesystem
      const key = this.storagePrefix + path;
      const cachedValue = localStorage.getItem(key);

      if (cachedValue !== null) {
        return parseJSON ? JSON.parse(cachedValue) : cachedValue;
      }

      // Try to fetch from public directory (for prompt files)
      try {
        const response = await fetch(`/.agent-memory/${path}`);
        if (response.ok) {
          const content = await response.text();
          // Cache it for future use
          localStorage.setItem(key, content);
          return parseJSON ? JSON.parse(content) : content;
        }
      } catch (error) {
        console.warn(`Failed to fetch /.agent-memory/${path}:`, error.message);
      }

      // Fallback to default
      return parseJSON ? JSON.parse(defaultValue) : defaultValue;
    } else {
      // Node.js: use file system
      const fs = await import('fs');
      const pathModule = await import('path');
      const fullPath = pathModule.join('.agent-memory', path);

      if (!fs.existsSync(fullPath)) {
        return parseJSON ? JSON.parse(defaultValue) : defaultValue;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      return parseJSON ? JSON.parse(content) : content;
    }
  }

  /**
   * Write a file/key
   * @param {string} path - Path relative to .agent-memory/
   * @param {any} content - Content to write (string or object)
   */
  async write(path, content) {
    const data = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

    if (this.isBrowser) {
      // Browser: use localStorage
      const key = this.storagePrefix + path;
      localStorage.setItem(key, data);
    } else {
      // Node.js: use file system
      const fs = await import('fs');
      const pathModule = await import('path');
      const fullPath = pathModule.join('.agent-memory', path);

      // Ensure directory exists
      const dir = pathModule.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, data, 'utf-8');
    }
  }

  /**
   * Check if a file/key exists
   * @param {string} path
   * @returns {Promise<boolean>}
   */
  async exists(path) {
    if (this.isBrowser) {
      const key = this.storagePrefix + path;
      return localStorage.getItem(key) !== null;
    } else {
      const fs = await import('fs');
      const pathModule = await import('path');
      const fullPath = pathModule.join('.agent-memory', path);
      return fs.existsSync(fullPath);
    }
  }
}

/**
 * Memory Bank - Main API
 */
export class MemoryBank {
  constructor() {
    this.storage = new StorageAdapter();
  }

  /**
   * Load global and project rules into system prompt
   * This should be called by agents to inject persistent rules
   * @returns {Promise<string>} Combined rules as markdown
   */
  async loadRules() {
    const globalRules = await this.storage.read('rules/global.md', '');
    const projectRules = await this.storage.read('rules/project.md', '');

    const combined = [globalRules, projectRules].filter(r => r.trim()).join('\n\n---\n\n');

    return combined || 'No persistent rules found.';
  }

  /**
   * Load only global rules
   * @returns {Promise<string>}
   */
  async loadGlobalRules() {
    return await this.storage.read('rules/global.md', '');
  }

  /**
   * Load only project rules
   * @returns {Promise<string>}
   */
  async loadProjectRules() {
    return await this.storage.read('rules/project.md', '');
  }

  /**
   * Save conversation summary for context compression
   * @param {Object} summary - Summary data
   * @param {string} summary.text - Summary text
   * @param {number} summary.messageCount - Number of messages summarized
   * @param {string} summary.timestamp - ISO timestamp
   */
  async saveSessionSummary(summary) {
    const summaryData = {
      text: summary.text || summary,
      messageCount: summary.messageCount || 0,
      timestamp: summary.timestamp || new Date().toISOString()
    };

    await this.storage.write('context/session-summary.json', summaryData);
  }

  /**
   * Load previous session context
   * @returns {Promise<Object>} Session summary
   */
  async loadSessionContext() {
    return await this.storage.read('context/session-summary.json', '{}', true);
  }

  /**
   * Clear session summary (e.g., at start of new session)
   */
  async clearSessionContext() {
    await this.storage.write('context/session-summary.json', {
      text: '',
      messageCount: 0,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Record a bug pattern for learning
   * This builds up a knowledge base of common bugs and fixes
   * @param {string} bugType - Type of bug (e.g., 'browser-incompatible')
   * @param {string} pattern - Pattern that caused bug (e.g., 'require() usage')
   * @param {string} fix - How it was fixed
   * @param {string} file - File where bug occurred
   */
  async recordBugPattern(bugType, pattern, fix, file = 'unknown') {
    const patterns = await this.storage.read('learnings/bug-patterns.json', '[]', true);

    patterns.push({
      timestamp: new Date().toISOString(),
      bugType,
      pattern,
      fix,
      file
    });

    // Keep only last 100 patterns to avoid bloat
    const trimmed = patterns.slice(-100);

    await this.storage.write('learnings/bug-patterns.json', trimmed);
  }

  /**
   * Get all recorded bug patterns
   * @returns {Promise<Array>} Bug patterns
   */
  async getBugPatterns() {
    return await this.storage.read('learnings/bug-patterns.json', '[]', true);
  }

  /**
   * Get bug patterns by type
   * @param {string} bugType - Type to filter by
   * @returns {Promise<Array>}
   */
  async getBugPatternsByType(bugType) {
    const patterns = await this.getBugPatterns();
    return patterns.filter(p => p.bugType === bugType);
  }

  /**
   * Get most common bug patterns (sorted by frequency)
   * @param {number} limit - Max number to return
   * @returns {Promise<Array>}
   */
  async getCommonBugPatterns(limit = 10) {
    const patterns = await this.getBugPatterns();

    // Count occurrences by bugType
    const counts = {};
    patterns.forEach(p => {
      counts[p.bugType] = (counts[p.bugType] || 0) + 1;
    });

    // Sort by frequency
    const sorted = Object.entries(counts)
      .map(([bugType, count]) => ({
        bugType,
        count,
        examples: patterns.filter(p => p.bugType === bugType).slice(-3) // Last 3 examples
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return sorted;
  }

  /**
   * Save codebase context (file structure, key components)
   * Useful for large projects to avoid re-scanning
   * @param {Object} context - Codebase context
   */
  async saveCodebaseContext(context) {
    await this.storage.write('context/codebase-map.json', {
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Load codebase context
   * @returns {Promise<Object>}
   */
  async loadCodebaseContext() {
    return await this.storage.read('context/codebase-map.json', '{}', true);
  }

  /**
   * Get memory statistics
   * @returns {Promise<Object>} Stats
   */
  async getStats() {
    const sessionContext = await this.loadSessionContext();
    const bugPatterns = await this.getBugPatterns();
    const codebaseContext = await this.loadCodebaseContext();

    return {
      sessionSummary: {
        exists: !!sessionContext.text,
        messageCount: sessionContext.messageCount || 0,
        lastUpdated: sessionContext.timestamp || null
      },
      bugPatterns: {
        total: bugPatterns.length,
        types: [...new Set(bugPatterns.map(p => p.bugType))],
        mostRecent: bugPatterns.slice(-5)
      },
      codebaseContext: {
        exists: !!codebaseContext.timestamp,
        lastUpdated: codebaseContext.timestamp || null
      },
      storageMode: this.storage.isBrowser ? 'browser (localStorage)' : 'filesystem'
    };
  }

  /**
   * Export all memory data (for backup/debugging)
   * @returns {Promise<Object>}
   */
  async exportAll() {
    return {
      rules: {
        global: await this.loadGlobalRules(),
        project: await this.loadProjectRules()
      },
      context: {
        session: await this.loadSessionContext(),
        codebase: await this.loadCodebaseContext()
      },
      learnings: {
        bugPatterns: await this.getBugPatterns()
      },
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import memory data (for restore/migration)
   * @param {Object} data - Data from exportAll()
   */
  async importAll(data) {
    if (data.context?.session) {
      await this.saveSessionSummary(data.context.session);
    }
    if (data.context?.codebase) {
      await this.saveCodebaseContext(data.context.codebase);
    }
    if (data.learnings?.bugPatterns) {
      await this.storage.write('learnings/bug-patterns.json', data.learnings.bugPatterns);
    }
  }
}

export default MemoryBank;
