import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import { withLayoutContext } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { Navigator } = createNativeBottomTabNavigator();
const NativeTabs = withLayoutContext(Navigator);

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <NativeTabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
      }}>
      <NativeTabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: () => ({ sfSymbol: 'bubble.left.and.bubble.right.fill' }),
        }}
      />
      <NativeTabs.Screen
        name="apps"
        options={{
          title: 'Apps',
          tabBarIcon: () => ({ sfSymbol: 'square.grid.2x2.fill' }),
        }}
      />
      <NativeTabs.Screen
        name="files"
        options={{
          title: 'Files',
          tabBarIcon: () => ({ sfSymbol: 'folder.fill' }),
        }}
      />
    </NativeTabs>
  );
}
