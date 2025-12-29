import { useState, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { BackgroundWaves, StarryBackground } from '../wallpaper';

/**
 * Welcome screen overlay for first-time visitors
 * Shows "Imagine with BlankSpace" intro with call-to-action
 */
const WelcomeScreen = ({ onDismiss }) => {
  const { mode, theme: selectedTheme, currentTheme } = useTheme();
  const theme = getTheme(mode || 'light');
  const [isFading, setIsFading] = useState(false);

  // Handle dismiss with fade animation
  const handleDismiss = useCallback(() => {
    if (isFading) return;
    setIsFading(true);
    setTimeout(() => {
      onDismiss();
    }, 400);
  }, [isFading, onDismiss]);

  // Determine if using dark theme (stars) or light theme (waves)
  const isDarkTheme = currentTheme?.isDark ?? mode === 'dark';

  // Glass effect styles for the content card
  const glassStyle = {
    background: isDarkTheme
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    borderRadius: '32px',
    border: isDarkTheme
      ? '1px solid rgba(255, 255, 255, 0.12)'
      : '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: isDarkTheme
      ? 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 20px 60px rgba(0, 0, 0, 0.3)'
      : 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 20px 60px rgba(0, 0, 0, 0.1)',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        // Wallpaper background
        backgroundColor: currentTheme?.backgroundColor || (isDarkTheme ? '#0f1729' : '#C9CAD8'),
        backgroundImage: currentTheme?.gradient,
        // Fade animation
        opacity: isFading ? 0 : 1,
        transition: 'opacity 400ms ease-out',
        // Prevent text selection
        userSelect: 'none',
        WebkitUserSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Wallpaper Background - Stars or Waves */}
      {isDarkTheme ? (
        <StarryBackground starColors={currentTheme?.starColors} />
      ) : (
        <BackgroundWaves variant="diagonal" preset={selectedTheme} />
      )}

      {/* Content Card */}
      <div
        style={{
          ...glassStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'clamp(24px, 5vw, 32px) clamp(20px, 5vw, 40px)',
          maxWidth: '420px',
          width: '90%',
          zIndex: 1,
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: 'clamp(20px, 5vw, 24px)',
            fontWeight: theme.typography.fontWeight.normal,
            fontFamily: 'Georgia, "Times New Roman", serif',
            color: isDarkTheme ? 'rgba(255, 255, 255, 0.95)' : theme.colors.text.primary,
            margin: 0,
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          Imagine with BlankSpace
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: 'clamp(14px, 3.5vw, 16px)',
            fontWeight: theme.typography.fontWeight.normal,
            fontFamily: theme.typography.fontFamily.sans,
            color: isDarkTheme ? 'rgba(255, 255, 255, 0.7)' : theme.colors.text.secondary,
            margin: 0,
            marginBottom: '32px',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Ask Claude to make interfaces on the fly and explore prompts in an imagined workspace.
        </p>

        {/* Let's go! Button */}
        <button
          onClick={handleDismiss}
          style={{
            background: isDarkTheme ? 'rgba(255, 255, 255, 0.95)' : theme.colors.text.primary,
            color: isDarkTheme ? '#1a1a1a' : '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 32px',
            fontSize: '16px',
            fontWeight: theme.typography.fontWeight.semibold,
            fontFamily: theme.typography.fontFamily.sans,
            cursor: 'pointer',
            transition: 'transform 0.15s ease, opacity 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Let's go!
        </button>

        {/* Footer Notice */}
        <p
          style={{
            marginTop: '24px',
            fontSize: 'clamp(11px, 2.5vw, 13px)',
            fontWeight: theme.typography.fontWeight.normal,
            fontFamily: theme.typography.fontFamily.sans,
            color: isDarkTheme ? 'rgba(255, 255, 255, 0.5)' : theme.colors.text.tertiary,
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
        Free during beta. Share feedback on{' '}
        <a
          href="https://x.com/BrandeisPatrick"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: isDarkTheme ? 'rgba(255, 255, 255, 0.7)' : theme.colors.text.secondary,
            textDecoration: 'underline',
          }}
        >
          X
        </a>
        ,{' '}
        <a
          href="https://discord.gg/BDhsyw59"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: isDarkTheme ? 'rgba(255, 255, 255, 0.7)' : theme.colors.text.secondary,
            textDecoration: 'underline',
          }}
        >
          Discord
        </a>
        , or{' '}
        <a
          href="https://www.instagram.com/blankspace_build/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: isDarkTheme ? 'rgba(255, 255, 255, 0.7)' : theme.colors.text.secondary,
            textDecoration: 'underline',
          }}
        >
          Ins
        </a>
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
