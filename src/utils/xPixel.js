/**
 * X (Twitter) Pixel tracking utilities
 * Base pixel is loaded in index.html
 */

// Event IDs - add more as needed
export const X_EVENTS = {
  CONVERSION: 'tw-qy42i-qy61u',
};

/**
 * Track a conversion event on X pixel
 * @param {string} eventId - The X event ID (e.g., 'tw-qy42i-qy61u')
 * @param {object} params - Optional event parameters
 */
export const trackXEvent = (eventId, params = {}) => {
  if (typeof window !== 'undefined' && window.twq) {
    window.twq('event', eventId, params);
  }
};

/**
 * Track the default conversion event (sign-up)
 * @param {object} options - Conversion options
 * @param {string} options.email - User's email address for enhanced matching
 * @param {string} options.conversionId - Unique ID for deduplication (e.g., user ID)
 */
export const trackXConversion = ({ email, conversionId } = {}) => {
  const params = {};

  if (email) {
    params.email_address = email;
  }

  if (conversionId) {
    params.conversion_id = conversionId;
  }

  trackXEvent(X_EVENTS.CONVERSION, params);
};
