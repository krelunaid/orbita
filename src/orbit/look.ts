import * as satellite from 'satellite.js';

import type { LookAngles, Observer, SatSnapshot } from '../types';

export const HIGH_ELEV_DEG = 30;
export const OVERHEAD_MAX = 8;
export const BEST_FEW = 5;

export const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'] as const;
export type Cardinal = (typeof CARDINALS)[number];

export type { LookAngles };

export type OverheadPick = {
  items: SatSnapshot[];
  mode: 'high' | 'best' | 'empty';
};

function toObserverGd(observer: Pick<Observer, 'lat' | 'lon' | 'altKm'>) {
  return {
    latitude: satellite.degreesToRadians(observer.lat),
    longitude: satellite.degreesToRadians(observer.lon),
    height: observer.altKm,
  };
}

function fromSatelliteLook(look: { azimuth: number; elevation: number; rangeSat: number }): LookAngles | null {
  const elevationDeg = satellite.radiansToDegrees(look.elevation);
  const azimuthDeg = ((satellite.radiansToDegrees(look.azimuth) % 360) + 360) % 360;
  if (!Number.isFinite(elevationDeg) || !Number.isFinite(azimuthDeg) || !Number.isFinite(look.rangeSat)) {
    return null;
  }
  return { elevationDeg, azimuthDeg, rangeKm: look.rangeSat };
}

/** Topocentric look angles from an SGP4 ECI position (same pass as propagate). */
export function lookFromEci(
  positionEci: { x: number; y: number; z: number },
  gmst: number,
  observer: Pick<Observer, 'lat' | 'lon' | 'altKm'>,
): LookAngles | null {
  try {
    const positionEcf = satellite.eciToEcf(positionEci, gmst);
    return fromSatelliteLook(satellite.ecfToLookAngles(toObserverGd(observer), positionEcf));
  } catch {
    return null;
  }
}

/** Look angles from two geodetic points (tests / fallback). Uses satellite.js ECEF. */
export function lookFromGeodetic(
  sat: { lat: number; lon: number; altKm: number },
  observer: Pick<Observer, 'lat' | 'lon' | 'altKm'>,
): LookAngles | null {
  try {
    const satEcf = satellite.geodeticToEcf({
      latitude: satellite.degreesToRadians(sat.lat),
      longitude: satellite.degreesToRadians(sat.lon),
      height: sat.altKm,
    });
    return fromSatelliteLook(satellite.ecfToLookAngles(toObserverGd(observer), satEcf));
  } catch {
    return null;
  }
}

export function compassFromAzimuth(azDeg: number): Cardinal {
  const wrapped = ((azDeg % 360) + 360) % 360;
  return CARDINALS[Math.round(wrapped / 45) % 8];
}

export function pickOverhead(snapshots: SatSnapshot[]): OverheadPick {
  const ranked = snapshots
    .filter((s) => s.valid && s.look && Number.isFinite(s.look.elevationDeg))
    .sort((a, b) => (b.look?.elevationDeg ?? -90) - (a.look?.elevationDeg ?? -90));

  const high = ranked.filter((s) => (s.look?.elevationDeg ?? -90) >= HIGH_ELEV_DEG);
  if (high.length > 0) return { items: high.slice(0, OVERHEAD_MAX), mode: 'high' };

  const aboveHorizon = ranked.filter((s) => (s.look?.elevationDeg ?? -90) > 0);
  if (aboveHorizon.length > 0) return { items: aboveHorizon.slice(0, BEST_FEW), mode: 'best' };

  return { items: [], mode: 'empty' };
}
