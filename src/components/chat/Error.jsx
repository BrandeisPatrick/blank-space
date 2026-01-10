import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';

export const Error = ({ error, onDebug, isDebugging = false }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const [showDetails, setShowDetails] = useState(true);

  // Support both single error and array of errors
  const errors = Array.isArray(error) ? error : [error];

  return (
    <div
      style={{
        background: theme.colors.bg.secondary,
        border: `1px solid ${theme.colors.bg.border}`,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
      }}
    >
      {/* Error Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          background: mode === 'dark' ? 'rgba(220, 38, 38, 0.15)' : '#fef2f2',
          borderBottom: showDetails ? `1px solid ${theme.colors.bg.border}` : 'none',
        }}
      >
        {/* Left: Error count (clickable to expand/collapse) */}
        <div
          onClick={() => setShowDetails(!showDetails)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            cursor: 'pointer',
            flex: 1,
          }}
        >
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: theme.radius.full,
            background: '#ef4444',
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
          }} />
          <span style={{
            color: mode === 'dark' ? '#fca5a5' : '#dc2626',
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.medium,
            fontFamily: theme.typography.fontFamily.sans,
          }}>
            {errors.length} Error{errors.length > 1 ? 's' : ''} Found
          </span>
          <span style={{
            transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: `transform ${theme.animation.fast}`,
            color: mode === 'dark' ? '#fca5a5' : '#dc2626',
            fontSize: '12px',
          }}>
            ▼
          </span>
        </div>

        {/* Right: Debug Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onDebug) {
              onDebug(errors);
            }
          }}
          disabled={isDebugging}
          style={{
            background: isDebugging
              ? (mode === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)')
              : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            border: 'none',
            color: '#ffffff',
            cursor: isDebugging ? 'wait' : 'pointer',
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
            borderRadius: theme.radius.lg,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            fontFamily: theme.typography.fontFamily.sans,
            transition: `all ${theme.animation.fast}`,
            boxShadow: isDebugging ? 'none' : '0 2px 8px rgba(99, 102, 241, 0.3)',
            opacity: isDebugging ? 0.8 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          {isDebugging ? (
            <>
              <span style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#ffffff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              Fixing...
            </>
          ) : (
            'Debug'
          )}
        </button>
      </div>

      {/* Error Details (collapsible) */}
      {showDetails && (
        <div style={{
          maxHeight: '200px',
          overflowY: 'auto',
          background: theme.colors.bg.primary,
        }}>
          {errors.map((err, index) => (
            <div key={index} style={{
              padding: `${theme.spacing.md}`,
              borderBottom: index < errors.length - 1 ? `1px solid ${theme.colors.bg.border}` : 'none',
            }}>
              <div style={{
                color: mode === 'dark' ? '#fca5a5' : '#dc2626',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                fontFamily: theme.typography.fontFamily.sans,
                marginBottom: '4px',
                lineHeight: 1.4,
              }}>
                {err.message}
              </div>
              {(err.file || err.source) && (
                <div style={{
                  color: theme.colors.text.tertiary,
                  fontSize: theme.typography.fontSize.xs,
                  fontFamily: theme.typography.fontFamily.mono,
                }}>
                  {err.file || err.source}{err.line ? `:${err.line}` : ''}{err.column ? `:${err.column}` : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
