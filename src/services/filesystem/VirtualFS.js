/**
 * Virtual File System for Browser-Based Development
 * Stores files in-memory for Sandpack preview integration
 *
 * This is pure JavaScript with no JSX syntax.
 */

export class VirtualFileSystem {
  constructor() {
    this.files = new Map(); // path → { content, modified, size }
    this.directories = new Set(['/']); // Track directory structure
  }

  /**
   * Read file content
   * @param {string} path - File path (e.g., "App.jsx" or "components/Button.jsx")
   * @returns {string|null} - File content or null if not found
   */
  read(path) {
    const file = this.files.get(this._normalizePath(path));
    return file ? file.content : null;
  }

  /**
   * Write/create file
   * @param {string} path - File path
   * @param {string} content - File content
   */
  write(path, content) {
    const normalizedPath = this._normalizePath(path);

    // Track directory
    this._ensureDirectories(normalizedPath);

    this.files.set(normalizedPath, {
      content,
      modified: Date.now(),
      size: content.length
    });
  }

  /**
   * Delete file
   * @param {string} path - File path
   * @returns {boolean} - True if file existed and was deleted
   */
  delete(path) {
    const normalizedPath = this._normalizePath(path);
    return this.files.delete(normalizedPath);
  }

  /**
   * Check if file exists
   * @param {string} path - File path
   * @returns {boolean}
   */
  exists(path) {
    return this.files.has(this._normalizePath(path));
  }

  /**
   * List files in directory
   * @param {string} dir - Directory path (optional, defaults to root)
   * @returns {string[]} - Array of file paths in directory
   */
  list(dir = '/') {
    const normalizedDir = this._normalizePath(dir) || '/';
    const prefix = normalizedDir === '/' ? '' : normalizedDir + '/';

    return Array.from(this.files.keys())
      .filter(path => {
        if (!path.startsWith(prefix)) return false;
        const remainder = path.slice(prefix.length);
        // Only include direct children (no subdirectories)
        return !remainder.includes('/');
      })
      .map(path => path.slice(prefix.length));
  }

  /**
   * Get all files as object (for Sandpack)
   * @returns {Object} - { path: content, ... }
   */
  getAll() {
    const result = {};
    for (const [path, file] of this.files) {
      // Remove leading slash for Sandpack
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      result[cleanPath] = file.content;
    }
    return result;
  }

  /**
   * Find files matching glob pattern
   * Pattern examples: "*.jsx", "components" with "**" prefix for recursive
   * @param {string} pattern - Glob pattern to match files
   * @returns {string[]} - Matching file paths
   */
  glob(pattern) {
    // Simple glob implementation
    const regex = this._globToRegex(pattern);
    return Array.from(this.files.keys())
      .filter(path => regex.test(path))
      .map(path => path.startsWith('/') ? path.slice(1) : path);
  }

  /**
   * Search for text in files
   * @param {RegExp|string} pattern - Pattern to search for
   * @param {Object} options - Search options
   * @returns {Array} - Array of {path, matches, line}
   */
  grep(pattern, options = {}) {
    const regex = typeof pattern === 'string'
      ? new RegExp(pattern, options.flags || 'gi')
      : pattern;

    const results = [];

    for (const [path, file] of this.files) {
      const lines = file.content.split('\n');
      const matches = [];

      lines.forEach((line, lineNum) => {
        if (regex.test(line)) {
          matches.push({
            line: lineNum + 1,
            content: line.trim(),
            match: line.match(regex)?.[0]
          });
        }
      });

      if (matches.length > 0) {
        results.push({
          path: path.startsWith('/') ? path.slice(1) : path,
          matches: matches.length,
          lines: matches
        });
      }
    }

    return results;
  }

  /**
   * Get file stats
   * @param {string} path - File path
   * @returns {Object|null} - {size, modified} or null
   */
  stat(path) {
    const file = this.files.get(this._normalizePath(path));
    if (!file) return null;

    return {
      path: path,
      size: file.size,
      modified: file.modified,
      type: 'file'
    };
  }

  /**
   * Clear all files
   */
  clear() {
    this.files.clear();
    this.directories.clear();
    this.directories.add('/');
  }

  /**
   * Get file count
   * @returns {number}
   */
  getFileCount() {
    return this.files.size;
  }

  /**
   * Normalize path (handle different formats)
   * @private
   */
  _normalizePath(path) {
    if (!path) return '/';

    // Ensure starts with /
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    // Remove trailing slashes (except root)
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    return path;
  }

  /**
   * Ensure directory structure exists
   * @private
   */
  _ensureDirectories(filePath) {
    const parts = filePath.split('/').filter(p => p);
    let current = '';

    for (const part of parts.slice(0, -1)) {
      current += '/' + part;
      this.directories.add(current);
    }
  }

  /**
   * Convert glob pattern to regex
   * @private
   */
  _globToRegex(pattern) {
    let regexStr = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '[^/]*')
      .replace(/\*\*/g, '.*')
      .replace(/\?/g, '.');

    // Make it match the whole path
    if (!regexStr.startsWith('^')) {
      regexStr = '^' + regexStr;
    }
    if (!regexStr.endsWith('$')) {
      regexStr = regexStr + '$';
    }

    return new RegExp(regexStr);
  }
}

export default VirtualFileSystem;
