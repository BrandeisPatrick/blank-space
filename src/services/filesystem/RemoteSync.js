/**
 * Remote Sync Service
 * Syncs VirtualFS with Firebase Storage (lazy loading by folder)
 *
 * Usage:
 *   const sync = new RemoteSync(virtualFS, getIdToken);
 *   await sync.pullFolder('docs');    // Load docs/ folder
 *   // ... AI makes changes using local tools ...
 *   await sync.syncFolder('docs');    // Push changes back
 */

const VALID_FOLDERS = ['docs', 'photos'];

export class RemoteSync {
  constructor(virtualFS, getIdToken) {
    this.fs = virtualFS;
    this.getIdToken = getIdToken;
    this.loadedFolders = new Set();
    this.lastSyncedState = new Map(); // path → content hash
    this.fileMetadata = new Map(); // path → { id, mimeType, size, ... }
  }

  /**
   * Pull specific folder from remote into VirtualFS
   * @param {string} folder - Folder name (docs, photos)
   * @param {boolean} force - Force reload even if already loaded
   */
  async pullFolder(folder, force = false) {
    if (!VALID_FOLDERS.includes(folder)) {
      throw new Error(`Invalid folder: ${folder}. Must be one of: ${VALID_FOLDERS.join(', ')}`);
    }

    if (this.loadedFolders.has(folder) && !force) {
      return { skipped: true, reason: 'Already loaded' };
    }

    const token = await this.getIdToken();
    const response = await fetch(`/api/files?folder=${folder}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.status}`);
    }

    const { files } = await response.json();
    let loadedCount = 0;

