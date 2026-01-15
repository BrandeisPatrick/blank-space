/**
 * Files API Endpoint
 * CRUD operations for user file storage with nested folder support
 *
 * GET    /api/files              - List all files (optional ?path=/Documents)
 * GET    /api/files?id={id}      - Get file metadata + signed download URL
 * POST   /api/files              - Upload file (JSON with base64 content)
 * POST   /api/files?action=folder - Create folder
 * PUT    /api/files              - Move/rename file
 * DELETE /api/files?id={id}      - Delete file
 * DELETE /api/files?action=folder&path={path} - Delete folder and contents
 */

import { verifyAuth, getFirestore, getStorage } from './middleware/_auth.js';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types (all folders can accept these)
const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Images
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/svg+xml',
  'image/webp',
  // Code
  'text/javascript',
  'text/css',
  'text/html',
];

/**
 * Validate path - no directory traversal, valid characters
 */
function isValidPath(path) {
  if (!path || typeof path !== 'string') return false;
  // No directory traversal
  if (path.includes('..')) return false;
  // Must start with / or be relative
  // Allow alphanumeric, dots, hyphens, underscores, forward slashes
  if (!/^[a-zA-Z0-9._\-\/\s]+$/.test(path)) return false;
  // No double slashes
  if (path.includes('//')) return false;
  // No trailing slash (except root)
  if (path.length > 1 && path.endsWith('/')) return false;
  return true;
}

/**
 * Normalize path - ensure consistent format
 */
function normalizePath(path) {
  // Remove leading slash for storage
  let normalized = path.startsWith('/') ? path.slice(1) : path;
  // Remove trailing slash
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  return normalized;
}

/**
 * Extract parent folder from path
 */
function getParentPath(path) {
  const normalized = normalizePath(path);
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash === -1) return '/';
  return '/' + normalized.slice(0, lastSlash);
}

/**
 * Extract filename from path
 */
function getFilename(path) {
  const normalized = normalizePath(path);
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash === -1 ? normalized : normalized.slice(lastSlash + 1);
}

/**
 * Convert PDF to Markdown
 */
async function convertPdfToMarkdown(pdfBuffer, originalFilename) {
  try {
    // Dynamic import for pdf-parse
    const pdfParse = (await import('pdf-parse')).default;
    const pdfData = await pdfParse(pdfBuffer);

    // Create markdown content
    const title = originalFilename.replace(/\.pdf$/i, '');
    const markdownContent = `# ${title}\n\n${pdfData.text}`;

    return {
      content: Buffer.from(markdownContent, 'utf-8'),
      filename: originalFilename.replace(/\.pdf$/i, '.md'),
      mimeType: 'text/markdown',
    };
  } catch (error) {
    console.error('PDF conversion error:', error);
    // Return original if conversion fails
    return null;
  }
}

