import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { MonacoEditorSheet } from '@/components/editor/MonacoEditorSheet';
import { PreviewSheet, type PreviewError } from '@/components/preview/PreviewSheet';
import { SideDrawer } from '@/components/chat';
import { CircleButton, IconSymbol, ScreenHeader, ThemedText, ThemedView } from '@/components/ui';
import { confirmDestructive } from '@/lib/action-sheets';
import { SANDPACK_DEMO_FILES, MONACO_DEMO_VALUE } from '@/constants/demoFixtures';
import { useTheme } from '@shared/contexts/ThemeContext';
import { useFileSystem } from '@shared/contexts/FileSystemContext';
import { useConversation } from '@shared/contexts/ConversationContext';
import { getTheme } from '@shared/styles/theme';

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
    confirmDestructive({
      title: item.name || 'Project',
      message: 'Delete this project? This cannot be undone.',
      mode,
      onConfirm: () => deleteProject(item.id),
    });
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader
          title="Apps"
          left={<CircleButton iconName="line.3.horizontal" onPress={() => setDrawerOpen(true)} accessibilityLabel="Open menu" />}
          right={<CircleButton iconName="play.fill" iconSize={16} onPress={openDemoPreview} haptic="light" accessibilityLabel="Run demo preview" />}
        />
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
              <ThemedText variant="title2" tone="primary">
                No apps yet
              </ThemedText>
              <ThemedText variant="subhead" tone="tertiary" style={styles.emptyBody}>
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
                accessibilityRole="button"
                accessibilityLabel={item.name || item.slug || 'Untitled app'}
                accessibilityHint="Long-press to delete"
                style={({ pressed }) => [
                  styles.cell,
                  { width: cellSize, opacity: pressed ? theme.opacity.pressedStrong : 1 },
                ]}
              >
                <View
                  style={[
                    styles.tile,
                    theme.nativeShadow.sm,
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
                  variant="footnote"
                  tone="primary"
                  numberOfLines={1}
                  style={styles.label}
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
  cell: { alignItems: 'center', gap: 8 },
  tile: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 38 },
  label: { fontWeight: '500', maxWidth: '100%', textAlign: 'center' },
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
  emptyBody: { textAlign: 'center' },
});
