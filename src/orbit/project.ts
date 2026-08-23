const DEG = Math.PI / 180;
export const EARTH_KM = 6371;

export type Vec3 = { x: number; y: number; z: number };

export function latLonToVec(lat: number, lon: number, radius = 1): Vec3 {
  const φ = lat * DEG;
  const λ = lon * DEG;
  const c = Math.cos(φ);
  return {
    x: radius * c * Math.sin(λ),
    y: radius * Math.sin(φ),
    z: radius * c * Math.cos(λ),
  };
}

export function rotateVec(v: Vec3, rotLat: number, rotLon: number): Vec3 {
  const λ = -rotLon * DEG;
  const φ = -rotLat * DEG;
  const cosλ = Math.cos(λ);
  const sinλ = Math.sin(λ);
  const x1 = v.x * cosλ + v.z * sinλ;
  const z1 = -v.x * sinλ + v.z * cosλ;
  const cosφ = Math.cos(φ);
  const sinφ = Math.sin(φ);
  const y2 = v.y * cosφ - z1 * sinφ;
  const z2 = v.y * sinφ + z1 * cosφ;
  return { x: x1, y: y2, z: z2 };
}

export type Projected = {
  x: number;
  y: number;
  z: number;
  front: boolean;
};

export function projectGeo(
  lat: number,
  lon: number,
  altKm: number,
  rotLat: number,
  rotLon: number,
  earthPx: number,
  cx: number,
  cy: number,
): Projected {
  const r = earthPx * (1 + Math.max(altKm, 0) / EARTH_KM);
  const v = rotateVec(latLonToVec(lat, lon, r), rotLat, rotLon);
  return { x: cx + v.x, y: cy - v.y, z: v.z, front: v.z > 0 };
}

export function pathFromRing(
  ring: [number, number][],
  rotLat: number,
  rotLon: number,
  earthPx: number,
  cx: number,
  cy: number,
): string {
  let d = '';
  let drawing = false;
  for (const [lon, lat] of ring) {
    const p = projectGeo(lat, lon, 0, rotLat, rotLon, earthPx, cx, cy);
    if (!p.front) {
      drawing = false;
      continue;
    }
    d += drawing ? `L${p.x.toFixed(1)},${p.y.toFixed(1)}` : `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    drawing = true;
  }
  return d;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
