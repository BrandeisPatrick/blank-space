# Agent Flow Scenario Tests

Comprehensive test suite for the AI agent system, covering individual agents, full orchestrator flows, utilities, and real-world scenarios.

---

## 📁 Test Files

| File | Purpose | Tests | Type |
|------|---------|-------|------|
| **orchestrator-flow.test.js** | Full E2E orchestrator flow | 5 | Integration |
| **agents.test.js** | Individual agent functionality | 10+ | Unit |
| **utils.test.js** | Utility functions | 12+ | Unit |
| **real-world.test.js** | Realistic user scenarios | 5 | E2E |

**Total:** 32+ tests covering all major code paths

---

## 🚀 How to Run Tests

### Run All Scenario Tests

```bash
# Run orchestrator flow tests
node test/scenarios/orchestrator-flow.test.js

# Run individual agent tests
node test/scenarios/agents.test.js

# Run utility tests
node test/scenarios/utils.test.js

# Run real-world scenarios
node test/scenarios/real-world.test.js
```

### Run Specific Test

```bash
# Just orchestrator E2E
node test/scenarios/orchestrator-flow.test.js

# Just utilities
node test/scenarios/utils.test.js
```

---

## 📋 Test Coverage

### 1. **Orchestrator Flow Tests** (`orchestrator-flow.test.js`)

Tests the complete PLAN → CODE → TEST → DEBUG flow:

- ✅ **Create new app** - Tests planning and code generation for new projects
- ✅ **Modify existing code** - Tests analysis and modification of existing files
- ✅ **Metadata validation** - Ensures orchestrator returns proper metadata
- ✅ **Error handling** - Tests graceful handling of invalid inputs
- ✅ **Request complexity** - Tests detection of simple vs complex requests

**Expected Runtime:** ~30-60 seconds
**Dependencies:** Requires OpenAI API key

---

### 2. **Individual Agent Tests** (`agents.test.js`)

Tests each agent independently:

#### Planner Agent
- ✅ Create plan for new app
- ✅ Handle modification intent

#### Designer Agent
- ✅ Generate UX design with color schemes
- ✅ Create design directions

#### CodeWriter Agent
- ✅ Generate new code
- ✅ Modify existing code

#### Analyzer Agent
- ✅ Analyze for modification (color changes)
- ✅ Extract change targets

#### Debugger Agent
- ✅ Quick diagnose browser errors
- ✅ Detect `require()` incompatibility

#### Validator Agent
- ✅ Validate clean code
- ✅ Detect syntax errors

**Expected Runtime:** ~45-90 seconds
**Dependencies:** Requires OpenAI API key

---

### 3. **Utility Tests** (`utils.test.js`)

Tests utility functions and helpers:

#### colorExtractor
- ✅ Extract basic Tailwind colors (`bg-`, `text-`, `border-`)
- ✅ Extract gradient colors (`from-`, `via-`, `to-`)
- ✅ Extract shadow and ring colors
- ✅ Extract decoration and divide colors
- ✅ Handle null/empty input gracefully

#### PromptLoader
- ✅ Load planner prompt from file
- ✅ Load codewriter-generate prompt
- ✅ Replace placeholders correctly
- ✅ Handle missing prompts with fallback

#### MemoryBank
- ✅ Load global rules
- ✅ Record and retrieve bug patterns
- ✅ Save and load conversation summaries

**Expected Runtime:** ~5-10 seconds
**Dependencies:** Minimal (mostly file I/O)

---

### 4. **Real-World Scenarios** (`real-world.test.js`)

End-to-end tests simulating actual user workflows:

1. **Build calculator from scratch**
   - Tests: PLAN → DESIGN → CODE
   - Validates: All 4 operations (add, subtract, multiply, divide)

2. **Add dark mode to existing app**
   - Tests: ANALYZE → MODIFY
   - Validates: Dark mode toggle and theme switching

3. **Fix React infinite loop bug**
   - Tests: ANALYZE → DEBUG → FIX
   - Validates: `useState` bug fix (setCount in wrong place)