export default async function handler(req, res) {
  try {
    // Verify authentication for all operations
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const { userId } = authResult;
    const db = getFirestore();
    const storage = getStorage();

    switch (req.method) {
      case 'GET':
        if (req.query.id) {
          return handleGetFile(db, storage, userId, req.query.id, res);
        }
        return handleList(db, userId, req.query.path, res);
      case 'POST':
        if (req.query.action === 'folder') {
          return handleCreateFolder(db, userId, req.body, res);
        }
        return handleUpload(db, storage, userId, req.body, res);
      case 'PUT':
        return handleMove(db, storage, userId, req.body, res);
      case 'DELETE':
        if (req.query.action === 'folder') {
          return handleDeleteFolder(db, storage, userId, req.query.path, res);
        }
        return handleDelete(db, storage, userId, req.query.id, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Files API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * List files for user (optionally filtered by path)
 */
async function handleList(db, userId, filterPath, res) {
  let query = db
    .collection('users')
    .doc(userId)
    .collection('files')
    .orderBy('updatedAt', 'desc');

  const snapshot = await query.get();

  const files = [];
  const folders = new Set();

  // Normalize filter path
  const normalizedFilter = filterPath ? normalizePath(filterPath) : '';

  snapshot.forEach((doc) => {
    const data = doc.data();
    const filePath = data.path || '';

    // If filtering by path, only include files under that path
    if (normalizedFilter) {
      if (!filePath.startsWith(normalizedFilter + '/') && filePath !== normalizedFilter) {
        return;
      }
    }

    // Track folders from file paths
    const pathParts = filePath.split('/');
    let currentPath = '';
    for (let i = 0; i < pathParts.length - 1; i++) {
      currentPath += (i > 0 ? '/' : '') + pathParts[i];
      folders.add(currentPath);
    }

    files.push({
      id: doc.id,
      filename: data.filename,
      path: data.path,
      folder: data.folder, // Keep for backwards compatibility
      mimeType: data.mimeType,
      size: data.size,
      isFolder: false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  });

  // Also get explicit folder documents
  const foldersSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('folders')
    .get();

  foldersSnapshot.forEach((doc) => {
    const data = doc.data();
    folders.add(data.path);
  });

  // Convert folders to array with folder objects
  const folderList = Array.from(folders).map(folderPath => ({
    id: `folder:${folderPath}`,
    filename: getFilename(folderPath),
    path: folderPath,
    isFolder: true,
    createdAt: null,
    updatedAt: null,
  }));

  return res.status(200).json({
    success: true,
    files,
    folders: folderList,
    count: files.length,
    folderCount: folderList.length,
    filterPath: filterPath || '/',
  });
}

/**
 * Get single file metadata + signed download URL
 */
async function handleGetFile(db, storage, userId, fileId, res) {
  const fileRef = db
    .collection('users')
    .doc(userId)
    .collection('files')
    .doc(fileId);

  const fileDoc = await fileRef.get();

  if (!fileDoc.exists) {
    return res.status(404).json({
      error: 'Not found',
      message: 'File not found',
    });
  }

  const data = fileDoc.data();

  // Generate signed download URL (expires in 1 hour)
  const bucket = storage.bucket();
  const storagePath = `users/${userId}/files/${data.path}`;
  const file = bucket.file(storagePath);

  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  return res.status(200).json({
    success: true,
    file: {
      id: fileDoc.id,
      filename: data.filename,
      path: data.path,
      folder: data.folder,
      mimeType: data.mimeType,
      size: data.size,
      extractedText: data.extractedText || null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      downloadUrl: signedUrl,
    },
  });
}

/**
 * Create folder
 */
async function handleCreateFolder(db, userId, body, res) {
  const { path } = body;

  if (!path) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'path is required',
    });
  }

  const normalizedPath = normalizePath(path);

  if (!isValidPath(normalizedPath)) {
    return res.status(400).json({
      error: 'Invalid path',
      message: 'Path contains invalid characters or traversal sequences',
    });
  }

  // Store folder metadata in Firestore
  const folderData = {
    path: normalizedPath,
    name: getFilename(normalizedPath),
    createdAt: new Date().toISOString(),
  };

  // Use path as document ID (replace / with _)
  const folderId = normalizedPath.replace(/\//g, '_');

  await db
    .collection('users')
    .doc(userId)
    .collection('folders')
    .doc(folderId)
    .set(folderData);

  return res.status(201).json({
    success: true,
    folder: {
      id: `folder:${normalizedPath}`,
      path: normalizedPath,
      name: folderData.name,
      isFolder: true,
      createdAt: folderData.createdAt,
    },
  });
}

/**
 * Upload new file
 */
async function handleUpload(db, storage, userId, body, res) {
  let { filename, path: filePath, content, mimeType, encoding = 'base64' } = body;

  // Support legacy 'folder' field
  const folder = body.folder;

  // Validate required fields
  if (!filename || !content || !mimeType) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'filename, content, and mimeType are required',
    });
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: `File type ${mimeType} not allowed`,
    });
  }

  // Decode content
  let fileBuffer;
  if (encoding === 'base64') {
    fileBuffer = Buffer.from(content, 'base64');
  } else {
    fileBuffer = Buffer.from(content, 'utf-8');
  }

  // Validate size
  if (fileBuffer.length > MAX_FILE_SIZE) {
    return res.status(400).json({
      error: 'File too large',
      message: `Max file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    });
  }

  // Sanitize filename (keep spaces, replace other special chars)
  let sanitizedFilename = filename.replace(/[^a-zA-Z0-9._\-\s]/g, '_');

  // Convert PDF to Markdown
  if (mimeType === 'application/pdf') {
    const converted = await convertPdfToMarkdown(fileBuffer, sanitizedFilename);
    if (converted) {
      fileBuffer = converted.content;
      sanitizedFilename = converted.filename;
      mimeType = converted.mimeType;
    }
  }

  // Build full path
  let fullPath;
  if (filePath) {
    // New style: full path provided
    const normalizedPath = normalizePath(filePath);
    if (!isValidPath(normalizedPath)) {
      return res.status(400).json({
        error: 'Invalid path',
        message: 'Path contains invalid characters or traversal sequences',
      });
    }
    fullPath = normalizedPath;
  } else if (folder) {
    // Legacy style: folder + filename
    fullPath = `${folder}/${sanitizedFilename}`;
  } else {
    // Default to root
    fullPath = sanitizedFilename;
  }

  // Upload to Firebase Storage
  const bucket = storage.bucket();
  const storagePath = `users/${userId}/files/${fullPath}`;
  const file = bucket.file(storagePath);

  await file.save(fileBuffer, {
    metadata: {
      contentType: mimeType,
    },
  });

  // Extract folder from path for backwards compatibility
  const extractedFolder = fullPath.includes('/')
    ? fullPath.split('/')[0]
    : null;

  // Store metadata in Firestore
  const fileData = {
    filename: sanitizedFilename,
    path: fullPath,
    folder: extractedFolder, // Keep for backwards compatibility
    mimeType,
    size: fileBuffer.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const fileRef = await db
    .collection('users')
    .doc(userId)
    .collection('files')
    .add(fileData);

  return res.status(201).json({
    success: true,
    file: {
      id: fileRef.id,
      ...fileData,
    },
  });
}

/**
 * Move/rename file
 */
async function handleMove(db, storage, userId, body, res) {
  const { fileId, newPath } = body;

  if (!fileId || !newPath) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'fileId and newPath are required',
    });
  }

  const normalizedNewPath = normalizePath(newPath);

  if (!isValidPath(normalizedNewPath)) {
    return res.status(400).json({
      error: 'Invalid path',
      message: 'Path contains invalid characters or traversal sequences',
    });
  }

  // Get current file
  const fileRef = db
    .collection('users')
    .doc(userId)
    .collection('files')
    .doc(fileId);

  const fileDoc = await fileRef.get();

  if (!fileDoc.exists) {
    return res.status(404).json({
      error: 'Not found',
      message: 'File not found',
    });
  }

  const currentData = fileDoc.data();
  const currentStoragePath = `users/${userId}/files/${currentData.path}`;
  const newStoragePath = `users/${userId}/files/${normalizedNewPath}`;

  // Copy file in Storage
  const bucket = storage.bucket();
  const sourceFile = bucket.file(currentStoragePath);
  const destFile = bucket.file(newStoragePath);

  await sourceFile.copy(destFile);
  await sourceFile.delete();

  // Extract new folder and filename
  const newFilename = getFilename(normalizedNewPath);
  const newFolder = normalizedNewPath.includes('/')
    ? normalizedNewPath.split('/')[0]
    : null;

  // Update Firestore metadata
  const updateData = {
    filename: newFilename,
    path: normalizedNewPath,
    folder: newFolder,
    updatedAt: new Date().toISOString(),
  };

  await fileRef.update(updateData);

  return res.status(200).json({
    success: true,
    file: {
      id: fileId,
      ...currentData,
      ...updateData,
    },
  });
}

/**
 * Delete file
 */
async function handleDelete(db, storage, userId, fileId, res) {
  if (!fileId) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'File ID is required in query parameters',
    });
  }

  const fileRef = db
    .collection('users')
    .doc(userId)
    .collection('files')
    .doc(fileId);

  const fileDoc = await fileRef.get();

  if (!fileDoc.exists) {
    return res.status(404).json({
      error: 'Not found',
      message: 'File not found',
    });
  }

  const data = fileDoc.data();

  // Delete from Storage
  const bucket = storage.bucket();
  const storagePath = `users/${userId}/files/${data.path}`;
  const file = bucket.file(storagePath);

  try {
    await file.delete();
  } catch (error) {
    // File might not exist in storage, continue with Firestore deletion
    console.warn('Storage file not found:', storagePath);
  }

  // Delete from Firestore
  await fileRef.delete();

  return res.status(200).json({
    success: true,
    message: 'File deleted successfully',
    fileId,
  });
}

/**
 * Delete folder and all contents
 */
async function handleDeleteFolder(db, storage, userId, folderPath, res) {
  if (!folderPath) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Folder path is required',
    });
  }

  const normalizedPath = normalizePath(folderPath);

  if (!isValidPath(normalizedPath)) {
    return res.status(400).json({
      error: 'Invalid path',
      message: 'Path contains invalid characters or traversal sequences',
    });
  }

  const bucket = storage.bucket();

  // Delete all files under this folder path
  const filesSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('files')
    .get();

  const deletePromises = [];

  filesSnapshot.forEach((doc) => {
    const data = doc.data();
    const filePath = data.path || '';

    // Check if file is under the folder being deleted
    if (filePath.startsWith(normalizedPath + '/') || filePath === normalizedPath) {
      // Delete from storage
      const storagePath = `users/${userId}/files/${filePath}`;
      deletePromises.push(
        bucket.file(storagePath).delete().catch(() => {
          // Ignore storage errors
        })
      );

      // Delete from Firestore
      deletePromises.push(doc.ref.delete());
    }
  });

  // Delete the folder document
  const folderId = normalizedPath.replace(/\//g, '_');
  deletePromises.push(
    db
      .collection('users')
      .doc(userId)
      .collection('folders')
      .doc(folderId)
      .delete()
      .catch(() => {
        // Folder doc might not exist
      })
  );

  // Delete any nested folder documents
  const foldersSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('folders')
    .get();

  foldersSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.path && (data.path.startsWith(normalizedPath + '/') || data.path === normalizedPath)) {
      deletePromises.push(doc.ref.delete());
    }
  });

  await Promise.all(deletePromises);

  return res.status(200).json({
    success: true,
    message: 'Folder deleted successfully',
    path: normalizedPath,
  });
}
