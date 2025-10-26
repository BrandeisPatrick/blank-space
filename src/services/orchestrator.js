import { PlanOrchestrator } from './orchestrators/planOrchestrator.js';
import { CodeOrchestrator } from './orchestrators/codeOrchestrator.js';
import { SandpackTestOrchestrator } from './orchestrators/sandpackTestOrchestrator.js';
import { debugAndFixIterative } from './agents/debugger.js';

// TestOrchestrator uses Node.js child_process - only import dynamically when needed

/**
 * Main Orchestrator Entry Point
 *
 * Auto-routes requests to appropriate orchestrators based on context
 * This is the single entry point for all code generation/modification requests
 *
 * Flow: PLAN → CODE → TEST (Sandpack) → DEBUG → (loop until green or max attempts)
 * Industry Pattern: Matches Codex CLI, Gemini CLI, Claude Code, Kilo Code
 *
 * Sandpack Integration: Runs code in virtual browser environment and captures runtime errors
 */

/**
 * Run orchestrator system
 * @param {string} userMessage - User's request
 * @param {Object} currentFiles - Current files in the project
 * @param {Function} onUpdate - Callback for progress updates
 * @param {Object} options - Configuration options
 * @param {boolean} options.runTests - Whether to run tests after code generation (default: true in browser)
 * @param {string} options.testMode - 'sandpack' (browser) or 'shell' (backend) - auto-detected
 * @param {Array<string>} options.testCommands - Commands for shell mode (default: ['npm test'])
 * @param {number} options.maxDebugCycles - Max DEBUG iterations (default: 3)
 * @param {number} options.sandpackTimeout - Timeout for Sandpack validation (default: 5000ms)
 * @returns {Promise<Object>} Result with fileOperations for App.jsx
 */
export async function runOrchestrator(userMessage, currentFiles = {}, onUpdate = () => {}, options = {}) {
  // Auto-detect environment: browser (Sandpack) vs backend (shell)
  const isBrowser = typeof window !== 'undefined';

  const {
    runTests = isBrowser, // Auto-enable tests in browser
    testMode = isBrowser ? 'sandpack' : 'shell',
    testCommands = ['npm test'],
    maxDebugCycles = 3,
    sandpackTimeout = 5000
  } = options;

  const hasFiles = Object.keys(currentFiles).length > 0;
  const needsPlanning = !hasFiles || isComplexRequest(userMessage);

  let plan = null;

  // Step 1: Planning (if needed)
  if (needsPlanning) {
    onUpdate({ type: 'phase', message: 'Planning solution...' });

    const planOrch = new PlanOrchestrator();
    const planResult = await planOrch.run(userMessage, currentFiles, onUpdate);

    if (!planResult.skipPlanning) {
      plan = planResult.plan;
      onUpdate({ type: 'plan', message: 'Plan created', plan });
    }
  }

  // Step 2: Code Generation/Modification
  onUpdate({ type: 'phase', message: 'Generating code...' });

  const codeOrch = new CodeOrchestrator();
  let result = await codeOrch.run(userMessage, currentFiles, plan, onUpdate);

  // Step 3: TEST → DEBUG Loop (if enabled)
  let debugCycle = 0;
  let testResults = null;

  if (runTests) {
    onUpdate({
      type: 'phase',
      message: `Starting TEST → DEBUG loop (${testMode} mode)...`
    });

    while (debugCycle < maxDebugCycles) {
      debugCycle++;

      onUpdate({
        type: 'phase',
        message: `Testing code (cycle ${debugCycle}/${maxDebugCycles})...`
      });

      // Run tests based on environment
      if (testMode === 'sandpack') {
        // Browser mode: Sandpack runtime validation
        const sandpackOrch = new SandpackTestOrchestrator({
          timeout: sandpackTimeout
        });
        testResults = await sandpackOrch.run(result.fileOperations, {
          onUpdate
        });
      } else {
        // Backend mode: Shell commands (dynamic import for Node.js only)
        const { TestOrchestrator } = await import('./orchestrators/testOrchestrator.js');
        const testOrch = new TestOrchestrator();
        testResults = await testOrch.run(result.fileOperations, {
          commands: testCommands,
          onUpdate
        });
      }

      // All tests passed - break out of loop
      const testsPassed = testMode === 'sandpack' ? testResults.success : testResults.allPassed;

      if (testsPassed) {
        onUpdate({
          type: 'success',
          message: `✅ All tests passed on cycle ${debugCycle}!`,
          testResults: testResults.summary
        });
        break;
      }

      // Tests failed - check if we should continue debugging
      if (debugCycle >= maxDebugCycles) {
        onUpdate({
          type: 'warning',
          message: `⚠️ Reached max debug cycles (${maxDebugCycles}). Some tests still failing.`,
          testResults: testResults.summary
        });
        break;
      }

      // Run debugger to fix failures
      onUpdate({
        type: 'phase',
        message: `Debugging failures (cycle ${debugCycle})...`
      });

      // Extract error messages based on test mode
      let errorMessage;
      if (testMode === 'sandpack') {
        const sandpackOrch = new SandpackTestOrchestrator();
        errorMessage = sandpackOrch.extractErrorMessages(testResults);
      } else {
        // Dynamic import for Node.js only
        const { TestOrchestrator } = await import('./orchestrators/testOrchestrator.js');
        const testOrch = new TestOrchestrator();
        errorMessage = testOrch.extractErrorMessages(testResults.results);
      }

      // Convert fileOperations to currentFiles format for debugger
      const filesForDebug = result.fileOperations.reduce((acc, op) => {
        acc[op.filename] = op.content;
        return acc;
      }, {});

      const debugResult = await debugAndFixIterative({
        errorMessage,
        currentFiles: filesForDebug,
        userMessage: `Fix test failures:\n${errorMessage}`
      });

      if (!debugResult.success) {
        onUpdate({
          type: 'error',
          message: `❌ Failed to fix issues after ${debugCycle} cycle(s)`,
          debugResult: debugResult.message
        });
        break;
      }

      // Apply fixes and retry tests in next cycle
      onUpdate({
        type: 'info',
        message: `✅ Applied fixes, retrying tests...`,
        fixedFiles: debugResult.fixedFiles.map(f => f.filename)
      });

      // Update result with fixed files
      result.fileOperations = debugResult.fixedFiles.map(f => ({
        filename: f.filename,
        code: f.fixedCode,
        operation: 'modify'
      }));
    }
  }

  // Step 4: Return final result
  return {
    success: result.success,
    fileOperations: result.fileOperations || [],
    plan: plan,
    metadata: {
      needsPlanning,
      operation: result.operation,
      filesGenerated: result.fileOperations?.length || 0,
      testsRun: runTests,
      testMode: runTests ? testMode : null,
      testsPassed: runTests
        ? (testMode === 'sandpack' ? testResults?.success : testResults?.allPassed)
        : null,
      debugCycles: debugCycle,
      testResults: testResults?.summary || null,
      ...result.metadata
    }
  };
}

/**
 * Detect if request is complex enough to need planning
 */
function isComplexRequest(message) {
  const msg = message.toLowerCase();
  return (
    msg.includes('refactor') ||
    msg.includes('redesign') ||
    msg.includes('reorganize') ||
    msg.includes('create') ||
    msg.includes('build') ||
    msg.includes('make a') ||
    msg.includes('make an')
  );
}

export default {
  runOrchestrator
};
