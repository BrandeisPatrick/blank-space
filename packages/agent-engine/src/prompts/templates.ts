import { PromptTemplate } from './PromptManager';

// Planning task templates
export const PLANNING_TEMPLATES: PromptTemplate[] = [
  {
    id: 'code-planning-basic',
    name: 'Basic Code Planning',
    description: 'Generate a step-by-step plan for implementing code',
    template: `You are a senior software engineer tasked with creating a detailed implementation plan.

Task: {{task}}
Requirements: {{requirements}}
Context: {{context}}

Please create a detailed step-by-step plan that includes:
1. High-level architecture overview
2. Key components and their responsibilities
3. Implementation steps in order of dependency
4. Testing strategy
5. Potential risks and mitigation strategies

Format your response as a structured plan with clear action items.`,
    variables: ['task', 'requirements', 'context'],
    category: 'planning',
    tags: ['code', 'planning', 'architecture'],
  },

  {
    id: 'react-planning',
    name: 'React Component Planning',
    description: 'Plan React component implementation',
    template: `You are a React expert creating an implementation plan for a new component.

Component: {{componentName}}
Description: {{description}}
Props: {{props}}
Requirements: {{requirements}}

Create a detailed plan including:
1. Component structure and hierarchy
2. State management approach (useState, useContext, external store)
3. Props interface definition
4. Event handlers and lifecycle methods
5. Testing approach (unit tests, integration tests)
6. Accessibility considerations
7. Performance optimizations

Focus on React best practices and modern patterns.`,
    variables: ['componentName', 'description', 'props', 'requirements'],
    category: 'planning',
    tags: ['react', 'components', 'frontend'],
  },
];

// Code generation templates
export const CODE_GENERATION_TEMPLATES: PromptTemplate[] = [
  {
    id: 'typescript-function',
    name: 'TypeScript Function Generation',
    description: 'Generate TypeScript functions with proper typing',
    template: `Generate a TypeScript function with the following specifications:

Function Name: {{functionName}}
Description: {{description}}
Parameters: {{parameters}}
Return Type: {{returnType}}
Requirements: {{requirements}}

Requirements for the implementation:
- Use proper TypeScript types and interfaces
- Include JSDoc comments
- Handle edge cases and errors appropriately
- Follow TypeScript best practices
- Include input validation where appropriate

Return only the function code without explanations.`,
    variables: ['functionName', 'description', 'parameters', 'returnType', 'requirements'],
    category: 'code-generation',
    tags: ['typescript', 'functions', 'types'],
  },

  {
    id: 'react-component',
    name: 'React Component Generation',
    description: 'Generate React functional components',
    template: `Generate a React functional component with the following specifications:

Component Name: {{componentName}}
Description: {{description}}
Props: {{props}}
State Requirements: {{stateRequirements}}
Additional Requirements: {{requirements}}

Guidelines:
- Use TypeScript for proper typing
- Use modern React patterns (hooks, functional components)
- Include proper prop validation
- Add accessibility attributes where appropriate
- Use semantic HTML
- Include error handling where necessary
- Follow React best practices

Return the complete component code with imports.`,
    variables: ['componentName', 'description', 'props', 'stateRequirements', 'requirements'],
    category: 'code-generation',
    tags: ['react', 'components', 'typescript'],
  },
];

