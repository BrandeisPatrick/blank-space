/**
 * Sandpack Runner for E2E Tests
 * Executes generated code in Sandpack and captures results
 */

/**
 * Run code in Sandpack and capture results
 * @param {string} code - The code to run
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Test results
 */
export async function runInSandpack(code, options = {}) {
  const {
    timeout = 10000,
    waitForRender = true,
    captureConsole = true
  } = options;

  return new Promise((resolve, reject) => {
    const results = {
      success: false,
      rendered: false,
      errors: [],
      consoleOutput: [],
      renderTime: null
    };

    const startTime = Date.now();

    // Create iframe for Sandpack
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position: absolute; width: 0; height: 0; border: none;';
    document.body.appendChild(iframe);

    // Setup message listener
    const messageHandler = (event) => {
      if (event.data.type === 'sandpack-ready') {
        results.rendered = true;
        results.renderTime = Date.now() - startTime;
      }

      if (event.data.type === 'sandpack-error') {
        results.errors.push({
          message: event.data.message,
          line: event.data.line,
          column: event.data.column
        });
      }

      if (event.data.type === 'console' && captureConsole) {
        results.consoleOutput.push({
          level: event.data.level,
          message: event.data.message
        });
      }
    };

    window.addEventListener('message', messageHandler);

    // Setup Sandpack files
    const files = {
      '/App.jsx': code,
      '/index.js': `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Signal ready
window.parent.postMessage({ type: 'sandpack-ready' }, '*');

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
} catch (error) {
  window.parent.postMessage({
    type: 'sandpack-error',
    message: error.message,
    stack: error.stack
  }, '*');
}
      `.trim(),
      '/index.html': `
<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
      `.trim()
    };

    // Create Sandpack bundle
    const sandpackConfig = {
      files,
      template: 'react',
      options: {
        externalResources: ['https://cdn.tailwindcss.com']
      }
    };

    // Load Sandpack (in real implementation, you'd use @codesandbox/sandpack-react)
    // For now, simulate the execution
    setTimeout(() => {
      // Cleanup
      window.removeEventListener('message', messageHandler);
      document.body.removeChild(iframe);

      // Determine success
      results.success = results.rendered && results.errors.length === 0;

      resolve(results);
    }, waitForRender ? 2000 : 100);

    // Timeout
    setTimeout(() => {
      window.removeEventListener('message', messageHandler);
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
      reject(new Error(`Sandpack test timed out after ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Test interaction with rendered component
 * @param {string} code - The code to test
 * @param {Function} testFn - Test function to run
 * @returns {Promise<Object>} Test results
 */
export async function testInteraction(code, testFn) {
  const results = await runInSandpack(code, {
    waitForRender: true,
    captureConsole: true
  });

  if (!results.success) {
    return {
      success: false,
      error: 'Failed to render component',
      details: results.errors
    };
  }

  try {
    // Run the test function
    const testResults = await testFn();
    return {
      success: true,
      results: testResults
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Simple smoke test - just verify code renders without errors
 * @param {string} code - The code to test
 * @returns {Promise<boolean>} True if renders successfully
 */
export async function smokeTest(code) {
  try {
    const results = await runInSandpack(code, {
      timeout: 5000,
      waitForRender: true,
      captureConsole: false
    });
    return results.success;
  } catch (error) {
    console.error(`Smoke test failed: ${error.message}`);
    return false;
  }
}

/**
 * Mock Sandpack runner for fast testing (no actual execution)
 * @param {string} code - The code to validate
 * @returns {Object} Mock results
 */
export function mockSandpackRun(code) {
  // Quick validation checks
  const hasReact = code.includes('React') || code.includes('import');
  const hasExport = code.includes('export default') || code.includes('export {');
  const hasJSX = code.includes('<') && code.includes('>');
  const hasReturn = code.includes('return');

  const errors = [];
  if (!hasReact) errors.push({ message: 'Missing React import' });
  if (!hasExport) errors.push({ message: 'Missing export statement' });
  if (!hasJSX) errors.push({ message: 'No JSX found' });
  if (!hasReturn) errors.push({ message: 'No return statement' });

  return {
    success: errors.length === 0,
    rendered: errors.length === 0,
    errors,
    consoleOutput: [],
    renderTime: errors.length === 0 ? 100 : null,
    mock: true
  };
}

export default {
  runInSandpack,
  testInteraction,
  smokeTest,
  mockSandpackRun
};
