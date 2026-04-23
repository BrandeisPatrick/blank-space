import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getTheme } from '../../../src/styles/theme';

export function Composer({
  onSend,
  disabled,
  initialValue,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue ?? '');
  const { mode } = useTheme();
  const theme = getTheme(mode);

  useEffect(() => {
    if (initialValue !== undefined && initialValue !== '') {
      setValue(initialValue);
    }
  }, [initialValue]);

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.bg.primary,
          borderTopColor: theme.colors.bg.border,
        },
      ]}
    >
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.colors.bg.secondary,
            borderColor: theme.colors.bg.border,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="Message blank space…"
          placeholderTextColor={theme.colors.text.tertiary}
          multiline
          style={[styles.input, { color: theme.colors.text.primary }]}
          submitBehavior="newline"
        />
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={[
            styles.sendButton,
            {
              backgroundColor: canSend ? theme.colors.accent.ios : theme.colors.bg.tertiary,
              opacity: canSend ? 1 : 0.6,
            },
          ]}
          hitSlop={8}
        >
          <ThemedText style={[styles.sendText, { color: canSend ? '#ffffff' : theme.colors.text.tertiary }]}>
            Send
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 140,
    paddingVertical: 6,
  },
  sendButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-end',
  },
  sendText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
