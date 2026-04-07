"""
03_viewshed.py — Viewshed analysis for AGI visibility.

Computes where the Coastal AGI's 50m vent stack would be visible from,
using line-of-sight analysis on the DEM. This is the most visually
impactful AGI — visible across much of the Wirral peninsula.

Input:  DEM tiles (LIDAR 1m, downsampled)
        data/processed/agi_sites.geojson
Output: data/processed/viewshed_coastal.geojson
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
import rasterio
from rasterio.merge import merge
from rasterio.features import shapes
from shapely.geometry import box, shape
import geopandas as gpd
from pyproj import Transformer

from scripts.utils import (
    load_geojson, save_geojson, find_tif_files,
    PROCESSED_DIR, LIDAR_DIR, CRS_BNG, CRS_WGS84,
)

VIEWSHED_RADIUS_M = 10000  # 10km analysis radius
TARGET_HEIGHT_M = 50       # Coastal AGI vent stack
OBSERVER_HEIGHT_M = 1.7    # Person standing
DOWNSAMPLE = 10            # ~10m resolution for speed
NODATA = -9999


def compute_viewshed(dem, target_row, target_col, target_height,
                     observer_height, max_dist_cells):
    """
    Binary viewshed: for each cell, check if line-of-sight from observer
    (at ground + observer_height) to target (at ground + target_height)
    is unobstructed.
    """
    rows, cols = dem.shape
    visible = np.zeros((rows, cols), dtype=np.uint8)

    target_elev = dem[target_row, target_col] + target_height

    for r in range(max(0, target_row - max_dist_cells),
                   min(rows, target_row + max_dist_cells + 1)):
        for c in range(max(0, target_col - max_dist_cells),
                       min(cols, target_col + max_dist_cells + 1)):
            dr = r - target_row
            dc = c - target_col
            dist_cells = (dr * dr + dc * dc) ** 0.5

            if dist_cells > max_dist_cells or dist_cells < 1:
                continue

            if dem[r, c] <= NODATA + 1000:  # nodata
                continue

            observer_elev = dem[r, c] + observer_height

            if is_visible(dem, target_row, target_col, target_elev,
                          r, c, observer_elev):
                visible[r, c] = 1

    return visible


def is_visible(dem, r1, c1, elev1, r2, c2, elev2):
    """Check if there's clear line-of-sight between two points."""
    dr = r2 - r1
    dc = c2 - c1
    steps = max(abs(dr), abs(dc))
    if steps == 0:
        return True

    for i in range(1, steps):
        frac = i / steps
        ri = int(r1 + dr * frac)
        ci = int(c1 + dc * frac)

        if ri < 0 or ri >= dem.shape[0] or ci < 0 or ci >= dem.shape[1]:
            continue

        terrain_elev = dem[ri, ci]
        if terrain_elev <= NODATA + 1000:  # nodata
            continue

        los_elev = elev1 + (elev2 - elev1) * frac

        if terrain_elev > los_elev:
            return False

    return True


