import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getTheme } from '../styles/theme';

export const ExamplesDropdown = ({ onSelectExample }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const dropdownRef = useRef(null);

  const examples = [
    { id: 'blog', name: 'Personal Blog', icon: '📝' },
    { id: 'notion', name: 'Notion Replica', icon: '📄' },
    { id: 'particles', name: 'Particle Visualizer', icon: '✨' },
    { id: 'portfolio', name: 'Portfolio Website', icon: '💼' },
    { id: 'taskManager', name: 'Task Manager', icon: '✅' },
    { id: 'chess', name: 'Chess Game', icon: '♟️' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (exampleId) => {
    if (onSelectExample) {
      onSelectExample(exampleId);
    }
    setIsOpen(false);
  };

  const buttonStyle = {
    background: theme.colors.bg.secondary,
    border: `1px solid ${theme.colors.bg.border}`,
    color: theme.colors.text.secondary,
    cursor: 'pointer',
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    borderRadius: theme.radius.md,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    fontFamily: theme.typography.fontFamily.sans,
    transition: `opacity ${theme.animation.fast}`,
    opacity: 1,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.7';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        Examples
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 'auto',
          right: 'auto',
          minWidth: '200px',
          background: theme.colors.bg.primary,
          borderRadius: theme.radius.md,
          border: `1px solid ${theme.colors.bg.border}`,
          overflow: 'hidden',
          zIndex: 9999,
          animation: 'slideDown 0.2s ease-out',
        }}
        ref={(el) => {
          if (el && dropdownRef.current) {
            const buttonRect = dropdownRef.current.getBoundingClientRect();
            el.style.top = `${buttonRect.bottom + 8}px`;
            el.style.left = `${buttonRect.right - el.offsetWidth}px`;
          }
        }}
        >
          {examples.map((example) => (
            <button
              key={example.id}
              onClick={() => handleSelect(example.id)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                background: theme.colors.bg.secondary,
                border: 'none',
                borderBottom: `1px solid ${theme.colors.bg.border}`,
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                fontFamily: theme.typography.fontFamily.sans,
                textAlign: 'left',
                cursor: 'pointer',
                transition: `opacity ${theme.animation.fast}`,
                opacity: 1,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.md,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <span style={{ fontSize: '18px' }}>{example.icon}</span>
              <span>{example.name}</span>
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
