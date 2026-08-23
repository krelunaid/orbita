import type { TleRecord } from '../types';

export const ISS_NORAD = 25544;

/** Bundled last-resort ISS TLE (SatNOGS, epoch 2026-08-22). Live sources and cache always win. */
export const ISS_FALLBACK_TLE: TleRecord = {
  noradId: ISS_NORAD,
  name: 'ISS (ZARYA)',
  line1: '1 25544U 98067A   26234.95197288  .00008617  00000-0  16105-3 0  9994',
  line2: '2 25544  51.6333 329.6465 0007691  74.0420 286.1416 15.49577746582107',
  group: 'stations',
  source: 'satnogs',
};

export function isIssRecord(rec: { noradId: number; name: string }): boolean {
  return rec.noradId === ISS_NORAD || /ISS\s*\(ZARYA\)/i.test(rec.name);
}

export function pinIssFirst<T extends { noradId: number; name: string }>(records: T[]): T[] {
  const iss = records.find(isIssRecord);
  if (!iss) return records;
  return [iss, ...records.filter((r) => r.noradId !== iss.noradId)];
}

export function findIss<T extends { noradId: number; name: string }>(records: T[]): T | undefined {
  return records.find(isIssRecord);
}

export function recordMatchesQuery(rec: { name: string; noradId: number }, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return rec.name.toLowerCase().includes(q) || String(rec.noradId).includes(q);
}
