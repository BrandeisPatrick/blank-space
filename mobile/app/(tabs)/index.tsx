import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from 'react-native-bottom-tabs';

import { Composer } from '@/components/chat/Composer';
import { MessageList, type Message } from '@/components/chat/MessageList';
import { ModelTierPill } from '@/components/chat/ModelTierPill';
import { ThemedView } from '@/components/themed-view';
import { useConversation } from '../../../src/contexts/ConversationContext';
import { useLocalStorage } from '../../../src/hooks/useLocalStorage';
import { MODEL_TIERS, getModelForTier } from '../../../src/services/config/modelConfig';

const API_URL = 'https://www.blankspace.build/api/chat';
type TierKey = keyof typeof MODEL_TIERS;

export default function ChatScreen() {
  const { messages, addMessage, setMessages } = useConversation();
  const [sending, setSending] = useState(false);
  const [modelTier, setModelTier] = useLocalStorage('modelTier', 'lite') as [TierKey, (v: TierKey) => void];
  const tabBarHeight = useBottomTabBarHeight();

  const handleSend = async (text: string) => {
    const userMsg = {
      id: `${Date.now()}-u`,
      role: 'user' as const,
      content: text,
    };
    const placeholderId = `${Date.now()}-a`;
    const placeholder = {
      id: placeholderId,
      role: 'assistant' as const,
      content: 'Thinking…',
    };

    await addMessage(userMsg);
    await addMessage(placeholder);
    setSending(true);

    try {
      const history = [...(messages as Message[]), userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: getModelForTier(modelTier), messages: history }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        throw new Error(errBody.message || `Request failed (${res.status})`);
      }

      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content ?? '(empty response)';

      await setMessages((prev: Message[]) =>
        prev.map((m) => (m.id === placeholderId ? { ...m, content: reply } : m)),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      await setMessages((prev: Message[]) =>
        prev.map((m) =>
          m.id === placeholderId ? { ...m, content: `⚠️ ${msg}` } : m,
        ),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <MessageList messages={messages as Message[]} />
          <View style={{ paddingBottom: tabBarHeight }}>
            <ModelTierPill value={modelTier} onChange={setModelTier} />
            <Composer onSend={handleSend} disabled={sending} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },
});
