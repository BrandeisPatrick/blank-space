import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to detect virtual keyboard visibility and calculate offset
 * Uses the visualViewport API for accurate keyboard detection on mobile
 *
 * @returns {Object} { isKeyboardVisible, keyboardHeight, viewportHeight }
 */
export const useVirtualKeyboard = () => {
  const [keyboardState, setKeyboardState] = useState({
    isKeyboardVisible: false,
    keyboardHeight: 0,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const updateKeyboardState = useCallback(() => {
    if (typeof window === 'undefined') return;

    const visualViewport = window.visualViewport;

    if (visualViewport) {
      // Visual viewport is available (modern browsers)
      const viewportHeight = visualViewport.height;
      const windowHeight = window.innerHeight;

      // Keyboard is visible if visual viewport is significantly smaller than window
      // Using 150px threshold to account for address bar changes
      const heightDiff = windowHeight - viewportHeight;
      const isKeyboardVisible = heightDiff > 150;

      setKeyboardState({
        isKeyboardVisible,
        keyboardHeight: isKeyboardVisible ? heightDiff : 0,
        viewportHeight,
      });
    } else {
      // Fallback for older browsers - use window resize detection
      setKeyboardState(prev => ({
        ...prev,
        viewportHeight: window.innerHeight,
      }));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const visualViewport = window.visualViewport;

    // Initial state
    updateKeyboardState();

    if (visualViewport) {
      // Use visualViewport events for accurate detection
      visualViewport.addEventListener('resize', updateKeyboardState);
      visualViewport.addEventListener('scroll', updateKeyboardState);

      return () => {
        visualViewport.removeEventListener('resize', updateKeyboardState);
        visualViewport.removeEventListener('scroll', updateKeyboardState);
      };
    } else {
      // Fallback to window resize
      window.addEventListener('resize', updateKeyboardState);

      return () => {
        window.removeEventListener('resize', updateKeyboardState);
      };
    }
  }, [updateKeyboardState]);

  return keyboardState;
};
