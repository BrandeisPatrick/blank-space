import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import {
  openAttachmentSheet,
  openTierPickerSheet,
  openVoiceComingSoon,
} from '@/lib/action-sheets';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getTheme } from '../../../src/styles/theme';
import { MODEL_TIERS } from '../../../src/services/config/modelConfig';

type TierKey = keyof typeof MODEL_TIERS;

export function Composer({
  onSend,
  disabled,
  initialValue,
  modelTier,
  onChangeTier,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  initialValue?: string;
  modelTier?: TierKey;
  onChangeTier?: (next: TierKey) => void;
}) {
  const [value, setValue] = useState(initialValue ?? '');
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const activeTier = (modelTier && MODEL_TIERS[modelTier]) || MODEL_TIERS.lite;

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
  const openTierPicker = () => {
    if (!onChangeTier) return;
    openTierPickerSheet({ current: modelTier ?? 'lite', mode, onChange: onChangeTier });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg.primary }]}>
      <View
        style={[
          styles.pill,
          {
            backgroundColor: theme.colors.bg.secondary,
            borderColor: theme.colors.bg.border,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="Message…"
          placeholderTextColor={theme.colors.text.tertiary}
          multiline
          style={[styles.input, { color: theme.colors.text.primary }]}
          submitBehavior="newline"
        />

        <View style={styles.actionRow}>
          <Pressable
            onPress={handleAttach}
            hitSlop={6}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: theme.colors.bg.tertiary,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <IconSymbol size={16} name="paperclip" color={theme.colors.text.secondary} />
          </Pressable>

          <Pressable
            onPress={openTierPicker}
            hitSlop={6}
            style={({ pressed }) => [
              styles.tierChip,
              {
                backgroundColor: theme.colors.bg.tertiary,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <IconSymbol
              size={13}
              name={modelTier === 'pro' ? 'sparkles' : 'bolt.fill'}
              color={theme.colors.text.primary}
            />
            <ThemedText style={[styles.tierLabel, { color: theme.colors.text.primary }]}>
              {activeTier.name}
            </ThemedText>
            <IconSymbol size={10} name="chevron.down" color={theme.colors.text.tertiary} />
          </Pressable>

          <View style={{ flex: 1 }} />

          {canSend ? (
            <Pressable
              onPress={handleSend}
              hitSlop={6}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: theme.colors.text.primary,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <IconSymbol
                size={16}
                name="arrow.up"
                color={theme.colors.bg.primary}
                weight="bold"
              />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleSpeak}
              hitSlop={6}
              style={({ pressed }) => [
                styles.speakChip,
                {
                  backgroundColor: theme.colors.bg.tertiary,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <IconSymbol size={14} name="waveform" color={theme.colors.text.primary} />
              <ThemedText style={[styles.speakLabel, { color: theme.colors.text.primary }]}>
                Speak
              </ThemedText>
            </Pressable>
          )}
        </View>
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
  pill: {
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    minHeight: 24,
    maxHeight: 140,
    padding: 0,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
  },
  tierLabel: { fontSize: 13, fontWeight: '600' },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  speakLabel: { fontSize: 13, fontWeight: '600' },
});
