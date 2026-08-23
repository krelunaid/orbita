import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GroupFilter } from '@/src/components/GroupFilter';
import { fmtAlt, fmtLat } from '@/src/format';
import { tapSelect } from '@/src/haptics';
import { groupLabel, it } from '@/src/i18n';
import { findIss, isIssRecord, recordMatchesQuery } from '@/src/orbit/iss';
import { useSatellites } from '@/src/state/SatellitesContext';
import { colors, space } from '@/src/theme';
import type { SatSnapshot } from '@/src/types';

export default function CatalogScreen() {
  const router = useRouter();
  const {
    allSnapshots,
    query,
    setQuery,
    enabledGroups,
    toggleGroup,
    selectedId,
    selectAndFocus,
    focusIss,
    loading,
    error,
    refresh,
  } = useSatellites();

  const rows = useMemo(() => {
    const q = query.trim();
    const grouped = allSnapshots.filter(
      (s) => (enabledGroups.includes(s.group) || isIssRecord(s)) && recordMatchesQuery(s, q),
    );
    const iss = findIss(allSnapshots);
    const list =
      iss && !grouped.some((s) => s.noradId === iss.noradId) && recordMatchesQuery(iss, q)
        ? [iss, ...grouped]
        : grouped;
    return [...list].sort((a, b) => {
      const ai = isIssRecord(a) ? 0 : 1;
      const bi = isIssRecord(b) ? 0 : 1;
      if (ai !== bi) return ai - bi;
      return a.name.localeCompare(b.name, 'it');
    });
  }, [allSnapshots, enabledGroups, query]);

  const emptyReason = query.trim() ? it.nessunRisultato : it.nessuno;

  const open = (sat: SatSnapshot) => {
    void tapSelect();
    selectAndFocus(sat.noradId);
    router.navigate('/');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.title} numberOfLines={1}>
            {it.catalogo}
          </Text>
          <Text style={styles.hint} numberOfLines={2}>
            {it.catalogoHint}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            void tapSelect();
            focusIss();
            router.navigate('/');
          }}
          style={styles.issBtn}
          accessibilityRole="button"
          accessibilityLabel={it.centraIss}>
          <Text style={styles.issText}>{it.vaiIss}</Text>
        </Pressable>
      </View>
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={it.cerca}
          placeholderTextColor={colors.dim}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="never"
          style={styles.search}
          accessibilityLabel={it.cerca}
        />
        {query ? (
          <Pressable
            onPress={() => setQuery('')}
            style={styles.clear}
            accessibilityRole="button"
            accessibilityLabel={it.cancella}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.count}>
        {loading && allSnapshots.length === 0
          ? it.caricamento
          : `${rows.length} ${it.oggetti}${query.trim() ? ` · «${query.trim()}»` : ''}`}
      </Text>
      <View style={{ marginBottom: 8 }}>
        <GroupFilter enabled={enabledGroups} onToggle={toggleGroup} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.noradId)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyBox}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.empty}>{it.caricamento}</Text>
            </View>
          ) : error && allSnapshots.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyErr}>{it.erroreRete}</Text>
              <Pressable
                onPress={() => {
                  void tapSelect();
                  void refresh(true);
                }}
                style={styles.retry}>
                <Text style={styles.retryText}>{it.riprova}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.empty}>{emptyReason}</Text>
              {error ? (
                <Pressable
                  onPress={() => {
                    void tapSelect();
                    void refresh(true);
                  }}
                  style={styles.retry}>
                  <Text style={styles.retryText}>{it.riprova}</Text>
                </Pressable>
              ) : null}
            </View>
          )
        }
        renderItem={({ item }) => {
          const active = item.noradId === selectedId;
          const iss = isIssRecord(item);
          return (
            <Pressable
              onPress={() => open(item)}
              style={[styles.row, active && styles.rowActive]}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${it.norad} ${item.noradId}`}>
              <View style={[styles.dot, { backgroundColor: colors.groups[item.group] }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, iss && styles.issName]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.meta}>
                  {it.norad} {item.noradId} · {groupLabel(item.group)} · {fmtAlt(item.altKm)} · {fmtLat(item.lat)}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingBottom: 8,
    gap: 8,
  },
  headText: { flex: 1, minWidth: 0 },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  hint: { color: colors.muted, fontSize: 12, marginTop: 2 },
  issBtn: {
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  issText: { color: colors.gold, fontSize: 13, fontWeight: '700' },
  searchWrap: {
    marginHorizontal: space.md,
    marginBottom: 6,
  },
  search: {
    backgroundColor: colors.panelSolid,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingRight: 40,
    fontSize: 15,
  },
  clear: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  clearText: { color: colors.muted, fontSize: 16 },
  count: {
    color: colors.dim,
    fontSize: 12,
    paddingHorizontal: space.md,
    marginBottom: 8,
  },
  list: { paddingHorizontal: space.md, paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowActive: {
    backgroundColor: '#121A2C',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderBottomColor: 'transparent',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { color: colors.text, fontSize: 15, fontWeight: '600' },
  issName: { color: colors.gold },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2, fontFamily: 'SpaceMono' },
  empty: { color: colors.muted, textAlign: 'center' },
  emptyErr: { color: colors.danger, textAlign: 'center', fontSize: 14 },
  emptyBox: { paddingTop: 32, gap: 10, alignItems: 'center', paddingHorizontal: space.md },
  retry: {
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
});
