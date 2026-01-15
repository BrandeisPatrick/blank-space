/**
 * File Explorer Component
 * macOS Finder-style column view file browser
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';

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

// Chevron icon
const ChevronRight = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Plus icon for new folder
const PlusIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
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

// Column Item Component
const ColumnItem = ({ item, isSelected, onClick, colors }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        height: '40px',
        padding: '0 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        background: isSelected ? colors.selected : isHovered ? colors.hover : 'transparent',
        color: isSelected ? '#fff' : colors.text,
        transition: 'background 0.15s ease',
      }}
    >
      <span style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
        height: 20,
        flexShrink: 0,
      }}>
        {item.isFolder ? (
          <FolderIcon size={20} />
        ) : (
          <FileIcon mimeType={item.mimeType} size={20} />
        )}
      </span>
      <span
        style={{
          flex: 1,
          fontSize: colors.fontSize.sm,
          fontFamily: colors.fontFamily,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {item.name || item.filename}
      </span>
      {item.isFolder && (
        <ChevronRight size={12} />
      )}
    </div>
  );
};

// Single Column Component
const Column = ({ path, items, selectedPath, onSelect, colors, onCreateFolder, onUpload, onDeleteFolder }) => {
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (showNewFolder && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showNewFolder]);

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      const folderPath = path === '/' ? newFolderName.trim() : `${path.replace(/^\//, '')}/${newFolderName.trim()}`;
      await onCreateFolder(folderPath);
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  return (
    <div
      style={{
        minWidth: '200px',
        maxWidth: '250px',
        height: '100%',
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        background: colors.columnBg,
      }}
    >
      {/* Column header with actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 12px',
          paddingTop: '40px',
          gap: '4px',
        }}
      >
        <span
          style={{
            fontSize: colors.fontSize.sm,
            fontWeight: colors.fontWeight.medium,
            color: colors.textSecondary,
            fontFamily: colors.fontFamily,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {path === '/' ? 'Root' : path.split('/').pop()}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowNewFolder(true)}
            title="New Folder"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              background: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: colors.textSecondary,
              opacity: 0.7,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = colors.hover; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.background = 'transparent'; }}
          >
            <PlusIcon size={20} />
          </button>
          <button
            onClick={() => onUpload(path)}
            title="Upload File"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              background: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: colors.textSecondary,
              opacity: 0.7,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = colors.hover; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.background = 'transparent'; }}
          >
            <UploadIcon size={20} />
          </button>
          {selectedPath && (
            <button
              onClick={() => {
                const folderName = selectedPath.split('/').pop();
                if (window.confirm(`Delete folder "${folderName}" and all its contents?`)) {
                  onDeleteFolder(selectedPath);
                }
              }}
              title="Delete Folder"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                background: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                color: colors.textSecondary,
                opacity: 0.7,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = colors.hover; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.background = 'transparent'; }}
            >
              <TrashIcon size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Items list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {/* New folder input */}
        {showNewFolder && (
          <div style={{ padding: '4px 6px', marginBottom: '4px' }}>
            <input
              ref={inputRef}
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName(''); }
              }}
              onBlur={() => { if (!newFolderName.trim()) setShowNewFolder(false); }}
              placeholder="Folder name..."
              style={{
                width: '100%',
                padding: '4px 8px',
                fontSize: colors.fontSize.sm,
                fontFamily: colors.fontFamily,
                background: colors.inputBg,
                border: `1px solid ${colors.selected}`,
                borderRadius: '4px',
                color: colors.text,
                outline: 'none',
              }}
            />
          </div>
        )}

        {items.length === 0 && !showNewFolder ? (
          <div
            style={{
              padding: '20px 10px',
              textAlign: 'center',
              color: colors.textSecondary,
              fontSize: colors.fontSize.sm,
              fontFamily: colors.fontFamily,
            }}
          >
            Empty folder
          </div>
        ) : (
          items.map((item) => (
            <ColumnItem
              key={item.id || item.path}
              item={item}
              isSelected={selectedPath === (item.isFolder ? `/${item.path}` : item.path)}
              onClick={() => onSelect(item)}
              colors={colors}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Breadcrumb Component
const Breadcrumb = ({ path, onNavigate, colors }) => {
  const parts = path === '/' ? [] : path.replace(/^\//, '').split('/');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '12px 16px',
        background: colors.breadcrumbBg,
        fontSize: colors.fontSize.sm,
        fontFamily: colors.fontFamily,
        overflow: 'hidden',
      }}
    >
      <span
        onClick={() => onNavigate('/')}
        style={{
          cursor: 'pointer',
          color: parts.length > 0 ? colors.link : colors.text,
          fontWeight: parts.length === 0 ? colors.fontWeight.semibold : colors.fontWeight.normal,
        }}
      >
        Files
      </span>
      {parts.map((part, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: colors.textSecondary }}>/</span>
          <span
            onClick={() => onNavigate('/' + parts.slice(0, i + 1).join('/'))}
            style={{
              cursor: 'pointer',
              color: i === parts.length - 1 ? colors.text : colors.link,
              fontWeight: i === parts.length - 1 ? colors.fontWeight.semibold : colors.fontWeight.normal,
            }}
          >
            {part}
          </span>
        </span>
      ))}
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
  const isText = ['text/plain', 'text/markdown', 'application/json', 'text/javascript', 'text/css', 'text/html'].includes(file.mimeType);
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
            fontSize: '14px',
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
  const {
    getFolderContents,
    createFolder,
    deleteFolder,
    loading,
    initialized,
    currentPath,
    navigateTo,
  } = useFileSystem();

  // Track column paths for multi-column navigation
  const [columns, setColumns] = useState(['/']);

  // Track selected file for preview
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

  // Update columns when currentPath changes
  useEffect(() => {
    if (currentPath === '/') {
      setColumns(['/']);
    } else {
      const parts = currentPath.replace(/^\//, '').split('/');
      const newColumns = ['/'];
      let path = '';
      parts.forEach(part => {
        path += (path ? '/' : '') + part;
        newColumns.push('/' + path);
      });
      setColumns(newColumns);
    }
  }, [currentPath]);

  // Handle item selection
  const handleSelect = useCallback((item, columnIndex) => {
    if (item.isFolder) {
      const newPath = '/' + item.path;
      // Keep columns up to this one, add new column
      setColumns(prev => [...prev.slice(0, columnIndex + 1), newPath]);
      navigateTo(newPath);
      setSelectedFile(null); // Clear file selection when navigating folders
    } else {
      // File selected - show in preview panel
      setSelectedFile(item);
    }
  }, [navigateTo]);

  // Handle folder creation
  const handleCreateFolder = useCallback(async (folderPath) => {
    try {
      await createFolder(folderPath);
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  }, [createFolder]);

  // Handle upload trigger
  const handleUpload = useCallback((targetPath) => {
    if (onUpload) {
      onUpload(targetPath);
    }
  }, [onUpload]);

  // Handle folder deletion
  const handleDeleteFolder = useCallback(async (folderPath) => {
    try {
      await deleteFolder(folderPath);
      // Update columns to remove deleted folder and any columns after it
      setColumns(prev => {
        const folderIndex = prev.indexOf('/' + folderPath.replace(/^\//, ''));
        if (folderIndex > 0) {
          return prev.slice(0, folderIndex);
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to delete folder:', err);
    }
  }, [deleteFolder]);

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = useCallback((path) => {
    navigateTo(path);
  }, [navigateTo]);

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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: colors.bg,
      }}
    >
      {/* Breadcrumb */}
      <Breadcrumb
        path={currentPath}
        onNavigate={handleBreadcrumbNavigate}
        colors={colors}
      />

      {/* Column container + Preview */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Columns */}
        <div
          style={{
            flex: selectedFile ? '0 0 auto' : 1,
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'hidden',
            minWidth: selectedFile ? '400px' : undefined,
          }}
        >
          {loading && !initialized ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                color: colors.textSecondary,
                fontSize: colors.fontSize.sm,
                fontFamily: colors.fontFamily,
              }}
            >
              Loading...
            </div>
          ) : (
            columns.map((colPath, index) => {
              const items = getFolderContents(colPath);
              const nextColPath = columns[index + 1];
              return (
                <Column
                  key={colPath}
                  path={colPath}
                  items={items}
                  selectedPath={nextColPath}
                  onSelect={(item) => handleSelect(item, index)}
                  onCreateFolder={handleCreateFolder}
                  onUpload={handleUpload}
                  onDeleteFolder={handleDeleteFolder}
                  colors={colors}
                />
              );
            })
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
