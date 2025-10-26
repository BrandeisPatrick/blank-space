# End-to-End Tests: Prompt to Product

Complete end-to-end testing of the AI agent system, validating the full workflow from user prompt to working web product.

---

## 🎯 What Do These Tests Do?

These E2E tests validate the **complete user journey**:

```
User Prompt
    ↓
AI Orchestrator (Planner, Analyzer, Designer, CodeWriter)
    ↓
Generated Code
    ↓
Code Validation (Syntax, Imports, React Patterns)
    ↓
Runtime Testing (Sandpack Execution)
    ↓
Working Web Product ✅
```

Each test simulates a real user interaction, from typing a prompt to seeing a fully functional React app.

---

## 📁 File Structure

```
test/e2e/
├── prompt-to-product.test.js    # Main E2E test suite
├── README.md                     # This file
├── helpers/
│   ├── validators.js             # Code validation utilities
│   └── sandpackRunner.js         # Runtime testing helpers
└── fixtures/
    └── prompts.js                # Test prompt scenarios
```

---

## 🚀 How to Run

### Run All E2E Tests

```bash
# From project root
node test/e2e/prompt-to-product.test.js
```

### Requirements

- **OpenAI API Key** - Set `OPENAI_API_KEY` environment variable
- **Internet Connection** - For LLM API calls
- **Node.js** - ES modules support

### Expected Runtime

⏱️ **~2-4 minutes** for full suite (8 tests)

---

## 📋 Test Coverage

### Suite 1: Simple Creation Flows (2 tests)

Tests basic app generation from simple prompts:

1. **Create counter** - "Create a simple counter with increment and decrement"
   - Validates: increment, decrement, count functionality

2. **Create greeting card** - "Make a greeting card that says Hello World"
   - Validates: basic JSX, text rendering

**Expected Runtime:** ~30-60 seconds

---

### Suite 2: Medium Complexity Flows (2 tests)

Tests multi-feature app generation:

1. **Build calculator** - "Build a calculator with add, subtract, multiply, divide"
   - Validates: All 4 operations implemented
   - Validates: Modern design (shadows, rounded corners)

2. **Create todo list** - "Create a todo list with add, complete, delete"
   - Validates: CRUD operations
   - Validates: Task management features

**Expected Runtime:** ~60-90 seconds

---

### Suite 3: Modification Flows (2 tests)

Tests code modification and enhancement:

1. **Change color theme** - "Change blue theme to purple"
   - Validates: New color applied
   - Validates: Old color removed
   - Tests: ANALYZE → MODIFY flow

2. **Add new feature** - "Add a reset button to the counter"
   - Validates: New feature added
   - Validates: Existing functionality preserved
   - Tests: Feature addition without breaking changes

**Expected Runtime:** ~45-60 seconds

---

### Suite 4: Debugging Flows (1 test)

Tests bug detection and fixing:

1. **Fix browser incompatibility** - "Fix the app - won't run in browser"
   - Buggy code: Uses `require()` for Node.js module
   - Validates: Bug removed
   - Validates: Browser-compatible solution applied
   - Tests: DEBUG → FIX flow

**Expected Runtime:** ~30-45 seconds

---

## ✅ What Each Test Validates

Every E2E test performs **4-phase validation**:

### Phase 1: Orchestrator Execution ⚙️

- Orchestrator runs without errors
- Correct agent flow executed (PLAN → CODE or ANALYZE → MODIFY)
- Plan generated (for creation tasks)
- File operations returned

**Pass Criteria:** `result.success === true`

### Phase 2: Code Generation 📝

- At least one file generated
- App.jsx file exists
- Code is non-empty
- File structure is correct

**Pass Criteria:** `fileOperations.length > 0 && appFile exists`

### Phase 3: Code Validation 🔍

Uses `validators.js` to check:

- ✅ **Syntax** - Balanced braces, parentheses, brackets
- ✅ **Imports** - ES6 imports only, no `require()`, no Node.js modules
- ✅ **Exports** - Has `export default` or `export {}`
- ✅ **React** - Valid component structure, returns JSX
- ✅ **Quality** - Metrics (lines, functions), warnings (console.log, TODOs)

**Pass Criteria:** `validation.valid === true && errors.length === 0`

### Phase 4: Runtime Testing 🚀

Uses `sandpackRunner.js` to verify:

- ✅ Component renders without errors
- ✅ No runtime exceptions
- ✅ JSX structure is valid
- ✅ React hooks used correctly

**Pass Criteria:** `runtime.success === true && rendered === true`

---

## 📊 Understanding Test Results

### Success Output Example

```
📝 E2E Test 1: Create simple counter from prompt
==============================================================================

   🎯 User Prompt: "Create a simple counter..."
   📂 Existing Files: 0 file(s)

   ⚙️  Phase 1: Running Orchestrator...
      → Planning
      → Generating code
   ✓ Orchestrator completed successfully
   ✓ Phases executed: 3

   📝 Phase 2: Extracting Generated Code...
   ✓ Code extracted: 1247 characters
   ✓ Files generated: App.jsx

   🔍 Phase 3: Validating Code Quality...
   ✓ All validations passed
   ✓ Metrics: 42 lines, 3 functions

   🚀 Phase 4: Testing Runtime Execution...
   ✓ Runtime test passed
   ✓ Component rendered successfully

   🔎 Verifying Expected Features...
   ✓ Feature found: increment
   ✓ Feature found: decrement
   ✓ Feature found: count

   📊 Flow Summary:
      - Phases: 3
      - Code length: 1247 chars
      - Validation: PASSED
      - Runtime: PASSED

✅ E2E TEST PASSED
```

### Failure Output Example

