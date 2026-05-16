const lightTheme = {
  colors: {
    // Softer warm cream + warm dark text — Claude.ai-style professional warmth
    bg: {
      primary: '#F4F1EA',      // Deeper warm cream — clearly off-white, soft
      secondary: '#ECE7DC',    // Elevated surface
      tertiary: '#E0DAC9',     // Pressed/active
      hover: '#E7E2D3',
      border: '#D6CFBC',
    },
    border: '#D6CFBC',
    text: {
      primary: '#2E2A24',      // Warm dark grey (softer than sharp near-black)
      secondary: '#5C5853',    // Warm medium grey
      tertiary: '#8E8A82',
      disabled: '#B5B1A8',
    },
    accent: {
      primary: '#7C5BD9',      // Vivid violet (Tailwind violet-600)
      secondary: '#C4B5FD',    // Lighter violet (Tailwind violet-300)
      success: '#34c759',
      warning: '#ff9500',
      error: '#ff3b30',
      info: '#7C5BD9',
      ios: '#7C5BD9',
      iosHover: '#6B4FBF',
      iosLight: 'rgba(124, 91, 217, 0.10)',
    },
    status: {
      success: '#34c759',      // Bright green
      warning: '#ff9500',      // Orange
      error: '#ff3b30',        // Bright red
      info: '#C97D63',         // Terracotta for info
    },
    gradient: {
      primary: 'linear-gradient(145deg, #F5F5F7, #EAEAEC)',
      subtle: 'linear-gradient(145deg, #EFEFEF, #F5F5F7)',
      button: 'linear-gradient(145deg, #E8E8EA, #DCDCDE)',
    }
  },
  shadows: {
    // iOS-style subtle shadows for depth and elevation
    sm: '0 2px 4px rgba(0, 0, 0, 0.05)',
    md: '0 4px 12px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
    xl: '0 12px 32px rgba(0, 0, 0, 0.15)',
    outset: '0 4px 12px rgba(0, 0, 0, 0.08)',      // Outset shadow for depth effect
    outsetMd: '0 8px 20px rgba(0, 0, 0, 0.1)',    // Medium outset shadow
    glow: '0 0 20px rgba(201, 125, 99, 0.2)',     // Glow effect for emphasis with terracotta
  },
}

const darkTheme = {
  colors: {
    // Softer mid-dark grey-purple — less aggressive than near-black
    bg: {
      primary: '#2D2A35',      // Medium dark with purple undertone
      secondary: '#383448',    // Elevated surface
      tertiary: '#423E55',     // Pressed/active
      hover: '#4A4660',
      border: '#3A3648',
    },
    border: '#3A3648',
    text: {
      primary: '#ECEAF2',      // Soft cool white
      secondary: '#A3A0B5',    // Cool grey
      tertiary: '#7E7B92',
      disabled: '#5F5C70',
    },
    accent: {
      primary: '#A78BFA',      // Bright lavender (Tailwind violet-400)
      secondary: '#C4B5FD',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#A78BFA',
      ios: '#A78BFA',
      iosHover: '#B79DFC',
      iosLight: 'rgba(167, 139, 250, 0.20)',
    },
    status: {
      success: '#4ade80',      // Bright green
      warning: '#fbbf24',      // Bright yellow
      error: '#f87171',        // Bright red
      info: '#60a5fa',         // Bright blue for info
    },
    gradient: {
      primary: 'linear-gradient(145deg, #1e1e1e, #161616)',
      subtle: 'linear-gradient(145deg, #212121, #191919)',
      button: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
    }
  },
  shadows: {
    // iOS-style subtle shadows for depth and elevation in dark mode
    sm: '0 2px 4px rgba(0, 0, 0, 0.3)',
    md: '0 4px 12px rgba(0, 0, 0, 0.4)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
    xl: '0 12px 32px rgba(0, 0, 0, 0.6)',
    outset: '0 4px 12px rgba(0, 0, 0, 0.4)',      // Outset shadow for depth effect
    outsetMd: '0 8px 20px rgba(0, 0, 0, 0.5)',    // Medium outset shadow
    outsetPressed: '0 2px 6px rgba(0, 0, 0, 0.3)',   // Pressed state shadow
    glow: '0 0 20px rgba(201, 125, 99, 0.3)',     // Glow effect for emphasis with terracotta
  },
}

// Export raw theme configs for preview purposes
export const themes = {
  light: lightTheme.colors,
  dark: darkTheme.colors,
};

