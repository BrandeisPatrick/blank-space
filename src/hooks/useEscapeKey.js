import { useEffect } from 'react';

/**
 * Hook to handle Escape key press for closing modals
 * @param {Function} callback - Function to call when Escape is pressed
 * @param {boolean} enabled - Whether the hook is active (default: true)
 */
export const useEscapeKey = (callback, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [callback, enabled]);
};
