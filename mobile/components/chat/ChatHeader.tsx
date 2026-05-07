import { ActionSheetIOS, Platform, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getTheme } from '../../../src/styles/theme';
import { MODEL_TIERS } from '../../../src/services/config/modelConfig';

type TierKey = keyof typeof MODEL_TIERS;
const TIER_KEYS = Object.keys(MODEL_TIERS) as TierKey[];

export function ChatHeader({
  title,
  modelTier,
  onChangeTier,
  onOpenList,
  onNewChat,
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

  const openTierPicker = () => {
    Haptics.selectionAsync();
    if (Platform.OS !== 'ios') {
      const next = TIER_KEYS[(TIER_KEYS.indexOf(modelTier) + 1) % TIER_KEYS.length];
      onChangeTier(next);
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
        onChangeTier(TIER_KEYS[index]);
      },
    );
  };

  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: theme.colors.bg.border },
      ]}
    >
      <HeaderButton onPress={onOpenList} iconName="line.3.horizontal" tint={theme.colors.text.primary} />

      <Pressable
        onPress={openTierPicker}
        hitSlop={6}
        style={({ pressed }) => [styles.titleBlock, { opacity: pressed ? 0.6 : 1 }]}
      >
        <ThemedText
          numberOfLines={1}
          style={[styles.title, { color: theme.colors.text.primary }]}
        >
          {title || 'blank space'}
        </ThemedText>
        <View style={styles.subRow}>
          <ThemedText style={[styles.subText, { color: theme.colors.text.tertiary }]}>
            {activeTier.name}
          </ThemedText>
          <IconSymbol size={10} name="chevron.down" color={theme.colors.text.tertiary} />
        </View>
      </Pressable>

      <HeaderButton onPress={onNewChat} iconName="square.and.pencil" tint={theme.colors.text.primary} />
    </View>
  );
}

function HeaderButton({
  onPress,
  iconName,
  tint,
}: {
  onPress: () => void;
  iconName: string;
  tint: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.55 : 1 }]}
    >
      <IconSymbol size={22} name={iconName as never} color={tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  button: { padding: 6, width: 38, alignItems: 'center' },
  titleBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 1 },
  title: { fontSize: 17, fontWeight: '600', maxWidth: '80%', textAlign: 'center' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  subText: { fontSize: 12, fontWeight: '500' },
});
