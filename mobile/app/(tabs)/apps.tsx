import { useEffect, useState } from 'react';
import { ActionSheetIOS, FlatList, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { MonacoEditorSheet } from '@/components/editor/MonacoEditorSheet';
import { PreviewSheet, type PreviewError } from '@/components/preview/PreviewSheet';
import { SideDrawer } from '@/components/chat/SideDrawer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useFileSystem } from '../../../src/contexts/FileSystemContext';
import { useConversation } from '../../../src/contexts/ConversationContext';
import { getTheme } from '../../../src/styles/theme';

const SANDPACK_DEMO_FILES = {
  '/App.js': `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div style={{ fontFamily: 'system-ui', padding: 24, textAlign: 'center' }}>
      <h1>Hello from Sandpack</h1>
      <p>Count: {count}</p>
      <button
        onClick={() => setCount((c) => c + 1)}
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          border: '1px solid #888',
          background: '#007AFF',
          color: 'white',
          cursor: 'pointer',
        }}
      >
        Increment
      </button>
    </div>
  );
}`,
};

const MONACO_DEMO_VALUE = `// Sample TypeScript file — Monaco running inside WKWebView via DOM Component.
function greet(name: string): string {
  return \`Hello, \${name}\`;
}

console.log(greet('blank space'));
`;

type ProjectCard = {
  id: string;
  name?: string;
  slug?: string;
  icon?: string;
  fileCount?: number;
};

const NUM_COLUMNS = 3;
const H_PADDING = 16;
const GAP = 16;

export default function AppsScreen() {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { width } = useWindowDimensions();
  const {
    projects,
    activeProjectSlug,
    loadProject,
    deleteProject,
    getFilesByProjectSlug,
  } = useFileSystem();
  const {
    conversations,
    activeConversationId,
    createConversation,
    switchConversation,
    deleteConversation,
  } = useConversation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewState, setPreviewState] = useState<
    | { open: false }
    | {
        open: true;
        title: string;
        appId: string | null;
        appName: string;
        files: Record<string, string | { code: string }>;
      }
  >({ open: false });
  const [previewError, setPreviewError] = useState<PreviewError | null>(null);
  const router = useRouter();
  const { open } = useLocalSearchParams<{ open?: string }>();

  const openProjectPreview = async (item: ProjectCard) => {
    if (!item.slug) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadProject(item.slug);
    const fileMap = await getFilesByProjectSlug(item.slug);
    const hasFiles = fileMap && Object.keys(fileMap).length > 0;
    const title = item.name || item.slug;
    setPreviewError(null);
    setPreviewState({
      open: true,
      title,
      appId: item.id,
      appName: title,
      files: hasFiles ? fileMap : SANDPACK_DEMO_FILES,
    });
  };

  const openDemoPreview = () => {
    setPreviewError(null);
    setPreviewState({
      open: true,
      title: 'Sandpack demo',
      appId: null,
      appName: 'Sandpack demo',
      files: SANDPACK_DEMO_FILES,
    });
  };

  const closePreview = () => {
    setPreviewState({ open: false });
    setPreviewError(null);
  };

  const handleFixBug = () => {
    if (!previewState.open || !previewError) return;
    const location = [previewError.file, previewError.line].filter(Boolean).join(':');
    const errorLine = location
      ? `${previewError.message} (${location})`
      : previewError.message;
    const debugMessage = `@${previewState.appName}\n\n${errorLine}\n\nFix the bug`;
    closePreview();
    router.push({ pathname: '/', params: { prefill: debugMessage } });
  };

  useEffect(() => {
    if (open === 'preview') {
      openDemoPreview();
      router.setParams({ open: undefined });
    } else if (open === 'editor') {
      setEditorOpen(true);
      router.setParams({ open: undefined });
    }
  }, [open, router]);

  const rows: ProjectCard[] = Array.isArray(projects) ? projects : [];
  const cellSize = Math.floor((width - H_PADDING * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS);

  const confirmDelete = (item: ProjectCard) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: item.name || 'Project',
        message: 'Delete this project? This cannot be undone.',
        options: ['Delete', 'Cancel'],
        destructiveButtonIndex: 0,
        cancelButtonIndex: 1,
        userInterfaceStyle: mode,
      },
      (idx) => {
        if (idx === 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteProject(item.id);
        }
      },
    );
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => setDrawerOpen(true)}
            hitSlop={10}
            style={({ pressed }) => [styles.menuBtn, { opacity: pressed ? 0.55 : 1 }]}
          >
            <IconSymbol size={22} name="line.3.horizontal" color={theme.colors.text.primary} />
          </Pressable>
          <View style={styles.headerMain}>
            <ThemedText style={[styles.title, { color: theme.colors.text.primary }]}>Apps</ThemedText>
            {rows.length > 0 && (
              <ThemedText style={[styles.subtitle, { color: theme.colors.text.tertiary }]}>
                {rows.length} {rows.length === 1 ? 'project' : 'projects'}
              </ThemedText>
            )}
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setEditorOpen(true)}
              hitSlop={10}
              style={({ pressed }) => [
                styles.headerBtn,
                {
                  backgroundColor: theme.colors.bg.secondary,
                  borderColor: theme.colors.bg.border,
                  opacity: pressed ? 0.55 : 1,
                },
              ]}
            >
              <IconSymbol size={18} name="curlybraces" color={theme.colors.text.primary} />
            </Pressable>
            <Pressable
              onPress={openDemoPreview}
              hitSlop={10}
              style={({ pressed }) => [
                styles.headerBtn,
                {
                  backgroundColor: theme.colors.bg.secondary,
                  borderColor: theme.colors.bg.border,
                  opacity: pressed ? 0.55 : 1,
                },
              ]}
            >
              <IconSymbol size={18} name="play.fill" color={theme.colors.text.primary} />
            </Pressable>
          </View>
        </View>
        <FlatList
          data={rows}
          keyExtractor={(p) => p.id}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={{
            paddingHorizontal: H_PADDING,
            paddingTop: 16,
            paddingBottom: 32,
          }}
          columnWrapperStyle={{ gap: GAP, marginBottom: GAP }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyMark, { backgroundColor: theme.colors.bg.secondary, borderColor: theme.colors.bg.border }]}>
                <IconSymbol size={28} name="square.grid.2x2" color={theme.colors.text.primary} />
              </View>
              <ThemedText style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                No apps yet
              </ThemedText>
              <ThemedText style={[styles.emptyBody, { color: theme.colors.text.tertiary }]}>
                Ask chat to build something and it will appear on your home screen.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => {
            const isActive = item.slug === activeProjectSlug;
            return (
              <Pressable
                onPress={() => openProjectPreview(item)}
                onLongPress={() => confirmDelete(item)}
                delayLongPress={400}
                style={({ pressed }) => [
                  styles.cell,
                  { width: cellSize, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View
                  style={[
                    styles.tile,
                    {
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: isActive
                        ? theme.colors.accent.ios
                        : theme.colors.bg.secondary,
                      borderColor: theme.colors.bg.border,
                    },
                  ]}
                >
                  <ThemedText style={styles.icon}>{item.icon || '📦'}</ThemedText>
                </View>
                <ThemedText
                  numberOfLines={1}
                  style={[styles.label, { color: theme.colors.text.primary }]}
                >
                  {item.name || item.slug || 'Untitled'}
                </ThemedText>
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
      <PreviewSheet
        visible={previewState.open}
        title={previewState.open ? previewState.title : undefined}
        files={previewState.open ? previewState.files : SANDPACK_DEMO_FILES}
        onClose={closePreview}
        onError={setPreviewError}
        onFixBug={previewError ? handleFixBug : undefined}
      />
      <MonacoEditorSheet
        visible={editorOpen}
        title="Monaco demo"
        initialValue={MONACO_DEMO_VALUE}
        language="typescript"
        onClose={() => setEditorOpen(false)}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 16,
  },
  menuBtn: { padding: 6 },
  headerMain: { flex: 1, paddingLeft: 4 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  cell: { alignItems: 'center', gap: 8 },
  tile: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  icon: { fontSize: 38 },
  label: { fontSize: 13, fontWeight: '500', maxWidth: '100%', textAlign: 'center' },
  empty: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 32, gap: 10 },
  emptyMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 6,
  },
  emptyTitle: { fontSize: 20, fontWeight: '600' },
  emptyBody: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
