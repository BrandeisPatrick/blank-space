# AI Coding System

A modular AI-powered coding assistant inspired by Gemini CLI architecture, built with React AI SDK for multi-model support and step-by-step reasoning capabilities.

## Architecture Overview

The system is built with a clean layered architecture separating concerns:

### 1. CLI Entry Layer (`packages/cli-interface`)
- **Terminal UI Management**: Interactive command-line interface
- **Input/Output Formatting**: Rich terminal output with colors and animations  
- **History Management**: Command history with search and statistics
- **Configuration Management**: Provider setup and user preferences
- **Theming**: Dark/light theme support

### 2. Core Engine Layer (`packages/agent-engine`)
- **Provider Manager**: Multi-model support via React AI SDK
- **Model Router**: Task-specific model selection (GPT-5 for planning, Groq for code generation, etc.)
- **Prompt Generation System**: Template-based prompt management
- **State Management**: Session and execution state tracking
- **Tool Invocation Logic**: Structured execution framework

### 3. ReAct Loop & Tooling Layer (`packages/react-reasoning`)
- **Reasoning Engine**: Step-by-step thought process (ReAct pattern)
- **Plan Executor**: Task decomposition and execution
- **Grounding System**: Web search and documentation lookup
- **Tool Integration**: File system, command execution, Git operations
- **Safety Controls**: Dangerous operation prevention and confirmation

### 4. Legacy Compatibility (`packages/ai-agents`)
- **Adapter Layer**: Bridges old agents with new engine
- **Workflow Support**: Pre-built workflows for common tasks
- **Specialized Agents**: Code review, documentation, framework advice

## Key Features

### Multi-Model Intelligence
- **OpenAI**: Planning and conversation tasks
- **Groq**: Fast code generation and execution
- **Anthropic**: Code review and documentation
- **Task-Specific Routing**: Automatic model selection based on task type

### Gemini CLI-Inspired Interface
- **Step-by-step reasoning**: Transparent thought process
- **Interactive mode**: Confirmation prompts for safety
- **Streaming output**: Real-time reasoning display
- **Rich terminal UI**: Colors, animations, and progress indicators

### Advanced Capabilities
- **Tool Integration**: File operations, command execution, Git workflows
- **Grounding**: Web search and documentation lookup for context
- **Session Management**: Persistent state across interactions
- **History Tracking**: Command history with analytics
- **Safety Controls**: Dangerous operation detection and prevention

## Quick Start

### 1. Installation
```bash
# Install dependencies
npm install

# Build the AI system
npm run build:ai-system
```

### 2. Configuration
```bash
# Interactive setup
npm run ai-code config setup

# Or set providers directly
npm run ai-code config set-provider --provider openai --api-key YOUR_KEY
npm run ai-code config set-provider --provider groq --api-key YOUR_KEY
```

### 3. Usage Examples

#### Code Generation
```bash
# Generate a React component
npm run ai-code code "Create a responsive React component for a todo list with TypeScript"

# Build a full feature with streaming output
npm run ai-code code --stream "Implement user authentication with JWT tokens"
```

#### Interactive Mode
```bash
# Interactive mode with confirmations
npm run ai-code code --interactive "Refactor this Express.js API to use TypeScript"
```

#### Configuration Management
```bash
# View current config
npm run ai-code config show

# Set defaults
npm run ai-code config defaults --max-steps 15 --dangerous --temperature 0.2

# View command history
npm run ai-code history list
npm run ai-code history stats
```

## Environment Variables

```bash
# AI Provider Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key  
GROQ_API_KEY=your_groq_key

# Optional: Custom base URLs
OPENAI_BASE_URL=https://api.openai.com/v1
ANTHROPIC_BASE_URL=https://api.anthropic.com
GROQ_BASE_URL=https://api.groq.com/openai/v1

# Optional: Default models
OPENAI_DEFAULT_MODEL=gpt-4o
ANTHROPIC_DEFAULT_MODEL=claude-3-5-sonnet-20241022
GROQ_DEFAULT_MODEL=llama-3.1-70b-versatile
```

