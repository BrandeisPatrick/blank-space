// Main exports
export { FrameworkAdvisor } from './analyzers/framework-advisor';
export { PromptAnalyzer } from './analyzers/prompt-analyzer';
export { ScoringEngine } from './analyzers/scoring-engine';

// Types
export * from './types';

// Utilities
export { FRAMEWORKS, getFrameworkById, getFrameworksByCategory, searchFrameworks } from './utils/frameworks';

// Import for default export
import { FrameworkAdvisor } from './analyzers/framework-advisor';

// Create a simple factory function for ease of use
export function createFrameworkAdvisor(config?: any) {
  return new FrameworkAdvisor(config);
}

// Default export for convenience
export default FrameworkAdvisor;