import type { Observer } from '../types';

export type CityFallback = {
  id: string;
  name: string;
  lat: number;
  lon: number;
};

/** Italian cities only used if GPS is denied or unavailable. */
export const FALLBACK_CITIES: CityFallback[] = [
  { id: 'roma', name: 'Roma', lat: 41.9028, lon: 12.4964 },
  { id: 'milano', name: 'Milano', lat: 45.4642, lon: 9.19 },
  { id: 'napoli', name: 'Napoli', lat: 40.8518, lon: 14.2681 },
  { id: 'palermo', name: 'Palermo', lat: 38.1157, lon: 13.3615 },
];

export function observerFromCity(city: CityFallback): Observer {
  return {
    lat: city.lat,
    lon: city.lon,
    altKm: 0.05,
    kind: 'city',
    label: city.name,
  };
}

export function observerFromCoords(
  lat: number,
  lon: number,
  altM: number | null,
  label: string,
): Observer {
  const altKm = altM != null && Number.isFinite(altM) ? Math.max(0, altM / 1000) : 0.05;
  return { lat, lon, altKm, kind: 'gps', label };
}

export function findCity(id: string): CityFallback | undefined {
  return FALLBACK_CITIES.find((c) => c.id === id);
}
