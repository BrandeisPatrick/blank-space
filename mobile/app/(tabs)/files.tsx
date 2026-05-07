import { ActionSheetIOS, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from 'react-native-bottom-tabs';
import * as Haptics from 'expo-haptics';

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

  const confirmDelete = (item: ProjectRow) => {
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
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: theme.colors.text.primary }]}>Files</ThemedText>
          {rows.length > 0 && (
            <ThemedText style={[styles.subtitle, { color: theme.colors.text.tertiary }]}>
              {rows.length} {rows.length === 1 ? 'project' : 'projects'}
            </ThemedText>
          )}
        </View>

        <FlatList
          data={rows}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 16, paddingTop: 4 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyMark, { backgroundColor: theme.colors.bg.secondary, borderColor: theme.colors.bg.border }]}>
                <IconSymbol size={28} name="folder" color={theme.colors.text.primary} />
              </View>
              <ThemedText style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
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
                onLongPress={() => confirmDelete(item)}
                delayLongPress={400}
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
                    numberOfLines={1}
                    style={[styles.rowTitle, { color: theme.colors.text.primary }]}
                  >
                    {item.name || item.slug || 'Untitled'}
                  </ThemedText>
                  <ThemedText style={[styles.rowMeta, { color: theme.colors.text.tertiary }]}>
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
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
  rowTitle: { fontSize: 16, fontWeight: '500' },
  rowMeta: { fontSize: 12 },
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
