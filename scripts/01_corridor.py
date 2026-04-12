"""
01_corridor.py — Merge corridor polygons, generate buffers, AGI/BVS sites.

Input:  data/manual/corridor_aligned.geojson (from alignment tool)
Output: data/processed/corridor.geojson
        data/processed/corridor_500m.geojson
        data/processed/corridor_1km.geojson
        data/processed/agi_sites.geojson
        data/processed/bvs_sites.geojson
        data/processed/route_sections.geojson
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import geopandas as gpd
from shapely.geometry import Point
from scripts.utils import (
    load_corridor, save_geojson, to_bng,
    buffer_meters, PROCESSED_DIR, CRS_WGS84, CRS_BNG,
)

# ── AGI Sites (from EIA Scoping Report + Factsheet 3) ──────────────────────
# Approximate coordinates extracted from project documents.
# Types: coastal, capture, feeder, connection
AGI_SITES = [
    {
        "name": "Coastal AGI",
        "type": "coastal",
        "lng": -3.133, "lat": 53.405,
        "height_m": 50,
        "footprint": "300m x 180m",
        "description": "Compression, metering & handoff to Morecambe Net Zero offshore. 50m vent stack.",
        "staffed": True,
    },
    {
        "name": "Connection AGI 3",
        "type": "connection",
        "lng": -2.9909, "lat": 53.2828,
        "height_m": 15,
        "footprint": "100m x 100m",
        "description": "Future capture plant connection (west Ellesmere Port area)",
    },
    {
        "name": "Connection AGI 2",
        "type": "connection",
        "lng": -2.8871, "lat": 53.2469,
        "height_m": 15,
        "footprint": "100m x 100m",
        "description": "Future capture plant connection (south Ellesmere Port area)",
    },
    {
        "name": "Connection AGI 1",
        "type": "connection",
        "lng": -2.3835, "lat": 53.2077,
        "height_m": 15,
        "footprint": "100m x 100m",
        "description": "Future capture plant connection (Holmes Chapel area)",
    },
    {
        "name": "Central Feeder AGI",
        "type": "feeder",
        "lng": -2.1720, "lat": 53.2406,
        "height_m": 15,
        "footprint": "100m x 100m",
        "description": "Consolidates North Feeder + Cauldon pipelines (SW Macclesfield)",
    },
    {
        "name": "North Feeder AGI",
        "type": "feeder",
        "lng": -1.9027, "lat": 53.3066,
        "height_m": 15,
        "footprint": "100m x 100m",
        "description": "Consolidates Hope + Tunstead pipelines (S Chapel-en-le-Frith)",
    },
    {
        "name": "Hope AGI",
        "type": "capture",
        "lng": -1.7549, "lat": 53.3373,
        "height_m": 15,
        "footprint": "100m x 100m",
        "description": "Breedon Hope cement works capture facility",
    },
    {
        "name": "Tunstead AGI",
        "type": "capture",
        "lng": -1.8550, "lat": 53.2689,
        "height_m": 15,
        "footprint": "100m x 100m",
        "description": "Tarmac Tunstead + Buxton Lime capture facilities",
    },
    {
        "name": "Cauldon AGI",
        "type": "capture",
        "lng": -1.8711, "lat": 53.0425,
        "height_m": 15,
        "footprint": "100m x 100m",
        "description": "Holcim Cauldon cement works capture facility",
    },
]


def main():
    print("=== 01_corridor.py ===\n")

    # ── 1. Load and merge corridor polygons ────────────────────────────────
    corridor_gdf = load_corridor()
    print(f"Loaded {len(corridor_gdf)} corridor polygons")

    # Merge into single polygon (dissolve)
    corridor_gdf["dissolve_key"] = 1
    merged = corridor_gdf.dissolve(by="dissolve_key")
    merged = merged.reset_index(drop=True)
    merged["name"] = "Peak Cluster Pipeline Scoping Boundary"
    merged["source"] = "Peak_Cluster_AGOL FeatureServer (DEF1 Scoping Boundary v1.2)"
    merged = merged[["name", "source", "geometry"]]

    # Check for valid merge
    geom = merged.geometry.iloc[0]
    print(f"Merged corridor: {geom.geom_type}, area ~{geom.area:.4f} deg²")
    if geom.geom_type == "MultiPolygon":
        print(f"  {len(geom.geoms)} sub-polygons (sheets may not overlap)")

    save_geojson(merged, PROCESSED_DIR / "corridor.geojson")

    # ── 2. Generate buffers ────────────────────────────────────────────────
    print("\nGenerating buffers...")
    buf_500 = buffer_meters(merged, 500)
    buf_500["name"] = "Corridor 500m buffer"
    buf_500 = buf_500[["name", "geometry"]]
    save_geojson(buf_500, PROCESSED_DIR / "corridor_500m.geojson")

    buf_1k = buffer_meters(merged, 1000)
    buf_1k["name"] = "Corridor 1km buffer"
    buf_1k = buf_1k[["name", "geometry"]]
    save_geojson(buf_1k, PROCESSED_DIR / "corridor_1km.geojson")

    # ── 3. AGI sites ──────────────────────────────────────────────────────
    print("\nCreating AGI sites...")
    agi_records = []
    for site in AGI_SITES:
        agi_records.append({
            "name": site["name"],
            "type": site["type"],
            "height_m": site["height_m"],
            "footprint": site["footprint"],
            "description": site["description"],
            "staffed": site.get("staffed", False),
            "geometry": Point(site["lng"], site["lat"]),
        })

    agi_gdf = gpd.GeoDataFrame(agi_records, crs=CRS_WGS84)
    save_geojson(agi_gdf, PROCESSED_DIR / "agi_sites.geojson")

    # ── 4. BVS sites (estimated at ~16km intervals along corridor) ────────
    print("\nEstimating BVS positions...")
    # Extract corridor centerline by getting the centroid line
    # Use the merged corridor boundary, get its centerline approximation
    corridor_bng = to_bng(merged)
    geom_bng = corridor_bng.geometry.iloc[0]

    # For a polygon corridor, approximate centerline using the polygon's
    # exterior ring simplified heavily, then sample at intervals
    if geom_bng.geom_type == "MultiPolygon":
        # Take the largest polygon
        largest = max(geom_bng.geoms, key=lambda g: g.area)
    else:
        largest = geom_bng

    # Get the medial approximation: sample exterior at intervals
    exterior = largest.exterior
    total_len = exterior.length
    print(f"  Corridor perimeter: {total_len/1000:.1f} km")

    # Estimate pipeline length from corridor extent
    # The corridor is roughly 80km for the Wirral+Chester sections
    # BVS every ~16km → about 5 BVS for this section
    bvs_interval_m = 16000
    n_bvs = max(1, int(total_len / 2 / bvs_interval_m))  # perimeter/2 ≈ route length

    bvs_records = []
    for i in range(n_bvs):
        # Sample points along the corridor polygon centroid axis
        frac = (i + 0.5) / n_bvs
        pt_on_ring = exterior.interpolate(frac * total_len / 2)
        # Push toward centroid to get approximate centerline
        cx, cy = largest.centroid.x, largest.centroid.y
        bvs_x = pt_on_ring.x * 0.7 + cx * 0.3
        bvs_y = pt_on_ring.y * 0.7 + cy * 0.3

        bvs_pt_bng = Point(bvs_x, bvs_y)
        # Snap to nearest point on corridor if outside
        if not largest.contains(bvs_pt_bng):
            bvs_pt_bng = largest.exterior.interpolate(
                largest.exterior.project(bvs_pt_bng)
            )

        bvs_records.append({
            "name": f"BVS {i + 1}",
            "type": "block_valve_station",
            "footprint": "50m x 50m",
            "height_m": 3,
            "geometry": bvs_pt_bng,
        })

    bvs_gdf = gpd.GeoDataFrame(bvs_records, crs=CRS_BNG)
    save_geojson(bvs_gdf, PROCESSED_DIR / "bvs_sites.geojson")

    # ── 5. Route sections (from official ArcGIS data) ───────────────────
    print("\nLoading official route sections...")
    from scripts.utils import MANUAL_DIR
    sections_path = MANUAL_DIR / "route_sections_official.geojson"
    if sections_path.exists():
        sections_gdf = gpd.read_file(sections_path)
        # Normalize column names
        if "Name" in sections_gdf.columns:
            sections_gdf = sections_gdf.rename(columns={"Name": "name"})
        # Add section number from name
        for i, row in sections_gdf.iterrows():
            name = row.get("name", "")
            # Extract section number from "Section N: ..."
            parts = name.split(":")
            if parts[0].strip().startswith("Section"):
                try:
                    num = int(parts[0].strip().split()[-1])
                    sections_gdf.at[i, "section"] = num
                except ValueError:
                    sections_gdf.at[i, "section"] = i + 1
            else:
                sections_gdf.at[i, "section"] = i + 1
        save_geojson(sections_gdf, PROCESSED_DIR / "route_sections.geojson")
    else:
        print("  WARNING: No official sections file, falling back to corridor polygons")
        sections = []
        for i, (_, row) in enumerate(corridor_gdf.iterrows()):
            sections.append({
                "name": row.get("name", f"Section {i+1}"),
                "section": i + 1,
                "geometry": row.geometry,
            })
        sections_gdf = gpd.GeoDataFrame(sections, crs=CRS_WGS84)
        save_geojson(sections_gdf, PROCESSED_DIR / "route_sections.geojson")

    print("\n=== Done! ===")


if __name__ == "__main__":
    main()
