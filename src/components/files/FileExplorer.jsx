/**
 * File Explorer Component
 * macOS Finder-style tree view file browser
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';

// Hook to detect mobile screen
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
};

// Folder icon (hollow/stroke style to match sidebar)
const FolderIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

// File icon based on type
const FileIcon = ({ mimeType, size = 16 }) => {
  const isImage = mimeType?.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';
  const isMarkdown = mimeType === 'text/markdown';
  const isJson = mimeType === 'application/json';

  if (isImage) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }

  if (isPdf || isMarkdown) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    );
  }

  if (isJson) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M8 13h2" />
        <path d="M8 17h2" />
      </svg>
    );
  }

  // Default file icon
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
};

// Chevron icon for expand/collapse
const ChevronIcon = ({ expanded, size = 12 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{
      transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
      transition: 'transform 0.15s ease',
    }}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Upload icon
const UploadIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

// Trash icon
const TrashIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// Back arrow icon for mobile navigation
const BackIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

// Tree Item Component - Single row in the tree
const TreeItem = ({
  item,
  depth,
  isExpanded,
  isSelected,
  onToggleExpand,
  onSelect,
  colors,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const itemPath = item.isFolder ? `/${item.path}` : item.path;

  return (
    <div
      onClick={() => onSelect(item)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '40px',
        paddingLeft: `${12 + depth * 16}px`,
        paddingRight: '12px',
        borderRadius: '8px',
        cursor: 'pointer',
        background: isSelected ? colors.selected : isHovered ? colors.hover : 'transparent',
        color: colors.text,
        transition: 'background 0.15s ease',
        userSelect: 'none',
      }}
    >
      {/* Chevron for folders */}
      <span
        onClick={(e) => {
          if (item.isFolder) {
            e.stopPropagation();
            onToggleExpand(itemPath);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
          marginRight: '8px',
          opacity: item.isFolder ? 1 : 0,
          cursor: item.isFolder ? 'pointer' : 'default',
        }}
      >
        {item.isFolder && <ChevronIcon expanded={isExpanded} size={14} />}
      </span>

      {/* Icon */}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          marginRight: '12px',
          flexShrink: 0,
        }}
      >
        {item.isFolder ? (
          <FolderIcon size={20} />
        ) : (
          <FileIcon mimeType={item.mimeType} size={20} />
        )}
      </span>

      {/* Name */}
      <span
        style={{
          flex: 1,
          fontSize: colors.fontSize.sm,
          fontWeight: 400,
          fontFamily: colors.fontFamily,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {item.name || item.filename}
      </span>
    </div>
  );
};

// Tree View Component - Recursive list rendering
const TreeView = ({
  path,
  depth,
  expandedFolders,
  selectedPath,
  onToggleExpand,
  onSelect,
  getFolderContents,
  colors,
}) => {
  const items = getFolderContents(path);

  return (
    <>
      {items.map((item) => {
        const itemPath = item.isFolder ? `/${item.path}` : item.path;
        const isExpanded = expandedFolders.has(itemPath);
        const isSelected = selectedPath === itemPath;

        return (
          <div key={item.id || item.path}>
            <TreeItem
              item={item}
              depth={depth}
              isExpanded={isExpanded}
              isSelected={isSelected}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              colors={colors}
            />
            {/* Recursively render children if folder is expanded */}
            {item.isFolder && isExpanded && (
              <TreeView
                path={itemPath}
                depth={depth + 1}
                expandedFolders={expandedFolders}
                selectedPath={selectedPath}
                onToggleExpand={onToggleExpand}
                onSelect={onSelect}
                getFolderContents={getFolderContents}
                colors={colors}
              />
            )}
          </div>
        );
      })}
    </>
  );
};

// Toolbar Component
const Toolbar = ({
  selectedPath,
  onUpload,
  onDelete,
  colors,
}) => {
  // Determine if delete should be enabled
  // Can't delete root-level system folders (assistant, code)
  const canDelete = selectedPath && !['/', '/assistant', '/code'].includes(selectedPath) &&
    !selectedPath.match(/^\/?(assistant|code)$/);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 12px',
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      {/* Upload Button */}
      <button
        onClick={onUpload}
        title="Upload File"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'transparent',
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          cursor: 'pointer',
          color: colors.text,
          fontSize: colors.fontSize.sm,
          fontWeight: 400,
          fontFamily: colors.fontFamily,
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = colors.hover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <UploadIcon size={14} />
        <span>Upload</span>
      </button>

      {/* Delete Button (only shown when deletable item selected) */}
      {canDelete && (
        <button
          onClick={onDelete}
          title="Delete"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: 'transparent',
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            cursor: 'pointer',
            color: colors.text,
            fontSize: colors.fontSize.sm,
            fontWeight: 400,
            fontFamily: colors.fontFamily,
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <TrashIcon size={14} />
          <span>Delete</span>
        </button>
      )}
    </div>
  );
};

