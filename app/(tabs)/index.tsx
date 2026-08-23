import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EarthGlobe } from '@/src/components/EarthGlobe';
import { GroupFilter } from '@/src/components/GroupFilter';
import { SatelliteCard } from '@/src/components/SatelliteCard';
import { fmtWhen } from '@/src/format';
import { it } from '@/src/i18n';
import { useSatellites } from '@/src/state/SatellitesContext';
import { colors, space } from '@/src/theme';

export default function GlobeScreen() {
  const {
    snapshots,
    loading,
    error,
    fetchedAt,
    source,
    cached,
    selected,
    selectedId,
    selectedTrack,
    enabledGroups,
    toggleGroup,
    select,
    refresh,
  } = useSatellites();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>{it.appName}</Text>
          <Text style={styles.sub}>
            {snapshots.length} {it.oggetti}
            {fetchedAt ? ` · ${it.ultimoAggiornamento} ${fmtWhen(fetchedAt)}` : ''}
            {cached ? ` · ${it.cache}` : ''}
            {source ? ` · ${source}` : ''}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            void refresh(true);
          }}
          style={styles.refresh}>
          <Text style={styles.refreshText}>{it.aggiorna}</Text>
        </Pressable>
      </View>

      <GroupFilter enabled={enabledGroups} onToggle={toggleGroup} />

      <View style={styles.globe}>
        {loading && snapshots.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.hint}>{it.caricamento}</Text>
          </View>
        ) : (
          <EarthGlobe
            satellites={snapshots}
            selectedId={selectedId}
            selectedTrack={selectedTrack}
            onSelect={(id) => {
              if (id) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              select(id);
            }}
          />
        )}
        {error && snapshots.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.err}>{it.erroreRete}</Text>
            <Text style={styles.hint}>{error}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.bottom}>
        {selected ? (
          <SatelliteCard sat={selected} compact onClose={() => select(null)} />
        ) : (
          <Text style={styles.hint}>{it.toccaPunto}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingBottom: 8,
    gap: 12,
  },
  brand: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: 0.4 },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  refresh: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  globe: { flex: 1 },
  bottom: { paddingHorizontal: space.md, paddingBottom: 10, paddingTop: 6, minHeight: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg, gap: 10 },
  hint: { color: colors.muted, textAlign: 'center', fontSize: 13 },
  err: { color: colors.danger, textAlign: 'center', fontSize: 14 },
});
