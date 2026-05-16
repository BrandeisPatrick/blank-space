import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTheme } from '@shared/contexts/ThemeContext';
import { getTheme } from '@shared/styles/theme';

type TextAction = {
  kind: 'text';
  label: string;
  onPress: () => void;
  emphasized?: boolean;
};

type CircleAction = {
  kind: 'circle';
  onPress: () => void;
};

type Action = TextAction | CircleAction | { kind: 'none' };

export function SheetHeader({
  title,
  left,
  right,
}: {
  title: string;
  left?: Action;
  right?: Action;
}) {
  const { mode } = useTheme();
  const theme = getTheme(mode);

  return (
    <View style={[styles.header, { borderBottomColor: theme.colors.bg.border }]}>
      <View style={styles.slot}>
        {renderAction(left, theme)}
      </View>
      <ThemedText variant="title3" tone="primary" numberOfLines={1} style={styles.title}>
        {title}
      </ThemedText>
      <View style={styles.slot}>
        {renderAction(right, theme)}
      </View>
    </View>
  );
}

function renderAction(action: Action | undefined, theme: ReturnType<typeof getTheme>): ReactNode {
  if (!action || action.kind === 'none') return null;
  if (action.kind === 'text') {
    return (
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          action.onPress();
        }}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={action.label}
        style={({ pressed }) => [{ opacity: pressed ? theme.opacity.pressed : 1 }]}
      >
        <ThemedText
          variant="headline"
          tone="link"
          style={action.emphasized ? styles.actionEmphasized : undefined}
        >
          {action.label}
        </ThemedText>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        action.onPress();
      }}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Close"
      style={({ pressed }) => [
        styles.headerCircle,
        {
          backgroundColor: theme.surfaces.glass.fill,
          borderColor: theme.surfaces.glass.border,
          opacity: pressed ? theme.opacity.pressed : 1,
        },
      ]}
    >
      <IconSymbol size={14} name="xmark" color={theme.colors.text.primary} weight="medium" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  slot: {
    minWidth: 48,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, textAlign: 'center' },
  actionEmphasized: { fontWeight: '600' },
  headerCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
