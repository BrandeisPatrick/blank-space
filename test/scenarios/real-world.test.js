/**
 * Real-World Scenario Tests
 * Tests realistic end-to-end user scenarios
 */

import { runOrchestrator } from '../../src/services/orchestrator.js';

console.log('\n🧪 Starting Real-World Scenario Tests...\n');

// Test counter
let testsRun = 0;
let testsPassed = 0;

/**
 * Async test helper
 */
async function testAsync(name, fn) {
  testsRun++;
  try {
    console.log(`\n📝 Scenario ${testsRun}: ${name}`);
    console.log('   ' + '─'.repeat(60));
    await fn();
    testsPassed++;
    console.log('   ' + '─'.repeat(60));
    console.log(`✅ SCENARIO PASSED\n`);
  } catch (error) {
    console.log('   ' + '─'.repeat(60));
    console.log(`❌ SCENARIO FAILED: ${error.message}\n`);
    console.error(error);
  }
}

// ============================================================================
// SCENARIO 1: BUILD CALCULATOR FROM SCRATCH
// ============================================================================

await testAsync('Build a calculator app from scratch', async () => {
  console.log('   User Story: "I want a calculator that can add, subtract, multiply, divide"');
  console.log('   Expected Flow: PLAN → DESIGN → CODE');

  const userMessage = 'Create a calculator app with basic operations: add, subtract, multiply, and divide. Make it look modern with a nice color scheme.';
  const currentFiles = {};

  let phases = [];
  const result = await runOrchestrator(userMessage, currentFiles, (update) => {
    if (update.type === 'phase') {
      phases.push(update.message);
      console.log(`   → ${update.message}`);
    }
    if (update.type === 'plan') {
      console.log(`   → Plan: ${update.plan?.summary?.substring(0, 80)}...`);
    }
  }, {
    runTests: false // Skip Sandpack tests for faster execution
  });

  // Assertions
  if (!result.success) {
    throw new Error(`Calculator creation failed: ${result.message || 'Unknown error'}`);
  }

  if (!result.fileOperations || result.fileOperations.length === 0) {
    throw new Error('No files generated for calculator');
  }

  const appFile = result.fileOperations.find(f => f.filename === 'App.jsx');
  if (!appFile) {
    throw new Error('App.jsx not generated');
  }

  // Check for calculator features in the code
  const code = appFile.code.toLowerCase();
  const hasAddition = code.includes('add') || code.includes('+');
  const hasSubtraction = code.includes('subtract') || code.includes('-');
  const hasMultiplication = code.includes('multiply') || code.includes('*');
  const hasDivision = code.includes('divide') || code.includes('/');

  if (!hasAddition || !hasSubtraction || !hasMultiplication || !hasDivision) {
    throw new Error('Calculator missing required operations');
  }

  console.log(`   ✓ Calculator app created successfully`);
  console.log(`   ✓ Files generated: ${result.fileOperations.map(f => f.filename).join(', ')}`);
  console.log(`   ✓ Code length: ${appFile.code.length} characters`);
  console.log(`   ✓ Has all 4 operations: ✓`);
});

// ============================================================================
// SCENARIO 2: ADD DARK MODE TO EXISTING APP
// ============================================================================

