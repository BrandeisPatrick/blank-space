/**
 * Tool Orchestrator
 * Manages code generation using tool-based LLM orchestration
 *
 * This file now delegates to the new orchestration layer which supports
 * multiple LLM providers (OpenAI, Gemini). Kept for backwards compatibility.
 */

// Re-export processMessage from orchestration layer for backwards compatibility
export { processMessage } from "./orchestration/index.js";

// Default export also delegates to orchestration layer
import { processMessage as orchestrate } from "./orchestration/index.js";
export default { processMessage: orchestrate };
