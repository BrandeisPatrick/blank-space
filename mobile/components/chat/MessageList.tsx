import { useEffect, useRef } from 'react';
import { Animated, Easing, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getTheme } from '../../../src/styles/theme';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const SUGGESTIONS: { icon: string; label: string; prompt: string }[] = [
  { icon: 'timer', label: 'Pomodoro timer', prompt: 'Build me a pomodoro timer with start, pause, and reset.' },
  { icon: 'checklist', label: 'Todo list', prompt: 'Make a to-do list app with categories and a search bar.' },
  { icon: 'dollarsign.circle', label: 'Tip calculator', prompt: 'Create a tip calculator with split-by-people support.' },
  { icon: 'paintpalette', label: 'Color picker', prompt: 'Code a color palette picker that copies hex codes on tap.' },
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
        <View style={[styles.brandMark, { backgroundColor: theme.colors.bg.secondary, borderColor: theme.colors.bg.border }]}>
          <IconSymbol size={28} name="sparkles" color={theme.colors.text.primary} />
        </View>
        <ThemedText style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
          What should we build?
        </ThemedText>
        <ThemedText style={[styles.emptySubtitle, { color: theme.colors.text.tertiary }]}>
          Describe an app and blank space will create it for you.
        </ThemedText>
        <View style={styles.suggestions}>
          {SUGGESTIONS.map((s) => (
            <Pressable
              key={s.label}
              onPress={() => onSuggestedPrompt?.(s.prompt)}
              style={({ pressed }) => [
                styles.suggestionPill,
                {
                  backgroundColor: theme.colors.bg.secondary,
                  borderColor: theme.colors.bg.border,
                  opacity: pressed ? 0.55 : 1,
                },
              ]}
            >
              <IconSymbol size={16} name={s.icon as never} color={theme.colors.text.secondary} />
              <ThemedText style={[styles.suggestionText, { color: theme.colors.text.primary }]}>
                {s.label}
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
      renderItem={({ item }) => <MessageBlock message={item} />}
      ListFooterComponent={sending ? <TypingBubble /> : null}
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
    />
  );
}

function MessageBlock({ message }: { message: Message }) {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View style={[styles.row, styles.rowRight]}>
        <View
          style={[
            styles.userBubble,
            {
              backgroundColor: theme.colors.accent.ios,
            },
          ]}
        >
          <ThemedText style={[styles.text, { color: '#ffffff' }]}>
            {message.content}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.assistantBlock}>
      <View style={styles.assistantHeader}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.bg.secondary, borderColor: theme.colors.bg.border }]}>
          <IconSymbol size={12} name="sparkles" color={theme.colors.text.primary} />
        </View>
        <ThemedText style={[styles.assistantLabel, { color: theme.colors.text.tertiary }]}>
          blank space
        </ThemedText>
      </View>
      <ThemedText style={[styles.text, { color: theme.colors.text.primary, marginLeft: 32 }]}>
        {message.content}
      </ThemedText>
    </View>
  );
}

function TypingBubble() {
  const { mode } = useTheme();
  const theme = getTheme(mode);

  return (
    <View style={styles.assistantBlock}>
      <View style={styles.assistantHeader}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.bg.secondary, borderColor: theme.colors.bg.border }]}>
          <IconSymbol size={12} name="sparkles" color={theme.colors.text.primary} />
        </View>
        <ThemedText style={[styles.assistantLabel, { color: theme.colors.text.tertiary }]}>
          blank space
        </ThemedText>
      </View>
      <View style={[styles.typingRow, { marginLeft: 32 }]}>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 18,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  row: { flexDirection: 'row' },
  rowRight: { justifyContent: 'flex-end' },
  userBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },
  assistantBlock: {
    gap: 6,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  assistantLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
});
