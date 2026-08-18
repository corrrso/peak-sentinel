# TWODEE configuration: what every parameter means

A record of the values our runs use, what each one physically represents, and
whether it matches the TWODEE-2.3 manual. Written so a reviewer can check our
setup against the manual without reading the Fortran.

The manual is `doc/twodee-manual.pdf` in the TWODEE-2.3 distribution. Section
references below are to that document. Values are from
`data/processed/rupture_runs/greasby_fbr_sw4/twodee.inp`, written by
`scripts/rupture_lib/twodee_io.py`.

## NUMERIC block

Every value is the manual's recommended default (section 4.1.7). We have tuned
nothing. The descriptions come from the code that consumes each parameter,
because the manual's own labels mostly restate the parameter name.

| Record | Ours | Manual | What it represents |
|---|---|---|---|
| `FRONT_FROUDE_NUMBER` | 1.0 | "usually equal to 1" | How fast the cloud's leading edge advances relative to the speed gravity alone would give it. 1.0 is the natural gravity-current speed. |
| `OPTIMAL_COURANT_NUMBER` | 0.25 | "usually equal to 0.25" | Numerical stability limit, not physics. Caps how far gas crosses a cell per timestep at a quarter of a cell. |
| `EDGE_ENTRAINMENT_COEFF` | 0.0 | "currently equal to 0.0" | Air mixed in at the cloud's side edges. Zero disables it, so all dilution happens through the cloud top. TWODEE's own default. |
| `DIFFUSION_COEFFICIENT` | 0.20 | "usually set to 0.2" | Artificial smoothing in the flux scheme that suppresses oscillation at sharp gradients. Numerical, not a physical diffusivity. |
| `SHAPE_PARAMETER` | 0.5 | "usually set to 0.5" | `S1` in the manual's Table 1. The model is depth-averaged, so it assumes a vertical profile to convert average density into a concentration at a given height. This sets that profile. |
| `ZETA_PARAMETER` | 0.0 | "currently equal to 0.0" | Constant in the turbulent shear stress term. Zero switches that contribution off. |
| `ALPHA_2` | 0.7 | 0.7 | Weights convective velocity `w*` in the mixing-velocity sum (`entrainment.f90:123`). Dilution by buoyancy-driven turbulence. |
| `ALPHA_3` | 1.3 | 1.3 | Weights the cloud's motion over the ground through the skin-friction coefficient. Dilution from the cloud sliding along the surface. |
| `ALPHA_7` | 0.45 | 0.45 | Weights shear between cloud and wind, `(u_cloud - u_wind)`. Dilution from wind tearing across the cloud top. |
| `VON_KARMAN_CONSTANT` | 0.4 | "usually set to 0.4" | Constant of the logarithmic wind profile. Measured physical constant, not tunable. |
| `BRITTER_B_CONSTANT` | 0.11 | "usually set to 0.11" | Damps top entrainment as stratification strengthens, `u_top = K/(1 + B*Ri)*v` (`entrainment.f90:130`). Higher B means a stable cloud resists mixing, stays dense and travels further. |

Two entries matter more than the rest for our footprints.
`SHAPE_PARAMETER` sits underneath every number we publish, because all of them
are concentrations at 1.5 m derived from a depth average. The three alphas and
`BRITTER_B_CONSTANT` together set the dilution rate, so cloud persistence and
reach are more sensitive to them than to anything else in the block. None has
been varied. They are the obvious sensitivity sweep if a reviewer challenges
the extents.

Matching the defaults means we have not tuned TWODEE toward a larger cloud,
which is worth stating plainly. It does not mean the defaults are validated for
a pipeline rupture: they come from volcanic diffuse-degassing work, where
releases are slow and steady rather than a 1,000 kg/s blowdown. This is the
same regime concern recorded in `rupture-simulation-status.md`.

## Domain and timing

| Record | Arrowe Park | Greasby | Notes |
|---|---|---|---|
| `NX` x `NY` | 400 x 400 | 400 x 400 | |
| `DX_(M)` | 10 | 20 | 4 x 4 km and 8 x 8 km domains |
| `X_ORIGIN` / `Y_ORIGIN` | 324520 / 383951 | 320895 / 382711 | BNG, grid bottom left |
| `SIMULATION_INTERVAL_(SEC)` | 3600 | 7200 | Both differ from the `scenarios.py` defaults of 1800 and 3600: the committed matrix was run with `--sim-s` overrides. Each report records the value actually used, so trust the report over `scenarios.py`. |
| `OUTPUT_INTERVAL_(SEC)` | 60 | 60 | Bounds arrival-time resolution to 60 s |

