/**
 * File Panel Component
 * Displays user's file storage in a collapsible tree view
 * Shows assistant/ and code/ agent-scoped workspaces
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { AnimatedFilesIcon, ChevronRightIcon, PlusIcon } from '../icons/icons';
import { FolderIcon, FileIcon, ChevronIcon } from './fileIcons';
import { formatSize } from '../../utils/formatSize';

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
