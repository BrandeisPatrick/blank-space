import { classifyIntent } from './agents/intentClassifier.js';
import { createPlan } from './agents/planner.js';
import { analyzeCodebaseForModification } from './agents/analyzer.js';
import { generateCode } from './agents/generator.js';
import { modifyCode } from './agents/modifier.js';
import { debugAndFix } from './agents/debugger.js';
import { validateCrossFileConsistency } from './utils/crossFileValidation.js';

/**
 * Agent Orchestrator
 * Coordinates the multi-agent pipeline for code generation
 */
export class AgentOrchestrator {
  constructor(onUpdate) {
    this.onUpdate = onUpdate || (() => {}); // Callback for streaming updates to UI
  }

  /**
   * Main orchestration method
   * Runs the full agent pipeline
   */
  async processUserMessage(userMessage, currentFiles = {}) {
    // Track rate limit info from API responses
    let latestRateLimit = null;

    try {
      // Step 1: Classify Intent
      this.sendUpdate({
        type: 'thinking',
        content: 'Analyzing your request...'
      });

      const intentResult = await classifyIntent(userMessage);

      // Extract rate limit if available
      if (intentResult.rateLimit) {
        latestRateLimit = intentResult.rateLimit;
      }

      this.sendUpdate({
        type: 'intent',
        content: `Intent: ${intentResult.intent} (confidence: ${(intentResult.confidence * 100).toFixed(0)}%)`,
        data: intentResult
      });

      // Handle fix_bug intent separately
      if (intentResult.intent === 'fix_bug') {
        return await this.handleBugFix(userMessage, currentFiles);
      }

      // Step 2: Analyze Codebase (for modifications)
      let analysisResult = null;
      const isModificationIntent = ['modify_existing', 'style_change', 'add_feature'].includes(intentResult.intent);

      if (isModificationIntent && Object.keys(currentFiles).length > 0) {
        this.sendUpdate({
          type: 'thinking',
          content: 'Analyzing codebase to find what needs to change...'
        });

        analysisResult = await analyzeCodebaseForModification(userMessage, currentFiles);

        if (analysisResult.needsAnalysis && analysisResult.reasoning) {
          this.sendUpdate({
            type: 'intent',
            content: `Analysis: ${analysisResult.reasoning}`,
            data: analysisResult
          });
        }
      }

      // Step 3: Create Plan
      this.sendUpdate({
        type: 'thinking',
        content: 'Creating a plan...'
      });

      const plan = await createPlan(intentResult.intent, userMessage, currentFiles, analysisResult);

      this.sendUpdate({
        type: 'plan',
        content: plan.summary,
        data: plan
      });

      // Step 4: Execute Plan
      const fileOperations = [];

      // Handle file creation
      if (plan.filesToCreate && plan.filesToCreate.length > 0) {
        for (const filename of plan.filesToCreate) {
          this.sendUpdate({
            type: 'thinking',
            content: `Generating ${filename}...`
          });

          const code = await generateCode(plan, userMessage, filename);

          fileOperations.push({
            type: 'create',
            filename,
            content: code
          });

          this.sendUpdate({
            type: 'file_operation',
            content: `Created ${filename}`,
            data: { filename, operation: 'create' }
          });
        }
      }

      // Handle file modification
      if (plan.filesToModify && plan.filesToModify.length > 0) {
        for (const filename of plan.filesToModify) {
          if (!currentFiles[filename]) {
            console.warn(`File ${filename} not found for modification`);
            continue;
          }

          this.sendUpdate({
            type: 'thinking',
            content: `Modifying ${filename}...`
          });

          // Get analysis targets for this specific file
          const analysisTargets = analysisResult?.changeTargets?.[filename] || null;

          const updatedCode = await modifyCode(
            currentFiles[filename],
            userMessage,
            filename,
            analysisTargets
          );

          fileOperations.push({
            type: 'modify',
            filename,
            content: updatedCode
          });

          this.sendUpdate({
            type: 'file_operation',
            content: `Modified ${filename}`,
            data: { filename, operation: 'modify' }
          });
        }
      }

      // Step 5: Validate cross-file consistency
      if (fileOperations.length > 1) {
        const allFiles = {};
        fileOperations.forEach(op => {
          allFiles[op.filename] = op.content;
        });

        const crossFileValidation = validateCrossFileConsistency(allFiles);

        if (crossFileValidation.warnings.length > 0) {
          console.warn('⚠️  Cross-file validation warnings:');
          crossFileValidation.warnings.forEach(warn => {
            console.warn(`  ${warn.file}: ${warn.message}`);
          });
        }

        if (!crossFileValidation.valid) {
          console.error('❌ Cross-file validation errors:');
          crossFileValidation.errors.forEach(err => {
            console.error(`  ${err.file}: ${err.message}`);
          });
        }
      }

      // Step 6: Return Results
      this.sendUpdate({
        type: 'complete',
        content: this.generateSuccessMessage(plan, fileOperations),
        data: { plan, fileOperations }
      });

      return {
        success: true,
        intent: intentResult,
        plan,
        fileOperations,
        rateLimit: latestRateLimit
      };

    } catch (error) {
      console.error('Agent orchestration error:', error);

      this.sendUpdate({
        type: 'error',
        content: `Error: ${error.message || 'Something went wrong. Please try again.'}`
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle bug fixing workflow
   */
  async handleBugFix(userMessage, currentFiles) {
    try {
      this.sendUpdate({
        type: 'thinking',
        content: 'Analyzing code to identify the bug...'
      });

      const debugResult = await debugAndFix(userMessage, currentFiles);

      if (!debugResult.success) {
        this.sendUpdate({
          type: 'error',
          content: debugResult.message || 'Could not identify or fix the bug'
        });

        return {
          success: false,
          error: debugResult.message || 'Bug fix failed'
        };
      }

      this.sendUpdate({
        type: 'intent',
        content: `Bug identified: ${debugResult.diagnosis}\nType: ${debugResult.bugType}\nSeverity: ${debugResult.severity}`,
        data: debugResult
      });

      this.sendUpdate({
        type: 'thinking',
        content: 'Fixing the bug...'
      });

      // Create file operations from fixed files
      const fileOperations = debugResult.fixedFiles.map(file => ({
        type: 'modify',
        filename: file.filename,
        content: file.fixedCode
      }));

      // Send updates for each fixed file
      fileOperations.forEach(op => {
        this.sendUpdate({
          type: 'file_operation',
          content: `Fixed ${op.filename}`,
          data: { filename: op.filename, operation: 'fix' }
        });
      });

      this.sendUpdate({
        type: 'complete',
        content: `✅ Bug fixed!\n\n🐛 Issue: ${debugResult.diagnosis}\n\n📝 Fixed ${fileOperations.length} file(s):\n${fileOperations.map(op => `   • ${op.filename}`).join('\n')}\n\nYour code is ready in the editor!`,
        data: { debugResult, fileOperations }
      });

      return {
        success: true,
        intent: { intent: 'fix_bug' },
        debugResult,
        fileOperations
      };

    } catch (error) {
      console.error('Bug fix error:', error);

      this.sendUpdate({
        type: 'error',
        content: `Error fixing bug: ${error.message || 'Something went wrong'}`
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send update to UI
   */
  sendUpdate(update) {
    this.onUpdate(update);
  }

  /**
   * Generate success message based on operations performed
   */
  generateSuccessMessage(plan, fileOperations) {
    const createdFiles = fileOperations.filter(op => op.type === 'create');
    const modifiedFiles = fileOperations.filter(op => op.type === 'modify');

    let message = '✅ ' + plan.summary + '\n\n';

    if (createdFiles.length > 0) {
      message += `📝 Created ${createdFiles.length} file(s):\n`;
      createdFiles.forEach(op => {
        message += `   • ${op.filename}\n`;
      });
    }

    if (modifiedFiles.length > 0) {
      if (createdFiles.length > 0) message += '\n';
      message += `✏️  Modified ${modifiedFiles.length} file(s):\n`;
      modifiedFiles.forEach(op => {
        message += `   • ${op.filename}\n`;
      });
    }

    message += '\nYour code is ready in the editor!';

    return message;
  }
}

/**
 * Convenience function to process a message
 */
export async function processMessage(userMessage, currentFiles, onUpdate) {
  const orchestrator = new AgentOrchestrator(onUpdate);
  return await orchestrator.processUserMessage(userMessage, currentFiles);
}
