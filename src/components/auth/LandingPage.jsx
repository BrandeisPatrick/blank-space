import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';
import { useArtifacts } from '../../contexts/ArtifactContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { BackgroundWaves } from '../wallpaper';
import { SuggestionPill } from '../ui/SuggestionPill';
import { ArtifactCard } from '../artifact/ArtifactCard';
import { EnhancedChatInput } from '../chat/EnhancedChatInput';
import { KnowledgeBaseToggle } from '../ui/KnowledgeBaseToggle';
import { LAYOUT, LABELS, COLORS } from '../../constants';

export const LandingPage = ({ onTryNow, onSignIn, useKnowledgeBase, onToggleKnowledgeBase }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { artifacts, loadArtifact } = useArtifacts();
  const [selectedSuggestionPillText, setSelectedSuggestionPillText] = useState('');
  const isMobile = useIsMobile();

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
    "Create a browser with a functional nav bar",
    "Show what you can do",
    "Choose your own adventure game"
  ];

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: theme.colors.bg.primary,
      backgroundImage: theme.colors.gradient.subtle,
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
          <h1 style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            margin: 0,
          }}>
            <span style={{
              color: theme.colors.text.primary,
              fontWeight: theme.typography.fontWeight.bold,
            }}>&lt;</span> blank space <span style={{
              color: theme.colors.text.primary,
              fontWeight: theme.typography.fontWeight.bold,
            }}>&gt;</span>
          </h1>
        </div>

        <button
          onClick={onSignIn}
          style={{
            background: theme.colors.accent.primary,
            border: `1px solid ${theme.colors.border}`,
            color: COLORS.WHITE,
            cursor: 'pointer',
            padding: theme.sizes.button.padding.md,
            height: theme.sizes.button.md,
            borderRadius: theme.radius.md,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.medium,
            fontFamily: theme.typography.fontFamily.sans,
            transition: `background ${theme.animation.fast}`,
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.colorVariants.accent.primaryHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme.colors.accent.primary;
          }}
        >
          {LABELS.SIGN_IN}
        </button>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: isMobile ? theme.spacing.xl : theme.spacing['3xl'],
        position: 'relative',
        paddingBottom: LAYOUT.LANDING_MAIN_PADDING_BOTTOM,
      }}>
        {/* Background Decorations */}
        <BackgroundWaves variant="diagonal" preset="landing" />

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
          paddingLeft: theme.spacing.xl,
          paddingRight: theme.spacing.xl,
          paddingTop: theme.spacing['3xl'],
        }}>
          {/* Artifact Grid - Shows at top if artifacts exist */}
          {artifacts && artifacts.length > 0 && (
            <div style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: isMobile
                ? `repeat(auto-fill, minmax(${LAYOUT.ARTIFACT_GRID_MIN_MOBILE}, 1fr))`
                : `repeat(auto-fill, minmax(${LAYOUT.ARTIFACT_GRID_MIN_DESKTOP}, 1fr))`,
              gap: theme.spacing.lg,
              justifyContent: 'center',
            }}>
              {artifacts.map(artifact => (
                <ArtifactCard
                  key={artifact.id}
                  artifact={artifact}
                  onSelect={handleArtifactSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Knowledge Base Toggle + Suggestion Pills */}
        <div style={{
          position: 'fixed',
          bottom: LAYOUT.LANDING_SUGGESTION_PILLS_BOTTOM_OFFSET,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: theme.spacing.md,
          zIndex: LAYOUT.SUGGESTION_PILLS_Z_INDEX,
        }}>
          {/* Toggle for Pro Components */}
          <KnowledgeBaseToggle
            enabled={useKnowledgeBase}
            onToggle={onToggleKnowledgeBase}
          />
          {/* Suggestion Pills */}
          <div style={{
            display: 'flex',
            gap: theme.spacing.md,
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: LAYOUT.LANDING_SUGGESTION_MAX_WIDTH,
          }}>
            {suggestionPills.map((pillText, index) => (
              <SuggestionPill
                key={index}
                text={pillText}
                onClick={() => handleSuggestionPillClick(pillText)}
              />
            ))}
          </div>
        </div>

        {/* Enhanced Chat Input - Fixed at bottom */}
        <EnhancedChatInput
          placeholder="Let's make something"
          onSend={(message) => {
            onTryNow(message);
            setSelectedSuggestionPillText(''); // Reset so same pill can be clicked again
          }}
          initialMessage={selectedSuggestionPillText}
        />
      </main>
    </div>
  );
};

LandingPage.propTypes = {
  onTryNow: PropTypes.func.isRequired,
  onSignIn: PropTypes.func.isRequired,
  useKnowledgeBase: PropTypes.bool,
  onToggleKnowledgeBase: PropTypes.func
};