// Code review templates
export const CODE_REVIEW_TEMPLATES: PromptTemplate[] = [
  {
    id: 'general-code-review',
    name: 'General Code Review',
    description: 'Comprehensive code review focusing on quality and best practices',
    template: `Please review the following code for quality, best practices, and potential issues.

Code:
\`\`\`{{language}}
{{code}}
\`\`\`

Context: {{context}}

Please provide feedback on:
1. Code quality and readability
2. Performance considerations
3. Security concerns
4. Best practice adherence
5. Potential bugs or edge cases
6. Type safety (if applicable)
7. Testing considerations

Format your review with:
- Issues found (with severity: high/medium/low)
- Suggested improvements
- Positive aspects of the code
- Overall assessment`,
    variables: ['language', 'code', 'context'],
    category: 'code-review',
    tags: ['review', 'quality', 'best-practices'],
  },

  {
    id: 'react-code-review',
    name: 'React Code Review',
    description: 'Specialized code review for React components',
    template: `Review this React component for React-specific best practices and patterns.

Component Code:
\`\`\`tsx
{{code}}
\`\`\`

Context: {{context}}

Focus on:
1. React patterns and hooks usage
2. Component architecture and reusability
3. State management approach
4. Props design and validation
5. Performance optimizations (memoization, re-renders)
6. Accessibility compliance
7. TypeScript usage in React context
8. Testing implications

Provide specific React-focused feedback with examples of improvements.`,
    variables: ['code', 'context'],
    category: 'code-review',
    tags: ['react', 'review', 'components'],
  },
];

// Documentation templates
export const DOCUMENTATION_TEMPLATES: PromptTemplate[] = [
  {
    id: 'api-documentation',
    name: 'API Documentation',
    description: 'Generate comprehensive API documentation',
    template: `Generate comprehensive API documentation for the following code:

Code:
\`\`\`{{language}}
{{code}}
\`\`\`

Include:
1. Overview and purpose
2. Parameters (types, descriptions, examples)
3. Return values (types, descriptions)
4. Usage examples
5. Error conditions and handling
6. Performance considerations
7. Related functions or methods

Format as markdown with proper code blocks and examples.`,
    variables: ['language', 'code'],
    category: 'documentation',
    tags: ['api', 'documentation', 'markdown'],
  },

  {
    id: 'readme-generation',
    name: 'README Generation',
    description: 'Generate project README files',
    template: `Generate a comprehensive README.md file for this project:

Project Name: {{projectName}}
Description: {{description}}
Technology Stack: {{techStack}}
Key Features: {{features}}
Installation Instructions: {{installation}}
Usage Examples: {{usage}}

Include standard sections:
- Project title and description
- Features
- Installation
- Usage examples
- API documentation (if applicable)
- Contributing guidelines
- License information
- Contact/support information

Use proper markdown formatting with badges, code blocks, and clear structure.`,
    variables: ['projectName', 'description', 'techStack', 'features', 'installation', 'usage'],
    category: 'documentation',
    tags: ['readme', 'documentation', 'project'],
  },
];

// Conversation templates
export const CONVERSATION_TEMPLATES: PromptTemplate[] = [
  {
    id: 'coding-assistant',
    name: 'Coding Assistant',
    description: 'General purpose coding assistant conversation',
    template: `You are an expert software engineer and coding assistant. You help developers with:
- Code implementation and debugging
- Architecture and design decisions
- Best practices and code quality
- Technology recommendations
- Problem-solving and troubleshooting

User Context: {{context}}
Previous Conversation: {{history}}
Current Question: {{question}}

Provide helpful, accurate, and practical assistance. When providing code examples, use proper formatting and explain key concepts.`,
    variables: ['context', 'history', 'question'],
    category: 'conversation',
    tags: ['assistant', 'general', 'coding'],
  },

  {
    id: 'react-specialist',
    name: 'React Specialist',
    description: 'Specialized React development assistant',
    template: `You are a React expert specializing in modern React development, including:
- React 18+ features and patterns
- TypeScript integration
- State management (useState, useContext, Redux, Zustand)
- Performance optimization
- Testing strategies
- Component design patterns

User's Question: {{question}}
Current Project Context: {{projectContext}}
React Version: {{reactVersion}}

Provide React-specific guidance with practical examples and current best practices.`,
    variables: ['question', 'projectContext', 'reactVersion'],
    category: 'conversation',
    tags: ['react', 'specialist', 'frontend'],
  },
];

// Export all templates
export const ALL_TEMPLATES = [
  ...PLANNING_TEMPLATES,
  ...CODE_GENERATION_TEMPLATES,
  ...CODE_REVIEW_TEMPLATES,
  ...DOCUMENTATION_TEMPLATES,
  ...CONVERSATION_TEMPLATES,
];