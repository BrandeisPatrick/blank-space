# AI Agents System

A comprehensive, provider-agnostic AI agent system for building intelligent workflows and automating complex tasks.

## Overview

This package provides a complete multi-agent architecture that replaces scattered custom prompts with a unified, orchestrated system. It enables complex workflows by coordinating specialized AI agents that can work together to accomplish sophisticated tasks.

## Key Features

- 🤖 **7 Specialized Agents** - Each optimized for specific tasks
- 🔄 **Multi-Agent Workflows** - Complex tasks coordinated across multiple agents
- 🌐 **Provider Agnostic** - Works with any AI provider (OpenAI, Anthropic, Groq, etc.)
- 📊 **Context Management** - Stateful conversations and workflow coordination
- 🎯 **Event-Driven Architecture** - Real-time progress tracking and error handling
- 🧪 **Comprehensive Testing** - Built-in validation and quality assurance
- 📚 **Complete Documentation** - Auto-generated docs and examples

## Available Agents

### Core Agents
- **Intent Classification** - Analyzes user messages and determines appropriate response strategies
- **Framework Advisor** - AI-powered framework recommendations with deep analysis
- **Website Generation** - Creates complete websites from natural language descriptions
- **Chat Assistant** - Friendly, context-aware conversational AI

### Advanced Agents
- **Workflow Orchestration** - Plans and executes complex multi-step workflows
- **Code Review** - Analyzes code for quality, security, performance, and best practices
- **Documentation** - Generates comprehensive project documentation

## Quick Start

### Installation

```bash
npm install @your-org/ai-agents
```

### Basic Usage

```typescript
import { createAgentSystem } from '@your-org/ai-agents';

// Initialize with your AI provider
const aiProvider = new YourAIProvider();
const { manager, contextManager, workflowManager } = createAgentSystem(aiProvider);

// Execute a single agent
const result = await manager.executeAgent('chat-assistant', {
  message: 'Help me build a React application',
  context: { responseMode: 'explain-first' }
});

// Execute a complete workflow
const workflowResult = await workflowManager.executeECommerceWorkflow(
  'Build an e-commerce site with user authentication and payment processing'
);
```

### Multi-Agent Workflow Example

```typescript
// Create an e-commerce website with full quality review and documentation
const workflow = createECommerceWorkflow(
  'Build a modern e-commerce site with shopping cart, user auth, and payment processing'
);

const result = await manager.executeWorkflow(workflow, {}, context);

// The workflow automatically:
// 1. Analyzes user intent
// 2. Recommends appropriate technology stack  
// 3. Generates website code
// 4. Reviews code for quality/security
// 5. Creates comprehensive documentation
// 6. Provides deployment guidance
```

## Agent Capabilities

### 1. Intent Classification Agent
```typescript
const result = await manager.executeAgent('intent-classification', {
  message: 'I want to create a portfolio website',
  responseMode: 'show-options'
});
// Returns: intent, confidence, reasoning, execution recommendations
```

### 2. Framework Advisor Agent
```typescript
const result = await manager.executeAgent('framework-advisor', {
  prompt: 'I need a fast e-commerce site with SEO support',
  requirements: {
    projectType: 'e-commerce',
    performance: { priority: 'high', seo: true }
  }
});
// Returns: framework recommendations, pros/cons, implementation guidance
```

### 3. Website Generation Agent
```typescript
const result = await manager.executeAgent('website-generation', {
  prompt: 'Create a responsive landing page for a SaaS product',
  framework: 'react',
  device: 'desktop'
});
// Returns: complete HTML, CSS, JavaScript code
```

### 4. Code Review Agent
```typescript
const result = await manager.executeAgent('code-review', {
  code: yourCode,
  language: 'javascript',
  reviewType: 'thorough',
  context: { framework: 'react', environment: 'production' }
});
// Returns: quality score, issues, suggestions, improved code
```

### 5. Documentation Agent
```typescript
const result = await manager.executeAgent('documentation', {
  projectInfo: { name: 'MyApp', description: 'A great app' },
  documentationType: 'readme',
  audience: 'developers'
});
// Returns: comprehensive markdown documentation
```

## Pre-Built Workflows

### E-Commerce Website Creation
Complete e-commerce site with framework selection, code generation, quality review, and documentation.

```typescript
await workflowManager.executeECommerceWorkflow(
  'Build an online store with product catalog, shopping cart, and payment processing',
  'user-123',
  (step, progress) => console.log(`${step}: ${progress}%`)
);
```

### Code Quality Improvement  
Comprehensive code analysis with security, performance, and maintainability improvements.

```typescript
await workflowManager.executeCodeQualityWorkflow(
  codeToImprove,
  'javascript', 
  'MyProject'
);
```

### Complete Project Setup
End-to-end project creation from requirements analysis to deployment-ready code.

```typescript
await workflowManager.executeCompleteProjectWorkflow(
  'Create a task management app with real-time collaboration'
);
```

### Portfolio Website Creation
Professional portfolio with accessibility review and user guides.

```typescript
await workflowManager.executePortfolioWorkflow(
  'Frontend Developer',
  ['About', 'Projects', 'Skills', 'Contact'],
  'modern minimalist'
);
```

## Advanced Features

