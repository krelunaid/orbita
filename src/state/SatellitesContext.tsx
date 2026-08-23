import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { fetchIssRecord, loadPublicTle, resetTleCircuit, userTleError } from '../orbit/fetchTle';
import { findIss, ISS_FALLBACK_TLE, isIssRecord, pinIssFirst } from '../orbit/iss';
import { orbitTrack, propagateMany } from '../orbit/propagate';
import type { CatalogState, GroupId, SatSnapshot, TleRecord } from '../types';

const CACHE_KEY = 'orbita.tle.v1';
const ISS_KEY = 'orbita.iss.v1';
const TICK_MS = 1500;
/** Only debounce a second live revalidation — never skip because cache is “fresh enough”. */
const LIVE_REVALIDATE_COOLDOWN_MS = 45_000;

type Ctx = {
  snapshots: SatSnapshot[];
  allSnapshots: SatSnapshot[];
  records: TleRecord[];
  loading: boolean;
  error: string | null;
  fetchedAt: number | null;
  source: CatalogState['source'] | null;
  cached: boolean;
  selectedId: number | null;
  selected: SatSnapshot | null;
  selectedTrack: { lat: number; lon: number; altKm: number }[];
  enabledGroups: GroupId[];
  query: string;
  setQuery: (q: string) => void;
  toggleGroup: (g: GroupId) => void;
  select: (noradId: number | null) => void;
  selectAndFocus: (noradId: number) => void;
  focusIss: () => void;
  focusToken: number;
  setGlobeBusy: (busy: boolean) => void;
  refresh: (force?: boolean) => Promise<void>;
};

const SatellitesContext = createContext<Ctx | null>(null);

async function readCache(): Promise<CatalogState | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CatalogState;
    if (!parsed?.records?.length || !parsed.fetchedAt) return null;
    return { ...parsed, cached: true };
  } catch {
    return null;
  }
}

async function writeCache(state: CatalogState): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

async function readLastIss(): Promise<TleRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(ISS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TleRecord;
    if (!parsed?.line1 || !parsed?.line2 || !isIssRecord(parsed)) return null;
    return { ...parsed, group: 'stations' };
  } catch {
    return null;
  }
}

async function writeLastIss(rec: TleRecord): Promise<void> {
  try {
    await AsyncStorage.setItem(ISS_KEY, JSON.stringify(rec));
  } catch {
    // ignore quota / private mode
  }
}

function previewCatalog(record: TleRecord, cached: boolean): CatalogState {
  return {
    records: [record],
    fetchedAt: Date.now(),
    source: record.source,
    cached,
  };
}

