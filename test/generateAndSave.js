/**
 * Generate App and Save Files
 * Creates an app and saves the generated files to src/
 */

import { runOrchestrator } from '../src/services/orchestrator.js';
import { createLogger } from '../src/services/utils/llm/conversationLogger.js';
import fs from 'fs';
import path from 'path';

console.log('\n🚀 Generating Todo App...\n');

const userMessage = "Create a simple todo app";
const currentFiles = {};

// Create logger
const logger = createLogger('app-generator', {
  enabled: true,
  logLevel: 'INFO'
});

try {
  // Run orchestrator
  const result = await runOrchestrator(userMessage, currentFiles, (update) => {
    console.log(`  [${update.type}] ${update.message}`);
  });

  console.log('\n✅ Generation complete!\n');
  console.log(`📊 Generated ${result.fileOperations?.length || 0} files\n`);

  // Save files to src/
  const srcDir = path.join(process.cwd(), 'src');

  for (const op of result.fileOperations) {
    const filePath = path.join(srcDir, op.filename);
    const fileDir = path.dirname(filePath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
      console.log(`📁 Created directory: ${path.relative(srcDir, fileDir)}`);
    }

    // Write file
    fs.writeFileSync(filePath, op.content, 'utf-8');
    console.log(`✅ Saved: ${op.filename} (${op.content.length} chars)`);
  }

  // Save conversation log
  const logPath = await logger.saveToFile();
  if (logPath) {
    console.log(`\n💾 Conversation log: ${logPath}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🎉 App ready! View it at: http://localhost:5173');
  console.log('='.repeat(70) + '\n');

} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
