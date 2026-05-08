import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { openTierPickerSheet } from '@/lib/action-sheets';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getTheme } from '../../../src/styles/theme';
import { MODEL_TIERS } from '../../../src/services/config/modelConfig';

type TierKey = keyof typeof MODEL_TIERS;

export function ChatHeader({
  modelTier,
  onChangeTier,
  onOpenList,
}: {
  title?: string | null;
  modelTier: TierKey;
  onChangeTier: (next: TierKey) => void;
  onOpenList: () => void;
  onNewChat: () => void;
}) {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const activeTier = MODEL_TIERS[modelTier] ?? MODEL_TIERS.lite;

  const openTierPicker = () =>
    openTierPickerSheet({ current: modelTier, mode, onChange: onChangeTier });

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onOpenList();
        }}
        hitSlop={10}
        style={({ pressed }) => [styles.menuBtn, { opacity: pressed ? 0.55 : 1 }]}
      >
        <IconSymbol size={22} name="line.3.horizontal" color={theme.colors.text.primary} />
      </Pressable>

      <View style={{ flex: 1 }} />

      <Pressable
        onPress={openTierPicker}
        hitSlop={10}
        style={({ pressed }) => [styles.tierPicker, { opacity: pressed ? 0.55 : 1 }]}
      >
        <ThemedText style={[styles.tierLabel, { color: theme.colors.text.primary }]}>
          {activeTier.name}
        </ThemedText>
        <IconSymbol size={11} name="chevron.down" color={theme.colors.text.secondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  menuBtn: { padding: 6 },
  tierPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  tierLabel: { fontSize: 16, fontWeight: '500' },
});
