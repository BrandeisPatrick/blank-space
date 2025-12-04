import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';
import { createGlassEffect } from '../../styles/componentStyles';
import { useIsMobile } from '../../hooks/useIsMobile';
import { SIZES } from '../../constants';

export const SuggestionPill = ({ text, onClick }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const glassStyle = createGlassEffect(theme, { state: 'default' });
  const isMobile = useIsMobile();

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
        padding: isMobile
          ? `${theme.spacing[SIZES.SUGGESTION_PILL.PADDING.mobile[0]]} ${theme.spacing[SIZES.SUGGESTION_PILL.PADDING.mobile[1]]}`
          : `${theme.spacing[SIZES.SUGGESTION_PILL.PADDING.desktop[0]]} ${theme.spacing[SIZES.SUGGESTION_PILL.PADDING.desktop[1]]}`,
        ...glassStyle,
        border: 'none',
        borderRadius: theme.radius.lg,
        color: theme.colors.text.primary,
        fontSize: theme.typography.fontSize[isMobile ? SIZES.SUGGESTION_PILL.FONT_SIZE.mobile : SIZES.SUGGESTION_PILL.FONT_SIZE.desktop],
        fontWeight: theme.typography.fontWeight.medium,
        fontFamily: theme.typography.fontFamily.sans,
        cursor: 'pointer',
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