## Advanced Usage

### Programmatic API
```typescript
import { 
  createAICodingSystem, 
  createDevelopmentSystem 
} from '@ui-grid-ai/ai-coding-system';

// Create configured system
const system = createDevelopmentSystem();

// Execute reasoning task
const result = await system.reasoningSystem.executeTask(
  "Create a RESTful API endpoint for user management"
);

// Check system health
const health = await system.healthCheck();
console.log('System ready:', health.overall);
```

### Custom Tool Integration
```typescript
import { DefaultToolRegistry, BaseTool } from '@ui-grid-ai/react-reasoning';

// Create custom tool
class DatabaseTool extends BaseTool {
  // Implementation
}

// Register with reasoning system
const system = createDevelopmentSystem();
const toolRegistry = system.reasoningSystem.getToolRegistry();
toolRegistry.register(new DatabaseTool());
```

### Provider-Specific Routing
```typescript
// Route specific tasks to preferred providers
const modelRouter = system.agentEngine.getModelRouter();

// Use GPT-4 for planning
modelRouter.updateTaskProvider(TaskType.PLANNING, 'openai');

// Use Groq for fast code generation  
modelRouter.updateTaskProvider(TaskType.CODE_GENERATION, 'groq');

// Use Claude for code review
modelRouter.updateTaskProvider(TaskType.CODE_REVIEW, 'anthropic');
```

## Development

### Package Structure
```
packages/
├── agent-engine/          # Core orchestration layer
│   ├── src/providers/      # AI SDK integrations
│   ├── src/prompts/        # Template management
│   └── src/state/          # Session management
├── react-reasoning/        # ReAct reasoning implementation  
│   ├── src/reasoning/      # ReAct loop engine
│   ├── src/tools/          # Tool implementations
│   └── src/grounding/      # Context grounding
├── cli-interface/          # Terminal interface
│   ├── src/commands/       # CLI commands
│   ├── src/config/         # Configuration
│   └── src/utils/          # Output formatting
├── ai-agents/              # Legacy compatibility
│   └── src/adapters/       # Bridge to new system
└── ai-coding-system/       # Integration layer
    └── src/system.ts       # Unified system factory
```

### Building and Testing
```bash
# Build individual packages
npm run build --workspace=packages/agent-engine
npm run build --workspace=packages/react-reasoning

# Build entire system
npm run build:ai-system

# Run tests
npm run test --workspace=packages/agent-engine
npm run test

# Type checking
npm run typecheck
```

### Contributing
1. Each layer is independently testable
2. Use the adapter pattern for integrations
3. Follow the established provider interface
4. Add comprehensive error handling
5. Document new tools and capabilities

## Architecture Benefits

### Separation of Concerns
- **CLI Layer**: Pure UI concerns
- **Engine Layer**: AI orchestration and routing  
- **Reasoning Layer**: Step-by-step problem solving
- **Legacy Layer**: Backward compatibility

### Multi-Model Optimization
- **Task-Specific Models**: Best model for each job type
- **Cost Optimization**: Use cheaper models where appropriate
- **Performance**: Route to fastest models for real-time tasks
- **Fallback Support**: Graceful degradation when providers fail

### Extensibility
- **Tool System**: Easy to add new capabilities
- **Provider System**: Simple to integrate new AI models
- **Command System**: Straightforward CLI extension
- **Workflow System**: Reusable task automation

### Safety and Reliability
- **Confirmation System**: User approval for dangerous operations
- **Error Handling**: Graceful failure recovery
- **Session Management**: Reliable state tracking
- **Audit Trail**: Complete operation history

This architecture provides a robust foundation for AI-powered development tools while maintaining the flexibility to adapt to new models and capabilities as they become available.