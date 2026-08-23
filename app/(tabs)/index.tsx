import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EarthGlobe } from '@/src/components/EarthGlobe';
import { GroupFilter } from '@/src/components/GroupFilter';
import { SatelliteCard } from '@/src/components/SatelliteCard';
import { fmtWhen } from '@/src/format';
import { tapLight, tapSelect } from '@/src/haptics';
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
    selectAndFocus,
    focusIss,
    focusToken,
    setGlobeBusy,
    refresh,
  } = useSatellites();

  const empty = snapshots.length === 0;
  const statusLine = empty
    ? loading
      ? it.inAttesa
      : error
        ? it.erroreReteCorta
        : it.inAttesa
    : [
        `${snapshots.length} ${it.oggetti}`,
        fetchedAt ? `${it.ultimoAggiornamento} ${fmtWhen(fetchedAt)}` : null,
        cached ? (snapshots.length === 1 ? it.stimaIss : it.cache) : null,
        source,
      ]
        .filter(Boolean)
        .join(' · ');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>{it.appName}</Text>
          <Text style={styles.sub}>{statusLine}</Text>
        </View>
        <Pressable
          onPress={() => {
            void tapSelect();
            focusIss();
          }}
          style={styles.issBtn}
          accessibilityRole="button"
          accessibilityLabel={it.centraIss}>
          <Text style={styles.issText}>{it.vaiIss}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            void tapSelect();
            void refresh(true);
          }}
          style={styles.refresh}>
          <Text style={styles.refreshText}>{it.aggiorna}</Text>
        </Pressable>
      </View>

      <GroupFilter enabled={enabledGroups} onToggle={toggleGroup} />

      <View style={styles.globe}>
        <EarthGlobe
          satellites={snapshots}
          selectedId={selectedId}
          selectedTrack={selectedTrack}
          focusToken={focusToken}
          onSelect={(id) => {
            if (id) {
              void tapLight();
              selectAndFocus(id);
            } else {
              select(null);
            }
          }}
          onInteract={setGlobeBusy}
        />
        {loading && empty ? (
          <View style={styles.overlay} pointerEvents="none">
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.hint}>{it.caricamentoIss}</Text>
          </View>
        ) : null}
        {error && empty ? (
          <View style={styles.overlay}>
            <Text style={styles.err}>{it.erroreRete}</Text>
            <Pressable
              onPress={() => {
                void tapSelect();
                void refresh(true);
              }}
              style={styles.retry}>
              <Text style={styles.retryText}>{it.riprova}</Text>
            </Pressable>
          </View>
        ) : null}
        {loading && !empty ? (
          <View style={styles.banner} pointerEvents="none">
            <ActivityIndicator color={colors.accent} size="small" />
            <Text style={styles.bannerText}>{it.caricamentoCatalogo}</Text>
          </View>
        ) : null}
        {error && !empty ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{error}</Text>
            <Pressable
              onPress={() => {
                void tapSelect();
                void refresh(true);
              }}>
              <Text style={styles.retryText}>{it.riprova}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.bottom}>
        {selected ? (
          <SatelliteCard sat={selected} compact onClose={() => select(null)} />
        ) : (
          <View>
            <Text style={styles.hint}>{it.toccaPunto}</Text>
            <Text style={styles.hintSub}>{it.toccaCatalogo}</Text>
          </View>
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
    gap: 8,
  },
  brand: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: 0.4 },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  issBtn: {
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  issText: { color: colors.gold, fontSize: 13, fontWeight: '700' },
  refresh: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  globe: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
    gap: 10,
    backgroundColor: 'rgba(5,7,15,0.55)',
  },
  banner: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    top: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.panelSolid,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bannerText: { color: colors.muted, fontSize: 12, flex: 1 },
  bottom: { paddingHorizontal: space.md, paddingBottom: 10, paddingTop: 6, minHeight: 48 },
  hint: { color: colors.muted, textAlign: 'center', fontSize: 13 },
  hintSub: { color: colors.dim, textAlign: 'center', fontSize: 12, marginTop: 4 },
  err: { color: colors.danger, textAlign: 'center', fontSize: 14 },
  retry: {
    marginTop: 6,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
});
