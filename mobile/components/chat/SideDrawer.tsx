import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
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

import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ui/ThemedText';
import { DateGroup } from '@/components/chat/DateGroup';
import {
  AnimatedChatIcon,
  AnimatedComputerIcon,
  AnimatedFilesIcon,
  AnimatedHistoryIcon,
} from '@/components/icons/AnimatedNavIcons';
import { confirmDestructive } from '@/lib/action-sheets';
import { groupConversations, type ConversationRow } from '@/lib/conversations';
import { PLACEHOLDER_USER } from '@/constants/user';
import { SettingsSheet } from '@/components/settings/SettingsSheet';
import { useTheme } from '@shared/contexts/ThemeContext';
import { getTheme } from '@shared/styles/theme';

const DRAWER_WIDTH = Math.min(320, Dimensions.get('window').width * 0.84);

type AnimatedIcon = (props: { size?: number; color: string; active?: boolean }) => React.ReactElement;

type NavItem = {
  key: string;
  pathname: '/' | '/apps' | '/files';
  label: string;
  Icon: AnimatedIcon;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'chat', pathname: '/', label: 'Chat', Icon: AnimatedChatIcon },
  { key: 'computer', pathname: '/apps', label: 'Computer', Icon: AnimatedComputerIcon },
  { key: 'files', pathname: '/files', label: 'Files', Icon: AnimatedFilesIcon },
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
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
      <Animated.View style={[styles.backdrop, { backgroundColor: theme.effects.overlay.dark, opacity: fade }]}>
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
                variant="display"
                tone="primary"
                allowFontScaling={false}
              >
                O
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
                const isPressed = pressedKey === item.key;
                const Icon = item.Icon;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => navigate(item)}
                    onPressIn={() => setPressedKey(item.key)}
                    onPressOut={() => setPressedKey(null)}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: active }}
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
                    <Icon
                      size={20}
                      color={active ? theme.colors.text.primary : theme.colors.text.secondary}
                      active={isPressed || active}
                    />
                    <ThemedText
                      variant="callout"
                      style={{
                        color: active ? theme.colors.text.primary : theme.colors.text.secondary,
                        fontWeight: active ? '600' : '500',
                      }}
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
                onPressIn={() => setPressedKey('history')}
                onPressOut={() => setPressedKey(null)}
                accessibilityRole="button"
                accessibilityLabel="History"
                accessibilityState={{ expanded: historyOpen }}
                style={({ pressed }) => [
                  styles.navRow,
                  {
                    backgroundColor: pressed ? theme.colors.bg.tertiary : 'transparent',
                  },
                ]}
              >
                <AnimatedHistoryIcon
                  size={20}
                  color={theme.colors.text.secondary}
                  active={pressedKey === 'history'}
                />
                <ThemedText variant="callout" tone="secondary" style={styles.flex1}>
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
                  <ThemedText variant="footnote" tone="tertiary" style={styles.emptyText}>
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
            <View style={styles.footerRow}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setSettingsOpen(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Account"
                style={({ pressed }) => [
                  styles.accountPill,
                  {
                    backgroundColor: theme.surfaces.glass.fill,
                    borderColor: theme.surfaces.glass.border,
                    opacity: pressed ? theme.opacity.pressed : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.accountAvatar,
                    { backgroundColor: theme.colors.bg.tertiary },
                  ]}
                >
                  <ThemedText
                    variant="caption"
                    tone="primary"
                    allowFontScaling={false}
                    style={styles.avatarLetter}
                  >
                    {PLACEHOLDER_USER.avatarLetter}
                  </ThemedText>
                </View>
                <ThemedText
                  variant="subhead"
                  tone="primary"
                  numberOfLines={1}
                >
                  {PLACEHOLDER_USER.displayName}
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onNewChat();
                  onClose();
                  if (!isChat) router.push('/');
                }}
                accessibilityRole="button"
                accessibilityLabel="New conversation"
                style={({ pressed }) => [
                  styles.newChatFab,
                  theme.nativeShadow.sm,
                  {
                    backgroundColor: theme.colors.accent.primary,
                    opacity: pressed ? theme.opacity.pressedStrong : 1,
                  },
                ]}
              >
                <IconSymbol size={20} name="plus.bubble.fill" color={theme.colorVariants.white} />
              </Pressable>
            </View>
          </View>
        </View>
      </Animated.View>

      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
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
  searchInput: { flex: 1, fontSize: 14, lineHeight: 20, padding: 0 },
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
  historyBody: { paddingHorizontal: 8, paddingTop: 6 },
  emptyText: { paddingHorizontal: 12, paddingVertical: 8 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  accountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 4,
    paddingRight: 14,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 1,
  },
  accountAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontWeight: '700', letterSpacing: 0 },
  flex1: { flex: 1 },
  newChatFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
