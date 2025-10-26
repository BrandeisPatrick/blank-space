/**
 * Version Control & History System
 *
 * Provides undo/redo, snapshots, and version tracking for Sandpack files.
 * Perfect for browser-based code editors where users need to experiment safely.
 *
 * Features:
 * - Undo/Redo individual file changes
 * - Create named snapshots (checkpoints)
 * - Restore to any previous version
 * - Generate diffs between versions
 * - Track change timeline
 * - Automatic history trimming (configurable limit)
 */

export class VersionControl {
  constructor(options = {}) {
    this.maxHistoryPerFile = options.maxHistoryPerFile || 50; // Max versions per file
    this.maxSnapshots = options.maxSnapshots || 20; // Max named snapshots
    this.autoSnapshot = options.autoSnapshot !== false; // Auto-snapshot on major changes

    // File history: { filename: [{ version, code, timestamp, message }] }
    this.fileHistory = {};

    // Current position in history for undo/redo: { filename: currentIndex }
    this.historyPointers = {};

    // Named snapshots: [{ label, files, timestamp }]
    this.snapshots = [];

    // Change statistics
    this.stats = {
      totalChanges: 0,
      undoCount: 0,
      redoCount: 0,
      snapshotCount: 0
    };
  }

  /**
   * Record a file change
   * @param {string} filename - File name
   * @param {string} code - File content
   * @param {string} message - Change description (optional)
   * @returns {Object} Version info
   */
  recordChange(filename, code, message = 'File modified') {
    // Initialize history for this file if needed
    if (!this.fileHistory[filename]) {
      this.fileHistory[filename] = [];
      this.historyPointers[filename] = -1;
    }

    const history = this.fileHistory[filename];
    const pointer = this.historyPointers[filename];

    // If we're not at the end of history, remove all "future" versions
    // (user made changes after undo, so we discard the redo path)
    if (pointer < history.length - 1) {
      history.splice(pointer + 1);
    }

    // Create version entry
    const version = {
      version: history.length + 1,
      code,
      timestamp: new Date().toISOString(),
      message,
      size: code.length
    };

    // Add to history
    history.push(version);

    // Move pointer to new version
    this.historyPointers[filename] = history.length - 1;

    // Trim history if too large
    if (history.length > this.maxHistoryPerFile) {
      const removed = history.shift();
      this.historyPointers[filename]--;
      console.log(`📦 Version history trimmed for ${filename} (removed v${removed.version})`);
    }

    // Update stats
    this.stats.totalChanges++;

    return version;
  }

  /**
   * Undo last change for a file
   * @param {string} filename - File name
   * @returns {Object|null} Previous version or null if can't undo
   */
  undo(filename) {
    const history = this.fileHistory[filename];
    if (!history || history.length === 0) {
      return null;
    }

    const pointer = this.historyPointers[filename];

    // Can't undo if we're at the first version
    if (pointer <= 0) {
      return null;
    }

    // Move pointer back
    this.historyPointers[filename] = pointer - 1;
    this.stats.undoCount++;

    const previousVersion = history[pointer - 1];
    console.log(`↩️ Undo: ${filename} (v${previousVersion.version})`);

    return {
      filename,
      code: previousVersion.code,
      version: previousVersion.version,
      message: previousVersion.message,
      canUndo: pointer - 1 > 0,
      canRedo: true
    };
  }

  /**
   * Redo last undone change
   * @param {string} filename - File name
   * @returns {Object|null} Next version or null if can't redo
   */
  redo(filename) {
    const history = this.fileHistory[filename];
    if (!history || history.length === 0) {
      return null;
    }

    const pointer = this.historyPointers[filename];

    // Can't redo if we're at the latest version
    if (pointer >= history.length - 1) {
      return null;
    }

    // Move pointer forward
    this.historyPointers[filename] = pointer + 1;
    this.stats.redoCount++;

    const nextVersion = history[pointer + 1];
    console.log(`↪️ Redo: ${filename} (v${nextVersion.version})`);

    return {
      filename,
      code: nextVersion.code,
      version: nextVersion.version,
      message: nextVersion.message,
      canUndo: true,
      canRedo: pointer + 1 < history.length - 1
    };
  }

  /**
   * Check if undo is available for a file
   */
  canUndo(filename) {
    const pointer = this.historyPointers[filename];
    return pointer > 0;
  }