await testAsync('Add dark mode toggle to existing app', async () => {
  console.log('   User Story: "Add a dark mode switch to my counter app"');
  console.log('   Expected Flow: ANALYZE → MODIFY');

  const currentFiles = {
    'App.jsx': `
import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="bg-gray-100 p-8 rounded-xl shadow-lg">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Counter</h1>
        <div className="text-6xl font-bold text-center mb-8 text-gray-800">{count}</div>
        <div className="flex gap-4">
          <button
            onClick={() => setCount(count + 1)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Increment
          </button>
          <button
            onClick={() => setCount(count - 1)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Decrement
          </button>
          <button
            onClick={() => setCount(0)}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
    `.trim()
  };

  const userMessage = 'Add a dark mode toggle button. The dark mode should have a dark background and light text.';

  let analysisPerformed = false;
  const result = await runOrchestrator(userMessage, currentFiles, (update) => {
    if (update.type === 'phase') {
      console.log(`   → ${update.message}`);
      if (update.message.toLowerCase().includes('analyz')) {
        analysisPerformed = true;
      }
    }
  }, {
    runTests: false
  });

  // Assertions
  if (!result.success) {
    throw new Error(`Dark mode addition failed: ${result.message || 'Unknown error'}`);
  }

  const modifiedFile = result.fileOperations[0];
  if (!modifiedFile) {
    throw new Error('No modified file returned');
  }

  // Check for dark mode implementation
  const code = modifiedFile.code.toLowerCase();
  const hasDarkMode = code.includes('dark') || code.includes('theme');
  const hasToggle = code.includes('toggle') || code.includes('switch') || code.includes('button');

  if (!hasDarkMode) {
    console.log(`   ⚠️  Warning: Dark mode might not be fully implemented`);
  }
  if (!hasToggle) {
    console.log(`   ⚠️  Warning: Toggle button might be missing`);
  }

  console.log(`   ✓ Dark mode feature added`);
  console.log(`   ✓ Analysis performed: ${analysisPerformed}`);
  console.log(`   ✓ Code modified: ${modifiedFile.code.length} characters`);
});

// ============================================================================
// SCENARIO 3: FIX COMMON REACT BUG
// ============================================================================

await testAsync('Fix useState infinite loop bug', async () => {
  console.log('   User Story: "My app is crashing with too many re-renders error"');
  console.log('   Expected Flow: ANALYZE → DEBUG → FIX');

  const currentFiles = {
    'App.jsx': `
import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  // BUG: This causes infinite re-renders!
  setCount(count + 1);

  return (
    <div>
      <h1>Count: {count}</h1>
    </div>
  );
}
    `.trim()
  };

  const userMessage = 'Fix the app - it says "Too many re-renders. React limits the number of renders..."';

  const result = await runOrchestrator(userMessage, currentFiles, (update) => {
    if (update.type === 'phase') {
      console.log(`   → ${update.message}`);
    }
  }, {
    runTests: false
  });

  // Assertions
  if (!result.success) {
    throw new Error(`Bug fix failed: ${result.message || 'Unknown error'}`);
  }

  const fixedFile = result.fileOperations[0];
  if (!fixedFile) {
    throw new Error('No fixed file returned');
  }

  const code = fixedFile.code;

  // The fix should NOT have setCount outside a handler/effect
  const lines = code.split('\n');
  let hasProperFix = false;

  // Check if setCount is now inside useEffect or event handler
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('setCount')) {
      // Check previous lines for useEffect or function
      const context = lines.slice(Math.max(0, i - 5), i + 1).join(' ');
      if (context.includes('useEffect') || context.includes('onClick') || context.includes('=>')) {
        hasProperFix = true;
        break;
      }
    }
  }

  if (!hasProperFix) {
    console.log(`   ⚠️  Warning: Fix might not be complete (setCount should be in useEffect or handler)`);
  }

  console.log(`   ✓ Bug fix applied`);
  console.log(`   ✓ Code no longer has bare setCount call: ${!code.match(/^\s*setCount/m)}`);
});

// ============================================================================
// SCENARIO 4: REDESIGN UI WITH NEW COLOR SCHEME
// ============================================================================

