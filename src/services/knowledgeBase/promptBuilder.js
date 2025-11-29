// Prompt Builder Service
// Builds LLM context from knowledge base components

import { getCategorySummary } from '../../data/componentKnowledgeBase';
import { findRelevantComponents } from './componentMatcher';

/**
 * Build the knowledge base context section for the LLM system prompt
 * @param {string} userMessage - The user's input to find relevant components
 * @returns {string} - The formatted prompt section
 */
export const buildKnowledgeBaseContext = (userMessage) => {
  const relevantComponents = findRelevantComponents(userMessage, 4);

  if (relevantComponents.length === 0) {
    return '';
  }

  let context = `

# COMPONENT KNOWLEDGE BASE (Pro Mode Enabled)

You have access to a curated library of professional React components. Use these patterns as reference to create more polished, human-designed output.

## Available Component Patterns

`;

  relevantComponents.forEach((component, index) => {
    context += `
### ${index + 1}. ${component.name} (${component.source})
**Category:** ${component.tags[0]}
**Use cases:** ${component.useCases.slice(0, 3).join(', ')}
**Description:** ${component.description}

\`\`\`jsx
${component.code}
\`\`\`

`;
  });

  context += `
## Guidelines for Using Component Patterns

1. **Adapt, Don't Copy Verbatim**: Use these patterns as inspiration. Adapt the styling, content, and structure to match the user's specific needs.

2. **Maintain Consistency**: When combining multiple components, ensure consistent styling (colors, spacing, typography).

3. **Keep the Professional Quality**: These patterns represent high-quality, production-ready designs. Maintain their polish and attention to detail.

4. **Responsive First**: All patterns are designed to be responsive. Keep this in mind when adapting them.

5. **Customize Content**: Replace placeholder text and images with content relevant to the user's request.

`;

  return context;
};

/**
 * Get a summary of all available categories for the base system prompt
 */
export const getCategoryOverview = () => {
  const summary = getCategorySummary();

  let overview = `
## Component Knowledge Base Categories

The following component categories are available when Pro Mode is enabled:

`;

  summary.forEach(cat => {
    overview += `- **${cat.name}**: ${cat.description} (${cat.componentCount} components)\n`;
  });

  return overview;
};

/**
 * Check if knowledge base should be used based on the user message
 * Returns true if the message seems to be asking for UI/component generation
 */
export const shouldUseKnowledgeBase = (userMessage) => {
  const uiKeywords = [
    'create', 'build', 'make', 'design', 'generate',
    'website', 'page', 'landing', 'app', 'application',
    'ui', 'interface', 'component', 'section',
    'hero', 'navbar', 'footer', 'card', 'button',
    'form', 'layout', 'dashboard', 'portfolio'
  ];

  const messageLower = userMessage.toLowerCase();
  return uiKeywords.some(keyword => messageLower.includes(keyword));
};

export default {
  buildKnowledgeBaseContext,
  getCategoryOverview,
  shouldUseKnowledgeBase,
};
