import { useEffect, useRef } from 'react';
import { Animated, Easing, FlatList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { Starburst } from '@/components/icons/Starburst';
import { useTheme } from '@shared/contexts/ThemeContext';
import { getTheme } from '@shared/styles/theme';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export function MessageList({
  messages,
  sending,
  bottomInset = 12,
}: {
  messages: Message[];
  sending?: boolean;
  bottomInset?: number;
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
        <Starburst size={56} color={theme.colors.accent.primary} />
        <ThemedText
          variant="title2"
          tone="secondary"
          style={styles.emptyHeadline}
        >
          How can I help you this evening?
        </ThemedText>
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(m) => m.id}
      contentContainerStyle={[styles.list, { paddingBottom: bottomInset }]}
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
              backgroundColor: theme.colors.bg.secondary,
              borderColor: theme.colors.bg.border,
            },
          ]}
        >
          <ThemedText variant="body" tone="primary">
            {message.content}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.assistantBlock}>
      <ThemedText variant="body" tone="primary">
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
      <View style={styles.typingRow}>
        <TypingDot delay={0} color={theme.colors.text.secondary} />
        <TypingDot delay={160} color={theme.colors.text.secondary} />
        <TypingDot delay={320} color={theme.colors.text.secondary} />
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
    gap: 18,
  },
  emptyHeadline: {
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  row: { flexDirection: 'row' },
  rowRight: { justifyContent: 'flex-end' },
  userBubble: {
    maxWidth: '82%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  assistantBlock: {
    gap: 6,
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
});
