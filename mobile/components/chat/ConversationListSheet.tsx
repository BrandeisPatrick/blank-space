import { ActionSheetIOS, FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getTheme } from '../../../src/styles/theme';

type ConversationRow = {
  id: string;
  title: string;
  messageCount: number;
  updatedAt?: number | string | null;
};

export function ConversationListSheet({
  visible,
  conversations,
  activeId,
  onClose,
  onSelect,
  onDelete,
  onNew,
}: {
  visible: boolean;
  conversations: ConversationRow[];
  activeId: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  const { mode } = useTheme();
  const theme = getTheme(mode);

  const confirmDelete = (item: ConversationRow) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: item.title || 'Conversation',
        message: 'Delete this conversation? This cannot be undone.',
        options: ['Delete', 'Cancel'],
        destructiveButtonIndex: 0,
        cancelButtonIndex: 1,
        userInterfaceStyle: mode,
      },
      (idx) => {
        if (idx === 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onDelete(item.id);
        }
      },
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bg.primary }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: theme.colors.bg.border }]}>
          <Pressable onPress={onClose} hitSlop={10}>
            <ThemedText style={[styles.headerAction, { color: theme.colors.accent.ios }]}>Done</ThemedText>
          </Pressable>
          <ThemedText style={[styles.title, { color: theme.colors.text.primary }]}>Conversations</ThemedText>
          <Pressable
            onPress={() => {
              onNew();
              onClose();
            }}
            hitSlop={10}
          >
            <ThemedText style={[styles.headerAction, { color: theme.colors.accent.ios }]}>New</ThemedText>
          </Pressable>
        </View>

        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.colors.bg.border }]} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText style={{ color: theme.colors.text.tertiary }}>
                No conversations yet.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => {
            const isActive = item.id === activeId;
            return (
              <Pressable
                onPress={() => {
                  onSelect(item.id);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: isActive
                      ? theme.colors.bg.secondary
                      : pressed
                        ? theme.colors.bg.tertiary
                        : 'transparent',
                  },
                ]}
              >
                <View style={styles.rowMain}>
                  <ThemedText
                    numberOfLines={1}
                    style={[styles.rowTitle, { color: theme.colors.text.primary }]}
                  >
                    {item.title || 'New conversation'}
                  </ThemedText>
                  <ThemedText style={[styles.rowMeta, { color: theme.colors.text.tertiary }]}>
                    {item.messageCount} {item.messageCount === 1 ? 'message' : 'messages'}
                  </ThemedText>
                </View>
                <Pressable onPress={() => confirmDelete(item)} hitSlop={10} style={styles.deleteBtn}>
                  <IconSymbol size={18} name="trash" color={theme.colors.text.tertiary} />
                </Pressable>
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerAction: { fontSize: 16, fontWeight: '500' },
  title: { fontSize: 17, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 16 },
  rowMeta: { fontSize: 12 },
  deleteBtn: { padding: 6 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  empty: { padding: 32, alignItems: 'center' },
});
