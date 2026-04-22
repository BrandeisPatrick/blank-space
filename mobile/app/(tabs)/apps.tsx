import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Cross-boundary import: pulling a shared constant from the web app's src/
// directory via Metro's watchFolders + nodeModulesPaths config. If this
// renders without a red screen, shared code works on both targets.
import { PANELS, TIMING } from '../../../src/constants';

export default function AppsScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title">Apps</ThemedText>
        <ThemedText style={styles.subtitle}>
          Your generated projects will live here.
        </ThemedText>
        <ThemedText style={styles.proof}>
          shared import OK · PANELS={Object.values(PANELS).join('/')} · dedupMs={TIMING.ERROR_DEDUP_WINDOW_MS}
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
    gap: 12,
  },
  subtitle: {
    opacity: 0.6,
    textAlign: 'center',
  },
  proof: {
    marginTop: 24,
    fontSize: 12,
    opacity: 0.5,
    fontFamily: 'Menlo',
    textAlign: 'center',
  },
});