### Context Management
```typescript
// Create persistent conversation context
const context = await contextManager.createContext();

// Maintain state across multiple agent interactions
await contextManager.setVariable(context.sessionId, 'userPreferences', {
  framework: 'react',
  experience: 'intermediate'
});

// Agents can access shared context
const result = await manager.executeAgent('framework-advisor', input, context);
```

### Event Tracking
```typescript
// Monitor workflow progress
manager.on('workflow.step.started', (event) => {
  console.log(`Starting step: ${event.stepId}`);
});

manager.on('workflow.step.completed', (event) => {
  console.log(`Completed step: ${event.stepId}`, event.data);
});
```

### Custom Workflows
```typescript
const customWorkflow: Workflow = {
  id: 'my-custom-workflow',
  name: 'Custom Development Workflow',
  steps: [
    {
      id: 'analyze',
      agentId: 'intent-classification',
      input: { message: '${userRequest}' }
    },
    {
      id: 'recommend',
      agentId: 'framework-advisor', 
      input: { prompt: '${analyze}' }
    },
    {
      id: 'generate',
      agentId: 'website-generation',
      input: { 
        prompt: '${userRequest}',
        framework: '${recommend.primary.framework.id}'
      }
    }
  ]
};

await manager.executeWorkflow(customWorkflow, { userRequest: 'Build a blog' });
```

## Integration Examples

### Express.js API Integration
```typescript
app.post('/api/generate-website', async (req, res) => {
  try {
    const { description, framework } = req.body;
    
    const result = await manager.executeAgent('website-generation', {
      prompt: description,
      framework,
      device: 'desktop'
    });

    if (result.success) {
      res.json({ 
        html: result.data.html,
        css: result.data.css,
        js: result.data.js 
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Agent execution failed' });
  }
});
```

### React Component Integration
```tsx
import { createAgentSystem } from '@your-org/ai-agents';

export function AIWebsiteBuilder() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (prompt: string) => {
    setLoading(true);
    
    const { workflowManager } = createAgentSystem(aiProvider);
    
    const result = await workflowManager.executeCompleteProjectWorkflow(
      prompt,
      (step, progress) => {
        console.log(`${step}: ${progress}%`);
      }
    );
    
    setResult(result);
    setLoading(false);
  };

  return (
    <div>
      <textarea 
        placeholder="Describe your website..."
        onBlur={(e) => handleGenerate(e.target.value)}
      />
      {loading && <div>Building your website...</div>}
      {result && <CodeDisplay result={result} />}
    </div>
  );
}
```

## Architecture Benefits

### Immediate Wins
- ✅ **90% code reduction** - Single agents replace duplicated prompts across providers
- ✅ **Consistent behavior** - Same logic regardless of AI provider
- ✅ **Easier maintenance** - Change logic in one place
- ✅ **Better error handling** - Agent-specific fallbacks and retries

### Long-term Advantages
- 🔄 **Composable workflows** - Mix and match agents for complex tasks
- 🧠 **Context-aware interactions** - Agents learn and improve over time
- 🚀 **Easy extensibility** - Add new capabilities as separate agents
- 🔍 **Better testing** - Isolated agent testing and debugging
- 📈 **Scalable architecture** - Grows with your needs

### Technical Benefits
- 🔌 **Provider independence** - Switch AI providers without changing logic
- ⚡ **Dynamic optimization** - Prompts optimized based on success patterns
- 💾 **Stateful conversations** - Proper context management across interactions
- 🏗️ **Modular architecture** - Easy to extend and maintain

## Configuration

### Environment Setup
```env
# AI Provider Configuration
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key
GROQ_API_KEY=your-key

# Agent Configuration
AGENT_TIMEOUT=60000
AGENT_RETRIES=3
ENABLE_CONTEXT_PERSISTENCE=true
```

### Custom Agent Registration
```typescript
import { DefaultAgentRegistry } from '@your-org/ai-agents';

const registry = new DefaultAgentRegistry();

// Register custom agent
registry.register({
  config: {
    id: 'my-custom-agent',
    name: 'Custom Agent',
    description: 'Does custom things',
    capabilities: ['custom-capability']
  },
  factory: (provider) => new MyCustomAgent(provider)
});
```

## API Reference

### AgentManager
- `executeAgent<T>(agentId, input, context)` - Execute single agent
- `executeWorkflow(workflow, initialInput, context)` - Execute multi-step workflow
- `on(eventType, listener)` - Subscribe to agent events
- `healthCheck()` - Check agent system health

### ContextManager  
- `createContext(sessionId?, metadata?)` - Create conversation context
- `setVariable(sessionId, key, value)` - Store workflow variables
- `getVariable(sessionId, key)` - Retrieve workflow variables
- `addMessage(sessionId, message)` - Add message to conversation history

### ExampleWorkflowManager
- `executeECommerceWorkflow(request, userId?, callback?)` - E-commerce creation
- `executeCodeQualityWorkflow(code, language, projectName)` - Code improvement  
- `executeCompleteProjectWorkflow(description)` - Full project setup
- `executePortfolioWorkflow(profession, sections, style)` - Portfolio creation

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and contribution guidelines.

## License

MIT - see [LICENSE](./LICENSE) for details.