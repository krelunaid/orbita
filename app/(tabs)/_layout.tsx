import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { it } from '@/src/i18n';
import { colors } from '@/src/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.line,
          height: 52 + bottom,
          paddingTop: 6,
          paddingBottom: bottom,
        },
        tabBarItemStyle: { paddingVertical: 0 },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.dim,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
        tabBarIconStyle: { marginTop: 2 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: it.globo,
          tabBarIcon: ({ color }) => <SymbolView name="globe" tintColor={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="catalogo"
        options={{
          title: it.catalogo,
          tabBarIcon: ({ color }) => <SymbolView name="list.bullet" tintColor={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="info"
        options={{
          title: it.info,
          tabBarIcon: ({ color }) => <SymbolView name="info.circle" tintColor={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
