import { callLLMForJSON } from "../utils/llm/llmClient.js";
import { MODELS } from "../config/modelConfig.js";
import { getPromptLoader } from "../utils/prompts/PromptLoader.js";
import { extractColorScheme } from "../utils/code/colorExtractor.js";

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
 * @param {ConversationLogger} [options.logger=null] - Optional conversation logger
 * @returns {Promise<Object>} UX design specification
 */
export async function designUX({ appIdentity, userRequest, mode = 'create_new', currentStyles = null, logger = null }) {
  const isRedesign = mode === 'redesign' && currentStyles;

  // Load externalized prompt using PromptLoader
  const promptLoader = getPromptLoader();
  const modeInstructions = isRedesign
    ? `You are redesigning based on: "${userRequest}"\n\nCurrent app: ${appIdentity?.name || 'Existing app'}\n\nEvolve the current design while respecting the user's new direction.`
    : `Design a visually striking UI for: "${userRequest}"\n\n${appIdentity ? `App Identity Guidance:\n- Name: ${appIdentity.name}\n- Tagline: ${appIdentity.tagline}\n- Tone: ${appIdentity.tone}` : 'Create a unique app identity.'}\n\nCreate a bold, memorable design with gradients, unique colors, and modern effects. This should stand out, not blend in.`;

  const appIdentityContext = appIdentity ? `\nApp Identity:\n- Name: ${appIdentity.name}\n- Tagline: ${appIdentity.tagline}\n- Tone: ${appIdentity.tone}` : '';

  const systemPrompt = await promptLoader.loadPrompt('designer', {
    USER_REQUEST: userRequest,
    APP_IDENTITY: appIdentityContext,
    MODE_INSTRUCTIONS: modeInstructions
  }, promptLoader.getDefaultDesignerPrompt());

  // Simple user prompt - details are in system prompt via MODE_INSTRUCTIONS
  const userPrompt = `Create ${isRedesign ? 'redesigned' : 'new'} UX design for: "${userRequest}"`;

  try {
    const design = await callLLMForJSON({
      model: MODELS.ANALYZER, // Use lighter model for design (gpt-5-nano)
      systemPrompt,
      userPrompt,
      maxTokens: 6000,  // Increased for GPT-5-nano reasoning tokens + output
      temperature: 0.85, // Higher temperature for more creative designs
      logger
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
    // Fallback to a modern glassmorphic theme (NOT boring gray)
    return {
      designDirections: [{
        directionName: "Modern Glassmorphic",
        appIdentity: appIdentity || {
          name: "Modern App",
          tagline: "A beautiful and intuitive experience",
          tone: "professional"
        },
        colorScheme: {
          theme: "dark",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          primary: "#8b5cf6",
          secondary: "#ec4899",
          accent: "#f59e0b",
          text: {
            primary: "text-white",
            secondary: "text-gray-200",
            muted: "text-gray-400"
          },
          surface: "bg-white/10 backdrop-blur-xl border border-white/20",
          border: "border-white/10"
        },
        designStyle: {
          aesthetic: "glassmorphism",
          corners: "rounded-2xl",
          shadows: "heavy",
          effects: "backdrop-blur-xl, smooth transitions, gradient overlays, glow effects",
          styleRationale: "Modern glassmorphic design with depth, gradients, and visual interest. Uses purple gradient background with translucent glass-effect cards."
        },
        uxPatterns: {
          userFeedback: "Toast notifications with slide-in animations",
          informationArchitecture: "Grouped sections with count badges and visual separators",
          emptyStates: "Encouraging messages with call-to-action buttons",
          microInteractions: "Smooth hover effects, scale transforms, color transitions"
        },
        layoutStructure: {
          containerStyle: "bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20",
          spacing: "gap-8 sections, gap-4 items",
          typography: "text-5xl font-bold headings, text-lg body",
          responsive: "Mobile-first with smooth breakpoints"
        }
      }],
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

  // Extract color patterns using shared utility
  const colorScheme = extractColorScheme(allCode);

  // Parse extracted colors for theme detection
  const bgColors = colorScheme?.backgrounds ? colorScheme.backgrounds.split(', ') : [];
  const textColors = colorScheme?.textColors ? colorScheme.textColors.split(', ') : [];
  const borderColors = colorScheme?.borderColors ? colorScheme.borderColors.split(', ') : [];
  const shadows = colorScheme?.shadows ? colorScheme.shadows.split(', ') : [];

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
