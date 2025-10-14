# Test Suite Documentation

Comprehensive testing suite for the AI Code Generation & Agent Orchestration system.

## Quick Start

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Basic tests (no API key required)
npm run test:basic

# Agent orchestration tests
npm run test:agents

# AutoGen reflection tests
npm run test:autogen

# Integration tests
npm run test:integration
```

## Prerequisites

### Required
- Node.js v18 or later
- npm or yarn

### Optional (for full test coverage)
- OpenAI API key (for agent tests)

### Setting up API Key

**Option 1: Environment Variable**
```bash
export OPENAI_API_KEY=your_key_here
npm test
```

**Option 2: .env File**
Create `.env` in project root:
```
OPENAI_API_KEY=your_key_here
```

**Option 3: Inline**
```bash
OPENAI_API_KEY=your_key_here npm test
```

## Test Structure

```
test/
├── runAllTests.js              # Unified test runner (all suites)
├── config/
│   └── testConfig.js          # Centralized test configuration
├── utils/
│   └── testHelpers.js         # Shared helper functions
├── api/
│   ├── testAgents.js          # Basic validation tests
│   ├── testOrchestrator.js    # Intent, planning, workflow tests
│   ├── testModifications.js   # Code modification tests
│   ├── testDebugger.js        # Bug detection & fixing tests
│   ├── testReliability.js     # Runtime validation & auto-fix
│   ├── testReviewerAgent.js   # Code review agent tests
│   ├── testReflectionLoop.js  # Iterative improvement tests
│   ├── testAgentSystem.js     # Agent messaging & tools tests
│   ├── runAutoGenTests.js     # AutoGen feature test runner
│   ├── validators.js          # Code quality validators
│   ├── mockResponses.js       # Mock AI responses
│   ├── mockExistingProjects.js # Mock project states
│   └── scenarios/             # Test scenarios
│       ├── chessGame.js
│       ├── debugging.js
│       ├── modifications.js
│       └── todoApp.js
└── integration/
    └── endToEndTests.js       # End-to-end integration tests
```

## Test Suites

### 1. Basic Tests (`testAgents.js`)
**No API Key Required**

Tests utility functions and code quality validators:
- Code cleanup (markdown removal, file extraction)
- Validators (imports, Tailwind, folder structure)
- File structure validation

**Run:**
```bash
npm run test:basic
# or
node test/api/testAgents.js
```

**Expected:** 16/16 passing

### 2. Reliability Tests (`testReliability.js`)
**No API Key Required**

Tests multi-layer reliability system:
- Runtime validation (banned packages detection)
- Auto-fix functionality (PropTypes removal, import fixes)
- Cross-file validation (unused imports, missing exports)

**Run:**
```bash
node test/api/testReliability.js
```

**Expected:** 23/23 passing

### 3. Orchestrator Tests (`testOrchestrator.js`)
**Requires OpenAI API Key**

Tests agent orchestration pipeline:
- Intent classification (create, modify, debug, style)
- Planning (file identification)
- Workflow coordination

**Run:**
```bash
npm run test:orchestrator
# or
node test/api/testOrchestrator.js
```

### 4. Modification Tests (`testModifications.js`)
**Requires OpenAI API Key**

Tests code modification capabilities:
- Preservation of existing code
- Quality maintenance during modifications
- Planning identification for modifications

**Run:**
```bash
node test/api/testModifications.js
```

### 5. Debugger Tests (`testDebugger.js`)
**Requires OpenAI API Key**

Tests bug detection and fixing:
- Intent classification for bug reports
- Bug identification and diagnosis
- Bug fixing with code preservation

**Run:**
```bash
node test/api/testDebugger.js
```

### 6. Reviewer Agent Tests (`testReviewerAgent.js`)
**Requires OpenAI API Key**

Tests code review functionality:
- Quality scoring (0-100)
- Issue detection and categorization
- Improvement suggestions

**Run:**
```bash
node test/api/testReviewerAgent.js
```

### 7. Reflection Loop Tests (`testReflectionLoop.js`)
**Requires OpenAI API Key**

Tests iterative improvement:
- Basic reflection workflow
- Quality threshold enforcement
- Max iteration limits
- Quality improvement verification

**Run:**
```bash
node test/api/testReflectionLoop.js
```

### 8. Agent System Tests (`testAgentSystem.js`)
**Partially Requires API Key**

Tests agent infrastructure:
- Agent messenger (pub/sub communication)
- Agent tools (tool registry)
- Base agent (lifecycle, capabilities)
- Group chat orchestrator

**Run:**
```bash
node test/api/testAgentSystem.js
```

### 9. Integration Tests (`endToEndTests.js`)
**Requires OpenAI API Key**

End-to-end workflow tests:
- Create new project from scratch
- Modify existing code
- Multi-file project creation

**Run:**
```bash
npm run test:integration
# or
node test/integration/endToEndTests.js
```

## Code Validators

### `validateNoMarkdown(code)`
Checks for markdown fences (```jsx)