  /**
   * Check if redo is available for a file
   */
  canRedo(filename) {
    const history = this.fileHistory[filename];
    const pointer = this.historyPointers[filename];
    return history && pointer < history.length - 1;
  }

  /**
   * Create a named snapshot of all files
   * @param {Object} files - All current files { filename: code }
   * @param {string} label - Snapshot name
   * @returns {Object} Snapshot info
   */
  createSnapshot(files, label) {
    const snapshot = {
      id: Date.now().toString(),
      label: label || `Snapshot ${this.snapshots.length + 1}`,
      files: { ...files }, // Deep copy
      timestamp: new Date().toISOString(),
      fileCount: Object.keys(files).length,
      totalSize: Object.values(files).reduce((sum, code) => sum + code.length, 0)
    };

    this.snapshots.push(snapshot);
    this.stats.snapshotCount++;

    // Trim snapshots if too many
    if (this.snapshots.length > this.maxSnapshots) {
      const removed = this.snapshots.shift();
      console.log(`📦 Snapshot removed: ${removed.label}`);
    }

    console.log(`📸 Snapshot created: ${snapshot.label} (${snapshot.fileCount} files)`);

    return snapshot;
  }

  /**
   * Restore files from a snapshot
   * @param {string} snapshotId - Snapshot ID
   * @returns {Object|null} Restored files or null if not found
   */
  restoreSnapshot(snapshotId) {
    const snapshot = this.snapshots.find(s => s.id === snapshotId);
    if (!snapshot) {
      return null;
    }

    console.log(`🔄 Restoring snapshot: ${snapshot.label}`);

    return {
      files: { ...snapshot.files },
      label: snapshot.label,
      timestamp: snapshot.timestamp,
      fileCount: snapshot.fileCount
    };
  }

  /**
   * Get all snapshots
   */
  getSnapshots() {
    return this.snapshots.map(s => ({
      id: s.id,
      label: s.label,
      timestamp: s.timestamp,
      fileCount: s.fileCount,
      totalSize: s.totalSize
    }));
  }

  /**
   * Delete a snapshot
   */
  deleteSnapshot(snapshotId) {
    const index = this.snapshots.findIndex(s => s.id === snapshotId);
    if (index !== -1) {
      const removed = this.snapshots.splice(index, 1)[0];
      console.log(`🗑️ Snapshot deleted: ${removed.label}`);
      return true;
    }
    return false;
  }

  /**
   * Get version history for a file
   * @param {string} filename - File name
   * @param {number} limit - Max versions to return (default: 10)
   */
  getFileHistory(filename, limit = 10) {
    const history = this.fileHistory[filename] || [];
    const pointer = this.historyPointers[filename] || 0;

    return {
      filename,
      currentVersion: pointer + 1,
      totalVersions: history.length,
      canUndo: this.canUndo(filename),
      canRedo: this.canRedo(filename),
      versions: history.slice(-limit).map((v, idx) => ({
        version: v.version,
        timestamp: v.timestamp,
        message: v.message,
        size: v.size,
        isCurrent: idx === pointer
      }))
    };
  }

  /**
   * Get version timeline for all files
   */
  getTimeline(limit = 20) {
    const allChanges = [];

    // Collect all changes from all files
    Object.entries(this.fileHistory).forEach(([filename, history]) => {
      history.forEach(version => {
        allChanges.push({
          filename,
          version: version.version,
          timestamp: version.timestamp,
          message: version.message,
          size: version.size
        });
      });
    });

    // Sort by timestamp (newest first)
    allChanges.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return allChanges.slice(0, limit);
  }

