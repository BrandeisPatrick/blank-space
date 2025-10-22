/**
 * Test Suite: Reliability & Validation
 *
 * Tests the multi-layer reliability system:
 * 1. Runtime validation (banned packages, PropTypes, require())
 * 2. Auto-fix functionality (remove PropTypes, fix imports)
 * 3. Cross-file validation (unused imports, missing exports, circular deps)
 */

import { validateRuntimeSafety } from '../../src/services/utils/validation/runtimeValidation.js';
import { validateCrossFileConsistency } from '../../src/services/utils/validation/crossFileValidation.js';
import { autoFixCommonIssues } from '../../src/services/utils/code/autoFix.js';

/**
 * Run all reliability tests
 */
export function runReliabilityTests() {
  // Test counters
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ ${testName}`);
    } else {
      failedTests++;
      console.error(`❌ ${testName}`);
    }
  }

  console.log('\n🧪 RELIABILITY & VALIDATION TEST SUITE\n');
  console.log('='.repeat(60));

// ============================================================
// TEST SUITE 1: Runtime Validation - Banned Packages
// ============================================================
console.log('\n📦 Test Suite 1: Banned Package Detection\n');

// Test 1.1: Detect PropTypes import
const codeWithPropTypes = `
import React from 'react';
import PropTypes from 'prop-types';

function Component({ name }) {
  return <div>{name}</div>;
}

Component.propTypes = {
  name: PropTypes.string.isRequired
};

export default Component;
`;

const propTypesResult = validateRuntimeSafety(codeWithPropTypes, 'Component.jsx');
assert(
  !propTypesResult.valid &&
  propTypesResult.errors.some(e => e.message.includes('prop-types')),
  'Should detect PropTypes import as error'
);

// Test 1.2: Detect axios import
const codeWithAxios = `
import axios from 'axios';

async function fetchData() {
  const response = await axios.get('/api/data');
  return response.data;
}
`;

const axiosResult = validateRuntimeSafety(codeWithAxios, 'api.js');
assert(
  !axiosResult.valid &&
  axiosResult.errors.some(e => e.message.includes('axios')),
  'Should detect axios import as error'
);

// Test 1.3: Detect lodash import
const codeWithLodash = `
import _ from 'lodash';

const uniqueItems = _.uniq([1, 2, 2, 3]);
`;

const lodashResult = validateRuntimeSafety(codeWithLodash, 'utils.js');
assert(
  !lodashResult.valid &&
  lodashResult.errors.some(e => e.message.includes('lodash')),
  'Should detect lodash import as error'
);

// Test 1.4: Detect require() statement
const codeWithRequire = `
const fs = require('fs');
const data = fs.readFileSync('file.txt');
`;

const requireResult = validateRuntimeSafety(codeWithRequire, 'file.js');
assert(
  !requireResult.valid &&
  requireResult.errors.some(e => e.message.includes('require()')),
  'Should detect require() as error'
);

// Test 1.5: Allow React imports
const validReactCode = `
import React, { useState } from 'react';
import ReactDOM from 'react-dom';

function App() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}

export default App;
`;

const validReactResult = validateRuntimeSafety(validReactCode, 'App.jsx');
assert(
  validReactResult.valid,
  'Should allow React and react-dom imports'
);

// ============================================================
// TEST SUITE 2: Auto-Fix Functionality
// ============================================================
console.log('\n🔧 Test Suite 2: Auto-Fix Common Issues\n');

// Test 2.1: Auto-remove PropTypes
const codeBeforeFix = `
import React from 'react';
import PropTypes from 'prop-types';

function Button({ label, onClick }) {
  return <button onClick={onClick}>{label}</button>;
}

Button.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};

export default Button;
`;

const fixedCode = autoFixCommonIssues(codeBeforeFix, 'Button.jsx');
assert(
  !fixedCode.includes('PropTypes') &&
  !fixedCode.includes('prop-types') &&
  !fixedCode.includes('.propTypes ='),
  'Should remove PropTypes import and usage'
);

// Test 2.2: Fix import paths in App.jsx
const appCodeBadImports = `
import React from 'react';
import Header from './Header';
import Footer from './Footer';

function App() {
  return (
    <div>
      <Header />
      <Footer />
    </div>
  );
}

