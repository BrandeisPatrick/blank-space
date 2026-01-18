import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect, getResponsiveSpacing } from '../../styles/componentStyles';
import { useIsMobile } from '../../hooks/useIsMobile';
import { PANELS, LABELS, SIZES } from '../../constants';

export const TopBar = ({ showChat, showCode, showPreview, onTogglePanel, onToggleArtifacts, onNavigateToHome }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { activeProject, updateProjectMeta } = useFileSystem();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(activeProject?.name || '');
  const isMobile = useIsMobile();

  // Reset name state when active artifact changes
  useEffect(() => {
    setNameValue(activeProject?.name || '');
    setIsEditingName(false);
  }, [activeProject?.slug]);

  // Base button style for all buttons
  const baseButtonStyle = {
    background: theme.colors.bg.secondary,
    border: `1px solid ${theme.colors.bg.border}`,
    color: theme.colors.text.secondary,
    cursor: 'pointer',
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    borderRadius: theme.radius.md,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    fontFamily: theme.typography.fontFamily.sans,
    transition: `opacity ${theme.animation.fast}`,
    opacity: 1,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
  };

  const buttonStyle = (isActive) => {
    const glassEffect = createGlassEffect(theme, { state: 'default' });

    return {
      ...baseButtonStyle,
      ...glassEffect,
      color: theme.colors.text.secondary, // Always gray - no color change on active
      fontWeight: isActive ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
      border: glassEffect.border, // Always glass border - no orange border on active
      borderRadius: theme.radius.full, // Pill shape for modern Apple aesthetic
      transition: `all ${theme.animation.normal}`,
      // Active state: subtle background tint + soft shadow only
      background: isActive
        ? `rgba(201, 125, 99, 0.1)` // Subtle terracotta tint (10% opacity)
        : glassEffect.background,
      boxShadow: isActive ? `0 4px 12px rgba(201, 125, 99, 0.15)` : 'none',
    };
  };

  const handleNameSave = () => {
    if (nameValue.trim() && activeProject) {
      updateProjectMeta(activeProject.slug, { name: nameValue.trim() });
    }
    setIsEditingName(false);
  };

  const glassEffectStyle = createGlassEffect(theme, { state: 'default' });

  // Helper function to create consistent hover handlers for panel buttons with glass effect
  const createPanelButtonHandlers = (isActive) => {
    const glassEffectDefault = createGlassEffect(theme, { state: 'default' });
    const glassEffectHover = createGlassEffect(theme, { state: 'hover' });

    return {
      onMouseEnter: (e) => {
        if (!isActive) {
          Object.assign(e.currentTarget.style, {
            background: glassEffectHover.background,
            // Keep text color gray - no color change
            transform: 'scale(1.02)',
            boxShadow: `0 2px 8px rgba(201, 125, 99, 0.08)`, // Subtle hover shadow
          });
        }
      },
      onMouseLeave: (e) => {
        if (!isActive) {
          Object.assign(e.currentTarget.style, {
            background: glassEffectDefault.background,
            // Keep text color gray - no color change
            transform: 'scale(1)',
            boxShadow: 'none',
          });
        }
      }
    };
  };

  // Centralized topbar height from SIZES constants
  const topbarHeight = isMobile ? SIZES.TOPBAR.HEIGHT.mobile : SIZES.TOPBAR.HEIGHT.desktop;

  return (
    <div style={{
      height: topbarHeight,
      ...glassEffectStyle,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: `0 ${getResponsiveSpacing(theme, isMobile, SIZES.SPACING.CONTENT_PADDING_X.mobile, 'sm')}`,
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
        gap: getResponsiveSpacing(theme, isMobile, 'xs', SIZES.SPACING.SECTION_GAP.desktop),
        flex: isMobile ? 1 : 'auto',
      }}>
        {/* Artifacts Button */}
        <button
          onClick={onToggleArtifacts}
          style={{
            ...baseButtonStyle,
            ...glassEffectStyle,
            padding: isMobile ? `${theme.spacing.xs} ${theme.spacing.md}` : theme.sizes.button.padding.md,
            height: isMobile ? 'auto' : theme.sizes.button.md,
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => {
            const glassHover = createGlassEffect(theme, { state: 'hover' });
            e.currentTarget.style.background = glassHover.background;
            // Keep text color gray - no color change
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = `0 2px 8px rgba(201, 125, 99, 0.08)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = glassEffectStyle.background;
            // Keep text color gray - no color change
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          title={LABELS.MANAGE_ARTIFACTS}
        >
          {LABELS.ARTIFACTS}
        </button>

        {/* Panel Toggles */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '2px' : theme.spacing.sm,
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: isMobile ? '4px' : theme.spacing.xs,
          borderRadius: theme.radius.full,
          border: `1px solid rgba(255, 255, 255, 0.15)`,
          boxShadow: 'none',
        }}>
        <button
          onClick={() => onTogglePanel(PANELS.CHAT)}
          style={{
            ...buttonStyle(showChat),
            padding: isMobile ? `${theme.spacing.xs} ${theme.spacing.md}` : theme.sizes.button.padding.md,
            height: isMobile ? 'auto' : theme.sizes.button.md,
            fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.base,
            display: 'flex',
            alignItems: 'center',
          }}
          {...createPanelButtonHandlers(showChat)}
        >
          {LABELS.CHAT}
        </button>

        <button
          onClick={() => onTogglePanel(PANELS.CODE)}
          style={{
            ...buttonStyle(showCode),
            padding: isMobile ? `${theme.spacing.xs} ${theme.spacing.md}` : theme.sizes.button.padding.md,
            height: isMobile ? 'auto' : theme.sizes.button.md,
            fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.base,
            display: 'flex',
            alignItems: 'center',
          }}
          {...createPanelButtonHandlers(showCode)}
        >
          {LABELS.CODE}
        </button>

        <button
          onClick={() => onTogglePanel(PANELS.PREVIEW)}
          style={{
            ...buttonStyle(showPreview),
            padding: isMobile ? `${theme.spacing.xs} ${theme.spacing.md}` : theme.sizes.button.padding.md,
            height: isMobile ? 'auto' : theme.sizes.button.md,
            fontSize: isMobile ? theme.typography.fontSize.xs : theme.typography.fontSize.base,
            display: 'flex',
            alignItems: 'center',
          }}
          {...createPanelButtonHandlers(showPreview)}
        >
          {LABELS.PREVIEW}
        </button>
        </div>
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
          {activeProject ? (
            isEditingName ? (
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') {
                    setNameValue(activeProject?.name || '');
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
                  fontSize: theme.typography.fontSize.xl,
                  fontWeight: theme.typography.fontWeight.bold,
                  outline: 'none',
                  minWidth: '200px',
                  textAlign: 'center',
                }}
              />
            ) : (
              <div
                onClick={() => {
                  setNameValue(activeProject?.name || '');
                  setIsEditingName(true);
                }}
                style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                  color: theme.colors.text.primary,
                  fontWeight: theme.typography.fontWeight.bold,
                  fontSize: theme.typography.fontSize.xl,
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
                title={LABELS.CLICK_TO_RENAME}
              >
                <span>{activeProject.name}</span>
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
              {LABELS.NO_ARTIFACT_SELECTED}
            </div>
          )}
        </div>
      )}

      {/* Right section - Home Button (Hidden on mobile) */}
      {!isMobile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
        }}>
          <button
            onClick={onNavigateToHome}
            style={{
              ...baseButtonStyle,
              ...glassEffectStyle,
              padding: theme.sizes.button.padding.md,
              height: theme.sizes.button.md,
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => {
              const glassHover = createGlassEffect(theme, { state: 'hover' });
              e.currentTarget.style.background = glassHover.background;
              // Keep text color gray - no color change
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = `0 2px 8px rgba(201, 125, 99, 0.08)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = glassEffectStyle.background;
              // Keep text color gray - no color change
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            title={LABELS.HOME}
          >
            {LABELS.HOME}
          </button>
        </div>
      )}
    </div>
  );
};

TopBar.propTypes = {
  showChat: PropTypes.bool.isRequired,
  showCode: PropTypes.bool.isRequired,
  showPreview: PropTypes.bool.isRequired,
  onTogglePanel: PropTypes.func.isRequired,
  onToggleArtifacts: PropTypes.func.isRequired,
  onNavigateToHome: PropTypes.func.isRequired
};
