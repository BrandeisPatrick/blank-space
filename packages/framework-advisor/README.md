# Framework Advisor

An intelligent AI-powered framework recommendation system for UI Grid AI that helps developers choose the best web development framework based on their project requirements.

## Overview

Framework Advisor analyzes project requirements and provides data-driven framework recommendations using a sophisticated scoring algorithm combined with AI reasoning. It supports multiple analysis approaches including natural language prompt analysis and structured requirement evaluation.

## Features

- 🤖 **AI-Powered Analysis** - Natural language prompt understanding
- 📊 **Multi-Criteria Scoring** - Weighted scoring across multiple dimensions
- 🔍 **Framework Comparison** - Side-by-side framework evaluation
- 📝 **Detailed Reasoning** - Clear explanations for recommendations
- ⚡ **Fast Performance** - Optimized algorithms for real-time analysis
- 🎯 **Context-Aware** - Considers team experience, timeline, and project constraints

## Supported Frameworks

### Frontend Frameworks
- **React** - Component-based library with rich ecosystem
- **Vue.js** - Progressive framework with gentle learning curve
- **Angular** - Full-featured enterprise framework
- **Svelte** - Compile-time optimized framework

### Meta-Frameworks
- **Next.js** - React-based full-stack framework
- **Nuxt.js** - Vue.js-based full-stack framework
- **Remix** - Modern React framework focused on web standards

### Lightweight Options
- **Vanilla JavaScript** - No-framework approach for maximum control

## Installation

```bash
npm install @ui-grid-ai/framework-advisor
```

## Quick Start

### Basic Usage

```typescript
import { FrameworkAdvisor } from '@ui-grid-ai/framework-advisor';

// Initialize the advisor
const advisor = new FrameworkAdvisor();

// Get recommendation from natural language
const recommendation = await advisor.recommendFromPrompt(
  "I need to build a fast e-commerce site with SEO support for a small team"
);

console.log(`Recommended: ${recommendation.primary.framework.name}`);
console.log(`Score: ${recommendation.primary.score}/100`);
```

### Structured Requirements

```typescript
import { ProjectRequirements } from '@ui-grid-ai/framework-advisor';

const requirements: ProjectRequirements = {
  description: "E-commerce platform",
  projectType: "e-commerce",
  complexity: "medium",
  team: {
    size: "small",
    experience: "intermediate"
  },
  performance: {
    priority: "high",
    seo: true
  },
  timeline: "normal"
};

const recommendation = await advisor.recommend(requirements);
```

## API Reference

### FrameworkAdvisor Class

#### Constructor

```typescript
new FrameworkAdvisor(config?: Partial<Config>)
```

**Config Options:**
- `enableAiReasoning: boolean` - Enable AI-powered explanations (default: true)
- `maxAlternatives: number` - Maximum alternative frameworks to return (default: 3)
- `minScore: number` - Minimum score threshold for recommendations (default: 20)
- `defaultCriteria: AnalysisCriteria` - Default scoring criteria weights

#### Methods

##### `recommendFromPrompt(prompt: string): Promise<Recommendation>`

Analyzes a natural language description and returns framework recommendations.

```typescript
const recommendation = await advisor.recommendFromPrompt(
  "Build a dashboard for a beginner team with tight deadline"
);
```

##### `recommend(requirements: ProjectRequirements): Promise<Recommendation>`

Provides recommendations based on structured requirements.

```typescript
const recommendation = await advisor.recommend({
  projectType: "dashboard",
  team: { experience: "beginner" },
  timeline: "urgent"
});
```

##### `compareFrameworks(frameworkIds: string[], requirements: ProjectRequirements): Promise<Recommendation>`

Compares specific frameworks for given requirements.

```typescript
const comparison = await advisor.compareFrameworks(
  ["react", "vue", "svelte"],
  requirements
);
```

##### `recommendWithCriteria(requirements: ProjectRequirements, criteria: AnalysisCriteria): Promise<Recommendation>`

Gets recommendations with custom scoring criteria weights.

```typescript
const recommendation = await advisor.recommendWithCriteria(requirements, {
  performance: 0.4,      // 40% weight on performance
  learningCurve: 0.1,    // 10% weight on learning curve
  community: 0.2,        // 20% weight on community
  ecosystem: 0.2,        // 20% weight on ecosystem
  maintenance: 0.05,     // 5% weight on maintenance
  projectFit: 0.05       // 5% weight on project fit
});
```

### Types

#### ProjectRequirements

