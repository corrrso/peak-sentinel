"""Scenario and weather definitions for rupture dispersion runs.

Rupture points are corridor centreline points nearest each receptor
(BNG, from data/manual/corridor_aligned.geojson). Wind vectors point
in the direction of travel: a south-westerly is (u > 0, v > 0).
Stability is encoded through the ground/reference temperature pair
that TWODEE's surface-layer scheme reads from wind.dat.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent

SCENARIOS = {
    # Test case: small domain, fast runs. 4 x 4 km at 10 m.
    "arrowe_park_test": {
        "rupture_e": 326520.0,
        "rupture_n": 385951.0,
        "receptor_e": 326595.0,   # hospital main site
        "receptor_n": 386061.0,
        "x0": 324520.0,
        "y0": 383951.0,
        "nx": 400,
        "ny": 400,
        "dx": 10.0,
        "sim_s": 1800,
        "out_s": 60,
        "description": "Corridor point nearest Arrowe Park Hospital (130 m)",
    },
    # First full scenario. 8 x 8 km at 20 m.
    "greasby": {
        "rupture_e": 324895.0,
        "rupture_n": 386711.0,
        "receptor_e": 325002.0,   # village edge
        "receptor_n": 386743.0,
        "x0": 320895.0,
        "y0": 382711.0,
        "nx": 400,
        "ny": 400,
        "dx": 20.0,
        "sim_s": 3600,
        "out_s": 60,
        "description": "Corridor point nearest Greasby (110 m)",
    },
}

WEATHER = {
    # Neutral, 5 m/s from the west. The standard D5 design case.
    "d5": {"u_ms": 5.0, "v_ms": 0.0, "t_ground_c": 10.0, "t_ref_c": 10.0},
    # Stable, 2 m/s from the west. Worst case for dense gas: weak
    # mixing, inversion encoded as +0.5 C at the 10 m reference height.
    "f2": {"u_ms": 2.0, "v_ms": 0.0, "t_ground_c": 10.0, "t_ref_c": 10.5},
    # Prevailing south-westerly at 4 m/s, neutral.
    "sw4": {"u_ms": 2.83, "v_ms": 2.83, "t_ground_c": 10.0, "t_ref_c": 10.0},
}


def load_pipeline_parameters() -> dict:
    raw = json.loads((ROOT / "data" / "manual" / "pipeline_parameters.json").read_text())
    return {
        "p_pa": raw["operating_pressure_barg"]["value"] * 1e5 + 101325.0,
        "t_k": raw["temperature_c"]["value"] + 273.15,
        "bore_m": (raw["diameter_onshore_mm"]["value"] - 2 * raw["wall_thickness_mm"]["value"]) / 1000.0,
        "segment_length_m": raw["block_valve_spacing_km"]["value"] * 1000.0,
        "feed_rate_kgs": 95.0,  # 3 MTPA design throughput
        "valve_closure_s": float(raw["valve_closure_s"]["value"]),
    }
