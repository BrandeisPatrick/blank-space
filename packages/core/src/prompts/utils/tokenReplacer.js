/**
 * Token Replacer
 * Shared utility for replacing color tokens in prompt templates
 */

/**
 * Replace color tokens like {primary.base} with actual color values
 * @param {string} str - String containing tokens
 * @param {Object} colors - Color palette object
 * @returns {string} String with tokens replaced
 */
export function replaceColorTokens(str, colors) {
  if (!str || !colors) return str;

  return str
    .replace(/\{primary\.base\}/g, colors.primary?.base || '')
    .replace(/\{primary\.hover\}/g, colors.primary?.hover || '')
    .replace(/\{primary\.light\}/g, colors.primary?.light || '')
    .replace(/\{secondary\.base\}/g, colors.secondary?.base || '')
    .replace(/\{secondary\.hover\}/g, colors.secondary?.hover || '')
    .replace(/\{accent\.base\}/g, colors.accent?.base || '')
    .replace(/\{accent\.hover\}/g, colors.accent?.hover || '')
    .replace(/\{background\.page\}/g, colors.background?.page || '')
    .replace(/\{background\.card\}/g, colors.background?.card || '')
    .replace(/\{background\.muted\}/g, colors.background?.muted || '')
    .replace(/\{text\.heading\}/g, colors.text?.heading || '')
    .replace(/\{text\.body\}/g, colors.text?.body || '')
    .replace(/\{text\.muted\}/g, colors.text?.muted || '')
    .replace(/\{border\}/g, colors.border || '')
    .replace(/\{primary\}/g, colors.primary?.base || '');
}
