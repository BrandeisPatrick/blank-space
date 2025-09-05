#!/usr/bin/env node

// This is the main CLI entry point that uses the CLI interface layer
// but can be customized for the integrated system

import { CLIConfigManager } from '@ui-grid-ai/cli-interface';

// Re-export the CLI from cli-interface with any system-specific customizations
export async function runCLI() {
  // Import dynamically to avoid circular dependencies
  const { main } = await import('@ui-grid-ai/cli-interface');
  return main();
}

// If this file is run directly, execute the CLI
if (require.main === module) {
  runCLI().catch((error) => {
    console.error('Failed to start AI Coding System CLI:', error);
    process.exit(1);
  });
}