"""
12_rupture_publish.py: copy rupture scenario results to the frontend.

Copies the GeoJSON contours and report JSON from
data/processed/rupture_scenarios/ into app/public/data/rupture/ and
writes a manifest the scenario picker reads, so the frontend list is
derived from the results rather than hand-maintained.

Output: app/public/data/rupture/{*.geojson,*_report.json,manifest.json}
"""
import argparse
import json
import shutil
import sys
from pathlib import Path

from pyproj import Transformer
from shapely.geometry import Point, shape
from shapely.ops import transform as shp_transform
from shapely.ops import unary_union
from shapely.strtree import STRtree

sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.utils import PROCESSED_DIR

ROOT = Path(__file__).parent.parent

SCENARIO_LABELS = {
    "arrowe_park_test": "Arrowe Park Hospital",
    "greasby": "Greasby",
}

WEATHER_LABELS = {
    "d5": "Neutral, 5 m/s westerly",
    "f2": "Stable, 2 m/s westerly",
    "sw4": "Prevailing south-westerly, 4 m/s",
}

MODE_LABELS = {
    "fbr": "Full-bore rupture",
    "puncture": "50 mm puncture",
}

# Variant suffixes are pressure sensitivity runs, not separate scenarios.
VARIANT_LABELS = {
    "p20": "20 barg (low end of assumed range)",
    "p43": "43 barg (high end, near the gas-phase limit)",
}


def parse_name(name: str):
    """Split <scenario>_<mode>_<weather>[_<variant>] into parts."""
    for scenario in SCENARIO_LABELS:
        if name.startswith(scenario + "_"):
            rest = name[len(scenario) + 1:].split("_")
            mode, weather = rest[0], rest[1]
            variant = "_".join(rest[2:]) or None
            return scenario, mode, weather, variant
    raise ValueError(f"unrecognised scenario name: {name}")


_TO_BNG = Transformer.from_crs("EPSG:4326", "EPSG:27700", always_xy=True).transform


def _postcode_tree():
    """Postcode centroids in BNG, for counting what a contour covers."""
    raw = json.loads((PROCESSED_DIR / "postcode_index.json").read_text())
    names, points = [], []
    for code, v in raw.items():
        x, y = _TO_BNG(v["lon"], v["lat"])
        names.append(code)
        points.append(Point(x, y))
    return names, points, STRtree(points)


def count_postcodes(geojson_path: Path, names, points, tree) -> int:
    """Postcodes whose centroid falls inside the 4% contour.

    Area alone is a poor measure of severity: a large footprint over
    farmland matters less than a smaller one over housing. This is the
    number that should order the scenarios.
    """
    gj = json.loads(geojson_path.read_text())
    polys = [
        shape(f["geometry"])
        for f in gj["features"]
        if f["properties"].get("threshold_pct") == 4.0
    ]
    if not polys:
        return 0
    cloud = unary_union([shp_transform(_TO_BNG, p) for p in polys])
    return sum(1 for i in tree.query(cloud) if points[i].within(cloud))


def build_entry(report_path: Path) -> dict:
    name = report_path.name.replace("_report.json", "")
    scenario, mode, weather, variant = parse_name(name)
    r = json.loads(report_path.read_text())
    areas = r["footprint_area_km2"]
    return {
        "id": name,
        "scenario": scenario,
        "scenario_label": SCENARIO_LABELS[scenario],
        "mode": mode,
        "mode_label": MODE_LABELS[mode],
        "weather": weather,
        "weather_label": WEATHER_LABELS[weather],
        "variant": variant,
        "variant_label": VARIANT_LABELS.get(variant),
        "area_4pct_km2": areas["4.0"],
        "area_7pct_km2": areas["7.0"],
        "area_10pct_km2": areas["10.0"],
        "max_extent_m": round(r["max_extent_m"]),
        "receptor_arrival_s": r["receptor_arrival_s"],
        "receptor_max_pct": r.get("receptor_max_pct"),
        "pressure_barg": r["assumptions"].get("pressure_barg"),
        "source_model": r["source_meta"].get("model", "orifice"),
        "peak_rate_kgs": round(r["source_meta"]["q_peak_kgs"], 1),
        "released_t": round(r["source_meta"]["total_released_kg"] / 1000.0, 1),
        "mass_released_fraction": r.get("resolution", {}).get("mass_released_fraction"),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=str(PROCESSED_DIR / "rupture_scenarios"))
    ap.add_argument("--dest", default=str(ROOT / "app" / "public" / "data" / "rupture"))
    args = ap.parse_args()

    src, dest = Path(args.src), Path(args.dest)
    dest.mkdir(parents=True, exist_ok=True)

    names, points, tree = _postcode_tree()

    entries = []
    for report in sorted(src.glob("*_report.json")):
        name = report.name.replace("_report.json", "")
        geojson = src / f"{name}.geojson"
        if not geojson.exists():
            print(f"WARNING: {name} has a report but no geojson, skipping")
            continue
        shutil.copy2(geojson, dest / geojson.name)
        shutil.copy2(report, dest / report.name)
        entry = build_entry(report)
        entry["postcodes_in_cloud"] = count_postcodes(geojson, names, points, tree)
        entries.append(entry)

    if not entries:
        raise SystemExit(f"No scenario results found in {src}")

    models = {e["source_model"] for e in entries}
    if len(models) > 1:
        print(f"WARNING: results mix source models {models}. "
              "Regenerate the matrix so published figures are comparable.")

    (dest / "manifest.json").write_text(json.dumps(entries, indent=1))
    print(f"Published {len(entries)} scenarios to {dest}")
    for e in sorted(entries, key=lambda x: -x["postcodes_in_cloud"]):
        print(f"  {e['id']:<32} {e['area_4pct_km2']:>7.3f} km2  "
              f"{e['postcodes_in_cloud']:>4} postcodes  {e['source_model']}")


if __name__ == "__main__":
    main()
