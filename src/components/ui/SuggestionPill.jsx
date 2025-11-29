import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';

export const SuggestionPill = ({ text, onClick }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const glassStyle = createGlassEffect(theme, { state: 'default' });

  return (
    <button
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.8';
        e.currentTarget.style.transform = 'scale(1.02)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.transform = 'scale(1)';
      }}
      style={{
        padding: `${theme.spacing.lg} ${theme.spacing['2xl']}`,
        ...glassStyle,
        border: 'none',
        borderRadius: theme.radius.lg,
        color: theme.colors.text.primary,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        fontFamily: theme.typography.fontFamily.sans,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: `all ${theme.animation.fast}`,
      }}
    >
      {text}
    </button>
  );
};

SuggestionPill.propTypes = {
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};
