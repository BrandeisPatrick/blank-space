/**
 * Styling
 * Minimal style guidance - let AI be creative
 */

/**
 * Build simplified style prompt
 */
export function buildStylingPrompt(options = {}) {
  const {
    aiUIStyle = 'dark-professional',
    isDarkTheme = true
  } = options;

  const themeMode = isDarkTheme ? 'dark' : 'light';

  const styleDescriptions = {
    'dark-professional': 'pure black background, off-white text (#f9f9f9), subtle borders (#1f1f1f), consistent rounded-lg, font-normal/medium weights only'
  };

  const styleDesc = styleDescriptions[aiUIStyle] || styleDescriptions['dark-professional'];

  return `
# STYLING GUIDELINES

Theme: ${themeMode.toUpperCase()} mode
Style: ${aiUIStyle} (${styleDesc})

Use Tailwind CSS. Be creative with the design while keeping it:
- Visually cohesive
- Mobile-responsive (mobile-first)
- Accessible (good contrast, readable text)

Keep heroes compact (15-20% viewport max, no giant padding).
`;
}
