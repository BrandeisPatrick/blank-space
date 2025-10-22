/**
 * Iterative Debugger Test
 * Tests the new debugAndFixIterative function
 */

import { debugAndFixIterative } from "../../src/services/agents/debugger.js";

async function testIterativeDebugger() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   ITERATIVE DEBUGGER TEST SUITE        ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Test 1: Fix require() issue (should trigger validation and retry)
  console.log('📝 Test 1: Fix require() browser incompatibility\n');

  const testFiles = {
    'TodoApp.jsx': `import React, { useState } from 'react';
const axios = require('axios'); // This should fail validation

export default function TodoApp() {
  const [todos, setTodos] = useState([]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Todo List</h1>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  );
}`
  };

  try {
    const result = await debugAndFixIterative({
      errorMessage: "ReferenceError: require is not defined",
      currentFiles: testFiles,
      userMessage: "Fix the error - require is not defined"
    });

    console.log('\n📊 Test 1 Results:');
    console.log('─────────────────────────────────────');
    console.log('✅ Success:', result.success);
    console.log('🔄 Attempts:', result.attempts);
    console.log('📝 Message:', result.message);

    if (result.success && result.fixedFiles && result.fixedFiles.length > 0) {
      console.log('\n✅ PASS: Iterative debugger fixed require() issue');
      console.log(`   Fixed after ${result.attempts} attempt(s)`);

      // Check if the fix actually removed require()
      const fixedCode = result.fixedFiles[0].fixedCode;
      if (!fixedCode.includes('require(')) {
        console.log('   ✓ Verified: require() was removed');
      } else {
        console.log('   ⚠️ Warning: require() still present in fixed code');
      }
    } else {
      console.log('\n❌ FAIL: Iterative debugger could not fix the issue');
      console.log('   Final issues:', result.finalIssues);
    }

  } catch (error) {
    console.log('\n❌ ERROR in Test 1:', error.message);
  }

  // Test 2: Syntax error (unmatched braces)
  console.log('\n\n📝 Test 2: Fix syntax error (unmatched braces)\n');

  const syntaxErrorFiles = {
    'Counter.jsx': `import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4">
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  // Missing closing brace
}`
  };

  try {
    const result = await debugAndFixIterative({
      errorMessage: "SyntaxError: Unexpected end of input",
      currentFiles: syntaxErrorFiles,
      userMessage: "Fix the syntax error"
    });

    console.log('\n📊 Test 2 Results:');
    console.log('─────────────────────────────────────');
    console.log('✅ Success:', result.success);
    console.log('🔄 Attempts:', result.attempts);
    console.log('📝 Message:', result.message);

    if (result.success) {
      console.log('\n✅ PASS: Fixed syntax error');
      console.log(`   Fixed after ${result.attempts} attempt(s)`);
    } else {
      console.log('\n❌ FAIL: Could not fix syntax error');
    }

  } catch (error) {
    console.log('\n❌ ERROR in Test 2:', error.message);
  }

  // Test 3: Multi-file bug detection (File Scanner Agent)
  console.log('\n\n📝 Test 3: Multi-file bug detection (require in imported file)\n');

  const multiFileTestFiles = {
    'App.jsx': `import React, { useState } from 'react';
import { useTodos } from './hooks/useTodos';

export default function App() {
  const { todos, addTodo } = useTodos();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Todo App</h1>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  );
}`,
    'hooks/useTodos.js': `import { useState, useEffect } from 'react';
import { fetchTodos } from '../lib/helpers';

export function useTodos() {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    fetchTodos().then(setTodos);
  }, []);

  return { todos };
}`,
    'lib/helpers.js': `// This file has the actual bug - require() in browser code
const axios = require('axios'); // BUG: Should be ES6 import

export async function fetchTodos() {
  const response = await axios.get('/api/todos');
  return response.data;
}`
  };

  try {
    const result = await debugAndFixIterative({
      errorMessage: "ReferenceError: require is not defined",
      currentFiles: multiFileTestFiles,
      userMessage: "Fix the require error"
    });

    console.log('\n📊 Test 3 Results:');
    console.log('─────────────────────────────────────');
    console.log('✅ Success:', result.success);
    console.log('🔄 Attempts:', result.attempts);
    console.log('📝 Message:', result.message);

    if (result.success && result.fixedFiles && result.fixedFiles.length > 0) {
      console.log('\n✅ PASS: File Scanner Agent found bug in imported file');
      console.log(`   Fixed after ${result.attempts} attempt(s)`);

      // Verify the correct file was fixed
      const fixedFile = result.fixedFiles[0];
      console.log(`   Fixed file: ${fixedFile.filename}`);

      if (fixedFile.filename === 'lib/helpers.js') {
        console.log('   ✓ Verified: Scanner found bug in lib/helpers.js (not App.jsx)');
      } else {
        console.log(`   ⚠️ Warning: Fixed wrong file (${fixedFile.filename} instead of lib/helpers.js)`);
      }

      // Verify require() was removed
      if (!fixedFile.fixedCode.includes('require(')) {
        console.log('   ✓ Verified: require() was removed from the fix');
      } else {
        console.log('   ⚠️ Warning: require() still present in fixed code');
      }

      // Verify ES6 import was added
      if (fixedFile.fixedCode.includes('import axios from')) {
        console.log('   ✓ Verified: Converted to ES6 import');
      }
    } else {
      console.log('\n❌ FAIL: File Scanner Agent could not find/fix the bug');
      console.log('   Final issues:', result.finalIssues);
    }

  } catch (error) {
    console.log('\n❌ ERROR in Test 3:', error.message);
    console.log('   Stack:', error.stack);
  }

  console.log('\n\n╔════════════════════════════════════════╗');
  console.log('║       ITERATIVE DEBUGGER TESTS DONE    ║');
  console.log('╚════════════════════════════════════════╝\n');
}

// Run the test
testIterativeDebugger().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
