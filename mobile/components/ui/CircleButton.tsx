import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView, type BlurTint } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@shared/contexts/ThemeContext';
import { getTheme } from '@shared/styles/theme';
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
  const theme = getTheme(mode);

  const handlePress = () => {
    if (haptic === 'selection') Haptics.selectionAsync();
    else if (haptic === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const tint = theme.surfaces.glass.blurTint as BlurTint;
  const fallbackBg = theme.surfaces.glass.fillStrong;
  const borderColor = theme.surfaces.glass.borderStrong;
  const iconColor = theme.colors.text.primary;

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.btn, { opacity: pressed ? theme.opacity.pressed : 1 }]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView intensity={50} tint={tint} style={[StyleSheet.absoluteFill, styles.fill]} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.fill, { backgroundColor: fallbackBg }]} />
      )}
      <View style={[styles.borderOverlay, { borderColor }]} />
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
    overflow: 'hidden',
  },
  fill: { borderRadius: 19 },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
  },
  spacer: { width: 38, height: 38 },
});