  /**
   * Generate diff between two versions
   * @param {string} filename - File name
   * @param {number} fromVersion - Start version (default: current - 1)
   * @param {number} toVersion - End version (default: current)
   * @returns {Object} Diff information
   */
  getDiff(filename, fromVersion = null, toVersion = null) {
    const history = this.fileHistory[filename];
    if (!history || history.length === 0) {
      return null;
    }

    const pointer = this.historyPointers[filename];

    // Default: compare current with previous
    const fromIdx = fromVersion ? fromVersion - 1 : Math.max(0, pointer - 1);
    const toIdx = toVersion ? toVersion - 1 : pointer;

    if (fromIdx < 0 || toIdx >= history.length) {
      return null;
    }

    const fromCode = history[fromIdx].code;
    const toCode = history[toIdx].code;

    // Simple line-based diff
    const fromLines = fromCode.split('\n');
    const toLines = toCode.split('\n');

    const diff = {
      filename,
      fromVersion: fromIdx + 1,
      toVersion: toIdx + 1,
      linesAdded: 0,
      linesRemoved: 0,
      linesChanged: 0,
      sizeChange: toCode.length - fromCode.length,
      changes: []
    };

    // Calculate changes (simplified diff)
    const maxLines = Math.max(fromLines.length, toLines.length);
    for (let i = 0; i < maxLines; i++) {
      const fromLine = fromLines[i];
      const toLine = toLines[i];

      if (fromLine === undefined && toLine !== undefined) {
        // Line added
        diff.linesAdded++;
        diff.changes.push({ type: 'add', line: i + 1, content: toLine });
      } else if (fromLine !== undefined && toLine === undefined) {
        // Line removed
        diff.linesRemoved++;
        diff.changes.push({ type: 'remove', line: i + 1, content: fromLine });
      } else if (fromLine !== toLine) {
        // Line changed
        diff.linesChanged++;
        diff.changes.push({ type: 'change', line: i + 1, from: fromLine, to: toLine });
      }
    }

    return diff;
  }

  /**
   * Get diff summary between current and previous version
   */
  getLastDiff(filename) {
    return this.getDiff(filename);
  }

  /**
   * Restore specific version of a file
   * @param {string} filename - File name
   * @param {number} version - Version number to restore
   */
  restoreVersion(filename, version) {
    const history = this.fileHistory[filename];
    if (!history) {
      return null;
    }

    const versionData = history.find(v => v.version === version);
    if (!versionData) {
      return null;
    }

    // Record this restore as a new change
    this.recordChange(filename, versionData.code, `Restored to version ${version}`);

    console.log(`🔄 Restored ${filename} to version ${version}`);

    return {
      filename,
      code: versionData.code,
      version,
      message: versionData.message
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      filesTracked: Object.keys(this.fileHistory).length,
      totalVersions: Object.values(this.fileHistory).reduce((sum, h) => sum + h.length, 0),
      snapshots: this.snapshots.length,
      oldestChange: this.getOldestChange(),
      newestChange: this.getNewestChange()
    };
  }

  /**
   * Get oldest change timestamp
   */
  getOldestChange() {
    let oldest = null;
    Object.values(this.fileHistory).forEach(history => {
      if (history.length > 0) {
        const first = history[0].timestamp;
        if (!oldest || first < oldest) {
          oldest = first;
        }
      }
    });
    return oldest;
  }

  /**
   * Get newest change timestamp
   */
  getNewestChange() {
    let newest = null;
    Object.values(this.fileHistory).forEach(history => {
      if (history.length > 0) {
        const last = history[history.length - 1].timestamp;
        if (!newest || last > newest) {
          newest = last;
        }
      }
    });
    return newest;
  }

  /**
   * Clear all history for a file
   */
  clearFileHistory(filename) {
    delete this.fileHistory[filename];
    delete this.historyPointers[filename];
    console.log(`🗑️ History cleared for ${filename}`);
  }

  /**
   * Clear all history and snapshots
   */
  clearAll() {
    this.fileHistory = {};
    this.historyPointers = {};
    this.snapshots = [];
    this.stats = {
      totalChanges: 0,
      undoCount: 0,
      redoCount: 0,
      snapshotCount: 0
    };
    console.log('🗑️ All version history cleared');
  }

  /**
   * Export version control data (for persistence)
   */
  export() {
    return {
      fileHistory: this.fileHistory,
      historyPointers: this.historyPointers,
      snapshots: this.snapshots,
      stats: this.stats,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import version control data (from persistence)
   */
  import(data) {
    if (!data) return;

    this.fileHistory = data.fileHistory || {};
    this.historyPointers = data.historyPointers || {};
    this.snapshots = data.snapshots || [];
    this.stats = data.stats || {
      totalChanges: 0,
      undoCount: 0,
      redoCount: 0,
      snapshotCount: 0
    };

    console.log(`📥 Imported version history: ${Object.keys(this.fileHistory).length} files`);
  }
}

/**
 * Singleton instance (optional)
 */
let versionControlInstance = null;

export function getVersionControl(options = {}) {
  if (!versionControlInstance) {
    versionControlInstance = new VersionControl(options);
  }
  return versionControlInstance;
}

export default VersionControl;
