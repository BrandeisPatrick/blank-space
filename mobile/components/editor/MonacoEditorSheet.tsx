import { useState } from 'react';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MonacoEditor } from '@/components/dom';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { useTheme } from '@shared/contexts/ThemeContext';
import { getTheme } from '@shared/styles/theme';

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
        <SheetHeader
          title={title || 'Editor'}
          left={{ kind: 'text', label: 'Cancel', onPress: onClose }}
          right={{
            kind: 'text',
            label: 'Save',
            emphasized: true,
            onPress: () => {
              onSave?.(value);
              onClose();
            },
          }}
        />

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
  body: { flex: 1 },
  dom: { flex: 1, width: '100%', height: '100%' },
});
