# Rupture simulation: status and how to resume

**Branch:** `cursor/rupture-sim-feasibility-870f`  
**PR:** https://github.com/corrrso/peak-sentinel/pull/2  
**Last saved:** 2026-08-18 (frontend landed)

## Done

- Feasibility assessment: `docs/rupture-simulation-feasibility.md`
- Implementation plan: `docs/plans/2026-08-09-rupture-simulation.md`, all eight tasks complete
- Pipeline parameters (cited): `data/manual/pipeline_parameters.json`
- Tasks 1–6 implemented and tested (22 unit tests plus 2 physics integration tests)
- TWODEE-2.3 builds via `scripts/setup_twodee.sh` on Linux and macOS
- Full Arrowe Park + Greasby matrix plus pressure sensitivity in `data/processed/rupture_scenarios/`
- Frontend: scenario picker and cloud layer, published by `scripts/12_rupture_publish.py`

## Scenario results (4% footprint)

All runs use the **friction-limited** source model and were regenerated
together on 2026-08-17. Mass released is 98% of available for every
full-bore case. Puncture cases release far less within the simulation
window because a 50 mm hole genuinely vents for many hours; the reports
carry `mass_released_fraction` so this is visible rather than implied.

| Scenario | Weather / mode | 4% km² | Postcodes in cloud | Reach m |
|---|---|---|---|---|
| Arrowe Park | FBR D5 | 0.46 | 0 | 1953 |
| Arrowe Park | FBR F2 | 1.13 | 9 | 2099 |
| Arrowe Park | FBR SW4 | 0.83 | 49 | 2628 |
| Arrowe Park | puncture D5 | 0.001 | 0 | 61 |
| Greasby | FBR D5 | 0.34 | 23 | 2861 |
| Greasby | FBR F2 | 0.76 | 66 | 3915 |
| Greasby | FBR SW4 | 0.88 | 104 | 3951 |
| Greasby | puncture D5 | 0.006 | 1 | 122 |

Pressure sensitivity, Greasby FBR F2: 0.43 km² at 20 barg, 0.76 km² at
35 barg, 1.21 km² at 43 barg. Monotonic, unlike the earlier orifice-model
version. Publish the range, not the base case.

Invariants verified numerically on this matrix: thresholds nested in all
ten runs; F2 larger than D5 at both sites; punctures 0.2 to 1.7% of the
matching FBR.

Earlier figures in this file used the orifice source model and were up to
five times larger. They are superseded. Sensitivity studies on crater
size, source binning, output interval and release timescale are retained
under `data/processed/rupture_scenarios/sensitivity/`.

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

## Source term history (resolved)

Two source-term problems were found and fixed after the plan completed.
Recorded because the numbers in git history change because of them.

1. **Wrong units flag.** `write_source` emitted `KG_SEC`, which
   `setsrc.f90` handles as a point source: it derives an upward velocity
   of `rate/(rho*dxs*dys)` but applies it to the single grid cell holding
   the source point. Mass entering the domain scaled as `(cell/patch)^2`,
   so a larger crater silently discarded gas, and the whole release was
   injected through one 20 m cell at 8.9 m/s upward against a 2 to 5 m/s
   wind, outside the shallow-layer regime. Now `KG_M2_SEC`, which takes
   the extended-source branch and conserves mass.
2. **Orifice source term.** The release assumed choked flow from an
   unlimited reservoir at 10,014 kg/s. A Darcy-Weisbach check gives 761
   to 1,067 kg/s through the 8 km flow path, and the implemented
   friction model gives 1,285 kg/s. Footprints fell by roughly three
   times.

With the units fixed, crater size barely matters: 20 m to 200 m moves the
4% footprint only 4.34 to 3.90 km² and postcodes 351 to 310. That question
is closed. The release timescale mattered far more, which is what the
friction model addresses.

Remaining known gaps in the friction model, both affecting the first
seconds: no sonic decompression wave travelling back along the line, and
temperature held fixed rather than tracking Joule-Thomson cooling of the
remaining inventory. It gives a 0.5 h release against Satartia's measured
4 h, so it may still be too fast, which would mean the footprints here are
upper bounds. See `satartia-reference-case.md` for why Satartia cannot
validate this directly.

