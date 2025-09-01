# Codegen Prompts

AI prompt templates and management system for UI Grid AI.

## Overview

Codegen Prompts provides a sophisticated template system for managing AI prompts used in code generation. It handles prompt optimization, context injection, and provider-specific formatting to maximize AI output quality.

## Features

- 📝 Template-based prompt system
- 🎯 Context-aware prompt generation
- 🔄 Provider-specific formatting
- 📊 Prompt optimization and A/B testing
- 🧠 Context injection and management
- 📈 Performance tracking

## Installation

```bash
npm install @ui-grid-ai/codegen-prompts
```

## Usage

```typescript
import { PromptManager, PromptTemplate } from '@ui-grid-ai/codegen-prompts';

// Initialize prompt manager
const promptManager = new PromptManager();

// Generate React component prompt
const prompt = await promptManager.generatePrompt('react-component', {
  componentName: 'Button',
  props: ['variant', 'size', 'onClick'],
  styling: 'tailwind'
});

console.log(prompt);
```

## API Reference

### PromptManager

Main class for managing and generating prompts.

#### Methods

- `generatePrompt(templateId, context)` - Generate prompt from template
- `registerTemplate(template)` - Register new prompt template
- `getTemplate(id)` - Get template by ID
- `listTemplates()` - List all available templates
- `optimizePrompt(prompt, metrics)` - Optimize prompt based on performance
- `formatForProvider(prompt, provider)` - Format prompt for specific AI provider

### PromptTemplate

Interface for prompt templates.

```typescript
interface PromptTemplate {
  id: string;                    // Unique template identifier
  name: string;                  // Human-readable name
  description: string;           // Template description
  category: 'component' | 'layout' | 'styling' | 'logic'; // Template category
  template: string;              // Prompt template with placeholders
  variables: PromptVariable[];   // Template variables
  examples?: PromptExample[];    // Example inputs/outputs
  provider?: string;             // Target AI provider
  version: string;               // Template version
}
```

### PromptVariable

Template variable definition.

```typescript
interface PromptVariable {
  name: string;                  // Variable name
  type: 'string' | 'array' | 'object' | 'boolean'; // Variable type
  description: string;           // Variable description
  required: boolean;             // Whether variable is required
  default?: any;                 // Default value
  validation?: ValidationRule;   // Validation rules
}
```

## Built-in Templates

### React Component Generation

Generate React components with proper TypeScript types:

```typescript
const componentPrompt = await promptManager.generatePrompt('react-component', {
  componentName: 'Button',
  props: ['variant', 'size', 'disabled'],
  styling: 'tailwind',
  typescript: true,
  accessibility: true
});
```

### Layout Generation

Generate page layouts from descriptions:

```typescript
const layoutPrompt = await promptManager.generatePrompt('page-layout', {
  pageType: 'landing',
  sections: ['hero', 'features', 'cta'],
  responsive: true,
  framework: 'react'
});
```

### Styling Prompts

Generate CSS and styling code:

```typescript
const stylingPrompt = await promptManager.generatePrompt('component-styles', {
  component: 'Card',
  framework: 'tailwind',
  theme: 'modern',
  responsive: true
});
```

### Logic Generation

Generate component logic and interactions:

```typescript
const logicPrompt = await promptManager.generatePrompt('component-logic', {
  componentType: 'Form',
  interactions: ['validation', 'submission'],
  stateManagement: 'hooks'
});
```

## Template System

### Template Syntax

Templates use a flexible placeholder syntax:

```typescript
const template = `
Create a {{componentType}} component named {{componentName}}.

