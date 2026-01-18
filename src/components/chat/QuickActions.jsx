import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';

// Category icons
const WriteIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </svg>
);

const LearnIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

const CodeIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const LifeIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const AIIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const categories = [
  { id: 'write', label: 'Write', icon: WriteIcon },
  { id: 'learn', label: 'Learn', icon: LearnIcon },
  { id: 'code', label: 'Code', icon: CodeIcon },
  { id: 'life', label: 'Life stuff', icon: LifeIcon },
  { id: 'ai', label: "AI's choice", icon: AIIcon },
];

const CategoryPill = ({ label, icon: Icon, onClick, theme, mode }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Hollow pill style like Grok - use theme colors
  const borderColor = isHovered ? theme.colors.border : theme.colors.border;
  const textColor = isHovered ? theme.colors.text.primary : theme.colors.text.secondary;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        background: 'transparent',
        border: `1px solid ${borderColor}`,
        borderRadius: '9999px',
        cursor: 'pointer',
        color: textColor,
        fontSize: '14px',
        fontWeight: 500,
        fontFamily: theme.typography.fontFamily.sans,
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
};

export const QuickActions = ({ onCategoryClick }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      maxWidth: '500px',
    }}>
      {categories.map((category) => (
        <CategoryPill
          key={category.id}
          label={category.label}
          icon={category.icon}
          onClick={() => onCategoryClick?.(category.label)}
          theme={theme}
          mode={mode}
        />
      ))}
    </div>
  );
};

QuickActions.propTypes = {
  onCategoryClick: PropTypes.func,
};

export default QuickActions;
