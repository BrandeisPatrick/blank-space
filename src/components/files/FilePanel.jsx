/**
 * File Panel Component
 * Displays user's file storage in a collapsible tree view
 * Shows assistant/ and code/ agent-scoped workspaces
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { AnimatedFilesIcon, ChevronRightIcon } from '../icons/icons';

// Folder icons
const FolderIcon = ({ size = 20, isOpen = false }) => (
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
    {isOpen ? (
      <>
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        <path d="M2 10h20" />
      </>
    ) : (
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    )}
  </svg>
);

// File type icons
const FileIcon = ({ mimeType, size = 16 }) => {
  // Determine icon based on mime type
  const isImage = mimeType?.startsWith('image/');
  const isPDF = mimeType === 'application/pdf';
  const isDoc = mimeType?.includes('document');

  return (
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
      {isImage ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </>
      ) : isPDF ? (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M9 15h6" />
          <path d="M9 11h6" />
        </>
      ) : isDoc ? (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </>
      ) : (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </>
      )}
    </svg>
  );
};

// Chevron icon for expand/collapse
const ChevronIcon = ({ size = 14, expanded = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s ease',
    }}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Plus icon for upload
const PlusIcon = ({ size = 16 }) => (
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
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// Files header with animated icon
const FilesHeader = ({ onClick, isExpanded, colors, isHovered, setIsHovered }) => (
  <button
    onClick={onClick}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '0 12px',
      width: '100%',
      height: '40px',
      background: isHovered ? colors.hoverBg : 'transparent',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      color: colors.textPrimary,
      fontSize: '14px',
      fontWeight: 400,
      fontFamily: colors.fontFamily,
      transition: 'background 0.15s ease',
    }}
  >
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, flexShrink: 0 }}>
      <AnimatedFilesIcon size={20} isHovered={isHovered} />
    </span>
    <span style={{ flex: 1, textAlign: 'left' }}>Files</span>
    <ChevronRightIcon size={14} expanded={isExpanded} />
  </button>
);

// Folder section (docs, photos)
const FolderSection = ({ folder, label, files, isExpanded, onToggle, onUpload, colors, loading }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div>
      {/* Folder header */}
      <button
        onClick={onToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          width: '100%',
          background: isHovered ? colors.hoverBg : 'transparent',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          color: colors.textSecondary,
          fontSize: '13px',
          fontWeight: 500,
          fontFamily: colors.fontFamily,
          transition: 'background 0.15s ease',
        }}
      >
        <ChevronIcon size={12} expanded={isExpanded} />
        <FolderIcon size={16} isOpen={isExpanded} />
        <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
        <span style={{ fontSize: '11px', color: colors.textTertiary }}>
          {loading ? '...' : files.length}
        </span>
        {/* Upload button */}
        <span
          onClick={(e) => {
            e.stopPropagation();
            onUpload(folder);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.15s ease',
            color: colors.textTertiary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.activeBg;
            e.currentTarget.style.color = colors.textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = colors.textTertiary;
          }}
        >
          <PlusIcon size={14} />
        </span>
      </button>

      {/* File list */}
      {isExpanded && (
        <div style={{ paddingLeft: '24px' }}>
          {files.length === 0 ? (
            <div style={{
              padding: '8px 12px',
              fontSize: '12px',
              color: colors.textTertiary,
              fontStyle: 'italic',
            }}>
              No files
            </div>
          ) : (
            files.map((file) => (
              <FileItem key={file.id} file={file} colors={colors} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Individual file item
const FileItem = ({ file, colors }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Format file size
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        width: '100%',
        background: isHovered ? colors.hoverBg : 'transparent',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        color: colors.textPrimary,
        fontSize: '13px',
        fontWeight: 400,
        fontFamily: colors.fontFamily,
        transition: 'background 0.15s ease',
        textAlign: 'left',
      }}
      title={`${file.filename}\n${formatSize(file.size)}`}
    >
      <FileIcon mimeType={file.mimeType} size={14} />
      <span style={{
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {file.filename}
      </span>
      <span style={{
        fontSize: '11px',
        color: colors.textTertiary,
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.15s ease',
      }}>
        {formatSize(file.size)}
      </span>
    </button>
  );
};

// Main FilePanel component
export const FilePanel = ({ expanded, colors, onUpload }) => {
  const {
    filesByFolder,
    loading,
    isFolderExpanded,
    toggleFolder,
  } = useFileSystem();

  const [isFilesExpanded, setIsFilesExpanded] = useState(true);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  const handleUpload = useCallback((folder) => {
    if (onUpload) {
      onUpload(folder);
    }
  }, [onUpload]);

  if (!expanded) return null;

  return (
    <div>
      {/* Files Header - Collapsible */}
      <FilesHeader
        onClick={() => setIsFilesExpanded(!isFilesExpanded)}
        isExpanded={isFilesExpanded}
        colors={colors}
        isHovered={isHeaderHovered}
        setIsHovered={setIsHeaderHovered}
      />

      {/* Folder Sections (agent-scoped workspaces) */}
      {isFilesExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
          <FolderSection
            folder="assistant"
            label="Assistant"
            files={filesByFolder.assistant}
            isExpanded={isFolderExpanded('assistant')}
            onToggle={() => toggleFolder('assistant')}
            onUpload={handleUpload}
            colors={colors}
            loading={loading}
          />
          <FolderSection
            folder="code"
            label="Code"
            files={filesByFolder.code}
            isExpanded={isFolderExpanded('code')}
            onToggle={() => toggleFolder('code')}
            onUpload={handleUpload}
            colors={colors}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
};

FilePanel.propTypes = {
  expanded: PropTypes.bool,
  colors: PropTypes.object.isRequired,
  onUpload: PropTypes.func,
};

export default FilePanel;
