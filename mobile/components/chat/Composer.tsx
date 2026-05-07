import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/icon-symbol';
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(trimmed);
    setValue('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg.primary }]}>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.colors.bg.secondary,
            borderColor: theme.colors.bg.border,
          },
        ]}
      >
        <View style={[styles.iconBtn, { opacity: 0.4 }]}>
          <IconSymbol size={20} name="plus" color={theme.colors.text.secondary} />
        </View>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="Ask blank space anything…"
          placeholderTextColor={theme.colors.text.tertiary}
          multiline
          style={[styles.input, { color: theme.colors.text.primary }]}
          submitBehavior="newline"
        />
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          hitSlop={6}
          style={[
            styles.sendButton,
            {
              backgroundColor: canSend ? theme.colors.text.primary : theme.colors.bg.tertiary,
            },
          ]}
        >
          <IconSymbol
            size={16}
            name="arrow.up"
            color={canSend ? theme.colors.bg.primary : theme.colors.text.tertiary}
            weight="bold"
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 140,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
