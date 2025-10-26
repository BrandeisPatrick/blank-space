/**
 * Color Extraction Utility
 * Extracts Tailwind color scheme from existing code to maintain consistency
 */

/**
 * Extract color scheme from existing code
 * @param {string} code - Code to analyze
 * @returns {Object|null} Color scheme or null if no colors found
 */
export function extractColorScheme(code) {
  // Type guard: ensure code is a string to prevent crashes
  if (!code || typeof code !== 'string') {
    return null;
  }

  const colorPatterns = {
    backgrounds: code.match(/bg-[\w-]+/g) || [],
    gradients: code.match(/from-[\w-]+|via-[\w-]+|to-[\w-]+/g) || [],
    text: code.match(/text-[\w-]+/g) || [],
    borders: code.match(/border-[\w-]+/g) || [],
    shadows: code.match(/shadow-[\w-]+/g) || [],
    rings: code.match(/ring-[\w-]+/g) || [],
    decorations: code.match(/decoration-[\w-]+/g) || [],
    divides: code.match(/divide-[\w-]+/g) || [],
    accents: code.match(/accent-[\w-]+/g) || []
  };

  // Find most common colors
  const allColors = [
    ...colorPatterns.backgrounds,
    ...colorPatterns.gradients,
    ...colorPatterns.text,
    ...colorPatterns.rings,
    ...colorPatterns.decorations,
    ...colorPatterns.divides,
    ...colorPatterns.accents
  ];

  if (allColors.length === 0) return null;

  return {
    backgrounds: [...new Set(colorPatterns.backgrounds)].slice(0, 3).join(', '),
    gradients: [...new Set(colorPatterns.gradients)].slice(0, 3).join(', '),
    textColors: [...new Set(colorPatterns.text)].slice(0, 3).join(', '),
    borderColors: [...new Set(colorPatterns.borders)].slice(0, 2).join(', '),
    shadows: [...new Set(colorPatterns.shadows)].slice(0, 2).join(', '),
    rings: [...new Set(colorPatterns.rings)].slice(0, 2).join(', '),
    decorations: [...new Set(colorPatterns.decorations)].slice(0, 2).join(', '),
    divides: [...new Set(colorPatterns.divides)].slice(0, 2).join(', '),
    accents: [...new Set(colorPatterns.accents)].slice(0, 2).join(', ')
  };
}

export default {
  extractColorScheme
};
