/**
 * Prompt Loader
 * Loads externalized prompts from .agent-memory/prompts/ and replaces placeholders
 *
 * Features:
 * - Loads prompts from files (browser: localStorage, Node.js: filesystem)
 * - Template substitution ({{PLACEHOLDER}} → actual value)
 * - Caching for performance
 * - Fallback to inline prompts if file not found
 *
 * Pattern from: Priority 3 - Externalize Prompts
 */

import { MemoryBank } from '../memory/MemoryBank.js';

/**
 * Prompt Loader Class
 */
export class PromptLoader {
  constructor() {
    this.memory = new MemoryBank();
    this.cache = new Map();
    this.cacheEnabled = true;
  }

  /**
   * Load a prompt template from file
   * @param {string} promptName - Name of prompt file (e.g., 'planner', 'codewriter-generate')
   * @param {Object} replacements - Key-value pairs for template substitution
   * @param {string} fallback - Fallback prompt if file not found
   * @returns {Promise<string>} Processed prompt
   */
  async loadPrompt(promptName, replacements = {}, fallback = '') {
    try {
      // Check cache first
      const cacheKey = `${promptName}:${JSON.stringify(Object.keys(replacements).sort())}`;
      if (this.cacheEnabled && this.cache.has(cacheKey)) {
        const template = this.cache.get(cacheKey);
        return this.replacePlaceholders(template, replacements);
      }

      // Load prompt file
      const template = await this.memory.storage.read(`prompts/${promptName}.md`, fallback);

      if (!template || template === fallback) {
        console.warn(`Prompt file not found: prompts/${promptName}.md, using fallback`);
        return fallback;
      }

      // Cache the template
      if (this.cacheEnabled) {
        this.cache.set(cacheKey, template);
      }

      // Replace placeholders
      return this.replacePlaceholders(template, replacements);

    } catch (error) {
      console.error(`Error loading prompt ${promptName}:`, error);
      return fallback;
    }
  }

  /**
   * Replace placeholders in template
   * @param {string} template - Template string with {{PLACEHOLDERS}}
   * @param {Object} replacements - Key-value pairs
   * @returns {string} Processed string
   */
  replacePlaceholders(template, replacements) {
    let result = template;

    // Replace each placeholder
    for (const [key, value] of Object.entries(replacements)) {
      const placeholder = `{{${key}}}`;
      const replacement = value !== null && value !== undefined ? String(value) : '';
      result = result.split(placeholder).join(replacement);
    }

    // Remove any remaining unmatched placeholders (optional)
    // Uncomment if you want to remove {{UNMATCHED}} placeholders:
    // result = result.replace(/\{\{[A-Z_]+\}\}/g, '');

    return result;
  }

  /**
   * Load planner prompt with standard replacements
   * @param {Object} options - Planner-specific options
   * @returns {Promise<string>}
   */
  async loadPlannerPrompt(options = {}) {
    const {
      persistentRules = '',
      filesContext = '',
      analysisContext = '',
      analysisResult = null
    } = options;

    // Dynamic imports from promptTemplates
    const {
      THINKING_FRAMEWORK = '',
      UNIVERSAL_UX_PRINCIPLES = '',
      FOLDER_STRUCTURE_REQUIREMENTS = '',
      PRE_CHECK_INSTRUCTIONS = '',
      COMPONENT_GRANULARITY = '',
      IMPORT_RESOLUTION_RULES = '',
      FILE_NAMING_CONVENTIONS = '',
      DETAILED_PLANNING_GUIDANCE = ''
    } = await this.loadPromptTemplates();

    const replacements = {
      PERSISTENT_RULES: persistentRules,
      FILES_CONTEXT: filesContext,
      ANALYSIS_CONTEXT: analysisContext,
      THINKING_FRAMEWORK,
      UNIVERSAL_UX_PRINCIPLES,
      FOLDER_STRUCTURE_REQUIREMENTS,
      PRE_CHECK_INSTRUCTIONS,
      COMPONENT_GRANULARITY,
      IMPORT_RESOLUTION_RULES,
      FILE_NAMING_CONVENTIONS,
      DETAILED_PLANNING_GUIDANCE,
      ANALYSIS_INSTRUCTION: analysisResult ? '\n- **Use the analysis result** to determine which files to modify' : ''
    };

    return await this.loadPrompt('planner', replacements, this.getDefaultPlannerPrompt());
  }

