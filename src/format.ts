export function fmtLat(lat: number): string {
  return `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`;
}

export function fmtLon(lon: number): string {
  return `${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`;
}

export function fmtAlt(km: number): string {
  if (km >= 10_000) return `${(km / 1000).toFixed(1)} Mm`;
  return `${Math.round(km)} km`;
}

export function fmtVel(kms: number): string {
  return `${kms.toFixed(2)} km/s`;
}

export function fmtPeriod(min: number): string {
  if (min >= 120) return `${(min / 60).toFixed(1)} h`;
  return `${min.toFixed(1)} min`;
}

export function fmtWhen(ts: number | null): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('it-IT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}
