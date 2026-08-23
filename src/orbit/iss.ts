export const ISS_NORAD = 25544;

export function isIssRecord(rec: { noradId: number; name: string }): boolean {
  return rec.noradId === ISS_NORAD || /ISS\s*\(ZARYA\)/i.test(rec.name);
}

export function pinIssFirst<T extends { noradId: number; name: string }>(records: T[]): T[] {
  const iss = records.find(isIssRecord);
  if (!iss) return records;
  return [iss, ...records.filter((r) => r.noradId !== iss.noradId)];
}
