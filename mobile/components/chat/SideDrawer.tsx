import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { confirmDestructive } from '@/lib/action-sheets';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getTheme } from '../../../src/styles/theme';

const DRAWER_WIDTH = Math.min(320, Dimensions.get('window').width * 0.84);
const MS_PER_DAY = 86_400_000;

type ConversationRow = {
  id: string;
  title: string;
  messageCount: number;
  createdAt?: number | string | null;
  updatedAt?: number | string | null;
};

type NavItem = {
  key: string;
  pathname: '/' | '/apps' | '/files';
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'chat', pathname: '/', label: 'Chat', icon: 'message' },
  { key: 'computer', pathname: '/apps', label: 'Computer', icon: 'desktopcomputer' },
  { key: 'files', pathname: '/files', label: 'Files', icon: 'folder' },
];

type SideDrawerProps = {
  visible: boolean;
  conversations: ConversationRow[];
  activeId: string | null;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewChat: () => void;
};

export function SideDrawer(props: SideDrawerProps) {
  return (
    <Modal visible={props.visible} transparent animationType="none" onRequestClose={props.onClose}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <DrawerBody {...props} />
      </SafeAreaProvider>
    </Modal>
  );
}

function groupConversations(rows: ConversationRow[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - MS_PER_DAY);
  const groups: { today: ConversationRow[]; yesterday: ConversationRow[]; byYear: Record<string, ConversationRow[]> } = {
    today: [],
    yesterday: [],
    byYear: {},
  };
  rows.forEach((c) => {
    const ts = typeof c.createdAt === 'number' ? c.createdAt : Number(c.createdAt) || Date.now();
    const d = new Date(ts);
    if (d >= today) groups.today.push(c);
    else if (d >= yesterday) groups.yesterday.push(c);
    else {
      const y = d.getFullYear().toString();
      if (!groups.byYear[y]) groups.byYear[y] = [];
      groups.byYear[y].push(c);
    }
  });
  return groups;
}

