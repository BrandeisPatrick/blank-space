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
        {/* Two Clouds Icon */}
        <svg
          width="72"
          height="48"
          viewBox="-2 0 72 48"
          fill="none"
          style={{ marginBottom: '20px' }}
        >
          {/* Back cloud (larger, outlined, flat base) */}
          <path
            d="M4 28h44c0-3.5-2.5-6.5-6-7.3 0-.2.1-.5.1-.7 0-4.4-3.6-8-8-8-.6 0-1.2.1-1.8.2C31 7.6 25.6 4 19 4c-6 0-11 4-12.5 9.5C2.5 14.5 0 18 0 22c0 3.3 2.7 6 6 6h-2z"
            stroke={isDarkTheme ? 'rgba(255, 255, 255, 0.7)' : theme.colors.text.secondary}
            strokeWidth="2"
            fill="none"
          />
          {/* Front cloud (smaller, solid fill, flat base, bottom right) */}
          <path
            d="M34 36h24c0-2.2-1.8-4-4-4 0-.1.1-.3.1-.4 0-2.8-2.2-5-5-5-.4 0-.7 0-1.1.1C47.2 24.1 44.4 22 41 22c-3.5 0-6.5 2.5-7.3 5.8C31.5 28.5 30 30.5 30 33c0 1.7 1.3 3 3 3h1z"
            stroke={isDarkTheme ? 'rgba(255, 255, 255, 0.5)' : theme.colors.text.tertiary}
            strokeWidth="1.5"
            fill={isDarkTheme ? '#2a2a2a' : '#c8c8c8'}
          />
        </svg>

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
          A new way to interact with AI. Build, remix, share—your creative playground awaits.
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
        Experimental and free during beta. Share feedback on{' '}
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
