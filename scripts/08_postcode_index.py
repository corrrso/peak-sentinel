"""
08_postcode_index.py — Aggregate all processed data into a per-postcode
JSON index for frontend lookup.

Input:  data/processed/property_impact.geojson
        data/processed/agi_sites.geojson
        data/processed/schools.geojson
        data/processed/env_*.geojson
        data/processed/route_sections.geojson
Output: data/processed/postcode_index.json
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import json
import geopandas as gpd

from scripts.utils import (
    load_geojson, to_bng,
    PROCESSED_DIR,
)

NEARBY_RADIUS_M = 1000

# Scoping Opinion references per area
# From EIA-SCOPING-OPINION-ANALYSIS.md — key paragraphs by topic
SCOPING_REFS = {
    "co2_risk": ["3.14", "4.7", "4.8"],
    "topo_sink": ["3.14", "4.7"],
    "viewshed": ["3.23", "3.24", "4.15"],
    "property": ["4.22"],
    "env_sssi": ["3.5", "3.6"],
    "env_sac": ["3.5", "3.6", "3.7"],
    "env_ancient_woodland": ["3.9", "3.10"],
    "env_national_park": ["3.11"],
    "schools": ["4.9", "4.10"],
    "general": ["2.1", "2.2", "2.3"],
}


def classify_risk(distance_m, in_sink):
    """Classify risk level based on distance and topographic sink status."""
    if distance_m < 500 and in_sink:
        return "critical"
    if distance_m < 500 or in_sink:
        return "high"
    if distance_m < 1000:
        return "medium"
    return "low"


def collect_scoping_refs(distance_m, in_sink, in_viewshed, has_depreciation,
                         nearby_schools, nearby_env):
    """Collect relevant Scoping Opinion paragraph references."""
    refs = list(SCOPING_REFS["general"])
    if distance_m < 2000:
        refs.extend(SCOPING_REFS["co2_risk"])
    if in_sink:
        refs.extend(SCOPING_REFS["topo_sink"])
    if in_viewshed:
        refs.extend(SCOPING_REFS["viewshed"])
    if has_depreciation:
        refs.extend(SCOPING_REFS["property"])
    if nearby_schools:
        refs.extend(SCOPING_REFS["schools"])
    for env_item in nearby_env:
        env_key = env_item.split(":")[0]
        ref_key = f"env_{env_key}"
        if ref_key in SCOPING_REFS:
            refs.extend(SCOPING_REFS[ref_key])
    return sorted(set(refs))


def find_nearby_env_features(pt, env_bng, radius_m):
    """Find environmental designations within radius_m of a point.

    Uses vectorized distance computation per dataset rather than
    iterating over individual rows.
    """
    nearby = []
    for key, gdf_bng in env_bng.items():
        dists = gdf_bng.geometry.distance(pt)
        close_mask = dists < radius_m
        for idx in gdf_bng[close_mask].index:
            nearby.append(f"{key}: {gdf_bng.loc[idx].get('name', 'Unknown')}")
    return nearby


def main():
    print("=== 08_postcode_index.py ===\n")

    # ── 1. Load all processed data ────────────────────────────────────────
    impact = load_geojson(PROCESSED_DIR / "property_impact.geojson")
    agi = load_geojson(PROCESSED_DIR / "agi_sites.geojson")
    sections = load_geojson(PROCESSED_DIR / "route_sections.geojson")

    schools_path = PROCESSED_DIR / "schools.geojson"
    schools = load_geojson(schools_path) if schools_path.exists() else None

    env_files = list(PROCESSED_DIR.glob("env_*.geojson"))
    env_datasets = {}
    for ef in env_files:
        key = ef.stem.replace("env_", "")
        if key != "conflicts":
            gdf = load_geojson(ef)
            if len(gdf) > 0:
                env_datasets[key] = gdf

    print(f"Property impact: {len(impact)} postcodes")
    print(f"AGI sites: {len(agi)}")
    print(f"Schools: {len(schools) if schools is not None else 0}")
    print(f"Environmental datasets: {list(env_datasets.keys())}")

    # ── 2. Convert to BNG for distance calculations ───────────────────────
    impact_bng = to_bng(impact)
    agi_bng = to_bng(agi)
    sections_bng = to_bng(sections) if len(sections) > 0 else None

    schools_bng = to_bng(schools) if schools is not None and len(schools) > 0 else None

    env_bng = {key: to_bng(gdf) for key, gdf in env_datasets.items()}

    # ── 3. Build per-postcode index ───────────────────────────────────────
    print("\nBuilding postcode index...")
    index = {}

    for i, (_, row) in enumerate(impact_bng.iterrows()):
        pt = row.geometry
        postcode = row["postcode"]

        # Nearest AGI (vectorized distance across all AGI points)
        agi_dists = agi_bng.geometry.distance(pt)
        nearest_agi_idx = agi_dists.idxmin()
        nearest_agi_name = agi_bng.loc[nearest_agi_idx, "name"]
        nearest_agi_dist = round(agi_dists.min())

        # Nearest section
        section = 1
        if sections_bng is not None and len(sections_bng) > 0:
            sec_dists = sections_bng.geometry.distance(pt)
            section = int(sections_bng.loc[sec_dists.idxmin(), "section"])

        # Nearby schools (within 1km, vectorized)
        nearby_schools = []
        if schools_bng is not None and len(schools_bng) > 0:
            school_dists = schools_bng.geometry.distance(pt)
            close = school_dists[school_dists < NEARBY_RADIUS_M]
            nearby_schools = schools_bng.loc[close.index, "name"].tolist()

        # Nearby environmental designations (within 1km, vectorized per dataset)
        nearby_env = find_nearby_env_features(pt, env_bng, NEARBY_RADIUS_M)

        # Risk classification
        distance_m = row["distance_m"]
        in_sink = bool(row["in_topo_sink"])
        in_viewshed = bool(row["in_viewshed"])
        risk_level = classify_risk(distance_m, in_sink)

        # Scoping references
        scoping_refs = collect_scoping_refs(
            distance_m, in_sink, in_viewshed,
            row["depreciation_pct"] < 0,
            nearby_schools, nearby_env,
        )

        sink_depth = 2.0 if in_sink else None

        index[postcode] = {
            "lat": float(row["lat"]),
            "lon": float(row["lon"]),
            "distance_m": int(distance_m),
            "in_topo_sink": in_sink,
            "sink_depth_m": sink_depth,
            "in_viewshed": in_viewshed,
            "nearest_agi": nearest_agi_name,
            "nearest_agi_distance_m": nearest_agi_dist,
            "avg_property_price": int(row["avg_property_price"]),
            "est_depreciation_pct": float(row["depreciation_pct"]),
            "est_depreciation_pct_low": float(row.get("depreciation_pct_low", row["depreciation_pct"])),
            "est_depreciation_pct_high": float(row.get("depreciation_pct_high", row["depreciation_pct"])),
            "est_loss_gbp": int(row["est_loss_gbp"]),
            "est_loss_low": int(row.get("est_loss_low", row["est_loss_gbp"])),
            "est_loss_high": int(row.get("est_loss_high", row["est_loss_gbp"])),
            "nearby_env": nearby_env[:5],
            "nearby_schools": nearby_schools[:5],
            "risk_level": risk_level,
            "section": section,
            "scoping_refs": scoping_refs,
        }

        if (i + 1) % 500 == 0:
            print(f"  {i + 1}/{len(impact_bng)} postcodes indexed...")

    # ── 4. Stats ──────────────────────────────────────────────────────────
    risk_counts = {}
    for v in index.values():
        risk_counts[v["risk_level"]] = risk_counts.get(v["risk_level"], 0) + 1

    print(f"\n  Total postcodes indexed: {len(index)}")
    print(f"  Risk levels: {risk_counts}")

    # ── 5. Save ───────────────────────────────────────────────────────────
    out_path = PROCESSED_DIR / "postcode_index.json"
    with open(out_path, "w") as f:
        json.dump(index, f, separators=(",", ":"))

    size_kb = out_path.stat().st_size / 1024
    print(f"  Saved {out_path.name}: {size_kb:.0f} KB")

    print("\n=== Done! ===")


if __name__ == "__main__":
    main()
