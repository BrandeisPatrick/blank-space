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
 * - gpt-5-nano: Lightweight agents (Analyzer, Intent Classifier) - fast, cost-effective tasks
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

const MODEL_CONFIGS = {
  // Code generation - using GPT-5-mini for advanced capabilities
  GENERATOR: getEnv("MODEL_GENERATOR") || "gpt-5-mini",

  // Code modification - using GPT-5-mini for precision
  MODIFIER: getEnv("MODEL_MODIFIER") || "gpt-5-mini",

  // Planning - using GPT-5-mini for complex reasoning
  PLANNER: getEnv("MODEL_PLANNER") || "gpt-5-mini",

  // Intent classification - using gpt-4o-mini for fast, reliable classification
  INTENT_CLASSIFIER: getEnv("MODEL_INTENT_CLASSIFIER") || "gpt-4o-mini",

  // Codebase analysis - using gpt-5-nano for lightweight tasks
  ANALYZER: getEnv("MODEL_ANALYZER") || "gpt-5-nano",

  // Code review - using gpt-5-nano for quality checking
  REVIEWER: getEnv("MODEL_REVIEWER") || "gpt-5-nano",

  // Plan review - using gpt-5-nano for plan quality checking
  PLAN_REVIEWER: getEnv("MODEL_PLAN_REVIEWER") || "gpt-5-nano",

  // Debugging - using gpt-5-mini for accurate bug detection
  DEBUGGER: getEnv("MODEL_DEBUGGER") || "gpt-5-mini",
};

/**
 * Production mode - uses premium models for all tasks
 * Set PRODUCTION_MODE=true to enable (upgrades lighter agents)
 * Note: Major agents already use gpt-5-mini by default
 */
const PRODUCTION_MODE = getEnv("PRODUCTION_MODE") === "true";

if (PRODUCTION_MODE) {
  // Major agents already use gpt-5-mini by default, no need to override
  // Only upgrade lighter agents to more powerful models in production
  MODEL_CONFIGS.INTENT_CLASSIFIER = "gpt-5-mini";
  MODEL_CONFIGS.ANALYZER = "gpt-5-mini";
  MODEL_CONFIGS.REVIEWER = "gpt-5-mini";
  MODEL_CONFIGS.PLAN_REVIEWER = "gpt-5-mini";
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
  console.log("\n🤖 Current Model Configuration:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Generator:         ${MODEL_CONFIGS.GENERATOR}`);
  console.log(`Modifier:          ${MODEL_CONFIGS.MODIFIER}`);
  console.log(`Planner:           ${MODEL_CONFIGS.PLANNER}`);
  console.log(`Debugger:          ${MODEL_CONFIGS.DEBUGGER}`);
  console.log(`Intent Classifier: ${MODEL_CONFIGS.INTENT_CLASSIFIER}`);
  console.log(`Analyzer:          ${MODEL_CONFIGS.ANALYZER}`);
  console.log(`Reviewer:          ${MODEL_CONFIGS.REVIEWER}`);
  console.log(`Plan Reviewer:     ${MODEL_CONFIGS.PLAN_REVIEWER}`);
  console.log(`Production Mode:   ${PRODUCTION_MODE ? "✅ Enabled" : "❌ Disabled"}`);
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
