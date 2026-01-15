/**
 * Reusable component style factories
 * Centralized styling utilities to eliminate duplication across components
 * Maintains consistency for common UI patterns
 */

/**
 * Creates a liquid glass/glassmorphism effect style object
 * @param {Object} theme - Theme object from getTheme()
 * @param {Object} options - Configuration options
 * @param {string} options.state - 'default' or 'hover' state
 * @returns {Object} Style object ready for inline styles
 *
 * @example
 * const glassStyle = createGlassEffect(theme, { state: 'default' });
 * <div style={glassStyle}>Liquid glass element</div>
 */
export const createGlassEffect = (theme, options = {}) => {
  const { state = 'default' } = options;
  const glassConfig = theme.effects.glass[state] || theme.effects.glass.default;

  return {
    ...glassConfig,
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  };
};

/**
 * Creates standardized button styles
 * @param {Object} theme - Theme object from getTheme()
 * @param {string} variant - Button variant: 'primary', 'secondary', 'ghost', 'icon'
 * @returns {Object} Style object ready for inline styles
 *
 * @example
 * const buttonStyle = createButtonStyle(theme, 'primary');
 * <button style={buttonStyle}>Click me</button>
 */
export const createButtonStyle = (theme, variant = 'secondary') => {
  const baseStyle = {
    border: 'none',
    borderRadius: theme.radius.md,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    cursor: 'pointer',
    transition: `all ${theme.animation.fast}`,
    fontFamily: theme.typography.fontFamily.sans,
  };

  const variants = {
    primary: {
      ...baseStyle,
      background: theme.colors.accent.primary,
      color: theme.colors.bg.primary,
      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
      border: `1px solid ${theme.colors.accent.primary}`,
    },
    secondary: {
      ...baseStyle,
      background: theme.colors.bg.secondary,
      color: theme.colors.text.secondary,
      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
      border: `1px solid ${theme.colors.bg.border}`,
    },
    ghost: {
      ...baseStyle,
      background: 'transparent',
      color: theme.colors.text.secondary,
      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
      border: 'none',
    },
    icon: {
      ...baseStyle,
      background: 'transparent',
      color: theme.colors.text.secondary,
      padding: `${theme.spacing.sm}`,
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  };

  return variants[variant] || variants.secondary;
};

/**
 * Creates standardized card/panel container styles
 * @param {Object} theme - Theme object from getTheme()
 * @param {Object} options - Configuration options
 * @param {boolean} options.withShadow - Whether to include shadow (default: false)
 * @param {string} options.background - Custom background color or gradient
 * @returns {Object} Style object ready for inline styles
 *
 * @example
 * const cardStyle = createCardStyle(theme, { withShadow: true });
 * <div style={cardStyle}>Card content</div>
 */
export const createCardStyle = (theme, options = {}) => {
  const {
    withShadow = false,
    background = theme.colors.bg.secondary,
  } = options;

  return {
    background,
    border: `1px solid ${theme.colors.bg.border}`,
    borderRadius: theme.radius.lg,
    boxShadow: withShadow ? theme.shadows.md : 'none',
    transition: `all ${theme.animation.normal}`,
  };
};

/**
 * Creates a hover opacity effect style wrapper
 * @param {Object} baseStyle - Base style object
 * @param {Object} theme - Theme object from getTheme()
 * @param {string} level - Opacity level: 'light', 'medium', 'strong' (default: 'medium')
 * @returns {Object} Style object with hover effect applied
 *
 * @example
 * const hoverStyle = withHoverOpacity(baseStyle, theme, 'medium');
 * // Use with state: const [isHovered, setIsHovered] = useState(false);
 * <div style={isHovered ? { ...hoverStyle, opacity: theme.opacity.hover.medium } : hoverStyle} />
 */
export const withHoverOpacity = (baseStyle, theme, level = 'medium') => {
  return {
    ...baseStyle,
    transition: `opacity ${theme.animation.fast}`,
    _hover: {
      opacity: theme.opacity.hover[level],
    },
  };
};

/**
 * Creates hover state handlers for elements
 * Returns handlers that can be used with onMouseEnter/onMouseLeave
 * @param {Object} theme - Theme object from getTheme()
 * @param {string} level - Opacity level: 'light', 'medium', 'strong'
 * @returns {Object} Object with onMouseEnter and onMouseLeave handlers
 *
 * @example
 * const hoverHandlers = createHoverHandlers(theme, 'medium');
 * <div {...hoverHandlers}>Hover me</div>
 */
export const createHoverHandlers = (theme, level = 'medium') => {
  const opacityValue = theme.opacity.hover[level];

  return {
    onMouseEnter: (e) => {
      e.currentTarget.style.opacity = opacityValue.toString();
      e.currentTarget.style.transition = `opacity ${theme.animation.fast}`;
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.opacity = '1';
    },
  };
};

/**
 * Creates an overlay backdrop style (for modals, dropdowns, etc.)
 * @param {Object} theme - Theme object from getTheme()
 * @param {string} intensity - Intensity level: 'light' or 'dark' (default: 'dark')
 * @returns {Object} Style object for overlay elements
 *
 * @example
 * const overlayStyle = createOverlayStyle(theme, 'dark');
 * <div style={overlayStyle} onClick={handleClose} />
 */
export const createOverlayStyle = (theme, intensity = 'dark') => {
  return {
    position: 'fixed',
    inset: 0,
    background: theme.effects.overlay[intensity],
    zIndex: 40,
  };
};

/**
 * Merges multiple style objects while respecting the component pattern
 * @param {...Object} styles - Style objects to merge
 * @returns {Object} Merged style object
 *
 * @example
 * const combined = mergeStyles(baseStyle, hoverStyle, customStyle);
 */
export const mergeStyles = (...styles) => {
  return Object.assign({}, ...styles.filter(Boolean));
};

/**
 * Returns a responsive value based on mobile/desktop state
 * @param {boolean} isMobile - Current mobile state
 * @param {*} mobileValue - Value for mobile viewport
 * @param {*} desktopValue - Value for desktop viewport
 * @returns {*} The appropriate value based on viewport
 *
 * @example
 * const width = getResponsiveValue(isMobile, '100%', '800px');
 */
export const getResponsiveValue = (isMobile, mobileValue, desktopValue) => {
  return isMobile ? mobileValue : desktopValue;
};

/**
 * Returns a responsive spacing value from theme
 * @param {Object} theme - Theme object from getTheme()
 * @param {boolean} isMobile - Current mobile state
 * @param {string} mobileKey - Theme spacing key for mobile (e.g., 'md')
 * @param {string} desktopKey - Theme spacing key for desktop (e.g., '2xl')
 * @returns {string} The theme spacing value
 *
 * @example
 * const padding = getResponsiveSpacing(theme, isMobile, 'md', '2xl');
 */
export const getResponsiveSpacing = (theme, isMobile, mobileKey, desktopKey) => {
  return isMobile ? theme.spacing[mobileKey] : theme.spacing[desktopKey];
};

// ============================================
// MODAL UTILITIES
// ============================================

/**
 * Creates standardized modal colors object
 * @param {Object} theme - Theme object from getTheme()
 * @param {string} mode - 'dark' or 'light' mode
 * @returns {Object} Colors object for modal styling
 *
 * @example
 * const colors = createModalColors(theme, mode);
 * <div style={{ background: colors.bg, color: colors.textPrimary }}>...</div>
 */
export const createModalColors = (theme, mode) => ({
  bg: theme.colors.bg.secondary,
  cardBg: theme.colors.bg.tertiary,
  border: theme.colors.border,
  textPrimary: theme.colors.text.primary,
  textSecondary: theme.colors.text.secondary,
  textTertiary: theme.colors.text.tertiary,
  activeTabBg: mode === 'dark' ? '#1d4a73' : '#e5e5e5',
  hoverBg: theme.colors.bg.tertiary,
  error: theme.colors.accent.error,
  accent: theme.colors.accent.primary,
  fontFamily: theme.typography.fontFamily.sans,
});

/**
 * Creates modal backdrop style with blur effect
 * @param {number} zIndex - Z-index for the backdrop (default: 999)
 * @returns {Object} Style object for modal backdrop
 *
 * @example
 * <div style={createModalBackdropStyle(Z_INDEX.MODAL_BACKDROP)} onClick={onClose} />
 */
export const createModalBackdropStyle = (zIndex = 999) => ({
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  zIndex,
  animation: 'fadeIn 0.2s ease-out',
});

/**
 * Creates modal panel/container style
 * @param {Object} theme - Theme object from getTheme()
 * @param {number} zIndex - Z-index for the modal panel (default: 1000)
 * @returns {Object} Style object for modal container
 *
 * @example
 * <div style={{ ...createModalPanelStyle(theme, Z_INDEX.MODALS), maxWidth: '480px' }}>...</div>
 */
export const createModalPanelStyle = (theme, zIndex = 1000) => ({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  background: theme.colors.bg.secondary,
  borderRadius: '24px',
  boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
  zIndex,
  animation: 'slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
});

/**
 * CSS keyframes for modal animations
 * Include this in a <style> tag within your modal component
 *
 * @example
 * <style>{MODAL_ANIMATIONS}</style>
 */
export const MODAL_ANIMATIONS = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translate(-50%, -48%) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
`;

