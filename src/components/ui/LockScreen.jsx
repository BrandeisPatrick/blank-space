import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';

/**
 * Mobile-style lock screen overlay
 * Displays current time and date
 * Fades away on touch/click
 */
const LockScreen = ({ onDismiss }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode || 'light');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFading, setIsFading] = useState(false);

  const isDark = mode === 'dark';

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle dismiss with fade animation
  const handleDismiss = useCallback(() => {
    if (isFading) return;
    setIsFading(true);
    setTimeout(() => {
      onDismiss();
    }, 400);
  }, [isFading, onDismiss]);

  // Format hours and minutes separately for vertical display
  const hours = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    hour12: false
  }).split(':')[0];

  const minutes = currentTime.toLocaleTimeString([], {
    minute: '2-digit'
  }).padStart(2, '0');

  // Format date: "Mon Jun 23"
  const formatDate = (date) => {
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Glass effect styles for the time display
  const glassStyle = {
    background: isDark
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.05)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    borderRadius: '40px',
    border: isDark
      ? '1px solid rgba(255, 255, 255, 0.15)'
      : '1px solid rgba(0, 0, 0, 0.1)',
    boxShadow: isDark
      ? 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 20px 60px rgba(0, 0, 0, 0.3)'
      : 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 20px 60px rgba(0, 0, 0, 0.1)',
  };

  return (
    <div
      onClick={handleDismiss}
      onTouchStart={handleDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backgroundColor: isDark ? '#000000' : '#ffffff',
        // Fade animation
        opacity: isFading ? 0 : 1,
        transition: 'opacity 400ms ease-out',
        // Prevent text selection
        userSelect: 'none',
        WebkitUserSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Date Display - Above time */}
      <div
        style={{
          fontSize: 'clamp(16px, 4vw, 22px)',
          fontWeight: theme.typography.fontWeight.medium,
          fontFamily: theme.typography.fontFamily.sans,
          color: isDark ? 'rgba(255, 255, 255, 0.9)' : theme.colors.text.primary,
          letterSpacing: '0.02em',
          marginBottom: theme.spacing.xl,
          zIndex: 1,
        }}
      >
        {formatDate(currentTime)}
      </div>

      {/* Time Display - Vertical stacked with glass effect */}
      <div
        style={{
          ...glassStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(24px, 6vw, 48px) clamp(32px, 8vw, 64px)',
          zIndex: 1,
        }}
      >
        {/* Hours */}
        <div
          style={{
            fontSize: 'clamp(100px, 28vw, 180px)',
            fontWeight: theme.typography.fontWeight.bold,
            fontFamily: theme.typography.fontFamily.sans,
            color: isDark ? 'rgba(255, 255, 255, 0.95)' : theme.colors.text.primary,
            lineHeight: 0.85,
            letterSpacing: '-0.02em',
          }}
        >
          {hours}
        </div>

        {/* Minutes */}
        <div
          style={{
            fontSize: 'clamp(100px, 28vw, 180px)',
            fontWeight: theme.typography.fontWeight.bold,
            fontFamily: theme.typography.fontFamily.sans,
            color: isDark ? 'rgba(255, 255, 255, 0.95)' : theme.colors.text.primary,
            lineHeight: 0.85,
            letterSpacing: '-0.02em',
          }}
        >
          {minutes}
        </div>
      </div>

      {/* Hint Text */}
      <div
        style={{
          marginTop: theme.spacing.xl,
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.medium,
          fontFamily: theme.typography.fontFamily.sans,
          color: isDark ? 'rgba(255, 255, 255, 0.8)' : theme.colors.text.secondary,
          zIndex: 1,
          textAlign: 'center',
          animation: 'lockScreenPulse 2.5s ease-in-out infinite',
        }}
      >
        Touch anywhere to continue vibe coding
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes lockScreenPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default LockScreen;
