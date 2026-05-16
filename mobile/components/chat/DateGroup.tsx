import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import type { ConversationRow } from '@/lib/conversations';
import { getTheme } from '@shared/styles/theme';

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
      <ThemedText
        variant="caption"
        tone="tertiary"
        style={styles.dateGroupTitle}
      >
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
            accessibilityRole="button"
            accessibilityLabel={item.title || 'New conversation'}
            accessibilityHint="Long-press to delete"
            accessibilityState={{ selected: isActive }}
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
              variant="subhead"
              numberOfLines={1}
              style={{
                color: theme.colors.text.primary,
                fontWeight: isActive ? '600' : '400',
              }}
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
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  convRow: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
