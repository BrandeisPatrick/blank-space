import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect, getResponsiveSpacing } from '../../styles/componentStyles';
import { useArtifacts } from '../../contexts/ArtifactContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { BackgroundWaves, StarryBackground } from '../wallpaper';
import { ArtifactCard } from '../artifact/ArtifactCard';
import { SettingsAppCard } from '../settings/SettingsAppCard';
import { TabbedSettingsPanel } from '../settings/TabbedSettingsPanel';
import { AppStoreAppCard } from '../appstore/AppStoreAppCard';
import { AppStorePanel } from '../appstore/AppStorePanel';
import { AuthModal } from '../auth/AuthModal';
import { FloatingBrowserWindow } from '../ui/FloatingBrowserWindow';
import { LAYOUT, SIZES } from '../../constants';

// Chat icon for navigation back to chat
const ChatIcon = ({ size = 24, color = "currentColor" }) => (
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
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const AppsPage = ({
  // Props for browser window functionality
  files = {},
  onFileChange,
  onError,
  onDebug,
  isDebugging = false,
  onIconChange,
  onRename,
}) => {
  const { mode, theme: selectedTheme, currentTheme } = useTheme();
  const theme = getTheme(mode);
  const { artifacts, loadArtifact, deleteArtifact, activeArtifact, activeArtifactId, clearActiveArtifact } = useArtifacts();
  const [isEditMode, setIsEditMode] = useState(false);
  const [browserWindowVisible, setBrowserWindowVisible] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Navigate back to chat
  const handleGoToChat = () => {
    navigate('/');
  };

  // Enter edit mode (iOS-style jiggle mode for deletion)
  const enterEditMode = () => {
    setIsEditMode(true);
  };

  // Exit edit mode
  const exitEditMode = () => {
    setIsEditMode(false);
  };

  // Handle artifact deletion
  const handleDeleteArtifact = (artifactId, artifactName) => {
    if (window.confirm(`Delete "${artifactName}"? This cannot be undone.`)) {
      deleteArtifact(artifactId);
      if (artifacts.length <= 1) {
        setIsEditMode(false);
      }
    }
  };

  // Glass effect for header
  const glassEffectStyle = createGlassEffect(theme, { state: 'default' });

  // Handle artifact selection
  const handleArtifactSelect = (artifactId) => {
    loadArtifact(artifactId);
    setBrowserWindowVisible(true);
  };

  // Close browser window
  const handleCloseBrowserWindow = () => {
    setBrowserWindowVisible(false);
    clearActiveArtifact();
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: currentTheme.backgroundColor,
      backgroundImage: currentTheme.gradient,
      color: theme.colors.text.primary,
      fontFamily: theme.typography.fontFamily.sans,
    }}>
      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: getResponsiveSpacing(theme, isMobile, SIZES.SPACING.CONTENT_PADDING_Y.mobile, SIZES.SPACING.CONTENT_PADDING_Y.desktop),
        paddingLeft: getResponsiveSpacing(theme, isMobile, SIZES.SPACING.CONTENT_PADDING_X.mobile, SIZES.SPACING.CONTENT_PADDING_X.desktop),
        paddingRight: getResponsiveSpacing(theme, isMobile, SIZES.SPACING.CONTENT_PADDING_X.mobile, SIZES.SPACING.CONTENT_PADDING_X.desktop),
        paddingBottom: theme.spacing['3xl'],
        position: 'relative',
      }}>
        {/* Top Right Chat Button */}
        <div style={{
          position: 'absolute',
          top: theme.spacing.lg,
          right: theme.spacing.lg,
          zIndex: 10,
        }}>
          <button
            onClick={handleGoToChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: 'transparent',
              border: 'none',
              borderRadius: theme.radius.lg,
              cursor: 'pointer',
              color: theme.colors.text.secondary,
              transition: `all ${theme.animation.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.bg.hover;
              e.currentTarget.style.color = theme.colors.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = theme.colors.text.secondary;
            }}
            title="Chat"
          >
            <ChatIcon size={22} />
          </button>
        </div>

        {/* Background Decorations */}
        {currentTheme.variant === 'stars' ? (
          <StarryBackground starColors={currentTheme.starColors} />
        ) : (
          <BackgroundWaves variant="diagonal" preset={selectedTheme} />
        )}

        {/* Content Container */}
        <div style={{
          width: '100%',
          maxWidth: LAYOUT.LANDING_MAX_WIDTH,
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing['2xl'],
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          position: 'relative',
          zIndex: LAYOUT.CONTENT_Z_INDEX,
          paddingLeft: getResponsiveSpacing(theme, isMobile, SIZES.SPACING.CONTENT_PADDING_X.mobile, SIZES.SPACING.CONTENT_PADDING_X.desktop),
          paddingRight: getResponsiveSpacing(theme, isMobile, SIZES.SPACING.CONTENT_PADDING_X.mobile, SIZES.SPACING.CONTENT_PADDING_X.desktop),
          paddingTop: getResponsiveSpacing(theme, isMobile, SIZES.SPACING.CONTENT_PADDING_Y.mobile, SIZES.SPACING.CONTENT_PADDING_Y.desktop),
        }}>
          {/* Done Button - Shows in edit mode */}
          {isEditMode && (
            <div style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: getResponsiveSpacing(theme, isMobile, SIZES.SPACING.GRID_GAP.mobile, SIZES.SPACING.GRID_GAP.desktop),
              marginBottom: theme.spacing.md,
            }}>
              <div />
              <div />
              <div />
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={exitEditMode}
                  style={{
                    ...glassEffectStyle,
                    background: mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.15)'
                      : 'rgba(255, 255, 255, 0.65)',
                    border: 'none',
                    color: theme.colors.text.primary,
                    padding: '8px 20px',
                    borderRadius: theme.radius['2.5xl'],
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold,
                    cursor: 'pointer',
                    transition: `all ${theme.animation.fast}`,
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* App Grid */}
          <div style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: getResponsiveSpacing(theme, isMobile, SIZES.SPACING.GRID_GAP.mobile, SIZES.SPACING.GRID_GAP.desktop),
            justifyItems: 'center',
          }}>
            {/* Settings App */}
            <SettingsAppCard
              isEditMode={isEditMode}
              onEnterEditMode={enterEditMode}
            />

            {/* AppStore */}
            <AppStoreAppCard
              isEditMode={isEditMode}
              onEnterEditMode={enterEditMode}
            />

            {/* Artifact Cards */}
            {artifacts && artifacts.map(artifact => (
              <ArtifactCard
                key={artifact.id}
                artifact={artifact}
                onSelect={handleArtifactSelect}
                isEditMode={isEditMode}
                onEnterEditMode={enterEditMode}
                onDelete={() => handleDeleteArtifact(artifact.id, artifact.name)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Floating Browser Window */}
      <FloatingBrowserWindow
        visible={browserWindowVisible}
        artifact={activeArtifact}
        files={files}
        onClose={handleCloseBrowserWindow}
        onFileChange={onFileChange}
        onError={onError}
        onDebug={onDebug}
        isDebugging={isDebugging}
        onIconChange={(iconId) => onIconChange?.(activeArtifactId, iconId)}
        onRename={(newName) => onRename?.(activeArtifactId, newName)}
      />

      {/* Settings Panel Modal */}
      <TabbedSettingsPanel />

      {/* AppStore Panel Modal */}
      <AppStorePanel />

      {/* Auth Modal */}
      <AuthModal />
    </div>
  );
};

AppsPage.propTypes = {
  files: PropTypes.object,
  onFileChange: PropTypes.func,
  onError: PropTypes.func,
  onDebug: PropTypes.func,
  isDebugging: PropTypes.bool,
  onIconChange: PropTypes.func,
  onRename: PropTypes.func,
};

export default AppsPage;
