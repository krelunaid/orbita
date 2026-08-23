import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fmtElev } from '../format';
import { tapLight, tapSelect } from '../haptics';
import { groupLabel, it } from '../i18n';
import { FALLBACK_CITIES } from '../location/cities';
import { compassFromAzimuth, HIGH_ELEV_DEG, type OverheadPick } from '../orbit/look';
import type { LocationStatus } from '../state/SatellitesContext';
import { colors } from '../theme';
import type { Observer, SatSnapshot } from '../types';

type Props = {
  observer: Observer | null;
  status: LocationStatus;
  canAskAgain: boolean;
  message: string | null;
  overhead: OverheadPick;
  selectedId: number | null;
  onRetry: () => void;
  onCity: (cityId: string) => void;
  onSelect: (noradId: number) => void;
  onClose: () => void;
};

export function OverheadPanel({
  observer,
  status,
  canAskAgain,
  message,
  overhead,
  selectedId,
  onRetry,
  onCity,
  onSelect,
  onClose,
}: Props) {
  const showCities = status === 'denied' || status === 'error' || (status === 'ready' && observer?.kind === 'city');
  const subtitle = observer
    ? observer.kind === 'city'
      ? `${observer.label} · ${it.citta}`
      : `${it.miaPosizione} · ${it.live}`
    : status === 'requesting'
      ? it.posizioneInCorso
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{it.sopraDiTe}</Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
        </View>
        <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Chiudi">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      {status === 'requesting' && !observer ? (
        <View style={styles.rowCenter}>
          <ActivityIndicator color={colors.accent} size="small" />
          <Text style={styles.hint}>{it.posizioneInCorso}</Text>
        </View>
      ) : null}

      {message && (status === 'denied' || status === 'error') ? (
        <Text style={styles.warn}>{message}</Text>
      ) : null}

      {status === 'denied' || status === 'error' || observer?.kind === 'city' ? (
        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              void tapSelect();
              if (!canAskAgain && status === 'denied') {
                void Linking.openSettings();
              } else {
                onRetry();
              }
            }}
            style={styles.actionBtn}
            accessibilityRole="button">
            <Text style={styles.actionText}>
              {!canAskAgain && status === 'denied' ? it.apriImpostazioni : it.riprovaPosizione}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {showCities ? (
        <View>
          <Text style={styles.cityLabel}>{it.usaCitta}</Text>
          <View style={styles.cities}>
            {FALLBACK_CITIES.map((city) => {
              const active = observer?.kind === 'city' && observer.label === city.name;
              return (
                <Pressable
                  key={city.id}
                  onPress={() => {
                    void tapLight();
                    onCity(city.id);
                  }}
                  style={[styles.city, active && styles.cityOn]}
                  accessibilityRole="button"
                  accessibilityLabel={city.name}>
                  <Text style={[styles.cityText, active && styles.cityTextOn]}>{city.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {observer ? (
        <View>
          {overhead.mode === 'best' ? <Text style={styles.hint}>{it.nessunoAlto}</Text> : null}
          {overhead.mode === 'empty' ? <Text style={styles.hint}>{it.nessunoOrizzonte}</Text> : null}
          {overhead.mode === 'high' ? (
            <Text style={styles.hint}>
              {overhead.items.length} {it.oggetti} · {it.nelCielo} ≥ {HIGH_ELEV_DEG}°
            </Text>
          ) : null}
          <ScrollView style={styles.list} nestedScrollEnabled>
            {overhead.items.map((sat) => (
              <OverheadRow
                key={sat.noradId}
                sat={sat}
                active={sat.noradId === selectedId}
                onPress={() => onSelect(sat.noradId)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function OverheadRow({
  sat,
  active,
  onPress,
}: {
  sat: SatSnapshot;
  active: boolean;
  onPress: () => void;
}) {
  const elev = sat.look ? fmtElev(sat.look.elevationDeg) : '—';
  const dir = sat.look ? compassFromAzimuth(sat.look.azimuthDeg) : '—';
  return (
    <Pressable
      onPress={() => {
        void tapSelect();
        onPress();
      }}
      style={[styles.satRow, active && styles.satRowOn]}
      accessibilityRole="button"
      accessibilityLabel={`${sat.name}, ${elev}, ${dir}`}>
      <View style={[styles.dot, { backgroundColor: colors.groups[sat.group] }]} />
      <Text style={styles.satName} numberOfLines={1}>
        {sat.name}
      </Text>
      <Text style={styles.satLook}>
        {elev} · {dir}
      </Text>
      <Text style={styles.satGroup}>{groupLabel(sat.group)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { color: colors.text, fontSize: 16, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  close: { color: colors.muted, fontSize: 16, paddingHorizontal: 4 },
  hint: { color: colors.muted, fontSize: 12 },
  warn: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionText: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  cityLabel: { color: colors.dim, fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  cities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  city: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cityOn: { borderColor: colors.accent, backgroundColor: '#121A2C' },
  cityText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  cityTextOn: { color: colors.text },
  list: { maxHeight: 168 },
  satRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  satRowOn: { backgroundColor: '#121A2C', marginHorizontal: -6, paddingHorizontal: 6, borderRadius: 8 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  satName: { color: colors.text, fontSize: 14, fontWeight: '600', flex: 1 },
  satLook: { color: colors.gold, fontSize: 13, fontWeight: '700', fontFamily: 'SpaceMono' },
  satGroup: { color: colors.dim, fontSize: 11, width: 58, textAlign: 'right' },
});
