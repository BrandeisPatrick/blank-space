import { useEffect, useState } from 'react';
import { ActionSheetIOS, FlatList, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from 'react-native-bottom-tabs';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { MonacoEditorSheet } from '@/components/editor/MonacoEditorSheet';
import { PreviewSheet } from '@/components/preview/PreviewSheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useFileSystem } from '../../../src/contexts/FileSystemContext';
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
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const { projects, activeProjectSlug, loadProject, deleteProject } = useFileSystem();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const router = useRouter();
  const { open } = useLocalSearchParams<{ open?: string }>();

  useEffect(() => {
    if (open === 'preview') {
      setPreviewOpen(true);
      router.setParams({ open: undefined });
    } else if (open === 'editor') {
      setEditorOpen(true);
      router.setParams({ open: undefined });
    }
  }, [open, router]);

  const rows: ProjectCard[] = Array.isArray(projects) ? projects : [];
  const cellSize = Math.floor((width - H_PADDING * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS);

  const confirmDelete = (item: ProjectCard) => {
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
        if (idx === 0) deleteProject(item.id);
      },
    );
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.colors.bg.border }]}>
          <View style={styles.headerMain}>
            <ThemedText style={[styles.title, { color: theme.colors.text.primary }]}>Apps</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.colors.text.tertiary }]}>
              {rows.length} {rows.length === 1 ? 'project' : 'projects'}
            </ThemedText>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setEditorOpen(true)}
              hitSlop={10}
              style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.55 : 1 }]}
            >
              <IconSymbol size={22} name="curlybraces" color={theme.colors.text.primary} />
            </Pressable>
            <Pressable
              onPress={() => setPreviewOpen(true)}
              hitSlop={10}
              style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.55 : 1 }]}
            >
              <IconSymbol size={22} name="play.circle" color={theme.colors.text.primary} />
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
            paddingBottom: tabBarHeight + 16,
          }}
          columnWrapperStyle={{ gap: GAP, marginBottom: GAP }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <IconSymbol size={36} name="square.grid.2x2" color={theme.colors.text.tertiary} />
              <ThemedText style={[styles.emptyTitle, { color: theme.colors.text.secondary }]}>
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
                onPress={() => item.slug && loadProject(item.slug)}
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
        visible={previewOpen}
        title="Sandpack demo"
        files={SANDPACK_DEMO_FILES}
        onClose={() => setPreviewOpen(false)}
      />
      <MonacoEditorSheet
        visible={editorOpen}
        title="Monaco demo"
        initialValue={MONACO_DEMO_VALUE}
        language="typescript"
        onClose={() => setEditorOpen(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerMain: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: { padding: 6 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  cell: { alignItems: 'center', gap: 6 },
  tile: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 34 },
  label: { fontSize: 12, maxWidth: '100%', textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptyBody: { fontSize: 13, textAlign: 'center', paddingHorizontal: 48 },
});