function DrawerBody({
  visible,
  conversations,
  activeId,
  onClose,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
}: SideDrawerProps) {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const slideX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [historyOpen, setHistoryOpen] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideX, { toValue: 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, { toValue: -DRAWER_WIDTH, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, slideX, fade]);

  const navigate = (item: NavItem) => {
    Haptics.selectionAsync();
    onClose();
    if (pathname !== item.pathname) router.push(item.pathname);
  };

  const confirmDeleteConversation = (item: ConversationRow) => {
    confirmDestructive({
      title: item.title || 'Conversation',
      message: 'Delete this conversation? This cannot be undone.',
      mode,
      onConfirm: () => onDeleteConversation(item.id),
    });
  };

  const isChat = pathname === '/' || pathname === '/index';
  const topPad = Math.max(insets.top, 50);
  const bottomPad = Math.max(insets.bottom, 12);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => (c.title || '').toLowerCase().includes(q));
  }, [conversations, search]);
  const grouped = useMemo(() => groupConversations(filtered), [filtered]);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            backgroundColor: theme.colors.bg.primary,
            borderRightColor: theme.colors.bg.border,
            transform: [{ translateX: slideX }],
          },
        ]}
      >
        <View style={[styles.safe, { paddingTop: topPad, paddingBottom: bottomPad }]}>
          <View style={styles.brandRow}>
            <View style={styles.brandLetterBox}>
              <ThemedText
                style={[styles.brandLetter, { color: theme.colors.text.primary }]}
                allowFontScaling={false}
              >
                B
              </ThemedText>
            </View>
          </View>

          <View style={styles.searchWrap}>
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: theme.colors.bg.secondary,
                  borderColor: theme.colors.bg.border,
                },
              ]}
            >
              <IconSymbol size={14} name="magnifyingglass" color={theme.colors.text.tertiary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search"
                placeholderTextColor={theme.colors.text.tertiary}
                style={[styles.searchInput, { color: theme.colors.text.primary }]}
                returnKeyType="search"
              />
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              {NAV_ITEMS.map((item) => {
                const active =
                  (item.pathname === '/' && isChat) ||
                  (item.pathname !== '/' && pathname.startsWith(item.pathname));
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => navigate(item)}
                    style={({ pressed }) => [
                      styles.navRow,
                      {
                        backgroundColor: active
                          ? theme.colors.bg.secondary
                          : pressed
                            ? theme.colors.bg.tertiary
                            : 'transparent',
                      },
                    ]}
                  >
                    <IconSymbol
                      size={18}
                      name={item.icon as never}
                      color={active ? theme.colors.text.primary : theme.colors.text.secondary}
                    />
                    <ThemedText
                      style={[
                        styles.navLabel,
                        {
                          color: active ? theme.colors.text.primary : theme.colors.text.secondary,
                          fontWeight: active ? '600' : '500',
                        },
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                  </Pressable>
                );
              })}

              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setHistoryOpen((v) => !v);
                }}
                style={({ pressed }) => [
                  styles.navRow,
                  {
                    backgroundColor: pressed ? theme.colors.bg.tertiary : 'transparent',
                  },
                ]}
              >
                <IconSymbol size={18} name="clock" color={theme.colors.text.secondary} />
                <ThemedText style={[styles.navLabel, { color: theme.colors.text.secondary, flex: 1 }]}>
                  History
                </ThemedText>
                <IconSymbol
                  size={12}
                  name={historyOpen ? 'chevron.down' : 'chevron.right'}
                  color={theme.colors.text.tertiary}
                />
              </Pressable>
            </View>

            {historyOpen && (
              <View style={styles.historyBody}>
                {conversations.length === 0 ? (
                  <ThemedText style={[styles.emptyText, { color: theme.colors.text.tertiary }]}>
                    No recent conversations
                  </ThemedText>
                ) : (
                  <>
                    {grouped.today.length > 0 && (
                      <DateGroup
                        title="Today"
                        rows={grouped.today}
                        activeId={activeId}
                        onSelect={(id) => {
                          Haptics.selectionAsync();
                          onSelectConversation(id);
                          onClose();
                          if (!isChat) router.push('/');
                        }}
                        onDelete={confirmDeleteConversation}
                        theme={theme}
                      />
                    )}
                    {grouped.yesterday.length > 0 && (
                      <DateGroup
                        title="Yesterday"
                        rows={grouped.yesterday}
                        activeId={activeId}
                        onSelect={(id) => {
                          Haptics.selectionAsync();
                          onSelectConversation(id);
                          onClose();
                          if (!isChat) router.push('/');
                        }}
                        onDelete={confirmDeleteConversation}
                        theme={theme}
                      />
                    )}
                    {Object.keys(grouped.byYear)
                      .sort((a, b) => Number(b) - Number(a))
                      .map((year) => (
                        <DateGroup
                          key={year}
                          title={year}
                          rows={grouped.byYear[year]}
                          activeId={activeId}
                          onSelect={(id) => {
                            Haptics.selectionAsync();
                            onSelectConversation(id);
                            onClose();
                            if (!isChat) router.push('/');
                          }}
                          onDelete={confirmDeleteConversation}
                          theme={theme}
                        />
                      ))}
                  </>
                )}
              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.colors.bg.border }]}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onNewChat();
                onClose();
                if (!isChat) router.push('/');
              }}
              style={({ pressed }) => [
                styles.footerRow,
                { backgroundColor: pressed ? theme.colors.bg.tertiary : 'transparent' },
              ]}
            >
              <View
                style={[
                  styles.footerAvatar,
                  { backgroundColor: theme.colors.bg.secondary, borderColor: theme.colors.bg.border },
                ]}
              >
                <IconSymbol size={14} name="square.and.pencil" color={theme.colors.text.primary} />
              </View>
              <ThemedText style={[styles.footerLabel, { color: theme.colors.text.primary }]}>
                New conversation
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function DateGroup({
  title,
  rows,
  activeId,
  onSelect,
  onDelete,
  theme,
}: {
  title: string;
  rows: ConversationRow[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (item: ConversationRow) => void;
  theme: ReturnType<typeof getTheme>;
}) {
  return (
    <View style={styles.dateGroup}>
      <ThemedText style={[styles.dateGroupTitle, { color: theme.colors.text.tertiary }]}>{title}</ThemedText>
      {rows.map((item) => {
        const isActive = item.id === activeId;
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            onLongPress={() => onDelete(item)}
            delayLongPress={400}
            style={({ pressed }) => [
              styles.convRow,
              {
                backgroundColor: isActive
                  ? theme.colors.bg.secondary
                  : pressed
                    ? theme.colors.bg.tertiary
                    : 'transparent',
              },
            ]}
          >
            <ThemedText
              numberOfLines={1}
              style={[
                styles.convTitle,
                {
                  color: theme.colors.text.primary,
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
            >
              {item.title || 'New conversation'}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    height: '100%',
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  safe: { flex: 1 },
  brandRow: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
  },
  brandLetterBox: {
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
  },
  searchWrap: { paddingHorizontal: 12, paddingBottom: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  scrollBody: { paddingBottom: 12 },
  section: { paddingHorizontal: 8, gap: 2 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  navLabel: { fontSize: 15 },
  historyBody: { paddingHorizontal: 8, paddingTop: 6 },
  dateGroup: { marginTop: 8, gap: 1 },
  dateGroupTitle: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 10,
    paddingVertical: 6,
    letterSpacing: 0.2,
  },
  convRow: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  convTitle: { fontSize: 14 },
  emptyText: { fontSize: 13, paddingHorizontal: 12, paddingVertical: 8 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  footerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  footerLabel: { fontSize: 14, fontWeight: '500' },
});
