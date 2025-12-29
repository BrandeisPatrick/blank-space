/**
 * Styling
 * Style system integration for generate intent
 */

import { buildStylePrompt } from '../../stylePresets/stylePromptBuilder.js';

/**
 * Build style prompt section
 */
export function buildStylingPrompt(options = {}) {
  const {
    aiColorPalette = 'matchWallpaper',
    aiUIStyle = 'glassmorphism',
    wallpaperTheme = 'starry',
    isDarkTheme = true
  } = options;

  return buildStylePrompt({
    colorPaletteId: aiColorPalette,
    uiStyleId: aiUIStyle,
    wallpaperTheme,
    isDarkTheme
  });
}
