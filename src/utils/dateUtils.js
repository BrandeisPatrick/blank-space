/**
 * Date utility functions
 * Shared logic for date formatting
 */

/**
 * Formats a timestamp to a relative time string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted relative time (e.g., "Just now", "5m ago", "2h ago")
 */
export const formatDate = (timestamp) => {
  const now = Date.now();
  const date = new Date(timestamp);
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString();
};
