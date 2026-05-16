import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@shared/contexts/AuthContext';
import { ConversationProvider } from '@shared/contexts/ConversationContext';
import { FileSystemProvider } from '@shared/contexts/FileSystemContext';
import { ThemeProvider as AppThemeProvider, useTheme } from '@shared/contexts/ThemeContext';
import { useAppSettings } from '@/lib/settings';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootStack() {
  const { mode, setMode } = useTheme();
  const { appearance, ready } = useAppSettings();
  const osScheme = useColorScheme();

  useEffect(() => {
    if (!ready) return;
    const resolved =
      appearance === 'system' ? (osScheme === 'dark' ? 'dark' : 'light') : appearance;
    setMode(resolved);
  }, [ready, appearance, osScheme, setMode]);

  return (
    <NavThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <ConversationProvider>
          <FileSystemProvider>
            <RootStack />
          </FileSystemProvider>
        </ConversationProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}
