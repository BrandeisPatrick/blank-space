import { callLLMForJSON } from "../utils/llmClient.js";
import { MODELS } from "../config/modelConfig.js";
import compressedPrompts from "../compressedPrompts.json" with { type: "json" };

/**
 * UX Design Agent
 * Specialized agent for creating visual design systems and UX patterns
 * Handles color schemes, layout structures, and interaction patterns
 */

/**
 * Generate UX design for a new application
 * @param {Object} options - Design options
 * @param {Object} options.appIdentity - App name, tagline, tone from planner
 * @param {string} options.userRequest - Original user request
 * @param {string} options.mode - 'create_new' | 'redesign'
 * @param {Object} [options.currentStyles] - Existing styles for redesign mode
 * @returns {Promise<Object>} UX design specification
 */
export async function designUX({ appIdentity, userRequest, mode = 'create_new', currentStyles = null }) {
  const isRedesign = mode === 'redesign' && currentStyles;

  const systemPrompt = `You are a UX/UI design specialist for React applications.
Your job is to create cohesive, beautiful design systems with:
- Color schemes (theme, primary, secondary, accent colors)
- Design styles (aesthetic, corners, shadows, effects)
- UX patterns (user feedback, empty states, micro-interactions)
- Layout structures (container style, spacing, typography)

${compressedPrompts.MODERN_UI_COMPRESSED}

${compressedPrompts.UNIVERSAL_UX_COMPRESSED}

${isRedesign ? `CURRENT STYLES TO EVOLVE:\n${JSON.stringify(currentStyles, null, 2)}\n\nEvolve these styles based on the user's request while maintaining some consistency.` : ''}

🎨 DESIGN REQUIREMENTS:
1. **Bold & Memorable**: Use 3+ distinct colors (NOT monochrome)
2. **Modern**: Glassmorphism, gradients, glows
3. **Consistent**: All components use the same color palette
4. **Accessible**: Readable text, good contrast
5. **Unique**: App name should be creative (NOT generic)

Respond ONLY with JSON in this format:
{
  "appIdentity": {
    "name": "Creative app name (NOT generic)",
    "tagline": "Compelling tagline",
    "tone": "professional | playful | motivational | minimal"
  },
  "colorScheme": {
    "theme": "dark" | "light",
    "background": "bg-gradient-to-br from-[color] via-[color] to-[color]",
    "primary": "color-500",
    "secondary": "color-500",
    "accent": "color-400",
    "text": {
      "primary": "color for headings",
      "secondary": "color for body",
      "muted": "color for subtle text"
    },
    "surface": "bg-color for cards/containers",
    "border": "border-color"
  },
  "designStyle": {
    "aesthetic": "glassmorphism | minimalist | gradient-heavy | neumorphism",
    "corners": "rounded-xl | rounded-2xl | rounded-lg",
    "shadows": "heavy | moderate | subtle",
    "effects": "backdrop-blur, glows, animations",
    "styleRationale": "Why this style fits"
  },
  "uxPatterns": {
    "userFeedback": "How to show action results (toasts, messages)",
    "informationArchitecture": "How to organize content (sections, groups)",
    "emptyStates": "What to show when no data",
    "microInteractions": "Hover effects, transitions",
    "visualIndicators": "Count badges, progress, status"
  },
  "layoutStructure": {
    "containerStyle": "Glassmorphism card with backdrop-blur",
    "spacing": "gap-6 for sections, gap-3 for items",
    "typography": "text sizes and weights",
    "responsive": "Mobile-first breakpoints"
  }
}`;

  const userPrompt = isRedesign
    ? `Redesign the UI based on: "${userRequest}"\n\nCurrent app: ${appIdentity?.name || 'Existing app'}\n\nEvolve the current design while respecting the user's new direction.`
    : `Design a beautiful, modern UI for: "${userRequest}"\n\n${appIdentity ? `App Identity Guidance:\n- Name: ${appIdentity.name}\n- Tagline: ${appIdentity.tagline}\n- Tone: ${appIdentity.tone}` : 'Create a unique app identity.'}\n\nCreate a cohesive design system with bold colors and modern patterns.`;

  try {
    const design = await callLLMForJSON({
      model: MODELS.ANALYZER, // Use lighter model for design (gpt-5-nano)
      systemPrompt,
      userPrompt,
      maxTokens: 6000,  // Increased for GPT-5-nano reasoning tokens + output
      temperature: 0.8 // Higher temperature for creative designs
    });

    return {
      ...design,
      metadata: {
        createdAt: new Date().toISOString(),
        mode,
        sourceRequest: userRequest
      }
    };
  } catch (error) {
    console.error("UX design error:", error);
    // Fallback to default modern dark theme
    return {
      appIdentity: appIdentity || {
        name: "Modern App",
        tagline: "A beautiful experience",
        tone: "professional"
      },
      colorScheme: {
        theme: "dark",
        background: "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
        primary: "cyan-400",
        secondary: "purple-500",
        accent: "indigo-500",
        text: {
          primary: "text-gray-100",
          secondary: "text-gray-300",
          muted: "text-gray-400"
        },
        surface: "bg-slate-800/40",
        border: "border-slate-700/50"
      },
      designStyle: {
        aesthetic: "glassmorphism",
        corners: "rounded-2xl",
        shadows: "heavy",
        effects: "backdrop-blur-xl, shadow glows",
        styleRationale: "Modern, polished, professional"
      },
      uxPatterns: {
        userFeedback: "Toast notifications for actions",
        informationArchitecture: "Sections with count badges",
        emptyStates: "Helpful messages with call-to-action",
        microInteractions: "Smooth transitions, hover effects",
        visualIndicators: "Count badges, status icons"
      },
      layoutStructure: {
        containerStyle: "bg-slate-800/40 backdrop-blur-xl border border-slate-700/50",
        spacing: "gap-6 sections, gap-3 items",
        typography: "text-5xl bold headings, text-base body",
        responsive: "Mobile-first with md/lg breakpoints"
      },
      metadata: {
        createdAt: new Date().toISOString(),
        mode,
        sourceRequest: userRequest,
        fallback: true
      }
    };
  }
}

