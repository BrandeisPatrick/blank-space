# Agent System Quick Reference

## TL;DR - What Changed?

The agent system now supports **AutoGen-inspired patterns** for better code quality and multi-agent collaboration.

### Key Features

✅ **Reflection Loop** - Code is automatically reviewed and improved
✅ **Quality Scores** - Every generated file gets a quality rating (0-100)
✅ **Agent Communication** - Agents can message each other
✅ **Tool Registry** - Agents as reusable tools
✅ **Group Chat** - Multiple agents collaborate on tasks
✅ **Extensible** - Easy to create custom agents

## Quick Start

### 1. Use Reflection Loop (Default Enabled)

```javascript
import { AgentOrchestrator } from './services/agentOrchestrator.js';

// Reflection is enabled by default
const orchestrator = new AgentOrchestrator(onUpdate);
const result = await orchestrator.processUserMessage('Create a todo app', {});

// Check quality scores
result.fileOperations.forEach(op => {
  console.log(`${op.filename}: ${op.qualityScore}/100`);
});
```

### 2. Configure Reflection

```javascript
const orchestrator = new AgentOrchestrator(onUpdate, {
  reflectionEnabled: true,        // Enable/disable
  maxReflectionIterations: 2,     // Max improvement cycles
  qualityThreshold: 75            // Minimum score to accept
});
```

### 3. Create a Custom Agent

```javascript
import { createAgent } from './services/agents/BaseAgent.js';

const myAgent = createAgent(
  'MyAgent',
  async (input) => {
    // Your logic here
    return { result: 'done' };
  },
  ['my-capability'],
  { description: 'Does something cool' }
);

await myAgent.run({ task: 'do something' });
```

### 4. Use Agent Messaging

```javascript
import { getMessenger, MessageType } from './services/agentMessenger.js';

const messenger = getMessenger();

// Subscribe to messages
messenger.subscribe(MessageType.CODE_REVIEW_REQUEST, (msg) => {
  console.log('Review requested:', msg.payload);
});

// Publish messages
await messenger.publish(
  MessageType.CODE_GENERATED,
  { code: '...' },
  { sender: 'Generator' }
);
```

### 5. Register Tools

```javascript
import { registerTool, getRegistry } from './services/agentTools.js';

registerTool('validator', async (input) => {
  return { valid: true };
}, {
  description: 'Validates code',
  capabilities: ['validation']
});

// Use tool
const registry = getRegistry();
const result = await registry.execute('validator', { code: '...' });
```

### 6. Create Group Chat

```javascript
import { createGroupChat } from './services/groupChatOrchestrator.js';

const chat = createGroupChat(['planner', 'generator', 'reviewer']);
const result = await chat.run({ task: 'Build an app' });
console.log(result.summary);
```

## File Structure

```
src/services/
├── agentOrchestrator.js         # Main orchestrator (updated)
├── agentMessenger.js             # New: Agent communication
├── agentTools.js                 # New: Tool registry
├── groupChatOrchestrator.js      # New: Group chat
└── agents/
    ├── BaseAgent.js              # New: Base agent class
    ├── reviewer.js               # New: Code reviewer
    ├── planner.js
    ├── generator.js
    ├── modifier.js
    ├── analyzer.js
    ├── debugger.js
    └── intentClassifier.js
```

## Common Patterns

### Pattern 1: Review Code Manually

```javascript
import { reviewCode } from './services/agents/reviewer.js';

const review = await reviewCode(
  code,
  'App.jsx',
  'Create a todo app'
);

if (!review.approved) {
  console.log('Issues found:', review.issues);
}
```

### Pattern 2: Request/Response Between Agents

```javascript
import { getMessenger } from './services/agentMessenger.js';

const messenger = getMessenger();

// Request analysis
const response = await messenger.request(
  'analysis-request',
  'analysis-response',
  { files: {...} },
  { timeout: 10000 }
);
```

### Pattern 3: Capability-Based Tool Selection

```javascript
import { getRegistry } from './services/agentTools.js';

const registry = getRegistry();

// Find all validators
const validators = registry.findByCapability('validation');

// Execute first validator
if (validators.length > 0) {
  const result = await validators[0].execute({ code: '...' });
}
```

### Pattern 4: Agent with Lifecycle Hooks

```javascript
import { BaseAgent } from './services/agents/BaseAgent.js';

class MyAgent extends BaseAgent {
  async beforeExecute(input) {
    console.log('Starting execution...');
  }

  async execute(input) {
    // Main logic
    return { result: 'done' };
  }

  async afterExecute(input, output) {
    console.log('Execution complete!');
  }
}

const agent = new MyAgent('MyAgent');
agent.on('after-execute', (data) => {
  // Handle event
});
```

## Configuration Options

### AgentOrchestrator Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `reflectionEnabled` | boolean | `true` | Enable reflection loop |
| `maxReflectionIterations` | number | `2` | Max improvement iterations |
| `qualityThreshold` | number | `75` | Min quality score (0-100) |

### GroupChat Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxRounds` | number | `10` | Max conversation rounds |
| `speakerSelectionStrategy` | string | `'round-robin'` | Speaker selection method |
| `terminationCondition` | function | `null` | Custom termination logic |
| `allowRepeat` | boolean | `true` | Allow same speaker twice in a row |

### BaseAgent Options