export function SatellitesProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<CatalogState | null>(null);
  const [snapshots, setSnapshots] = useState<SatSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [focusToken, setFocusToken] = useState(0);
  const [globeBusy, setGlobeBusy] = useState(false);
  const [enabledGroups, setEnabledGroups] = useState<GroupId[]>([
    'stations',
    'visual',
    'weather',
    'gps-ops',
    'galileo',
    'science',
    'altro',
  ]);
  const [query, setQuery] = useState('');
  const catalogRef = useRef<CatalogState | null>(null);
  const snapshotsRef = useRef<SatSnapshot[]>([]);
  const openedFocusRef = useRef(false);
  const lastNetworkAtRef = useRef(0);
  const refreshInflightRef = useRef<Promise<void> | null>(null);
  catalogRef.current = catalog;
  snapshotsRef.current = snapshots;

  const applyCatalog = useCallback((next: CatalogState) => {
    const records = pinIssFirst(next.records);
    const pinned = { ...next, records };
    setCatalog(pinned);
    catalogRef.current = pinned;
    setSnapshots(propagateMany(records));
    setError(null);
    const iss = findIss(records);
    if (iss) void writeLastIss(iss);
  }, []);

  const selectIssIfNeeded = useCallback((records: TleRecord[]) => {
    const iss = findIss(records);
    setSelectedId((prev) => {
      if (prev != null) return prev;
      return iss ? iss.noradId : prev;
    });
    // First paint: ISS is selected but the globe only recenters when focusToken > 0.
    if (!openedFocusRef.current && iss) {
      openedFocusRef.current = true;
      setFocusToken((n) => n + 1);
    }
  }, []);

  const selectAndFocus = useCallback((noradId: number) => {
    setSelectedId(noradId);
    setFocusToken((n) => n + 1);
  }, []);

  const focusIss = useCallback(() => {
    const current = catalogRef.current?.records ?? [];
    const iss = findIss(current) ?? findIss(snapshotsRef.current) ?? ISS_FALLBACK_TLE;
    selectAndFocus(iss.noradId);
    if (!findIss(current)) {
      applyCatalog({
        records: pinIssFirst([ISS_FALLBACK_TLE, ...current]),
        fetchedAt: catalogRef.current?.fetchedAt ?? Date.now(),
        source: catalogRef.current?.source ?? ISS_FALLBACK_TLE.source,
        cached: true,
      });
    }
  }, [applyCatalog, selectAndFocus]);

  const refresh = useCallback(
    async (force = false) => {
      if (refreshInflightRef.current) return refreshInflightRef.current;

      const live = catalogRef.current;
      if (
        !force &&
        live &&
        !live.cached &&
        lastNetworkAtRef.current > 0 &&
        Date.now() - lastNetworkAtRef.current < LIVE_REVALIDATE_COOLDOWN_MS
      ) {
        return;
      }

      const run = (async () => {
        setLoading(true);
        setError(null);
        resetTleCircuit();
        try {
          if (!force) {
            const memory = catalogRef.current;
            if (!memory || memory.cached) {
              const cached = await readCache();
              if (cached) {
                applyCatalog(cached);
                selectIssIfNeeded(cached.records);
              }
            }
          }

          lastNetworkAtRef.current = Date.now();

          if (!findIss(catalogRef.current?.records ?? [])) {
            const preview = (await readLastIss()) ?? ISS_FALLBACK_TLE;
            applyCatalog(previewCatalog(preview, true));
            selectIssIfNeeded([preview]);
          }

          const liveIss = await fetchIssRecord();
          if (liveIss) {
            const rest = (catalogRef.current?.records ?? []).filter((r) => !isIssRecord(r));
            applyCatalog({
              records: pinIssFirst([liveIss, ...rest]),
              fetchedAt: Date.now(),
              source: liveIss.source,
              cached: false,
            });
            selectIssIfNeeded([liveIss]);
          }

          const seed = findIss(catalogRef.current?.records ?? []);
          const fresh = await loadPublicTle(seed ? [seed] : []);
          applyCatalog(fresh);
          selectIssIfNeeded(fresh.records);
          await writeCache(fresh);
        } catch (err) {
          const cached = catalogRef.current ?? (await readCache());
          if (cached) {
            applyCatalog(cached);
            selectIssIfNeeded(cached.records);
          } else {
            const lastIss = (await readLastIss()) ?? ISS_FALLBACK_TLE;
            applyCatalog(previewCatalog(lastIss, true));
            selectIssIfNeeded([lastIss]);
          }
          setError(userTleError(err));
        } finally {
          setLoading(false);
        }
      })();

      refreshInflightRef.current = run;
      try {
        await run;
      } finally {
        if (refreshInflightRef.current === run) refreshInflightRef.current = null;
      }
    },
    [applyCatalog, selectIssIfNeeded],
  );

  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') void refresh(false);
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [refresh]);

  useEffect(() => {
    if (!catalog?.records.length || globeBusy) return;
    const id = setInterval(() => {
      setSnapshots(propagateMany(catalog.records, new Date()));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [catalog, globeBusy]);

  const visible = useMemo(
    () => snapshots.filter((s) => enabledGroups.includes(s.group) || isIssRecord(s)),
    [snapshots, enabledGroups],
  );

  const selected = useMemo(
    () =>
      visible.find((s) => s.noradId === selectedId) ??
      snapshots.find((s) => s.noradId === selectedId) ??
      null,
    [visible, snapshots, selectedId],
  );

  const globeSnapshots = useMemo(() => {
    if (selected && !visible.some((s) => s.noradId === selected.noradId)) {
      return [selected, ...visible];
    }
    return visible;
  }, [visible, selected]);

  const selectedTrack = useMemo(() => {
    if (!selected) return [];
    return orbitTrack(selected);
  }, [selected?.noradId, selected?.line1, selected?.line2]);

  const toggleGroup = useCallback((g: GroupId) => {
    setEnabledGroups((prev) => {
      if (prev.includes(g)) {
        if (prev.length === 1) return prev;
        return prev.filter((x) => x !== g);
      }
      return [...prev, g];
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      snapshots: globeSnapshots,
      allSnapshots: snapshots,
      records: catalog?.records ?? [],
      loading,
      error,
      fetchedAt: catalog?.fetchedAt ?? null,
      source: catalog?.source ?? null,
      cached: catalog?.cached ?? false,
      selectedId,
      selected,
      selectedTrack,
      enabledGroups,
      query,
      setQuery,
      toggleGroup,
      select: setSelectedId,
      selectAndFocus,
      focusIss,
      focusToken,
      setGlobeBusy,
      refresh,
    }),
    [
      globeSnapshots,
      snapshots,
      catalog,
      loading,
      error,
      selectedId,
      selected,
      selectedTrack,
      enabledGroups,
      query,
      toggleGroup,
      selectAndFocus,
      focusIss,
      focusToken,
      refresh,
    ],
  );

  return <SatellitesContext.Provider value={value}>{children}</SatellitesContext.Provider>;
}

export function useSatellites(): Ctx {
  const ctx = useContext(SatellitesContext);
  if (!ctx) throw new Error('useSatellites richiede SatellitesProvider');
  return ctx;
}
