export const GROUP_IDS = [
  'stations',
  'visual',
  'weather',
  'gps-ops',
  'galileo',
  'science',
] as const;

export type CelestrakGroup = (typeof GROUP_IDS)[number];
export type GroupId = CelestrakGroup | 'altro';

export type TleSource = 'celestrak' | 'satnogs' | 'ivanstanojevic';

export type TleRecord = {
  noradId: number;
  name: string;
  line1: string;
  line2: string;
  group: GroupId;
  source: TleSource;
};

export type ObserverKind = 'gps' | 'city';

export type Observer = {
  lat: number;
  lon: number;
  altKm: number;
  kind: ObserverKind;
  label: string;
};

export type LookAngles = {
  elevationDeg: number;
  azimuthDeg: number;
  rangeKm: number;
};

export type SatSnapshot = TleRecord & {
  lat: number;
  lon: number;
  altKm: number;
  velocityKmS: number;
  periodMin: number;
  inclinationDeg: number;
  valid: boolean;
  look?: LookAngles;
};

export type CatalogState = {
  records: TleRecord[];
  fetchedAt: number;
  source: TleSource;
  cached: boolean;
};