```
📝 E2E Test 2: Build calculator
==============================================================================

   🎯 User Prompt: "Build a calculator..."

   ⚙️  Phase 1: Running Orchestrator...
   ✓ Orchestrator completed

   📝 Phase 2: Extracting Code...
   ✓ Code extracted

   🔍 Phase 3: Validating Code...
   ❌ Validation failed with 1 error(s):
      - Unbalanced braces: 12 open, 11 close

❌ E2E TEST FAILED: Code validation failed: Unbalanced braces
```

---

## 🔧 Helpers & Utilities

### `validators.js`

Validates generated code quality:

```javascript
import { validateAll } from './helpers/validators.js';

const result = validateAll(code, 'App.jsx');
// Returns: { valid, errors, warnings, results, metrics }
```

**Functions:**
- `validateSyntax(code)` - Balanced delimiters
- `validateImports(code)` - Browser-compatible imports
- `validateExports(code)` - Proper ES6 exports
- `validateReactComponent(code)` - Valid React component
- `validateCodeQuality(code)` - Quality metrics
- `validateAll(code, filename)` - Run all validators

### `sandpackRunner.js`

Executes code in Sandpack environment:

```javascript
import { mockSandpackRun } from './helpers/sandpackRunner.js';

const result = mockSandpackRun(code);
// Returns: { success, rendered, errors, consoleOutput, renderTime }
```

**Functions:**
- `runInSandpack(code, options)` - Full Sandpack execution (browser only)
- `mockSandpackRun(code)` - Fast validation (works in Node.js)
- `smokeTest(code)` - Quick render check
- `testInteraction(code, testFn)` - User interaction testing

### `prompts.js`

Test prompt fixtures:

```javascript
import { simplePrompts, mediumPrompts } from './fixtures/prompts.js';

const { prompt, expectedFeatures } = simplePrompts.counter;
```

**Categories:**
- `simplePrompts` - Basic single-feature apps
- `mediumPrompts` - Multi-feature apps
- `complexPrompts` - Advanced apps with design
- `modificationPrompts` - Code modification scenarios
- `debuggingPrompts` - Bug fixing scenarios
- `designPrompts` - UX/UI focused apps

---

## 🐛 Troubleshooting

### Error: "OPENAI_API_KEY not set"

**Solution:**
```bash
export OPENAI_API_KEY="sk-..."
```

### Error: "Module not found"

**Solution:**
```bash
# Run from project root
cd /path/to/blank-space
node test/e2e/prompt-to-product.test.js
```

### Tests Timing Out

**Cause:** LLM API calls taking too long

**Solutions:**
1. Check internet connection
2. Verify API key is valid
3. Check OpenAI API status
4. Reduce number of tests

### Validation Failures

**Common issues:**
- Generated code has syntax errors → Check Planner/CodeWriter prompts
- Missing imports → Update CodeWriter to include React import
- No export statement → Update CodeWriter template

### Runtime Failures

**Common issues:**
- Component won't render → Check JSX syntax
- React errors → Validate hooks usage
- Browser incompatible → Check for Node.js modules

---

## 📈 Success Criteria

All E2E tests should:

- ✅ Run without crashes
- ✅ Complete all 4 phases
- ✅ Generate valid React code
- ✅ Pass all validations
- ✅ Render successfully
- ✅ Include expected features

**Target Success Rate:** 100% (8/8 tests)

**Target Runtime:** < 5 minutes

---

## 🎯 Adding New E2E Tests

### Template

```javascript
await testAsync('Test name', async () => {
  const userMessage = 'Your prompt here';
  const currentFiles = {}; // Or existing code

  const flow = await runCompleteFlow(userMessage, currentFiles);

  // Verify features
  console.log(`\n   🔎 Verifying Features...`);
  const codeLower = flow.code.toLowerCase();

  if (!codeLower.includes('expected-feature')) {
    throw new Error('Expected feature not found');
  }

  console.log(`   ✓ Feature verified`);
});
```

### Guidelines

1. **Clear test name** - Describe what you're testing
2. **Realistic prompt** - Use natural language like real users
3. **Specific assertions** - Check for expected features
4. **Good error messages** - Make failures easy to debug
5. **Phase logging** - Log progress at each phase

---

## 📚 Related Tests

- **Unit Tests:** `test/scenarios/agents.test.js` - Individual agent testing
- **Integration Tests:** `test/scenarios/orchestrator-flow.test.js` - Orchestrator flows
- **Utility Tests:** `test/scenarios/utils.test.js` - Helper functions
- **Real-World Tests:** `test/scenarios/real-world.test.js` - Complex scenarios

---

## 🏆 Test Philosophy

These E2E tests follow these principles:

1. **Real agents, no mocks** - Uses actual orchestrator and agents
2. **Complete flows** - Tests entire user journey, not isolated parts
3. **Fast feedback** - Uses mock Sandpack for speed (real Sandpack optional)
4. **Comprehensive validation** - Multi-phase verification
5. **Realistic scenarios** - Based on actual user requests

---

## 📝 Test Maintenance

### When to Update

- ✅ After modifying orchestrator logic
- ✅ After changing agent behavior
- ✅ After updating code generation templates
- ✅ When adding new features to agents
- ✅ When fixing bugs in the system

### What to Test

- ✅ All major user workflows
- ✅ Edge cases (empty prompts, invalid input)
- ✅ Error handling (graceful failures)
- ✅ Performance (reasonable runtime)
- ✅ Code quality (all validations pass)

---

**Last Updated:** October 25, 2025
**Test Count:** 8 E2E tests
**Coverage:** Complete prompt-to-product flow
**Status:** ✅ Production-ready
