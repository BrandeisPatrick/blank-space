import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { useConversation } from '../../contexts/ConversationContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { getTheme } from '../../styles/theme';
import { SearchIcon, ChatIcon, CloseIcon, AIIcon, TrashIcon } from '../icons/icons';

// Constants
const MS_PER_DAY = 86400000;
const MS_PER_HOUR = 3600000;
const MS_PER_MINUTE = 60000;
const PREVIEW_CHAR_LIMIT = 500;

// Group conversations by time periods
const groupConversationsByPeriod = (conversations) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - MS_PER_DAY);
  const lastWeek = new Date(today.getTime() - 7 * MS_PER_DAY);
  const thisYearStart = new Date(now.getFullYear(), 0, 1);

  const groups = {
    today: [],
    yesterday: [],
    lastWeek: [],
    thisYear: [],
    older: {},
  };

  conversations.forEach(conv => {
    const timestamp = conv.updatedAt || conv.createdAt;
    const date = new Date(timestamp);

    if (date >= today) {
      groups.today.push(conv);
    } else if (date >= yesterday) {
      groups.yesterday.push(conv);
    } else if (date >= lastWeek) {
      groups.lastWeek.push(conv);
    } else if (date >= thisYearStart) {
      groups.thisYear.push(conv);
    } else {
      const year = date.getFullYear().toString();
      if (!groups.older[year]) groups.older[year] = [];
      groups.older[year].push(conv);
    }
  });

  return groups;
};

// Format relative date
const formatRelativeDate = (timestamp) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / MS_PER_HOUR);
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / MS_PER_MINUTE);
      return diffMins <= 1 ? 'Just now' : `${diffMins} mins ago`;
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Conversation row component
const ConversationRow = ({ conv, isSelected, onClick, onDelete }) => (
  <div
    className={`conversation-item ${isSelected ? 'conversation-item--selected' : ''}`}
    onClick={onClick}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
      <AIIcon size={16} color="currentColor" style={{ opacity: 0.5 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {conv.title || 'New conversation'}
      </span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
      {onDelete && (
        <button
          className="icon-btn icon-btn--danger hover-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(conv.id);
          }}
          title="Delete conversation"
        >
          <TrashIcon size={16} />
        </button>
      )}
      <span style={{ fontSize: '13px', opacity: 0.5, minWidth: '70px', textAlign: 'right' }}>
        {formatRelativeDate(conv.updatedAt || conv.createdAt)}
      </span>
    </div>
  </div>
);

ConversationRow.propTypes = {
  conv: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
};

// Section header component
const SectionHeader = ({ title, action }) => (
  <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span>{title}</span>
    {action}
  </div>
);

SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  action: PropTypes.node,
};

// Message preview component
const MessagePreview = ({ message }) => {
  const isUser = message.type === 'user' || message.role === 'user';
  const content = typeof message.content === 'string'
    ? message.content.slice(0, PREVIEW_CHAR_LIMIT) + (message.content.length > PREVIEW_CHAR_LIMIT ? '...' : '')
    : '[Complex content]';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{
        fontSize: '11px',
        fontWeight: 600,
        opacity: isUser ? 0.7 : 0.5,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {isUser ? 'You' : 'Assistant'}
      </span>
      <div style={{
        fontSize: '14px',
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: '120px',
        overflow: 'hidden',
      }}>
        {content}
      </div>
    </div>
  );
};

MessagePreview.propTypes = {
  message: PropTypes.object.isRequired,
};