4. **Redesign UI with new colors**
   - Tests: ANALYZE → DESIGN → MODIFY
   - Validates: Color scheme change (blue → purple)

5. **Build todo app with categories**
   - Tests: PLAN → DESIGN → CODE
   - Validates: Categories, add tasks, complete tasks

**Expected Runtime:** ~90-120 seconds
**Dependencies:** Requires OpenAI API key

---

## ✅ Success Criteria

All tests should:
- ✅ Run without errors
- ✅ Return valid results
- ✅ Complete within expected time
- ✅ Validate agent outputs
- ✅ Show clear pass/fail status

---

## 🔧 Test Configuration

### Environment Variables

```bash
# Required for LLM-based tests
export OPENAI_API_KEY="your-api-key-here"

# Optional: Adjust timeouts
export TEST_TIMEOUT=30000
```

### Test Options

Most tests accept these options:

```javascript
{
  runTests: false,        // Skip Sandpack tests for faster execution
  testMode: 'sandpack',   // or 'shell'
  maxDebugCycles: 3       // Max DEBUG iterations
}
```

---

## 📊 Expected Results

### Pass Criteria

| Test Suite | Pass Rate | Runtime |
|------------|-----------|---------|
| Orchestrator Flow | 100% (5/5) | ~30-60s |
| Individual Agents | 100% (10/10) | ~45-90s |
| Utilities | 100% (12/12) | ~5-10s |
| Real-World Scenarios | 100% (5/5) | ~90-120s |

**Total:** 32+ tests, 100% pass rate, ~3-5 minutes

---

## 🐛 Troubleshooting

### Common Issues

**1. "OPENAI_API_KEY not set"**
```bash
# Solution: Set the API key
export OPENAI_API_KEY="sk-..."
```

**2. "Module not found"**
```bash
# Solution: Run from project root
cd /path/to/blank-space
node test/scenarios/orchestrator-flow.test.js
```

**3. "Tests timing out"**
```bash
# Solution: Increase timeout or skip tests
# Edit test file and add: runTests: false
```

**4. "LLM returns empty response"**
- Check API key validity
- Check OpenAI API status
- Verify internet connection

---

## 📝 Adding New Tests

### Template for New Test

```javascript
await testAsync('Test name', async () => {
  console.log('   Testing: What you are testing');

  // Setup
  const userMessage = 'Your test message';
  const currentFiles = { /* test files */ };

  // Execute
  const result = await runOrchestrator(userMessage, currentFiles);

  // Assertions
  if (!result.success) throw new Error('Test failed');
  if (!result.fileOperations) throw new Error('No files generated');

  console.log(`   ✓ Test assertion passed`);
});
```

### Guidelines

1. **Clear descriptions** - Explain what the test does
2. **Focused assertions** - Test one thing at a time
3. **Realistic data** - Use real-world examples
4. **Fast execution** - Use `runTests: false` when possible
5. **Good error messages** - Make failures easy to debug

---

## 🎯 Test Philosophy

These tests follow these principles:

1. **Real agents, not mocks** - Tests use actual agent implementations
2. **Fast feedback** - Tests run quickly with minimal setup
3. **Comprehensive** - Cover all major code paths
4. **Independent** - Each test can run standalone
5. **Documented** - Clear descriptions of what each test does

---

## 📚 Related Documentation

- [Agent Improvements](../../docs/agent-improvements-2025-10-25/README.md)
- [Implementation Complete](../../docs/agent-improvements-2025-10-25/IMPLEMENTATION_COMPLETE.md)
- [Test Results](../../docs/agent-improvements-2025-10-25/TEST_RESULTS_VERSION_CONTROL.md)

---

## 🏆 Maintenance

### When to Update Tests

- ✅ After adding new agents
- ✅ After changing agent behavior
- ✅ After modifying orchestrator flow
- ✅ After adding new utilities

### Test Coverage Goals

- **Agents:** 100% of public API
- **Orchestrator:** All major flows
- **Utilities:** All exports
- **Edge cases:** Invalid inputs, errors

---

**Last Updated:** October 25, 2025
**Test Coverage:** 32+ tests
**Pass Rate:** 100%
