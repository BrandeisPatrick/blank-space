import { useEffect, useRef } from 'react';
import { Animated, Easing, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getTheme } from '../../../src/styles/theme';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const SUGGESTED_PROMPTS = [
  'Build me a pomodoro timer',
  'Make a to-do list with categories',
  'Create a tip calculator',
  'Code a color palette picker',
];

export function MessageList({
  messages,
  sending,
  onSuggestedPrompt,
}: {
  messages: Message[];
  sending?: boolean;
  onSuggestedPrompt?: (text: string) => void;
}) {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    if (messages.length === 0) return;
    const id = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(id);
  }, [messages.length, sending]);

  if (messages.length === 0) {
    return (
      <View style={styles.empty}>
        <ThemedText style={[styles.emptyTitle, { color: theme.colors.text.secondary }]}>
          What should we build?
        </ThemedText>
        <View style={styles.suggestions}>
          {SUGGESTED_PROMPTS.map((prompt) => (
            <Pressable
              key={prompt}
              onPress={() => onSuggestedPrompt?.(prompt)}
              style={({ pressed }) => [
                styles.suggestionPill,
                {
                  backgroundColor: theme.colors.bg.secondary,
                  borderColor: theme.colors.bg.border,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <ThemedText style={[styles.suggestionText, { color: theme.colors.text.primary }]}>
                {prompt}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(m) => m.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => <Bubble message={item} />}
      ListFooterComponent={sending ? <TypingBubble /> : null}
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
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

function TypingBubble() {
  const { mode } = useTheme();
  const theme = getTheme(mode);

  return (
    <View style={[styles.row, styles.rowLeft]}>
      <View
        style={[
          styles.bubble,
          styles.typingBubble,
          {
            backgroundColor: theme.colors.bg.secondary,
            borderColor: theme.colors.bg.border,
          },
        ]}
      >
        <TypingDot delay={0} color={theme.colors.text.tertiary} />
        <TypingDot delay={160} color={theme.colors.text.tertiary} />
        <TypingDot delay={320} color={theme.colors.text.tertiary} />
      </View>
    </View>
  );
}

function TypingDot({ delay, color }: { delay: number; color: string }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, delay]);

  return <Animated.View style={[styles.dot, { backgroundColor: color, opacity }]} />;
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
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '90%',
  },
  suggestionText: {
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
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
});
