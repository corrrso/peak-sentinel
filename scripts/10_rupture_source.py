"""
10_rupture_source.py: transient rupture source terms.

Computes gas-phase blowdown series for full-bore rupture and 50 mm
puncture from data/manual/pipeline_parameters.json.

Output: data/processed/rupture_sources.json
"""
import argparse
import json
import sys
from dataclasses import asdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.rupture_lib.blowdown import blowdown_series
from scripts.rupture_lib.scenarios import load_pipeline_parameters
from scripts.utils import PROCESSED_DIR


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(PROCESSED_DIR / "rupture_sources.json"))
    args = ap.parse_args()

    p = load_pipeline_parameters()
    result = {}
    for mode, hole in (("fbr", None), ("puncture", 0.05)):
        bins, meta = blowdown_series(
            p["p_pa"], p["t_k"], p["bore_m"], p["segment_length_m"],
            hole_diameter_m=hole,
            feed_rate_kgs=p["feed_rate_kgs"],
            valve_closure_s=p["valve_closure_s"],
        )
        result[mode] = {"bins": [asdict(b) for b in bins], "meta": meta}
        print(f"{mode}: peak {meta['q_peak_kgs']:.0f} kg/s, "
              f"released {meta['total_released_kg']/1000:.0f} t, "
              f"release temp {meta['release_temp_k']-273.15:.1f} C")

    Path(args.out).write_text(json.dumps(result, indent=1))
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()
