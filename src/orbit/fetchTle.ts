import { GROUP_IDS, type CatalogState, type CelestrakGroup, type GroupId, type TleRecord } from '../types';
import { dedupeByNorad, isMegaConstellation, parse3le } from './parseTle';

export const MAX_OBJECTS = 280;
const FETCH_MS = 18_000;

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

const SATNOGS_3LE = 'https://db.satnogs.org/api/tle/?format=3le';
const IVAN_API = 'https://tle.ivanstanojevic.me/api/tle?page-size=200';

async function readText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: 'text/plain, application/json;q=0.9, */*;q=0.5',
      },
    });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCelestrakGroup(group: CelestrakGroup): Promise<TleRecord[]> {
  let last: unknown;
  for (const build of CELESTRAK) {
    try {
      const text = await readText(build(group));
      const parsed = parse3le(text, 'celestrak', group);
      if (parsed.length > 0) return parsed;
    } catch (err) {
      last = err;
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

function parseIvan(jsonText: string): TleRecord[] {
  const data = JSON.parse(jsonText) as { member?: IvanMember[] };
  const members = Array.isArray(data.member) ? data.member : [];
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

async function fetchSatnogs(): Promise<TleRecord[]> {
  const text = await readText(SATNOGS_3LE);
  return parse3le(text, 'satnogs', 'altro').map((r) => ({
    ...r,
    group: guessGroup(r.name),
  }));
}

async function fetchIvan(): Promise<TleRecord[]> {
  return parseIvan(await readText(IVAN_API));
}

export function capCatalog(records: TleRecord[], max = MAX_OBJECTS): TleRecord[] {
  const unique = dedupeByNorad(records).filter((r) => !isMegaConstellation(r.name));
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
  return dedupeByNorad(picked).slice(0, max);
}

export async function loadPublicTle(): Promise<CatalogState> {
  const collected: TleRecord[] = [];
  const errors: string[] = [];

  await Promise.all(
    GROUP_IDS.map(async (group) => {
      try {
        const rows = await fetchCelestrakGroup(group);
        collected.push(...rows);
      } catch (err) {
        errors.push(`${group}: ${err instanceof Error ? err.message : 'errore'}`);
      }
    }),
  );

  if (collected.length >= 20) {
    return {
      records: capCatalog(collected),
      fetchedAt: Date.now(),
      source: 'celestrak',
      cached: false,
    };
  }

  try {
    const satnogs = await fetchSatnogs();
    if (satnogs.length > 0) {
      return {
        records: capCatalog(satnogs),
        fetchedAt: Date.now(),
        source: 'satnogs',
        cached: false,
      };
    }
  } catch (err) {
    errors.push(`satnogs: ${err instanceof Error ? err.message : 'errore'}`);
  }

  try {
    const ivan = await fetchIvan();
    if (ivan.length > 0) {
      return {
        records: capCatalog(ivan),
        fetchedAt: Date.now(),
        source: 'ivanstanojevic',
        cached: false,
      };
    }
  } catch (err) {
    errors.push(`ivan: ${err instanceof Error ? err.message : 'errore'}`);
  }

  throw new Error(errors.join(' · ') || 'Nessuna fonte TLE disponibile');
}
