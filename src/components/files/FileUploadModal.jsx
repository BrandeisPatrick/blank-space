/**
 * File Upload Modal
 * Modal for uploading files to user's storage
 * Supports drag-and-drop and file picker
 * Now supports arbitrary paths (not just fixed folders)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { getTheme } from '../../styles/theme';
import { Z_INDEX } from '../../constants';
import {
  createModalColors,
  createModalBackdropStyle,
  createModalPanelStyle,
  MODAL_ANIMATIONS,
} from '../../styles/componentStyles';

// All allowed file types
const ALLOWED_TYPES = {
  accept: '.pdf,.txt,.md,.json,.docx,.png,.jpg,.jpeg,.gif,.svg,.webp,.js,.css,.html',
  description: 'Documents, Images, and Code files',
  mimeTypes: [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/json',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
    'image/webp',
    'text/javascript',
    'text/css',
    'text/html',
  ],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Close icon
const CloseIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Upload icon
const UploadIcon = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

// File icon
const FileIcon = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

// Folder icon
const FolderIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
    <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
  </svg>
);

export const FileUploadModal = ({ isOpen, onClose, initialFolder = '/' }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const colors = createModalColors(theme, mode);
  const { uploadFile, uploading, uploadProgress } = useFileSystem();

  const [targetPath, setTargetPath] = useState(initialFolder);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  // Update path when initialFolder prop changes
  useEffect(() => {
    if (isOpen) {
      setTargetPath(initialFolder);
      setSelectedFile(null);
      setError(null);
    }
  }, [isOpen, initialFolder]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle file selection
  const handleFileSelect = useCallback((file) => {
    setError(null);

    // Validate file type
    if (!ALLOWED_TYPES.mimeTypes.includes(file.type)) {
      setError(`Invalid file type. Allowed: ${ALLOWED_TYPES.description}`);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);
  }, []);

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      await uploadFile(selectedFile, targetPath);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }, [selectedFile, targetPath, uploadFile, onClose]);

  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format path for display
  const displayPath = targetPath === '/' ? 'Root' : targetPath.replace(/^\//, '');

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={createModalBackdropStyle(Z_INDEX.MODAL_BACKDROP)}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        style={{
          ...createModalPanelStyle(theme, Z_INDEX.MODALS),
          width: '100%',
          maxWidth: '480px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: theme.spacing.md,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.medium,
              fontFamily: colors.fontFamily,
              color: colors.textPrimary,
            }}
          >
            Upload File
          </h2>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: colors.textSecondary,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.hoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: theme.spacing.lg }}>
          {/* Target Path Display */}
          <div style={{ marginBottom: theme.spacing.lg }}>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.sm,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                fontFamily: colors.fontFamily,
                color: colors.textSecondary,
              }}
            >
              Upload to
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: theme.radius.lg,
                color: colors.textPrimary,
                fontSize: theme.typography.fontSize.sm,
                fontFamily: colors.fontFamily,
              }}
            >
              <FolderIcon size={16} />
              <span>{displayPath}</span>
            </div>
            <p
              style={{
                marginTop: theme.spacing.sm,
                fontSize: theme.typography.fontSize.xs,
                fontFamily: colors.fontFamily,
                color: colors.textTertiary,
              }}
            >
              Allowed: {ALLOWED_TYPES.description}
            </p>
          </div>

          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: `${theme.spacing['2xl']} ${theme.spacing.lg}`,
              border: `2px dashed ${dragActive ? colors.accent : colors.border}`,
              borderRadius: theme.radius.xl,
              background: dragActive ? `${colors.accent}10` : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.accept}
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />

            {selectedFile ? (
              <>
                <FileIcon size={32} />
                <p
                  style={{
                    marginTop: theme.spacing.md,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    fontFamily: colors.fontFamily,
                    color: colors.textPrimary,
                  }}
                >
                  {selectedFile.name}
                </p>
                <p
                  style={{
                    marginTop: theme.spacing.xs,
                    fontSize: theme.typography.fontSize.xs,
                    fontFamily: colors.fontFamily,
                    color: colors.textTertiary,
                  }}
                >
                  {formatSize(selectedFile.size)}
                </p>
              </>
            ) : (
              <>
                <UploadIcon size={40} />
                <p
                  style={{
                    marginTop: theme.spacing.md,
                    fontSize: theme.typography.fontSize.sm,
                    fontFamily: colors.fontFamily,
                    color: colors.textSecondary,
                  }}
                >
                  Drop a file here or click to browse
                </p>
                <p
                  style={{
                    marginTop: theme.spacing.xs,
                    fontSize: theme.typography.fontSize.xs,
                    fontFamily: colors.fontFamily,
                    color: colors.textTertiary,
                  }}
                >
                  Max size: 10MB
                </p>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <p
              style={{
                marginTop: theme.spacing.md,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                background: `${colors.error}15`,
                borderRadius: theme.radius.md,
                fontSize: theme.typography.fontSize.sm,
                fontFamily: colors.fontFamily,
                color: colors.error,
              }}
            >
              {error}
            </p>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div style={{ marginTop: theme.spacing.lg }}>
              <div
                style={{
                  height: '4px',
                  background: colors.cardBg,
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    background: colors.accent,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <p
                style={{
                  marginTop: theme.spacing.sm,
                  fontSize: theme.typography.fontSize.xs,
                  fontFamily: colors.fontFamily,
                  color: colors.textTertiary,
                  textAlign: 'center',
                }}
              >
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            gap: theme.spacing.md,
            padding: theme.spacing.md,
            borderTop: `1px solid ${colors.border}`,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: theme.spacing.md,
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: theme.radius.lg,
              cursor: 'pointer',
              color: colors.textPrimary,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              fontFamily: colors.fontFamily,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.cardBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            style={{
              flex: 1,
              padding: theme.spacing.md,
              background: selectedFile && !uploading
                ? colors.accent
                : colors.cardBg,
              border: 'none',
              borderRadius: theme.radius.lg,
              cursor: selectedFile && !uploading ? 'pointer' : 'not-allowed',
              color: selectedFile && !uploading ? '#ffffff' : colors.textTertiary,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              fontFamily: colors.fontFamily,
              transition: 'all 0.15s ease',
              opacity: selectedFile && !uploading ? 1 : 0.6,
            }}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        {/* Animations */}
        <style>{MODAL_ANIMATIONS}</style>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

FileUploadModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialFolder: PropTypes.string,
};

export default FileUploadModal;
