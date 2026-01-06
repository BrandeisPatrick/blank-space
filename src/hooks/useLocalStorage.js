import { useState, useCallback } from 'react';

/**
 * Custom hook for persisting state to sessionStorage
 * @param {string} key - The sessionStorage key
 * @param {*} initialValue - Default value if key doesn't exist
 * @returns {[*, Function]} Tuple of [storedValue, setValue]
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = sessionStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch {
      // Silent fail for sessionStorage errors
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}
