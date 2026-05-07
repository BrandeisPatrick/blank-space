import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from 'react-native-bottom-tabs';
import { useLocalSearchParams } from 'expo-router';

import { ChatHeader } from '@/components/chat/ChatHeader';
import { Composer } from '@/components/chat/Composer';
import { ConversationListSheet } from '@/components/chat/ConversationListSheet';
import { MessageList, type Message } from '@/components/chat/MessageList';
import { ThemedView } from '@/components/themed-view';
import { useConversation } from '../../../src/contexts/ConversationContext';
import { useLocalStorage } from '../../../src/hooks/useLocalStorage';
import { MODEL_TIERS, getModelForTier } from '../../../src/services/config/modelConfig';

const API_URL = 'https://www.blankspace.build/api/chat';
type TierKey = keyof typeof MODEL_TIERS;

export default function ChatScreen() {
  const {
    messages,
    addMessage,
    conversations,
    activeConversationId,
    createConversation,
    switchConversation,
    deleteConversation,
  } = useConversation();
  type ConvRow = { id: string; title: string; messageCount: number };
  const activeConversation = (conversations as ConvRow[]).find((c) => c.id === activeConversationId);
  const headerTitle =
    activeConversation && activeConversation.messageCount > 0 ? activeConversation.title : null;
  const [sending, setSending] = useState(false);
  const [modelTier, setModelTier] = useLocalStorage('modelTier', 'lite') as [TierKey, (v: TierKey) => void];
  const [listOpen, setListOpen] = useState(false);
  const [composerPrefill, setComposerPrefill] = useState('');
  const tabBarHeight = useBottomTabBarHeight();
  const { prefill } = useLocalSearchParams<{ prefill?: string }>();
  const consumedPrefillRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof prefill === 'string' && prefill.length > 0 && prefill !== consumedPrefillRef.current) {
      consumedPrefillRef.current = prefill;
      setComposerPrefill(prefill);
    }
  }, [prefill]);

  const handleSend = async (text: string) => {
    const userMsg = {
      id: `${Date.now()}-u`,
      role: 'user' as const,
      content: text,
    };
    await addMessage(userMsg);
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

      await addMessage({
        id: `${Date.now()}-a`,
        role: 'assistant',
        content: reply,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      await addMessage({
        id: `${Date.now()}-a`,
        role: 'assistant',
        content: `⚠️ ${msg}`,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ChatHeader
          title={headerTitle}
          modelTier={modelTier}
          onChangeTier={setModelTier}
          onOpenList={() => setListOpen(true)}
          onNewChat={() => createConversation()}
        />
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <MessageList
            messages={messages as Message[]}
            sending={sending}
            onSuggestedPrompt={handleSend}
          />
          <View style={{ paddingBottom: tabBarHeight }}>
            <Composer onSend={handleSend} disabled={sending} initialValue={composerPrefill} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <ConversationListSheet
        visible={listOpen}
        conversations={conversations}
        activeId={activeConversationId}
        onClose={() => setListOpen(false)}
        onSelect={switchConversation}
        onDelete={deleteConversation}
        onNew={createConversation}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },
});
