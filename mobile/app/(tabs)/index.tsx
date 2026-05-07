import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { ChatHeader } from '@/components/chat/ChatHeader';
import { Composer } from '@/components/chat/Composer';
import { SideDrawer } from '@/components/chat/SideDrawer';
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [composerPrefill, setComposerPrefill] = useState('');
  const { prefill, qa } = useLocalSearchParams<{ prefill?: string; qa?: string }>();
  const consumedPrefillRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof prefill === 'string' && prefill.length > 0 && prefill !== consumedPrefillRef.current) {
      consumedPrefillRef.current = prefill;
      setComposerPrefill(prefill);
    }
  }, [prefill]);

  useEffect(() => {
    if (qa === 'drawer') setDrawerOpen(true);
    if (qa === 'first-conv' && conversations.length > 0) {
      switchConversation(conversations[0].id);
    }
  }, [qa, conversations, switchConversation]);

  const autosent = useRef(false);
  useEffect(() => {
    if (qa === 'autosend' && !autosent.current) {
      autosent.current = true;
      handleSend('Say hi in three words');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qa]);

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
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ChatHeader
          title={headerTitle}
          modelTier={modelTier}
          onChangeTier={setModelTier}
          onOpenList={() => setDrawerOpen(true)}
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
          <Composer onSend={handleSend} disabled={sending} initialValue={composerPrefill} />
        </KeyboardAvoidingView>
      </SafeAreaView>
      <SideDrawer
        visible={drawerOpen}
        conversations={conversations}
        activeId={activeConversationId}
        onClose={() => setDrawerOpen(false)}
        onSelectConversation={switchConversation}
        onDeleteConversation={deleteConversation}
        onNewChat={createConversation}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },
});
