import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { ChatHeader, Composer, MessageList, SideDrawer, type Message } from '@/components/chat';
import { ThemedView } from '@/components/ui';
import { useConversation } from '@shared/contexts/ConversationContext';
import { useLocalStorage } from '@shared/hooks/useLocalStorage';
import { MODEL_TIERS, getModelForTier } from '@shared/services/config/modelConfig';

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
  const [incognito, setIncognito] = useState(false);
  const [incognitoMessages, setIncognitoMessages] = useState<Message[]>([]);
  const { prefill } = useLocalSearchParams<{ prefill?: string }>();
  const consumedPrefillRef = useRef<string | null>(null);

  const displayMessages = incognito ? incognitoMessages : (messages as Message[]);

  const toggleIncognito = () => {
    setIncognitoMessages([]);
    setIncognito((v) => !v);
  };

  useEffect(() => {
    if (typeof prefill === 'string' && prefill.length > 0 && prefill !== consumedPrefillRef.current) {
      consumedPrefillRef.current = prefill;
      setComposerPrefill(prefill);
    }
  }, [prefill]);

  const handleSend = async (text: string) => {
    const userMsg: Message = {
      id: `${Date.now()}-u`,
      role: 'user',
      content: text,
    };

    const baseHistory = incognito ? incognitoMessages : (messages as Message[]);
    if (incognito) {
      setIncognitoMessages((prev) => [...prev, userMsg]);
    } else {
      await addMessage(userMsg);
    }
    setSending(true);

    try {
      const history = [...baseHistory, userMsg].map((m) => ({
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

      const assistantMsg: Message = {
        id: `${Date.now()}-a`,
        role: 'assistant',
        content: reply,
      };
      if (incognito) {
        setIncognitoMessages((prev) => [...prev, assistantMsg]);
      } else {
        await addMessage(assistantMsg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      const errorMsg: Message = {
        id: `${Date.now()}-a`,
        role: 'assistant',
        content: `⚠️ ${msg}`,
      };
      if (incognito) {
        setIncognitoMessages((prev) => [...prev, errorMsg]);
      } else {
        await addMessage(errorMsg);
      }
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
          incognito={incognito}
          onToggleIncognito={toggleIncognito}
        />
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <MessageList
            messages={displayMessages}
            sending={sending}
            bottomInset={120}
          />
          <View style={styles.composerOverlay} pointerEvents="box-none">
            <Composer
              onSend={handleSend}
              disabled={sending}
              initialValue={composerPrefill}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <SideDrawer
        visible={drawerOpen}
        conversations={conversations}
        activeId={activeConversationId}
        onClose={() => setDrawerOpen(false)}
        onSelectConversation={(id) => {
          if (incognito) {
            setIncognito(false);
            setIncognitoMessages([]);
          }
          switchConversation(id);
        }}
        onDeleteConversation={deleteConversation}
        onNewChat={() => {
          if (incognito) {
            setIncognito(false);
            setIncognitoMessages([]);
          }
          createConversation();
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },
  composerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
