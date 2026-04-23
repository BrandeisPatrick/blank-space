import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { SandpackPreview, type SandpackFiles, type SandpackPreviewError } from '@/components/dom';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getTheme } from '../../../src/styles/theme';

export type { SandpackFiles };
export type PreviewError = SandpackPreviewError;

export function PreviewSheet({
  visible,
  title,
  files,
  onClose,
  onError,
  onFixBug,
}: {
  visible: boolean;
  title?: string;
  files: SandpackFiles;
  onClose: () => void;
  onError?: (err: PreviewError) => void;
  onFixBug?: (err: PreviewError) => void;
}) {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { height: windowH } = useWindowDimensions();
  const previewHeight = Math.max(400, windowH - 140);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bg.primary }]}
        edges={['top', 'bottom']}
      >
        <View style={[styles.header, { borderBottomColor: theme.colors.bg.border }]}>
          <Pressable onPress={onClose} hitSlop={10}>
            <ThemedText style={[styles.action, { color: theme.colors.accent.ios }]}>Done</ThemedText>
          </Pressable>
          <ThemedText
            numberOfLines={1}
            style={[styles.title, { color: theme.colors.text.primary }]}
          >
            {title || 'Preview'}
          </ThemedText>
          <View style={styles.actionSpacer} />
        </View>

        <View style={styles.body}>
          <SandpackPreview
            files={files}
            theme={mode}
            height={previewHeight}
            onError={(err: PreviewError) => {
              onError?.(err);
            }}
            dom={{
              style: { flex: 1, alignSelf: 'stretch', height: previewHeight },
              matchContents: false,
            }}
          />
        </View>

        {onFixBug && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onFixBug({ message: 'User requested fix' });
            }}
            style={({ pressed }) => [
              styles.fixBtn,
              {
                backgroundColor: theme.colors.accent.ios,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <IconSymbol size={16} name="wand.and.stars" color="#fff" />
            <ThemedText style={styles.fixBtnText}>Fix with AI</ThemedText>
          </Pressable>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  action: { fontSize: 16, fontWeight: '500' },
  actionSpacer: { width: 48 },
  title: { fontSize: 17, fontWeight: '600', flex: 1, textAlign: 'center' },
  body: { flex: 1 },
  dom: { flex: 1, width: '100%', height: '100%' },
  fixBtn: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fixBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
