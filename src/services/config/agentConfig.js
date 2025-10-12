/**
 * Agent Configuration
 * Global settings for agent behavior
 * Can be modified at runtime to adjust agent features
 */

export const agentConfig = {
  // Enable/disable agent consultations
  consultationsEnabled: true,

  // Enable/disable reflection loops
  reflectionEnabled: true,

  // Max reflection iterations
  maxReflectionIterations: 2,

  // Quality threshold for approval
  qualityThreshold: 75,

  // Enable/disable smart routing
  smartRoutingEnabled: true,

  // LLM call settings
  llm: {
    maxRetries: 3,
    timeout: 60000, // 60 seconds
    baseDelay: 1000 // For exponential backoff
  }
};

/**
 * Update agent configuration at runtime
 * @param {Object} updates - Configuration updates
 */
export function updateAgentConfig(updates) {
  Object.assign(agentConfig, updates);
}

/**
 * Get current configuration
 * @returns {Object} Current configuration
 */
export function getAgentConfig() {
  return { ...agentConfig };
}

export default agentConfig;