// Preview Panel Component
const PreviewPanel = ({ file, colors }) => {
  if (!file) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.textSecondary,
        fontSize: colors.fontSize.sm,
        fontFamily: colors.fontFamily,
        padding: '20px',
      }}>
        Select a file to preview
      </div>
    );
  }

  const isMarkdown = file.mimeType === 'text/markdown';
  const isCode = file.mimeType?.startsWith('text/') ||
    file.mimeType?.startsWith('application/') && [
      'application/json',
      'application/javascript',
      'application/typescript',
      'application/xml',
    ].includes(file.mimeType);
  const isText = isCode || file.filename?.match(/\.(jsx?|tsx?|json|css|html?|md|txt|py|rb|go|rs|java|c|cpp|h|sh|yaml|yml|toml|xml|svg)$/i);
  const isImage = file.mimeType?.startsWith('image/');

  // Simple markdown rendering (headers, bold, italic, lists, code)
  const renderMarkdown = (content) => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeContent = [];

    lines.forEach((line, i) => {
      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${i}`} style={{
              background: colors.hover,
              padding: '12px',
              borderRadius: '6px',
              overflow: 'auto',
              fontSize: '13px',
              fontFamily: 'monospace',
              margin: '8px 0',
            }}>
              {codeContent.join('\n')}
            </pre>
          );
          codeContent = [];
        }
        inCodeBlock = !inCodeBlock;
        return;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(<h1 key={i} style={{ fontSize: '24px', fontWeight: 600, margin: '16px 0 8px' }}>{line.slice(2)}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={i} style={{ fontSize: '20px', fontWeight: 600, margin: '14px 0 6px' }}>{line.slice(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={i} style={{ fontSize: '16px', fontWeight: 600, margin: '12px 0 4px' }}>{line.slice(4)}</h3>);
      }
      // Lists
      else if (line.match(/^[-*]\s/)) {
        elements.push(<li key={i} style={{ marginLeft: '20px', margin: '4px 0' }}>{line.slice(2)}</li>);
      } else if (line.match(/^\d+\.\s/)) {
        elements.push(<li key={i} style={{ marginLeft: '20px', margin: '4px 0', listStyleType: 'decimal' }}>{line.replace(/^\d+\.\s/, '')}</li>);
      }
      // Blockquote
      else if (line.startsWith('> ')) {
        elements.push(<blockquote key={i} style={{
          borderLeft: `3px solid ${colors.selected}`,
          paddingLeft: '12px',
          margin: '8px 0',
          color: colors.textSecondary,
        }}>{line.slice(2)}</blockquote>);
      }
      // Empty line
      else if (line.trim() === '') {
        elements.push(<br key={i} />);
      }
      // Regular paragraph
      else {
        // Handle inline formatting (bold, italic, code)
        let text = line;
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
        text = text.replace(/`(.+?)`/g, '<code style="background: rgba(128,128,128,0.2); padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>');
        elements.push(<p key={i} style={{ margin: '4px 0' }} dangerouslySetInnerHTML={{ __html: text }} />);
      }
    });

    return elements;
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      borderLeft: `1px solid ${colors.border}`,
      background: colors.bg,
      minWidth: '300px',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        paddingTop: '40px',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <FileIcon mimeType={file.mimeType} size={18} />
        <span style={{
          fontSize: colors.fontSize.sm,
          fontWeight: colors.fontWeight.medium,
          color: colors.text,
          fontFamily: colors.fontFamily,
        }}>
          {file.filename}
        </span>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px',
      }}>
        {isImage && file.content ? (
          <img
            src={`data:${file.mimeType};base64,${file.content}`}
            alt={file.filename}
            style={{ maxWidth: '100%', borderRadius: '8px' }}
          />
        ) : isMarkdown && file.content ? (
          <div style={{
            color: colors.text,
            fontFamily: colors.fontFamily,
            fontSize: colors.fontSize.sm,
            lineHeight: '1.6',
          }}>
            {renderMarkdown(file.content)}
          </div>
        ) : isText && file.content ? (
          <pre style={{
            color: colors.text,
            fontFamily: 'monospace',
            fontSize: '13px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {file.content}
          </pre>
        ) : (
          <div style={{
            color: colors.textSecondary,
            fontSize: colors.fontSize.sm,
            fontFamily: colors.fontFamily,
            textAlign: 'center',
            padding: '40px 20px',
          }}>
            {file.content ? 'Preview not available for this file type' : 'No content available'}
          </div>
        )}
      </div>

      {/* Footer with file info */}
      <div style={{
        padding: '8px 16px',
        borderTop: `1px solid ${colors.border}`,
        fontSize: '11px',
        color: colors.textSecondary,
        fontFamily: colors.fontFamily,
        display: 'flex',
        gap: '16px',
      }}>
        <span>{file.mimeType}</span>
        {file.size && <span>{(file.size / 1024).toFixed(1)} KB</span>}
      </div>
    </div>
  );
};

// Main FileExplorer Component
const FileExplorer = ({ expanded = true, onUpload }) => {
  const { user } = useAuth();
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const isMobile = useIsMobile();
  const {
    getFolderContents,
    deleteFolder,
    loading,
    initialized,
  } = useFileSystem();

  // Tree view state
  const [expandedFolders, setExpandedFolders] = useState(new Set(['/']));
  const [selectedPath, setSelectedPath] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Colors and typography - matches sidebar styling
  const colors = {
    bg: theme.colors.bg.primary,
    columnBg: theme.colors.bg.primary,
    border: theme.colors.border,
    text: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    selected: theme.colors.bg.secondary,
    hover: theme.colors.bg.secondary,
    link: theme.colors.accent.primary,
    breadcrumbBg: theme.colors.bg.primary,
    inputBg: theme.colors.bg.secondary,
    fontFamily: theme.typography.fontFamily.sans,
    fontSize: {
      sm: theme.typography.fontSize.sm,
      xs: theme.typography.fontSize.xs,
    },
    fontWeight: theme.typography.fontWeight,
  };

  // Toggle folder expansion
  const handleToggleExpand = useCallback((path) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Handle item selection
  const handleSelect = useCallback((item) => {
    const itemPath = item.isFolder ? `/${item.path}` : item.path;
    setSelectedPath(itemPath);

    if (item.isFolder) {
      // Auto-expand folder when selected
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        next.add(itemPath);
        return next;
      });
      setSelectedFile(null);
    } else {
      // File selected - show in preview panel
      setSelectedFile(item);
    }
  }, []);

  // Handle upload trigger
  const handleUpload = useCallback(() => {
    if (onUpload) {
      // Determine target path for upload
      let targetPath = '/';
      if (selectedPath) {
        if (selectedPath.startsWith('/')) {
          targetPath = selectedPath;
        } else {
          // If a file is selected, upload to its parent folder
          const parts = selectedPath.split('/');
          parts.pop();
          targetPath = '/' + parts.join('/');
        }
      }
      onUpload(targetPath);
    }
  }, [onUpload, selectedPath]);

  // Handle folder deletion
  const handleDelete = useCallback(async () => {
    if (!selectedPath) return;

    // Don't allow deleting system folders
    if (['/', '/assistant', '/code'].includes(selectedPath) ||
        selectedPath.match(/^\/?(assistant|code)$/)) {
      return;
    }

    const itemName = selectedPath.split('/').pop();
    if (window.confirm(`Delete "${itemName}" and all its contents?`)) {
      try {
        await deleteFolder(selectedPath);
        // Remove deleted folder and all its children from expandedFolders
        setExpandedFolders((prev) => {
          const next = new Set(prev);
          for (const path of prev) {
            if (path === selectedPath || path.startsWith(selectedPath + '/')) {
              next.delete(path);
            }
          }
          return next;
        });
        setSelectedPath(null);
        setSelectedFile(null);
      } catch (err) {
        console.error('Failed to delete:', err);
      }
    }
  }, [selectedPath, deleteFolder]);

  // Mobile navigation state
  const [mobilePath, setMobilePath] = useState('/');

  // Handle mobile back navigation
  const handleMobileBack = useCallback(() => {
    const parts = mobilePath.replace(/^\//, '').split('/').filter(Boolean);
    if (parts.length > 0) {
      parts.pop();
      const newPath = parts.length === 0 ? '/' : '/' + parts.join('/');
      setMobilePath(newPath);
      setSelectedFile(null);
    }
  }, [mobilePath]);

  // Handle mobile item selection
  const handleMobileSelect = useCallback((item) => {
    if (item.isFolder) {
      setMobilePath(`/${item.path}`);
      setSelectedFile(null);
    } else {
      setSelectedFile(item);
    }
  }, []);

  // Get current folder name for mobile header
  const currentFolderName = mobilePath === '/'
    ? 'Files'
    : mobilePath.split('/').pop() || 'Files';

  if (!user) {
    return (
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          color: colors.textSecondary,
          fontSize: colors.fontSize.sm,
          fontFamily: colors.fontFamily,
        }}
      >
        Sign in to access files
      </div>
    );
  }

  if (!expanded) {
    return null;
  }

  // Mobile: drill-down view (kept for mobile UX)
  if (isMobile) {
    const currentItems = getFolderContents(mobilePath);
    const canGoBack = mobilePath !== '/';

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: colors.bg,
        }}
      >
        {/* Mobile Header with back button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.border}`,
            gap: '12px',
          }}
        >
          {canGoBack && (
            <button
              onClick={handleMobileBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                color: colors.link,
              }}
            >
              <BackIcon size={24} />
            </button>
          )}
          <span
            style={{
              flex: 1,
              fontSize: '16px',
              fontWeight: 600,
              fontFamily: colors.fontFamily,
              color: colors.text,
            }}
          >
            {currentFolderName}
          </span>
        </div>

        {/* Mobile action buttons */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '8px 16px',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <button
            onClick={() => onUpload && onUpload(mobilePath)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              color: colors.text,
              fontSize: colors.fontSize.sm,
            }}
          >
            <UploadIcon size={12} />
            <span>Upload</span>
          </button>
        </div>

        {/* Items list */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {loading && !initialized ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: colors.textSecondary,
                fontSize: colors.fontSize.sm,
                fontFamily: colors.fontFamily,
              }}
            >
              Loading...
            </div>
          ) : currentItems.length === 0 ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: colors.textSecondary,
                fontSize: colors.fontSize.sm,
              }}
            >
              Empty folder
            </div>
          ) : (
            currentItems.map((item) => (
              <TreeItem
                key={item.id || item.path}
                item={item}
                depth={0}
                isExpanded={false}
                isSelected={false}
                onToggleExpand={() => {}}
                onSelect={() => handleMobileSelect(item)}
                colors={colors}
              />
            ))
          )}
        </div>

        {/* Mobile Preview Panel (full screen overlay) */}
        {selectedFile && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: colors.bg,
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: `1px solid ${colors.border}`,
                gap: '12px',
              }}
            >
              <button
                onClick={() => setSelectedFile(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: colors.link,
                }}
              >
                <BackIcon size={24} />
              </button>
              <span
                style={{
                  flex: 1,
                  fontSize: '16px',
                  fontWeight: 600,
                  fontFamily: colors.fontFamily,
                  color: colors.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedFile.filename}
              </span>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <PreviewPanel file={selectedFile} colors={colors} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop: Tree view with preview panel
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: colors.bg,
      }}
    >
      {/* Toolbar */}
      <Toolbar
        selectedPath={selectedPath}
        onUpload={handleUpload}
        onDelete={handleDelete}
        colors={colors}
      />

      {/* Tree + Preview container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Tree view panel */}
        <div
          style={{
            width: selectedFile ? '280px' : '100%',
            minWidth: '200px',
            maxWidth: selectedFile ? '400px' : undefined,
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            borderRight: selectedFile ? `1px solid ${colors.border}` : 'none',
            paddingTop: '8px',
            paddingBottom: '8px',
          }}
        >
          {loading && !initialized ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: colors.textSecondary,
                fontSize: colors.fontSize.sm,
                fontFamily: colors.fontFamily,
              }}
            >
              Loading...
            </div>
          ) : (
            <TreeView
              path="/"
              depth={0}
              expandedFolders={expandedFolders}
              selectedPath={selectedPath}
              onToggleExpand={handleToggleExpand}
              onSelect={handleSelect}
              getFolderContents={getFolderContents}
              colors={colors}
            />
          )}
        </div>

        {/* Preview Panel */}
        {selectedFile && (
          <PreviewPanel file={selectedFile} colors={colors} />
        )}
      </div>
    </div>
  );
};

FileExplorer.propTypes = {
  expanded: PropTypes.bool,
  onUpload: PropTypes.func,
};

export default FileExplorer;