/**
 * Extract UX design from existing code
 * Analyzes current files to identify existing design patterns
 * @param {Object} currentFiles - Map of filename to code
 * @returns {Object} Extracted UX design
 */
export function extractUXFromCode(currentFiles) {
  const allCode = Object.values(currentFiles).join('\n');

  // Extract color patterns
  const bgColors = [...new Set(allCode.match(/bg-[\w-]+/g) || [])];
  const textColors = [...new Set(allCode.match(/text-[\w-]+/g) || [])];
  const borderColors = [...new Set(allCode.match(/border-[\w-]+/g) || [])];
  const shadows = [...new Set(allCode.match(/shadow-[\w-]+/g) || [])];

  // Determine theme
  const isDark = bgColors.some(c => c.includes('slate-900') || c.includes('gray-900') || c.includes('zinc-900'));

  // Extract rounded corners
  const corners = [...new Set(allCode.match(/rounded-[\w-]+/g) || [])];
  const mostCommonCorner = corners[0] || 'rounded-xl';

  // Extract spacing patterns
  const gaps = [...new Set(allCode.match(/gap-\d+/g) || [])];
  const padding = [...new Set(allCode.match(/p-\d+|px-\d+|py-\d+/g) || [])];

  return {
    appIdentity: {
      name: "Existing App",
      tagline: "Maintaining current design",
      tone: "professional"
    },
    colorScheme: {
      theme: isDark ? "dark" : "light",
      background: bgColors[0] || "bg-slate-900",
      primary: textColors.find(c => !c.includes('gray') && !c.includes('slate') && !c.includes('white')) || "cyan-400",
      secondary: textColors[1] || "purple-500",
      accent: textColors[2] || "indigo-500",
      text: {
        primary: isDark ? "text-gray-100" : "text-gray-900",
        secondary: isDark ? "text-gray-300" : "text-gray-700",
        muted: isDark ? "text-gray-400" : "text-gray-500"
      },
      surface: bgColors[1] || (isDark ? "bg-slate-800/40" : "bg-white"),
      border: borderColors[0] || (isDark ? "border-slate-700/50" : "border-gray-200")
    },
    designStyle: {
      aesthetic: allCode.includes('backdrop-blur') ? "glassmorphism" : "minimalist",
      corners: mostCommonCorner,
      shadows: shadows.length > 0 ? "moderate" : "subtle",
      effects: allCode.includes('backdrop-blur') ? "backdrop-blur" : "none",
      styleRationale: "Extracted from existing code"
    },
    uxPatterns: {
      userFeedback: "Standard notifications",
      informationArchitecture: "Existing structure",
      emptyStates: "Existing patterns",
      microInteractions: allCode.includes('transition') ? "Smooth transitions" : "Basic",
      visualIndicators: "Existing indicators"
    },
    layoutStructure: {
      containerStyle: "Existing container style",
      spacing: gaps[0] || "gap-6",
      typography: "Existing typography",
      responsive: "Existing responsive patterns"
    },
    metadata: {
      createdAt: new Date().toISOString(),
      mode: 'extracted',
      sourceRequest: 'Extracted from existing code'
    }
  };
}

export default {
  designUX,
  extractUXFromCode
};
