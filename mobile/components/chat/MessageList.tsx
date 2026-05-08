import { useEffect, useRef } from 'react';
import { Animated, Easing, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { SUGGESTIONS } from '@/constants/suggestions';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getTheme } from '../../../src/styles/theme';

const BANNER_DARK = require('../../assets/images/banner-dark.png');
const BANNER_LIGHT = require('../../assets/images/banner-light.png');

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

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
        <Image
          source={mode === 'light' ? BANNER_LIGHT : BANNER_DARK}
          style={styles.banner}
          contentFit="contain"
        />
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
              <IconSymbol size={15} name={s.icon} color={theme.colors.text.secondary} />
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
              backgroundColor: theme.colors.bg.secondary,
              borderColor: theme.colors.bg.border,
            },
          ]}
        >
          <ThemedText style={[styles.text, { color: theme.colors.text.primary }]}>
            {message.content}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.assistantBlock}>
      <ThemedText style={[styles.text, { color: theme.colors.text.primary }]}>
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
    gap: 28,
  },
  banner: {
    width: 240,
    height: 56,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
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
