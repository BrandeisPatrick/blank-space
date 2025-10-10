/**
 * Centralized Model Configuration
 *
 * Defines which LLM models to use for different agent tasks.
 * Can be overridden with environment variables for flexibility.
 */

/**
 * Model Selection Strategy:
 *
 * - gpt-4o: Production code generation (highest quality)
 * - gpt-5-mini: Complex planning and reasoning
 * - gpt-4o-mini: Simple tasks (cost-effective)
 * - o1: Advanced reasoning (optional, slower but more thorough)
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
  // Code generation - needs highest quality output
  GENERATOR: getEnv("MODEL_GENERATOR") || "gpt-4o",

  // Code modification - needs precision and quality
  MODIFIER: getEnv("MODEL_MODIFIER") || "gpt-4o",

  // Planning - complex reasoning, architectural decisions
  // Note: GPT-5 doesn't support temperature control (fixed at 1.0) which makes
  // it unreliable for structured JSON output. Using GPT-4o for better consistency.
  PLANNER: getEnv("MODEL_PLANNER") || "gpt-4o",

  // Intent classification - simple task
  INTENT_CLASSIFIER: getEnv("MODEL_INTENT_CLASSIFIER") || "gpt-4o-mini",

  // Codebase analysis - pattern matching
  ANALYZER: getEnv("MODEL_ANALYZER") || "gpt-4o-mini",
};

/**
 * Production mode - uses best models for all tasks
 * Set PRODUCTION_MODE=true to enable
 */
const PRODUCTION_MODE = getEnv("PRODUCTION_MODE") === "true";

if (PRODUCTION_MODE) {
  MODEL_CONFIGS.GENERATOR = "gpt-4o";
  MODEL_CONFIGS.MODIFIER = "gpt-4o";
  MODEL_CONFIGS.PLANNER = "gpt-5-mini";
  MODEL_CONFIGS.INTENT_CLASSIFIER = "gpt-4o";
  MODEL_CONFIGS.ANALYZER = "gpt-4o";
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
  console.log(`Intent Classifier: ${MODEL_CONFIGS.INTENT_CLASSIFIER}`);
  console.log(`Analyzer:          ${MODEL_CONFIGS.ANALYZER}`);
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
