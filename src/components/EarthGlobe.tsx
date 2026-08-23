import { useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { LAND_RINGS } from '../data/landmasses';
import { clamp, pathFromRing, projectGeo } from '../orbit/project';
import { subsolarPoint } from '../orbit/propagate';
import { colors } from '../theme';
import type { SatSnapshot } from '../types';

type Props = {
  satellites: SatSnapshot[];
  selectedId: number | null;
  selectedTrack: { lat: number; lon: number; altKm: number }[];
  onSelect: (noradId: number | null) => void;
};

const STARS = Array.from({ length: 70 }, (_, i) => ({
  x: ((i * 97) % 1000) / 10,
  y: ((i * 53) % 1000) / 10,
  r: i % 9 === 0 ? 1.2 : 0.6,
  o: 0.25 + ((i * 13) % 50) / 100,
}));

export function EarthGlobe({ satellites, selectedId, selectedTrack, onSelect }: Props) {
  const [size, setSize] = useState({ w: 360, h: 420 });
  const [rot, setRot] = useState({ lat: 18, lon: 12 });
  const [scale, setScale] = useState(1);
  const rotRef = useRef(rot);
  const scaleRef = useRef(scale);
  const startRot = useRef(rot);
  const pinch0 = useRef<number | null>(null);
  const lastTap = useRef<{ x: number; y: number } | null>(null);
  const satsRef = useRef<{ s: SatSnapshot; p: ReturnType<typeof projectGeo> }[]>([]);
  const onSelectRef = useRef(onSelect);

  rotRef.current = rot;
  scaleRef.current = scale;
  onSelectRef.current = onSelect;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setSize({ w: width, h: height });
  };

  const cx = size.w / 2;
  const cy = size.h / 2 + 6;
  const earthPx = Math.min(size.w, size.h) * 0.36 * scale;

  const land = useMemo(
    () =>
      LAND_RINGS.map((ring) => pathFromRing(ring, rot.lat, rot.lon, earthPx, cx, cy)).filter(
        (d) => d.length > 8,
      ),
    [rot.lat, rot.lon, earthPx, cx, cy],
  );

  const sun = useMemo(() => subsolarPoint(), [satellites.length]);
  const sunProj = projectGeo(sun.lat, sun.lon, 0, rot.lat, rot.lon, earthPx, cx, cy);

  const sats = useMemo(
    () =>
      satellites.map((s) => ({
        s,
        p: projectGeo(s.lat, s.lon, s.altKm, rot.lat, rot.lon, earthPx, cx, cy),
      })),
    [satellites, rot.lat, rot.lon, earthPx, cx, cy],
  );
  satsRef.current = sats;

  const trackPath = useMemo(() => {
    if (selectedTrack.length < 2) return '';
    let d = '';
    let drawing = false;
    for (const pt of selectedTrack) {
      const p = projectGeo(pt.lat, pt.lon, pt.altKm, rot.lat, rot.lon, earthPx, cx, cy);
      if (!p.front) {
        drawing = false;
        continue;
      }
      d += drawing ? `L${p.x.toFixed(1)},${p.y.toFixed(1)}` : `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      drawing = true;
    }
    return d;
  }, [selectedTrack, rot.lat, rot.lon, earthPx, cx, cy]);

  const pickNear = (x: number, y: number) => {
    let best: { id: number; d: number } | null = null;
    for (const { s, p } of satsRef.current) {
      if (!p.front) continue;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < 22 && (!best || d < best.d)) best = { id: s.noradId, d };
    }
    onSelectRef.current(best ? best.id : null);
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const t = e.nativeEvent.touches;
        startRot.current = { ...rotRef.current };
        lastTap.current = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
        if (t.length >= 2) {
          pinch0.current = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
        } else {
          pinch0.current = null;
        }
      },
      onPanResponderMove: (e, g) => {
        const t = e.nativeEvent.touches;
        if (t.length >= 2) {
          const dist = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
          if (pinch0.current && pinch0.current > 8) {
            const next = clamp(scaleRef.current * (dist / pinch0.current), 0.72, 2.1);
            pinch0.current = dist;
            scaleRef.current = next;
            setScale(next);
          }
          lastTap.current = null;
          return;
        }
        if (Math.abs(g.dx) + Math.abs(g.dy) > 6) lastTap.current = null;
        const next = {
          lon: startRot.current.lon - g.dx * 0.18,
          lat: clamp(startRot.current.lat + g.dy * 0.14, -80, 80),
        };
        rotRef.current = next;
        setRot(next);
      },
      onPanResponderRelease: (e) => {
        pinch0.current = null;
        if (lastTap.current) {
          pickNear(e.nativeEvent.locationX, e.nativeEvent.locationY);
        }
      },
    }),
  ).current;

  const lightX = sunProj.front ? sunProj.x : cx - (sunProj.x - cx) * 0.35;
  const lightY = sunProj.front ? sunProj.y : cy - (sunProj.y - cy) * 0.35;

  return (
    <View style={styles.fill} onLayout={onLayout} {...responder.panHandlers}>
      <Svg width={size.w} height={size.h}>
        <Defs>
          <RadialGradient id="ocean" cx={`${(lightX / size.w) * 100}%`} cy={`${(lightY / size.h) * 100}%`} r="55%">
            <Stop offset="0%" stopColor="#1A4B7A" />
            <Stop offset="55%" stopColor={colors.ocean} />
            <Stop offset="100%" stopColor={colors.oceanDeep} />
          </RadialGradient>
          <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
            <Stop offset="70%" stopColor={colors.atmosphere} stopOpacity="0" />
            <Stop offset="88%" stopColor={colors.atmosphere} stopOpacity="0.22" />
            <Stop offset="100%" stopColor={colors.atmosphere} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {STARS.map((st, i) => (
          <Circle
            key={i}
            cx={(st.x / 100) * size.w}
            cy={(st.y / 100) * size.h}
            r={st.r}
            fill="#E8F1FF"
            opacity={st.o}
          />
        ))}

        <Circle cx={cx} cy={cy} r={earthPx * 1.16} fill="url(#halo)" />
        <Circle cx={cx} cy={cy} r={earthPx} fill="url(#ocean)" />
        {land.map((d, i) => (
          <Path key={i} d={d} fill={colors.land} opacity={0.92} />
        ))}
        <Circle cx={cx} cy={cy} r={earthPx} fill="none" stroke="rgba(125,211,252,0.22)" strokeWidth={1} />

        {trackPath ? (
          <Path d={trackPath} fill="none" stroke={colors.gold} strokeWidth={1.4} opacity={0.85} />
        ) : null}

        {sats
          .filter(({ p }) => p.front)
          .map(({ s, p }) => {
            const selected = s.noradId === selectedId;
            const r = selected ? 5.5 : s.group === 'stations' ? 4 : 2.6;
            return (
              <Circle
                key={s.noradId}
                cx={p.x}
                cy={p.y}
                r={r}
                fill={colors.groups[s.group]}
                stroke={selected ? '#FFFFFF' : 'rgba(5,7,15,0.6)'}
                strokeWidth={selected ? 1.6 : 0.6}
              />
            );
          })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
});
