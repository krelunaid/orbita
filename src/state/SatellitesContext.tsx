import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { fetchIssRecord, loadPublicTle } from '../orbit/fetchTle';
import { isIssRecord } from '../orbit/iss';
import { orbitTrack, propagateMany } from '../orbit/propagate';
import type { CatalogState, GroupId, SatSnapshot, TleRecord } from '../types';

const CACHE_KEY = 'orbita.tle.v1';
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;
const TICK_MS = 1500;

type Ctx = {
  snapshots: SatSnapshot[];
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

export function SatellitesProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<CatalogState | null>(null);
  const [snapshots, setSnapshots] = useState<SatSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
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
  catalogRef.current = catalog;

  const applyCatalog = useCallback((next: CatalogState) => {
    setCatalog(next);
    catalogRef.current = next;
    setSnapshots(propagateMany(next.records));
    setError(null);
  }, []);

  const selectIssIfNeeded = useCallback((records: TleRecord[]) => {
    setSelectedId((prev) => {
      if (prev != null) return prev;
      const iss = records.find(isIssRecord);
      return iss ? iss.noradId : prev;
    });
  }, []);

  const refresh = useCallback(
    async (force = false) => {
      setLoading(true);
      setError(null);
      try {
        if (!force) {
          const cached = await readCache();
          if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
            applyCatalog(cached);
            selectIssIfNeeded(cached.records);
            setLoading(false);
            return;
          }
          if (cached) {
            applyCatalog(cached);
            selectIssIfNeeded(cached.records);
          }
        }

        const seed: TleRecord[] = [];
        if (!catalogRef.current?.records.length) {
          const iss = await fetchIssRecord();
          if (iss) {
            seed.push(iss);
            applyCatalog({
              records: [iss],
              fetchedAt: Date.now(),
              source: iss.source,
              cached: false,
            });
            selectIssIfNeeded([iss]);
          }
        }

        const fresh = await loadPublicTle(seed);
        applyCatalog(fresh);
        selectIssIfNeeded(fresh.records);
        await writeCache(fresh);
      } catch (err) {
        const cached = catalogRef.current ?? (await readCache());
        if (cached) {
          applyCatalog(cached);
          selectIssIfNeeded(cached.records);
        }
        setError(err instanceof Error ? err.message : 'Errore di rete');
      } finally {
        setLoading(false);
      }
    },
    [applyCatalog, selectIssIfNeeded],
  );

  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  useEffect(() => {
    if (!catalog?.records.length) return;
    const id = setInterval(() => {
      setSnapshots(propagateMany(catalog.records, new Date()));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [catalog]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return snapshots.filter((s) => {
      if (!enabledGroups.includes(s.group)) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || String(s.noradId).includes(q);
    });
  }, [snapshots, enabledGroups, query]);

  const selected = useMemo(
    () => visible.find((s) => s.noradId === selectedId) ?? snapshots.find((s) => s.noradId === selectedId) ?? null,
    [visible, snapshots, selectedId],
  );

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
      snapshots: visible,
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
      refresh,
    }),
    [
      visible,
      catalog,
      loading,
      error,
      selectedId,
      selected,
      selectedTrack,
      enabledGroups,
      query,
      toggleGroup,
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
