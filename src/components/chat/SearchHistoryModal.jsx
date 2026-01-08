import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { useConversation } from '../../contexts/ConversationContext';
import { getTheme } from '../../styles/theme';

// Icons
const SearchIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ChatIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const CloseIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const AIIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const TrashIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// Group conversations by time periods
const groupConversationsByPeriod = (conversations) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const lastWeek = new Date(today.getTime() - 7 * 86400000);
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
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / 60000);
      return diffMins <= 1 ? 'Just now' : `${diffMins} mins ago`;
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  // Format as date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Conversation row component
const ConversationRow = ({ conv, isSelected, colors, onClick, onDelete, showAIIcon = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        textAlign: 'left',
        padding: '12px 16px',
        background: isSelected ? colors.activeBg : isHovered ? colors.hoverBg : 'transparent',
        border: 'none',
        borderRadius: '8px',
        color: colors.textPrimary,
        fontSize: '14px',
        fontWeight: 400,
        cursor: 'pointer',
        fontFamily: colors.fontFamily,
        transition: 'background 0.15s ease',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
        {showAIIcon && <AIIcon size={16} color={colors.textTertiary} />}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {conv.title || 'New conversation'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {isHovered && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(conv.id);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: colors.textTertiary,
              transition: 'color 0.15s ease, background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ff4444';
              e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = colors.textTertiary;
              e.currentTarget.style.background = 'transparent';
            }}
            title="Delete conversation"
          >
            <TrashIcon size={16} />
          </button>
        )}
        <span style={{ fontSize: '13px', color: colors.textTertiary, minWidth: '70px', textAlign: 'right' }}>
          {formatRelativeDate(conv.updatedAt || conv.createdAt)}
        </span>
      </div>
    </div>
  );
};

// Section header component
const SectionHeader = ({ title, action, colors }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    marginTop: '16px',
  }}>
    <span style={{
      fontSize: '12px',
      fontWeight: 500,
      color: colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    }}>
      {title}
    </span>
    {action}
  </div>
);

