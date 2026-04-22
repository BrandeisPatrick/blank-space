import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Composer } from '@/components/chat/Composer';
import { MessageList, type Message } from '@/components/chat/MessageList';
import { ThemedView } from '@/components/themed-view';

const API_URL = 'https://www.blankspace.build/api/chat';
const MODEL = 'gpt-5-mini';

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);

  const handleSend = async (text: string) => {
    const userMsg: Message = {
      id: `${Date.now()}-u`,
      role: 'user',
      content: text,
    };
    const placeholderId = `${Date.now()}-a`;
    const placeholder: Message = {
      id: placeholderId,
      role: 'assistant',
      content: 'Thinking…',
    };

    setMessages((prev) => [...prev, userMsg, placeholder]);
    setSending(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, messages: history }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        throw new Error(errBody.message || `Request failed (${res.status})`);
      }

      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content ?? '(empty response)';

      setMessages((prev) =>
        prev.map((m) => (m.id === placeholderId ? { ...m, content: reply } : m)),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setMessages((prev) =>
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
          <MessageList messages={messages} />
          <Composer onSend={handleSend} disabled={sending} />
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
