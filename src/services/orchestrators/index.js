/**
 * Orchestrator System Exports
 *
 * Two-orchestrator architecture:
 * 1. PlanOrchestrator - Smart planning (greenfield + contextual modes)
 * 2. CodeOrchestrator - Smart coding (generate/modify/debug/refactor)
 *
 * Main entry point: orchestrator.js exports runOrchestrator()
 */

export { PlanOrchestrator } from './planOrchestrator.js';
export { CodeOrchestrator } from './codeOrchestrator.js';
export { scoreQuality } from './qualityScorer.js';

export default {
  PlanOrchestrator,
  CodeOrchestrator,
  scoreQuality
};
