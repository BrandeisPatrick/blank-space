// Style Prompt Builder
// Builds comprehensive styling section for AI system prompts based on user preferences

import { COLOR_PALETTES } from "./colorPalettes";
import { UI_STYLES } from "./uiStyles";
import { deriveColorsFromWallpaper } from "./wallpaperMapping";

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
  // Helper to replace color tokens like {primary.base} with actual values
  const replaceTokens = (str) => {
    if (!str) return str;
    return str
      .replace(/\{primary\.base\}/g, colors.primary.base)
      .replace(/\{primary\.hover\}/g, colors.primary.hover)
      .replace(/\{primary\.light\}/g, colors.primary.light)
      .replace(/\{secondary\.base\}/g, colors.secondary.base)
      .replace(/\{secondary\.hover\}/g, colors.secondary.hover)
      .replace(/\{accent\.base\}/g, colors.accent.base)
      .replace(/\{accent\.hover\}/g, colors.accent.hover)
      .replace(/\{background\.page\}/g, colors.background.page)
      .replace(/\{background\.card\}/g, colors.background.card)
      .replace(/\{background\.muted\}/g, colors.background.muted)
      .replace(/\{text\.heading\}/g, colors.text.heading)
      .replace(/\{text\.body\}/g, colors.text.body)
      .replace(/\{text\.muted\}/g, colors.text.muted)
      .replace(/\{border\}/g, colors.border)
      .replace(/\{primary\}/g, colors.primary.base);
  };

  return `
## COMPONENT PATTERNS (Use these exact Tailwind classes)

### Page Layout
\`\`\`
Page wrapper: "${replaceTokens(components.pageWrapper)}"
Container: "${components.container}"
\`\`\`

### Cards
\`\`\`
Card: "${replaceTokens(components.card)}"
Card hover: "${replaceTokens(components.cardHover)}"
\`\`\`

### Buttons
\`\`\`
Primary button: "${replaceTokens(components.button.primary)}"
Secondary button: "${replaceTokens(components.button.secondary)}"
Ghost button: "${replaceTokens(components.button.ghost)}"
\`\`\`

### Form Elements
\`\`\`
Input field: "${replaceTokens(components.input)}"
\`\`\`

### List Items
\`\`\`
List item: "${replaceTokens(components.listItem)}"
\`\`\`
`;
}

/**
 * Builds the complete styling section of the system prompt based on user settings
 * @param {Object} options
 * @param {string} options.colorPaletteId - Selected color palette ID
 * @param {string} options.uiStyleId - Selected UI style ID
 * @param {string} options.wallpaperTheme - Current wallpaper theme key (for matchWallpaper)
 * @param {boolean} options.isDarkTheme - Whether current theme is dark
 * @returns {string} Formatted prompt section for styling
 */
export function buildStylePrompt({
  colorPaletteId = "matchWallpaper",
  uiStyleId = "glassmorphism",
  wallpaperTheme = "starry",
  isDarkTheme = true,
}) {
  let colors;
  let paletteName;

  // Get color palette
  if (colorPaletteId === "matchWallpaper") {
    colors = deriveColorsFromWallpaper(wallpaperTheme, isDarkTheme);
    paletteName = `${colors.themeName} (from wallpaper)`;
  } else {
    const palette = COLOR_PALETTES[colorPaletteId];
    if (palette && palette.colors) {
      colors = palette.colors;
      colors.isDark = palette.isDark;
      paletteName = palette.name;
    } else {
      // Fallback
      colors = deriveColorsFromWallpaper("starry", true);
      paletteName = "Default";
    }
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

## IMPORTANT INSTRUCTIONS

1. **Use the exact color classes** specified above (e.g., bg-${colors.primary.base}, text-${colors.text.heading})
2. **Follow the typography system** - use the correct text sizes and weights for each heading level
3. **Apply the UI style consistently** - ${style.name} style across all elements
4. **Use the component patterns** as templates - copy the class strings directly
5. **Maintain the theme mode** - This is a ${colors.isDark ? "DARK" : "LIGHT"} theme design
6. **Hero headers should use gradient text**: "bg-gradient-to-r from-${colors.primary.base} to-${colors.secondary.base} bg-clip-text text-transparent"

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