export const SearchModal = ({ isOpen, onClose, onSelectConversation, onCreateNew }) => {
  const { mode } = useTheme();
  const { conversations, activeConversationId, deleteConversation, getConversation } = useConversation();
  const theme = getTheme(mode);
  const inputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [isActionsExpanded, setIsActionsExpanded] = useState(false);

  // Use escape key hook
  useEscapeKey(onClose, isOpen);

  // Memoized colors
  const colors = useMemo(() => ({
    bg: theme.colors.bg.primary,
    bgSecondary: theme.colors.bg.secondary,
    border: theme.colors.border,
    textPrimary: theme.colors.text.primary,
    textTertiary: theme.colors.text.tertiary,
    fontFamily: theme.typography.fontFamily.sans,
  }), [theme]);

  // Memoized handlers
  const handleDeleteConversation = useCallback(async (convId) => {
    if (window.confirm('Delete this conversation?')) {
      await deleteConversation(convId);
      if (selectedConvId === convId) {
        setSelectedConvId(null);
      }
    }
  }, [deleteConversation, selectedConvId]);

  const handleConversationClick = useCallback((conv) => {
    setSelectedConvId(conv.id);
  }, []);

  const handleCreateNew = useCallback(() => {
    onCreateNew();
    onClose();
  }, [onCreateNew, onClose]);

  const handleOpenConversation = useCallback(() => {
    if (selectedConvId) {
      onSelectConversation(selectedConvId);
      onClose();
    }
  }, [selectedConvId, onSelectConversation, onClose]);

  // Get full conversation with messages for preview
  const selectedConversation = useMemo(() => {
    if (!selectedConvId) return null;
    return getConversation(selectedConvId);
  }, [selectedConvId, getConversation]);

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
      setSelectedConvId(null);
      setIsActionsExpanded(false);
    }
  }, [isOpen]);

  // Filter and group conversations
  const { filteredConversations, groupedConversations } = useMemo(() => {
    const filtered = conversations
      .filter(c => c.messageCount > 0 || c.id === activeConversationId)
      .filter(c => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (c.title || '').toLowerCase().includes(query);
      })
      .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

    return {
      filteredConversations: filtered,
      groupedConversations: groupConversationsByPeriod(filtered),
    };
  }, [conversations, activeConversationId, searchQuery]);

  // Combine recent conversations for display
  const recentConversations = useMemo(() => [
    ...groupedConversations.today,
    ...groupedConversations.yesterday,
    ...groupedConversations.lastWeek,
  ], [groupedConversations]);

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
          maxWidth: '1000px',
          height: '80%',
          maxHeight: '700px',
          background: colors.bg,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          fontFamily: colors.fontFamily,
        }}
      >
        {/* Search Header */}
        <div className="modal-header" style={{ gap: '12px' }}>
          <SearchIcon size={20} color={colors.textTertiary} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
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

        {/* Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel - Conversation List */}
          <div
            className="dark-scrollbar"
            style={{
              width: '50%',
              borderRight: `1px solid ${colors.border}`,
              overflow: 'auto',
              padding: '8px',
              color: colors.textPrimary,
            }}
          >
            {/* Actions Section */}
            <SectionHeader
              title="Actions"
              action={
                <button
                  onClick={() => setIsActionsExpanded(!isActionsExpanded)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: colors.textTertiary,
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: colors.fontFamily,
                  }}
                >
                  {isActionsExpanded ? 'Show Less' : 'Show All'}
                </button>
              }
            />
            <button
              className="list-item"
              onClick={handleCreateNew}
              style={{
                width: '100%',
                textAlign: 'left',
                fontFamily: colors.fontFamily,
                color: colors.textPrimary,
              }}
            >
              <ChatIcon size={18} />
              <span style={{ marginLeft: '12px' }}>Create New Private Chat</span>
            </button>

            {/* Conversations List */}
            {filteredConversations.length === 0 ? (
              <div style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: colors.textTertiary,
                fontSize: '14px',
              }}>
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </div>
            ) : (
              <>
                {/* Last 7 Days */}
                {recentConversations.length > 0 && (
                  <>
                    <SectionHeader title="Last 7 Days" />
                    {recentConversations.map(conv => (
                      <ConversationRow
                        key={conv.id}
                        conv={conv}
                        isSelected={selectedConvId === conv.id}
                        onClick={() => handleConversationClick(conv)}
                        onDelete={handleDeleteConversation}
                      />
                    ))}
                  </>
                )}

                {/* This Year */}
                {groupedConversations.thisYear.length > 0 && (
                  <>
                    <SectionHeader title="This Year" />
                    {groupedConversations.thisYear.map(conv => (
                      <ConversationRow
                        key={conv.id}
                        conv={conv}
                        isSelected={selectedConvId === conv.id}
                        onClick={() => handleConversationClick(conv)}
                        onDelete={handleDeleteConversation}
                      />
                    ))}
                  </>
                )}

                {/* Older Years */}
                {Object.keys(groupedConversations.older)
                  .sort((a, b) => Number(b) - Number(a))
                  .map(year => (
                    <div key={year}>
                      <SectionHeader title={year} />
                      {groupedConversations.older[year].map(conv => (
                        <ConversationRow
                          key={conv.id}
                          conv={conv}
                          isSelected={selectedConvId === conv.id}
                          onClick={() => handleConversationClick(conv)}
                          onDelete={handleDeleteConversation}
                        />
                      ))}
                    </div>
                  ))}
              </>
            )}
          </div>

          {/* Right Panel - Preview */}
          <div
            className="dark-scrollbar"
            style={{
              width: '50%',
              display: 'flex',
              flexDirection: 'column',
              background: colors.bgSecondary,
              overflow: 'hidden',
              color: colors.textPrimary,
            }}
          >
            {selectedConversation ? (
              <>
                {/* Header */}
                <div style={{
                  padding: '20px 24px',
                  borderBottom: `1px solid ${colors.border}`,
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 500,
                    marginBottom: '4px',
                    fontFamily: colors.fontFamily,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {selectedConversation.title || 'New conversation'}
                  </h3>
                  <div style={{ fontSize: '12px', color: colors.textTertiary }}>
                    {selectedConversation.messages?.length || 0} messages
                  </div>
                </div>

                {/* Messages Preview */}
                <div
                  className="dark-scrollbar"
                  style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}
                >
                  {selectedConversation.messages?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {selectedConversation.messages.map((msg, idx) => (
                        <MessagePreview key={idx} message={msg} />
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      color: colors.textTertiary,
                      fontSize: '14px',
                      textAlign: 'center',
                      paddingTop: '40px',
                    }}>
                      No messages yet
                    </div>
                  )}
                </div>

                {/* Footer with Open button */}
                <div style={{ padding: '16px 24px', borderTop: `1px solid ${colors.border}` }}>
                  <button
                    className="btn btn-primary btn-block"
                    onClick={handleOpenConversation}
                    style={{ fontFamily: colors.fontFamily }}
                  >
                    Open Conversation
                  </button>
                </div>
              </>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: '15px', color: colors.textTertiary, fontFamily: colors.fontFamily }}>
                  Select a conversation to preview
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

SearchModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectConversation: PropTypes.func.isRequired,
  onCreateNew: PropTypes.func.isRequired,
};

export default SearchModal;
