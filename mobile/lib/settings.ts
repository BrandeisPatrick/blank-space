import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Appearance = 'light' | 'dark' | 'system';

type SettingsShape = {
  appearance: Appearance;
  hapticsEnabled: boolean;
};

const STORAGE_KEY = 'openagent.settings.v1';

const DEFAULTS: SettingsShape = {
  appearance: 'light',
  hapticsEnabled: true,
};

function isValidAppearance(v: unknown): v is Appearance {
  return v === 'light' || v === 'dark' || v === 'system';
}

export type AppSettings = SettingsShape & {
  setAppearance: (a: Appearance) => Promise<void>;
  setHapticsEnabled: (b: boolean) => Promise<void>;
  ready: boolean;
};

export function useAppSettings(): AppSettings {
  const [settings, setSettings] = useState<SettingsShape>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setSettings({
              appearance: isValidAppearance(parsed?.appearance) ? parsed.appearance : DEFAULTS.appearance,
              hapticsEnabled: typeof parsed?.hapticsEnabled === 'boolean' ? parsed.hapticsEnabled : DEFAULTS.hapticsEnabled,
            });
          } catch {
            // bad JSON — fall through to defaults
          }
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: SettingsShape) => {
    setSettings(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // best-effort; in-memory state still updated
    }
  }, []);

  const setAppearance = useCallback(
    (a: Appearance) => persist({ ...settings, appearance: a }),
    [persist, settings],
  );
  const setHapticsEnabled = useCallback(
    (b: boolean) => persist({ ...settings, hapticsEnabled: b }),
    [persist, settings],
  );

  return {
    appearance: settings.appearance,
    hapticsEnabled: settings.hapticsEnabled,
    setAppearance,
    setHapticsEnabled,
    ready,
  };
}
