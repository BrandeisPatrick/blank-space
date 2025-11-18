/**
 * Wallpaper preset configurations for different pages and themes
 * Defines wave opacity, colors, and style presets
 */

export const wallpaperPresets = {
  landing: {
    name: 'Landing',
    description: 'Bold diagonal waves for landing page',
    waveOpacities: [0.4, 0.35, 0.45, 0.4, 0.35],
    waveColor: 'rgba(255,255,255',
    complexity: 'high',
  },
  minimal: {
    name: 'Minimal',
    description: 'Subtle waves for minimal aesthetic',
    waveOpacities: [0.2, 0.15, 0.25, 0.2, 0.15],
    waveColor: 'rgba(255,255,255',
    complexity: 'low',
  },
  dramatic: {
    name: 'Dramatic',
    description: 'Highly visible waves for maximum impact',
    waveOpacities: [0.6, 0.55, 0.65, 0.6, 0.55],
    waveColor: 'rgba(255,255,255',
    complexity: 'high',
  },
};

export const getWavePresetsForTheme = (theme) => {
  // Future: Can extend with theme-specific colors
  return wallpaperPresets;
};
