"""
05_constraints.py — Download and clip environmental designations.

Downloads SSSI, SAC, SPA, Ramsar, Ancient Woodland, National Park boundaries
from Natural England Open Data. Clips to corridor buffer and identifies
conflicts (designations that intersect the scoping boundary).

Input:  data/processed/corridor.geojson
Output: data/processed/env_sssi.geojson
        data/processed/env_sac.geojson
        data/processed/env_ancient_woodland.geojson
        data/processed/env_national_park.geojson
        data/processed/env_conflicts.geojson
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import geopandas as gpd
import requests
import json
from shapely.geometry import shape

from scripts.utils import (
    load_geojson, save_geojson, to_bng, clip_to_corridor,
    PROCESSED_DIR, RAW_DIR, CRS_WGS84, CRS_BNG,
)

NE_DIR = RAW_DIR / "natural_england"
NE_DIR.mkdir(parents=True, exist_ok=True)

# Natural England ArcGIS REST API endpoints
NE_DATASETS = {
    "sssi": {
        "name": "Sites of Special Scientific Interest",
        "url": "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/SSSI_England/FeatureServer/0/query",
        "name_field": "SSSI_NAME",
    },
    "sac": {
        "name": "Special Areas of Conservation",
        "url": "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Special_Areas_of_Conservation_England/FeatureServer/0/query",
        "name_field": "SAC_NAME",
    },
    "ancient_woodland": {
        "name": "Ancient Woodland",
        "url": "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/Ancient_Woodland_England/FeatureServer/0/query",
        "name_field": "NAME",
    },
    "national_park": {
        "name": "National Parks",
        "url": "https://services.arcgis.com/JJzESW51TqeY9uat/arcgis/rest/services/National_Parks_England/FeatureServer/0/query",
        "name_field": "NAME",
    },
}

BBOX_BUFFER_DEG = 0.07  # ~5km at UK latitudes
MIN_OVERLAP_HA = 0.01   # > 100 m²


def download_features_in_bbox(url, bbox_wgs84, name_field, max_features=2000):
    """
    Query ArcGIS REST API for features within a bounding box.
    Returns a GeoDataFrame.
    """
    xmin, ymin, xmax, ymax = bbox_wgs84

    params = {
        "where": "1=1",
        "geometry": json.dumps({"xmin": xmin, "ymin": ymin, "xmax": xmax, "ymax": ymax, "spatialReference": {"wkid": 4326}}),
        "geometryType": "esriGeometryEnvelope",
        "inSR": "4326",
        "outSR": "4326",
        "spatialRel": "esriSpatialRelIntersects",
        "outFields": name_field,
        "f": "geojson",
        "resultRecordCount": max_features,
    }

    print(f"    Querying API...")
    resp = requests.get(url, params=params, timeout=60)
    resp.raise_for_status()
    data = resp.json()

    if "features" not in data or len(data["features"]) == 0:
        return gpd.GeoDataFrame(columns=["name", "geometry"], crs=CRS_WGS84)

    features = data["features"]
    print(f"    Got {len(features)} features")

    records = []
    for f in features:
        geom = shape(f["geometry"])
        props = f.get("properties", {})
        name = props.get(name_field, "Unknown")
        records.append({"name": name, "geometry": geom})

    return gpd.GeoDataFrame(records, crs=CRS_WGS84)


def find_conflicts(clipped_bng, corridor_union, key, dataset_name):
    """Find designations that directly intersect the corridor, returning conflict records."""
    conflicts = []
    intersections = clipped_bng.intersection(corridor_union)
    overlap_ha = intersections.area / 10000

    mask = overlap_ha > MIN_OVERLAP_HA
    for idx in clipped_bng[mask].index:
        row = clipped_bng.loc[idx]
        conflicts.append({
            "name": row.get("name", "Unknown"),
            "designation": key,
            "designation_name": dataset_name,
            "overlap_ha": round(overlap_ha[idx], 2),
            "risk_note": f"Scoping boundary intersects {dataset_name}",
            "geometry": row.geometry,
        })
    return conflicts


def main():
    print("=== 05_constraints.py ===\n")

    # ── 1. Load corridor and compute bbox ──────────────────────────────────
    corridor = load_geojson(PROCESSED_DIR / "corridor.geojson")
    bounds = corridor.total_bounds  # [xmin, ymin, xmax, ymax]

    bbox = [
        bounds[0] - BBOX_BUFFER_DEG,
        bounds[1] - BBOX_BUFFER_DEG,
        bounds[2] + BBOX_BUFFER_DEG,
        bounds[3] + BBOX_BUFFER_DEG,
    ]
    print(f"Search bbox: {bbox[0]:.3f},{bbox[1]:.3f} to {bbox[2]:.3f},{bbox[3]:.3f}")

    # Pre-compute corridor in BNG once (was recomputed every loop iteration)
    corridor_bng = to_bng(corridor)
    corridor_union = corridor_bng.union_all()

    all_conflicts = []

    # ── 2. Download each dataset ───────────────────────────────────────────
    for key, dataset in NE_DATASETS.items():
        print(f"\n--- {dataset['name']} ({key}) ---")

        cache_path = NE_DIR / f"{key}.geojson"

        if cache_path.exists():
            print(f"  Loading from cache: {cache_path.name}")
            gdf = load_geojson(cache_path)
        else:
            try:
                gdf = download_features_in_bbox(
                    dataset["url"], bbox, dataset["name_field"]
                )
                if len(gdf) > 0:
                    gdf.to_file(cache_path, driver="GeoJSON")
                    print(f"  Cached to {cache_path.name}")
            except Exception as e:
                print(f"  ERROR downloading: {e}")
                gdf = gpd.GeoDataFrame(columns=["name", "geometry"], crs=CRS_WGS84)

        if len(gdf) == 0:
            print(f"  No features found")
            save_geojson(gdf, PROCESSED_DIR / f"env_{key}.geojson")
            continue

        clipped = clip_to_corridor(gdf, corridor, buffer_km=5.0)
        print(f"  {len(clipped)} features within 5km of corridor")

        clipped["designation"] = key
        clipped["designation_name"] = dataset["name"]
        save_geojson(clipped, PROCESSED_DIR / f"env_{key}.geojson")

        # Check for direct corridor intersections (vectorized)
        clipped_bng = to_bng(clipped)
        conflicts = find_conflicts(clipped_bng, corridor_union, key, dataset["name"])
        all_conflicts.extend(conflicts)

    # ── 3. Save conflicts ─────────────────────────────────────────────────
    print(f"\n--- Corridor Conflicts ---")
    if all_conflicts:
        conflicts_gdf = gpd.GeoDataFrame(all_conflicts, crs=CRS_BNG)
        print(f"  {len(conflicts_gdf)} designations intersect the corridor:")
        for _, row in conflicts_gdf.iterrows():
            print(f"    {row['designation']}: {row['name']} ({row['overlap_ha']} ha)")
        save_geojson(conflicts_gdf, PROCESSED_DIR / "env_conflicts.geojson")
    else:
        empty = gpd.GeoDataFrame(
            columns=["name", "designation", "overlap_ha", "geometry"], crs=CRS_BNG
        )
        save_geojson(empty, PROCESSED_DIR / "env_conflicts.geojson")
        print("  No direct intersections found")

    print("\n=== Done! ===")


if __name__ == "__main__":
    main()
