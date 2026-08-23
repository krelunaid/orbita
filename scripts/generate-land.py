#!/usr/bin/env python3
"""Simplify Natural Earth 110m land into a compact TypeScript module."""

from __future__ import annotations

import json
import math
from pathlib import Path

SRC = Path("/tmp/ne_110m_land.geojson")
OUT = Path(__file__).resolve().parents[1] / "src" / "data" / "landmasses.ts"


def perp_dist(p, a, b) -> float:
    (x, y), (x1, y1), (x2, y2) = p, a, b
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(x - x1, y - y1)
    t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))


def rdp(points: list[list[float]], epsilon: float) -> list[list[float]]:
    if len(points) < 3:
        return points
    start, end = points[0], points[-1]
    idx, max_d = 0, 0.0
    for i in range(1, len(points) - 1):
        d = perp_dist(points[i], start, end)
        if d > max_d:
            idx, max_d = i, d
    if max_d > epsilon:
        left = rdp(points[: idx + 1], epsilon)
        right = rdp(points[idx:], epsilon)
        return left[:-1] + right
    return [start, end]


def rings_from_geom(geom) -> list[list[list[float]]]:
    gtype = geom["type"]
    coords = geom["coordinates"]
    if gtype == "Polygon":
        return [coords[0]]
    if gtype == "MultiPolygon":
        return [poly[0] for poly in coords]
    return []


def main() -> None:
    data = json.loads(SRC.read_text())
    rings: list[list[list[float]]] = []
    for feat in data["features"]:
        for ring in rings_from_geom(feat["geometry"]):
            simplified = rdp(ring, 0.55)
            if len(simplified) < 6:
                continue
            # Drop tiny islands (bbox diagonal in degrees)
            lons = [p[0] for p in simplified]
            lats = [p[1] for p in simplified]
            if (max(lons) - min(lons)) ** 2 + (max(lats) - min(lats)) ** 2 < 4:
                continue
            rounded = [[round(p[0], 2), round(p[1], 2)] for p in simplified]
            rings.append(rounded)

    rings.sort(key=len, reverse=True)
    # Keep the largest landmasses; enough for a readable globe.
    rings = rings[:48]
    total = sum(len(r) for r in rings)

    lines = [
        "/** Simplified land rings [lon, lat][] from Natural Earth 110m (public domain). */",
        "export const LAND_RINGS: [number, number][][] = " + json.dumps(rings, separators=(",", ":")) + ";",
        f"export const LAND_POINT_COUNT = {total};",
        "",
    ]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines))
    print(f"wrote {OUT} rings={len(rings)} points={total}")


if __name__ == "__main__":
    main()
