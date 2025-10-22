import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';

export const ErrorMessage = ({ error, onFixBug }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);

  return (
    <div
      style={{
        padding: theme.spacing.lg,
        backgroundColor: mode === 'dark' ? '#2a1a1a' : '#fff5f5',
        border: `1px solid ${theme.colors.status.error}`,
        borderRadius: '12px',
        marginBottom: theme.spacing.md,
      }}
    >
      {/* Error Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.md,
        }}
      >
        <span style={{ fontSize: '20px' }}>⚠️</span>
        <h4
          style={{
            margin: 0,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.status.error,
          }}
        >
          Preview Error Detected
        </h4>
      </div>

      {/* Error Details */}
      <div
        style={{
          marginBottom: theme.spacing.lg,
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
        }}
      >
        <div style={{ marginBottom: theme.spacing.xs }}>
          <strong>Error:</strong> {error.message}
        </div>
        {error.file && (
          <div style={{ marginBottom: theme.spacing.xs }}>
            <strong>File:</strong> {error.file}
            {error.line && <span>:{error.line}</span>}
            {error.column && <span>:{error.column}</span>}
          </div>
        )}
      </div>

      {/* Fix Bug Button */}
      <button
        onClick={onFixBug}
        style={{
          padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
          backgroundColor: theme.colors.status.error,
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          transition: `all ${theme.animation.fast}`,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.85';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        <span>🔧</span>
        <span>Fix Bug Automatically</span>
      </button>
    </div>
  );
};
