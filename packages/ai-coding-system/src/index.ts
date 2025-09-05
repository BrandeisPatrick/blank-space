// Main integration layer - exports everything in a unified interface

// Core engine layer
export * from '@ui-grid-ai/agent-engine';

// ReAct reasoning layer  
export * from '@ui-grid-ai/react-reasoning';

// CLI interface layer
export * from '@ui-grid-ai/cli-interface';

// Legacy agents with adapters
export * from '@ui-grid-ai/ai-agents';

// Unified system factory
export { createAICodingSystem, AICodingSystemConfig } from './system';

// CLI entry point
export { runCLI } from './cli';