    for (const file of files) {
      try {
        // Get file content with download URL
        const fileResponse = await fetch(`/api/files?id=${file.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!fileResponse.ok) continue;

        const { file: fileData } = await fileResponse.json();

        // Download actual content
        const contentResponse = await fetch(fileData.downloadUrl);
        let content;

        if (fileData.mimeType.startsWith('text/') ||
            fileData.mimeType === 'application/json') {
          content = await contentResponse.text();
        } else {
          // For binary files, store as base64
          const buffer = await contentResponse.arrayBuffer();
          content = this._arrayBufferToBase64(buffer);
        }

        // Write to VirtualFS
        this.fs.write(file.path, content);

        // Track state for diff detection
        this.lastSyncedState.set(file.path, this._hash(content));
        this.fileMetadata.set(file.path, {
          id: file.id,
          mimeType: fileData.mimeType,
          size: fileData.size,
          extractedText: fileData.extractedText,
        });

        loadedCount++;
      } catch (error) {
        console.error(`Failed to load file ${file.path}:`, error);
      }
    }

    this.loadedFolders.add(folder);

    return {
      success: true,
      folder,
      filesLoaded: loadedCount,
      totalFiles: files.length,
    };
  }

  /**
   * Sync VirtualFS changes back to remote for a specific folder
   * @param {string} folder - Folder to sync
   */
  async syncFolder(folder) {
    if (!VALID_FOLDERS.includes(folder)) {
      throw new Error(`Invalid folder: ${folder}`);
    }

    if (!this.loadedFolders.has(folder)) {
      // Folder was never loaded, nothing to sync
      return { skipped: true, reason: 'Folder not loaded' };
    }

    const token = await this.getIdToken();
    const changes = this._detectChanges(folder);

    const results = {
      added: [],
      modified: [],
      deleted: [],
      errors: [],
    };

    // Handle new files
    for (const path of changes.added) {
      try {
        const content = this.fs.read(path);
        const mimeType = this._getMimeType(path);

        const response = await fetch('/api/files', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: path.split('/').pop(),
            folder,
            content: this._isTextMimeType(mimeType) ? btoa(content) : content,
            mimeType,
            encoding: 'base64',
          }),
        });

        if (response.ok) {
          const { file } = await response.json();
          this.fileMetadata.set(path, { id: file.id, mimeType, size: file.size });
          this.lastSyncedState.set(path, this._hash(content));
          results.added.push(path);
        } else {
          results.errors.push({ path, error: 'Upload failed' });
        }
      } catch (error) {
        results.errors.push({ path, error: error.message });
      }
    }

    // Handle modified files
    for (const path of changes.modified) {
      try {
        const content = this.fs.read(path);
        const meta = this.fileMetadata.get(path);

        if (!meta?.id) {
          // No ID, treat as new file
          changes.added.push(path);
          continue;
        }

        // Delete old and upload new (simpler than update)
        await fetch(`/api/files?id=${meta.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        const mimeType = meta.mimeType || this._getMimeType(path);
        const response = await fetch('/api/files', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: path.split('/').pop(),
            folder,
            content: this._isTextMimeType(mimeType) ? btoa(content) : content,
            mimeType,
            encoding: 'base64',
          }),
        });

        if (response.ok) {
          const { file } = await response.json();
          this.fileMetadata.set(path, { id: file.id, mimeType, size: file.size });
          this.lastSyncedState.set(path, this._hash(content));
          results.modified.push(path);
        } else {
          results.errors.push({ path, error: 'Update failed' });
        }
      } catch (error) {
        results.errors.push({ path, error: error.message });
      }
    }

    // Handle deleted files
    for (const path of changes.deleted) {
      try {
        const meta = this.fileMetadata.get(path);
        if (meta?.id) {
          await fetch(`/api/files?id=${meta.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        this.fileMetadata.delete(path);
        this.lastSyncedState.delete(path);
        results.deleted.push(path);
      } catch (error) {
        results.errors.push({ path, error: error.message });
      }
    }

    return results;
  }

  /**
   * Sync all loaded folders
   */
  async syncAll() {
    const results = {};
    for (const folder of this.loadedFolders) {
      results[folder] = await this.syncFolder(folder);
    }
    return results;
  }

  /**
   * Check if a folder is loaded
   */
  isFolderLoaded(folder) {
    return this.loadedFolders.has(folder);
  }

  /**
   * Get list of loaded folders
   */
  getLoadedFolders() {
    return Array.from(this.loadedFolders);
  }

  /**
   * Clear sync state (e.g., on logout)
   */
  clear() {
    this.loadedFolders.clear();
    this.lastSyncedState.clear();
    this.fileMetadata.clear();
  }

  /**
   * Detect changes between VirtualFS and last synced state
   * @private
   */
  _detectChanges(folder) {
    const changes = { added: [], modified: [], deleted: [] };
    const prefix = `${folder}/`;

    // Get current files in folder from VirtualFS
    const currentFiles = new Set();
    const allFiles = this.fs.getAll();

    for (const path of Object.keys(allFiles)) {
      if (path.startsWith(prefix) || path.startsWith(`/${prefix}`)) {
        const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
        currentFiles.add(normalizedPath);

        const currentHash = this._hash(allFiles[path]);
        const lastHash = this.lastSyncedState.get(normalizedPath);

        if (!lastHash) {
          changes.added.push(normalizedPath);
        } else if (currentHash !== lastHash) {
          changes.modified.push(normalizedPath);
        }
      }
    }

    // Find deleted files
    for (const [path] of this.lastSyncedState) {
      if (path.startsWith(prefix) && !currentFiles.has(path)) {
        changes.deleted.push(path);
      }
    }

    return changes;
  }

  /**
   * Simple hash function for change detection
   * @private
   */
  _hash(content) {
    let hash = 0;
    const str = String(content);
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  /**
   * Get MIME type from file extension
   * @private
   */
  _getMimeType(path) {
    const ext = path.split('.').pop()?.toLowerCase();
    const mimeTypes = {
      // Documents
      pdf: 'application/pdf',
      txt: 'text/plain',
      md: 'text/markdown',
      json: 'application/json',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Images
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      webp: 'image/webp',
      // Code
      js: 'text/javascript',
      jsx: 'text/javascript',
      css: 'text/css',
      html: 'text/html',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Check if MIME type is text-based
   * @private
   */
  _isTextMimeType(mimeType) {
    return mimeType.startsWith('text/') ||
           mimeType === 'application/json' ||
           mimeType === 'application/javascript';
  }

  /**
   * Convert ArrayBuffer to base64
   * @private
   */
  _arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

export default RemoteSync;
