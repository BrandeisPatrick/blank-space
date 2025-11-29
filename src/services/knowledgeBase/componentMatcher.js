// Component Matcher Service
// Finds relevant components from the knowledge base based on user input

import { getAllComponents, getCategorySummary } from '../../data/componentKnowledgeBase';

// Keywords that map to component categories and types
const COMPONENT_KEYWORDS = {
  // Hero-related
  hero: ['hero', 'landing', 'headline', 'banner', 'above the fold', 'header section', 'main section'],

  // Navigation-related
  navigation: ['nav', 'navbar', 'navigation', 'menu', 'header', 'sidebar', 'topbar'],

  // Cards-related
  cards: ['card', 'cards', 'tile', 'tiles', 'grid item', 'box', 'panel'],

  // Buttons-related
  buttons: ['button', 'btn', 'cta', 'call to action', 'click', 'submit'],

  // Features-related
  features: ['feature', 'features', 'benefit', 'benefits', 'capabilities', 'services', 'what we offer', 'bento'],

  // Footers-related
  footers: ['footer', 'bottom', 'contact info', 'site links'],

  // Style-related keywords
  dark: ['dark', 'black', 'night', 'dark mode', 'dark theme'],
  light: ['light', 'white', 'bright', 'light mode', 'light theme'],
  gradient: ['gradient', 'colorful', 'vibrant', 'rainbow'],
  minimal: ['minimal', 'clean', 'simple', 'minimalist'],
  animated: ['animated', 'animation', 'motion', 'moving', 'dynamic'],
  glass: ['glass', 'glassmorphism', 'blur', 'transparent', 'frosted'],

  // Use case keywords
  saas: ['saas', 'software', 'app', 'platform', 'startup', 'tech'],
  ecommerce: ['ecommerce', 'e-commerce', 'shop', 'store', 'product', 'buy', 'sell', 'cart'],
  portfolio: ['portfolio', 'personal', 'resume', 'cv', 'about me', 'my work'],
  agency: ['agency', 'creative', 'studio', 'design agency'],
};

/**
 * Extract relevant keywords from user message
 */
export const extractKeywords = (message) => {
  const messageLower = message.toLowerCase();
  const foundKeywords = [];

  Object.entries(COMPONENT_KEYWORDS).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (messageLower.includes(keyword)) {
        foundKeywords.push({ category, keyword });
      }
    });
  });

  return foundKeywords;
};

/**
 * Calculate relevance score for a component based on user message
 */
const calculateRelevanceScore = (component, message) => {
  const messageLower = message.toLowerCase();
  let score = 0;

  // Check tags (highest weight)
  component.tags.forEach(tag => {
    if (messageLower.includes(tag.toLowerCase())) {
      score += 10;
    }
  });

  // Check name
  const nameParts = component.name.toLowerCase().split(' ');
  nameParts.forEach(part => {
    if (messageLower.includes(part) && part.length > 2) {
      score += 8;
    }
  });

  // Check description
  const descWords = component.description.toLowerCase().split(' ');
  descWords.forEach(word => {
    if (messageLower.includes(word) && word.length > 4) {
      score += 2;
    }
  });

  // Check use cases
  component.useCases.forEach(useCase => {
    const useCaseWords = useCase.toLowerCase().split(' ');
    useCaseWords.forEach(word => {
      if (messageLower.includes(word) && word.length > 3) {
        score += 5;
      }
    });
  });

  return score;
};

/**
 * Find relevant components from the knowledge base
 * @param {string} userMessage - The user's input message
 * @param {number} maxResults - Maximum number of components to return
 * @returns {Array} - Array of relevant components sorted by relevance
 */
export const findRelevantComponents = (userMessage, maxResults = 5) => {
  const allComponents = getAllComponents();

  // Score all components
  const scored = allComponents.map(component => ({
    component,
    score: calculateRelevanceScore(component, userMessage),
  }));

  // Filter components with score > 0 and sort by score
  const relevant = scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(item => item.component);

  // If no matches found, try to infer from context and return some defaults
  if (relevant.length === 0) {
    // Check for common page types and return appropriate defaults
    const messageLower = userMessage.toLowerCase();

    if (messageLower.includes('landing') || messageLower.includes('website') || messageLower.includes('page')) {
      // Return a hero, features, and footer for a generic landing page
      return allComponents.filter(c =>
        c.id === 'hero-spotlight' ||
        c.id === 'features-grid-icons' ||
        c.id === 'footer-modern'
      );
    }
  }

  return relevant;
};

/**
 * Get category-based suggestions based on what's being built
 */
export const getCategorySuggestions = (userMessage) => {
  const keywords = extractKeywords(userMessage);
  const categoryScores = {};

  keywords.forEach(({ category }) => {
    categoryScores[category] = (categoryScores[category] || 0) + 1;
  });

  return Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);
};

export default {
  extractKeywords,
  findRelevantComponents,
  getCategorySuggestions,
};
