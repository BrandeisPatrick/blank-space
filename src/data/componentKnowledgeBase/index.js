// Component Knowledge Base - Main Loader
// Loads and exports all component categories for use by the AI code generator

import heroComponents from './categories/hero.json';
import cardsComponents from './categories/cards.json';
import navigationComponents from './categories/navigation.json';
import buttonsComponents from './categories/buttons.json';
import featuresComponents from './categories/features.json';
import footersComponents from './categories/footers.json';

// All categories
export const categories = {
  hero: heroComponents,
  cards: cardsComponents,
  navigation: navigationComponents,
  buttons: buttonsComponents,
  features: featuresComponents,
  footers: footersComponents,
};

// Get all components flattened into a single array
export const getAllComponents = () => {
  return Object.values(categories).flatMap(category => category.components);
};

// Get components by category
export const getComponentsByCategory = (categoryName) => {
  return categories[categoryName]?.components || [];
};

// Get component by ID
export const getComponentById = (id) => {
  return getAllComponents().find(c => c.id === id);
};

// Get all category names
export const getCategoryNames = () => {
  return Object.keys(categories);
};

// Get category summary for LLM context
export const getCategorySummary = () => {
  return Object.entries(categories).map(([name, data]) => ({
    name,
    description: data.categoryDescription,
    componentCount: data.components.length,
    componentNames: data.components.map(c => c.name),
  }));
};

// Search components by tags
export const searchByTags = (tags) => {
  const allComponents = getAllComponents();
  const searchTags = Array.isArray(tags) ? tags : [tags];

  return allComponents.filter(component =>
    searchTags.some(tag =>
      component.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    )
  );
};

export default {
  categories,
  getAllComponents,
  getComponentsByCategory,
  getComponentById,
  getCategoryNames,
  getCategorySummary,
  searchByTags,
};
