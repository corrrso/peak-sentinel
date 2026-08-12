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

> **Do not publish these areas.** See "Source term is outside the model's
> regime" below. The plume direction and the fact that inhabited ground is
> reached are robust; the km² values are not converged.

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

## Source term is outside the model's regime (blocking issue)

Found 2026-08-12 by testing whether the banding visible in the SW4
footprint was a sampling artifact. It is not.

`setsrc.f90` treats a `KG_SEC` entry as a point source and converts our
mass rate into an upward gas velocity:

    ups = rate / (rho_gas * dxs * dys)

With the 20 m patch in `write_source` and the peak rate of about 8,500
kg/s, that injects gas upward at **8.9 m/s**, against a wind of 2 to 5
m/s. TWODEE is a shallow-layer model: it assumes vertical velocity is
small compared with horizontal spreading. We are violating that
assumption at the source.

The symptom is that the 4% footprint does not converge under source
discretisation, because finer bins resolve a higher initial spike:

| Source bin | first-bin rate | injected up velocity | 4% km² |
|---|---|---|---|
| 30 s | 8,549 kg/s | 8.87 m/s | 4.22 |
| 10 s | 9,548 kg/s | 9.91 m/s | 3.14 |
| 5 s | 9,823 kg/s | 10.19 m/s | 3.69 |

Mass released is identical (949.69 t) in all three, so this is not
leakage. The area moves 26% down then 18% up, which is a solver
responding to an out-of-regime forcing rather than converging.

Two things this rules out:

- **Output interval is irrelevant.** `CM_0150CM` accumulates at every
  internal solver step, so 60 s and 20 s output give bit-identical
  results. An earlier explanation blaming output sampling was wrong.
- **Refining bins does not fix it.** It makes the spike worse.

The likely fix is a physically sized crater. The Gexcon guidance for
buried CO2 pipelines says the release type is always "release from
crater", with the jet entraining air and exiting vertically. A patch
100 to 200 m across brings the injected velocity to 0.1 to 0.4 m/s,
comfortably inside the shallow-layer regime. Crater dimensions are an
expert judgement and must not be invented to make the numbers behave:
the patch size directly sets the initial cloud footprint.

This is the same "crater as low-momentum area source" simplification the
plan flagged for expert review. It is now demonstrated to be load-bearing
rather than a theoretical caveat, and it is the first question to put to a
dispersion expert.

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
