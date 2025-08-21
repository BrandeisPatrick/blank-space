type ThemeMode = 'light' | 'dark'

const lightTheme = {
  colors: {
    // Milky/Cream UI color palette (Light Mode)
    bg: {
      primary: '#fefcf8',      // Warm cream background
      secondary: '#f9f6f1',    // Soft cream for cards
      tertiary: '#f4f0ea',     // Slightly darker cream for active states
      hover: '#ede8e1',        // Hover states
      border: '#e6e1d8',       // Subtle cream borders
    },
    text: {
      primary: '#3c3530',      // Warm dark brown
      secondary: '#6b635a',    // Medium brown
      tertiary: '#938b82',     // Light brown
      disabled: '#c2bdb6',     // Very light brown
    },
    accent: {
      primary: '#8b7355',      // Warm coffee brown
      secondary: '#a68b5b',    // Golden brown
      success: '#7d8471',      // Sage green
      warning: '#c4965a',      // Warm amber
      error: '#b8695d',        // Soft terracotta
    },
    gradient: {
      primary: 'linear-gradient(145deg, #f9f6f1, #ede8e1)',
      subtle: 'linear-gradient(145deg, #fefcf8, #f4f0ea)',
    }
  },
  shadows: {
    // Soft neumorphism shadows for milky UI
    sm: 'inset 2px 2px 4px rgba(203, 189, 174, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.8)',
    md: 'inset 3px 3px 6px rgba(203, 189, 174, 0.4), inset -3px -3px 6px rgba(255, 255, 255, 0.9)',
    lg: 'inset 4px 4px 8px rgba(203, 189, 174, 0.5), inset -4px -4px 8px rgba(255, 255, 255, 1)',
    xl: 'inset 6px 6px 12px rgba(203, 189, 174, 0.6), inset -6px -6px 12px rgba(255, 255, 255, 1)',
    // Outset shadows for buttons and elevated elements
    outset: '2px 2px 4px rgba(203, 189, 174, 0.3), -2px -2px 4px rgba(255, 255, 255, 0.8)',
    outsetMd: '3px 3px 6px rgba(203, 189, 174, 0.4), -3px -3px 6px rgba(255, 255, 255, 0.9)',
    glow: '0 0 8px rgba(139, 115, 85, 0.2)',
  },
}

const darkTheme = {
  colors: {
    // Dark mode palette
    bg: {
      primary: '#0f0f0f',      // Deep black
      secondary: '#1a1a1a',    // Darker grey
      tertiary: '#252525',     // Medium grey for active states
      hover: '#303030',        // Lighter grey for hover
      border: '#3a3a3a',       // Border grey
    },
    text: {
      primary: '#ffffff',      // Pure white
      secondary: '#cccccc',    // Light grey
      tertiary: '#999999',     // Medium grey
      disabled: '#666666',     // Dark grey
    },
    accent: {
      primary: '#e6ddd4',      // Warm cream accent
      secondary: '#d4c4b0',    // Darker cream
      success: '#88c999',      // Soft green
      warning: '#e6b366',      // Warm orange
      error: '#e67e7e',        // Soft red
    },
    gradient: {
      primary: 'linear-gradient(145deg, #252525, #1a1a1a)',
      subtle: 'linear-gradient(145deg, #1a1a1a, #0f0f0f)',
    }
  },
  shadows: {
    // Dark neumorphism shadows
    sm: 'inset 2px 2px 4px rgba(0, 0, 0, 0.5), inset -2px -2px 4px rgba(255, 255, 255, 0.02)',
    md: 'inset 3px 3px 6px rgba(0, 0, 0, 0.6), inset -3px -3px 6px rgba(255, 255, 255, 0.03)',
    lg: 'inset 4px 4px 8px rgba(0, 0, 0, 0.7), inset -4px -4px 8px rgba(255, 255, 255, 0.04)',
    xl: 'inset 6px 6px 12px rgba(0, 0, 0, 0.8), inset -6px -6px 12px rgba(255, 255, 255, 0.05)',
    // Outset shadows for buttons and elevated elements
    outset: '2px 2px 4px rgba(0, 0, 0, 0.5), -2px -2px 4px rgba(255, 255, 255, 0.02)',
    outsetMd: '3px 3px 6px rgba(0, 0, 0, 0.6), -3px -3px 6px rgba(255, 255, 255, 0.03)',
    glow: '0 0 8px rgba(230, 221, 212, 0.15)',
  },
}

export const getTheme = (mode: ThemeMode) => {
  return {
    ...(mode === 'light' ? lightTheme : darkTheme),
    radius: {
      sm: '8px',
      md: '16px',
      lg: '20px',
      xl: '24px',
      '2xl': '32px',
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
      fast: '150ms ease',
      normal: '250ms ease',
      slow: '350ms ease',
    },
    breakpoints: {
      mobile: '768px',
      tablet: '1024px',
      desktop: '1440px',
    }
  }
}

// Backward compatibility - default to light theme
export const theme = getTheme('light')