  /**
   * Load code writer prompt (generate mode)
   * @param {Object} options - CodeWriter-specific options
   * @returns {Promise<string>}
   */
  async loadCodeWriterGeneratePrompt(options = {}) {
    const {
      persistentRules = '',
      filename = '',
      purpose = '',
      uxDesign = '',
      architecture = '',
      features = '',
      dependencies = ''
    } = options;

    const templates = await this.loadPromptTemplates();

    const replacements = {
      PERSISTENT_RULES: persistentRules,
      FILENAME: filename,
      PURPOSE: purpose,
      UX_DESIGN: uxDesign,
      ARCHITECTURE: architecture,
      FEATURES: features,
      DEPENDENCIES: dependencies,
      PACKAGE_MANAGEMENT_RULES: templates.PACKAGE_MANAGEMENT_RULES || '',
      NO_INITIALIZATION_CODE: templates.NO_INITIALIZATION_CODE || '',
      SANDPACK_NAVIGATION_RULES: templates.SANDPACK_NAVIGATION_RULES || '',
      RAW_CODE_OUTPUT_ONLY: templates.RAW_CODE_OUTPUT_ONLY || '',
      THINKING_FRAMEWORK: templates.THINKING_FRAMEWORK || '',
      CODE_FORMATTING_STANDARDS: templates.CODE_FORMATTING_STANDARDS || '',
      MODERN_UI_STANDARDS: templates.MODERN_UI_STANDARDS || '',
      FOLDER_STRUCTURE_REQUIREMENTS: templates.FOLDER_STRUCTURE_REQUIREMENTS || '',
      PRE_CHECK_INSTRUCTIONS: templates.PRE_CHECK_INSTRUCTIONS || '',
      COMPLETENESS_PRINCIPLES: templates.COMPLETENESS_PRINCIPLES || '',
      SIMPLICITY_GUIDELINES: templates.SIMPLICITY_GUIDELINES || '',
      IMPORT_RESOLUTION_RULES: templates.IMPORT_RESOLUTION_RULES || '',
      COMPONENT_GRANULARITY: templates.COMPONENT_GRANULARITY || '',
      SINGLE_FILE_OUTPUT_ONLY: templates.SINGLE_FILE_OUTPUT_ONLY || ''
    };

    return await this.loadPrompt('codewriter-generate', replacements, '');
  }

  /**
   * Load code writer prompt (modify mode)
   * @param {Object} options - Modify-specific options
   * @returns {Promise<string>}
   */
  async loadCodeWriterModifyPrompt(options = {}) {
    const {
      persistentRules = '',
      colorContext = '',
      changeTargets = ''
    } = options;

    const templates = await this.loadPromptTemplates();

    const replacements = {
      PERSISTENT_RULES: persistentRules,
      COLOR_CONTEXT: colorContext,
      CHANGE_TARGETS: changeTargets,
      PACKAGE_MANAGEMENT_RULES: templates.PACKAGE_MANAGEMENT_RULES || '',
      NO_INITIALIZATION_CODE: templates.NO_INITIALIZATION_CODE || '',
      SANDPACK_NAVIGATION_RULES: templates.SANDPACK_NAVIGATION_RULES || '',
      RAW_CODE_OUTPUT_ONLY: templates.RAW_CODE_OUTPUT_ONLY || '',
      THINKING_FRAMEWORK: templates.THINKING_FRAMEWORK || '',
      CODE_FORMATTING_STANDARDS: templates.CODE_FORMATTING_STANDARDS || '',
      MODERN_UI_STANDARDS: templates.MODERN_UI_STANDARDS || '',
      PRE_CHECK_INSTRUCTIONS: templates.PRE_CHECK_INSTRUCTIONS || '',
      COMPLETENESS_PRINCIPLES: templates.COMPLETENESS_PRINCIPLES || '',
      SIMPLICITY_GUIDELINES: templates.SIMPLICITY_GUIDELINES || '',
      IMPORT_RESOLUTION_RULES: templates.IMPORT_RESOLUTION_RULES || ''
    };

    return await this.loadPrompt('codewriter-modify', replacements, '');
  }

