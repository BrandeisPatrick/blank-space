import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { SandpackPreview, type SandpackFiles, type SandpackPreviewError } from '@/components/dom';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@shared/contexts/ThemeContext';
import { getTheme } from '@shared/styles/theme';

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
        <SheetHeader
          title={title || 'Preview'}
          left={{ kind: 'text', label: 'Done', onPress: onClose }}
        />

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
            accessibilityRole="button"
            accessibilityLabel="Fix with AI"
            style={({ pressed }) => [
              styles.fixBtn,
              theme.nativeShadow.lg,
              {
                backgroundColor: theme.colors.accent.ios,
                opacity: pressed ? theme.opacity.pressedStrong : 1,
              },
            ]}
          >
            <IconSymbol size={16} name="wand.and.stars" color={theme.colorVariants.white} />
            <ThemedText variant="subhead" style={[styles.fixBtnText, { color: theme.colorVariants.white }]}>Fix with AI</ThemedText>
          </Pressable>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1 },
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
  },
  fixBtnText: { fontWeight: '600' },
});
