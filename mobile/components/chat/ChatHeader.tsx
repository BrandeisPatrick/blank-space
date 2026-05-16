import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { GhostIcon } from '@/components/icons/GhostIcon';
import {
  DropdownMenu,
  IconSymbol,
  ThemedText,
  type DropdownAnchor,
  type SelectionOption,
} from '@/components/ui';
import { useTheme } from '@shared/contexts/ThemeContext';
import { getTheme } from '@shared/styles/theme';
import { MODEL_TIERS } from '@shared/services/config/modelConfig';

type TierKey = keyof typeof MODEL_TIERS;

export function ChatHeader({
  modelTier,
  onChangeTier,
  onOpenList,
  incognito,
  onToggleIncognito,
}: {
  title?: string | null;
  modelTier: TierKey;
  onChangeTier: (next: TierKey) => void;
  onOpenList: () => void;
  incognito: boolean;
  onToggleIncognito: () => void;
}) {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const activeTier = MODEL_TIERS[modelTier] ?? MODEL_TIERS.lite;
  const circleBg = theme.surfaces.glass.fill;
  const circleBorder = theme.surfaces.glass.border;
  const ghostActiveBg = theme.colors.accent.primary;
  const ghostIconColor = incognito ? theme.colorVariants.white : theme.colors.text.primary;
  const ghostEyeColor = incognito ? theme.colors.accent.primary : theme.colors.bg.primary;

  const [tierPickerOpen, setTierPickerOpen] = useState(false);
  const [tierAnchor, setTierAnchor] = useState<DropdownAnchor | null>(null);
  const tierAnchorRef = useRef<View>(null);
  const tierOptions = useMemo<readonly SelectionOption<TierKey>[]>(
    () =>
      (Object.keys(MODEL_TIERS) as TierKey[]).map((key) => ({
        value: key,
        label: MODEL_TIERS[key].name,
        description: MODEL_TIERS[key].description,
      })),
    [],
  );

  const openTierPicker = () => {
    Haptics.selectionAsync();
    tierAnchorRef.current?.measureInWindow((x, y, width, height) => {
      setTierAnchor({ x, y, width, height });
      setTierPickerOpen(true);
    });
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onOpenList();
        }}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Open conversation list"
        style={({ pressed }) => [
          styles.circleBtn,
          { backgroundColor: circleBg, borderColor: circleBorder, opacity: pressed ? theme.opacity.pressed : 1 },
        ]}
      >
        <IconSymbol size={18} name="sidebar.left" color={theme.colors.text.primary} weight="medium" />
      </Pressable>

      <View ref={tierAnchorRef} collapsable={false} style={styles.titleStack}>
        <Pressable
          onPress={openTierPicker}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Model: ${activeTier.name}. Tap to change.`}
          style={({ pressed }) => [styles.titleRow, { opacity: pressed ? theme.opacity.pressed : 1 }]}
        >
          <ThemedText variant="title3" tone="primary">
            {activeTier.name}
          </ThemedText>
          <IconSymbol size={12} name="chevron.down" color={theme.colors.text.secondary} weight="medium" />
        </Pressable>
      </View>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(
            incognito ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
          );
          onToggleIncognito();
        }}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={incognito ? 'Exit incognito mode' : 'Start incognito chat'}
        accessibilityState={{ selected: incognito }}
        style={({ pressed }) => [
          styles.circleBtn,
          {
            backgroundColor: incognito ? ghostActiveBg : circleBg,
            borderColor: incognito ? ghostActiveBg : circleBorder,
            opacity: pressed ? theme.opacity.pressed : 1,
          },
        ]}
      >
        <GhostIcon size={20} color={ghostIconColor} eyeColor={ghostEyeColor} />
      </Pressable>

      <DropdownMenu
        visible={tierPickerOpen}
        anchor={tierAnchor}
        align="center"
        minWidth={170}
        options={tierOptions}
        selectedValue={modelTier}
        onSelect={onChangeTier}
        onClose={() => setTierPickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  titleStack: {
    flex: 1,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
