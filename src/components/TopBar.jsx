import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useArtifacts } from '../contexts/ArtifactContext';
import { ThemeToggle } from './ThemeToggle';
import { ExamplesDropdown } from './ExamplesDropdown';
import { getTheme } from '../styles/theme';
import { useIsMobile } from '../hooks/useIsMobile';

export const TopBar = ({ showChat, showCode, showPreview, onTogglePanel, onLoadExample, onToggleArtifacts }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { activeArtifact, renameArtifact } = useArtifacts();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(activeArtifact?.name || '');
  const isMobile = useIsMobile();

  // Base button style for all buttons
  const baseButtonStyle = {
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

  const buttonStyle = (isActive) => ({
    ...baseButtonStyle,
    background: isActive ? theme.colors.gradient.primary : theme.colors.bg.secondary,
    color: isActive ? theme.colors.accent.primary : theme.colors.text.secondary,
    fontWeight: isActive ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
    boxShadow: isActive ? theme.shadows.sm : theme.shadows.outset,
    borderRadius: theme.radius.lg,
    border: 'none',
    transition: `all ${theme.animation.normal}`,
  });

  const handleNameSave = () => {
    if (nameValue.trim() && activeArtifact) {
      renameArtifact(activeArtifact.id, nameValue.trim());
    } else if (!activeArtifact) {
      // No artifact to rename
      setIsEditingName(false);
    }
    setIsEditingName(false);
  };

  return (
    <div style={{
      height: isMobile ? '56px' : '64px',
      background: theme.colors.gradient.subtle,
      borderBottom: `1px solid ${theme.colors.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? `0 ${theme.spacing.md}` : `0 ${theme.spacing.xl}`,
      fontSize: theme.typography.fontSize.sm,
      position: 'sticky',
      top: 0,
      zIndex: 50,
      overflow: 'hidden',
      boxShadow: theme.shadows.outsetMd,
    }}>
      {/* Left section - Artifacts button + Panel toggles */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? theme.spacing.xs : theme.spacing.sm,
        flex: isMobile ? 1 : 'auto',
      }}>
        {/* Artifacts Button */}
        <button
          onClick={onToggleArtifacts}
          style={{
            ...baseButtonStyle,
            padding: isMobile ? `${theme.spacing.xs} ${theme.spacing.md}` : `${theme.spacing.sm} ${theme.spacing.lg}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          title="Manage Artifacts"
        >
          Artifacts
        </button>

        {/* Panel Toggles */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '2px' : theme.spacing.sm,
          background: theme.colors.bg.primary,
          padding: isMobile ? '4px' : theme.spacing.xs,
          borderRadius: theme.radius.xl,
          boxShadow: theme.shadows.md,
        }}>
        <button
          onClick={() => onTogglePanel('chat')}
          style={{
            ...buttonStyle(showChat),
            padding: isMobile ? `${theme.spacing.xs} ${theme.spacing.md}` : `${theme.spacing.sm} ${theme.spacing.lg}`,
            fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.sm,
          }}
          onMouseEnter={(e) => {
            if (!showChat) {
              e.currentTarget.style.background = theme.colors.bg.hover;
              e.currentTarget.style.color = theme.colors.accent.primary;
              e.currentTarget.style.boxShadow = theme.shadows.glow;
            }
          }}
          onMouseLeave={(e) => {
            if (!showChat) {
              e.currentTarget.style.background = theme.colors.bg.secondary;
              e.currentTarget.style.color = theme.colors.text.secondary;
              e.currentTarget.style.boxShadow = theme.shadows.outset;
            }
          }}
        >
          Chat
        </button>

        <button
          onClick={() => onTogglePanel('code')}
          style={{
            ...buttonStyle(showCode),
            padding: isMobile ? `${theme.spacing.xs} ${theme.spacing.md}` : `${theme.spacing.sm} ${theme.spacing.lg}`,
            fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.sm,
          }}
          onMouseEnter={(e) => {
            if (!showCode) {
              e.currentTarget.style.background = theme.colors.bg.hover;
              e.currentTarget.style.color = theme.colors.accent.primary;
              e.currentTarget.style.boxShadow = theme.shadows.glow;
            }
          }}
          onMouseLeave={(e) => {
            if (!showCode) {
              e.currentTarget.style.background = theme.colors.bg.secondary;
              e.currentTarget.style.color = theme.colors.text.secondary;
              e.currentTarget.style.boxShadow = theme.shadows.outset;
            }
          }}
        >
          Code
        </button>

        <button
          onClick={() => onTogglePanel('preview')}
          style={{
            ...buttonStyle(showPreview),
            padding: isMobile ? `${theme.spacing.xs} ${theme.spacing.md}` : `${theme.spacing.sm} ${theme.spacing.lg}`,
            fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.sm,
          }}
          onMouseEnter={(e) => {
            if (!showPreview) {
              e.currentTarget.style.background = theme.colors.bg.hover;
              e.currentTarget.style.color = theme.colors.accent.primary;
              e.currentTarget.style.boxShadow = theme.shadows.glow;
            }
          }}
          onMouseLeave={(e) => {
            if (!showPreview) {
              e.currentTarget.style.background = theme.colors.bg.secondary;
              e.currentTarget.style.color = theme.colors.text.secondary;
              e.currentTarget.style.boxShadow = theme.shadows.outset;
            }
          }}
        >
          Preview
        </button>
        </div>

        {/* Examples button - Show on mobile */}
        {isMobile && (
          <div style={{ marginLeft: 'auto' }}>
            <ExamplesDropdown onSelectExample={onLoadExample} />
          </div>
        )}
      </div>

      {/* Center section - Artifact Name (Hidden on mobile) */}
      {!isMobile && (
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
        }}>
          {activeArtifact ? (
            isEditingName ? (
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') {
                    setNameValue(activeArtifact?.name || '');
                    setIsEditingName(false);
                  }
                }}
                autoFocus
                style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  border: `2px solid ${theme.colors.accent.primary}`,
                  borderRadius: theme.radius.md,
                  background: theme.colors.bg.primary,
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.bold,
                  outline: 'none',
                  minWidth: '200px',
                  textAlign: 'center',
                }}
              />
            ) : (
              <div
                onClick={() => {
                  setNameValue(activeArtifact?.name || '');
                  setIsEditingName(true);
                }}
                style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                  color: theme.colors.text.primary,
                  fontWeight: theme.typography.fontWeight.bold,
                  fontSize: theme.typography.fontSize.lg,
                  cursor: 'pointer',
                  borderRadius: theme.radius.md,
                  transition: `all ${theme.animation.fast}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.colors.bg.hover;
                  e.currentTarget.style.color = theme.colors.accent.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = theme.colors.text.primary;
                }}
                title="Click to rename"
              >
                <span>{activeArtifact.name}</span>
              </div>
            )
          ) : (
            <div
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                color: theme.colors.text.tertiary,
                fontWeight: theme.typography.fontWeight.medium,
                fontSize: theme.typography.fontSize.lg,
                fontStyle: 'italic',
              }}
            >
              No Artifact Selected
            </div>
          )}
        </div>
      )}

      {/* Right section - Actions (Hidden on mobile) */}
      {!isMobile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
        }}>
          <ThemeToggle />

          <ExamplesDropdown onSelectExample={onLoadExample} />

          <a
            href="https://github.com/BrandeisPatrick"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...baseButtonStyle,
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>
      )}
    </div>
  );
};
