import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { EarthGlobe } from '@/src/components/EarthGlobe';
import { GroupFilter } from '@/src/components/GroupFilter';
import { OverheadPanel } from '@/src/components/OverheadPanel';
import { SatelliteCard } from '@/src/components/SatelliteCard';
import { fmtWhen } from '@/src/format';
import { tapLight, tapSelect } from '@/src/haptics';
import { it } from '@/src/i18n';
import { globeSheetBudget } from '@/src/layout';
import { useSatellites } from '@/src/state/SatellitesContext';
import { colors, space } from '@/src/theme';

export default function GlobeScreen() {
  const {
    snapshots,
    loading,
    error,
    fetchedAt,
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
    focusMode,
    setGlobeBusy,
    refresh,
    observer,
    locationStatus,
    locationCanAskAgain,
    locationMessage,
    overheadOpen,
    overhead,
    requestMyLocation,
    useFallbackCity,
    setOverheadOpen,
    focusObserver,
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
        fetchedAt ? fmtWhen(fetchedAt) : null,
        cached ? (snapshots.length === 1 ? it.stimaIss : it.cache) : null,
      ]
        .filter(Boolean)
        .join(' · ');

  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { sheetMax } = globeSheetBudget(windowHeight, insets.top, insets.bottom);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.top}>
        <View style={styles.brandWrap}>
          <Text style={styles.brand} numberOfLines={1}>
            {it.appName}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {statusLine}
          </Text>
        </View>
        <View style={styles.topActions}>
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
      </View>

      <View style={styles.filters}>
        <GroupFilter enabled={enabledGroups} onToggle={toggleGroup} />
      </View>

      <View style={styles.globe}>
        <EarthGlobe
          satellites={snapshots}
          selectedId={selectedId}
          selectedTrack={selectedTrack}
          focusToken={focusToken}
          focusMode={focusMode}
          observer={observer}
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
        <Pressable
          onPress={() => {
            void tapSelect();
            if (observer) {
              if (overheadOpen) focusObserver();
              else {
                setOverheadOpen(true);
                focusObserver();
              }
            } else {
              void requestMyLocation();
            }
          }}
          style={[styles.hereBtn, overheadOpen && styles.hereBtnOn]}
          accessibilityRole="button"
          accessibilityLabel={it.centraPosizione}>
          <SymbolView name="location.fill" tintColor={overheadOpen ? colors.bg : colors.accent} size={16} />
          <Text style={[styles.hereText, overheadOpen && styles.hereTextOn]} numberOfLines={1}>
            {it.sopraDiTe}
          </Text>
        </Pressable>
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

      <View style={[styles.bottom, { maxHeight: sheetMax }]}>
        {overheadOpen ? (
          <OverheadPanel
            maxHeight={sheetMax - 16}
            observer={observer}
            status={locationStatus}
            canAskAgain={locationCanAskAgain}
            message={locationMessage}
            overhead={overhead}
            selectedId={selectedId}
            onRetry={() => {
              void requestMyLocation();
            }}
            onCity={useFallbackCity}
            onSelect={selectAndFocus}
            onClose={() => setOverheadOpen(false)}
          />
        ) : selected ? (
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
  safe: { flex: 1, minHeight: 0, backgroundColor: colors.bg },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingBottom: 8,
    gap: 8,
    flexGrow: 0,
    flexShrink: 0,
  },
  brandWrap: { flex: 1, minWidth: 0 },
  brand: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: 0.4 },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  topActions: { flexDirection: 'row', flexShrink: 0, gap: 8, alignItems: 'center' },
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
  filters: { flexGrow: 0, flexShrink: 0 },
  globe: { flex: 1, minHeight: 0, overflow: 'visible' },
  hereBtn: {
    position: 'absolute',
    right: space.md,
    top: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.panelSolid,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 2,
    maxWidth: '72%',
  },
  hereBtnOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  hereText: { color: colors.accent, fontSize: 13, fontWeight: '700', flexShrink: 1 },
  hereTextOn: { color: colors.bg },
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
  bottom: {
    paddingHorizontal: space.md,
    paddingBottom: 10,
    paddingTop: 6,
    minHeight: 48,
    flexGrow: 0,
    flexShrink: 1,
    overflow: 'visible',
  },
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
