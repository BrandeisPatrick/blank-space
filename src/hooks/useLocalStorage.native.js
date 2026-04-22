import { useState, useCallback } from 'react';

/**
 * React Native variant of useLocalStorage / useSessionStorage.
 *
 * Metro auto-selects this over useLocalStorage.js on iOS/Android builds.
 * Current implementation: in-memory Map, scoped per key. Survives across
 * components in the same session but NOT across app restarts.
 *
 * Phase 2+ replaces this with expo-secure-store (for auth/tokens) or
 * @react-native-async-storage/async-storage (for user preferences like
 * themeMode). The public API stays the same so call sites don't change.
 */
const memoryStore = new Map();

export function useSessionStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    return memoryStore.has(key) ? memoryStore.get(key) : initialValue;
  });

  const setValue = useCallback(
    (value) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        memoryStore.set(key, valueToStore);
        return valueToStore;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}

export const useLocalStorage = useSessionStorage;
