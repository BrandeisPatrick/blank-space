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
    // Flat design - no shadows
    sm: 'none',
    md: 'none',
    lg: 'none',
    xl: 'none',
    outset: 'none',
    outsetMd: 'none',
    glow: 'none',
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
    // Flat design - no shadows
    sm: 'none',
    md: 'none',
    lg: 'none',
    xl: 'none',
    outset: 'none',
    outsetMd: 'none',
    outsetPressed: 'none',
    glow: 'none',
  },
}

export const getTheme = (mode) => {
  const baseTheme = mode === 'light' ? lightTheme : darkTheme
  return {
    ...baseTheme,
    shadow: baseTheme.shadows, // Add shadow alias for shadows
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
        // Liquid glass/glassmorphism effect
        default: {
          background: mode === 'light' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: mode === 'light' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.15)',
        },
        hover: {
          background: mode === 'light' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)',
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
      }
    }
  }
}