## Frontend (done 2026-08-18)

`scripts/12_rupture_publish.py` writes per-scenario GeoJSON plus
`manifest.json` to `app/public/data/rupture/`. The map reads the manifest for
the picker and lazily fetches a scenario's contours only when selected, so
adding scenarios needs no frontend change.

- Layer toggle "Rupture CO₂ Cloud", off by default because the filled cloud
  covers the other layers.
- Buffer zones have their own toggle, split from the corridor. Their broad
  translucent fills washed out the cloud, and the corridor toggle was
  previously inert.
- Threshold contours describe physiological effect, not just concentration.
  Nested contours collapse to the most severe via `collapseNestedLayers`, so a
  point inside 10% no longer reports 7% and 4% as well.
- Picker defaults to the full-bore case affecting the most postcodes, which is
  Greasby SW4. Ordering by area would pick a larger footprint over open ground
  and understate the human impact.

## Not done (resume here)

1. **P1 gathering**: meteorology, toxicological reference page, Satartia
   validation materials.
2. **Expert review** of `scripts/rupture_lib/blowdown.py` before
   publishing numbers. This is the one part that stays expert-dependent:
   exponential blowdown and the crater as a low-momentum area source.
   The frontend now displays these figures, so this gates publication.
3. Deferred items listed in the plan: Britter-McQuaid cross-check,
   Thorney Island benchmark, MIDAS wind roses, spatially varying
   roughness.
4. The vehicle-stalling detail in the 10% tooltip cites Satartia. The stalled
   engines and 45 hospitalisations are documented in
   `satartia-reference-case.md`, but no concentration is attached to the
   stalling there. Check against PHMSA before quoting a figure.

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

## Configuration reference

`twodee-configuration.md` records every TWODEE input we set, what it physically
represents, and whether it matches the manual. All NUMERIC values are the
manual's defaults. It also lists two places where the manual disagrees with the
shipped code, and an open question about `AVERAGED_TEMPERATURE`.

## Key modules

- `scripts/rupture_lib/blowdown.py` — gas-phase source term
- `scripts/rupture_lib/twodee_io.py` — TWODEE input writers
- `scripts/rupture_lib/dem.py` — LIDAR → GRD (pads domain so TWODEE accepts extent)
- `scripts/rupture_lib/scenarios.py` — Arrowe Park + Greasby domains
- `scripts/rupture_lib/postprocess.py` — NetCDF → GeoJSON
- `scripts/10_rupture_source.py` / `scripts/11_rupture_dispersion.py` — CLIs

## What is actually missing (2026-08-17)

TWODEE is not the problem. The binary builds, runs, conserves mass, and
passes both physics acceptance tests. The manual and source are complete
and the input data is sufficient. The gap is entirely in our own 171 line
`blowdown.py`, which decides how fast the pipe empties.

A Darcy-Weisbach check on isothermal compressible flow through 8 km of
864 mm bore, which is the distance gas must travel from the segment
midpoint to the break:

| Darcy friction factor | Deliverable rate | vs our modelled peak |
|---|---|---|
| 0.010 | 1,067 kg/s | 0.11x |
| 0.015 | 876 kg/s | 0.09x |
| 0.020 | 761 kg/s | 0.08x |

Our source term assumes 10,014 kg/s, the choked rate for a free orifice
at line conditions. The pipe cannot deliver it. Friction over kilometres
of bore limits the release to roughly a tenth of that, and the flow is
fully turbulent at Re about 1e9 so the friction factor is well
constrained.

This corroborates the Satartia comparison from an independent direction.
The measured 4 hour release needed tau_scale 20 to 50 to reproduce;
friction independently says the initial rate is about 10x too high. Two
unrelated lines of evidence point the same way, which is why the base
case footprint is very likely an overestimate rather than merely
uncertain.

What this means in practice: the missing component is a friction-limited
blowdown, not any TWODEE input. That is a real piece of engineering,
solving compressible pipe flow with a moving pressure profile, and it is
the single change that would collapse the current 20 to 351 postcode
range into a defensible number.
