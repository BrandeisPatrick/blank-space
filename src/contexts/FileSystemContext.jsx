/**
 * File System Context
 * Manages user's remote file storage with nested folder support
 * macOS Finder-style column navigation
 *
 * In development mode, uses localStorage instead of Firebase Storage
 */

import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { slugify } from '../utils/slugify';

const FileSystemContext = createContext();

// Always use remote storage (Firebase)
const USE_LOCAL_STORAGE = false;
const LOCAL_STORAGE_KEY = 'blankspace_local_files';

// Local storage helpers for development mode
const getLocalFiles = () => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { files: [], folders: [] };
  } catch {
    return { files: [], folders: [] };
  }
};

const saveLocalFiles = (files, folders) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ files, folders }));
  } catch (err) {
    console.warn('[FileSystem] Failed to save to localStorage:', err);
  }
};

// Default folders that always appear (agent-scoped workspaces)
const DEFAULT_FOLDERS = [
  { path: 'assistant', name: 'assistant', isFolder: true },
  { path: 'code', name: 'code', isFolder: true },
];

export const FileSystemProvider = ({ children }) => {
  const { user, getIdToken } = useAuth();

  // File and folder state
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  // Navigation state for column view
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedItem, setSelectedItem] = useState(null);

  // Track if initial load is done
  const [initialized, setInitialized] = useState(false);

  // Project state (apps in code/ folder)
  const [projects, setProjects] = useState([]);
  const [activeProjectSlug, setActiveProjectSlug] = useState(null);

  // Sync state tracking
  const lastSyncRef = useRef(new Map());

  // Clear state on logout
  useEffect(() => {
    if (!user) {
      setFiles([]);
      setFolders([]);
      setProjects([]);
      setActiveProjectSlug(null);
      setCurrentPath('/');
      setSelectedItem(null);
      setInitialized(false);
      setError(null);
      lastSyncRef.current.clear();
    }
  }, [user]);

  // Helper: Make authenticated API request
  // Make authenticated request with optional agent scope header
  const makeAuthenticatedRequest = useCallback(async (url, options = {}, agent = 'user') => {
    if (!user) throw new Error('Not authenticated');

    const token = await getIdToken();
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Agent': agent, // Agent scope for access control
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }

    return response.json();
  }, [user, getIdToken]);

  // Load all files and folders
  const loadFiles = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // In development mode, use localStorage
      if (USE_LOCAL_STORAGE) {
        const localData = getLocalFiles();
        setFiles(localData.files || []);
        setFolders(localData.folders || []);
        setInitialized(true);
        console.log('[FileSystem] Loaded from localStorage:', localData.files?.length || 0, 'files');
        return { success: true, count: localData.files?.length || 0 };
      }

      // Production: use Firebase
      const data = await makeAuthenticatedRequest('/api/files');

      setFiles(data.files || []);
      setFolders(data.folders || []);
      setInitialized(true);

      return { success: true, count: data.count };
    } catch (err) {
      console.error('Error loading files:', err);
      setError(err.message);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, makeAuthenticatedRequest]);

  // Auto-load files on mount when user is authenticated
  useEffect(() => {
    if (user && !initialized) {
      loadFiles();
    }
  }, [user, initialized, loadFiles]);

  // Get contents of a specific folder path (immediate children only)
  const getFolderContents = useCallback((folderPath) => {
    const normalizedPath = folderPath === '/' ? '' : folderPath.replace(/^\//, '');

    // Get files in this folder
    const folderFiles = files.filter(file => {
      const filePath = file.path || '';
      if (!normalizedPath) {
        // Root level: files with no / in path
        return !filePath.includes('/');
      }
      // Check if file is directly in this folder
      const parentPath = filePath.substring(0, filePath.lastIndexOf('/'));
      return parentPath === normalizedPath;
    });

    // Get immediate subfolders
    const subfolders = [];
    const seenFolders = new Set();

    // Add default folders at root level
    if (!normalizedPath) {
      DEFAULT_FOLDERS.forEach(folder => {
        if (!seenFolders.has(folder.path)) {
          seenFolders.add(folder.path);
          subfolders.push({
            id: `folder:${folder.path}`,
            name: folder.name,
            path: folder.path,
            isFolder: true,
            isDefault: true,
          });
        }
      });
    }

    // From explicit folders
    folders.forEach(folder => {
      const folderPathNorm = folder.path || '';
      if (!normalizedPath) {
        // Root level: top-level folders
        const firstPart = folderPathNorm.split('/')[0];
        if (firstPart && !seenFolders.has(firstPart)) {
          seenFolders.add(firstPart);
          subfolders.push({
            id: `folder:${firstPart}`,
            name: firstPart,
            path: firstPart,
            isFolder: true,
          });
        }
      } else {
        // Check if folder is directly under this path
        if (folderPathNorm.startsWith(normalizedPath + '/')) {
          const remaining = folderPathNorm.substring(normalizedPath.length + 1);
          const firstPart = remaining.split('/')[0];
          if (firstPart && !seenFolders.has(firstPart)) {
            seenFolders.add(firstPart);
            subfolders.push({
              id: `folder:${normalizedPath}/${firstPart}`,
              name: firstPart,
              path: `${normalizedPath}/${firstPart}`,
              isFolder: true,
            });
          }
        }
      }
    });

    // Also derive folders from file paths
    files.forEach(file => {
      const filePath = file.path || '';
      if (!normalizedPath) {
        // Root level
        if (filePath.includes('/')) {
          const firstPart = filePath.split('/')[0];
          if (firstPart && !seenFolders.has(firstPart)) {
            seenFolders.add(firstPart);
            subfolders.push({
              id: `folder:${firstPart}`,
              name: firstPart,
              path: firstPart,
              isFolder: true,
            });
          }
        }
      } else {
        // Check if file path starts with current folder
        if (filePath.startsWith(normalizedPath + '/')) {
          const remaining = filePath.substring(normalizedPath.length + 1);
          if (remaining.includes('/')) {
            const firstPart = remaining.split('/')[0];
            if (firstPart && !seenFolders.has(firstPart)) {
              seenFolders.add(firstPart);
              subfolders.push({
                id: `folder:${normalizedPath}/${firstPart}`,
                name: firstPart,
                path: `${normalizedPath}/${firstPart}`,
                isFolder: true,
              });
            }
          }
        }
      }
    });

    // Sort: folders first, then files, both alphabetically
    subfolders.sort((a, b) => a.name.localeCompare(b.name));
    folderFiles.sort((a, b) => (a.filename || '').localeCompare(b.filename || ''));

    return [...subfolders, ...folderFiles];
  }, [files, folders]);

  // Create a new folder
  const createFolder = useCallback(async (path) => {
    if (!user) throw new Error('Not authenticated');

    try {
      const data = await makeAuthenticatedRequest('/api/files?action=folder', {
        method: 'POST',
        body: JSON.stringify({ path }),
      });

      // Add to local state
      setFolders(prev => [...prev, data.folder]);

      return data.folder;
    } catch (err) {
      console.error('Create folder error:', err);
      setError(err.message);
      throw err;
    }
  }, [user, makeAuthenticatedRequest]);

  // Delete a folder
  const deleteFolder = useCallback(async (path) => {
    if (!user) throw new Error('Not authenticated');

    // Normalize path: strip leading slash to match stored paths
    const normalizedPath = path.replace(/^\//, '');

    try {
      await makeAuthenticatedRequest(`/api/files?action=folder&path=${encodeURIComponent(normalizedPath)}`, {
        method: 'DELETE',
      });

      // Remove folder and all nested items from local state
      setFolders(prev => prev.filter(f => f.path !== normalizedPath && !f.path.startsWith(normalizedPath + '/')));
      setFiles(prev => prev.filter(f => !f.path.startsWith(normalizedPath + '/')));

      return { success: true };
    } catch (err) {
      console.error('Delete folder error:', err);
      setError(err.message);
      throw err;
    }
  }, [user, makeAuthenticatedRequest]);

  // Upload a file to a specific path
  const uploadFile = useCallback(async (file, targetPath = '/') => {
    if (!user) throw new Error('Not authenticated');

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Read file as base64
      const content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 50));
          }
        };
        reader.readAsDataURL(file);
      });

      setUploadProgress(50);

      // Build full path
      const normalizedTarget = targetPath === '/' ? '' : targetPath.replace(/^\//, '').replace(/\/$/, '');
      const fullPath = normalizedTarget ? `${normalizedTarget}/${file.name}` : file.name;

      // Upload to API
      const data = await makeAuthenticatedRequest('/api/files', {
        method: 'POST',
        body: JSON.stringify({
          filename: file.name,
          path: fullPath,
          content,
          mimeType: file.type,
          encoding: 'base64',
        }),
      });

      setUploadProgress(90);

      // Add to local state
      setFiles(prev => [...prev, data.file]);

      setUploadProgress(100);

      return data.file;
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [user, makeAuthenticatedRequest]);

  // Delete a file
  const deleteFile = useCallback(async (fileId) => {
    if (!user) throw new Error('Not authenticated');

    try {
      await makeAuthenticatedRequest(`/api/files?id=${fileId}`, {
        method: 'DELETE',
      });

      // Remove from local state
      setFiles(prev => prev.filter(f => f.id !== fileId));

      return { success: true };
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message);
      throw err;
    }
  }, [user, makeAuthenticatedRequest]);

  // Move/rename a file
  const moveFile = useCallback(async (fileId, newPath) => {
    if (!user) throw new Error('Not authenticated');

    try {
      const data = await makeAuthenticatedRequest('/api/files', {
        method: 'PUT',
        body: JSON.stringify({ fileId, newPath }),
      });

      // Update local state
      setFiles(prev => prev.map(f =>
        f.id === fileId ? data.file : f
      ));

      return data.file;
    } catch (err) {
      console.error('Move error:', err);
      setError(err.message);
      throw err;
    }
  }, [user, makeAuthenticatedRequest]);

  // Get file content (download URL)
  const getFileContent = useCallback(async (fileId) => {
    if (!user) throw new Error('Not authenticated');

    try {
      const data = await makeAuthenticatedRequest(`/api/files?id=${fileId}`);
      return data.file;
    } catch (err) {
      console.error('Get file error:', err);
      setError(err.message);
      throw err;
    }
  }, [user, makeAuthenticatedRequest]);

  // Navigate to a path (for column view)
  const navigateTo = useCallback((path) => {
    setCurrentPath(path);
    setSelectedItem(null);
  }, []);

  // Select an item (for column view)
  const selectItem = useCallback((item) => {
    setSelectedItem(item);
    if (item?.isFolder) {
      setCurrentPath('/' + item.path);
    }
  }, []);

  // Refresh all files
  const refresh = useCallback(async () => {
    setInitialized(false);
    return loadFiles();
  }, [loadFiles]);

  // Helper: Guess MIME type from filename
  const guessMimeType = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes = {
      txt: 'text/plain',
      md: 'text/markdown',
      json: 'application/json',
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      webp: 'image/webp',
      js: 'text/javascript',
      css: 'text/css',
      html: 'text/html',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  };

  // =============================================
  // AI Tool Operations (on-demand, lazy-loading)
  // =============================================

  // Get file/folder metadata only (no content) - fast for AI context
  const getFileListForAI = useCallback(() => {
    const allFolders = [...DEFAULT_FOLDERS, ...folders].map(f => f.path || f.name);
    const uniqueFolders = [...new Set(allFolders)];
    const filePaths = files.map(f => f.path);
    return { files: filePaths, folders: uniqueFolders };
  }, [files, folders]);

  // Fetch single file content by path (on-demand from Firebase/localStorage)
  const fetchFileByPath = useCallback(async (filePath) => {
    if (!user) throw new Error('Not authenticated');

    // Development: read from localStorage
    if (USE_LOCAL_STORAGE) {
      const localData = getLocalFiles();
      const file = (localData.files || []).find(f => f.path === filePath);
      if (!file) throw new Error(`File not found: ${filePath}`);
      return { success: true, content: file.content || '', path: filePath };
    }

    // Production: find file and fetch from Firebase
    const file = files.find(f => f.path === filePath);
    if (!file) throw new Error(`File not found: ${filePath}`);

    try {
      const fullFile = await makeAuthenticatedRequest(`/api/files?id=${file.id}`);
      const fileData = fullFile.file;

      if (!fileData?.downloadUrl) throw new Error('No download URL');

      const response = await fetch(fileData.downloadUrl);
      const content = await response.text();
      return { success: true, content, path: filePath };
    } catch (err) {
      throw new Error(`Failed to fetch ${filePath}: ${err.message}`);
    }
  }, [user, files, makeAuthenticatedRequest]);

  // Write file by path (to Firebase/localStorage)
  // agent: 'user' | 'assistant' | 'code' - for scope enforcement
  const writeFileByPath = useCallback(async (filePath, content, options = {}) => {
    if (!user) throw new Error('Not authenticated');
    const { agent = 'user', update = false } = options;

    const filename = filePath.split('/').pop();
    const mimeType = guessMimeType(filename);

    // Development: write to localStorage
    if (USE_LOCAL_STORAGE) {
      const localData = getLocalFiles();
      const updatedFiles = [...localData.files];
      const existingIndex = updatedFiles.findIndex(f => f.path === filePath);

      const fileData = {
        id: existingIndex !== -1 ? updatedFiles[existingIndex].id : `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        filename,
        path: filePath,
        mimeType,
        content,
        size: content.length,
        createdAt: existingIndex !== -1 ? updatedFiles[existingIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex !== -1) {
        updatedFiles[existingIndex] = fileData;
      } else {
        updatedFiles.push(fileData);
      }

      // Ensure folder exists
      const updatedFolders = [...localData.folders];
      const folderPath = filePath.includes('/') ? filePath.split('/').slice(0, -1).join('/') : null;
      if (folderPath && !updatedFolders.some(f => f.path === folderPath)) {
        updatedFolders.push({
          id: `folder:${folderPath}`,
          path: folderPath,
          name: folderPath.split('/').pop(),
          isFolder: true,
        });
      }

      saveLocalFiles(updatedFiles, updatedFolders);
      setFiles(updatedFiles);
      setFolders(updatedFolders);
      return { success: true, path: filePath };
    }

    // Production: upload to Firebase with agent scope
    try {
      const base64Content = btoa(unescape(encodeURIComponent(content)));
      await makeAuthenticatedRequest('/api/files', {
        method: 'POST',
        body: JSON.stringify({
          filename,
          path: filePath,
          content: base64Content,
          mimeType,
          update,
        }),
      }, agent);
      await loadFiles(); // Refresh file list
      return { success: true, path: filePath };
    } catch (err) {
      throw new Error(`Failed to write ${filePath}: ${err.message}`);
    }
  }, [user, makeAuthenticatedRequest, loadFiles]);

  // Create folder by path
  const createFolderByPath = useCallback(async (folderPath) => {
    if (!user) throw new Error('Not authenticated');

    // Development: create in localStorage
    if (USE_LOCAL_STORAGE) {
      const localData = getLocalFiles();
      const updatedFolders = [...localData.folders];

      if (updatedFolders.some(f => f.path === folderPath)) {
        return { success: true, path: folderPath, message: 'Folder already exists' };
      }

      updatedFolders.push({
        id: `folder:${folderPath}`,
        path: folderPath,
        name: folderPath.split('/').pop(),
        isFolder: true,
      });

      saveLocalFiles(localData.files, updatedFolders);
      setFolders(updatedFolders);
      return { success: true, path: folderPath };
    }

    // Production: create via API
    return createFolder(folderPath);
  }, [user, createFolder]);

  // Delete file by path (looks up file by path and calls deleteFile by id)
  const deleteFileByPath = useCallback(async (filePath) => {
    if (!user) throw new Error('Not authenticated');

    // Development: delete from localStorage
    if (USE_LOCAL_STORAGE) {
      const localData = getLocalFiles();
      const updatedFiles = localData.files.filter(f => f.path !== filePath);
      if (updatedFiles.length === localData.files.length) {
        throw new Error(`File not found: ${filePath}`);
      }
      saveLocalFiles(updatedFiles, localData.folders);
      setFiles(updatedFiles);
      return { success: true, path: filePath };
    }

    // Production: find file by path and delete by id
    const file = files.find(f => f.path === filePath);
    if (!file) throw new Error(`File not found: ${filePath}`);

    await deleteFile(file.id);
    return { success: true, path: filePath };
  }, [user, files, deleteFile]);

  // List directory contents by path (from cached state)
  const listDirectoryByPath = useCallback((dirPath = '') => {
    const normalizedPath = dirPath.replace(/^\//, '').replace(/\/$/, '');

    // Get folders at this level
    const allFolders = [...DEFAULT_FOLDERS, ...folders];
    const subfolders = allFolders
      .filter(f => {
        const fPath = f.path || f.name;
        if (!normalizedPath) {
          // Root level: folders without / in path
          return !fPath.includes('/');
        }
        // Check if folder is directly under this path
        const parent = fPath.substring(0, fPath.lastIndexOf('/'));
        return parent === normalizedPath;
      })
      .map(f => ({ name: f.name || f.path, path: f.path, isFolder: true }));

    // Get files at this level
    const dirFiles = files
      .filter(f => {
        const filePath = f.path || '';
        if (!normalizedPath) {
          return !filePath.includes('/');
        }
        const parent = filePath.substring(0, filePath.lastIndexOf('/'));
        return parent === normalizedPath;
      })
      .map(f => ({ name: f.filename, path: f.path, isFolder: false, size: f.size }));

    return {
      success: true,
      path: normalizedPath || '/',
      folders: subfolders,
      files: dirFiles,
      total: subfolders.length + dirFiles.length
    };
  }, [files, folders]);

  // =============================================
  // Project Files Helper (for PreviewPanel)
  // =============================================

  // Get all files for a specific project (by projectSlug)
  // Returns files in { filename: content } format for preview
  const getFilesByProjectSlug = useCallback(async (projectSlug) => {
    if (!projectSlug) return {};

    const prefix = `code/${projectSlug}/`;
    const projectFiles = files.filter(f => (f.path || '').startsWith(prefix));

    if (projectFiles.length === 0) return {};

    const fileMap = {};

    // In development mode, content is stored directly in localStorage
    if (USE_LOCAL_STORAGE) {
      const localData = getLocalFiles();
      for (const file of projectFiles) {
        const localFile = (localData.files || []).find(f => f.path === file.path);
        if (localFile) {
          const relativePath = file.path.replace(prefix, '');
          fileMap[relativePath] = localFile.content || '';
        }
      }
      console.log(`[FileSystem] getFilesByProjectSlug(${projectSlug}):`, Object.keys(fileMap).length, 'files');
      return fileMap;
    }

    // Production: fetch content from Firebase
    for (const file of projectFiles) {
      try {
        const fullFile = await makeAuthenticatedRequest(`/api/files?id=${file.id}`);
        const fileData = fullFile.file;

        if (fileData?.downloadUrl) {
          const response = await fetch(fileData.downloadUrl);
          const content = await response.text();
          const relativePath = file.path.replace(prefix, '');
          fileMap[relativePath] = content;
        }
      } catch (err) {
        console.warn(`[FileSystem] Failed to fetch ${file.path}:`, err);
      }
    }

    console.log(`[FileSystem] getFilesByProjectSlug(${projectSlug}):`, Object.keys(fileMap).length, 'files');
    return fileMap;
  }, [files, makeAuthenticatedRequest]);

  // =============================================
  // Project Management (Apps in code/ folder)
  // =============================================

  // Manifest file name for project metadata
  const MANIFEST_FILE = '.blankspace.json';

  // Load all projects from code/*/.blankspace.json manifests
  const loadProjects = useCallback(async () => {
    // Find all manifest files in code/*/
    const manifestFiles = files.filter(f =>
      f.path && f.path.match(/^code\/[^/]+\/\.blankspace\.json$/)
    );

    if (manifestFiles.length === 0) {
      setProjects([]);
      return [];
    }

    const loadedProjects = [];

    for (const manifestFile of manifestFiles) {
      try {
        const pathParts = manifestFile.path.split('/');
        const projectSlug = pathParts[1]; // code/{slug}/.blankspace.json

        // Fetch manifest content
        let content;
        if (USE_LOCAL_STORAGE) {
          const localData = getLocalFiles();
          const localFile = localData.files?.find(f => f.path === manifestFile.path);
          content = localFile?.content;
        } else {
          const fullFile = await makeAuthenticatedRequest(`/api/files?id=${manifestFile.id}`);
          if (fullFile.file?.downloadUrl) {
            const response = await fetch(fullFile.file.downloadUrl);
            content = await response.text();
          }
        }

        if (content) {
          const manifest = JSON.parse(content);
          loadedProjects.push({
            slug: projectSlug,
            name: manifest.name || projectSlug,
            icon: manifest.icon || 'app',
            createdAt: manifest.createdAt || null,
          });
        }
      } catch (err) {
        console.warn(`[FileSystem] Failed to load project manifest:`, manifestFile.path, err);
      }
    }

    // Sort by creation date (newest first)
    loadedProjects.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    setProjects(loadedProjects);
    console.log(`[FileSystem] Found ${loadedProjects.length} existing app(s)`);
    return loadedProjects;
  }, [files, makeAuthenticatedRequest]);

  // Load projects when files change
  useEffect(() => {
    if (initialized && files.length > 0) {
      loadProjects();
    }
  }, [initialized, files, loadProjects]);

  // Get active project
  const activeProject = useMemo(() => {
    return projects.find(p => p.slug === activeProjectSlug) || null;
  }, [projects, activeProjectSlug]);

  // Create a new project with manifest
  const createProject = useCallback(async (name, icon = 'app') => {
    const projectSlug = slugify(name, true); // Add random suffix for uniqueness

    const manifest = {
      name,
      icon,
      createdAt: new Date().toISOString(),
    };

    const manifestPath = `code/${projectSlug}/${MANIFEST_FILE}`;
    const manifestContent = JSON.stringify(manifest, null, 2);

    try {
      await writeFileByPath(manifestPath, manifestContent, { agent: 'code' });

      const newProject = { slug: projectSlug, ...manifest };

      // Update local state
      setProjects(prev => [newProject, ...prev]);
      setActiveProjectSlug(projectSlug);

      console.log(`[FileSystem] Created project: ${name} (${projectSlug})`);
      return newProject;
    } catch (err) {
      console.error('[FileSystem] Failed to create project:', err);
      throw err;
    }
  }, [writeFileByPath]);

  // Update project metadata (name, icon)
  const updateProjectMeta = useCallback(async (projectSlug, updates) => {
    const manifestPath = `code/${projectSlug}/${MANIFEST_FILE}`;

    try {
      // Fetch current manifest
      const currentContent = await fetchFileByPath(manifestPath, { agent: 'code' });
      const currentManifest = JSON.parse(currentContent);

      // Merge updates
      const updatedManifest = {
        ...currentManifest,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Write updated manifest
      await writeFileByPath(manifestPath, JSON.stringify(updatedManifest, null, 2), { agent: 'code' });

      // Update local state
      setProjects(prev => prev.map(p =>
        p.slug === projectSlug ? { ...p, ...updates } : p
      ));

      console.log(`[FileSystem] Updated project: ${projectSlug}`, updates);
      return updatedManifest;
    } catch (err) {
      console.error('[FileSystem] Failed to update project:', err);
      throw err;
    }
  }, [fetchFileByPath, writeFileByPath]);

  // Delete project and all its files
  const deleteProject = useCallback(async (projectSlug) => {
    const projectPath = `code/${projectSlug}`;

    try {
      // Delete entire project folder (cascade delete)
      await deleteFolder(projectPath);

      // Update local state
      setProjects(prev => prev.filter(p => p.slug !== projectSlug));

      // Clear active project if it was the deleted one
      if (activeProjectSlug === projectSlug) {
        setActiveProjectSlug(null);
      }

      console.log(`[FileSystem] Deleted project: ${projectSlug}`);
    } catch (err) {
      console.error('[FileSystem] Failed to delete project:', err);
      throw err;
    }
  }, [deleteFolder, activeProjectSlug]);

  // Set active project
  const loadProject = useCallback((projectSlug) => {
    const project = projects.find(p => p.slug === projectSlug);
    if (project) {
      setActiveProjectSlug(projectSlug);
      console.log(`[FileSystem] Loaded project: ${projectSlug}`);
    }
  }, [projects]);

  // Clear active project
  const clearActiveProject = useCallback(() => {
    setActiveProjectSlug(null);
  }, []);

  // =============================================
  // Legacy AI Integration (for backward compatibility)
  // =============================================

  // Get text files for AI integration (code editing context)
  // NOTE: Binary files are NOT loaded here. Users must explicitly attach files to messages.
  // This avoids slow eager loading and API errors from unsupported MIME types.
  const getFilesForAI = useCallback(async () => {
    if (!user) return { textFiles: {}, folders: [] };

    const textFiles = {};

    // Get all folders (default + user-created)
    const allFolders = [...DEFAULT_FOLDERS, ...folders].map(f => f.path || f.name);
    const uniqueFolders = [...new Set(allFolders)];

    const textMimeTypes = ['text/plain', 'text/markdown', 'application/json', 'text/javascript', 'text/css', 'text/html'];

    // In development mode, read from localStorage
    if (USE_LOCAL_STORAGE) {
      const localData = getLocalFiles();
      for (const file of localData.files || []) {
        if (textMimeTypes.includes(file.mimeType)) {
          // Local files have content stored directly
          textFiles[file.path] = file.content || '';
        }
      }
      // Add folders from localStorage
      const localFolders = (localData.folders || []).map(f => f.path || f.name);
      const allLocalFolders = [...new Set([...uniqueFolders, ...localFolders])];
      console.log('[FileSystem] getFilesForAI from localStorage:', Object.keys(textFiles).length, 'text files,', allLocalFolders.length, 'folders');
      return { textFiles, folders: allLocalFolders };
    }

    // Production: fetch text files only from Firebase
    for (const file of files) {
      // Skip non-text files entirely (no fetching)
      if (!textMimeTypes.includes(file.mimeType)) continue;

      try {
        const fullFile = await makeAuthenticatedRequest(`/api/files?id=${file.id}`);
        const fileData = fullFile.file;

        if (!fileData?.downloadUrl) continue;

        const response = await fetch(fileData.downloadUrl);
        const text = await response.text();
        textFiles[file.path] = text;
      } catch (err) {
        console.warn(`Could not fetch content for ${file.path}:`, err);
      }
    }

    return { textFiles, folders: uniqueFolders };
  }, [user, files, folders, makeAuthenticatedRequest]);

  // Sync file changes from AI back to remote storage (or localStorage in dev)
  // agent: 'user' | 'assistant' | 'code' - for scope enforcement
  const syncChangesFromAI = useCallback(async (fileOps, options = {}) => {
    if (!user || !fileOps || fileOps.length === 0) return;
    const { agent = 'user' } = options;

    console.log(`[FileSystem] Syncing ${fileOps.length} file changes (agent: ${agent})`);

    // In development mode, save to localStorage
    if (USE_LOCAL_STORAGE) {
      const localData = getLocalFiles();
      const updatedFiles = [...localData.files];
      const updatedFolders = [...localData.folders];

      for (const op of fileOps) {
        const filename = op.filename.split('/').pop();
        const mimeType = guessMimeType(op.filename);

        if (op.type === 'delete') {
          const index = updatedFiles.findIndex(f => f.path === op.filename);
          if (index !== -1) {
            updatedFiles.splice(index, 1);
          }
        } else {
          // Check if file exists
          const existingIndex = updatedFiles.findIndex(f => f.path === op.filename);
          const fileData = {
            id: existingIndex !== -1 ? updatedFiles[existingIndex].id : `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            filename,
            path: op.filename,
            mimeType,
            content: op.content, // Store actual content for local dev
            size: op.content?.length || 0,
            createdAt: existingIndex !== -1 ? updatedFiles[existingIndex].createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          if (existingIndex !== -1) {
            updatedFiles[existingIndex] = fileData;
          } else {
            updatedFiles.push(fileData);
          }

          // Add folder if it doesn't exist
          const folderPath = op.filename.includes('/') ? op.filename.split('/').slice(0, -1).join('/') : null;
          if (folderPath && !updatedFolders.some(f => f.path === folderPath)) {
            updatedFolders.push({
              id: `folder:${folderPath}`,
              path: folderPath,
              name: folderPath.split('/').pop(),
              isFolder: true,
            });
          }
        }
      }

      saveLocalFiles(updatedFiles, updatedFolders);
      setFiles(updatedFiles);
      setFolders(updatedFolders);
      console.log('[FileSystem] Saved to localStorage:', updatedFiles.length, 'files');
      return;
    }

    // Production: sync to Firebase
    for (const op of fileOps) {
      try {
        if (op.type === 'delete') {
          const existingFile = files.find(f => f.path === op.filename);
          if (existingFile) {
            await deleteFile(existingFile.id);
          }
        } else {
          const mimeType = guessMimeType(op.filename);
          const content = typeof op.content === 'string'
            ? btoa(unescape(encodeURIComponent(op.content)))
            : op.content;

          await makeAuthenticatedRequest('/api/files', {
            method: 'POST',
            body: JSON.stringify({
              filename: op.filename.split('/').pop(),
              path: op.filename,
              content,
              mimeType,
              encoding: 'base64',
            }),
          }, agent);
        }
      } catch (err) {
        console.error(`Failed to sync ${op.filename}:`, err);
      }
    }

    // Refresh after sync
    await refresh();
  }, [user, files, deleteFile, makeAuthenticatedRequest, refresh]);

  // Track expanded folders in sidebar
  const [expandedFolders, setExpandedFolders] = useState(['assistant', 'code']);

  // Toggle folder expansion
  const toggleFolder = useCallback((folder) => {
    setExpandedFolders(prev =>
      prev.includes(folder)
        ? prev.filter(f => f !== folder)
        : [...prev, folder]
    );
  }, []);

  // Check if folder is expanded
  const isFolderExpanded = useCallback((folder) => {
    return expandedFolders.includes(folder);
  }, [expandedFolders]);

  // Group files by top-level folder (assistant/, code/)
  const filesByFolder = useMemo(() => {
    const result = { assistant: [], code: [] };

    files.forEach(file => {
      const path = file.path || '';
      if (path.startsWith('assistant/')) {
        result.assistant.push(file);
      } else if (path.startsWith('code/')) {
        result.code.push(file);
      }
    });

    return result;
  }, [files]);

  // Build folder tree structure
  const folderTree = useMemo(() => {
    const tree = {};

    // Add folders from explicit folder list
    folders.forEach(folder => {
      const parts = (folder.path || '').split('/').filter(Boolean);
      let current = tree;
      parts.forEach((part, i) => {
        if (!current[part]) {
          current[part] = { __isFolder: true, __children: {} };
        }
        current = current[part].__children;
      });
    });

    // Add folders derived from file paths
    files.forEach(file => {
      const parts = (file.path || '').split('/').filter(Boolean);
      let current = tree;
      // All but last part are folders
      parts.slice(0, -1).forEach(part => {
        if (!current[part]) {
          current[part] = { __isFolder: true, __children: {} };
        }
        current = current[part].__children;
      });
    });

    return tree;
  }, [files, folders]);

  // Get total counts
  const totalFiles = files.length;
  const totalFolders = folders.length;

  // Context value
  const value = useMemo(() => ({
    // State
    files,
    folders,
    folderTree,
    filesByFolder,
    totalFiles,
    totalFolders,
    loading,
    uploading,
    uploadProgress,
    error,
    initialized,

    // Navigation
    currentPath,
    selectedItem,
    navigateTo,
    selectItem,

    // Actions
    loadFiles,
    uploadFile,
    deleteFile,
    deleteFolder,
    moveFile,
    createFolder,
    getFileContent,
    getFolderContents,
    refresh,

    // Project Management (replaces artifacts)
    projects,
    activeProject,
    activeProjectSlug,
    createProject,
    updateProjectMeta,
    deleteProject,
    loadProject,
    clearActiveProject,

    // AI Integration (legacy)
    getFilesForAI,
    syncChangesFromAI,

    // Project Files (for PreviewPanel)
    getFilesByProjectSlug,

    // AI Tool Operations (on-demand, lazy-loading)
    getFileListForAI,
    fetchFileByPath,
    writeFileByPath,
    deleteFileByPath,
    createFolderByPath,
    listDirectoryByPath,

    // Folder Expansion (for sidebar)
    isFolderExpanded,
    toggleFolder,

    // Helpers
    clearError: () => setError(null),
    guessMimeType,
  }), [
    files,
    folders,
    folderTree,
    filesByFolder,
    totalFiles,
    totalFolders,
    loading,
    uploading,
    uploadProgress,
    error,
    initialized,
    currentPath,
    selectedItem,
    navigateTo,
    selectItem,
    loadFiles,
    uploadFile,
    deleteFile,
    deleteFolder,
    moveFile,
    createFolder,
    getFileContent,
    getFolderContents,
    refresh,
    projects,
    activeProject,
    activeProjectSlug,
    createProject,
    updateProjectMeta,
    deleteProject,
    loadProject,
    clearActiveProject,
    getFilesForAI,
    syncChangesFromAI,
    getFilesByProjectSlug,
    getFileListForAI,
    fetchFileByPath,
    writeFileByPath,
    deleteFileByPath,
    createFolderByPath,
    listDirectoryByPath,
    isFolderExpanded,
    toggleFolder,
  ]);

  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
};

export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystem must be used within FileSystemProvider');
  }
  return context;
};

export default FileSystemContext;
