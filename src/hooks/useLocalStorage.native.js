import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * React Native variant of useLocalStorage / useSessionStorage.
 *
 * Metro auto-selects this over useLocalStorage.js on iOS/Android builds.
 *
 * Backing store: @react-native-async-storage/async-storage — persistent,
 * survives app restarts, suitable for theme preference, conversation IDs,
 * cached UI state, etc.
 *
 * NOT suitable for auth tokens or anything sensitive — those should go
 * through expo-secure-store. That's Phase 2.6 AuthContext territory.
 *
 * Semantics vs the web version:
 * - Returns `initialValue` synchronously on first render.
 * - Asynchronously hydrates from AsyncStorage on mount and replaces the
 *   state if a persisted value is found. Consumers see one re-render
 *   when hydration completes, similar to SSR rehydration on web.
 * - `setValue` applies locally immediately (optimistic) and fires
 *   AsyncStorage.setItem in the background; write failures are logged
 *   but don't throw to the caller.
 */
export function useSessionStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(key)
      .then((raw) => {
        if (cancelled) return;
        if (raw !== null) {
          try {
            setStoredValue(JSON.parse(raw));
          } catch {
            // Corrupt JSON — keep initialValue and let the next setValue
            // overwrite the stored entry.
          }
        }
        hydratedRef.current = true;
      })
      .catch((err) => {
        console.warn(`[useLocalStorage.native] read failed for "${key}":`, err);
        hydratedRef.current = true;
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  const setValue = useCallback(
    (value) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        AsyncStorage.setItem(key, JSON.stringify(next)).catch((err) => {
          console.warn(`[useLocalStorage.native] write failed for "${key}":`, err);
        });
        return next;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}

export const useLocalStorage = useSessionStorage;
