/**
 * E2E Test Prompts
 * Real-world user prompts for end-to-end testing
 */

/**
 * Simple creation prompts - should complete quickly
 */
export const simplePrompts = {
  counter: {
    prompt: 'Create a simple counter with increment and decrement buttons',
    expectedFeatures: [
      ['increment', 'increase', '+', 'add', 'plus'], // Increment alternatives
      ['decrement', 'decrease', '-', 'subtract', 'minus'], // Decrement alternatives
      ['count', 'counter', 'number', 'value'] // Count alternatives
    ],
    complexity: 'simple'
  },

  greeting: {
    prompt: 'Make a greeting card that says "Hello World" with a nice design',
    expectedFeatures: [
      ['hello', 'hi', 'greeting'], // Greeting alternatives
      ['world'] // World is pretty unique
    ],
    complexity: 'simple'
  },

  button: {
    prompt: 'Create a colorful button that changes color when clicked',
    expectedFeatures: [
      ['button'],
      ['click', 'onclick'],
      ['color']
    ],
    complexity: 'simple'
  }
};

/**
 * Medium complexity prompts - require multiple features
 */
export const mediumPrompts = {
  calculator: {
    prompt: 'Build a calculator app with add, subtract, multiply, and divide operations. Make it look modern.',
    expectedFeatures: [
      ['add', '+', 'plus', 'addition'], // Add alternatives
      ['subtract', '-', 'minus', 'subtraction'], // Subtract alternatives
      ['multiply', '*', 'times', 'multiplication', '×'], // Multiply alternatives
      ['divide', '/', 'division', '÷'], // Divide alternatives
      ['calculator', 'calc'] // Calculator alternatives
    ],
    complexity: 'medium'
  },

  todoList: {
    prompt: 'Create a todo list where users can add tasks, mark them as complete, and delete them.',
    expectedFeatures: [
      ['add', 'new', 'create'], // Add alternatives
      ['complete', 'done', 'finish', 'check'], // Complete alternatives
      ['delete', 'remove'], // Delete alternatives
      ['todo', 'task'], // Todo alternatives
      ['task', 'item'] // Task alternatives
    ],
    complexity: 'medium'
  },

  colorPicker: {
    prompt: 'Make a color picker tool where users can select colors and see the hex code',
    expectedFeatures: ['color', 'picker', 'hex'],
    complexity: 'medium'
  },

  timer: {
    prompt: 'Build a countdown timer where users can set minutes and seconds, start, pause, and reset',
    expectedFeatures: ['countdown', 'timer', 'start', 'pause', 'reset'],
    complexity: 'medium'
  }
};

/**
 * Complex prompts - require design decisions and multiple components
 */
export const complexPrompts = {
  weatherApp: {
    prompt: 'Create a weather app that shows temperature, conditions, and a 5-day forecast. Use a clean, modern design with weather icons.',
    expectedFeatures: ['weather', 'temperature', 'forecast'],
    complexity: 'complex'
  },

  chatInterface: {
    prompt: 'Build a chat interface with message bubbles, timestamps, and an input field. Make it look like a modern messaging app.',
    expectedFeatures: ['chat', 'message', 'timestamp', 'input'],
    complexity: 'complex'
  },

  dashboard: {
    prompt: 'Create a dashboard with cards showing statistics, charts, and recent activity. Use a professional design.',
    expectedFeatures: ['dashboard', 'card', 'statistic'],
    complexity: 'complex'
  }
};

/**
 * Modification prompts - require analyzing existing code
 */
