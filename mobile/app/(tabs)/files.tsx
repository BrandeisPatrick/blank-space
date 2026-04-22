import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from 'react-native-bottom-tabs';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useFileSystem } from '../../../src/contexts/FileSystemContext';
import { getTheme } from '../../../src/styles/theme';

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
  const tabBarHeight = useBottomTabBarHeight();
  const { projects, activeProjectSlug, loadProject, deleteProject } = useFileSystem();

  const rows: ProjectRow[] = Array.isArray(projects) ? projects : [];

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.colors.bg.border }]}>
          <ThemedText style={[styles.title, { color: theme.colors.text.primary }]}>Files</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.colors.text.tertiary }]}>
            {rows.length} {rows.length === 1 ? 'project' : 'projects'}
          </ThemedText>
        </View>
        <FlatList
          data={rows}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 16 }}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.colors.bg.border }]} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <IconSymbol size={36} name="folder" color={theme.colors.text.tertiary} />
              <ThemedText style={[styles.emptyTitle, { color: theme.colors.text.secondary }]}>
                No projects yet
              </ThemedText>
              <ThemedText style={[styles.emptyBody, { color: theme.colors.text.tertiary }]}>
                Projects you generate from chat will appear here.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => {
            const isActive = item.slug === activeProjectSlug;
            return (
              <Pressable
                onPress={() => item.slug && loadProject(item.slug)}
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
                <IconSymbol size={22} name="folder.fill" color={theme.colors.accent.ios} />
                <View style={styles.rowMain}>
                  <ThemedText
                    numberOfLines={1}
                    style={[styles.rowTitle, { color: theme.colors.text.primary }]}
                  >
                    {item.name || item.slug || 'Untitled'}
                  </ThemedText>
                  {typeof item.fileCount === 'number' && (
                    <ThemedText style={[styles.rowMeta, { color: theme.colors.text.tertiary }]}>
                      {item.fileCount} {item.fileCount === 1 ? 'file' : 'files'}
                    </ThemedText>
                  )}
                </View>
                <Pressable onPress={() => deleteProject(item.id)} hitSlop={10} style={styles.deleteBtn}>
                  <IconSymbol size={18} name="trash" color={theme.colors.text.tertiary} />
                </Pressable>
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 16 },
  rowMeta: { fontSize: 12 },
  deleteBtn: { padding: 6 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 50 },
  empty: { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptyBody: { fontSize: 13, textAlign: 'center', paddingHorizontal: 48 },
});
