# Rupture simulation: status and how to resume

**Branch:** `cursor/rupture-sim-feasibility-870f`  
**PR:** https://github.com/corrrso/peak-sentinel/pull/2  
**Last saved:** 2026-08-09

## Done

- Feasibility assessment: `docs/rupture-simulation-feasibility.md`
- Implementation plan: `docs/plans/2026-08-09-rupture-simulation.md`
- Pipeline parameters (cited): `data/manual/pipeline_parameters.json`
- Tasks 1–6 implemented and tested (20 unit/integration tests passing)
- TWODEE-2.3 builds via `scripts/setup_twodee.sh`
- Full Arrowe Park + Greasby scenario matrix run; GeoJSON + reports in `data/processed/rupture_scenarios/`

## Scenario results (4% footprint)

| Scenario | Weather / mode | 4% km² | Hospital / village 4% arrival |
|---|---|---|---|
| Arrowe Park | FBR D5 | 0.20 | none (cloud went east of hospital) |
| Arrowe Park | FBR F2 | 0.39 | 60 s |
| Arrowe Park | FBR SW4 | 0.35 | 0 s |
| Arrowe Park | puncture D5 | 0.0004 | none |
| Greasby | FBR D5 | 1.24 | 0 s |
| Greasby | FBR F2 | 1.12 | 0 s |
| Greasby | FBR SW4 | 2.08 | 0 s |
| Greasby | puncture D5 | 0.003 | none |

Eyeball checks: contours centred on rupture, thresholds nested (10% ⊂ 7% ⊂ 4%), punctures << FBR. At Arrowe Park, F2 footprint is larger than D5 as expected. At Greasby, F2 4% area is slightly smaller than D5 (worth investigating on resume; may be terrain drainage dominating wind).

## Not done (resume here)

1. **Pressure sensitivity** (Task 8 step 3): rerun Greasby FBR F2 at 20 and 45 barg; record footprint range in the report.
2. **Investigate Greasby F2 vs D5** and the Arrowe Park D5 miss on the hospital (wind from west only; SW4 and F2 do hit).
3. **Frontend** (deferred): scenario picker and cloud layer on the map.
4. **P1 gathering**: meteorology, toxicological reference page, Satartia validation materials.
5. **Expert review** of `scripts/rupture_lib/blowdown.py` before publishing numbers.

## How to resume

```bash
git checkout cursor/rupture-sim-feasibility-870f
pip install -r scripts/requirements.txt
# if needed: sudo apt-get install -y gfortran libnetcdff-dev
bash scripts/setup_twodee.sh
export TWODEE_BIN=$PWD/third_party/twodee-2.3/src/twodee

# LIDAR for Wirral domains (raw, gitignored). Re-download if missing:
# see scripts below or previous agent WCS curl to Defra
ls data/raw/dem/lidar_composite_1m/

python3 -m pytest tests/ -q
python3 scripts/10_rupture_source.py
python3 scripts/11_rupture_dispersion.py --scenario arrowe_park_test --mode fbr --weather f2
```

Raw LIDAR and `data/processed/rupture_runs/` are gitignored. Scenario GeoJSON and reports are committed. Rebuild TWODEE locally; do not commit `third_party/`.

## Key modules

- `scripts/rupture_lib/blowdown.py` — gas-phase source term
- `scripts/rupture_lib/twodee_io.py` — TWODEE input writers
- `scripts/rupture_lib/dem.py` — LIDAR → GRD (pads domain so TWODEE accepts extent)
- `scripts/rupture_lib/scenarios.py` — Arrowe Park + Greasby domains
- `scripts/rupture_lib/postprocess.py` — NetCDF → GeoJSON
- `scripts/10_rupture_source.py` / `scripts/11_rupture_dispersion.py` — CLIs