export const getTheme = (mode) => {
  const baseTheme = mode === 'light' ? lightTheme : darkTheme
  return {
    ...baseTheme,
    radius: {
      xs: '2px',
      sm: '3px',
      base: '4px',
      md: '6px',
      lg: '6px',
      xl: '8px',
      '2xl': '12px',
      '2.5xl': '18px',
      full: '9999px',
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
      '4xl': '40px',
      '5xl': '48px',
      '6xl': '64px',
      '7xl': '80px',
      '8xl': '120px',
    },
    sizes: {
      // Icon sizes for consistent icon dimensions
      icon: {
        xs: '12px',
        sm: '16px',
        md: '20px',
        lg: '24px',
        xl: '28px',
        '2xl': '48px',
      },
      // Button heights for consistent button sizing
      button: {
        sm: '36px',
        md: '46px',
        lg: '54px',
        // Button padding values (vertical/horizontal)
        padding: {
          sm: '10px 14px',
          md: '12px 18px',
          lg: '14px 22px',
        }
      },
      // Avatar/profile picture sizes
      avatar: {
        sm: '32px',
        md: '36px',
        lg: '48px',
      },
      // Container max-widths for layout constraints
      container: {
        sm: '400px',
        md: '600px',
        lg: '800px',
        xl: '1200px',
      },
      // Sidebar and panel widths
      sidebar: {
        narrow: '220px',
        default: '320px',
        wide: '350px',
      },
      // Header/TopBar heights
      topbar: {
        mobile: '60px',
        desktop: '70px',
      },
      // Chat/input panel heights and widths
      panel: {
        headerHeight: '48px',
      },
    },
    borderWidth: {
      thin: '1px',
      medium: '2px',
      thick: '4px',
    },
    typography: {
      fontFamily: {
        sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        mono: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75',
      },
      // React Native text variants. Numbers, not CSS strings — consumed by
      // the mobile <ThemedText variant="..."> prop. Web should keep using
      // the CSS-string fontSize/fontWeight/lineHeight blocks above.
      text: {
        display:  { fontSize: 32, fontWeight: '700', lineHeight: 38, letterSpacing: -0.4 },
        title1:   { fontSize: 24, fontWeight: '600', lineHeight: 30, letterSpacing: -0.3 },
        title2:   { fontSize: 20, fontWeight: '600', lineHeight: 26, letterSpacing: -0.2 },
        title3:   { fontSize: 17, fontWeight: '600', lineHeight: 22, letterSpacing: -0.2 },
        headline: { fontSize: 16, fontWeight: '600', lineHeight: 22, letterSpacing: 0 },
        body:     { fontSize: 16, fontWeight: '400', lineHeight: 24, letterSpacing: 0 },
        callout:  { fontSize: 15, fontWeight: '500', lineHeight: 22, letterSpacing: 0 },
        subhead:  { fontSize: 14, fontWeight: '500', lineHeight: 20, letterSpacing: 0 },
        footnote: { fontSize: 13, fontWeight: '400', lineHeight: 18, letterSpacing: 0 },
        caption:  { fontSize: 12, fontWeight: '500', lineHeight: 16, letterSpacing: 0.2 },
      },
    },
    animation: {
      fast: '100ms ease',
      normal: '150ms ease',
      slow: '200ms ease',
    },
    breakpoints: {
      mobile: '768px',
      tablet: '1024px',
      desktop: '1440px',
    },
    // Unified effect tokens for common patterns
    effects: {
      glass: {
        // Enhanced liquid glass/glassmorphism with saturation and inner glow
        default: {
          background: mode === 'light' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          border: mode === 'light' ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: mode === 'light'
            ? 'inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(0, 0, 0, 0.05)'
            : 'inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.2)',
        },
        hover: {
          background: mode === 'light' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(20px) saturate(200%)',
          WebkitBackdropFilter: 'blur(20px) saturate(200%)',
        },
      },
      overlay: {
        // Modal/backdrop overlays
        dark: 'rgba(0, 0, 0, 0.5)',
        light: 'rgba(0, 0, 0, 0.2)',
      }
    },
    // Native (React Native) surface tokens — translucent fills/borders for
    // glass affordances over a BlurView, plus high-contrast button colors.
    surfaces: {
      glass: {
        fill:         mode === 'light' ? 'rgba(0,0,0,0.04)'      : 'rgba(255,255,255,0.06)',
        fillStrong:   mode === 'light' ? 'rgba(0,0,0,0.05)'      : 'rgba(255,255,255,0.08)',
        border:       mode === 'light' ? 'rgba(0,0,0,0.08)'      : 'rgba(255,255,255,0.10)',
        borderStrong: mode === 'light' ? 'rgba(0,0,0,0.10)'      : 'rgba(255,255,255,0.16)',
        fallback:     mode === 'light' ? 'rgba(244,241,234,0.78)': 'rgba(56,52,72,0.78)',
        blurTint:     mode === 'light' ? 'systemUltraThinMaterialLight' : 'systemUltraThinMaterialDark',
      },
      button: {
        primary: {
          bg: mode === 'light' ? '#000000' : '#FFFFFF',
          fg: mode === 'light' ? '#FFFFFF' : '#000000',
        },
      },
    },
    // Hover state opacity levels
    opacity: {
      hover: {
        light: 0.85,    // For subtle hover effects
        medium: 0.75,   // Standard hover effect
        strong: 0.6,    // More pronounced hover effect
      },
      disabled: 0.5,
      faded: 0.3,
      pressed: 0.6,        // Mobile: glass buttons + secondary affordances
      pressedStrong: 0.75, // Mobile: primary CTAs (send, FAB, "Fix with AI")
    },
    // Native (RN) shadow tokens — spread into a style array via
    // `style={[styles.X, theme.nativeShadow.Y]}`. StyleSheet.create can't
    // reference these (they're computed per-mode), so we apply them inline.
    nativeShadow: {
      sm: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      },
      md: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      },
      lg: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      },
    },
    // Semantic text tones — consumed by <ThemedText tone="...">.
    tone: {
      primary:   baseTheme.colors.text.primary,
      secondary: baseTheme.colors.text.secondary,
      tertiary:  baseTheme.colors.text.tertiary,
      disabled:  baseTheme.colors.text.disabled,
      accent:    baseTheme.colors.accent.primary,
      link:      baseTheme.colors.accent.ios,
      inverse:   mode === 'dark' ? '#000000' : '#FFFFFF',
      error:     baseTheme.colors.status.error,
    },
    // Color hover variants
    colorVariants: {
      accent: {
        primaryHover: mode === 'light' ? '#d89077' : '#e8a896',
      },
      // Common color overrides
      white: '#ffffff',
      error: {
        light: '#fee2e2',
        dark: '#7f1d1d',
      }
    }
  }
}
