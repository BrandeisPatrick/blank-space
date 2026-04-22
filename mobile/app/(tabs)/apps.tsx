import { ActionSheetIOS, FlatList, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from 'react-native-bottom-tabs';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useFileSystem } from '../../../src/contexts/FileSystemContext';
import { getTheme } from '../../../src/styles/theme';

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
          <ThemedText style={[styles.title, { color: theme.colors.text.primary }]}>Apps</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.colors.text.tertiary }]}>
            {rows.length} {rows.length === 1 ? 'project' : 'projects'}
          </ThemedText>
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
