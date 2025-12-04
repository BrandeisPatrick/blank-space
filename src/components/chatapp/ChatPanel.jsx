import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useChatApp } from '../../contexts/ChatAppContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';
import { callLLM } from '../../services/utils/llm/llmClient';
import { Z_INDEX } from '../../constants';

// Close icon component
const CloseIcon = ({ size = 24, color = '#6B7280' }) => (
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
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Send icon component
const SendIcon = ({ size = 20, color = '#fff' }) => (
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
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const AVAILABLE_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast & efficient' },
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable' },
];

// Chevron icon for dropdown
const ChevronDownIcon = ({ size = 16, color = 'currentColor' }) => (
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
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const ChatPanel = () => {
  const { mode } = useTheme();
  const { isChatOpen, closeChat, messages, addMessage, clearMessages, selectedModel, setSelectedModel } = useChatApp();
  const theme = getTheme(mode);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
          width: '90%',
          maxWidth: '600px',
          height: '80vh',
          maxHeight: '700px',
          ...createGlassEffect(theme),
          background: mode === 'dark'
            ? 'rgba(30, 30, 35, 0.75)'
            : 'rgba(255, 255, 255, 0.75)',
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  background: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  border: 'none',
                  borderRadius: theme.radius.full,
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.sm,
                  fontFamily: theme.typography.fontFamily.sans,
                  cursor: 'pointer',
                  transition: `all ${theme.animation.fast}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
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
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          width: '100%',
                          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                          background: isSelected
                            ? (mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                            : 'transparent',
                          border: 'none',
                          borderRadius: theme.radius.md,
                          cursor: 'pointer',
                          transition: `all ${theme.animation.fast}`,
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'transparent';
                          }
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
            {/* Clear button */}
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  background: 'transparent',
                  border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                  borderRadius: theme.radius.md,
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.fontSize.sm,
                  cursor: 'pointer',
                  transition: `all ${theme.animation.fast}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Clear
              </button>
            )}

            {/* Close button */}
            <button
              onClick={closeChat}
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
                transition: `background ${theme.animation.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
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
            messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  borderRadius: theme.radius.lg,
                  background: msg.role === 'user'
                    ? '#C97D63'
                    : mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.05)',
                  color: msg.role === 'user'
                    ? '#fff'
                    : theme.colors.text.primary,
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
              background: input.trim() && !isLoading ? '#C97D63' : mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              border: 'none',
              borderRadius: theme.radius.lg,
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              transition: `all ${theme.animation.fast}`,
            }}
          >
            <SendIcon size={20} color={input.trim() && !isLoading ? '#fff' : theme.colors.text.tertiary} />
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
          `}
        </style>
      </div>
    </>
  );
};

export default ChatPanel;
