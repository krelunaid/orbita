#!/usr/bin/env node
/** Layout budget: globe and Sopra-di-te sheet both stay on-screen. */

const HEADER_ESTIMATE = 72;
const FILTER_ESTIMATE = 44;
const TAB_BAR_CONTENT = 52;
const GLOBE_MIN = 180;
const SHEET_MIN = 132;
const SHEET_MAX = 300;

function globeSheetBudget(windowHeight, topInset, bottomInset) {
  const tabBarH = TAB_BAR_CONTENT + bottomInset;
  const bodyH = Math.max(0, windowHeight - topInset - tabBarH);
  const usable = Math.max(0, bodyH - HEADER_ESTIMATE - FILTER_ESTIMATE);
  const sheetMax = Math.round(Math.min(SHEET_MAX, Math.max(SHEET_MIN, usable * 0.38)));
  const globeMin = Math.max(GLOBE_MIN, usable - sheetMax);
  return { bodyH, usable, sheetMax, globeMin };
}

function fitEarthRadius(width, height, scale, pad = 10) {
  const maxHalo = Math.max(20, Math.min(width, height) / 2 - pad);
  return (maxHalo / 1.16) * scale;
}

const phones = [
  { name: 'iPhone SE', h: 667, top: 20, bottom: 0 },
  { name: 'iPhone 13 mini', h: 812, top: 50, bottom: 34 },
  { name: 'iPhone 14', h: 844, top: 47, bottom: 34 },
  { name: 'iPhone 16 Pro', h: 874, top: 59, bottom: 34 },
];

for (const p of phones) {
  const b = globeSheetBudget(p.h, p.top, p.bottom);
  if (b.globeMin < GLOBE_MIN) {
    throw new Error(`${p.name}: globe min ${b.globeMin} < ${GLOBE_MIN}`);
  }
  if (b.sheetMax < SHEET_MIN) {
    throw new Error(`${p.name}: sheet max ${b.sheetMax} < ${SHEET_MIN}`);
  }
  const used = HEADER_ESTIMATE + FILTER_ESTIMATE + b.globeMin + b.sheetMax;
  if (used > b.bodyH + 1) {
    throw new Error(`${p.name}: chrome+globe+sheet ${used} > body ${b.bodyH}`);
  }
  const r = fitEarthRadius(390, b.globeMin, 1);
  const halo = r * 1.16;
  if (halo * 2 > b.globeMin - 8) {
    throw new Error(`${p.name}: earth halo ${halo * 2} clips in globe ${b.globeMin}`);
  }
  console.log(
    `${p.name}: body=${b.bodyH} globe≥${b.globeMin} sheet≤${b.sheetMax} earthR=${r.toFixed(1)}`,
  );
}

console.log('layout budgets ok');
