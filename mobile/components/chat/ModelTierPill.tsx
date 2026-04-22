import { ActionSheetIOS, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getTheme } from '../../../src/styles/theme';
import { MODEL_TIERS } from '../../../src/services/config/modelConfig';

type TierKey = keyof typeof MODEL_TIERS;

const TIER_KEYS = Object.keys(MODEL_TIERS) as TierKey[];

export function ModelTierPill({
  value,
  onChange,
}: {
  value: TierKey;
  onChange: (next: TierKey) => void;
}) {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const active = MODEL_TIERS[value] ?? MODEL_TIERS.lite;

  const openPicker = () => {
    if (Platform.OS !== 'ios') {
      const next = TIER_KEYS[(TIER_KEYS.indexOf(value) + 1) % TIER_KEYS.length];
      onChange(next);
      return;
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: 'Model',
        options: [...TIER_KEYS.map((k) => MODEL_TIERS[k].name), 'Cancel'],
        cancelButtonIndex: TIER_KEYS.length,
        userInterfaceStyle: mode,
      },
      (index) => {
        if (index < 0 || index >= TIER_KEYS.length) return;
        onChange(TIER_KEYS[index]);
      },
    );
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={openPicker}
        hitSlop={8}
        style={({ pressed }) => [
          styles.pill,
          {
            backgroundColor: theme.colors.bg.secondary,
            borderColor: theme.colors.bg.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <ThemedText style={[styles.text, { color: theme.colors.text.primary }]}>
          {active.name}
        </ThemedText>
        <ThemedText style={[styles.chevron, { color: theme.colors.text.tertiary }]}>
          ⌄
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 4,
    alignItems: 'flex-start',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: { fontSize: 13, fontWeight: '500' },
  chevron: { fontSize: 13, lineHeight: 13 },
});
