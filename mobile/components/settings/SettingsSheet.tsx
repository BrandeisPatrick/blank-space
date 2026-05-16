import { ReactNode, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { SymbolViewProps } from 'expo-symbols';

import { PLACEHOLDER_USER } from '@/constants/user';
import { useAppSettings, type Appearance } from '@/lib/settings';
import {
  IconSymbol,
  SelectionSheet,
  SheetHeader,
  ThemedText,
  type SelectionOption,
} from '@/components/ui';
import { useTheme } from '@shared/contexts/ThemeContext';
import { getTheme } from '@shared/styles/theme';

const APPEARANCE_LABEL: Record<Appearance, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

const APPEARANCE_OPTIONS: readonly SelectionOption<Appearance>[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

type IconName = SymbolViewProps['name'];

export function SettingsSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { appearance, hapticsEnabled, setAppearance, setHapticsEnabled } = useAppSettings();
  const [appearancePickerOpen, setAppearancePickerOpen] = useState(false);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bg.primary }]}
        edges={['top', 'bottom']}
      >
        <SheetHeader
          title="Settings"
          left={{ kind: 'circle', onPress: onClose }}
        />

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.emailCard,
              { backgroundColor: theme.colors.bg.secondary, borderColor: theme.colors.bg.border },
            ]}
          >
            <ThemedText variant="headline" tone="primary">
              {PLACEHOLDER_USER.email}
            </ThemedText>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.bg.secondary, borderColor: theme.colors.bg.border }]}>
            <SettingsRow
              icon="moon.stars"
              label="Appearance"
              trailing={
                <View style={styles.trailingValue}>
                  <ThemedText variant="callout" tone="secondary">
                    {APPEARANCE_LABEL[appearance]}
                  </ThemedText>
                  <IconSymbol
                    size={12}
                    name="chevron.up.chevron.down"
                    color={theme.colors.text.tertiary}
                    weight="medium"
                  />
                </View>
              }
              onPress={() => {
                Haptics.selectionAsync();
                setAppearancePickerOpen(true);
              }}
            />
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.bg.secondary, borderColor: theme.colors.bg.border }]}>
            <SettingsRow
              icon="iphone.radiowaves.left.and.right"
              label="Haptic feedback"
              trailing={
                <Switch
                  value={hapticsEnabled}
                  onValueChange={(next) => {
                    Haptics.selectionAsync();
                    setHapticsEnabled(next);
                  }}
                  trackColor={{ true: theme.colors.accent.ios }}
                />
              }
            />
          </View>
        </ScrollView>

        <SelectionSheet
          visible={appearancePickerOpen}
          title="Appearance"
          options={APPEARANCE_OPTIONS}
          selectedValue={appearance}
          onSelect={setAppearance}
          onClose={() => setAppearancePickerOpen(false)}
        />
      </SafeAreaView>
    </Modal>
  );
}

function SettingsRow({
  icon,
  label,
  trailing,
  onPress,
}: {
  icon: IconName;
  label: string;
  trailing?: ReactNode;
  onPress?: () => void;
}) {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const Body = (
    <View style={styles.row}>
      <IconSymbol size={20} name={icon} color={theme.colors.text.primary} weight="regular" />
      <ThemedText variant="callout" tone="primary" style={styles.rowLabel}>
        {label}
      </ThemedText>
      {trailing}
    </View>
  );
  if (!onPress) return Body;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [{ opacity: pressed ? theme.opacity.pressed : 1 }]}
    >
      {Body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 16 },
  emailCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  section: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowLabel: { flex: 1 },
  trailingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
