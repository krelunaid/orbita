import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';

import { it } from '@/src/i18n';
import { colors } from '@/src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.line,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.dim,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: it.globo,
          tabBarIcon: ({ color }) => <SymbolView name="globe" tintColor={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="catalogo"
        options={{
          title: it.catalogo,
          tabBarIcon: ({ color }) => <SymbolView name="list.bullet" tintColor={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="info"
        options={{
          title: it.info,
          tabBarIcon: ({ color }) => <SymbolView name="info.circle" tintColor={color} size={26} />,
        }}
      />
    </Tabs>
  );
}
