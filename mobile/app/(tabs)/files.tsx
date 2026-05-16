import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { SideDrawer } from '@/components/chat';
import {
  CircleButton,
  CircleButtonSpacer,
  IconSymbol,
  ScreenHeader,
  ThemedText,
  ThemedView,
} from '@/components/ui';
import { confirmDestructive } from '@/lib/action-sheets';
import { useTheme } from '@shared/contexts/ThemeContext';
import { useFileSystem } from '@shared/contexts/FileSystemContext';
import { useConversation } from '@shared/contexts/ConversationContext';
import { getTheme } from '@shared/styles/theme';

type ProjectRow = {
  id: string;
  name?: string;
  slug?: string;
  updatedAt?: number | string | null;
  fileCount?: number;
};

export default function FilesScreen() {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { projects, activeProjectSlug, loadProject, deleteProject } = useFileSystem();
  const {
    conversations,
    activeConversationId,
    createConversation,
    switchConversation,
    deleteConversation,
  } = useConversation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const rows: ProjectRow[] = Array.isArray(projects) ? projects : [];

  const confirmDelete = (item: ProjectRow) => {
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
          title="Files"
          left={<CircleButton iconName="line.3.horizontal" onPress={() => setDrawerOpen(true)} accessibilityLabel="Open menu" />}
          right={<CircleButtonSpacer />}
        />

        <FlatList
          data={rows}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 4 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyMark, { backgroundColor: theme.colors.bg.secondary, borderColor: theme.colors.bg.border }]}>
                <IconSymbol size={28} name="folder" color={theme.colors.text.primary} />
              </View>
              <ThemedText variant="title2" tone="primary">
                No projects yet
              </ThemedText>
              <ThemedText variant="subhead" tone="tertiary" style={styles.emptyBody}>
                Projects you generate from chat will appear here.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => {
            const isActive = item.slug === activeProjectSlug;
            return (
              <Pressable
                onPress={() => {
                  if (!item.slug) return;
                  Haptics.selectionAsync();
                  loadProject(item.slug);
                }}
                onLongPress={() => confirmDelete(item)}
                delayLongPress={400}
                accessibilityRole="button"
                accessibilityLabel={item.name || item.slug || 'Untitled project'}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: pressed
                      ? theme.colors.bg.tertiary
                      : isActive
                        ? theme.colors.bg.secondary
                        : 'transparent',
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: theme.colors.bg.secondary, borderColor: theme.colors.bg.border },
                  ]}
                >
                  <IconSymbol size={18} name="folder.fill" color={theme.colors.accent.ios} />
                </View>
                <View style={styles.rowMain}>
                  <ThemedText
                    variant="headline"
                    tone="primary"
                    numberOfLines={1}
                    style={styles.rowTitleWeight}
                  >
                    {item.name || item.slug || 'Untitled'}
                  </ThemedText>
                  <ThemedText variant="caption" tone="tertiary">
                    {typeof item.fileCount === 'number'
                      ? `${item.fileCount} ${item.fileCount === 1 ? 'file' : 'files'}`
                      : 'Project'}
                  </ThemedText>
                </View>
                <IconSymbol size={14} name="chevron.right" color={theme.colors.text.tertiary} />
              </Pressable>
            );
          }}
        />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowMain: { flex: 1, gap: 2 },
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
  rowTitleWeight: { fontWeight: '500' },
});