export const SearchHistoryModal = ({ isOpen, onClose, onSelectConversation, onCreateNew }) => {
  const { mode } = useTheme();
  const { conversations, activeConversationId, deleteConversation } = useConversation();
  const theme = getTheme(mode);
  const inputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [showAllActions, setShowAllActions] = useState(false);

  // Handle delete conversation
  const handleDeleteConversation = async (convId) => {
    if (window.confirm('Delete this conversation?')) {
      await deleteConversation(convId);
      if (selectedConvId === convId) {
        setSelectedConvId(null);
      }
    }
  };

  const colors = {
    bg: theme.colors.bg.primary,
    bgSecondary: theme.colors.bg.secondary,
    activeBg: theme.colors.bg.secondary,
    hoverBg: theme.colors.bg.tertiary || theme.colors.bg.secondary,
    border: theme.colors.border,
    textPrimary: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    textTertiary: theme.colors.text.tertiary,
    fontFamily: theme.typography.fontFamily.sans,
  };

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
      setShowAllActions(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  // Get selected conversation for preview
  const selectedConversation = useMemo(() => {
    if (!selectedConvId) return null;
    return conversations.find(c => c.id === selectedConvId);
  }, [selectedConvId, conversations]);

  const handleConversationClick = (conv) => {
    setSelectedConvId(conv.id);
  };

  const handleConversationDoubleClick = (conv) => {
    onSelectConversation(conv.id);
    onClose();
  };

  const handleCreateNew = () => {
    onCreateNew();
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '90%',
          maxWidth: '1000px',
          height: '80%',
          maxHeight: '700px',
          background: colors.bg,
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Search Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <SearchIcon size={20} color={colors.textTertiary} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              color: colors.textPrimary,
              fontFamily: colors.fontFamily,
            }}
          />
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
              borderRadius: '6px',
              cursor: 'pointer',
              color: colors.textTertiary,
              transition: 'color 0.15s ease, background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.hoverBg;
              e.currentTarget.style.color = colors.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = colors.textTertiary;
            }}
          >
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
            }}
          >
            {/* Actions Section */}
            <SectionHeader
              title="Actions"
              action={
                <button
                  onClick={() => setShowAllActions(!showAllActions)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: colors.textTertiary,
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: colors.fontFamily,
                  }}
                >
                  {showAllActions ? 'Show Less' : 'Show All'}
                </button>
              }
              colors={colors}
            />
            <button
              onClick={handleCreateNew}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                background: colors.activeBg,
                border: 'none',
                borderRadius: '8px',
                color: colors.textPrimary,
                fontSize: '14px',
                fontWeight: 400,
                cursor: 'pointer',
                fontFamily: colors.fontFamily,
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.hoverBg}
              onMouseLeave={(e) => e.currentTarget.style.background = colors.activeBg}
            >
              <ChatIcon size={18} color={colors.textSecondary} />
              <span>Create New Private Chat</span>
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
                {(groupedConversations.today.length > 0 ||
                  groupedConversations.yesterday.length > 0 ||
                  groupedConversations.lastWeek.length > 0) && (
                  <>
                    <SectionHeader title="Last 7 Days" colors={colors} />
                    {[...groupedConversations.today, ...groupedConversations.yesterday, ...groupedConversations.lastWeek].map(conv => (
                      <ConversationRow
                        key={conv.id}
                        conv={conv}
                        isSelected={selectedConvId === conv.id}
                        colors={colors}
                        onClick={() => handleConversationClick(conv)}
                        onDelete={handleDeleteConversation}
                        showAIIcon={true}
                      />
                    ))}
                  </>
                )}

                {/* This Year */}
                {groupedConversations.thisYear.length > 0 && (
                  <>
                    <SectionHeader title="This Year" colors={colors} />
                    {groupedConversations.thisYear.map(conv => (
                      <ConversationRow
                        key={conv.id}
                        conv={conv}
                        isSelected={selectedConvId === conv.id}
                        colors={colors}
                        onClick={() => handleConversationClick(conv)}
                        onDelete={handleDeleteConversation}
                        showAIIcon={true}
                      />
                    ))}
                  </>
                )}

                {/* Older Years */}
                {Object.keys(groupedConversations.older)
                  .sort((a, b) => Number(b) - Number(a))
                  .map(year => (
                    <div key={year}>
                      <SectionHeader title={year} colors={colors} />
                      {groupedConversations.older[year].map(conv => (
                        <ConversationRow
                          key={conv.id}
                          conv={conv}
                          isSelected={selectedConvId === conv.id}
                          colors={colors}
                          onClick={() => handleConversationClick(conv)}
                          onDelete={handleDeleteConversation}
                          showAIIcon={true}
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
                    color: colors.textPrimary,
                    marginBottom: '4px',
                    fontFamily: colors.fontFamily,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {selectedConversation.title || 'New conversation'}
                  </h3>
                  <div style={{
                    fontSize: '12px',
                    color: colors.textTertiary,
                  }}>
                    {selectedConversation.messages?.length || 0} messages
                  </div>
                </div>

                {/* Messages Preview */}
                <div
                  className="dark-scrollbar"
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '16px 24px',
                  }}
                >
                  {selectedConversation.messages?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {selectedConversation.messages.map((msg, idx) => {
                        const isUser = msg.type === 'user' || msg.role === 'user';
                        return (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: isUser ? colors.textSecondary : colors.textTertiary,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>
                              {isUser ? 'You' : 'Assistant'}
                            </span>
                            <div style={{
                              fontSize: '14px',
                              color: colors.textPrimary,
                              lineHeight: 1.5,
                              fontFamily: colors.fontFamily,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              maxHeight: '120px',
                              overflow: 'hidden',
                              position: 'relative',
                            }}>
                              {typeof msg.content === 'string'
                                ? msg.content.slice(0, 500) + (msg.content.length > 500 ? '...' : '')
                                : '[Complex content]'}
                            </div>
                          </div>
                        );
                      })}
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
                <div style={{
                  padding: '16px 24px',
                  borderTop: `1px solid ${colors.border}`,
                }}>
                  <button
                    onClick={() => {
                      onSelectConversation(selectedConversation.id);
                      onClose();
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      background: theme.colors.accent?.ios || '#0A84FF',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: colors.fontFamily,
                      transition: 'opacity 0.15s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
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
                <span style={{
                  fontSize: '15px',
                  color: colors.textTertiary,
                  fontFamily: colors.fontFamily,
                }}>
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

SearchHistoryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectConversation: PropTypes.func.isRequired,
  onCreateNew: PropTypes.func.isRequired,
};

export default SearchHistoryModal;