```typescript
interface ProjectRequirements {
  description: string;                    // Project description
  projectType?: 'web-app' | 'e-commerce' | 'dashboard' | 'landing-page' | 'blog' | 'portfolio' | 'api' | 'other';
  complexity?: 'simple' | 'medium' | 'complex';
  team?: {
    size?: 'solo' | 'small' | 'medium' | 'large';
    experience?: 'beginner' | 'intermediate' | 'advanced';
  };
  performance?: {
    priority?: 'low' | 'medium' | 'high';
    seo?: boolean;                        // SEO requirements
    ssr?: boolean;                        // Server-side rendering
  };
  timeline?: 'urgent' | 'normal' | 'flexible';
  budget?: 'limited' | 'moderate' | 'flexible';
  maintenance?: 'minimal' | 'regular' | 'extensive';
  explicitFramework?: string;             // User's explicit framework preference
  features?: string[];                    // Required features
  constraints?: string[];                 // Project constraints
}
```

#### Recommendation

```typescript
interface Recommendation {
  primary: AnalysisResult;               // Top recommendation
  alternatives: AnalysisResult[];        // Alternative options
  summary: string;                       // Human-readable summary
  nextSteps: string[];                   // Recommended next steps
  considerations: string[];              // Important considerations
  aiReasoning?: string;                  // AI-generated reasoning
}
```

#### AnalysisResult

```typescript
interface AnalysisResult {
  framework: Framework;                  // Framework details
  score: number;                         // Score out of 100
  reasoning: string;                     // Explanation for recommendation
  pros: string[];                        // Framework advantages
  cons: string[];                        // Framework disadvantages
  confidence: 'low' | 'medium' | 'high'; // Confidence level
}
```

## Scoring Algorithm

The Framework Advisor uses a multi-criteria scoring system with weighted factors:

### Default Weights
- **Project Fit (30%)** - How well the framework matches project requirements
- **Performance (20%)** - Runtime speed, bundle size, build time
- **Learning Curve (15%)** - Ease of adoption for the team
- **Ecosystem (15%)** - Available libraries and tooling
- **Maintenance (10%)** - Long-term support and stability  
- **Community (10%)** - Community size and documentation quality

### Scoring Factors

#### Performance Scoring
- Bundle size (small/medium/large)
- Runtime performance (fast/moderate/slow)
- Build time (fast/moderate/slow)
- SEO capabilities for relevant projects

#### Learning Curve Scoring
- Framework complexity (easy/moderate/steep)
- Team experience level
- Timeline constraints
- Available learning resources

#### Project Fit Scoring
- Explicit framework preferences (highest weight)
- Project type compatibility
- Feature requirements alignment
- Complexity matching

## Decision Logic

The Framework Advisor follows a hierarchical decision process:

### 1. Explicit Framework Detection
If a user explicitly mentions a framework (e.g., "using React"), it receives maximum project fit score.

### 2. Implicit Framework Detection
Analyzes prompt for framework-specific terminology:
- "hooks", "JSX" → React
- "template", "directive" → Vue
- "component", "service" → Angular

### 3. Project Type Matching
Maps project types to suitable frameworks:
- E-commerce → Next.js, React
- Landing pages → Gatsby, Nuxt.js
- Dashboards → React, Angular
- Simple sites → Vue.js, Vanilla JS

### 4. Constraint Consideration
Applies penalties/bonuses based on constraints:
- Tight deadline + steep learning curve = penalty
- Beginner team + complex framework = penalty
- High performance need + lightweight framework = bonus

## Advanced Usage

### Custom Scoring Criteria

```typescript
const performanceOptimizedCriteria: AnalysisCriteria = {
  performance: 0.5,      // 50% weight on performance
  projectFit: 0.3,       // 30% weight on project fit
  learningCurve: 0.1,    // 10% weight on learning curve
  community: 0.05,       // 5% weight on community
  ecosystem: 0.05,       // 5% weight on ecosystem
  maintenance: 0.0       // 0% weight on maintenance
};

const recommendation = await advisor.recommendWithCriteria(
  requirements,
  performanceOptimizedCriteria
);
```

### Prompt Analysis Utility

```typescript
import { PromptAnalyzer } from '@ui-grid-ai/framework-advisor';

const analyzer = new PromptAnalyzer();
const analysis = analyzer.analyze("Build a React dashboard with TypeScript");

console.log(analysis.explicitFramework);  // "react"
console.log(analysis.projectType);        // "dashboard"
console.log(analysis.keyTerms);          // ["react", "dashboard", "typescript"]
```

### Framework Search

```typescript
import { searchFrameworks, getFrameworkById } from '@ui-grid-ai/framework-advisor';

// Search frameworks by capability
const frameworks = searchFrameworks("server-side rendering");

// Get specific framework details
const react = getFrameworkById("react");
```

## Integration Examples

