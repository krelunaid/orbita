import type { GroupId, TleRecord, TleSource } from '../types';

const STARLINK = /STARLINK/i;
const ONEWEB = /ONEWEB/i;

export function isMegaConstellation(name: string): boolean {
  return STARLINK.test(name) || ONEWEB.test(name);
}

export function parse3le(text: string, source: TleSource, group: GroupId): TleRecord[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const out: TleRecord[] = [];
  let i = 0;
  while (i < lines.length) {
    let name = '';
    let line1 = '';
    let line2 = '';

    if (lines[i].startsWith('1 ') && i + 1 < lines.length && lines[i + 1].startsWith('2 ')) {
      line1 = lines[i];
      line2 = lines[i + 1];
      name = noradFromLine1(line1) ? `NORAD ${noradFromLine1(line1)}` : 'Oggetto';
      i += 2;
    } else if (
      i + 2 < lines.length &&
      lines[i + 1].startsWith('1 ') &&
      lines[i + 2].startsWith('2 ')
    ) {
      name = lines[i].replace(/^0\s+/, '').trim();
      line1 = lines[i + 1];
      line2 = lines[i + 2];
      i += 3;
    } else {
      i += 1;
      continue;
    }

    const noradId = noradFromLine1(line1);
    if (!noradId || line1.length < 60 || line2.length < 60) continue;
    if (isMegaConstellation(name)) continue;

    out.push({ noradId, name, line1, line2, group, source });
  }
  return out;
}

export function noradFromLine1(line1: string): number | null {
  const raw = line1.slice(2, 7).trim();
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function meanMotionRevPerDay(line2: string): number {
  const n = Number.parseFloat(line2.slice(52, 63));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function inclinationDeg(line2: string): number {
  const n = Number.parseFloat(line2.slice(8, 16));
  return Number.isFinite(n) ? n : 0;
}

export function periodMinutes(line2: string): number {
  const n = meanMotionRevPerDay(line2);
  return n > 0 ? 1440 / n : 0;
}

/** TLE epoch from line 1 (yyddd.ffffffff). Newer values replace older duplicates. */
export function tleEpoch(line1: string): number {
  const raw = Number.parseFloat(line1.slice(18, 32).trim());
  return Number.isFinite(raw) ? raw : 0;
}

export function dedupeByNorad(records: TleRecord[]): TleRecord[] {
  const seen = new Map<number, TleRecord>();
  for (const rec of records) {
    const prev = seen.get(rec.noradId);
    if (!prev || tleEpoch(rec.line1) > tleEpoch(prev.line1)) {
      seen.set(rec.noradId, rec);
    }
  }
  return [...seen.values()];
}
