import { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@shared/contexts/ThemeContext';
import { getTheme } from '@shared/styles/theme';

export type SelectionOption<T extends string> = {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
};

export function SelectionSheet<T extends string>({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title?: string;
  options: readonly SelectionOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}) {
  const { mode } = useTheme();
  const theme = getTheme(mode);

  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fade.setValue(0);
      scale.setValue(0.95);
    }
  }, [visible, fade, scale]);

  const handleSelect = (value: T) => {
    Haptics.selectionAsync();
    onSelect(value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.backdrop,
          { backgroundColor: theme.effects.overlay.dark, opacity: fade },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
      </Animated.View>

      <View pointerEvents="box-none" style={styles.center}>
        <Animated.View
          style={[
            styles.card,
            theme.nativeShadow.lg,
            {
              backgroundColor: theme.colors.bg.secondary,
              borderColor: theme.colors.bg.border,
              opacity: fade,
              transform: [{ scale }],
            },
          ]}
        >
          {title ? (
            <View style={[styles.titleRow, { borderBottomColor: theme.colors.bg.border }]}>
              <ThemedText variant="footnote" tone="tertiary">
                {title}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.options}>
            {options.map((opt) => {
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
                  <ThemedText
                    variant="headline"
                    tone={isSelected ? 'accent' : 'primary'}
                    style={isSelected ? styles.optionLabelSelected : undefined}
                  >
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    minWidth: 260,
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  titleRow: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 6,
  },
  options: {
    gap: 4,
  },
  option: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabelSelected: {
    fontWeight: '600',
  },
});
