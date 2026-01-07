// Style Prompt Builder
// Builds comprehensive styling section for AI system prompts based on user preferences

import { COLOR_PALETTES, DEFAULT_COLOR_PALETTE } from "./colorPalettes";
import { UI_STYLES } from "./uiStyles";
import { replaceColorTokens } from "../prompts/utils/tokenReplacer.js";

/**
 * Formats color palette into prompt text
 * @param {Object} colors - Color palette object
 * @param {string} paletteName - Name of the palette
 * @returns {string} Formatted color section
 */
function formatColorPalette(colors, paletteName) {
  return `
## COLOR PALETTE: ${paletteName}

### Primary Colors
- Primary: ${colors.primary.base} (hover: ${colors.primary.hover}, light: ${colors.primary.light})
- Secondary: ${colors.secondary.base} (hover: ${colors.secondary.hover}, light: ${colors.secondary.light})
- Accent: ${colors.accent.base} (hover: ${colors.accent.hover})

### Background Colors
- Page background: bg-gradient-to-br ${colors.background.page}
- Card background: bg-${colors.background.card}
- Muted/subtle: bg-${colors.background.muted}

### Text Colors
- Headings: text-${colors.text.heading}
- Body text: text-${colors.text.body}
- Muted/secondary: text-${colors.text.muted}

### Status Colors
- Success: ${colors.status.success}
- Error: ${colors.status.error}
- Warning: ${colors.status.warning}
- Info: ${colors.status.info}

### Border Color
- Default border: border-${colors.border}

### Theme Mode: ${colors.isDark ? "DARK" : "LIGHT"}
`;
}

/**
 * Formats UI style into prompt text
 * @param {Object} style - UI style object
 * @returns {string} Formatted style section
 */
function formatUIStyle(style) {
  const { typography, radius, shadows, components, promptSnippet } = style;

  return `
## UI STYLE: ${style.name.toUpperCase()}

### Typography System
- Font Family: ${typography.fontFamily}
- H1: ${typography.h1.size} ${typography.h1.weight} ${typography.h1.lineHeight}
- H2: ${typography.h2.size} ${typography.h2.weight} ${typography.h2.lineHeight}
- H3: ${typography.h3.size} ${typography.h3.weight} ${typography.h3.lineHeight}
- Body: ${typography.body.size} ${typography.body.weight} ${typography.body.lineHeight}
- Small: ${typography.small.size} ${typography.small.weight} ${typography.small.lineHeight}

### Border Radius
- Small elements: ${radius.small}
- Medium elements: ${radius.medium}
- Large containers: ${radius.large}
- Circular: ${radius.full}

### Shadows
- Small: ${shadows.small || "none"}
- Medium: ${shadows.medium || "none"}
- Large: ${shadows.large || "none"}
${shadows.glow ? `- Glow effect: ${shadows.glow}` : ""}
${shadows.inset ? `- Inset: ${shadows.inset}` : ""}

### Style Guidelines
${promptSnippet}
`;
}

/**
 * Formats component patterns with color tokens replaced
 * @param {Object} components - Component patterns object
 * @param {Object} colors - Color palette to substitute
 * @returns {string} Formatted component patterns
 */
function formatComponentPatterns(components, colors) {
  return `
## COMPONENT PATTERNS (Use these exact Tailwind classes)

### Page Layout
\`\`\`
Page wrapper: "${replaceColorTokens(components.pageWrapper, colors)}"
Container: "${components.container}"
\`\`\`

### Cards
\`\`\`
Card: "${replaceColorTokens(components.card, colors)}"
Card hover: "${replaceColorTokens(components.cardHover, colors)}"
\`\`\`

### Buttons
\`\`\`
Primary button: "${replaceColorTokens(components.button.primary, colors)}"
Secondary button: "${replaceColorTokens(components.button.secondary, colors)}"
Ghost button: "${replaceColorTokens(components.button.ghost, colors)}"
\`\`\`

### Form Elements
\`\`\`
Input field: "${replaceColorTokens(components.input, colors)}"
\`\`\`

### List Items
\`\`\`
List item: "${replaceColorTokens(components.listItem, colors)}"
\`\`\`
`;
}

