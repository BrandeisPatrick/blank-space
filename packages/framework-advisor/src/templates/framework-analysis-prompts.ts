import { ProjectRequirements, Framework } from '../types';

export interface FrameworkPromptTemplates {
  analysisPrompt: (requirements: ProjectRequirements, frameworks: Framework[]) => string;
  reasoningPrompt: (framework: Framework, requirements: ProjectRequirements, score: number) => string;
  comparisonPrompt: (frameworks: Framework[], requirements: ProjectRequirements) => string;
  alternativePrompt: (primaryFramework: Framework, alternatives: Framework[], requirements: ProjectRequirements) => string;
}

export const frameworkPromptTemplates: FrameworkPromptTemplates = {
  
  analysisPrompt: (requirements: ProjectRequirements, frameworks: Framework[]) => `
You are a senior software engineer with expertise in web development frameworks. Analyze the following project requirements and provide framework recommendations.

## Project Requirements:
- **Description**: ${requirements.description}
- **Project Type**: ${requirements.projectType || 'Not specified'}
- **Complexity**: ${requirements.complexity || 'Not specified'}
- **Team Experience**: ${requirements.team?.experience || 'Not specified'}
- **Performance Priority**: ${requirements.performance?.priority || 'Not specified'}
- **SEO Required**: ${requirements.performance?.seo ? 'Yes' : 'No'}
- **Timeline**: ${requirements.timeline || 'Not specified'}
- **Explicit Framework**: ${requirements.explicitFramework || 'None specified'}

## Available Frameworks:
${frameworks.map(f => `
- **${f.name}**: ${f.type} (${f.category})
  - Learning Curve: ${f.learningCurve}
  - Performance: ${f.performance.runtime} runtime, ${f.performance.bundleSize} bundle
  - Best For: ${f.bestFor.join(', ')}
  - Strengths: ${f.strengths.slice(0, 3).join(', ')}
`).join('')}

## Your Task:
As a senior engineer, provide your analysis considering:
1. **User's Explicit Request**: If they specified a framework, prioritize that choice
2. **Project-Framework Fit**: Match framework capabilities to project needs
3. **Team Considerations**: Factor in team size and experience level
4. **Technical Requirements**: Consider performance, SEO, and complexity needs
5. **Industry Best Practices**: Apply your experience with similar projects

Provide a concise analysis (2-3 sentences) explaining your top recommendation and why it's the best choice for this specific project.
`,

  reasoningPrompt: (framework: Framework, requirements: ProjectRequirements, score: number) => `
You are explaining why ${framework.name} scored ${score}/100 for a project with these requirements:

**Project**: ${requirements.description}
**Type**: ${requirements.projectType}
**Complexity**: ${requirements.complexity}
**Team**: ${requirements.team?.size} team, ${requirements.team?.experience} experience
**Timeline**: ${requirements.timeline}

**Framework Strengths**:
${framework.strengths.map(s => `- ${s}`).join('\n')}

**Framework Best For**:
${framework.bestFor.map(b => `- ${b}`).join('\n')}

Provide a brief explanation (1-2 sentences) of why this framework is ${score > 70 ? 'well-suited' : score > 50 ? 'moderately suitable' : 'not ideal'} for this project. Focus on the most relevant factors.
`,

  comparisonPrompt: (frameworks: Framework[], requirements: ProjectRequirements) => `
You are comparing frameworks for a project. Requirements:
- **Project**: ${requirements.description}
- **Type**: ${requirements.projectType}
- **Complexity**: ${requirements.complexity}
- **Priority**: ${requirements.performance?.priority} performance

**Frameworks to compare**:
${frameworks.map(f => `
**${f.name}**:
- Category: ${f.category} ${f.type}
- Learning: ${f.learningCurve}
- Performance: ${f.performance.runtime}/${f.performance.bundleSize}
- Community: ${f.communitySize}
`).join('')}

Provide a brief comparison (2-3 sentences) focusing on which framework best matches the project requirements and why. Consider the trade-offs between the options.
`,

  alternativePrompt: (primaryFramework: Framework, alternatives: Framework[], requirements: ProjectRequirements) => `
The primary recommendation is ${primaryFramework.name} for this project:
"${requirements.description}"

**Alternatives considered**:
${alternatives.map(f => `- ${f.name}: ${f.learningCurve} learning curve, ${f.communitySize} community`).join('\n')}

Briefly explain (1 sentence) why ${primaryFramework.name} was chosen over these alternatives for this specific project.
`

};

// Specialized prompts for different scenarios
export const scenarioPrompts = {
  
  beginnerFriendly: (frameworks: Framework[]) => `
The user is new to web development. From these frameworks: ${frameworks.map(f => f.name).join(', ')}, 
which would you recommend for a beginner and why? Consider learning curve, documentation, and community support.
`,

  performanceCritical: (frameworks: Framework[]) => `
This project requires maximum performance. Analyze these frameworks: ${frameworks.map(f => f.name).join(', ')}
Focus on bundle size, runtime performance, and optimization capabilities.
`,

  enterpriseScale: (frameworks: Framework[]) => `
This is a large enterprise project requiring long-term maintainability. 
Evaluate: ${frameworks.map(f => f.name).join(', ')}
Consider enterprise support, maturity, team scalability, and long-term viability.
`,

  rapidPrototype: (frameworks: Framework[]) => `
Need to build a prototype quickly. From: ${frameworks.map(f => f.name).join(', ')}
Which allows fastest development time while maintaining code quality?
`,

  seoOptimized: (frameworks: Framework[]) => `
SEO is critical for this project. Compare: ${frameworks.map(f => f.name).join(', ')}
Focus on server-side rendering capabilities, static generation, and SEO features.
`

};

// Context-aware prompt builder
export class FrameworkPromptBuilder {
  static buildAnalysisPrompt(requirements: ProjectRequirements, frameworks: Framework[]): string {
    let prompt = frameworkPromptTemplates.analysisPrompt(requirements, frameworks);
    
    // Add scenario-specific context
    if (requirements.team?.experience === 'beginner') {
      prompt += '\n\n**Special Consideration**: This is for a beginner team - prioritize ease of learning and good documentation.';
    }
    
    if (requirements.performance?.priority === 'high') {
      prompt += '\n\n**Special Consideration**: Performance is critical - prioritize runtime speed and bundle size.';
    }
    
    if (requirements.timeline === 'urgent') {
      prompt += '\n\n**Special Consideration**: Timeline is urgent - favor frameworks that enable rapid development.';
    }
    
    if (requirements.performance?.seo) {
      prompt += '\n\n**Special Consideration**: SEO is important - consider server-side rendering capabilities.';
    }
    
    return prompt;
  }
  
  static buildComparisonPrompt(frameworks: Framework[], requirements: ProjectRequirements): string {
    let prompt = frameworkPromptTemplates.comparisonPrompt(frameworks, requirements);
    
    // Add explicit framework preference if any
    if (requirements.explicitFramework) {
      const explicitFramework = frameworks.find(f => f.id === requirements.explicitFramework);
      if (explicitFramework) {
        prompt += `\n\n**Note**: User specifically mentioned ${explicitFramework.name}. Consider this preference in your analysis.`;
      }
    }
    
    return prompt;
  }
}