  /**
   * Load prompt templates (shared snippets)
   * This loads from promptTemplates.js as fallback
   * @returns {Promise<Object>}
   */
  async loadPromptTemplates() {
    try {
      const module = await import('../../promptTemplates.js');
      return module;
    } catch (error) {
      console.error('Failed to load prompt templates:', error);
      return {};
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Disable caching (for development/testing)
   */
  disableCache() {
    this.cacheEnabled = false;
    this.cache.clear();
  }

  /**
   * Enable caching
   */
  enableCache() {
    this.cacheEnabled = true;
  }

  /**
   * Get default planner prompt (fallback)
   * @returns {string}
   */
  getDefaultPlannerPrompt() {
    return `You are a planning agent for React development.
Create a detailed plan based on the user request.
Respond with a JSON object containing steps, filesToCreate, and fileDetails.`;
  }

  /**
   * Get default designer prompt (fallback)
   * @returns {string}
   */
  getDefaultDesignerPrompt() {
    return `# Designer Agent System Prompt

You are a world-class UX/UI design specialist. Create visually striking, modern designs that users will remember.

## DESIGN PHILOSOPHY:

Draw inspiration from modern apps like Linear, Notion, Stripe, and Figma. Your designs should be bold and engaging, not generic.

## MANDATORY REQUIREMENTS FOR ALL DESIGNS:

1. Background MUST be a gradient (never plain solid colors)
2. Surface MUST include at least one: backdrop-blur, shadow-xl, or gradient
3. Shadows MUST be "heavy" or "moderate" (never subtle/none)
4. Colors MUST be unique (avoid basic Tailwind defaults like blue-500)
5. Design MUST have visual depth (layering, shadows, blur effects)

{{USER_REQUEST}}

{{APP_IDENTITY}}

{{MODE_INSTRUCTIONS}}

Please propose 1-2 distinct design directions. Each must meet the requirements above.

## RESPONSE FORMAT:

Respond ONLY with JSON in this format:

\`\`\`json
{
  "designDirections": [
    {
      "directionName": "A descriptive name for the design direction",
      "appIdentity": {
        "name": "Creative and relevant app name",
        "tagline": "A compelling tagline for the app",
        "tone": "professional | playful | motivational | minimal"
      },
      "colorScheme": {
        "theme": "dark" | "light",
        "background": "MUST be a gradient",
        "primary": "Unique, vibrant color",
        "secondary": "Complementary color",
        "accent": "Bold accent color",
        "text": {
          "primary": "High contrast text color",
          "secondary": "Medium contrast",
          "muted": "Low contrast"
        },
        "surface": "MUST include: backdrop-blur OR shadow-xl OR gradient",
        "border": "Subtle border color"
      },
      "designStyle": {
        "aesthetic": "glassmorphism | gradient-heavy | neumorphism",
        "corners": "rounded-xl | rounded-2xl",
        "shadows": "heavy | moderate",
        "effects": "MUST include: gradients, backdrop-blur, smooth transitions, or glow effects",
        "styleRationale": "Why this design is visually striking"
      },
      "uxPatterns": {
        "userFeedback": "How to show action results",
        "informationArchitecture": "How to organize content",
        "emptyStates": "What to show when no data",
        "microInteractions": "Hover effects and transitions"
      },
      "layoutStructure": {
        "containerStyle": "Container styling approach",
        "spacing": "Spacing system",
        "typography": "Typography scale",
        "responsive": "Mobile-first breakpoints"
      }
    }
  ]
}
\`\`\``;
  }

  /**
   * Preload common prompts (optimization)
   */
  async preloadCommonPrompts() {
    await Promise.all([
      this.loadPrompt('planner', {}, this.getDefaultPlannerPrompt()),
      this.loadPrompt('codewriter-generate', {}, ''),
      this.loadPrompt('codewriter-modify', {}, '')
    ]);
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      enabled: this.cacheEnabled,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * Singleton instance
 */
let loaderInstance = null;

/**
 * Get singleton instance of PromptLoader
 * @returns {PromptLoader}
 */
export function getPromptLoader() {
  if (!loaderInstance) {
    loaderInstance = new PromptLoader();
  }
  return loaderInstance;
}

export default PromptLoader;