export default App;
`;

const fixedAppCode = autoFixCommonIssues(appCodeBadImports, 'App.jsx');
assert(
  fixedAppCode.includes("'./components/Header'") &&
  fixedAppCode.includes("'./components/Footer'"),
  'Should fix component imports in App.jsx to use ./components/'
);

// Test 2.3: Replace axios with comment
const codeWithAxios2 = `
import axios from 'axios';

async function getData() {
  return await axios.get('/api/data');
}
`;

const fixedAxiosCode = autoFixCommonIssues(codeWithAxios2, 'api.js');
assert(
  !fixedAxiosCode.includes('import axios') &&
  fixedAxiosCode.includes('// Note: axios replaced with fetch API'),
  'Should remove axios import and add comment'
);

// Test 2.4: Replace lodash with comment
const codeWithLodash2 = `
import _ from 'lodash';

const unique = _.uniq(items);
`;

const fixedLodashCode = autoFixCommonIssues(codeWithLodash2, 'utils.js');
assert(
  !fixedLodashCode.includes('import _ from') &&
  fixedLodashCode.includes('// Note: Use native JavaScript'),
  'Should remove lodash import and add comment'
);

// Test 2.5: Remove unused imports
const codeWithUnusedImport = `
import React, { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}

export default Counter;
`;

const fixedUnusedCode = autoFixCommonIssues(codeWithUnusedImport, 'Counter.jsx');
assert(
  !fixedUnusedCode.includes('useEffect'),
  'Should remove unused useEffect import'
);

// ============================================================
// TEST SUITE 3: Cross-File Validation
// ============================================================
console.log('\n🔗 Test Suite 3: Cross-File Consistency\n');

// Test 3.1: Detect unused component import
const filesWithUnusedComponent = {
  'App.jsx': `
import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <div>
      <Header />
    </div>
  );
}

export default App;
  `
};

const unusedResult = validateCrossFileConsistency(filesWithUnusedComponent);
assert(
  unusedResult.warnings.some(w =>
    w.message.includes('Footer') && w.message.includes('never used')
  ),
  'Should detect unused component import'
);

// Test 3.2: Detect unused hook import
const filesWithUnusedHook = {
  'components/TodoList.jsx': `
import React, { useState } from 'react';
import { useTodos } from '../hooks/useTodos';

function TodoList() {
  const [filter, setFilter] = useState('all');

  return <div>Todos</div>;
}

export default TodoList;
  `
};

const unusedHookResult = validateCrossFileConsistency(filesWithUnusedHook);
assert(
  unusedHookResult.warnings.some(w =>
    w.message.includes('useTodos') && w.message.includes('never called')
  ),
  'Should detect unused hook import'
);

// Test 3.3: Detect missing exports
const filesWithMissingExport = {
  'components/Button.jsx': `
import React from 'react';

function Button({ label }) {
  return <button>{label}</button>;
}
  `
};

const missingExportResult = validateCrossFileConsistency(filesWithMissingExport);
assert(
  !missingExportResult.valid &&
  missingExportResult.errors.some(e =>
    e.message.includes('no exports')
  ),
  'Should detect missing export'
);

// Test 3.4: Allow valid exports
const filesWithValidExport = {
  'components/Button.jsx': `
import React from 'react';

function Button({ label }) {
  return <button>{label}</button>;
}

export default Button;
  `
};

const validExportResult = validateCrossFileConsistency(filesWithValidExport);
assert(
  validExportResult.valid,
  'Should pass validation with valid export'
);

// Test 3.5: Detect duplicate state management
const filesWithDuplicateState = {
  'components/TodoList.jsx': `
import React, { useState } from 'react';
import { useTodos } from '../hooks/useTodos';

function TodoList() {
  const [todos, setTodos] = useState([]);
  const todoHook = useTodos();

  return <div>Todos</div>;
}

export default TodoList;
  `
};

const duplicateStateResult = validateCrossFileConsistency(filesWithDuplicateState);
assert(
  duplicateStateResult.warnings.some(w =>
    w.message.includes('duplicate logic')
  ),
  'Should detect duplicate state management'
);

// ============================================================
// TEST SUITE 4: End-to-End Reliability Pipeline
// ============================================================
console.log('\n🔄 Test Suite 4: Complete Reliability Pipeline\n');

// Test 4.1: Full pipeline - PropTypes removal
const unreliableCode = `
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

function UserCard({ name, email }) {
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
}

