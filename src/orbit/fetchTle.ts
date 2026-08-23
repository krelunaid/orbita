import { GROUP_IDS, type CatalogState, type CelestrakGroup, type GroupId, type TleRecord } from '../types';
import { ISS_NORAD, isIssRecord, pinIssFirst } from './iss';
import { dedupeByNorad, isMegaConstellation, parse3le } from './parseTle';

export const MAX_OBJECTS = 280;
export { ISS_NORAD, isIssRecord, pinIssFirst };

const FETCH_MS = 8_000;
const USER_AGENT = 'Orbita/1.0 (it.kreluna.orbita; +https://github.com/krelunaid/orbita)';

let celestrakUnreachable = false;

export function resetTleCircuit(): void {
  celestrakUnreachable = false;
}

function isNetworkFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.name === 'AbortError' ||
    /fetch failed|network request failed|timeout|aborted|Failed to connect/i.test(err.message)
  );
}

const GROUP_BUDGET: Record<CelestrakGroup, number> = {
  stations: 40,
  'gps-ops': 40,
  galileo: 40,
  weather: 50,
  science: 45,
  visual: 120,
};

const CELESTRAK = [
  (g: string) => `https://celestrak.org/NORAD/elements/gp.php?GROUP=${g}&FORMAT=tle`,
  (g: string) => `https://celestrak.org/NORAD/elements/${g}.txt`,
];

const ISS_TLE_URLS = [
  `https://celestrak.org/NORAD/elements/gp.php?CATNR=${ISS_NORAD}&FORMAT=tle`,
  'https://db.satnogs.org/api/tle/?format=3le&norad_cat_id=25544',
];

const IVAN_ISS = `https://tle.ivanstanojevic.me/api/tle/${ISS_NORAD}`;
const IVAN_API = 'https://tle.ivanstanojevic.me/api/tle?page-size=200';

/** Famous objects only — never the full SatNOGS 3LE dump (too large for a phone). */
const SATNOGS_CURATED = [
  ISS_NORAD,
  48274, // CSS Tianhe
  20580, // Hubble
  50463, // JWST
  43013, // TESS
  27424, // Aqua
  25994, // Terra
  28654, // NOAA 18
  33591, // NOAA 19
  43226, // NOAA 20
  41866, // GOES 16
  25338, // NOAA 15
  37846, // Galileo
  36585, // GPS
];

function looksLikeHtml(text: string): boolean {
  const head = text.slice(0, 80).trim().toLowerCase();
  return head.startsWith('<!doctype') || head.startsWith('<html');
}

async function readText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: 'text/plain, application/json;q=0.9, */*;q=0.5',
        'User-Agent': USER_AGENT,
        'Cache-Control': 'no-cache',
      },
    });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    const text = await res.text();
    if (!text.trim()) throw new Error(`${url} → vuoto`);
    if (looksLikeHtml(text)) throw new Error(`${url} → HTML invece di TLE`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCelestrakGroup(group: CelestrakGroup): Promise<TleRecord[]> {
  if (celestrakUnreachable) throw new Error('CelesTrak irraggiungibile');
  let last: unknown;
  for (const build of CELESTRAK) {
    try {
      const text = await readText(build(group));
      const parsed = parse3le(text, 'celestrak', group);
      if (parsed.length > 0) return parsed;
    } catch (err) {
      last = err;
      if (isNetworkFailure(err)) {
        celestrakUnreachable = true;
        break;
      }
    }
  }
  throw last instanceof Error ? last : new Error(`CelesTrak ${group} vuoto`);
}

function guessGroup(name: string): GroupId {
  const n = name.toUpperCase();
  if (/ISS|ZARYA|CSS|TIANHE|WENTIAN|MENGTIAN|TIANZHOU|SHENZHOU|PROGRESS|CYGNUS|CREW DRAGON|NAUKA|POISK/.test(n)) {
    return 'stations';
  }
  if (/GPS|NAVSTAR/.test(n)) return 'gps-ops';
  if (/GALILEO/.test(n)) return 'galileo';
  if (/NOAA|GOES|METEOSAT|METOP|FENGYUN|HIMAWARI|METEOR/.test(n)) return 'weather';
  if (/HST|HUBBLE|XMM|CHANDRA|TESS|JWST|AQUA|TERRA|AURA|ENVISAT/.test(n)) return 'science';
  return 'visual';
}

type IvanMember = {
  satelliteId?: number;
  name?: string;
  line1?: string;
  line2?: string;
};

function parseIvanPayload(jsonText: string): TleRecord[] {
  const data = JSON.parse(jsonText) as { member?: IvanMember[] } & IvanMember;
  const members: IvanMember[] = Array.isArray(data.member)
    ? data.member
    : data.line1 && data.line2
      ? [data]
      : [];
  const out: TleRecord[] = [];
  for (const m of members) {
    if (!m.line1 || !m.line2 || !m.name) continue;
    if (isMegaConstellation(m.name)) continue;
    const noradId = Number(m.satelliteId);
    if (!Number.isFinite(noradId)) continue;
    out.push({
      noradId,
      name: m.name.trim(),
      line1: m.line1.trim(),
      line2: m.line2.trim(),
      group: guessGroup(m.name),
      source: 'ivanstanojevic',
    });
  }
  return out;
}

async function fetchIvanUrl(url: string): Promise<TleRecord[]> {
  return parseIvanPayload(await readText(url));
}

async function mapPool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    out.push(...(await Promise.all(chunk.map(fn))));
  }
  return out;
}

