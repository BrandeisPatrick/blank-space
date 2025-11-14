import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { useArtifacts } from '../../contexts/ArtifactContext';
import { BackgroundDecoration } from '../ui/BackgroundDecoration';
import { SuggestionPill } from '../ui/SuggestionPill';
import { ArtifactCard } from '../artifact/ArtifactCard';
import { EnhancedChatInput } from '../chat/EnhancedChatInput';

export const LandingPage = ({ onTryNow, onSignIn }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { artifacts, loadArtifact } = useArtifacts();

  // Check if mobile viewport
  const isMobile = window.innerWidth <= 768;

  // Handle artifact selection
  const handleArtifactSelect = (artifactId) => {
    loadArtifact(artifactId);
    onTryNow();
  };

  // Suggestion prompts
  const suggestions = [
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
        background: theme.colors.bg.secondary,
        boxShadow: theme.shadows.outset,
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
              color: '#808080',
              fontWeight: theme.typography.fontWeight.bold,
            }}>&lt;</span> blank space <span style={{
              color: '#808080',
              fontWeight: theme.typography.fontWeight.bold,
            }}>&gt;</span>
          </h1>
        </div>

        <button
          onClick={onSignIn}
          style={{
            background: '#333333',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            borderRadius: theme.radius.lg,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.medium,
            fontFamily: theme.typography.fontFamily.sans,
            transition: `all ${theme.animation.normal}`,
            boxShadow: theme.shadows.outset,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#444444';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.boxShadow = theme.shadows.glow;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#333333';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.boxShadow = theme.shadows.outset;
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
        <BackgroundDecoration />

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

          {/* Suggestion Pills */}
          <div style={{
            display: 'flex',
            gap: theme.spacing.md,
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: artifacts && artifacts.length > 0 ? theme.spacing.xl : 0,
          }}>
            {suggestions.map((suggestion, index) => (
              <SuggestionPill
                key={index}
                text={suggestion}
                onClick={onTryNow}
              />
            ))}
          </div>
        </div>

        {/* Enhanced Chat Input - Fixed at bottom */}
        <EnhancedChatInput
          placeholder="Let's make something"
          onFocus={onTryNow}
          onSend={onTryNow}
        />
      </main>
    </div>
  );
};
