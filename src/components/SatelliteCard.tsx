import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fmtAlt, fmtElev, fmtLat, fmtLon, fmtPeriod, fmtVel } from '../format';
import { groupLabel, it } from '../i18n';
import { compassFromAzimuth } from '../orbit/look';
import { colors, space } from '../theme';
import type { SatSnapshot } from '../types';

type Props = {
  sat: SatSnapshot;
  onClose?: () => void;
  compact?: boolean;
};

export function SatelliteCard({ sat, onClose, compact }: Props) {
  const tint = colors.groups[sat.group];
  return (
    <View style={[styles.card, compact && styles.compact]}>
      <View style={styles.head}>
        <View style={[styles.swatch, { backgroundColor: tint }]} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>
            {sat.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {it.norad} {sat.noradId} · {groupLabel(sat.group)}
          </Text>
        </View>
        {onClose ? (
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.grid}>
        {sat.look ? <Stat label={it.nelCielo} value={fmtElev(sat.look.elevationDeg)} /> : null}
        {sat.look ? <Stat label={it.direzione} value={compassFromAzimuth(sat.look.azimuthDeg)} /> : null}
        <Stat label={it.quota} value={fmtAlt(sat.altKm)} />
        <Stat label={it.velocita} value={fmtVel(sat.velocityKmS)} />
        <Stat label={it.latitudine} value={fmtLat(sat.lat)} />
        <Stat label={it.longitudine} value={fmtLon(sat.lon)} />
        {!compact ? <Stat label={it.periodo} value={fmtPeriod(sat.periodMin)} /> : null}
        {!compact ? <Stat label={it.inclinazione} value={`${sat.inclinationDeg.toFixed(1)}°`} /> : null}
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: space.md,
    gap: 12,
  },
  compact: { padding: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  close: { color: colors.muted, fontSize: 16, paddingHorizontal: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { flexGrow: 1, flexBasis: '46%', minWidth: 0, maxWidth: '48%' },
  statLabel: { color: colors.dim, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 },
  statValue: { color: colors.text, fontSize: 15, fontFamily: 'SpaceMono', marginTop: 2 },
});
