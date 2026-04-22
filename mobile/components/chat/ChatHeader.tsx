import { Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getTheme } from '../../../src/styles/theme';

export function ChatHeader({
  onOpenList,
  onNewChat,
}: {
  onOpenList: () => void;
  onNewChat: () => void;
}) {
  const { mode } = useTheme();
  const theme = getTheme(mode);

  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: theme.colors.bg.border },
      ]}
    >
      <HeaderButton onPress={onOpenList} iconName="line.horizontal.3" tint={theme.colors.text.primary} />
      <View style={styles.spacer} />
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
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  button: { padding: 6 },
  spacer: { flex: 1 },
});
