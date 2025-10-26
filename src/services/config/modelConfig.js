/**
 * Centralized Model Configuration
 *
 * Defines which LLM models to use for different agent tasks.
 * Can be overridden with environment variables for flexibility.
 */

/**
 * Model Selection Strategy:
 *
 * - gpt-5-mini: Major agents (Generator, Modifier, Planner) - advanced reasoning and generation
 *   FALLBACK: gpt-4o if gpt-5-mini is not available
 * - gpt-5-nano: Lightweight agents (Analyzer, Intent Classifier) - fast, cost-effective tasks
 *   FALLBACK: gpt-4o-mini if gpt-5-nano is not available
 * - Production mode: Upgrades lightweight agents to gpt-5-mini for maximum quality
 */

// Helper to safely get environment variable (works in both Node.js and browser)
function getEnv(key) {
  // Browser environment (Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  // Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

/**
 * Model fallback mapping
 * Maps experimental GPT-5 models to known working fallbacks
 */
const MODEL_FALLBACKS = {
  "gpt-5-mini": "gpt-4o",
  "gpt-5-nano": "gpt-4o-mini"
};

/**
 * Check if we should use GPT-5 models or fallback to GPT-4
 * Set USE_GPT5=true to enable experimental GPT-5 models
 */
const USE_GPT5 = getEnv("USE_GPT5") === "true";

/**
 * Get model with fallback support
 * @param {string} preferredModel - The preferred model name
 * @returns {string} The model to use (either preferred or fallback)
 */
function getModelWithFallback(preferredModel) {
  if (!USE_GPT5 && MODEL_FALLBACKS[preferredModel]) {
    return MODEL_FALLBACKS[preferredModel];
  }
  return preferredModel;
}

const MODEL_CONFIGS = {
  // Planning - using GPT-5-mini for complex reasoning (fallback: gpt-4o)
  PLANNER: getModelWithFallback(getEnv("MODEL_PLANNER") || "gpt-5-mini"),

  // Codebase analysis - using gpt-5-nano for lightweight tasks (fallback: gpt-4o-mini)
  ANALYZER: getModelWithFallback(getEnv("MODEL_ANALYZER") || "gpt-5-nano"),

  // Code writing (replaces GENERATOR + MODIFIER) - using GPT-5-mini for precision (fallback: gpt-4o)
  CODE_WRITER: getModelWithFallback(getEnv("MODEL_CODE_WRITER") || "gpt-5-mini"),

  // Design - using gpt-5-nano for lightweight design tasks (fallback: gpt-4o-mini)
  DESIGNER: getModelWithFallback(getEnv("MODEL_DESIGNER") || "gpt-5-nano"),

  // Debugging - using gpt-5-mini for accurate bug detection (fallback: gpt-4o)
  DEBUGGER: getModelWithFallback(getEnv("MODEL_DEBUGGER") || "gpt-5-mini"),

  // Legacy support (deprecated - use CODE_WRITER instead)
  GENERATOR: getModelWithFallback(getEnv("MODEL_GENERATOR") || "gpt-5-mini"),
  MODIFIER: getModelWithFallback(getEnv("MODEL_MODIFIER") || "gpt-5-mini"),
};

/**
 * Production mode - uses premium models for all tasks
 * Set PRODUCTION_MODE=true to enable (upgrades lighter agents)
 * Note: Major agents already use gpt-5-mini (or gpt-4o fallback) by default
 */
const PRODUCTION_MODE = getEnv("PRODUCTION_MODE") === "true";

if (PRODUCTION_MODE) {
  // Major agents already use gpt-5-mini by default, no need to override
  // Only upgrade lighter agents to more powerful models in production
  const productionModel = getModelWithFallback("gpt-5-mini");
  MODEL_CONFIGS.INTENT_CLASSIFIER = productionModel;
  MODEL_CONFIGS.ANALYZER = productionModel;
  MODEL_CONFIGS.REVIEWER = productionModel;
  MODEL_CONFIGS.PLAN_REVIEWER = productionModel;
}

/**
 * Get model for a specific agent
 * @param {string} agentName - Name of the agent (generator, planner, etc.)
 * @returns {string} Model identifier
 */
export function getModel(agentName) {
  const configKey = agentName.toUpperCase().replace("-", "_");
  return MODEL_CONFIGS[configKey] || "gpt-4o-mini";
}

/**
 * Get all model configurations
 * @returns {Object} All model configurations
 */
export function getAllModels() {
  return { ...MODEL_CONFIGS };
}

/**
 * Log current model configuration
 */
export function logModelConfig() {
  console.log("\n🤖 Current Model Configuration (6-Agent System):");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Planner:           ${MODEL_CONFIGS.PLANNER}`);
  console.log(`Analyzer:          ${MODEL_CONFIGS.ANALYZER}`);
  console.log(`Code Writer:       ${MODEL_CONFIGS.CODE_WRITER}`);
  console.log(`Designer:          ${MODEL_CONFIGS.DESIGNER}`);
  console.log(`Debugger:          ${MODEL_CONFIGS.DEBUGGER}`);
  console.log(`Validator:         (no LLM - rule-based)`);
  console.log(`Production Mode:   ${PRODUCTION_MODE ? "✅ Enabled" : "❌ Disabled"}`);
  console.log(`GPT-5 Mode:        ${USE_GPT5 ? "✅ Enabled" : "❌ Disabled (using GPT-4 fallbacks)"}`);
  if (!USE_GPT5) {
    console.log(`⚠️  Note: Using GPT-4 fallbacks. Set USE_GPT5=true to use experimental GPT-5 models.`);
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// Export individual model configs
export const MODELS = MODEL_CONFIGS;

// Default export
export default {
  getModel,
  getAllModels,
  logModelConfig,
  MODELS,
  PRODUCTION_MODE
};
