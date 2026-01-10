import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { getTheme } from '../../styles/theme';
import { SearchIcon, CloseIcon } from '../icons/icons';

// App icon for list items
const AppIcon = ({ size = 16, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

export const AppsModal = ({ isOpen, onClose, apps, onStartEdit }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const inputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');

  // Use escape key hook
  useEscapeKey(onClose, isOpen);

  // Memoized colors
  const colors = useMemo(() => ({
    bg: theme.colors.bg.primary,
    bgSecondary: theme.colors.bg.secondary,
    border: theme.colors.border,
    textPrimary: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    textTertiary: theme.colors.text.tertiary,
    fontFamily: theme.typography.fontFamily.sans,
  }), [theme]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter apps by search query
  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return apps;
    const query = searchQuery.toLowerCase();
    return apps.filter(app => (app.title || '').toLowerCase().includes(query));
  }, [apps, searchQuery]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-container"
        style={{
          width: '90%',
          maxWidth: '500px',
          maxHeight: '70%',
          background: colors.bg,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          fontFamily: colors.fontFamily,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Search Header */}
        <div className="modal-header" style={{ gap: '12px' }}>
          <SearchIcon size={20} color={colors.textTertiary} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            style={{
              flex: 1,
              background: 'transparent',
              fontSize: '16px',
              color: colors.textPrimary,
              fontFamily: colors.fontFamily,
            }}
          />
          <button className="modal-close" onClick={onClose}>
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Apps List */}
        <div
          className="dark-scrollbar"
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '8px',
          }}
        >
          {filteredApps.length === 0 ? (
            <div style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: colors.textTertiary,
              fontSize: '14px',
            }}>
              {searchQuery ? 'No apps found' : 'No apps yet'}
            </div>
          ) : (
            filteredApps.map((app) => (
              <div
                key={app.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = mode === 'dark' ? '#1a1a1a' : '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* App Name */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flex: 1,
                  minWidth: 0,
                }}>
                  <AppIcon size={16} color={colors.textSecondary} />
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: colors.textPrimary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {app.title}
                  </span>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => {
                    onClose();
                    onStartEdit && onStartEdit(app);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: mode === 'dark' ? '#374151' : '#e5e7eb',
                    border: 'none',
                    borderRadius: '6px',
                    color: colors.textPrimary,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: colors.fontFamily,
                    flexShrink: 0,
                  }}
                >
                  Edit
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

AppsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  apps: PropTypes.array.isRequired,
  onStartEdit: PropTypes.func,
};

export default AppsModal;
