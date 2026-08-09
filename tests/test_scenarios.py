import json
import subprocess
import sys
from pathlib import Path

from scripts.rupture_lib.scenarios import SCENARIOS, WEATHER, load_pipeline_parameters

ROOT = Path(__file__).resolve().parent.parent


def test_scenarios_are_wellformed():
    for name, s in SCENARIOS.items():
        assert s["nx"] * s["dx"] == s["ny"] * s["dx"]  # square domains for now
        # rupture point inside the domain with margin for the plume
        assert s["x0"] + 5 * s["dx"] < s["rupture_e"] < s["x0"] + (s["nx"] - 5) * s["dx"]
        assert s["y0"] + 5 * s["dx"] < s["rupture_n"] < s["y0"] + (s["ny"] - 5) * s["dx"]


def test_weather_cases_cover_design_conditions():
    assert set(WEATHER) == {"d5", "f2", "sw4"}
    assert WEATHER["f2"]["t_ref_c"] > WEATHER["f2"]["t_ground_c"]  # stable
    assert WEATHER["d5"]["t_ref_c"] == WEATHER["d5"]["t_ground_c"]  # neutral


def test_parameters_load_from_manual_json():
    p = load_pipeline_parameters()
    assert p["p_pa"] == 35e5 + 101325.0
    assert p["bore_m"] == 0.914 - 2 * 0.025
    assert p["segment_length_m"] == 16000.0


def test_source_cli_writes_json(tmp_path):
    out = tmp_path / "rupture_sources.json"
    subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "10_rupture_source.py"), "--out", str(out)],
        check=True, cwd=ROOT,
    )
    data = json.loads(out.read_text())
    assert set(data) == {"fbr", "puncture"}
    assert data["fbr"]["meta"]["total_released_kg"] > 800_000
    assert data["fbr"]["bins"][0]["rate_kgs"] > data["fbr"]["bins"][-1]["rate_kgs"]
