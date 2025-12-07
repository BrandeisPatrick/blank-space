const lightTheme = {
  colors: {
    // Custom lavender & terracotta UI palette
    bg: {
      primary: '#C9CAD8',      // Background lavender
      secondary: '#F9F8F5',    // Off-white for cards/panels
      tertiary: '#D3D3DE',     // Suggestion cards/chips
      hover: '#D1D2DE',        // Slightly darker lavender
      border: '#D1D2DE',       // Border color
    },
    border: '#D1D2DE',         // Borders
    text: {
      primary: '#403530',      // Dark gray/brown
      secondary: '#5a534e',    // Medium gray/brown
      tertiary: '#86868b',     // Light gray
      disabled: '#b0b0b0',     // Very light gray
    },
    accent: {
      primary: '#C97D63',      // Terracotta/orange for buttons
      secondary: '#D1D2DE',    // Light lavender
      success: '#34c759',      // Bright green
      warning: '#ff9500',      // Orange
      error: '#ff3b30',        // Bright red
      info: '#C97D63',         // Terracotta for info
      ios: '#007AFF',          // iOS system blue
      iosHover: '#0066DD',     // iOS blue hover state
      iosLight: 'rgba(0, 122, 255, 0.12)',  // iOS blue background (light)
    },
    status: {
      success: '#34c759',      // Bright green
      warning: '#ff9500',      // Orange
      error: '#ff3b30',        // Bright red
      info: '#C97D63',         // Terracotta for info
    },
    gradient: {
      primary: 'linear-gradient(145deg, #C9CAD8, #D1D2DE)',
      subtle: 'linear-gradient(145deg, #D1D2DE, #C9CAD8)',
      button: 'linear-gradient(145deg, #D3D3DE, #D1D2DE)',
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
    // Dark neumorphic palette
    bg: {
      primary: '#1a1a1a',      // Dark grey base
      secondary: '#212121',    // Slightly lighter grey
      tertiary: '#2a2a2a',     // Medium grey for active states
      hover: '#333333',        // Lighter grey for hover
      border: '#404040',       // Border color in bg context
    },
    border: '#404040',         // Border grey
    text: {
      primary: '#ffffff',      // Pure white
      secondary: '#e0e0e0',    // Light grey
      tertiary: '#b0b0b0',     // Medium grey
      disabled: '#707070',     // Dark grey
    },
    accent: {
      primary: '#ffffff',      // White for buttons in dark mode
      secondary: '#f0f0f0',    // Off-white
      success: '#4ade80',      // Bright green
      warning: '#fbbf24',      // Bright yellow
      error: '#f87171',        // Bright red
      info: '#60a5fa',         // Bright blue for info
      ios: '#0A84FF',          // iOS system blue (dark mode variant)
      iosHover: '#409CFF',     // iOS blue hover state (dark mode)
      iosLight: 'rgba(10, 132, 255, 0.25)',  // iOS blue background (dark)
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
        sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
      }
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
    // Hover state opacity levels
    opacity: {
      hover: {
        light: 0.85,    // For subtle hover effects
        medium: 0.75,   // Standard hover effect
        strong: 0.6,    // More pronounced hover effect
      },
      disabled: 0.5,
      faded: 0.3,
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
