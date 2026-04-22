import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MonacoEditor } from '@/components/dom';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getTheme } from '../../../src/styles/theme';

export function MonacoEditorSheet({
  visible,
  title,
  initialValue,
  language = 'javascript',
  onClose,
  onSave,
}: {
  visible: boolean;
  title?: string;
  initialValue: string;
  language?: string;
  onClose: () => void;
  onSave?: (value: string) => void;
}) {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { height: windowH } = useWindowDimensions();
  const [value, setValue] = useState(initialValue);
  const editorHeight = Math.max(400, windowH - 140);

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
            <ThemedText style={[styles.action, { color: theme.colors.accent.ios }]}>Cancel</ThemedText>
          </Pressable>
          <ThemedText
            numberOfLines={1}
            style={[styles.title, { color: theme.colors.text.primary }]}
          >
            {title || 'Editor'}
          </ThemedText>
          <Pressable
            onPress={() => {
              onSave?.(value);
              onClose();
            }}
            hitSlop={10}
          >
            <ThemedText style={[styles.action, { color: theme.colors.accent.ios, fontWeight: '600' }]}>
              Save
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.body}>
          <MonacoEditor
            value={value}
            onChange={(v: string | undefined) => setValue(v ?? '')}
            language={language}
            mode={mode}
            height={editorHeight}
            dom={{ style: [styles.dom, { height: editorHeight }], matchContents: false }}
          />
        </View>
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
  title: { fontSize: 17, fontWeight: '600', flex: 1, textAlign: 'center' },
  body: { flex: 1 },
  dom: { flex: 1, width: '100%', height: '100%' },
});
