import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GroupFilter } from '@/src/components/GroupFilter';
import { fmtAlt, fmtLat } from '@/src/format';
import { groupLabel, it } from '@/src/i18n';
import { useSatellites } from '@/src/state/SatellitesContext';
import { colors, space } from '@/src/theme';
import type { SatSnapshot } from '@/src/types';

export default function CatalogScreen() {
  const router = useRouter();
  const { snapshots, query, setQuery, enabledGroups, toggleGroup, select } = useSatellites();

  const open = (sat: SatSnapshot) => {
    select(sat.noradId);
    router.push('/');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>{it.catalogo}</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={it.cerca}
        placeholderTextColor={colors.dim}
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.search}
      />
      <View style={{ marginBottom: 8 }}>
        <GroupFilter enabled={enabledGroups} onToggle={toggleGroup} />
      </View>
      <FlatList
        data={snapshots}
        keyExtractor={(item) => String(item.noradId)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.empty}>{it.nessuno}</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => open(item)} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: colors.groups[item.group] }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.meta}>
                {it.norad} {item.noradId} · {groupLabel(item.group)} · {fmtAlt(item.altKm)} · {fmtLat(item.lat)}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    paddingHorizontal: space.md,
    paddingBottom: 8,
  },
  search: {
    marginHorizontal: space.md,
    marginBottom: 10,
    backgroundColor: colors.panelSolid,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  list: { paddingHorizontal: space.md, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { color: colors.text, fontSize: 15, fontWeight: '600' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2, fontFamily: 'SpaceMono' },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 32 },
});
