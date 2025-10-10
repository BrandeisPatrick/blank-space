const lightTheme = {
  colors: {
    // Milky/Cream UI color palette (Light Mode)
    bg: {
      primary: '#fefcf8',      // Warm cream background
      secondary: '#f9f6f1',    // Soft cream for cards
      tertiary: '#f4f0ea',     // Slightly darker cream for active states
      hover: '#ede8e1',        // Hover states
      border: '#e6e1d8',       // Border color in bg context
    },
    border: '#e6e1d8',         // Subtle cream borders
    text: {
      primary: '#3c3530',      // Warm dark brown
      secondary: '#6b635a',    // Medium brown
      tertiary: '#938b82',     // Light brown
      disabled: '#c2bdb6',     // Very light brown
    },
    accent: {
      primary: '#333333',      // Dark grey for buttons
      secondary: '#a68b5b',    // Golden brown
      success: '#7d8471',      // Sage green
      warning: '#c4965a',      // Warm amber
      error: '#b8695d',        // Soft terracotta
      info: '#a68b5b',         // Golden brown for info
    },
    status: {
      success: '#7d8471',      // Sage green
      warning: '#c4965a',      // Warm amber
      error: '#b8695d',        // Soft terracotta
      info: '#a68b5b',         // Golden brown for info
    },
    gradient: {
      primary: 'linear-gradient(145deg, #f9f6f1, #ede8e1)',
      subtle: 'linear-gradient(145deg, #fefcf8, #f4f0ea)',
      button: 'linear-gradient(145deg, #f4f0ea, #ede8e1)',
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
    // Strong neumorphic shadows for dark theme
    sm: 'inset 2px 2px 5px rgba(0, 0, 0, 0.8), inset -2px -2px 5px rgba(255, 255, 255, 0.05)',
    md: 'inset 4px 4px 8px rgba(0, 0, 0, 0.9), inset -4px -4px 8px rgba(255, 255, 255, 0.06)',
    lg: 'inset 6px 6px 12px rgba(0, 0, 0, 1), inset -6px -6px 12px rgba(255, 255, 255, 0.07)',
    xl: 'inset 8px 8px 16px rgba(0, 0, 0, 1), inset -8px -8px 16px rgba(255, 255, 255, 0.08)',
    // Outset shadows for buttons and elevated elements (stronger neumorphism)
    outset: '5px 5px 10px rgba(0, 0, 0, 0.8), -5px -5px 10px rgba(255, 255, 255, 0.05)',
    outsetMd: '8px 8px 16px rgba(0, 0, 0, 0.9), -8px -8px 16px rgba(255, 255, 255, 0.06)',
    outsetPressed: 'inset 3px 3px 6px rgba(0, 0, 0, 0.9), inset -3px -3px 6px rgba(255, 255, 255, 0.04)',
    glow: '0 0 20px rgba(255, 255, 255, 0.1)',
  },
}

export const getTheme = (mode) => {
  const baseTheme = mode === 'light' ? lightTheme : darkTheme
  return {
    ...baseTheme,
    shadow: baseTheme.shadows, // Add shadow alias for shadows
    radius: {
      xs: '4px',
      sm: '8px',
      base: '12px',
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
