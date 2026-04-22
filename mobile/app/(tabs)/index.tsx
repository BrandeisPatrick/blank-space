import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.brand}>
          blank space
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          iOS · Phase 1 scaffold
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '600',
  },
  subtitle: {
    opacity: 0.6,
  },
});
