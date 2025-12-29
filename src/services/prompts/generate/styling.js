/**
 * Styling
 * Minimal style guidance - let AI be creative
 */

/**
 * Build simplified style prompt
 */
export function buildStylingPrompt(options = {}) {
  const {
    aiUIStyle = 'glassmorphism',
    isDarkTheme = true
  } = options;

  const themeMode = isDarkTheme ? 'dark' : 'light';

  const styleDescriptions = {
    glassmorphism: 'frosted glass effects, blur backdrops, subtle transparency, soft shadows',
    minimal: 'clean lines, lots of whitespace, simple typography, subtle accents',
    brutalist: 'bold contrasts, raw edges, strong typography, unconventional layouts',
    neomorphism: 'soft shadows, subtle depth, muted colors, tactile feel',
    retro: 'vintage colors, nostalgic typography, playful elements'
  };

  const styleDesc = styleDescriptions[aiUIStyle] || styleDescriptions.glassmorphism;

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
