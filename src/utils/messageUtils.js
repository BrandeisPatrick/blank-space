/**
 * Message utility functions
 * Shared logic for filtering and processing chat messages
 */

/**
 * Message types that should be visible in chat panels
 * Excludes 'thinking', 'intent', and 'plan' messages
 */
export const VISIBLE_MESSAGE_TYPES = ['user', 'assistant', 'complete', 'error'];

/**
 * Filters messages to only include user-visible types
 * @param {Array} messages - Array of message objects with 'type' property
 * @returns {Array} Filtered messages
 */
export const filterVisibleMessages = (messages) => {
  return messages.filter(msg => VISIBLE_MESSAGE_TYPES.includes(msg.type));
};