### Express.js API

```typescript
import express from 'express';
import { FrameworkAdvisor } from '@ui-grid-ai/framework-advisor';

const app = express();
const advisor = new FrameworkAdvisor();

app.post('/recommend', async (req, res) => {
  try {
    const { prompt } = req.body;
    const recommendation = await advisor.recommendFromPrompt(prompt);
    res.json({ success: true, recommendation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### React Component

```tsx
import React, { useState } from 'react';
import { FrameworkAdvisor } from '@ui-grid-ai/framework-advisor';

const FrameworkRecommender: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [recommendation, setRecommendation] = useState(null);

  const handleRecommend = async () => {
    const advisor = new FrameworkAdvisor();
    const result = await advisor.recommendFromPrompt(prompt);
    setRecommendation(result);
  };

  return (
    <div>
      <textarea 
        value={prompt} 
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your project..."
      />
      <button onClick={handleRecommend}>Get Recommendation</button>
      {recommendation && (
        <div>
          <h3>Recommended: {recommendation.primary.framework.name}</h3>
          <p>Score: {recommendation.primary.score}/100</p>
          <p>{recommendation.summary}</p>
        </div>
      )}
    </div>
  );
};
```

## Framework Database

The system includes comprehensive data for each supported framework:

```typescript
interface Framework {
  id: string;                           // Unique identifier
  name: string;                         // Display name
  category: 'frontend' | 'fullstack' | 'backend' | 'mobile' | 'desktop';
  type: 'library' | 'framework' | 'meta-framework';
  language: string;                     // Primary language
  learningCurve: 'easy' | 'moderate' | 'steep';
  communitySize: 'small' | 'medium' | 'large';
  maturity: 'experimental' | 'stable' | 'mature';
  performance: {
    bundleSize: 'small' | 'medium' | 'large';
    runtime: 'fast' | 'moderate' | 'slow';
    buildTime: 'fast' | 'moderate' | 'slow';
  };
  features: string[];                   // Key features
  strengths: string[];                  // Framework advantages
  weaknesses: string[];                 // Framework limitations
  bestFor: string[];                    // Ideal use cases
  notRecommendedFor: string[];         // Not suitable for
  ecosystem: {
    uiLibraries: string[];             // Available UI libraries
    stateManagement: string[];         // State management options
    routing: string[];                 // Routing solutions
    testing: string[];                 // Testing frameworks
  };
  documentation: 'poor' | 'good' | 'excellent';
  enterpriseSupport: boolean;          // Enterprise support available
}
```

## Error Handling

```typescript
try {
  const recommendation = await advisor.recommendFromPrompt(prompt);
  // Handle successful recommendation
} catch (error) {
  if (error.message === 'No suitable frameworks found for the given requirements') {
    // Handle case where no frameworks meet minimum score threshold
  } else {
    // Handle other errors
    console.error('Recommendation failed:', error);
  }
}
```

## Performance Considerations

- **Caching**: Framework data is loaded once and cached
- **Async Operations**: All analysis methods are async for non-blocking execution
- **Optimized Scoring**: Scoring algorithm optimized for sub-100ms execution
- **Memory Efficient**: Minimal memory footprint with efficient data structures

## Best Practices

### 1. Provide Detailed Requirements
```typescript
// Good - specific requirements
const requirements = {
  description: "E-commerce platform for selling handmade crafts",
  projectType: "e-commerce",
  team: { size: "small", experience: "intermediate" },
  performance: { priority: "high", seo: true },
  timeline: "normal"
};

// Less optimal - vague requirements  
const requirements = {
  description: "Build a website"
};
```

### 2. Use Appropriate Criteria Weights
```typescript
// For performance-critical applications
const criteria = {
  performance: 0.4,
  projectFit: 0.3,
  // ... other criteria
};

// For beginner teams
const criteria = {
  learningCurve: 0.4,
  community: 0.3,
  // ... other criteria
};
```

### 3. Consider Multiple Alternatives
```typescript
const recommendation = await advisor.recommend(requirements);

// Consider not just the primary recommendation
console.log('Primary:', recommendation.primary.framework.name);
recommendation.alternatives.forEach((alt, index) => {
  console.log(`Alternative ${index + 1}:`, alt.framework.name, alt.score);
});
```

## Contributing

To add a new framework:

1. Add framework data to `src/utils/frameworks.ts`
2. Update framework keywords in `src/analyzers/prompt-analyzer.ts`
3. Test with various project types and requirements
4. Update documentation and examples

## Development

```bash
# Install dependencies
npm install

# Build package
npm run build

# Run tests
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## License

This package is part of the UI Grid AI project and follows the same licensing terms.