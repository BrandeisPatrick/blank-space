import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';

/**
 * Mobile-style lock screen overlay
 * Displays current time and date, fades away on touch/click
 */
const LockScreen = ({ onDismiss }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode || 'light'); // Fallback to light if mode not ready
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFading, setIsFading] = useState(false);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle dismiss with fade animation
  const handleDismiss = useCallback(() => {
    if (isFading) return; // Prevent double-trigger
    setIsFading(true);
    setTimeout(() => {
      onDismiss();
    }, 400); // Match animation duration
  }, [isFading, onDismiss]);

  // Format time: "12:45"
  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Format date: "Sunday, December 15"
  const formatDate = (date) => {
    return date.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
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
        // Solid background with subtle glass effect
        background: (mode || 'light') === 'light'
          ? '#C9CAD8' // Solid lavender background
          : '#1a1a1a', // Solid dark background
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        // Fade animation
        opacity: isFading ? 0 : 1,
        transition: 'opacity 400ms ease-out',
        // Prevent text selection
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Time Display */}
      <div
        style={{
          fontSize: 'clamp(72px, 20vw, 120px)',
          fontWeight: theme.typography.fontWeight.normal,
          fontFamily: theme.typography.fontFamily.sans,
          color: theme.colors.text.primary,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          marginBottom: theme.spacing.md,
        }}
      >
        {formatTime(currentTime)}
      </div>

      {/* Date Display */}
      <div
        style={{
          fontSize: 'clamp(18px, 4vw, 24px)',
          fontWeight: theme.typography.fontWeight.normal,
          fontFamily: theme.typography.fontFamily.sans,
          color: theme.colors.text.secondary,
          letterSpacing: '0.01em',
        }}
      >
        {formatDate(currentTime)}
      </div>

      {/* Hint Text */}
      <div
        style={{
          position: 'absolute',
          bottom: theme.spacing['5xl'],
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.normal,
          fontFamily: theme.typography.fontFamily.sans,
          color: theme.colors.text.tertiary,
          opacity: 0.7,
          // Subtle pulse animation
          animation: 'pulse 2s ease-in-out infinite',
        }}
      >
        Touch anywhere to continue
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default LockScreen;