UserCard.propTypes = {
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired
};

export default UserCard;
`;

// Step 1: Auto-fix
const step1Fixed = autoFixCommonIssues(unreliableCode, 'UserCard.jsx');

// Step 2: Validate
const step2Validation = validateRuntimeSafety(step1Fixed, 'UserCard.jsx');

assert(
  step2Validation.valid &&
  !step1Fixed.includes('PropTypes') &&
  !step1Fixed.includes('axios'),
  'Should auto-fix PropTypes and axios, then pass validation'
);

// Test 4.2: Multi-file validation with fixes
const multiFileProject = {
  'App.jsx': `
import React from 'react';
import TodoList from './components/TodoList';

function App() {
  return (
    <div>
      <h1>Todo App</h1>
      <TodoList />
    </div>
  );
}

export default App;
  `,
  'components/TodoList.jsx': `
import React from 'react';
import { useTodos } from '../hooks/useTodos';
import TodoItem from './TodoItem';

function TodoList() {
  const { todos, addTodo, removeTodo } = useTodos();

  return (
    <div>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} onDelete={removeTodo} />
      ))}
    </div>
  );
}

export default TodoList;
  `,
  'components/TodoItem.jsx': `
import React from 'react';

function TodoItem({ todo, onDelete }) {
  return (
    <div>
      <span>{todo.text}</span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </div>
  );
}

export default TodoItem;
  `,
  'hooks/useTodos.js': `
import { useState } from 'react';

export function useTodos() {
  const [todos, setTodos] = useState([]);

  const addTodo = (text) => {
    setTodos([...todos, { id: Date.now(), text }]);
  };

  const removeTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return { todos, addTodo, removeTodo };
}
  `
};

const multiFileValidation = validateCrossFileConsistency(multiFileProject);

assert(
  multiFileValidation.valid &&
  multiFileValidation.warnings.length === 0 &&
  multiFileValidation.errors.length === 0,
  'Should pass full cross-file validation for well-structured project'
);

// Test 4.3: Detect and report multiple issues
const problematicMultiFile = {
  'App.jsx': `
import React from 'react';
import PropTypes from 'prop-types';
import Header from './Header';
import Footer from './Footer';

function App() {
  return <div><Header /></div>;
}

export default App;
  `,
  'components/Button.jsx': `
import React from 'react';

function Button() {
  return <button>Click</button>;
}
  `
};

// First, validate before auto-fix to detect PropTypes
const beforeFixValidation = validateRuntimeSafety(problematicMultiFile['App.jsx'], 'App.jsx');
const hasPropTypesError = !beforeFixValidation.valid &&
  beforeFixValidation.errors.some(e => e.message.includes('prop-types'));

// Auto-fix App.jsx
const fixedApp = autoFixCommonIssues(problematicMultiFile['App.jsx'], 'App.jsx');

// Validate runtime safety after auto-fix
const runtimeCheck = validateRuntimeSafety(fixedApp, 'App.jsx');

// Validate cross-file (Button.jsx should have missing export error)
const crossFileCheck = validateCrossFileConsistency({
  'App.jsx': fixedApp,
  'components/Button.jsx': problematicMultiFile['components/Button.jsx']
});

assert(
  hasPropTypesError && // PropTypes detected before auto-fix
  runtimeCheck.valid && // PropTypes auto-removed, now valid
  !crossFileCheck.valid && // Should fail due to missing export in Button.jsx
  crossFileCheck.errors.some(e => e.message.includes('no exports')) && // Missing export in Button
  !fixedApp.includes('Footer'), // Unused Footer import auto-removed
  'Should detect multiple issues across validation layers'
);

  // ============================================================
  // RESULTS SUMMARY
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST RESULTS SUMMARY\n');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 All reliability tests passed!\n');
    console.log('✓ Banned package detection working');
    console.log('✓ Auto-fix functionality working');
    console.log('✓ Cross-file validation working');
    console.log('✓ Complete reliability pipeline working\n');
  } else {
    console.log(`\n⚠️  ${failedTests} test(s) failed. Review implementation.\n`);
  }

  return {
    totalTests,
    totalPassed: passedTests,
    totalFailed: failedTests,
    successRate: (passedTests / totalTests) * 100
  };
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const results = runReliabilityTests();
  if (results.totalFailed > 0) {
    process.exit(1);
  }
}
