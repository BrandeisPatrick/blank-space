import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';

export const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onCancel}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: mode === 'dark' ? '#1a1a1a' : theme.colors.bg.primary,
          borderRadius: '12px',
          padding: theme.spacing['3xl'],
          maxWidth: '400px',
          width: '90%',
          border: mode === 'dark' ? '1px solid #333' : '1px solid ' + theme.colors.border,
          animation: 'slideUp 0.3s ease',
        }}
      >
        {/* Title */}
        <h3
          style={{
            margin: 0,
            marginBottom: theme.spacing.lg,
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
          }}
        >
          {title}
        </h3>

        {/* Message */}
        <p
          style={{
            margin: 0,
            marginBottom: theme.spacing['2xl'],
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
            lineHeight: theme.typography.lineHeight.relaxed,
          }}
        >
          {message}
        </p>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: theme.spacing.md,
            justifyContent: 'flex-end',
          }}
        >
          {/* Cancel Button */}
          <button
            onClick={onCancel}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              backgroundColor: 'transparent',
              color: theme.colors.text.primary,
              border: mode === 'dark' ? '1px solid #444' : `1px solid ${theme.colors.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              transition: `all ${theme.animation.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = mode === 'dark' ? '#2a2a2a' : theme.colors.bg.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {cancelText}
          </button>

          {/* Confirm Button */}
          <button
            onClick={onConfirm}
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
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.85';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