def main():
    print("=== 03_viewshed.py ===\n")

    # ── 1. Load Coastal AGI position ───────────────────────────────────────
    agi = load_geojson(PROCESSED_DIR / "agi_sites.geojson")
    coastal = agi[agi["type"] == "coastal"].iloc[0]
    print(f"Coastal AGI: {coastal['name']}")
    print(f"  Position: {coastal.geometry.x:.4f}, {coastal.geometry.y:.4f}")
    print(f"  Stack height: {TARGET_HEIGHT_M}m")

    # Convert to BNG
    transformer = Transformer.from_crs(CRS_WGS84, CRS_BNG, always_xy=True)
    agi_x, agi_y = transformer.transform(coastal.geometry.x, coastal.geometry.y)
    print(f"  BNG: {agi_x:.0f}, {agi_y:.0f}")

    # ── 2. Load and merge DEM tiles near the AGI ──────────────────────────
    tifs = find_tif_files(LIDAR_DIR)

    analysis_box = box(
        agi_x - VIEWSHED_RADIUS_M, agi_y - VIEWSHED_RADIUS_M,
        agi_x + VIEWSHED_RADIUS_M, agi_y + VIEWSHED_RADIUS_M
    )

    relevant_tifs = []
    for tif in tifs:
        with rasterio.open(tif) as src:
            b = src.bounds
            tile_box = box(b.left, b.bottom, b.right, b.top)
            if tile_box.intersects(analysis_box):
                relevant_tifs.append(tif)

    print(f"\n{len(relevant_tifs)} LIDAR tiles within {VIEWSHED_RADIUS_M/1000:.0f}km of AGI")

    if not relevant_tifs:
        print("ERROR: No DEM tiles cover the Coastal AGI area.")
        return

    datasets = [rasterio.open(t) for t in relevant_tifs]
    mosaic, mosaic_transform = merge(datasets, res=(DOWNSAMPLE, DOWNSAMPLE), nodata=NODATA)
    mosaic_crs = datasets[0].crs
    for ds in datasets:
        ds.close()

    dem = mosaic[0]
    print(f"DEM: {dem.shape[1]}x{dem.shape[0]} at ~{DOWNSAMPLE}m resolution")
    valid = dem[dem > NODATA + 1000]
    print(f"Elevation: {valid.min():.1f}m to {valid.max():.1f}m")

    # ── 3. Find AGI position in the DEM grid ──────────────────────────────
    inv_transform = ~mosaic_transform
    agi_col, agi_row = [int(x) for x in inv_transform * (agi_x, agi_y)]
    print(f"AGI pixel position: row={agi_row}, col={agi_col}")

    if not (0 <= agi_row < dem.shape[0] and 0 <= agi_col < dem.shape[1]):
        print("ERROR: AGI position is outside DEM extent!")
        return

    agi_ground_elev = dem[agi_row, agi_col]
    print(f"AGI ground elevation: {agi_ground_elev:.1f}m")

    # ── 4. Compute viewshed ───────────────────────────────────────────────
    max_dist_cells = int(VIEWSHED_RADIUS_M / DOWNSAMPLE)
    print(f"\nComputing viewshed (radius={max_dist_cells} cells)...")
    print("  This may take a few minutes...")

    visible = compute_viewshed(
        dem, agi_row, agi_col,
        TARGET_HEIGHT_M, OBSERVER_HEIGHT_M,
        max_dist_cells
    )

    n_visible = np.sum(visible)
    area_km2 = n_visible * DOWNSAMPLE * DOWNSAMPLE / 1e6
    print(f"  Visible cells: {n_visible}")
    print(f"  Visible area: {area_km2:.1f} km²")

    # ── 5. Polygonize visible area ────────────────────────────────────────
    print("\nPolygonizing...")
    MIN_FRAGMENT_AREA_M2 = 1000
    polys = []
    for geom_dict, value in shapes(visible, transform=mosaic_transform):
        if value == 1:
            poly = shape(geom_dict)
            if poly.area > MIN_FRAGMENT_AREA_M2:
                polys.append({
                    "geometry": poly,
                    "area_km2": round(poly.area / 1e6, 2),
                    "target": "Coastal AGI (50m stack)",
                    "observer_height_m": OBSERVER_HEIGHT_M,
                    "analysis_radius_km": VIEWSHED_RADIUS_M / 1000,
                })

    print(f"  {len(polys)} viewshed polygons")

    if polys:
        vs_gdf = gpd.GeoDataFrame(polys, crs=mosaic_crs)
        save_geojson(vs_gdf, PROCESSED_DIR / "viewshed_coastal.geojson")
    else:
        empty = gpd.GeoDataFrame(
            columns=["area_km2", "target", "geometry"], crs=mosaic_crs
        )
        save_geojson(empty, PROCESSED_DIR / "viewshed_coastal.geojson")

    print("\n=== Done! ===")


if __name__ == "__main__":
    main()