| Option | Type | Description |
|--------|------|-------------|
| `version` | string | Agent version |
| `description` | string | Agent description |
| `model` | string | LLM model (for LLMAgent) |
| `temperature` | number | LLM temperature |

## Message Types

```javascript
import { MessageType } from './services/agentMessenger.js';

MessageType.TASK_REQUEST
MessageType.TASK_RESPONSE
MessageType.CODE_GENERATED
MessageType.CODE_REVIEW_REQUEST
MessageType.CODE_REVIEW_RESPONSE
MessageType.CONSULTATION_REQUEST
MessageType.CONSULTATION_RESPONSE
MessageType.ANALYSIS_REQUEST
MessageType.ANALYSIS_RESPONSE
MessageType.STATUS_UPDATE
MessageType.ERROR
MessageType.WARNING
```

## Speaker Selection Strategies

```javascript
import { SpeakerSelectionStrategy } from './services/groupChatOrchestrator.js';

SpeakerSelectionStrategy.ROUND_ROBIN      // Agents speak in turn
SpeakerSelectionStrategy.CAPABILITY_BASED // Select by capability
SpeakerSelectionStrategy.MANUAL           // Manual selection
SpeakerSelectionStrategy.AUTO             // AI-based (future)
```

## Quality Score Guidelines

| Score | Meaning | Action |
|-------|---------|--------|
| 90-100 | Excellent, production-ready | Accept immediately |
| 75-89 | Good with minor improvements | Accept after review |
| 60-74 | Acceptable but needs work | Improve in next iteration |
| < 60 | Major issues | Reject, major revision needed |

## Best Practices

1. **Enable Reflection** - Always use reflection for production code
2. **Set Quality Threshold** - Use 75+ for production, 60+ for prototypes
3. **Limit Iterations** - Keep max iterations to 2-3 to avoid loops
4. **Use Capabilities** - Register agent capabilities for discovery
5. **Monitor Quality** - Check quality scores in results
6. **Handle Errors** - Implement error handlers on agents
7. **Clean Up** - Clear message history periodically

## Troubleshooting

### Problem: Reflection loop runs too many times
**Solution**: Lower `maxReflectionIterations` or increase `qualityThreshold`

### Problem: Code quality always low
**Solution**: Check ReviewerAgent prompts, ensure requirements are clear

### Problem: Agents can't communicate
**Solution**: Verify both agents use same messenger instance (`getMessenger()`)

### Problem: Tool not found in registry
**Solution**: Ensure tool is registered before use (`registerTool()`)

### Problem: Group chat doesn't terminate
**Solution**: Set `maxRounds` or provide `terminationCondition`

## Performance Tips

1. **Disable Reflection for Prototypes** - Set `reflectionEnabled: false`
2. **Use Smaller Models for Review** - gpt-4o-mini for ReviewerAgent
3. **Limit Message History** - Call `messenger.clearHistory()` periodically
4. **Cache Tool Results** - Implement caching in expensive tools
5. **Parallel Execution** - Use Promise.all for independent agents

## Migration Guide

### Before (Old System)
```javascript
const orchestrator = new AgentOrchestrator(onUpdate);
const result = await orchestrator.processUserMessage('Create app', {});
```

### After (With Reflection)
```javascript
// Default: Reflection enabled
const orchestrator = new AgentOrchestrator(onUpdate);
const result = await orchestrator.processUserMessage('Create app', {});

// Check quality
console.log('Quality:', result.fileOperations[0].qualityScore);

// Disable if needed
const orchNoReflection = new AgentOrchestrator(onUpdate, {
  reflectionEnabled: false
});
```

## Advanced Examples

See [AUTOGEN_IMPROVEMENTS.md](./AUTOGEN_IMPROVEMENTS.md) for detailed examples including:
- Custom agents with BaseAgent
- Multi-agent consultation patterns
- Group chat workflows
- Event-driven agent collaboration

## API Reference

### AgentOrchestrator
- `processUserMessage(message, files)` - Main entry point
- `generateCodeWithReflection(plan, message, filename)` - Generate with review
- `handleBugFix(message, files)` - Bug fixing workflow

### ReviewerAgent
- `reviewCode(code, filename, request, spec)` - Review code
- `generateImprovementInstructions(review, code)` - Create feedback
- `hasImproved(prev, current)` - Check improvement
- `aggregateReviews(reviews)` - Combine reviews

### AgentMessenger
- `subscribe(topic, handler, options)` - Subscribe to messages
- `publish(topic, message, metadata)` - Publish message
- `request(reqTopic, resTopic, message, options)` - Request/response
- `getHistory(filters)` - Get message history

### AgentToolRegistry
- `register(tool)` - Register tool
- `get(name)` - Get tool by name
- `execute(name, input)` - Execute tool
- `findByCapability(cap)` - Find by capability
- `search(query)` - Search tools

### GroupChat
- `addAgent(agent)` - Add agent to chat
- `run(initialMessage, firstSpeaker)` - Run conversation
- `setContext(key, value)` - Set shared context
- `getHistory(filters)` - Get conversation history

## Support

For issues or questions:
1. Check [AUTOGEN_IMPROVEMENTS.md](./AUTOGEN_IMPROVEMENTS.md)
2. Review code examples in test files
3. Check agent execution history: `agent.getHistory()`
4. Check messenger stats: `messenger.getStats()`
