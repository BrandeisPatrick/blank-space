/**
 * Slugify Utility
 * Converts text to URL-friendly slugs for project names
 */

/**
 * Convert text to a URL-friendly slug
 * @param {string} text - Text to slugify
 * @param {boolean} addSuffix - Add random suffix for uniqueness
 * @returns {string} Slugified text
 */
export function slugify(text, addSuffix = false) {
  if (!text || typeof text !== 'string') {
    return addSuffix ? `untitled-${randomSuffix()}` : 'untitled';
  }

  let slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')      // Remove leading/trailing hyphens
    .slice(0, 50)                  // Limit length
    || 'untitled';                 // Fallback if empty

  if (addSuffix) {
    slug = `${slug}-${randomSuffix()}`;
  }

  return slug;
}

/**
 * Generate a random 5-character suffix
 * @returns {string} Random suffix (e.g., "7f3k2")
 */
function randomSuffix() {
  return Math.random().toString(36).substring(2, 7);
}

