# AutoGen-Inspired Agent System Improvements

This document describes the AutoGen-inspired improvements made to the agent system, including reflection patterns, multi-agent collaboration, and extensible architecture.

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Reflection & Iterative Refinement](#phase-1-reflection--iterative-refinement)
3. [Phase 2: Agent Communication](#phase-2-agent-communication)
4. [Phase 3: Tool-Based Agents](#phase-3-tool-based-agents)
5. [Phase 4: Group Chat](#phase-4-group-chat)
6. [Usage Examples](#usage-examples)
7. [Configuration](#configuration)

## Overview

The agent system has been enhanced with patterns inspired by Microsoft AutoGen:

- **Reflection Pattern**: Generator-Reviewer cycles for iterative code improvement
- **Event-Driven Communication**: Pub/sub messaging between agents
- **Tool-Based Agents**: Agents as reusable tools
- **Group Chat**: Multi-agent collaboration
- **Extensible Architecture**: BaseAgent class for easy agent creation

## Phase 1: Reflection & Iterative Refinement

### ReviewerAgent

The ReviewerAgent critiques generated code and provides specific feedback for improvements.

**File**: `src/services/agents/reviewer.js`

**Key Functions**:
- `reviewCode()` - Reviews code and assigns quality score (0-100)
- `generateImprovementInstructions()` - Creates feedback for generator
- `hasImproved()` - Checks if code improved between iterations
- `aggregateReviews()` - Combines reviews for multiple files

**Example**:
```javascript
import { reviewCode } from './services/agents/reviewer.js';

const review = await reviewCode(
  generatedCode,
  'App.jsx',
  'Create a todo app',
  { purpose: 'Main app component' }
);

console.log(`Quality Score: ${review.qualityScore}/100`);
console.log(`Approved: ${review.approved}`);
console.log(`Issues:`, review.issues);
```

### Reflection Loop in AgentOrchestrator

The orchestrator now implements a Generator → Reviewer → Generator cycle.

**Configuration Options**:
```javascript
const orchestrator = new AgentOrchestrator(onUpdate, {
  reflectionEnabled: true,        // Enable/disable reflection
  maxReflectionIterations: 2,     // Max improvement iterations
  qualityThreshold: 75            // Minimum quality score to accept
});
```

**How It Works**:
1. Generator creates initial code
2. Reviewer evaluates code and provides feedback
3. If quality < threshold, Generator improves based on feedback
4. Repeat until approved or max iterations reached

**Benefits**:
- Higher code quality
- Fewer bugs and issues
- Better adherence to requirements
- Automatic iterative improvement

## Phase 2: Agent Communication

### AgentMessenger

Event-driven pub/sub messaging system for agent communication.

**File**: `src/services/agentMessenger.js`

**Key Features**:
- Topic-based messaging
- Request/response pattern
- Message history and replay
- Middleware support
- Filter and once subscriptions

**Example**:
```javascript
import { getMessenger, MessageType } from './services/agentMessenger.js';

const messenger = getMessenger();

// Subscribe to messages
messenger.subscribe(MessageType.CODE_REVIEW_REQUEST, async (message) => {
  console.log('Review requested:', message.payload);
  // Handle review...
});

// Publish messages
await messenger.publish(
  MessageType.CODE_GENERATED,
  { filename: 'App.jsx', code: '...' },
  { sender: 'Generator' }
);

// Request/response pattern
const response = await messenger.request(
  MessageType.ANALYSIS_REQUEST,
  MessageType.ANALYSIS_RESPONSE,
  { files: {...} },
  { timeout: 10000 }
);
```

**Message Types**:
- `TASK_REQUEST`, `TASK_RESPONSE`, `TASK_COMPLETE`
- `CODE_GENERATED`, `CODE_REVIEW_REQUEST`, `CODE_REVIEW_RESPONSE`
- `CONSULTATION_REQUEST`, `CONSULTATION_RESPONSE`
- `ANALYSIS_REQUEST`, `ANALYSIS_RESPONSE`
- `STATUS_UPDATE`, `PROGRESS_UPDATE`
- `ERROR`, `WARNING`

## Phase 3: Tool-Based Agents

### BaseAgent Class

Foundation for all agents with standardized interface and lifecycle hooks.

**File**: `src/services/agents/BaseAgent.js`

**Features**:
- Capability registration
- Event emission
- Lifecycle hooks (beforeExecute, afterExecute, onError)
- Execution history
- Convert to tool

**Example**:
```javascript
import { BaseAgent, LLMAgent, createAgent } from './services/agents/BaseAgent.js';

// Create a simple agent
const myAgent = createAgent(
  'MyAgent',
  async (input) => {
    // Agent logic here
    return { result: 'done' };
  },
  ['code-analysis', 'validation'],
  { description: 'My custom agent' }
);

// Listen to events
myAgent.on('after-execute', (data) => {
  console.log('Agent executed:', data);
});

// Run agent
const result = await myAgent.run({ task: 'analyze' });

// Convert to tool
const tool = myAgent.asTool();
```

### AgentTool & Registry

System for registering and discovering agents as callable tools.

**File**: `src/services/agentTools.js`

**Example**:
```javascript
import { registerTool, getRegistry } from './services/agentTools.js';

// Register a tool
registerTool(
  'code-validator',
  async (input) => {
    // Validation logic
    return { valid: true, errors: [] };
  },
  {
    description: 'Validates code syntax and structure',
    capabilities: ['validation'],
    category: 'quality'
  }
);

// Use a tool
const registry = getRegistry();
const result = await registry.execute('code-validator', { code: '...' });

// Find tools by capability
const validators = registry.findByCapability('validation');

// Search tools
const tools = registry.search('validator');
```

## Phase 4: Group Chat

### GroupChat & GroupChatOrchestrator

Multi-agent conversations with shared context.

**File**: `src/services/groupChatOrchestrator.js`

**Features**:
- Multiple agents in single conversation
- Speaker selection strategies
- Shared context
- Conversation history
- Termination conditions

**Example**:
```javascript
import { createGroupChat, SpeakerSelectionStrategy } from './services/groupChatOrchestrator.js';

// Create group chat
const chat = createGroupChat(
  ['planner', 'generator', 'reviewer'],
  {
    maxRounds: 10,
    speakerSelectionStrategy: SpeakerSelectionStrategy.CAPABILITY_BASED,
    terminationCondition: (chat) => {
      // Stop if all agents approved
      return chat.getContext('allApproved') === true;
    }
  }
);

// Set shared context
chat.setContext('userRequest', 'Build a todo app');
chat.setContext('requirements', [...]);

// Run conversation
const result = await chat.run(
  { task: 'Create a React todo application' },
  'planner' // First speaker
);

console.log('Conversation summary:', result.summary);
console.log('Total rounds:', result.rounds);
```

**Speaker Selection Strategies**:
- `ROUND_ROBIN` - Agents speak in turn
- `CAPABILITY_BASED` - Select based on required capability
- `MANUAL` - Manually specify next speaker
- `AUTO` - AI-based selection (future)

## Usage Examples

### Example 1: Code Generation with Reflection

```javascript
import { AgentOrchestrator } from './services/agentOrchestrator.js';

const orchestrator = new AgentOrchestrator(
  (update) => console.log(update),
  {
    reflectionEnabled: true,
    maxReflectionIterations: 2,
    qualityThreshold: 80
  }
);

const result = await orchestrator.processUserMessage(
  'Create a todo app with dark mode',
  {}
);

// Result includes quality scores
result.fileOperations.forEach(op => {
  console.log(`${op.filename}: Quality ${op.qualityScore}/100`);
  console.log(`Iterations: ${op.reflectionHistory.length}`);
});
```

### Example 2: Custom Agent with BaseAgent

```javascript
import { LLMAgent } from './services/agents/BaseAgent.js';
import { openai } from './services/utils/openaiClient.js';

class CustomAnalyzer extends LLMAgent {
  constructor() {
    super('CustomAnalyzer', {
      model: 'gpt-4o',
      temperature: 0.3,
      description: 'Custom code analyzer',
      systemPrompt: 'You are a code analysis expert.'
    });

    this.registerCapability('analysis');
    this.registerCapability('pattern-detection');
  }

  async execute(input) {
    const { model, max_tokens, temperature } = this.getLLMParams();
    const messages = this.createMessages(input.code);

    const response = await openai.chat.completions.create({
      model,
      messages,
      max_tokens,
      temperature
    });

    return JSON.parse(response.choices[0].message.content);
  }
}

// Use the custom agent
const analyzer = new CustomAnalyzer();
const analysis = await analyzer.run({ code: '...' });
```

### Example 3: Multi-Agent Consultation

```javascript
import { getMessenger, MessageType } from './services/agentMessenger.js';
import { getRegistry } from './services/agentTools.js';

// Generator requests analysis from Analyzer
const messenger = getMessenger();

// In Generator agent:
const analysisResponse = await messenger.request(
  MessageType.ANALYSIS_REQUEST,
  MessageType.ANALYSIS_RESPONSE,
  {
    code: generatedCode,
    question: 'Are there any performance issues?'
  },
  { timeout: 15000 }
);

console.log('Analysis:', analysisResponse.payload);

// In Analyzer agent:
messenger.subscribe(MessageType.ANALYSIS_REQUEST, async (message) => {
  const analysis = await analyzeCode(message.payload.code);

  await messenger.publish(
    MessageType.ANALYSIS_RESPONSE,
    analysis,
    {
      correlationId: message.metadata.correlationId,
      sender: 'Analyzer'
    }
  );
});
```

### Example 4: Group Chat for Complex Task

```javascript
import { createGroupChat } from './services/groupChatOrchestrator.js';
import { registerTools, agentToTool } from './services/agentTools.js';

// Register agents as tools
registerTools([
  agentToTool(plannerAgent),
  agentToTool(generatorAgent),
  agentToTool(reviewerAgent),
  agentToTool(validatorAgent)
]);

// Create group chat
const chat = createGroupChat(
  ['planner', 'generator', 'reviewer', 'validator'],
  {
    maxRounds: 15,
    speakerSelectionStrategy: 'capability-based'
  }
);

// Run collaborative task
const result = await chat.run({
  task: 'Create a full-stack e-commerce application',
  requirements: [
    'User authentication',
    'Product catalog',
    'Shopping cart',
    'Checkout flow'
  ]
});

// Review conversation
console.log(result.summary);
chat.getHistory().forEach(msg => {
  console.log(`${msg.speaker}:`, msg.message);
});
```

## Configuration

### Environment Variables

You can configure agent behavior with environment variables:

```env
# Model selection
MODEL_GENERATOR=gpt-4o
MODEL_MODIFIER=gpt-4o
MODEL_PLANNER=gpt-4o
MODEL_ANALYZER=gpt-4o-mini

# Reflection settings (set in code)
REFLECTION_ENABLED=true
MAX_REFLECTION_ITERATIONS=2
QUALITY_THRESHOLD=75
```

### Orchestrator Options

```javascript
const options = {
  // Reflection settings
  reflectionEnabled: true,
  maxReflectionIterations: 2,
  qualityThreshold: 75,

  // Communication settings
  messenger: customMessenger,
  toolRegistry: customRegistry
};

const orchestrator = new AgentOrchestrator(onUpdate, options);
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   AgentOrchestrator                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Reflection Loop                                   │  │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐   │  │
│  │  │Generator │───▶│ Reviewer │───▶│Generator │   │  │
│  │  └──────────┘    └──────────┘    └──────────┘   │  │
│  │       ▲                                  │         │  │
│  │       └──────────────────────────────────┘         │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    AgentMessenger                        │
│  (Event-driven pub/sub communication)                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │ Agent A │──│ Agent B │──│ Agent C │──│ Agent D │  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   AgentToolRegistry                      │
│  - Tool discovery                                        │
│  - Capability-based search                              │
│  - Dynamic tool composition                             │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│               GroupChatOrchestrator                      │
│  Multi-agent conversations with shared context          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Speaker Selection → Agent Execution → Context   │  │
│  │  Update → Next Speaker → ...                     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Benefits Summary

1. **Higher Code Quality**: Reflection loop catches and fixes issues
2. **Flexible Collaboration**: Agents can request help from specialists
3. **Extensibility**: Easy to add new specialized agents
4. **Loose Coupling**: Event-driven architecture reduces dependencies
5. **Reusability**: Agents as tools can be composed dynamically
6. **Scalability**: Supports complex multi-agent workflows
7. **Observability**: Rich history and statistics

## Future Enhancements

- **Nested Conversations**: Sub-workflows within larger workflows
- **AI-based Speaker Selection**: Intelligent next-speaker selection
- **Human-in-the-Loop**: Built-in approval gates
- **Agent Memory**: Persistent learning across sessions
- **Performance Optimization**: Parallel agent execution
- **Advanced Termination**: ML-based conversation completion detection

## References

- [Microsoft AutoGen](https://github.com/microsoft/autogen)
- [AutoGen Documentation](https://microsoft.github.io/autogen/)
- [AutoGen Research Paper](https://arxiv.org/abs/2308.08155)
