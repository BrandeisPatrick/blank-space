import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';

/**
 * Collapsible thinking block that shows AI processing steps
 * Claude-style UI with expand/collapse toggle
 */
export const ThinkingBlock = ({ steps = [], duration, isComplete = true }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if no steps
  if (!steps || steps.length === 0) return null;

  // Format duration (ms to seconds)
  const formatDuration = (ms) => {
    if (!ms) return '';
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  return (
    <div style={{
      marginBottom: theme.spacing.sm,
      fontFamily: theme.typography.fontFamily.sans,
    }}>
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          background: 'transparent',
          border: 'none',
          padding: `${theme.spacing.xs} 0`,
          cursor: 'pointer',
          color: theme.colors.text.tertiary,
          fontSize: theme.typography.fontSize.sm,
          fontFamily: theme.typography.fontFamily.sans,
          width: '100%',
          textAlign: 'left',
        }}
      >
        {/* Expand/collapse icon */}
        <span style={{
          display: 'inline-flex',
          transition: `transform ${theme.animation.fast}`,
          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          fontSize: '10px',
        }}>
          ▶
        </span>

        {/* Label */}
        <span style={{
          color: theme.colors.text.secondary,
          fontWeight: theme.typography.fontWeight.medium,
        }}>
          {isComplete ? 'Thought' : 'Thinking...'}
        </span>

        {/* Duration */}
        {duration && (
          <span style={{
            color: theme.colors.text.tertiary,
            fontSize: theme.typography.fontSize.xs,
            marginLeft: 'auto',
          }}>
            {formatDuration(duration)}
          </span>
        )}
      </button>

      {/* Expanded content - thinking steps */}
      {isExpanded && (
        <div style={{
          paddingLeft: theme.spacing.lg,
          paddingTop: theme.spacing.xs,
          paddingBottom: theme.spacing.xs,
          borderLeft: `2px solid ${theme.colors.bg.border}`,
          marginLeft: theme.spacing.xs,
        }}>
          {steps.map((step, index) => (
            <div
              key={index}
              style={{
                color: theme.colors.text.tertiary,
                fontSize: theme.typography.fontSize.sm,
                lineHeight: 1.6,
                padding: `2px 0`,
              }}
            >
              {step}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThinkingBlock;
