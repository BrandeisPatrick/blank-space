import { execSync } from 'child_process';

/**
 * Test Orchestrator
 * Runs shell commands (tests, build, lint) and captures output
 * Industry Pattern: All coding agents (Codex, Gemini, Claude, Kilo) run tests and feed errors back to DEBUG loop
 */

export class TestOrchestrator {
  /**
   * Run test/build commands and capture stdout/stderr
   * @param {Array} fileOperations - Files that were generated/modified
   * @param {Object} options - Test configuration
   * @param {Array<string>} options.commands - Commands to run (default: ['npm test'])
   * @param {number} options.timeout - Timeout per command in ms (default: 30000)
   * @param {Function} options.onUpdate - Progress callback
   * @returns {Promise<Object>} Test results
   */
  async run(fileOperations, options = {}) {
    const {
      commands = ['npm test'],
      timeout = 30000,
      onUpdate = () => {}
    } = options;

    const results = [];

    for (const cmd of commands) {
      onUpdate({
        type: 'test-command',
        message: `Running: ${cmd}`,
        command: cmd
      });

      try {
        const output = execSync(cmd, {
          encoding: 'utf-8',
          timeout,
          stdio: 'pipe',
          cwd: process.cwd()
        });

        results.push({
          command: cmd,
          success: true,
          stdout: output,
          stderr: '',
          exitCode: 0
        });

        onUpdate({
          type: 'test-success',
          message: `✅ ${cmd} passed`,
          command: cmd
        });

      } catch (error) {
        // execSync throws on non-zero exit code
        results.push({
          command: cmd,
          success: false,
          stdout: error.stdout || '',
          stderr: error.stderr || error.message || '',
          exitCode: error.status || 1,
          errorMessage: error.message
        });

        onUpdate({
          type: 'test-failure',
          message: `❌ ${cmd} failed`,
          command: cmd,
          error: error.stderr || error.message
        });
      }
    }

    const allPassed = results.every(r => r.success);

    return {
      allPassed,
      results,
      summary: this.generateSummary(results)
    };
  }

  /**
   * Generate human-readable summary of test results
   * @param {Array} results - Test results
   * @returns {string} Summary message
   */
  generateSummary(results) {
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const total = results.length;

    if (failed === 0) {
      return `✅ All ${total} command(s) passed successfully`;
    }

    const failedCommands = results
      .filter(r => !r.success)
      .map(r => `  - ${r.command}: ${r.stderr.split('\n')[0] || 'Unknown error'}`)
      .join('\n');

    return `❌ ${failed}/${total} command(s) failed:\n${failedCommands}`;
  }

  /**
   * Extract error messages from test results for debugger
   * @param {Array} results - Test results
   * @returns {string} Combined error messages
   */
  extractErrorMessages(results) {
    return results
      .filter(r => !r.success)
      .map(r => {
        const header = `=== Error from: ${r.command} ===`;
        const stderr = r.stderr || 'No error output';
        const stdout = r.stdout ? `\nStdout:\n${r.stdout}` : '';
        return `${header}\n${stderr}${stdout}`;
      })
      .join('\n\n');
  }
}

export default TestOrchestrator;
