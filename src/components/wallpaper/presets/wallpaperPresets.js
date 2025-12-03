/**
 * Wallpaper preset configurations
 * Different color themes for the background
 */

export const wallpaperPresets = {
  lavender: {
    name: 'Lavender',
    description: 'Soft purple tones',
    backgroundColor: '#C9CAD8',
    gradient: 'linear-gradient(145deg, #C9CAD8, #D1D2DE)',
    waveOpacities: [0.4, 0.35, 0.45, 0.4, 0.35],
  },
  rose: {
    name: 'Rose',
    description: 'Warm pink hues',
    backgroundColor: '#D8C9C9',
    gradient: 'linear-gradient(145deg, #D8C9C9, #DED1D1)',
    waveOpacities: [0.4, 0.35, 0.45, 0.4, 0.35],
  },
  mint: {
    name: 'Mint',
    description: 'Fresh green tones',
    backgroundColor: '#C9D8CE',
    gradient: 'linear-gradient(145deg, #C9D8CE, #D1DED6)',
    waveOpacities: [0.4, 0.35, 0.45, 0.4, 0.35],
  },
  sky: {
    name: 'Sky',
    description: 'Calm blue shades',
    backgroundColor: '#C9D4D8',
    gradient: 'linear-gradient(145deg, #C9D4D8, #D1DCDE)',
    waveOpacities: [0.4, 0.35, 0.45, 0.4, 0.35],
  },
  sand: {
    name: 'Sand',
    description: 'Warm neutral beige',
    backgroundColor: '#D8D4C9',
    gradient: 'linear-gradient(145deg, #D8D4C9, #DED9D1)',
    waveOpacities: [0.4, 0.35, 0.45, 0.4, 0.35],
  },
};

// Default preset key
export const DEFAULT_WALLPAPER = 'lavender';

export const getWavePresetsForTheme = (theme) => {
  return wallpaperPresets;
};
