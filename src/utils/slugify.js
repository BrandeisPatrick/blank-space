/**
 * Slugify Utility
 * Converts text to URL-friendly slugs for project names
 */

/**
 * Convert text to a URL-friendly slug
 * @param {string} text - Text to slugify
 * @returns {string} Slugified text
 */
export function slugify(text) {
  if (!text || typeof text !== 'string') {
    return 'untitled';
  }

  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')      // Remove leading/trailing hyphens
    .slice(0, 50)                  // Limit length
    || 'untitled';                 // Fallback if empty
}

/**
 * Generate a unique slug with timestamp
 * @param {string} text - Text to slugify
 * @returns {string} Unique slugified text
 */
export function uniqueSlug(text) {
  const base = slugify(text);
  const timestamp = Date.now().toString(36);
  return `${base}-${timestamp}`;
}