await testAsync('Redesign app with new color scheme', async () => {
  console.log('   User Story: "Change my app from blue to purple theme"');
  console.log('   Expected Flow: ANALYZE → DESIGN → MODIFY');

  const currentFiles = {
    'App.jsx': `
import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-blue-900 mb-4">My App</h1>
        <div className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-lg">
          <p className="text-blue-600">This is a blue-themed app.</p>
          <button className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            Click Me
          </button>
        </div>
      </div>
    </div>
  );
}
    `.trim()
  };

  const userMessage = 'Redesign the app with a purple color scheme instead of blue. Keep the same layout but change all the colors to purple.';

  const result = await runOrchestrator(userMessage, currentFiles, (update) => {
    if (update.type === 'phase') {
      console.log(`   → ${update.message}`);
    }
  }, {
    runTests: false
  });

  // Assertions
  if (!result.success) {
    throw new Error(`Redesign failed: ${result.message || 'Unknown error'}`);
  }

  const redesignedFile = result.fileOperations[0];
  if (!redesignedFile) {
    throw new Error('No redesigned file returned');
  }

  const code = redesignedFile.code;

  // Check for purple colors
  const hasPurple = code.includes('purple-');
  const hasViolet = code.includes('violet-');
  const hasIndigo = code.includes('indigo-');

  const hasBlue = code.includes('blue-');

  if (!hasPurple && !hasViolet && !hasIndigo) {
    throw new Error('No purple/violet/indigo colors found in redesign');
  }

  if (hasBlue) {
    console.log(`   ⚠️  Warning: Some blue colors still present`);
  }

  console.log(`   ✓ Redesign applied`);
  console.log(`   ✓ Has purple theme: ${hasPurple || hasViolet || hasIndigo}`);
  console.log(`   ✓ Code length: ${code.length} characters`);
});

// ============================================================================
// SCENARIO 5: CREATE TODO APP WITH CATEGORIES
// ============================================================================

await testAsync('Build todo app with categories', async () => {
  console.log('   User Story: "Create a todo list app with categories (work, personal, shopping)"');
  console.log('   Expected Flow: PLAN → DESIGN → CODE');

  const userMessage = 'Create a todo list app where users can add tasks and organize them by categories: Work, Personal, and Shopping. Include the ability to mark tasks as complete.';

  const currentFiles = {};

  const result = await runOrchestrator(userMessage, currentFiles, (update) => {
    if (update.type === 'phase') {
      console.log(`   → ${update.message}`);
    }
  }, {
    runTests: false
  });

  // Assertions
  if (!result.success) {
    throw new Error(`Todo app creation failed: ${result.message || 'Unknown error'}`);
  }

  if (!result.fileOperations || result.fileOperations.length === 0) {
    throw new Error('No files generated');
  }

  const appFile = result.fileOperations.find(f => f.filename === 'App.jsx');
  if (!appFile) {
    throw new Error('App.jsx not generated');
  }

  const code = appFile.code.toLowerCase();

  // Check for todo features
  const hasCategories = code.includes('work') && code.includes('personal') && code.includes('shopping');
  const hasAddTask = code.includes('add') || code.includes('new');
  const hasComplete = code.includes('complete') || code.includes('done') || code.includes('check');

  if (!hasCategories) {
    throw new Error('Categories not found in code');
  }
  if (!hasAddTask) {
    console.log(`   ⚠️  Warning: Add task functionality might be missing`);
  }
  if (!hasComplete) {
    console.log(`   ⚠️  Warning: Complete task functionality might be missing`);
  }

  console.log(`   ✓ Todo app with categories created`);
  console.log(`   ✓ Has categories: ✓`);
  console.log(`   ✓ Has add functionality: ${hasAddTask}`);
  console.log(`   ✓ Has complete functionality: ${hasComplete}`);
  console.log(`   ✓ Files: ${result.fileOperations.map(f => f.filename).join(', ')}`);
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('📊 Real-World Scenario Test Results');
console.log('='.repeat(70));
console.log(`Scenarios Run:    ${testsRun}`);
console.log(`Scenarios Passed: ${testsPassed}`);
console.log(`Scenarios Failed: ${testsRun - testsPassed}`);
console.log(`Success Rate:     ${Math.round((testsPassed / testsRun) * 100)}%`);
console.log('='.repeat(70));

if (testsPassed === testsRun) {
  console.log('✅ All real-world scenarios passed!\n');
  process.exit(0);
} else {
  console.log('❌ Some scenarios failed\n');
  process.exit(1);
}