### `validateDoubleQuotes(code)`
Ensures double quotes instead of single quotes

### `validateFolderStructure(files)`
Verifies proper folder organization:
- `components/` for UI components
- `hooks/` for custom hooks
- `utils/` or `lib/` for helpers

### `validateImportPaths(filename, code)`
Checks correct import paths based on file location

### `validateTailwindClasses(code)`
Ensures modern Tailwind CSS classes (shadows, gradients, hover states)

### `validateSingleFileOutput(code)`
Detects multi-file concatenation issues

### `validateNoDuplicates(code)`
Checks for duplicate imports or declarations

## Test Configuration

Configuration is centralized in `test/config/testConfig.js`:

```javascript
import testConfig from './config/testConfig.js';

// API configuration
testConfig.api.hasKey()        // Check if API key is set
testConfig.api.checkAndWarn()  // Check and show warning

// Reflection modes
testConfig.reflection.fast      // No reflection, fastest
testConfig.reflection.balanced  // 2 iterations, quality 75
testConfig.reflection.highQuality // 3 iterations, quality 85

// Get test-specific config
const config = testConfig.getTestConfig('autogen');
```

## Performance & Configuration

### Speed vs Quality Trade-offs

**Fast Mode (No Reflection)**
- Generation time: 5-10s per file
- Quality: 60-75/100
- Best for: Rapid prototyping

```javascript
{ reflectionEnabled: false }
```

**Balanced Mode (Default)**
- Generation time: 10-20s per file
- Quality: 75-85/100
- Best for: Most use cases

```javascript
{
  reflectionEnabled: true,
  qualityThreshold: 75,
  maxReflectionIterations: 2
}
```

**High Quality Mode**
- Generation time: 15-30s per file
- Quality: 85-95/100
- Best for: Production code

```javascript
{
  reflectionEnabled: true,
  qualityThreshold: 85,
  maxReflectionIterations: 3
}
```

## Adding New Tests

### 1. Create Test File

```javascript
// test/api/testMyFeature.js
export async function runMyFeatureTests() {
  console.log("TEST SUITE: My Feature");

  let passed = 0;
  let failed = 0;

  try {
    // Test logic here
    passed++;
  } catch (error) {
    failed++;
  }

  return {
    totalPassed: passed,
    totalFailed: failed,
    totalTests: passed + failed
  };
}
```

### 2. Add to Unified Runner

Update `test/runAllTests.js`:

```javascript
import { runMyFeatureTests } from "./api/testMyFeature.js";

// In main() function:
const myResults = await runTestSuite("My Feature", runMyFeatureTests, hasKey);
suiteResults.push(formatResults("My Feature", myResults));
```

### 3. Add to package.json

```json
{
  "scripts": {
    "test:myfeature": "node test/api/testMyFeature.js"
  }
}
```

## Troubleshooting

### "OPENAI_API_KEY not set"
Set the environment variable:
```bash
export OPENAI_API_KEY=your_key_here
```

### Tests are slow
Agent tests make real API calls. Expected times:
- Basic tests: <5 seconds
- Agent tests: 30-60 seconds
- Integration tests: 60-120 seconds

### Inconsistent results
AI output naturally varies. Tests validate patterns, not exact matches.

### Rate limit errors
Slow down test execution or use smaller test batches.

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/tests.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### Local Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
npm run test:basic
if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi
```

## API Cost Estimates

Approximate costs per test run (with API):

| Test Suite | API Calls | Est. Cost |
|------------|-----------|-----------|
| Basic | 0 | $0.00 |
| Reliability | 0 | $0.00 |
| Orchestrator | ~10 | ~$0.02 |
| Modifications | ~8 | ~$0.015 |
| Debugger | ~6 | ~$0.012 |
| Reviewer | ~5 | ~$0.01 |
| Reflection | ~15 | ~$0.03 |
| Integration | ~20 | ~$0.04 |
| **Full Suite** | **~65** | **~$0.13** |

Costs vary based on model usage and token counts.

## Best Practices

1. ✅ Run basic tests before committing
2. ✅ Run full test suite before deploying
3. ✅ Add tests when discovering edge cases
4. ✅ Keep mock responses realistic
5. ✅ Use shared utilities to reduce duplication
6. ✅ Document test failures with clear error messages
7. ✅ Monitor API usage to control costs

## Support

For issues or questions:
1. Check test output for specific error messages
2. Review agent execution history
3. Verify API key and model access
4. Check documentation for similar issues

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure tests pass before committing
3. Update documentation
4. Add test scenarios for edge cases

---

**Last Updated:** 2025-10-11
**Version:** 1.0.0
