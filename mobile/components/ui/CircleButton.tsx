import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '../../../src/contexts/ThemeContext';
import type { SymbolViewProps } from 'expo-symbols';

type IconName = SymbolViewProps['name'];

export function CircleButton({
  iconName,
  iconSize = 18,
  onPress,
  haptic = 'selection',
  accessibilityLabel,
}: {
  iconName: IconName;
  iconSize?: number;
  onPress: () => void;
  haptic?: 'selection' | 'light' | 'none';
  accessibilityLabel?: string;
}) {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  const handlePress = () => {
    if (haptic === 'selection') Haptics.selectionAsync();
    else if (haptic === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  // Faux liquid-glass: translucent fill + soft inner highlight border
  const glassBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)';
  const iconColor = isDark ? '#ffffff' : '#000000';

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: glassBg,
          borderColor: glassBorder,
          opacity: pressed ? 0.55 : 1,
        },
      ]}
    >
      <IconSymbol size={iconSize} name={iconName} color={iconColor} />
    </Pressable>
  );
}

export function CircleButtonSpacer() {
  return <View style={styles.spacer} />;
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  spacer: { width: 38, height: 38 },
});
