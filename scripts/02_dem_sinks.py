"""
02_dem_sinks.py — Topographic sink detection from DEM data.

Finds low-lying areas (sinks/depressions) near the corridor where CO2
could accumulate after a pipeline breach. CO2 is 1.5x heavier than air
and flows downhill, pooling in depressions.

Input:  DEM tiles (LIDAR 1m or OS Terrain 50)
        data/processed/corridor.geojson
Output: data/processed/topo_sinks.geojson
"""

import heapq
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
import rasterio
from rasterio.merge import merge
from rasterio.features import shapes
from shapely.geometry import box, shape
import geopandas as gpd

from scripts.utils import (
    load_geojson, save_geojson, to_bng, find_tif_files,
    PROCESSED_DIR, LIDAR_DIR, CRS_BNG,
)

SINK_DEPTH_THRESHOLD = 1.5  # meters — significant depression
MIN_SINK_AREA_M2 = 500      # ignore tiny puddles
DOWNSAMPLE_FACTOR = 10       # ~10m resolution for sink analysis
NODATA = -9999


def fill_sinks_priority_flood(dem, nodata=NODATA):
    """
    Priority-flood sink filling (Wang & Liu 2006 simplified).
    Much faster than the naive approach for large rasters.
    """
    rows, cols = dem.shape
    filled = dem.copy()
    visited = np.zeros((rows, cols), dtype=bool)

    # Priority queue: (elevation, row, col)
    heap = []

    # Seed with border cells
    for r in range(rows):
        for c in [0, cols - 1]:
            if dem[r, c] != nodata:
                heapq.heappush(heap, (dem[r, c], r, c))
                visited[r, c] = True
    for c in range(cols):
        for r in [0, rows - 1]:
            if not visited[r, c] and dem[r, c] != nodata:
                heapq.heappush(heap, (dem[r, c], r, c))
                visited[r, c] = True

    neighbors = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]

    while heap:
        elev, r, c = heapq.heappop(heap)
        for dr, dc in neighbors:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and not visited[nr, nc]:
                visited[nr, nc] = True
                if dem[nr, nc] != nodata:
                    new_elev = max(dem[nr, nc], elev)
                    filled[nr, nc] = new_elev
                    heapq.heappush(heap, (new_elev, nr, nc))

    return filled


def filter_tiles_by_intersection(tifs, clip_geom):
    """Return only the TIF files whose bounds intersect clip_geom."""
    relevant = []
    for tif in tifs:
        with rasterio.open(tif) as src:
            b = src.bounds
            tile_box = box(b.left, b.bottom, b.right, b.top)
            if tile_box.intersects(clip_geom):
                relevant.append(tif)
    return relevant


def main():
    print("=== 02_dem_sinks.py ===\n")

    # ── 1. Load corridor and create clip buffer ────────────────────────────
    corridor = load_geojson(PROCESSED_DIR / "corridor.geojson")
    corridor_bng = to_bng(corridor)

    # 2km buffer for DEM analysis
    clip_buffer = corridor_bng.copy()
    clip_buffer["geometry"] = clip_buffer.geometry.buffer(2000)
    clip_geom = clip_buffer.union_all()
    print(f"Analysis buffer area: {clip_geom.area / 1e6:.1f} km²")

    # ── 2. Find and merge DEM tiles ────────────────────────────────────────
    tifs = find_tif_files(LIDAR_DIR)
    print(f"Found {len(tifs)} LIDAR tiles")

    if not tifs:
        print("ERROR: No DEM tiles found. Cannot proceed.")
        return

    relevant_tifs = filter_tiles_by_intersection(tifs, clip_geom)
    print(f"  {len(relevant_tifs)} tiles intersect corridor buffer")

    if not relevant_tifs:
        print("ERROR: No DEM tiles cover the corridor area.")
        return

    print(f"  Downsampling {DOWNSAMPLE_FACTOR}x for sink analysis (~10m resolution)")

    datasets = [rasterio.open(tif) for tif in relevant_tifs]

    mosaic, mosaic_transform = merge(
        datasets,
        res=(DOWNSAMPLE_FACTOR, DOWNSAMPLE_FACTOR),
        nodata=NODATA,
    )
    mosaic_crs = datasets[0].crs

    for ds in datasets:
        ds.close()

    dem = mosaic[0]  # single band

    print(f"  Merged DEM: {dem.shape[1]}x{dem.shape[0]} pixels at ~{DOWNSAMPLE_FACTOR}m")
    valid = dem[dem != NODATA]
    print(f"  Elevation range: {valid.min():.1f}m to {valid.max():.1f}m")

    # ── 3. Fill sinks ─────────────────────────────────────────────────────
    print("\nFilling sinks (priority flood)...")
    filled = fill_sinks_priority_flood(dem, nodata=NODATA)

    # Sink depth = filled - original
    sink_depth = filled - dem
    sink_depth[dem == NODATA] = 0

    n_sink_cells = np.sum(sink_depth > SINK_DEPTH_THRESHOLD)
    print(f"  Cells with sink depth > {SINK_DEPTH_THRESHOLD}m: {n_sink_cells}")
    if n_sink_cells > 0:
        print(f"  Max sink depth: {sink_depth.max():.1f}m")

    # ── 4. Threshold and polygonize ────────────────────────────────────────
    print("\nPolygonizing sinks...")
    sink_mask = (sink_depth >= SINK_DEPTH_THRESHOLD).astype(np.uint8)

    # Pre-compute global max depth once (avoids recomputing per polygon)
    global_max_depth = float(sink_depth[sink_mask == 1].max()) if n_sink_cells > 0 else 0

    sink_polys = []
    for geom_dict, value in shapes(sink_mask, transform=mosaic_transform):
        if value == 1:
            poly = shape(geom_dict)
            if poly.area >= MIN_SINK_AREA_M2:
                sink_polys.append({
                    "geometry": poly,
                    "area_m2": round(poly.area, 0),
                    "max_depth_m": round(global_max_depth, 1),
                    "risk_note": "CO2 accumulation zone — heavier than air, pools in depressions",
                })

    print(f"  Found {len(sink_polys)} significant sinks (>{MIN_SINK_AREA_M2} m²)")

    if sink_polys:
        sinks_gdf = gpd.GeoDataFrame(sink_polys, crs=mosaic_crs)

        # Clip to corridor buffer
        sinks_in_buffer = gpd.sjoin(
            sinks_gdf,
            gpd.GeoDataFrame(geometry=[clip_geom], crs=CRS_BNG),
            predicate="intersects",
        )
        sinks_in_buffer = sinks_in_buffer.drop(columns=["index_right"], errors="ignore")
        print(f"  {len(sinks_in_buffer)} sinks within 2km of corridor")

        save_geojson(sinks_in_buffer, PROCESSED_DIR / "topo_sinks.geojson")
    else:
        empty = gpd.GeoDataFrame(
            columns=["area_m2", "max_depth_m", "risk_note", "geometry"],
            crs=CRS_BNG,
        )
        save_geojson(empty, PROCESSED_DIR / "topo_sinks.geojson")
        print("  No significant sinks found (this is unusual — check DEM coverage)")

    print("\n=== Done! ===")


if __name__ == "__main__":
    main()
