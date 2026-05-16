import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { BlurView, type BlurTint } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { openAttachmentSheet, openVoiceComingSoon } from '@/lib/action-sheets';
import { useTheme } from '@shared/contexts/ThemeContext';
import { getTheme } from '@shared/styles/theme';

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

  const handleAttach = () => openAttachmentSheet(mode);
  const handleSpeak = () => openVoiceComingSoon();

  const tint = theme.surfaces.glass.blurTint as BlurTint;
  const fallbackBg = theme.surfaces.glass.fallback;
  const glassBorder = theme.surfaces.glass.border;
  const sendBg = theme.surfaces.button.primary.bg;
  const sendIconColor = theme.surfaces.button.primary.fg;

  return (
    <View style={styles.container}>
      <View style={[styles.pill, theme.nativeShadow.md, { borderColor: glassBorder }]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={50} tint={tint} style={[StyleSheet.absoluteFill, styles.pillFill]} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.pillFill, { backgroundColor: fallbackBg }]} />
        )}
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="Chat with Claude"
          placeholderTextColor={theme.colors.text.tertiary}
          multiline
          style={[styles.input, { color: theme.colors.text.primary }]}
          submitBehavior="newline"
        />

        <View style={styles.actionRow}>
          <Pressable
            onPress={handleAttach}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Add attachment"
            style={({ pressed }) => [styles.plusBtn, { opacity: pressed ? theme.opacity.pressed : 1 }]}
          >
            <IconSymbol size={22} name="plus" color={theme.colors.text.secondary} weight="medium" />
          </Pressable>

          <View style={{ flex: 1 }} />

          <Pressable
            onPress={handleSpeak}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Voice input"
            style={({ pressed }) => [styles.micBtn, { opacity: pressed ? theme.opacity.pressed : 1 }]}
          >
            <IconSymbol size={18} name="mic" color={theme.colors.text.secondary} weight="medium" />
          </Pressable>

          <Pressable
            onPress={canSend ? handleSend : handleSpeak}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={canSend ? 'Send message' : 'Voice input'}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: sendBg, opacity: pressed ? theme.opacity.pressedStrong : 1 },
            ]}
          >
            <IconSymbol
              size={18}
              name={canSend ? 'arrow.up' : 'waveform'}
              color={sendIconColor}
              weight="bold"
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
  },
  pill: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
    overflow: 'hidden',
  },
  pillFill: { borderRadius: 22 },
  input: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 26,
    maxHeight: 140,
    padding: 0,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  plusBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
