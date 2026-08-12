"""
11_rupture_dispersion.py: run one rupture dispersion scenario.

Assembles TWODEE input files, runs the binary, converts output to
GeoJSON contours and a report.

Usage:
  python scripts/11_rupture_dispersion.py --scenario arrowe_park_test --mode fbr --weather d5

Requires LIDAR tiles in data/raw/dem/lidar_composite_1m/ and a built
TWODEE binary (scripts/setup_twodee.sh, or set TWODEE_BIN).
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np

from scripts.rupture_lib.blowdown import blowdown_series
from scripts.rupture_lib.dem import dem_to_grd
from scripts.rupture_lib.postprocess import extract
from scripts.rupture_lib.scenarios import SCENARIOS, WEATHER, load_pipeline_parameters
from scripts.rupture_lib.twodee_io import write_grd, write_inp, write_source, write_wind_uniform
from scripts.utils import PROCESSED_DIR

DEFAULT_BIN = Path(__file__).parent.parent / "third_party" / "twodee-2.3" / "src" / "twodee"


def run_twodee(run_dir: Path, twodee_bin: str) -> str:
    out = subprocess.run(
        [twodee_bin, "twodee.inp"], cwd=run_dir,
        capture_output=True, text=True,
    )
    # TWODEE exits 0 and prints "ABNORMAL TERMINATION" on errors, and
    # that string contains "NORMAL TERMINATION", so check both ways.
    if out.returncode != 0 or "ABNORMAL" in out.stdout or "NORMAL TERMINATION" not in out.stdout:
        raise RuntimeError(f"TWODEE failed:\n{out.stdout}\n{out.stderr}")
    return out.stdout


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scenario", required=True, choices=sorted(SCENARIOS))
    ap.add_argument("--mode", default="fbr", choices=["fbr", "puncture"])
    ap.add_argument("--weather", default="d5", choices=sorted(WEATHER))
    ap.add_argument("--twodee-bin", default=os.environ.get("TWODEE_BIN", str(DEFAULT_BIN)))
    ap.add_argument(
        "--pressure-barg", type=float, default=None,
        help="override the operating pressure for sensitivity runs",
    )
    ap.add_argument(
        "--tag", default=None,
        help="suffix for the run and output names, to keep sensitivity runs separate",
    )
    ap.add_argument(
        "--out-s", type=int, default=None,
        help="override the output interval. The running-maximum footprint is "
             "sampled at this interval, so a coarse value leaves gaps between "
             "successive cloud positions and undercounts the area.",
    )
    ap.add_argument(
        "--bin-s", type=float, default=30.0,
        help="source term time bin. Coarse bins pulse the release, which also "
             "shows up as banding in the accumulated footprint.",
    )
    ap.add_argument(
        "--patch-m", type=float, default=20.0,
        help="width of the square crater the gas escapes through. TWODEE turns "
             "the mass rate into an upward velocity of rate/(rho*patch^2), so a "
             "small patch injects gas fast enough to leave the shallow-layer "
             "regime. Real crater size is unknown, so sweep it.",
    )
    args = ap.parse_args()

    s = dict(SCENARIOS[args.scenario])
    if args.out_s:
        s["out_s"] = args.out_s
    w = WEATHER[args.weather]
    name = f"{args.scenario}_{args.mode}_{args.weather}"
    if args.tag:
        name = f"{name}_{args.tag}"
    run_dir = PROCESSED_DIR / "rupture_runs" / name
    if run_dir.exists():
        shutil.rmtree(run_dir)
    (run_dir / "outfiles").mkdir(parents=True)

    west, south = s["x0"], s["y0"]
    east = west + s["nx"] * s["dx"]
    north = south + s["ny"] * s["dx"]
    dem = dem_to_grd((west, south, east, north), s["dx"], run_dir / "topography.grd")
    # roughness grid must overhang the domain exactly like the DEM does
    write_grd(run_dir / "roughness.grd", np.full(dem.shape, 0.1),
              west - s["dx"] / 2, south - s["dx"] / 2, s["dx"])

    p = load_pipeline_parameters(pressure_barg=args.pressure_barg)
    bins, meta = blowdown_series(
        p["p_pa"], p["t_k"], p["bore_m"], p["segment_length_m"],
        hole_diameter_m=None if args.mode == "fbr" else 0.05,
        feed_rate_kgs=p["feed_rate_kgs"], valve_closure_s=p["valve_closure_s"],
        bin_s=args.bin_s,
        t_end_s=float(s["sim_s"]),
    )
    write_source(run_dir / "source.dat", s["rupture_e"], s["rupture_n"], bins,
                 patch_m=args.patch_m)
    write_wind_uniform(run_dir / "wind.dat", w["u_ms"], w["v_ms"],
                       w["t_ground_c"], w["t_ref_c"], s["sim_s"])
    write_inp(run_dir / "twodee.inp", {
        "name": name, "x0": s["x0"], "y0": s["y0"], "nx": s["nx"], "ny": s["ny"],
        "dx": s["dx"], "sim_s": s["sim_s"], "out_s": s["out_s"],
        "gas_temp_c": round(meta["release_temp_k"] - 273.15, 1),
        "station_x": s["rupture_e"], "station_y": s["rupture_n"],
    })

    print(f"Running TWODEE for {name} "
          f"(peak {meta['q_peak_kgs']:.0f} kg/s, {meta['total_released_kg']/1000:.0f} t)")
    run_twodee(run_dir, args.twodee_bin)

    geojson, report = extract(
        run_dir / "outfiles" / f"{name}.xy.nc",
        s["rupture_e"], s["rupture_n"], s["receptor_e"], s["receptor_n"],
        output_interval_s=s["out_s"],
    )
    report["source_meta"] = meta
    report["weather"] = args.weather
    report["assumptions"] = p
    # The footprint is a running maximum sampled at out_s, so both of these
    # bound how much sub-step structure the area can resolve.
    report["resolution"] = {
        "output_interval_s": s["out_s"],
        "source_bin_s": args.bin_s,
        "grid_dx_m": s["dx"],
        "source_patch_m": args.patch_m,
    }

    out_dir = PROCESSED_DIR / "rupture_scenarios"
    out_dir.mkdir(exist_ok=True)
    (out_dir / f"{name}.geojson").write_text(json.dumps(geojson))
    (out_dir / f"{name}_report.json").write_text(json.dumps(report, indent=1))
    print(f"Footprint km2 by threshold: {report['footprint_area_km2']}")
    print(f"Receptor arrival of 4% cloud: {report['receptor_arrival_s']} s")
    print(f"Wrote {out_dir / name}.geojson")


if __name__ == "__main__":
    main()
