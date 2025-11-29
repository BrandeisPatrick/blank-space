import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';

/**
 * Toggle component for enabling/disabling the Component Knowledge Base
 * When enabled, the AI uses curated professional component patterns for better output
 */
export const KnowledgeBaseToggle = ({ enabled, onToggle }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.sm,
      }}
    >
      {/* Toggle Switch */}
      <button
        onClick={onToggle}
        style={{
          position: 'relative',
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          background: enabled
            ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
            : theme.colors.bg.tertiary,
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: enabled
            ? '0 2px 8px rgba(139, 92, 246, 0.4)'
            : 'inset 0 1px 2px rgba(0,0,0,0.1)',
        }}
        aria-label={`${enabled ? 'Disable' : 'Enable'} Pro Components`}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: enabled ? '22px' : '2px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: 'white',
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </button>

      {/* Label */}
      <span
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: enabled ? theme.colors.text.primary : theme.colors.text.secondary,
          fontWeight: theme.typography.fontWeight.medium,
          fontFamily: theme.typography.fontFamily.sans,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span
          style={{
            fontSize: '14px',
          }}
        >
          ✨
        </span>
        Pro Components
      </span>
    </div>
  );
};

export default KnowledgeBaseToggle;