/**
 * Formats hero section patterns with color tokens replaced
 * @param {Object} hero - Hero component patterns
 * @param {Object} colors - Color palette to substitute
 * @param {string} styleName - Name of the UI style
 * @returns {string} Formatted hero section patterns
 */
function formatHeroSection(hero, colors, styleName) {
  if (!hero) return "";

  // Build hero pattern entries dynamically
  const heroEntries = Object.entries(hero)
    .map(([key, value]) => `${key}: "${replaceColorTokens(value, colors)}"`)
    .join("\n");

  return `
## HERO SECTION STYLING (Compact & Modern)

Heroes should be **compact** - just an introduction, not the main content.
Use Badge + Title only (no subtitle) for a clean, modern look.

### SIZE CONSTRAINTS (CRITICAL)
- Section padding: py-8 md:py-12 (32px / 48px) - NOT py-20 or larger
- Title: text-2xl md:text-3xl lg:text-4xl - NOT text-5xl or larger
- Badge: text-xs - small and subtle
- Content width: max-w-xl md:max-w-2xl - NOT max-w-4xl
- Hero should be ~15-20% of viewport, NOT 50%+

### Hero Component Classes (${styleName})
\`\`\`
${heroEntries}
\`\`\`

### Hero Structure (Badge + Title only)
\`\`\`jsx
<section className={hero.section}>
  {/* Optional: subtle background effects */}
  <div className={hero.content}>
    <span className={hero.badge}>✨ Category</span>
    <h1 className={hero.title}>App Title Here</h1>
    <div className={hero.buttons}>{/* Optional CTA */}</div>
  </div>
</section>
\`\`\`

### DO NOT
- Use subtitles (they add clutter)
- Make titles larger than text-4xl on desktop
- Use padding larger than py-12
- Let hero take up more than 25% of viewport
`;
}

/**
 * Builds the complete styling section of the system prompt based on user settings
 * @param {Object} options
 * @param {string} options.colorPaletteId - Selected color palette ID
 * @param {string} options.uiStyleId - Selected UI style ID
 * @param {boolean} options.isDarkTheme - Whether current theme is dark
 * @returns {string} Formatted prompt section for styling
 */
export function buildStylePrompt({
  colorPaletteId = DEFAULT_COLOR_PALETTE,
  uiStyleId = "glassmorphism",
  isDarkTheme = true,
}) {
  let colors;
  let paletteName;

  // Get color palette
  const palette = COLOR_PALETTES[colorPaletteId] || COLOR_PALETTES[DEFAULT_COLOR_PALETTE];
  if (palette && palette.colors) {
    colors = palette.colors;
    colors.isDark = palette.isDark;
    paletteName = palette.name;
  } else {
    // Fallback to cyber neon dark
    colors = COLOR_PALETTES.cyberNeon.colors;
    colors.isDark = true;
    paletteName = "Default";
  }

  // Get UI style
  const style = UI_STYLES[uiStyleId] || UI_STYLES.glassmorphism;

  // Build the complete prompt section
  return `

# USER-SELECTED DESIGN SYSTEM

Apply these design specifications consistently across ALL generated components.
These settings override the default styling rules.

${formatColorPalette(colors, paletteName)}

${formatUIStyle(style)}

${formatComponentPatterns(style.components, colors)}

${formatHeroSection(style.components.hero, colors, style.name)}

## IMPORTANT INSTRUCTIONS

1. **Use the exact color classes** specified above (e.g., bg-${colors.primary.base}, text-${colors.text.heading})
2. **Follow the typography system** - use the correct text sizes and weights for each heading level
3. **Apply the UI style consistently** - ${style.name} style across all elements
4. **Use the component patterns** as templates - copy the class strings directly
5. **Maintain the theme mode** - This is a ${colors.isDark ? "DARK" : "LIGHT"} theme design
6. **HEROES MUST BE COMPACT** - Keep hero sections small (15-20% viewport max):
   - Badge + Title only (NO subtitles)
   - Title: max text-4xl on desktop
   - Padding: max py-12
   - Leave room for actual app content below

`;
}

/**
 * Check if style preferences should be injected
 * @param {string} colorPaletteId
 * @param {string} uiStyleId
 * @returns {boolean}
 */
export function hasCustomStylePreferences(colorPaletteId, uiStyleId) {
  return true; // Always inject style preferences
}

export default {
  buildStylePrompt,
  hasCustomStylePreferences,
};
