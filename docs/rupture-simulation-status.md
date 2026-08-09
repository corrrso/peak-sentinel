# Rupture simulation: status and how to resume

**Branch:** `cursor/rupture-sim-feasibility-870f`  
**PR:** https://github.com/corrrso/peak-sentinel/pull/2  
**Last saved:** 2026-08-09 (plan completed)

## Done

- Feasibility assessment: `docs/rupture-simulation-feasibility.md`
- Implementation plan: `docs/plans/2026-08-09-rupture-simulation.md`, all eight tasks complete
- Pipeline parameters (cited): `data/manual/pipeline_parameters.json`
- Tasks 1–6 implemented and tested (22 unit tests plus 2 physics integration tests)
- TWODEE-2.3 builds via `scripts/setup_twodee.sh` on Linux and macOS
- Full Arrowe Park + Greasby matrix plus pressure sensitivity in `data/processed/rupture_scenarios/`

## Scenario results (4% footprint)

All runs regenerated in one environment on 2026-08-09. The earlier
numbers in this file came from a different toolchain and did not
reproduce; TWODEE is bit-deterministic on identical inputs, so results
from different builds must not be mixed.

| Scenario | Weather / mode | 4% km² | Receptor 4% arrival | Peak at receptor |
|---|---|---|---|---|
| Arrowe Park | FBR D5 | 0.33 | 0 s | 49.8% |
| Arrowe Park | FBR F2 | 0.45 | 0 s | 57.4% |
| Arrowe Park | FBR SW4 | 0.59 | 0 s | 69.6% |
| Arrowe Park | puncture D5 | 0.0004 | none | 0.0% |
| Greasby | FBR D5 | 1.84 | 0 s | 99.4% |
| Greasby | FBR F2 | 2.10 | 0 s | 99.9% |
| Greasby | FBR SW4 | 4.22 | 0 s | 87.5% |
| Greasby | puncture D5 | 0.0056 | 180 s | 6.1% |

Pressure sensitivity, Greasby FBR F2: **0.59 km² at 20 barg, 2.10 km² at
35 barg, 2.66 km² at 43 barg.** Publish the range, not the base case.

Checklist verified numerically (see the commit message on `a93afdd`):
rupture point inside the 4% polygon in all ten runs; F2 larger than D5
at both sites; cloud mean elevation below that of terrain within the same
radius; punctures 0.1–0.3% of the matching FBR; thresholds nested.

## Two findings from completing the plan

1. **45 barg is not a valid gas-phase case.** CO2 saturates at 44.01 barg
   at the assumed 10 °C ground temperature, so the planned upper
   sensitivity point is liquid (863 kg/m³ against 92 kg/m³ at 35 barg).
   `blowdown_series` now raises `GasPhaseError`, and the upper bound is
   43 barg. The stated gas phase and the implied 22–45 barg range are only
   consistent below about 44 barg, which is worth raising in consultation:
   at the top of its own range the line must run warmer than assumed or
   be dense phase.
2. **Receptors were sampled as a single grid cell.** The cloud edge is
   steep enough that one cell reads background while cells 25 m away are
   at 24 vol%. This is what produced the "cloud went east of the
   hospital" result for Arrowe Park D5. Arrivals now use a 50 m radius
   and reports carry `receptor_max_pct`.

## Not done (resume here)

1. **Frontend** (deferred by the plan): scenario picker and cloud layer.
2. **P1 gathering**: meteorology, toxicological reference page, Satartia
   validation materials.
3. **Expert review** of `scripts/rupture_lib/blowdown.py` before
   publishing numbers. This is the one part that stays expert-dependent:
   exponential blowdown and the crater as a low-momentum area source.
4. Deferred items listed in the plan: Britter-McQuaid cross-check,
   Thorney Island benchmark, MIDAS wind roses, spatially varying
   roughness.

## How to resume

```bash
git checkout cursor/rupture-sim-feasibility-870f
pip install -r scripts/requirements.txt
# Linux: sudo apt-get install -y gfortran libnetcdff-dev
# macOS: brew install gcc netcdf-fortran
bash scripts/setup_twodee.sh
export TWODEE_BIN=$PWD/third_party/twodee-2.3/src/twodee

# LIDAR for Wirral domains (raw, gitignored). Re-download if missing:
# see scripts below or previous agent WCS curl to Defra
ls data/raw/dem/lidar_composite_1m/

python3 -m pytest tests/ -q
python3 scripts/10_rupture_source.py
python3 scripts/11_rupture_dispersion.py --scenario arrowe_park_test --mode fbr --weather f2

# sensitivity runs take a pressure override and a name suffix
python3 scripts/11_rupture_dispersion.py --scenario greasby --mode fbr --weather f2 \
  --pressure-barg 43 --tag p43
```

Runs are single-threaded, so the matrix parallelises across cores. Arrowe
Park takes about 3 minutes per run, Greasby about 10.

Raw LIDAR and `data/processed/rupture_runs/` are gitignored. Scenario GeoJSON and reports are committed. Rebuild TWODEE locally; do not commit `third_party/`.

## Key modules

- `scripts/rupture_lib/blowdown.py` — gas-phase source term
- `scripts/rupture_lib/twodee_io.py` — TWODEE input writers
- `scripts/rupture_lib/dem.py` — LIDAR → GRD (pads domain so TWODEE accepts extent)
- `scripts/rupture_lib/scenarios.py` — Arrowe Park + Greasby domains
- `scripts/rupture_lib/postprocess.py` — NetCDF → GeoJSON
- `scripts/10_rupture_source.py` / `scripts/11_rupture_dispersion.py` — CLIs
