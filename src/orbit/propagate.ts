import * as satellite from 'satellite.js';

import { lookFromEci } from './look';
import { inclinationDeg, periodMinutes } from './parseTle';
import type { Observer, SatSnapshot, TleRecord } from '../types';

export function propagateNow(
  record: TleRecord,
  when = new Date(),
  observer?: Observer | null,
): SatSnapshot {
  const base = {
    ...record,
    lat: 0,
    lon: 0,
    altKm: 0,
    velocityKmS: 0,
    periodMin: periodMinutes(record.line2),
    inclinationDeg: inclinationDeg(record.line2),
    valid: false,
  };

  try {
    const satrec = satellite.twoline2satrec(record.line1, record.line2);
    const pv = satellite.propagate(satrec, when);
    if (!pv) return base;
    const position = pv.position;
    const velocity = pv.velocity;
    if (!position || !velocity) return base;

    const gmst = satellite.gstime(when);
    const gd = satellite.eciToGeodetic(position, gmst);
    const lat = satellite.degreesLat(gd.latitude);
    const lon = satellite.degreesLong(gd.longitude);
    const altKm = gd.height;
    const velocityKmS = Math.hypot(velocity.x, velocity.y, velocity.z);

    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(altKm)) {
      return base;
    }

    const look = observer ? lookFromEci(position, gmst, observer) ?? undefined : undefined;
    return { ...base, lat, lon, altKm, velocityKmS, valid: true, look };
  } catch {
    return base;
  }
}

export function propagateMany(
  records: TleRecord[],
  when = new Date(),
  observer?: Observer | null,
): SatSnapshot[] {
  return records.map((r) => propagateNow(r, when, observer)).filter((s) => s.valid);
}

export type GeoPoint = { lat: number; lon: number; altKm: number };

export function orbitTrack(record: TleRecord, steps = 72, when = new Date()): GeoPoint[] {
  const periodMin = periodMinutes(record.line2);
  if (periodMin <= 0) return [];
  const spanMs = Math.min(periodMin, 180) * 60_000;
  const out: GeoPoint[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = new Date(when.getTime() + (spanMs * i) / steps);
    const snap = propagateNow(record, t);
    if (snap.valid) out.push({ lat: snap.lat, lon: snap.lon, altKm: snap.altKm });
  }
  return out;
}

/** Approximate subsolar point for a day/night terminator. */
export function subsolarPoint(when = new Date()): { lat: number; lon: number } {
  const start = Date.UTC(when.getUTCFullYear(), 0, 0);
  const day = (when.getTime() - start) / 86_400_000;
  const decl =
    -23.44 * Math.cos(((360 / 365) * (day + 10) * Math.PI) / 180);
  const utcHours = when.getUTCHours() + when.getUTCMinutes() / 60 + when.getUTCSeconds() / 3600;
  const lon = 180 - utcHours * 15;
  return { lat: decl, lon: wrapLon(lon) };
}

export function wrapLon(lon: number): number {
  let x = lon;
  while (x < -180) x += 360;
  while (x > 180) x -= 360;
  return x;
}