{{#if typescript}}
Use TypeScript with proper type definitions.
{{/if}}

Props:
{{#each props}}
- {{name}}: {{type}} {{#if required}}(required){{/if}}
{{/each}}

{{#if styling}}
Use {{styling}} for styling.
{{/if}}
`;
```

### Context Injection

Automatically inject relevant context:

```typescript
const context = {
  // Project context
  framework: 'react',
  typescript: true,
  styling: 'tailwind',
  
  // Component context
  componentName: 'Button',
  props: [
    { name: 'variant', type: 'string', required: false },
    { name: 'onClick', type: 'function', required: false }
  ],
  
  // Design system context
  designTokens: {
    colors: ['primary', 'secondary'],
    spacing: ['sm', 'md', 'lg']
  }
};
```

### Template Inheritance

Templates can extend other templates:

```typescript
const baseTemplate = {
  id: 'react-base',
  template: 'Create a React component...'
};

const buttonTemplate = {
  id: 'react-button',
  extends: 'react-base',
  template: '{{> react-base}} Make it a button with...'
};
```

## Provider Optimization

### Provider-Specific Formatting

Different AI providers respond better to different prompt formats:

```typescript
// OpenAI optimized
const openaiPrompt = promptManager.formatForProvider(basePrompt, 'openai');

// Anthropic optimized  
const anthropicPrompt = promptManager.formatForProvider(basePrompt, 'anthropic');

// Groq optimized
const groqPrompt = promptManager.formatForProvider(basePrompt, 'groq');
```

### Provider Configurations

```typescript
interface ProviderConfig {
  provider: string;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  formatting: {
    codeBlocks: boolean;
    examples: boolean;
    stepByStep: boolean;
  };
}
```

## Prompt Optimization

### A/B Testing

Test different prompt variations:

```typescript
const variants = [
  { id: 'v1', prompt: 'Create a button component...' },
  { id: 'v2', prompt: 'Generate a React button...' }
];

const optimization = await promptManager.runABTest(variants, {
  metric: 'code_quality',
  sampleSize: 100
});
```

### Performance Metrics

Track prompt performance:

- **Success rate** - Percentage of valid code generated
- **Code quality** - Static analysis scores
- **Response time** - Time to generate
- **Token usage** - Cost efficiency
- **User satisfaction** - Feedback ratings

### Auto-optimization

Automatically improve prompts based on performance:

```typescript
const optimizedTemplate = await promptManager.optimizeTemplate('react-component', {
  targetMetric: 'code_quality',
  iterations: 10,
  trainingData: historicalResults
});
```

## Context Management

### Project Context

Maintain project-specific context:

```typescript
const projectContext = {
  dependencies: ['react', 'typescript', 'tailwindcss'],
  conventions: {
    naming: 'camelCase',
    fileStructure: 'feature-based',
    testing: 'jest'
  },
  designSystem: {
    colors: designTokens.colors,
    spacing: designTokens.spacing,
    typography: designTokens.fonts
  }
};
```

### Dynamic Context

Inject dynamic context based on current state:

```typescript
const dynamicContext = {
  existingComponents: getProjectComponents(),
  currentBreakpoint: getCurrentBreakpoint(),
  userPreferences: getUserPreferences(),
  recentGenerations: getRecentGenerations()
};
```

## Examples and Few-shot Learning

### Example Management

Provide high-quality examples for better AI output:

```typescript
const examples = [
  {
    input: 'Create a button component',
    output: `interface ButtonProps {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant, children }) => {
  return (
    <button className={\`btn btn-\${variant}\`}>
      {children}
    </button>
  );
};`,
    quality: 0.95
  }
];
```

### Few-shot Prompts

Generate few-shot prompts with relevant examples:

```typescript
const fewShotPrompt = await promptManager.generateFewShotPrompt('react-component', {
  exampleCount: 3,
  context: componentContext,
  similarity: 'semantic'
});
```

## Integration

Codegen Prompts integrates with:

- **Server API** - Prompt generation endpoints
- **Studio App** - Real-time prompt creation
- **AI Providers** - Optimized prompt delivery
- **Analytics** - Performance tracking

## Development

```bash
# Build package
npm run build

# Run tests
npm run test

# Validate templates
npm run validate-templates
```

## Configuration

Configure prompt behavior:

```json
{
  "defaultProvider": "openai",
  "optimization": {
    "enabled": true,
    "metric": "code_quality",
    "minSampleSize": 50
  },
  "context": {
    "includeProjectInfo": true,
    "includeDesignSystem": true,
    "maxContextLength": 4000
  }
}
```