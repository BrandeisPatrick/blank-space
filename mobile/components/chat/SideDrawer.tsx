import { useEffect, useRef } from 'react';
import {
  ActionSheetIOS,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
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
import { useTheme } from '../../../src/contexts/ThemeContext';
import { getTheme } from '../../../src/styles/theme';

const DRAWER_WIDTH = Math.min(320, Dimensions.get('window').width * 0.84);

type ConversationRow = {
  id: string;
  title: string;
  messageCount: number;
  updatedAt?: number | string | null;
};

type NavItem = {
  key: string;
  pathname: '/' | '/apps' | '/files';
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'chat', pathname: '/', label: 'Chat', icon: 'bubble.left.and.bubble.right.fill' },
  { key: 'apps', pathname: '/apps', label: 'Apps', icon: 'square.grid.2x2.fill' },
  { key: 'files', pathname: '/files', label: 'Files', icon: 'folder.fill' },
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

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideX, fade]);

  const navigate = (item: NavItem) => {
    Haptics.selectionAsync();
    onClose();
    if (pathname !== item.pathname) {
      router.push(item.pathname);
    }
  };

  const confirmDeleteConversation = (item: ConversationRow) => {
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
          onDeleteConversation(item.id);
        }
      },
    );
  };

  const isChat = pathname === '/' || pathname === '/index';
  const topPad = Math.max(insets.top, 50);
  const bottomPad = Math.max(insets.bottom, 12);

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
            <View
              style={[
                styles.brandMark,
                {
                  backgroundColor: theme.colors.bg.secondary,
                  borderColor: theme.colors.bg.border,
                },
              ]}
            >
              <IconSymbol size={18} name="sparkles" color={theme.colors.text.primary} />
            </View>
            <ThemedText style={[styles.brandText, { color: theme.colors.text.primary }]}>
              blank space
            </ThemedText>
          </View>

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
                    size={20}
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
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.bg.border }]} />

          <View style={styles.sectionHeaderRow}>
            <ThemedText style={[styles.sectionHeader, { color: theme.colors.text.tertiary }]}>
              CONVERSATIONS
            </ThemedText>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onNewChat();
                onClose();
                if (!isChat) router.push('/');
              }}
              hitSlop={8}
              style={({ pressed }) => [styles.newBtn, { opacity: pressed ? 0.5 : 1 }]}
            >
              <IconSymbol size={18} name="square.and.pencil" color={theme.colors.text.primary} />
            </Pressable>
          </View>

          <FlatList
            data={conversations}
            keyExtractor={(c) => c.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <ThemedText style={{ color: theme.colors.text.tertiary, fontSize: 13 }}>
                  No conversations yet.
                </ThemedText>
              </View>
            }
            renderItem={({ item }) => {
              const isActive = item.id === activeId;
              return (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    onSelectConversation(item.id);
                    onClose();
                    if (!isChat) router.push('/');
                  }}
                  onLongPress={() => confirmDeleteConversation(item)}
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
            }}
          />
        </View>
      </Animated.View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  brandText: { fontSize: 17, fontWeight: '600' },
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
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  sectionHeader: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  newBtn: { padding: 4 },
  listContent: { paddingHorizontal: 8, paddingBottom: 8 },
  convRow: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    marginBottom: 1,
  },
  convTitle: { fontSize: 14 },
  empty: { alignItems: 'center', padding: 16 },
});
