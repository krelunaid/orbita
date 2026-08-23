#!/usr/bin/env node
/** Smoke test: fetch public TLE, parse, propagate ISS-class objects to now. */
import * as satellite from 'satellite.js';

const GROUPS = ['stations', 'visual', 'weather', 'gps-ops', 'galileo', 'science'];
const UA = 'Orbita/1.0 (it.kreluna.orbita; check-orbit; https://github.com/krelunaid/orbita)';

function parse3le(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    if (i + 2 < lines.length && lines[i + 1].startsWith('1 ') && lines[i + 2].startsWith('2 ')) {
      const name = lines[i].replace(/^0\s+/, '');
      if (!/STARLINK/i.test(name)) {
        out.push({ name, line1: lines[i + 1], line2: lines[i + 2] });
      }
      i += 3;
    } else {
      i += 1;
    }
  }
  return out;
}

function propagate(rec) {
  const satrec = satellite.twoline2satrec(rec.line1, rec.line2);
  const now = new Date();
  const pv = satellite.propagate(satrec, now);
  if (!pv.position) throw new Error(`no position for ${rec.name}`);
  const gd = satellite.eciToGeodetic(pv.position, satellite.gstime(now));
  return {
    name: rec.name,
    lat: satellite.degreesLat(gd.latitude),
    lon: satellite.degreesLong(gd.longitude),
    altKm: gd.height,
  };
}

async function fetchGroup(group) {
  const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/plain' } });
  if (!res.ok) throw new Error(`${group} ${res.status}`);
  return parse3le(await res.text());
}

const collected = [];
for (const g of GROUPS) {
  const rows = await fetchGroup(g);
  console.log(`${g}: ${rows.length} TLE`);
  collected.push(...rows);
}

const starlink = collected.filter((r) => /STARLINK/i.test(r.name));
if (starlink.length !== 0) throw new Error('Starlink should have been filtered');

const iss = collected.find((r) => /ISS/i.test(r.name));
if (!iss) throw new Error('ISS missing from stations');
const pos = propagate(iss);
if (!Number.isFinite(pos.lat) || !Number.isFinite(pos.lon) || pos.altKm < 200 || pos.altKm > 800) {
  throw new Error(`ISS implausible: ${JSON.stringify(pos)}`);
}
console.log('ISS now', pos);

const cap = 280;
const sliced = collected.slice(0, cap);
if (sliced.length > cap) throw new Error('cap failed');
console.log(`ok ${collected.length} unique-ish objects, cap demo ${sliced.length}`);
