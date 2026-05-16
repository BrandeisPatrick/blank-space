import { useTheme } from '@shared/contexts/ThemeContext';

// Delegate Expo template's useColorScheme to OpenAgent's ThemeContext so
// ThemedView, ThemedText, and any other template code respects the app's
// user-chosen theme mode instead of the OS setting. Falls back to 'dark'
// before the provider mounts (matches web default).
export function useColorScheme(): 'light' | 'dark' {
  const { mode } = useTheme();
  return mode;
}
