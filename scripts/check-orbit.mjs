#!/usr/bin/env node
/** Smoke test: fetch public TLE with the same UA/ISS-first policy as the app. */
import * as satellite from 'satellite.js';

const GROUPS = ['stations', 'visual', 'weather', 'gps-ops', 'galileo', 'science'];
const UA = 'Orbita/1.0 (it.kreluna.orbita; check-orbit; https://github.com/krelunaid/orbita)';
const ISS_NORAD = 25544;

function parse3le(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    if (i + 2 < lines.length && lines[i + 1].startsWith('1 ') && lines[i + 2].startsWith('2 ')) {
      const name = lines[i].replace(/^0\s+/, '');
      if (!/STARLINK/i.test(name) && !/ONEWEB/i.test(name)) {
        const norad = Number.parseInt(lines[i + 1].slice(2, 7).trim(), 10);
        out.push({ name, noradId: norad, line1: lines[i + 1], line2: lines[i + 2] });
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

async function readText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/plain, application/json' } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

async function fetchIss() {
  const urls = [
    `https://celestrak.org/NORAD/elements/gp.php?CATNR=${ISS_NORAD}&FORMAT=tle`,
    'https://db.satnogs.org/api/tle/?format=3le&norad_cat_id=25544',
    `https://tle.ivanstanojevic.me/api/tle/${ISS_NORAD}`,
  ];
  for (const url of urls) {
    try {
      const text = await readText(url);
      if (url.includes('ivanstanojevic')) {
        const data = JSON.parse(text);
        if (data.line1 && data.line2 && data.name) {
          return { name: data.name, noradId: Number(data.satelliteId), line1: data.line1, line2: data.line2 };
        }
      } else {
        const iss = parse3le(text).find((r) => r.noradId === ISS_NORAD || /ISS\s*\(ZARYA\)/i.test(r.name));
        if (iss) return iss;
      }
    } catch (err) {
      console.warn('ISS source failed', url, err instanceof Error ? err.message : err);
    }
  }
  throw new Error('ISS missing from every public source');
}

async function fetchGroup(group) {
  const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`;
  return parse3le(await readText(url));
}

const iss = await fetchIss();
const pos = propagate(iss);
if (!Number.isFinite(pos.lat) || !Number.isFinite(pos.lon) || pos.altKm < 200 || pos.altKm > 800) {
  throw new Error(`ISS implausible: ${JSON.stringify(pos)}`);
}
console.log('ISS now', pos);

const collected = [iss];
for (const g of GROUPS) {
  const rows = await fetchGroup(g);
  console.log(`${g}: ${rows.length} TLE`);
  collected.push(...rows);
}

const starlink = collected.filter((r) => /STARLINK/i.test(r.name));
if (starlink.length !== 0) throw new Error('Starlink should have been filtered');

const pinned = [iss, ...collected.filter((r) => r.noradId !== iss.noradId)];
if (pinned[0].noradId !== ISS_NORAD) throw new Error('ISS must be first in catalog');

const cap = 280;
const sliced = pinned.slice(0, cap);
if (sliced.length > cap) throw new Error('cap failed');
if (!sliced.some((r) => r.noradId === ISS_NORAD)) throw new Error('ISS dropped by cap');
console.log(`ok ${collected.length} objects, cap demo ${sliced.length}, ISS pinned`);