async function fetchSatnogsCurated(): Promise<TleRecord[]> {
  const batches = await mapPool(SATNOGS_CURATED, 4, async (norad) => {
    try {
      const text = await readText(`https://db.satnogs.org/api/tle/?format=3le&norad_cat_id=${norad}`);
      return parse3le(text, 'satnogs', 'altro').map((r) => ({
        ...r,
        group: guessGroup(r.name),
      }));
    } catch {
      return [] as TleRecord[];
    }
  });
  return batches.flat();
}

export function capCatalog(records: TleRecord[], max = MAX_OBJECTS): TleRecord[] {
  const unique = pinIssFirst(dedupeByNorad(records).filter((r) => !isMegaConstellation(r.name)));
  const buckets = new Map<GroupId, TleRecord[]>();
  for (const rec of unique) {
    const list = buckets.get(rec.group) ?? [];
    list.push(rec);
    buckets.set(rec.group, list);
  }

  const picked: TleRecord[] = [];
  const take = (group: GroupId, budget: number) => {
    const list = buckets.get(group) ?? [];
    picked.push(...list.slice(0, budget));
  };

  take('stations', GROUP_BUDGET.stations);
  take('gps-ops', GROUP_BUDGET['gps-ops']);
  take('galileo', GROUP_BUDGET.galileo);
  take('weather', GROUP_BUDGET.weather);
  take('science', GROUP_BUDGET.science);
  const remaining = Math.max(0, max - picked.length);
  take('visual', Math.min(GROUP_BUDGET.visual, remaining));
  if (picked.length < max) {
    take('altro', max - picked.length);
  }
  return pinIssFirst(dedupeByNorad(picked)).slice(0, max);
}

export async function fetchIssRecord(): Promise<TleRecord | null> {
  for (const url of ISS_TLE_URLS) {
    try {
      const parsed = parse3le(await readText(url), url.includes('satnogs') ? 'satnogs' : 'celestrak', 'stations');
      const iss = parsed.find(isIssRecord);
      if (iss) return { ...iss, group: 'stations' };
    } catch (err) {
      if (url.includes('celestrak') && isNetworkFailure(err)) {
        celestrakUnreachable = true;
      }
    }
  }
  try {
    const ivan = (await fetchIvanUrl(IVAN_ISS)).find(isIssRecord);
    if (ivan) return { ...ivan, group: 'stations' };
  } catch {
    // last source failed
  }
  return null;
}

function catalogFrom(records: TleRecord[], source: CatalogState['source']): CatalogState {
  return {
    records: capCatalog(records),
    fetchedAt: Date.now(),
    source,
    cached: false,
  };
}

export async function loadPublicTle(seed: TleRecord[] = []): Promise<CatalogState> {
  const collected: TleRecord[] = [...seed];
  const errors: string[] = [];

  if (!collected.some(isIssRecord)) {
    const iss = await fetchIssRecord();
    if (iss) collected.push(iss);
  }

  const alreadyHaveCelestrak = collected.some((r) => r.source === 'celestrak');
  if (alreadyHaveCelestrak || !celestrakUnreachable) {
    const groupResults = await mapPool([...GROUP_IDS], 2, async (group) => {
      try {
        return await fetchCelestrakGroup(group);
      } catch (err) {
        errors.push(`${group}: ${err instanceof Error ? err.message : 'errore'}`);
        return [] as TleRecord[];
      }
    });
    collected.push(...groupResults.flat());
  }

  if (collected.length >= 20 && collected.some(isIssRecord)) {
    return catalogFrom(collected, 'celestrak');
  }
  if (collected.length >= 20) {
    return catalogFrom(collected, 'celestrak');
  }

  try {
    const satnogs = await fetchSatnogsCurated();
    if (satnogs.length > 0) {
      return catalogFrom([...collected, ...satnogs], 'satnogs');
    }
  } catch (err) {
    errors.push(`satnogs: ${err instanceof Error ? err.message : 'errore'}`);
  }

  try {
    const ivan = await fetchIvanUrl(IVAN_API);
    const merged = [...collected, ...ivan];
    if (merged.length > 0) {
      return catalogFrom(merged, 'ivanstanojevic');
    }
  } catch (err) {
    errors.push(`ivan: ${err instanceof Error ? err.message : 'errore'}`);
  }

  if (collected.length > 0) {
    return catalogFrom(collected, collected[0].source);
  }

  throw new Error(errors.join(' · ') || 'Nessuna fonte TLE disponibile');
}
