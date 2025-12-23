import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useChatApp } from '../../contexts/ChatAppContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';
import { Z_INDEX } from '../../constants';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
  MenuIcon,
  PlusIcon,
  TrashIcon,
  CloseIcon,
  SendIcon,
  ChevronDownIcon,
} from '../icons/icons';

const AVAILABLE_MODELS = [
  { id: 'gpt-4o-mini', name: 'Lite', description: 'Fast & efficient' },
  { id: 'gpt-4o', name: 'Pro', description: 'Most capable' },
];

export const ChatAppPanel = () => {
  const { mode } = useTheme();
  const {
    isChatOpen, closeChat, messages, addMessage, clearMessages,
    selectedModel, setSelectedModel,
    conversations, activeConversationId, createConversation, switchConversation, deleteConversation
  } = useChatApp();
  const theme = getTheme(mode);
  const isMobile = useIsMobile();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Auto-scroll to bottom when messages change or conversation switches
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversationId]);

  // Focus input when panel opens
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isChatOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsModelDropdownOpen(false);
      }
    };
    if (isModelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModelDropdownOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for the API
      const conversationHistory = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await callLLM({
        model: selectedModel,
        messages: conversationHistory,
        maxTokens: 2000,
        temperature: 0.7
      });

      const assistantContent = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
      addMessage({ role: 'assistant', content: assistantContent });
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({ role: 'assistant', content: 'Sorry, an error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isChatOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeChat}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: Z_INDEX.MODAL_BACKDROP,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isMobile ? '100%' : '95%',
          maxWidth: isMobile ? '100%' : '900px',
          height: '85vh',
          maxHeight: '85vh',
          ...createGlassEffect(theme),
          background: mode === 'dark'
            ? 'rgba(30, 30, 35, 0.75)'
            : 'rgba(255, 255, 255, 0.35)',
          borderRadius: theme.radius['2xl'],
          boxShadow: mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
            : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
          zIndex: Z_INDEX.MODALS,
          animation: 'slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Floating Pills Overlay */}
        {isSidebarOpen && (
          <>
            {/* Overlay backdrop to close on click outside */}
            <div
              onClick={() => setIsSidebarOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 10,
              }}
            />
            {/* Floating pills container */}
            <div style={{
              position: 'absolute',
              top: '60px',
              left: theme.spacing.md,
              width: '50%',
              maxWidth: '240px',
              zIndex: 11,
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.sm,
              animation: 'pillsFadeIn 0.2s ease-out',
            }}>
              {/* New Chat Pill */}
              <button
                onClick={() => {
                  createConversation();
                  setIsSidebarOpen(false);
                }}
                className={`pill-new-${mode} hover-scale-md hover-transition`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: theme.spacing.sm,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                  border: mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: theme.radius.full,
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.sm,
                  fontFamily: theme.typography.fontFamily.sans,
                  cursor: 'pointer',
                  boxShadow: mode === 'dark'
                    ? '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                    : '0 4px 16px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                  textAlign: 'left',
                }}
              >
                <PlusIcon size={14} color={theme.colors.text.primary} />
                New Chat
              </button>

              {/* Conversation Pills - only show latest 7 */}
              {conversations.slice(0, 7).map(conv => {
                const isActive = conv.id === activeConversationId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      switchConversation(conv.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`pill-${isActive ? 'active' : 'inactive'}-${mode} hover-scale-sm hover-transition`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: theme.spacing.sm,
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      backdropFilter: 'blur(40px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                      border: isActive
                        ? (mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.6)')
                        : (mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(255, 255, 255, 0.4)'),
                      borderRadius: theme.radius.full,
                      color: theme.colors.text.primary,
                      fontSize: theme.typography.fontSize.sm,
                      fontFamily: theme.typography.fontFamily.sans,
                      cursor: 'pointer',
                      boxShadow: mode === 'dark'
                        ? '0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.04)'
                        : '0 4px 16px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {conv.title}
                    </span>
                    {conversations.length > 1 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="hover-icon"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '18px',
                          height: '18px',
                          borderRadius: theme.radius.full,
                          cursor: 'pointer',
                        }}
                      >
                        <TrashIcon size={11} color={theme.colors.text.secondary} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: theme.spacing.md,
            borderBottom: mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
              {/* Sidebar Toggle */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`${isSidebarOpen ? `sidebar-toggle-open-${mode}` : `sidebar-toggle-closed ${mode}`} hover-transition`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  borderRadius: theme.radius.md,
                  cursor: 'pointer',
                }}
              >
  <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: isSidebarOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}>
                  {isSidebarOpen ? (
                    <CloseIcon size={18} color={theme.colors.text.secondary} />
                  ) : (
                    <MenuIcon size={18} color={theme.colors.text.secondary} />
                  )}
                </span>
              </button>

              <h2 style={{
              margin: 0,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              fontFamily: theme.typography.fontFamily.sans,
              color: theme.colors.text.primary,
            }}>
              Chat
            </h2>

            {/* Model Selector - Custom Dropdown */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className={`model-selector-${mode} hover-transition`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  border: 'none',
                  borderRadius: theme.radius.full,
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.sm,
                  fontFamily: theme.typography.fontFamily.sans,
                  cursor: 'pointer',
                }}
              >
                <span>{AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name}</span>
                <ChevronDownIcon
                  size={14}
                  color={theme.colors.text.secondary}
                />
              </button>

              {/* Dropdown Menu */}
              {isModelDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  minWidth: '180px',
                  background: mode === 'dark' ? 'rgba(40, 40, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: theme.radius.lg,
                  border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                  boxShadow: mode === 'dark'
                    ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                    : '0 8px 32px rgba(0, 0, 0, 0.12)',
                  padding: theme.spacing.xs,
                  zIndex: Z_INDEX.DROPDOWN,
                  animation: 'dropdownFadeIn 0.15s ease-out',
                }}>
                  {AVAILABLE_MODELS.map(model => {
                    const isSelected = selectedModel === model.id;
                    return (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setIsModelDropdownOpen(false);
                        }}
                        className={`${isSelected ? `dropdown-item-selected-${mode}` : `dropdown-item-unselected ${mode}`} hover-transition`}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          width: '100%',
                          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                          border: 'none',
                          borderRadius: theme.radius.md,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: isSelected ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
                          fontFamily: theme.typography.fontFamily.sans,
                          color: theme.colors.text.primary,
                        }}>
                          {model.name}
                        </span>
                        <span style={{
                          fontSize: theme.typography.fontSize.xs,
                          fontFamily: theme.typography.fontFamily.sans,
                          color: theme.colors.text.tertiary,
                          marginTop: '2px',
                        }}>
                          {model.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            {/* Close button */}
            <button
              onClick={closeChat}
              className={`hover-glass-${mode} hover-transition`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                background: 'transparent',
                border: 'none',
                borderRadius: theme.radius.full,
                cursor: 'pointer',
              }}
            >
              <CloseIcon size={20} color={theme.colors.text.secondary} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: theme.spacing.md,
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.md,
          filter: isSidebarOpen ? 'blur(3px)' : 'none',
          opacity: isSidebarOpen ? 0.5 : 1,
          transition: 'filter 0.2s ease, opacity 0.2s ease',
        }}>
          {messages.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.text.tertiary,
              fontSize: theme.typography.fontSize.base,
              textAlign: 'center',
              padding: theme.spacing.xl,
            }}>
              Start a conversation...
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  borderRadius: theme.radius.lg,
                  background: msg.role === 'user'
                    ? (mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)')
                    : mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.05)',
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.sm,
                  lineHeight: theme.typography.lineHeight.relaxed,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.content}
              </div>
            ))
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div style={{
              alignSelf: 'flex-start',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              borderRadius: theme.radius.lg,
              background: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.sm,
              fontStyle: 'italic',
            }}>
              Thinking...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          padding: theme.spacing.md,
          borderTop: mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
          display: 'flex',
          gap: theme.spacing.sm,
          filter: isSidebarOpen ? 'blur(3px)' : 'none',
          opacity: isSidebarOpen ? 0.5 : 1,
          transition: 'filter 0.2s ease, opacity 0.2s ease',
        }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              background: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: theme.radius.lg,
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.base,
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              background: input.trim() && !isLoading
                ? (mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)')
                : (mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
              border: 'none',
              borderRadius: theme.radius.lg,
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              transition: `all ${theme.animation.fast}`,
            }}
          >
            <SendIcon size={20} color={input.trim() && !isLoading ? theme.colors.text.primary : theme.colors.text.tertiary} />
          </button>
        </div>

        {/* Animations */}
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translate(-50%, -48%) scale(0.98);
              }
              to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
              }
            }
            @keyframes dropdownFadeIn {
              from {
                opacity: 0;
                transform: translateY(-4px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes pillsFadeIn {
              from {
                opacity: 0;
                transform: translateY(-8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}
        </style>
      </div>
    </>
  );
};

export default ChatAppPanel;