export const modificationPrompts = {
  changeColor: {
    prompt: 'Change the blue theme to purple',
    existingCode: `
import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-blue-50">
      <div className="p-8">
        <h1 className="text-4xl font-bold text-blue-900">My App</h1>
        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
          Click Me
        </button>
      </div>
    </div>
  );
}
    `.trim(),
    expectedChanges: ['purple', 'violet', 'indigo'],
    complexity: 'simple'
  },

  addDarkMode: {
    prompt: 'Add a dark mode toggle to the app',
    existingCode: `
import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-white">
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">Counter: {count}</h1>
        <button onClick={() => setCount(count + 1)} className="px-4 py-2 bg-blue-600 text-white rounded">
          Increment
        </button>
      </div>
    </div>
  );
}
    `.trim(),
    expectedChanges: ['dark', 'toggle', 'theme'],
    complexity: 'medium'
  },

  addFeature: {
    prompt: 'Add a reset button to the counter',
    existingCode: `
import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">Count: {count}</h1>
      <div className="flex gap-4">
        <button onClick={() => setCount(count + 1)} className="px-6 py-3 bg-blue-600 text-white rounded-lg">
          Increment
        </button>
        <button onClick={() => setCount(count - 1)} className="px-6 py-3 bg-blue-600 text-white rounded-lg">
          Decrement
        </button>
      </div>
    </div>
  );
}
    `.trim(),
    expectedChanges: ['reset', 'setCount(0)'],
    complexity: 'simple'
  }
};

/**
 * Debugging prompts - code with intentional bugs
 */
export const debuggingPrompts = {
  infiniteLoop: {
    prompt: 'Fix the app - it says "Too many re-renders"',
    buggyCode: `
import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  // BUG: This causes infinite re-renders
  setCount(count + 1);

  return (
    <div>
      <h1>Count: {count}</h1>
    </div>
  );
}
    `.trim(),
    expectedFix: 'useEffect',
    bugType: 'infinite-loop'
  },

  browserIncompatible: {
    prompt: 'Fix the error - app won\'t run in browser',
    buggyCode: `
import React, { useState } from 'react';
const fs = require('fs'); // BUG: Node.js module in browser

export default function App() {
  const [data, setData] = useState('');

  return (
    <div>
      <h1>Data: {data}</h1>
    </div>
  );
}
    `.trim(),
    expectedFix: 'remove require',
    bugType: 'browser-incompatible'
  },

  syntaxError: {
    prompt: 'Fix the syntax error in the code',
    buggyCode: `
import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)>Increment</button>
    </div>
  // Missing closing brace
    `.trim(),
    expectedFix: 'balanced braces',
    bugType: 'syntax-error'
  }
};

/**
 * Design prompts - focus on UX/UI
 */
export const designPrompts = {
  modernCard: {
    prompt: 'Create a modern card component with gradient background, shadow, and hover effect',
    expectedStyles: ['gradient', 'shadow', 'hover'],
    complexity: 'medium'
  },

  glassmorphism: {
    prompt: 'Design a glassmorphism login form with blur effect and semi-transparent background',
    expectedStyles: ['blur', 'transparent', 'backdrop'],
    complexity: 'medium'
  },

  minimalist: {
    prompt: 'Build a minimalist landing page with clean typography and lots of whitespace',
    expectedStyles: ['font', 'spacing', 'minimal'],
    complexity: 'medium'
  }
};

/**
 * Get all prompts as a flat array
 */
export function getAllPrompts() {
  return [
    ...Object.values(simplePrompts),
    ...Object.values(mediumPrompts),
    ...Object.values(complexPrompts),
    ...Object.values(modificationPrompts),
    ...Object.values(debuggingPrompts),
    ...Object.values(designPrompts)
  ];
}

/**
 * Get prompts by complexity
 */
export function getPromptsByComplexity(complexity) {
  return getAllPrompts().filter(p => p.complexity === complexity);
}

/**
 * Get random prompt
 */
export function getRandomPrompt() {
  const allPrompts = getAllPrompts();
  return allPrompts[Math.floor(Math.random() * allPrompts.length)];
}

export default {
  simplePrompts,
  mediumPrompts,
  complexPrompts,
  modificationPrompts,
  debuggingPrompts,
  designPrompts,
  getAllPrompts,
  getPromptsByComplexity,
  getRandomPrompt
};
