import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '../../src/contexts/AuthContext';
import { ConversationProvider } from '../../src/contexts/ConversationContext';
import { FileSystemProvider } from '../../src/contexts/FileSystemContext';
import { ThemeProvider as AppThemeProvider, useTheme } from '../../src/contexts/ThemeContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootStack() {
  const { mode } = useTheme();
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