`UTM_ZONE = 30U` with `UTM_DATUM = OSGB_36`, so coordinates are British National
Grid throughout. `dem.py` pads the domain so TWODEE accepts the extent.

## PROPERTIES block

| Record | Ours | Meaning |
|---|---|---|
| `AMBIENT_GAS_DENSITY_20C_(KG/M3)` | 1.204 | Air at 20 C |
| `DENSE_GAS_DENSITY_20C_(KG/M3)` | 1.839 | CO2 at 20 C, ratio 1.53 |
| `AVERAGED_TEMPERATURE_(C)` | -49.4 | See the caveat below |
| `DOSE_GAS_TOXIC_EXPONENT` | 8.0 | Only affects dose output, which we do not use |

**Open question on `AVERAGED_TEMPERATURE`.** The manual (section 4.1.3) says
this scales both densities by `rho(293)/T`, and `readpro.f90:31-32` confirms it
applies to ambient air and dense gas alike. We pass the cold release
temperature, which inflates ambient air to 1.577 kg/m3 rather than about 1.246
at 10 C. The density *ratio* is preserved at 1.53, and that ratio drives gravity
spreading, so qualitative behaviour is unaffected. But absolute densities run
about 27% high, and the effect on footprint has not been tested. The manual's
phrasing suggests the record means the ambient average rather than the release
temperature. Worth resolving during expert review.

## METEO block and wind.dat

`WIND_MODEL = UNIFORM`, so wind is constant in space and time and read from
`wind.dat`. We do not run `diagno`, which means `X_STATION` and `Y_STATION` are
present but ignored (manual section 4.1.4).

`wind.dat` columns for a `CUP` anemometer are
`t1 t2 wx wy T_z0 T_zref p` (manual section 4.5). One time slice spans the whole
simulation.

| Case | wx, wy (m/s) | T_z0, T_zref (C) | Represents |
|---|---|---|---|
| `d5` | 5.0, 0.0 | 10, 10 | Neutral, 5 m/s westerly. Standard design case. |
| `f2` | 2.0, 0.0 | 10, 10.5 | Stable, 2 m/s westerly. Worst case for dense gas: weak mixing, inversion encoded as +0.5 C at the 10 m reference height. |
| `sw4` | 2.83, 2.83 | 10, 10 | Prevailing south-westerly at 4 m/s, neutral. |

Stability is therefore expressed only through the ground and reference
temperature pair, which TWODEE's surface-layer scheme turns into a
Monin-Obukhov length. There is no direct Pasquill class input.

Roughness comes from a spatially varying `roughness.grd` rather than the scalar
`Z_ROUGHNESS_(M)` the manual documents.

## Manual and code disagree on file records

The manual's prose is older than the code in places. Where they conflict, the
shipped `example/example1/twodee.inp` matches the code and the manual does not:

- Manual documents `TOPOGRAPHY_FILE_PATH` and `EXTRACT_TOPOGRAPHY_FROM_FILE`.
  The code reads `TOPOGRAPHY_FILE` plus `TOPOGRAPHY_FILE_FORMAT`.
- Manual documents scalar `Z_ROUGHNESS_(M)`. The code accepts
  `ROUGHNESS_FILE` plus `ROUGHNESS_FILE_FORMAT`.

Cross-check against `example1/twodee.inp`, not the prose.

## OUTPUT block

`HEIGHTS_(M) = 1.5` for head height, `CONCENTRATION_BG = 420.` ppm for present
day atmospheric background, `CRITICAL_C_(%) = 4 7 10` matching the thresholds we
publish.

Contours are built from `CM_0150CM`, which `setmaxval.f90:68` accumulates as a
running per-cell maximum. Reading its last timestep therefore gives peak
concentration ever reached in each cell, which is what our `max_footprint`
label claims. It is not a snapshot of the cloud at the end of the run.

## source.dat

`KG_M2_SEC` over a 20 x 20 m patch centred on the rupture point, in 30 s bins.
Units matter: `KG_SEC` takes a point-source branch in `setsrc.f90` that does not
conserve mass across an extended patch, which was a real bug (see
`rupture-simulation-status.md`).

Nothing in `source.dat` comes from the manual. The blowdown model is ours, and
the engineering inputs behind it are in `data/manual/pipeline_parameters.json`,
where operating pressure, valve spacing, closure time and temperature are all
marked `assumption`. TWODEE accepts whatever mass flux it is given, so the
manual cannot validate any of it. This remains the part needing expert review.
