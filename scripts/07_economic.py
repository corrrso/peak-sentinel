"""
07_economic.py — Property values and depreciation estimates.

Fetches average property prices from HM Land Registry Price Paid Data
per outcode district. Computes depreciation RANGE (low/central/high)
based on proximity to pipeline, viewshed exposure, and topographic sink risk.

All estimates cite peer-reviewed academic literature. No CO2-pipeline-specific
property value study exists — this gap is clearly disclosed.

Input:  data/processed/postcodes.geojson
        data/processed/corridor.geojson
        data/processed/viewshed_coastal.geojson
        data/processed/topo_sinks.geojson
Output: data/processed/property_impact.geojson
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import geopandas as gpd
import pandas as pd
import requests
import json
import time

from scripts.utils import (
    load_geojson, save_geojson, to_bng,
    PROCESSED_DIR, RAW_DIR, CRS_BNG,
)

ECON_DIR = RAW_DIR / "economic"
ECON_DIR.mkdir(parents=True, exist_ok=True)

# HM Land Registry Price Paid Data API
LR_API = "https://landregistry.data.gov.uk/data/ppi/transaction-record.json"

# Fallback regional averages (ONS House Price Statistics, March 2024)
REGIONAL_FALLBACKS = {
    "CH": 280000,     # Cheshire (Chester, Ellesmere Port)
    "L": 205000,      # Liverpool
    "CW": 265000,     # Crewe / mid-Cheshire
    "WA": 250000,     # Warrington
    "SK": 310000,     # Stockport / Macclesfield / Peak District fringe
    "DE": 240000,     # Derbyshire (Buxton, Hope Valley)
    "ST": 210000,     # Staffordshire (Leek, Cauldon)
}
DEFAULT_AVG = 260000

# ── Depreciation model ──────────────────────────────────────────────────
#
# Three scenarios based on peer-reviewed literature:
#
# LOW (conservative):
#   -2% at 0m → 0% at 2km
#   Based on: Herrnstadt & Sweeney (2024), ~2% post-explosion effect
#   "Housing Market Capitalization of Pipeline Risk", Land Economics 100(4)
#   DOI: 10.3368/le.100.4.040220-0047r1
#
# CENTRAL:
#   -8% at 0m → 0% at 2km
#   Based on: Cheng et al. (2024), 8.2% within 1km post-incident
#   "Pipeline incidents and property values", J. Env. Econ. & Mgmt. 127
#   DOI: 10.1016/j.jeem.2024.103041
#
# HIGH:
#   -9% at 0m → 0% at 3km
#   Based on: Boslett & Hill (2019), ~9% within 3km from announcement alone
#   "Shale gas transmission and housing prices", Resource & Energy Econ. 57
#   DOI: 10.1016/j.reseneeco.2019.02.001
#
# IMPORTANT: No peer-reviewed study exists for CO2 pipeline proximity
# effects on property values. The above studies concern natural gas and
# fuel pipelines. CO2 pipelines present different (potentially greater)
# risks due to asphyxiation hazard and terrain-following dispersion.
#
# No modifiers applied — only distance-based depreciation, directly
# reflecting the cited literature.


def compute_depreciation(distance_m, in_viewshed, in_sink):
    """
    Returns (low_pct, central_pct, high_pct) — all negative or zero.
    """
    if distance_m >= 3000:
        return 0.0, 0.0, 0.0

    low = -2 * max(0, 1 - distance_m / 2000) if distance_m < 2000 else 0
    central = -8 * max(0, 1 - distance_m / 2000) if distance_m < 2000 else 0
    high = -9 * max(0, 1 - distance_m / 3000)

    return round(low, 1), round(central, 1), round(high, 1)


def fetch_outcode_average(outcode, min_year=2023):
    """
    Query HM Land Registry for recent sales in an outcode district.
    Returns median price from sales since min_year.
    """
    cache_file = ECON_DIR / f"lr_{outcode}.json"
    if cache_file.exists():
        with open(cache_file) as f:
            prices = json.load(f)
        if prices:
            return int(sorted(prices)[len(prices) // 2])
        return None

    all_prices = []
    page = 0
    while True:
        params = {
            "min-propertyAddress.postcode": outcode,
            "max-propertyAddress.postcode": outcode + "Z",
            "min-transactionDate": f"{min_year}-01-01",
            "_pageSize": 200,
            "_page": page,
        }
        try:
            resp = requests.get(LR_API, params=params, timeout=30)
            if resp.status_code != 200:
                break
            items = resp.json().get("result", {}).get("items", [])
            if not items:
                break
            for item in items:
                price = item.get("pricePaid", 0)
                if 50000 <= price <= 2000000:
                    all_prices.append(price)
            page += 1
            if page >= 3:
                break
            time.sleep(0.3)
        except Exception as e:
            print(f"    API error for {outcode}: {e}")
            break

    with open(cache_file, "w") as f:
        json.dump(all_prices, f)

    if all_prices:
        return int(sorted(all_prices)[len(all_prices) // 2])
    return None


def get_fallback_price(postcode):
    prefix = postcode.split()[0] if " " in postcode else postcode[:2]
    for key in sorted(REGIONAL_FALLBACKS.keys(), key=len, reverse=True):
        if prefix.startswith(key):
            return REGIONAL_FALLBACKS[key]
    return DEFAULT_AVG


def main():
    print("=== 07_economic.py ===\n")

    # ── 1. Load data ──────────────────────────────────────────────────────
    postcodes = load_geojson(PROCESSED_DIR / "postcodes.geojson")
    corridor = load_geojson(PROCESSED_DIR / "corridor.geojson")
    viewshed = load_geojson(PROCESSED_DIR / "viewshed_coastal.geojson")
    sinks = load_geojson(PROCESSED_DIR / "topo_sinks.geojson")

    print(f"Postcodes: {len(postcodes)}")

    # ── 2. Fetch real property prices per outcode ─────────────────────────
    print("\n--- Fetching HM Land Registry data ---")
    pc_list = postcodes["postcode"].tolist()
    outcodes = sorted(set(
        pc.split()[0] if " " in pc else pc[:3] for pc in pc_list
    ))
    print(f"  Unique outcodes to query: {len(outcodes)}")

    outcode_prices = {}
    for oc in outcodes:
        median = fetch_outcode_average(oc)
        if median:
            outcode_prices[oc] = median
            print(f"  {oc}: £{median:,} (Land Registry median)")
        else:
            fb = get_fallback_price(oc + " 0AA")
            outcode_prices[oc] = fb
            print(f"  {oc}: £{fb:,} (regional fallback)")

    # ── 3. Spatial analysis ───────────────────────────────────────────────
    pc_bng = to_bng(postcodes)
    corridor_bng = to_bng(corridor)
    corridor_union = corridor_bng.union_all()

    vs_union = to_bng(viewshed).union_all() if len(viewshed) > 0 else None
    sinks_union = to_bng(sinks).union_all() if len(sinks) > 0 else None

    # ── 4. Compute per-postcode metrics ───────────────────────────────────
    print("\nComputing property impact (3 scenarios) for each postcode...")
    records = []
    for i, (_, row) in enumerate(pc_bng.iterrows()):
        pt = row.geometry
        postcode = row["postcode"]
        distance_m = pt.distance(corridor_union)
        in_viewshed = pt.within(vs_union) if vs_union else False
        in_sink = pt.within(sinks_union) if sinks_union else False

        oc = postcode.split()[0] if " " in postcode else postcode[:3]
        avg_price = outcode_prices.get(oc, get_fallback_price(postcode))

        low_pct, central_pct, high_pct = compute_depreciation(
            distance_m, in_viewshed, in_sink
        )

        records.append({
            "postcode": postcode,
            "lat": row.get("lat", 0),
            "lon": row.get("lon", 0),
            "distance_m": round(distance_m),
            "avg_property_price": avg_price,
            "in_viewshed": in_viewshed,
            "in_topo_sink": in_sink,
            "depreciation_pct_low": low_pct,
            "depreciation_pct": central_pct,
            "depreciation_pct_high": high_pct,
            "est_loss_low": round(avg_price * abs(low_pct) / 100),
            "est_loss_gbp": round(avg_price * abs(central_pct) / 100),
            "est_loss_high": round(avg_price * abs(high_pct) / 100),
            "geometry": pt,
        })

        if (i + 1) % 500 == 0:
            print(f"  {i + 1}/{len(pc_bng)} postcodes...")

    result = gpd.GeoDataFrame(records, crs=CRS_BNG)

    avg_dep = result[result["depreciation_pct"] < 0]["depreciation_pct"].mean()
    total_central = result["est_loss_gbp"].sum()
    total_high = result["est_loss_high"].sum()

    print(f"\n  Average central depreciation: {avg_dep:.1f}%")
    print(f"  Total est. loss (central): £{total_central:,.0f}")
    print(f"  Total est. loss (high): £{total_high:,.0f}")

    save_geojson(result, PROCESSED_DIR / "property_impact.geojson")
    print("\n=== Done! ===")


if __name__ == "__main__":
    main()
