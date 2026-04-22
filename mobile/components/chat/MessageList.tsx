import { FlatList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getTheme } from '../../../src/styles/theme';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export function MessageList({ messages }: { messages: Message[] }) {
  const { mode } = useTheme();
  const theme = getTheme(mode);

  if (messages.length === 0) {
    return (
      <View style={styles.empty}>
        <ThemedText style={[styles.emptyText, { color: theme.colors.text.tertiary }]}>
          Say something to get started.
        </ThemedText>
      </View>
    );
  }

  return (
    <FlatList
      data={messages}
      keyExtractor={(m) => m.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => <Bubble message={item} />}
    />
  );
}

function Bubble({ message }: { message: Message }) {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? theme.colors.accent.ios : theme.colors.bg.secondary,
            borderColor: isUser ? 'transparent' : theme.colors.bg.border,
          },
        ]}
      >
        <ThemedText
          style={[
            styles.text,
            { color: isUser ? '#ffffff' : theme.colors.text.primary },
          ]}
        >
          {message.content}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
  },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
});
