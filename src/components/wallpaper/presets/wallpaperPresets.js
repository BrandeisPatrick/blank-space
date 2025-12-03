/**
 * Theme preset configurations
 * Different color themes for the background
 */

export const themePresets = {
  starry: {
    name: 'Starry',
    description: 'Night sky with stars',
    backgroundColor: '#0f1729',
    gradient: 'linear-gradient(145deg, #0f1729, #1a2744)',
    waveOpacities: [0, 0, 0, 0, 0],
    variant: 'stars',
    isDark: true,
  },
  lavender: {
    name: 'Lavender',
    description: 'Soft purple tones',
    backgroundColor: '#C9CAD8',
    gradient: 'linear-gradient(145deg, #C9CAD8, #D1D2DE)',
    waveOpacities: [0.4, 0.35, 0.45, 0.4, 0.35],
    isDark: false,
  },
  rose: {
    name: 'Rose',
    description: 'Warm pink hues',
    backgroundColor: '#D8C9C9',
    gradient: 'linear-gradient(145deg, #D8C9C9, #DED1D1)',
    waveOpacities: [0.4, 0.35, 0.45, 0.4, 0.35],
    isDark: false,
  },
  mint: {
    name: 'Mint',
    description: 'Fresh green tones',
    backgroundColor: '#C9D8CE',
    gradient: 'linear-gradient(145deg, #C9D8CE, #D1DED6)',
    waveOpacities: [0.4, 0.35, 0.45, 0.4, 0.35],
    isDark: false,
  },
  sky: {
    name: 'Sky',
    description: 'Calm blue shades',
    backgroundColor: '#C9D4D8',
    gradient: 'linear-gradient(145deg, #C9D4D8, #D1DCDE)',
    waveOpacities: [0.4, 0.35, 0.45, 0.4, 0.35],
    isDark: false,
  },
  sand: {
    name: 'Sand',
    description: 'Warm neutral beige',
    backgroundColor: '#D8D4C9',
    gradient: 'linear-gradient(145deg, #D8D4C9, #DED9D1)',
    waveOpacities: [0.4, 0.35, 0.45, 0.4, 0.35],
    isDark: false,
  },
};

// Backwards compatibility alias
export const wallpaperPresets = themePresets;

// Default preset key
export const DEFAULT_THEME = 'lavender';
export const DEFAULT_WALLPAPER = DEFAULT_THEME;
