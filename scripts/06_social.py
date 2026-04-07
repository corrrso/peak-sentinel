"""
06_social.py — Download and process social receptor data.

Downloads schools from GOV.UK, geocodes them, clips to corridor buffer.
Also downloads ONS postcode centroids for the corridor area.

Input:  data/processed/corridor.geojson
Output: data/processed/schools.geojson
        data/processed/postcodes.geojson
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import geopandas as gpd
import pandas as pd
import requests
from shapely.geometry import Point

from scripts.utils import (
    load_geojson, save_geojson, to_bng, find_column,
    PROCESSED_DIR, RAW_DIR, CRS_WGS84, CRS_BNG,
)

SOCIAL_DIR = RAW_DIR / "social"
SOCIAL_DIR.mkdir(parents=True, exist_ok=True)

# Grid spacing for postcodes.io queries (~500m at UK latitudes)
POSTCODE_LAT_STEP = 0.0045
POSTCODE_LON_STEP = 0.0075
POSTCODE_SEARCH_RADIUS_M = 1000


def download_schools():
    """Download schools data from GOV.UK edubase extract."""
    # Check for any edubase CSV in the social dir
    for f in sorted(SOCIAL_DIR.glob("edubase*.csv"), reverse=True):
        print(f"  Loading cached schools data: {f.name}")
        return pd.read_csv(f, encoding="latin-1", low_memory=False)

    cache = SOCIAL_DIR / "schools.csv"
    if cache.exists():
        print("  Loading cached schools data")
        return pd.read_csv(cache, encoding="latin-1", low_memory=False)

    print("  Downloading schools data from GOV.UK...")
    url = "https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/edubasealldata.csv"
    resp = requests.get(url, timeout=120)
    resp.raise_for_status()

    with open(cache, "wb") as f:
        f.write(resp.content)

    return pd.read_csv(cache, encoding="latin-1", low_memory=False)


def process_schools(schools_df, buffer_2km, corridor_union):
    """Filter schools to corridor buffer and compute distances."""
    easting_col = find_column(schools_df, "easting")
    northing_col = find_column(schools_df, "northing")
    name_col = find_column(schools_df, "establishmentname")
    status_col = find_column(schools_df, "statusname", "establishmentstatus (name)")
    type_col = find_column(schools_df, "typeofestablishment")
    phase_col = find_column(schools_df, "phaseofeducation")

    if not easting_col or not northing_col:
        print(f"  ERROR: Cannot find easting/northing columns")
        print(f"  Available columns: {list(schools_df.columns[:20])}")
        return gpd.GeoDataFrame(columns=["name", "geometry"], crs=CRS_WGS84)

    # Filter to rows with valid coordinates
    valid = schools_df[
        schools_df[easting_col].notna()
        & schools_df[northing_col].notna()
        & (schools_df[easting_col] > 0)
    ].copy()

    if status_col:
        valid = valid[valid[status_col].str.contains("Open", case=False, na=False)]

    print(f"  Open schools with coordinates: {len(valid)}")

    # Vectorized geometry creation
    geometry = gpd.points_from_xy(
        valid[easting_col].astype(float),
        valid[northing_col].astype(float),
    )
    schools_gdf = gpd.GeoDataFrame(valid, geometry=geometry, crs=CRS_BNG)

    # Filter to within 2km of corridor
    nearby = schools_gdf[schools_gdf.within(buffer_2km)].copy()
    print(f"  Schools within 2km of corridor: {len(nearby)}")

    # Vectorized distance computation
    nearby["distance_m"] = nearby.geometry.distance(corridor_union).round(0)

    # Build clean output
    out = gpd.GeoDataFrame({
        "name": nearby[name_col] if name_col else "Unknown",
        "type": nearby[type_col] if type_col else "",
        "phase": nearby[phase_col] if phase_col else "",
        "distance_m": nearby["distance_m"],
        "geometry": nearby.geometry,
    }, crs=CRS_BNG)

    return out


def main():
    print("=== 06_social.py ===\n")

    # ── 1. Load corridor ──────────────────────────────────────────────────
    corridor = load_geojson(PROCESSED_DIR / "corridor.geojson")
    corridor_bng = to_bng(corridor)
    corridor_union = corridor_bng.union_all()

    buffer_2km = corridor_union.buffer(2000)

    # ── 2. Schools ────────────────────────────────────────────────────────
    print("--- Schools ---")
    try:
        schools_df = download_schools()
        print(f"  Total schools in England: {len(schools_df)}")
        out = process_schools(schools_df, buffer_2km, corridor_union)
        save_geojson(out, PROCESSED_DIR / "schools.geojson")

    except Exception as e:
        print(f"  ERROR: {e}")
        save_geojson(
            gpd.GeoDataFrame(columns=["name", "geometry"], crs=CRS_WGS84),
            PROCESSED_DIR / "schools.geojson",
        )

    # ── 3. Postcode centroids ─────────────────────────────────────────────
    print("\n--- Postcode Centroids ---")
    postcode_cache = SOCIAL_DIR / "postcodes_corridor.csv"

    if postcode_cache.exists():
        print("  Loading cached postcode data")
        pc_df = pd.read_csv(postcode_cache)
    else:
        print("  Generating postcode centroids from corridor area...")

        bounds = corridor.total_bounds  # xmin, ymin, xmax, ymax
        print(f"  Corridor bounds: {bounds[0]:.3f},{bounds[1]:.3f} to {bounds[2]:.3f},{bounds[3]:.3f}")

        # Count total queries for progress reporting
        total_queries = 0
        lat = bounds[1]
        while lat <= bounds[3]:
            lon = bounds[0]
            while lon <= bounds[2]:
                total_queries += 1
                lon += POSTCODE_LON_STEP
            lat += POSTCODE_LAT_STEP

        print(f"  Will query ~{total_queries} grid points via postcodes.io...")

        pc_records = []
        lat = bounds[1]
        done = 0
        while lat <= bounds[3]:
            lon = bounds[0]
            while lon <= bounds[2]:
                try:
                    resp = requests.get(
                        "https://api.postcodes.io/postcodes",
                        params={
                            "lon": round(lon, 5),
                            "lat": round(lat, 5),
                            "limit": 10,
                            "radius": POSTCODE_SEARCH_RADIUS_M,
                        },
                        timeout=10,
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        if data.get("result"):
                            for r in data["result"]:
                                pc_records.append({
                                    "postcode": r["postcode"],
                                    "lat": r["latitude"],
                                    "lon": r["longitude"],
                                    "easting": r.get("eastings", 0),
                                    "northing": r.get("northings", 0),
                                })
                except Exception:
                    pass
                done += 1
                if done % 100 == 0:
                    print(f"    {done}/{total_queries} queries, {len(pc_records)} postcodes found...")
                lon += POSTCODE_LON_STEP
            lat += POSTCODE_LAT_STEP

        pc_df = pd.DataFrame(pc_records).drop_duplicates(subset=["postcode"])
        print(f"  Total unique postcodes found: {len(pc_df)}")

        if len(pc_df) > 0:
            pc_df.to_csv(postcode_cache, index=False)
            print(f"  Cached to {postcode_cache.name}")

    if len(pc_df) > 0:
        valid_pc = pc_df[pc_df["easting"] > 0].copy()

        if len(valid_pc) > 0:
            # Vectorized geometry creation
            geometry = gpd.points_from_xy(
                valid_pc["easting"].astype(float),
                valid_pc["northing"].astype(float),
            )
            pc_gdf = gpd.GeoDataFrame(valid_pc, geometry=geometry, crs=CRS_BNG)
            nearby_pc = pc_gdf[pc_gdf.within(buffer_2km)].copy()

            # Vectorized distance computation
            nearby_pc["distance_m"] = nearby_pc.geometry.distance(corridor_union).round(0)

            out_pc = nearby_pc[["postcode", "lat", "lon", "distance_m", "geometry"]].copy()
            print(f"  Postcodes within 2km of corridor: {len(out_pc)}")
            save_geojson(out_pc, PROCESSED_DIR / "postcodes.geojson")
        else:
            print("  No valid postcode coordinates")
    else:
        print("  No postcodes found")

    print("\n=== Done! ===")


if __name__ == "__main__":
    main()
