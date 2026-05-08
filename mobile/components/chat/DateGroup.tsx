import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { ConversationRow } from '@/lib/conversations';
import { getTheme } from '../../../src/styles/theme';

export type DateGroupTheme = ReturnType<typeof getTheme>;

export function DateGroup({
  title,
  rows,
  activeId,
  onSelect,
  onDelete,
  theme,
}: {
  title: string;
  rows: ConversationRow[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (item: ConversationRow) => void;
  theme: DateGroupTheme;
}) {
  return (
    <View style={styles.dateGroup}>
      <ThemedText style={[styles.dateGroupTitle, { color: theme.colors.text.tertiary }]}>
        {title}
      </ThemedText>
      {rows.map((item) => {
        const isActive = item.id === activeId;
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            onLongPress={() => onDelete(item)}
            delayLongPress={400}
            style={({ pressed }) => [
              styles.convRow,
              {
                backgroundColor: isActive
                  ? theme.colors.bg.secondary
                  : pressed
                    ? theme.colors.bg.tertiary
                    : 'transparent',
              },
            ]}
          >
            <ThemedText
              numberOfLines={1}
              style={[
                styles.convTitle,
                {
                  color: theme.colors.text.primary,
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
            >
              {item.title || 'New conversation'}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dateGroup: { marginTop: 8, gap: 1 },
  dateGroupTitle: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 10,
    paddingVertical: 6,
    letterSpacing: 0.2,
  },
  convRow: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  convTitle: { fontSize: 14 },
});
