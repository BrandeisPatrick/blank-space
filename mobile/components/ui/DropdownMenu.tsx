import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ui/ThemedText';
import type { SelectionOption } from '@/components/ui/SelectionSheet';
import { useTheme } from '@shared/contexts/ThemeContext';
import { getTheme } from '@shared/styles/theme';

export type DropdownAnchor = { x: number; y: number; width: number; height: number };

export type SelectionGroup<T extends string> = {
  options: readonly SelectionOption<T>[];
};

const MENU_GAP = 4;
const EDGE_PADDING = 12;
const DEFAULT_MIN_WIDTH = 280;

export function DropdownMenu<T extends string>({
  visible,
  anchor,
  options,
  groups,
  selectedValue,
  onSelect,
  onClose,
  align = 'center',
  minWidth = DEFAULT_MIN_WIDTH,
}: {
  visible: boolean;
  anchor: DropdownAnchor | null;
  options?: readonly SelectionOption<T>[];
  groups?: readonly SelectionGroup<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  onClose: () => void;
  align?: 'left' | 'center' | 'right';
  minWidth?: number;
}) {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { width: screenWidth } = useWindowDimensions();

  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fade, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    } else {
      fade.setValue(0);
    }
  }, [visible, fade]);

  const handleSelect = (value: T) => {
    Haptics.selectionAsync();
    onSelect(value);
    onClose();
  };

  if (!anchor) {
    return (
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Modal>
    );
  }

  const top = anchor.y + anchor.height + MENU_GAP;
  const menuWidth = Math.max(minWidth, DEFAULT_MIN_WIDTH);

  let left: number;
  if (align === 'left') {
    left = anchor.x;
  } else if (align === 'right') {
    left = anchor.x + anchor.width - menuWidth;
  } else {
    left = anchor.x + anchor.width / 2 - menuWidth / 2;
  }
  left = Math.max(EDGE_PADDING, Math.min(left, screenWidth - menuWidth - EDGE_PADDING));

  const resolvedGroups: readonly SelectionGroup<T>[] =
    groups ?? (options ? [{ options }] : []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.card,
          {
            top,
            left,
            width: menuWidth,
            opacity: fade,
          },
        ]}
      >
        {Platform.OS === 'ios' ? (
          <GlassView
            style={StyleSheet.absoluteFill}
            glassEffectStyle="regular"
            isInteractive={false}
          />
        ) : (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.surfaces.glass.fallback }]}
          />
        )}
        <View
          style={[styles.borderOverlay, { borderColor: theme.surfaces.glass.border }]}
          pointerEvents="none"
        />

        <View style={styles.content}>
          {resolvedGroups.map((group, groupIndex) => (
            <View key={groupIndex}>
              {groupIndex > 0 && (
                <View
                  style={[styles.divider, { backgroundColor: theme.colors.bg.border }]}
                />
              )}
              {group.options.map((opt) => {
                const isSelected = opt.value === selectedValue;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => !opt.disabled && handleSelect(opt.value)}
                    disabled={opt.disabled}
                    accessibilityRole="button"
                    accessibilityLabel={opt.label}
                    accessibilityState={{ selected: isSelected, disabled: opt.disabled }}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.accent.iosLight
                          : pressed
                            ? theme.colors.bg.tertiary
                            : 'transparent',
                        opacity: opt.disabled ? theme.opacity.disabled : 1,
                      },
                    ]}
                  >
                    <ThemedText variant="callout" tone="primary" style={styles.optionLabel}>
                      {opt.label}
                    </ThemedText>
                    {opt.description ? (
                      <ThemedText
                        variant="footnote"
                        tone="tertiary"
                        numberOfLines={2}
                        style={styles.optionDescription}
                      >
                        {opt.description}
                      </ThemedText>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    borderRadius: 14,
    overflow: 'hidden',
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 6,
    marginHorizontal: 6,
  },
  option: {
    minHeight: 52,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  optionLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
  optionDescription: {
    textAlign: 'center',
  },
});
