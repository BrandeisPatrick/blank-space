import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';
import { useArtifacts } from '../../contexts/ArtifactContext';
import { BackgroundWaves } from '../wallpaper';
import { SuggestionPill } from '../ui/SuggestionPill';
import { ArtifactCard } from '../artifact/ArtifactCard';
import { EnhancedChatInput } from '../chat/EnhancedChatInput';

export const LandingPage = ({ onTryNow, onSignIn }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { artifacts, loadArtifact } = useArtifacts();
  const [selectedSuggestionPillText, setSelectedSuggestionPillText] = useState('');

  // Check if mobile viewport
  const isMobile = window.innerWidth <= 768;

  // Glass effect for header
  const glassEffectStyle = createGlassEffect(theme, { state: 'default' });

  // Handle artifact selection
  const handleArtifactSelect = (artifactId) => {
    loadArtifact(artifactId);
    onTryNow();
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
        padding: `${theme.spacing.xl} ${theme.spacing['3xl']}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...glassEffectStyle,
        borderRadius: theme.radius.xl,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
        }}>
          <h1 style={{
            fontSize: isMobile ? theme.typography.fontSize.xl : theme.typography.fontSize['2xl'],
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
            color: '#ffffff',
            cursor: 'pointer',
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            borderRadius: theme.radius.md,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.medium,
            fontFamily: theme.typography.fontFamily.sans,
            transition: `background ${theme.animation.fast}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#d89077';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme.colors.accent.primary;
          }}
        >
          Sign In
        </button>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? theme.spacing.xl : theme.spacing['3xl'],
        position: 'relative',
        paddingBottom: '120px', // Space for fixed chat input
      }}>
        {/* Background Decorations */}
        <BackgroundWaves variant="diagonal" preset="landing" />

        {/* Content Container */}
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing['2xl'],
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Artifact Grid - Shows at top if artifacts exist */}
          {artifacts && artifacts.length > 0 && (
            <div style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.lg,
            }}>
              <h2 style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                margin: 0,
                textAlign: 'center',
              }}>
                Your Projects
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? 'repeat(auto-fill, minmax(140px, 1fr))'
                  : 'repeat(auto-fill, minmax(180px, 1fr))',
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
            </div>
          )}
        </div>

        {/* Suggestion Pills - Positioned closer to chat input */}
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: theme.spacing.md,
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: '90%',
          zIndex: 99,
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
          onSend={onTryNow}
          initialMessage={selectedSuggestionPillText}
        />
      </main>
    </div>
  );
};
