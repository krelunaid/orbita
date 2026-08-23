import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { LAND_RINGS } from '../data/landmasses';
import { HIGH_ELEV_DEG } from '../orbit/look';
import { clamp, pathFromRing, projectGeo } from '../orbit/project';
import { subsolarPoint } from '../orbit/propagate';
import { colors } from '../theme';
import type { SatSnapshot } from '../types';

type Props = {
  satellites: SatSnapshot[];
  selectedId: number | null;
  selectedTrack: { lat: number; lon: number; altKm: number }[];
  focusToken?: number;
  focusMode?: 'sat' | 'geo';
  observer?: { lat: number; lon: number } | null;
  onSelect: (noradId: number | null) => void;
  onInteract?: (busy: boolean) => void;
};

const STARS = Array.from({ length: 70 }, (_, i) => ({
  x: ((i * 97) % 1000) / 10,
  y: ((i * 53) % 1000) / 10,
  r: i % 9 === 0 ? 1.2 : 0.6,
  o: 0.25 + ((i * 13) % 50) / 100,
}));

export function EarthGlobe({
  satellites,
  selectedId,
  selectedTrack,
  focusToken = 0,
  focusMode = 'sat',
  observer = null,
  onSelect,
  onInteract,
}: Props) {
  const [size, setSize] = useState({ w: 360, h: 420 });
  const [rot, setRot] = useState({ lat: 18, lon: 12 });
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const rotRef = useRef(rot);
  const scaleRef = useRef(scale);
  const startRot = useRef(rot);
  const pinch0 = useRef<number | null>(null);
  const lastTap = useRef<{ x: number; y: number } | null>(null);
  const satsRef = useRef<{ s: SatSnapshot; p: ReturnType<typeof projectGeo> }[]>([]);
  const satellitesRef = useRef(satellites);
  const selectedIdRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  const onInteractRef = useRef(onInteract);
  const draggingRef = useRef(false);
  const pendingRot = useRef<{ lat: number; lon: number } | null>(null);
  const pendingScale = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFocusToken = useRef(0);
  const didAutoFocus = useRef(false);
  const userMovedRef = useRef(false);
  const observerRef = useRef(observer);
  const focusModeRef = useRef(focusMode);
  observerRef.current = observer;
  focusModeRef.current = focusMode;

  rotRef.current = rot;
  scaleRef.current = scale;
  satellitesRef.current = satellites;
  selectedIdRef.current = selectedId;
  onSelectRef.current = onSelect;
  onInteractRef.current = onInteract;

  const flushView = () => {
    rafRef.current = null;
    if (pendingRot.current) {
      setRot(pendingRot.current);
      pendingRot.current = null;
    }
    if (pendingScale.current != null) {
      setScale(pendingScale.current);
      pendingScale.current = null;
    }
  };

  const scheduleFlush = () => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(flushView);
  };

  const queueRot = (next: { lat: number; lon: number }) => {
    rotRef.current = next;
    pendingRot.current = next;
    scheduleFlush();
  };

  const queueScale = (next: number) => {
    scaleRef.current = next;
    pendingScale.current = next;
    scheduleFlush();
  };

  const setBusy = (busy: boolean) => {
    if (draggingRef.current === busy) return;
    draggingRef.current = busy;
    setDragging(busy);
    onInteractRef.current?.(busy);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const centerOnLatLon = (lat: number, lon: number) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
    const next = { lat: clamp(lat, -80, 80), lon };
    rotRef.current = next;
    pendingRot.current = null;
    setRot(next);
    return true;
  };

  const centerOnSelected = () => {
    const sat =
      satellitesRef.current.find((s) => s.noradId === selectedIdRef.current) ??
      satsRef.current.find(({ s }) => s.noradId === selectedIdRef.current)?.s;
    if (!sat) return false;
    return centerOnLatLon(sat.lat, sat.lon);
  };

  const centerOnObserver = () => {
    const here = observerRef.current;
    if (!here) return false;
    return centerOnLatLon(here.lat, here.lon);
  };

  useEffect(() => {
    const tokenBump = focusToken > lastFocusToken.current;
    const initial =
      !didAutoFocus.current && selectedId != null && !userMovedRef.current && !draggingRef.current;
    if (!tokenBump && !initial) return;
    const ok =
      (tokenBump && focusModeRef.current === 'geo' ? centerOnObserver() : false) ||
      centerOnSelected() ||
      (focusModeRef.current === 'geo' ? centerOnObserver() : false);
    if (!ok) return;
    if (tokenBump) lastFocusToken.current = focusToken;
    didAutoFocus.current = true;
  }, [focusToken, focusMode, observer, selectedId, satellites]);

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

  const observerProj = observer
    ? projectGeo(observer.lat, observer.lon, 0, rot.lat, rot.lon, earthPx, cx, cy)
    : null;

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
        setBusy(true);
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
            queueScale(next);
            userMovedRef.current = true;
          }
          lastTap.current = null;
          return;
        }
        if (Math.abs(g.dx) + Math.abs(g.dy) > 6) {
          lastTap.current = null;
          userMovedRef.current = true;
        }
        queueRot({
          lon: startRot.current.lon - g.dx * 0.18,
          lat: clamp(startRot.current.lat + g.dy * 0.14, -80, 80),
        });
      },
      onPanResponderRelease: (e) => {
        pinch0.current = null;
        setBusy(false);
        if (lastTap.current) {
          pickNear(e.nativeEvent.locationX, e.nativeEvent.locationY);
        }
      },
      onPanResponderTerminate: () => {
        pinch0.current = null;
        setBusy(false);
      },
    }),
  ).current;

  const lightX = sunProj.front ? sunProj.x : cx - (sunProj.x - cx) * 0.35;
  const lightY = sunProj.front ? sunProj.y : cy - (sunProj.y - cy) * 0.35;

  const drawnSats = dragging
    ? sats.filter(
        ({ s, p }) => p.front && (s.noradId === selectedId || s.group === 'stations'),
      )
    : sats.filter(({ p }) => p.front);

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

        {!dragging
          ? STARS.map((st, i) => (
              <Circle
                key={i}
                cx={(st.x / 100) * size.w}
                cy={(st.y / 100) * size.h}
                r={st.r}
                fill="#E8F1FF"
                opacity={st.o}
              />
            ))
          : null}

        <Circle cx={cx} cy={cy} r={earthPx * 1.16} fill="url(#halo)" />
        <Circle cx={cx} cy={cy} r={earthPx} fill="url(#ocean)" />
        {land.map((d, i) => (
          <Path key={i} d={d} fill={colors.land} opacity={0.92} />
        ))}
        <Circle cx={cx} cy={cy} r={earthPx} fill="none" stroke="rgba(125,211,252,0.22)" strokeWidth={1} />

        {trackPath ? (
          <Path d={trackPath} fill="none" stroke={colors.gold} strokeWidth={1.4} opacity={0.85} />
        ) : null}

        {observerProj?.front ? (
          <>
            <Circle
              cx={observerProj.x}
              cy={observerProj.y}
              r={8}
              fill="none"
              stroke={colors.accent}
              strokeWidth={1.4}
              opacity={0.85}
            />
            <Circle cx={observerProj.x} cy={observerProj.y} r={3.2} fill={colors.accent} />
          </>
        ) : null}

        {drawnSats.map(({ s, p }) => {
          const selected = s.noradId === selectedId;
          const overhead = (s.look?.elevationDeg ?? -90) >= HIGH_ELEV_DEG;
          const r = selected ? 5.5 : overhead ? 4.4 : s.group === 'stations' ? 4 : 2.6;
          return (
            <Circle
              key={s.noradId}
              cx={p.x}
              cy={p.y}
              r={r}
              fill={colors.groups[s.group]}
              stroke={selected ? '#FFFFFF' : overhead ? colors.accent : 'rgba(5,7,15,0.6)'}
              strokeWidth={selected ? 1.6 : overhead ? 1.3 : 0.6}
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
