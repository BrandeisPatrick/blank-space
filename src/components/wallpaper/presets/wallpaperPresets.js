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
    starColors: ['#A78BFA', '#4ADE80', '#60A5FA', '#F9A8D4', '#FBBF24', '#67E8F9', '#FCD34D'],
  },
  christmas: {
    name: 'Christmas',
    description: 'Classic holiday green',
    backgroundColor: '#0f1a0f',
    gradient: 'linear-gradient(145deg, #0f1a0f, #152d15)',
    waveOpacities: [0, 0, 0, 0, 0],
    variant: 'stars',
    isDark: true,
    starColors: ['#EF4444', '#FBBF24', '#DC2626', '#F59E0B', '#FCD34D', '#FCA5A5'],
  },
  newyear: {
    name: 'New Year',
    description: 'Festive red and gold',
    backgroundColor: '#1a0f0f',
    gradient: 'linear-gradient(145deg, #1a0f0f, #2d1515)',
    waveOpacities: [0, 0, 0, 0, 0],
    variant: 'stars',
    isDark: true,
    starColors: ['#EF4444', '#22C55E', '#FBBF24', '#DC2626', '#16A34A', '#F59E0B'],
  },
  ocean: {
    name: 'Ocean',
    description: 'Deep blue sea',
    backgroundColor: '#0c1929',
    gradient: 'linear-gradient(145deg, #0c1929, #132d4a)',
    waveOpacities: [0, 0, 0, 0, 0],
    variant: 'stars',
    isDark: true,
    starColors: ['#06B6D4', '#3B82F6', '#22D3EE', '#0EA5E9', '#67E8F9', '#38BDF8'],
  },
  aurora: {
    name: 'Aurora',
    description: 'Northern lights',
    backgroundColor: '#0f1720',
    gradient: 'linear-gradient(145deg, #0f1720, #152030)',
    waveOpacities: [0, 0, 0, 0, 0],
    variant: 'stars',
    isDark: true,
    starColors: ['#4ADE80', '#22D3EE', '#A78BFA', '#34D399', '#67E8F9', '#8B5CF6'],
  },
  sunset: {
    name: 'Sunset',
    description: 'Warm evening glow',
    backgroundColor: '#1a1018',
    gradient: 'linear-gradient(145deg, #1a1018, #2d1a28)',
    waveOpacities: [0, 0, 0, 0, 0],
    variant: 'stars',
    isDark: true,
    starColors: ['#F97316', '#EC4899', '#FBBF24', '#F472B6', '#FB923C', '#F59E0B'],
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
  cream: {
    name: 'Cream',
    description: 'Soft ivory white',
    backgroundColor: '#F5F5F0',
    gradient: 'linear-gradient(145deg, #F5F5F0, #FAFAF7)',
    waveOpacities: [0.25, 0.2, 0.3, 0.25, 0.2],
    isDark: false,
  },
};

// Backwards compatibility alias
export const wallpaperPresets = themePresets;

// Default preset key
export const DEFAULT_THEME = 'lavender';
export const DEFAULT_WALLPAPER = DEFAULT_THEME;
