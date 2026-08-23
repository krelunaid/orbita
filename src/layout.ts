/** iPhone chrome estimates for keeping the globe and bottom sheet both visible. */
export const HEADER_ESTIMATE = 72;
export const FILTER_ESTIMATE = 44;
export const TAB_BAR_CONTENT = 52;
export const GLOBE_MIN = 180;
export const SHEET_MIN = 132;
export const SHEET_MAX = 300;

export function globeSheetBudget(windowHeight: number, topInset: number, bottomInset: number) {
  const tabBarH = TAB_BAR_CONTENT + bottomInset;
  const bodyH = Math.max(0, windowHeight - topInset - tabBarH);
  const usable = Math.max(0, bodyH - HEADER_ESTIMATE - FILTER_ESTIMATE);
  const sheetMax = Math.round(Math.min(SHEET_MAX, Math.max(SHEET_MIN, usable * 0.38)));
  const globeMin = Math.max(GLOBE_MIN, usable - sheetMax);
  return { bodyH, usable, sheetMax, globeMin };
}

/** Earth radius so the disc + atmosphere fit inside the view at scale 1. */
export function fitEarthRadius(width: number, height: number, scale: number, pad = 10) {
  const maxHalo = Math.max(20, Math.min(width, height) / 2 - pad);
  return (maxHalo / 1.16) * scale;
}
