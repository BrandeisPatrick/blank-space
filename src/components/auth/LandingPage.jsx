import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect, getResponsiveSpacing } from '../../styles/componentStyles';
import { useArtifacts } from '../../contexts/ArtifactContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { BackgroundWaves, StarryBackground } from '../wallpaper';
import { SuggestionPill } from '../ui/SuggestionPill';
import { ArtifactCard } from '../artifact/ArtifactCard';
import { SettingsAppCard } from '../settings/SettingsAppCard';
import { TabbedSettingsPanel } from '../settings/TabbedSettingsPanel';
import { ChatAppCard } from '../chatapp/ChatAppCard';
import { ChatAppPanel } from '../chatapp/ChatAppPanel';
import { AppStoreAppCard } from '../appstore/AppStoreAppCard';
import { AppStorePanel } from '../appstore/AppStorePanel';
import { AuthModal } from './AuthModal';
import { EnhancedChatInput } from '../chat/EnhancedChatInput';
import { LAYOUT, LABELS, COLORS, SIZES } from '../../constants';

export const LandingPage = ({ onTryNow, onSignIn, modelTier, onChangeModelTier, activeArtifact, isEditingArtifact, onShowLockScreen }) => {
  const { mode, theme: selectedTheme, currentTheme } = useTheme();
  const { openAuthModal } = useSettings();
  const { user, signOut } = useAuth();
  const theme = getTheme(mode);
  const { artifacts, loadArtifact, deleteArtifact } = useArtifacts();
  const [selectedSuggestionPillText, setSelectedSuggestionPillText] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const isMobile = useIsMobile();

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
      // Exit edit mode if no more artifacts
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
    onTryNow(''); // Pass empty string to signal "open browser window only"
  };

  // Handle suggestion pill click
  const handleSuggestionPillClick = (suggestionPillText) => {
    setSelectedSuggestionPillText(suggestionPillText);
  };

  // Suggestion pill prompts
  const suggestionPills = [
    "Create a chess game with ai",
    "Show me what you can do",
    "Choose your own adventure game"
  ];

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
      {/* Header */}
      <header style={{
        height: isMobile ? theme.sizes.topbar.mobile : theme.sizes.topbar.desktop,
        padding: isMobile ? `0 ${theme.spacing.md}` : `0 ${theme.spacing.xl}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...glassEffectStyle,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
        }}>
          <h1
            onClick={onShowLockScreen}
            style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            margin: 0,
            cursor: onShowLockScreen ? 'pointer' : 'default',
            transition: 'opacity 0.15s ease',
          }}
            onMouseEnter={(e) => onShowLockScreen && (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={(e) => onShowLockScreen && (e.currentTarget.style.opacity = '1')}
          >
            <span style={{
              color: theme.colors.text.primary,
              fontWeight: theme.typography.fontWeight.bold,
            }}>&lt;</span> blank space <span style={{
              color: theme.colors.text.primary,
              fontWeight: theme.typography.fontWeight.bold,
            }}>&gt;</span>
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              padding: '6px 12px',
              borderRadius: '16px',
              marginLeft: '12px',
              verticalAlign: 'middle',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'inline-flex',
              alignItems: 'center',
            }}>beta</span>
          </h1>
        </div>

        <button
          onClick={user ? signOut : openAuthModal}
          style={{
            background: '#C97D63',
            border: 'none',
            color: COLORS.WHITE,
            cursor: 'pointer',
            padding: isMobile ? theme.sizes.button.padding.sm : theme.sizes.button.padding.md,
            height: isMobile ? theme.sizes.button.sm : theme.sizes.button.md,
            borderRadius: theme.radius.md,
            fontSize: isMobile ? theme.typography.fontSize.sm : theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.medium,
            fontFamily: theme.typography.fontFamily.sans,
            transition: `background ${theme.animation.fast}`,
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#d89077';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#C97D63';
          }}
        >
          {user ? 'Sign Out' : LABELS.SIGN_IN}
        </button>
      </header>

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
        paddingBottom: LAYOUT.LANDING_MAIN_PADDING_BOTTOM,
        position: 'relative',
      }}>
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
          {/* Done Button - Shows in edit mode, aligned with 4th column */}
          {isEditMode && (
            <div style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: getResponsiveSpacing(theme, isMobile, SIZES.SPACING.GRID_GAP.mobile, SIZES.SPACING.GRID_GAP.desktop),
              marginBottom: theme.spacing.md,
            }}>
              {/* Empty columns 1-3 */}
              <div />
              <div />
              <div />
              {/* Done button in column 4 */}
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

          {/* App Grid - Always shows with Settings + Artifacts */}
          <div style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: getResponsiveSpacing(theme, isMobile, SIZES.SPACING.GRID_GAP.mobile, SIZES.SPACING.GRID_GAP.desktop),
            justifyItems: 'center',
          }}>
            {/* Settings App - Always first */}
            <SettingsAppCard
              isEditMode={isEditMode}
              onEnterEditMode={enterEditMode}
            />

            {/* AppStore - Second */}
            <AppStoreAppCard
              isEditMode={isEditMode}
              onEnterEditMode={enterEditMode}
            />

            {/* Chat App - Third */}
            <ChatAppCard
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

        {/* Suggestion Pills - 3 equal width pills aligned with chat bubble */}
        <div style={{
          position: 'fixed',
          bottom: LAYOUT.LANDING_SUGGESTION_PILLS_BOTTOM_OFFSET,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: theme.spacing.md,
          width: LAYOUT.CHAT_INPUT_WIDTH,
          maxWidth: LAYOUT.CHAT_INPUT_MAX_WIDTH,
          zIndex: LAYOUT.SUGGESTION_PILLS_Z_INDEX,
        }}>
          {suggestionPills.map((pillText, index) => (
            <SuggestionPill
              key={index}
              text={pillText}
              onClick={() => handleSuggestionPillClick(pillText)}
            />
          ))}
        </div>

        {/* Enhanced Chat Input - Fixed at bottom */}
        <EnhancedChatInput
          placeholder="Let's make something"
          onSend={(message) => {
            onTryNow(message);
            setSelectedSuggestionPillText(''); // Reset so same pill can be clicked again
          }}
          initialMessage={selectedSuggestionPillText}
          modelTier={modelTier}
          onChangeModelTier={onChangeModelTier}
          activeArtifact={activeArtifact}
          isEditingArtifact={isEditingArtifact}
        />
      </main>

      {/* Settings Panel Modal */}
      <TabbedSettingsPanel />

      {/* Chat App Modal */}
      <ChatAppPanel />

      {/* AppStore Panel Modal */}
      <AppStorePanel />

      {/* Auth Modal */}
      <AuthModal onAuthSuccess={onSignIn} />
    </div>
  );
};

LandingPage.propTypes = {
  onTryNow: PropTypes.func.isRequired,
  onSignIn: PropTypes.func.isRequired,
  modelTier: PropTypes.oneOf(['lite', 'pro']),
  onChangeModelTier: PropTypes.func,
  activeArtifact: PropTypes.object,
  isEditingArtifact: PropTypes.bool
};
