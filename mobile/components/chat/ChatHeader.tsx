import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getTheme } from '../../../src/styles/theme';
import { MODEL_TIERS } from '../../../src/services/config/modelConfig';

type TierKey = keyof typeof MODEL_TIERS;

export function ChatHeader({
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

  return (
    <View style={styles.row}>
      <CircleButton
        onPress={() => {
          Haptics.selectionAsync();
          onOpenList();
        }}
        iconName="line.3.horizontal"
        tint={theme.colors.text.primary}
        bg={theme.colors.bg.secondary}
        border={theme.colors.bg.border}
      />

      <View style={styles.tabsBlock}>
        <View
          style={[
            styles.activeTab,
            {
              backgroundColor: theme.colors.bg.secondary,
              borderColor: theme.colors.bg.border,
            },
          ]}
        >
          <ThemedText style={[styles.tabActiveText, { color: theme.colors.text.primary }]}>
            Ask
          </ThemedText>
        </View>
        <ThemedText style={[styles.tabInactiveText, { color: theme.colors.text.tertiary }]}>
          Build
        </ThemedText>
      </View>

      <CircleButton
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onNewChat();
        }}
        iconName="square.and.pencil"
        tint={theme.colors.text.primary}
        bg={theme.colors.bg.secondary}
        border={theme.colors.bg.border}
      />
    </View>
  );
}

function CircleButton({
  onPress,
  iconName,
  tint,
  bg,
  border,
}: {
  onPress: () => void;
  iconName: string;
  tint: string;
  bg: string;
  border: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.circleBtn,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: pressed ? 0.55 : 1,
        },
      ]}
    >
      <IconSymbol size={18} name={iconName as never} color={tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  tabsBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  activeTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tabActiveText: { fontSize: 14, fontWeight: '600' },
  tabInactiveText: { fontSize: 14, fontWeight: '500' },
});
