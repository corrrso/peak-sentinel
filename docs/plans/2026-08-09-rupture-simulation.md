# CO2 Rupture Dispersion Simulation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Simulate the ground-level CO2 concentration footprint of a Peak Cluster pipeline rupture near Arrowe Park Hospital (test case) and Greasby, producing GeoJSON hazard contours and arrival-time data for the map frontend.

**Architecture:** Three stages. A gas-phase blowdown model (Python + CoolProp) produces a transient mass-flow source term from `data/manual/pipeline_parameters.json`. A driver script writes TWODEE-2.3 input files (Surfer GRD terrain from LIDAR, uniform wind, time-binned ground source), runs the TWODEE binary, and post-processes its NetCDF output into GeoJSON contours in `data/processed/rupture_scenarios/`. Frontend integration is a separate plan.

**Tech Stack:** Python 3.10+ (CoolProp, netCDF4, numpy, rasterio, geopandas, pytest), TWODEE-2.3 (Fortran, built via `scripts/setup_twodee.sh`), Environment Agency LIDAR 1m DTM tiles in `data/raw/dem/lidar_composite_1m/`.

## Global Constraints

- All commands run from the repo root (`/workspace` or your local checkout).
- Python imports use the existing repo pattern: repo root on `sys.path`, modules imported as `scripts.rupture_lib.<module>`.
- Pipeline parameters come only from `data/manual/pipeline_parameters.json`. Never hard-code pressure, diameter, or valve spacing in physics code.
- Prose in code comments and docs follows the repo writing style rules in `CLAUDE.md`.
- Tests that need the TWODEE binary are skipped unless the `TWODEE_BIN` environment variable points to it. All other tests run anywhere.
- Scenario runs (Tasks 7 and 8) additionally need LIDAR tiles in `data/raw/dem/lidar_composite_1m/`. They exist on the maintainer's machine, not in git.
- Commit after every task. Do not commit run directories (`data/processed/rupture_runs/`) or `third_party/`; both get gitignored in Task 6.

## Reference values used in tests

Computed with CoolProp 7.x for CO2 at 35 barg (3,601,325 Pa absolute) and 283.15 K, bore 864 mm (914 OD, 25 mm wall), 16 km segment:

- density 91.8 kg/m3, gamma (cp/cv) 1.899, compressibility Z 0.733
- choked mass flux 13,774 kg/m2/s
- bore area 0.5863 m2, full-bore peak rate per side with Cd 0.62: 5,007 kg/s
- segment inventory 861 tonnes
- isenthalpic exit temperature to 1 atm: -49.4 C (above the -78.5 C sublimation clamp)

These are regression anchors. Tests assert within a few percent so a CoolProp version bump does not break them.

## How correctness is protected (read this first)

The maintainer is not a dispersion expert, so correctness rests on checks that do not require expertise to interpret:

1. **Conservation and reference tests (Tasks 1, 2, 5).** Released mass must equal segment inventory plus valve feed to 0.1%. Choked flux, inventory, and exit temperature are pinned to independently computed CoolProp values. The source file writer is tested to emit exactly the mass the blowdown model produced.
2. **Physics invariant tests against the real binary (Task 6).** On flat terrain the plume must extend downwind, not upwind. On a tilted plane with no wind the cloud centroid must move downhill. These are properties anyone can verify by eye in the output and that catch coordinate-system, sign, and unit errors, which are the realistic failure modes here.
3. **The dispersion solver itself is not ours.** TWODEE-2.3 is published, peer-reviewed, and validated (Folch, Costa & Hankin 2009; HSL TWODEE lineage validated against the Thorney Island trials). We only write its inputs and read its outputs, and both directions are covered by round-trip tests.
4. **Every scenario run writes a report JSON** containing the mass balance, peak rate, and assumption values used, so a reviewer can audit any published contour back to its inputs.
5. **What remains expert-dependent** is the source-term simplification (exponential blowdown, crater as low-momentum area source). It is isolated in one module with citations, carries sensitivity knobs, and is the part to put in front of an expert reviewer before publication.

---

### Task 1: Blowdown source term module

**Files:**
- Create: `scripts/rupture_lib/__init__.py` (empty)
- Create: `scripts/rupture_lib/blowdown.py`
- Create: `tests/conftest.py`
- Test: `tests/test_blowdown.py`
- Modify: `scripts/requirements.txt`

**Interfaces:**
- Produces: `choked_mass_flux(p_pa, t_k) -> float`, `co2_density(p_pa, t_k) -> float`, `release_temperature_k(p_pa, t_k) -> float`, `segment_inventory_kg(p_pa, t_k, bore_m, length_m) -> float`, `blowdown_series(p_pa, t_k, bore_m, segment_length_m, hole_diameter_m=None, cd=0.62, feed_rate_kgs=95.0, valve_closure_s=930.0, bin_s=30.0, t_end_s=3600.0) -> tuple[list[SourceBin], dict]` where `SourceBin` is a dataclass with `t_start`, `t_end`, `rate_kgs`. The metadata dict has keys `q_peak_kgs`, `tau_s`, `inventory_kg`, `total_released_kg`, `release_temp_k`, `mode` (`"fbr"` or `"puncture"`).

- [x] **Step 1: Add dependencies**

Append to `scripts/requirements.txt`:

```text
CoolProp>=6.6
netCDF4>=1.6
pytest>=8.0
```

Run: `pip install -r scripts/requirements.txt`
Expected: installs without error.

- [x] **Step 2: Create test scaffolding**

`tests/conftest.py`:

```python
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
```

- [x] **Step 3: Write the failing tests**

`tests/test_blowdown.py`:

```python
import pytest

from scripts.rupture_lib.blowdown import (
    blowdown_series,
    choked_mass_flux,
    co2_density,
    release_temperature_k,
    segment_inventory_kg,
)

P = 35e5 + 101325.0  # 35 barg absolute
T = 283.15
BORE = 0.914 - 2 * 0.025
SEG = 16000.0


def test_density_reference():
    assert co2_density(P, T) == pytest.approx(91.8, rel=0.02)


def test_choked_flux_reference():
    assert choked_mass_flux(P, T) == pytest.approx(13774.0, rel=0.03)


def test_inventory_reference():
    assert segment_inventory_kg(P, T, BORE, SEG) == pytest.approx(861_000, rel=0.02)


def test_release_temperature_cold_but_above_sublimation():
    t_exit = release_temperature_k(P, T)
    assert t_exit == pytest.approx(273.15 - 49.4, abs=2.0)
    assert t_exit >= 194.65


def test_fbr_mass_conservation():
    bins, meta = blowdown_series(P, T, BORE, SEG)
    released = sum(b.rate_kgs * (b.t_end - b.t_start) for b in bins)
    # inventory not fully vented within t_end plus valve feed until closure
    import math
    expected = meta["inventory_kg"] * (1 - math.exp(-3600.0 / meta["tau_s"])) + 95.0 * 930.0
    assert released == pytest.approx(expected, rel=1e-3)
    assert released == pytest.approx(meta["total_released_kg"], rel=1e-6)


def test_fbr_peak_and_decay():
    bins, meta = blowdown_series(P, T, BORE, SEG)
    assert meta["q_peak_kgs"] == pytest.approx(10_014, rel=0.03)
    assert meta["tau_s"] == pytest.approx(86.0, rel=0.05)
    rates = [b.rate_kgs for b in bins]
    assert all(a >= b for a, b in zip(rates, rates[1:]))  # never increases


def test_puncture_slow_and_steady():
    bins, meta = blowdown_series(P, T, BORE, SEG, hole_diameter_m=0.05)
    assert meta["mode"] == "puncture"
    assert meta["q_peak_kgs"] == pytest.approx(16.8, rel=0.1)
    # constant until valve closure at 930 s
    early = [b.rate_kgs for b in bins if b.t_end <= 900]
    assert max(early) == pytest.approx(min(early), rel=1e-6)
```

- [x] **Step 4: Run tests to verify they fail**

Run: `python -m pytest tests/test_blowdown.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'scripts.rupture_lib'`

- [x] **Step 5: Implement the module**

`scripts/rupture_lib/__init__.py`: empty file.

`scripts/rupture_lib/blowdown.py`:

```python
"""Gas-phase pipeline blowdown source terms.

Screening-level model: full-bore ruptures follow an exponential decay
whose peak is choked orifice flow at line conditions and whose time
constant conserves segment inventory exactly (effective release rate
approach in the spirit of Jo & Ahn 2003, J. Hazard. Mater. A97).
Punctures are capacity-limited and near constant until valve closure.
Friction-limited late-time flow is not modelled; the sensitivity study
varies tau instead.
"""
from dataclasses import dataclass
from math import exp, pi, sqrt

from CoolProp.CoolProp import PropsSI

R_UNIVERSAL = 8.314462618
M_CO2 = 0.0440098
R_CO2 = R_UNIVERSAL / M_CO2
CO2_SUBLIMATION_K = 194.65
ATM_PA = 101325.0


def co2_density(p_pa: float, t_k: float) -> float:
    return PropsSI("D", "P", p_pa, "T", t_k, "CO2")


def choked_mass_flux(p_pa: float, t_k: float) -> float:
    """Choked mass flux (kg/m2/s) with real-gas gamma and Z.

    Ideal-gas critical-flow formula evaluated with local properties.
    Near the saturation dome gamma is large (about 1.9 at 35 barg,
    10 C) which this captures; full non-ideal nozzle integration is
    beyond screening scope.
    """
    gamma = PropsSI("CPMASS", "P", p_pa, "T", t_k, "CO2") / PropsSI(
        "CVMASS", "P", p_pa, "T", t_k, "CO2"
    )
    z = p_pa / (co2_density(p_pa, t_k) * R_CO2 * t_k)
    return (
        p_pa
        * sqrt(gamma / (z * R_CO2 * t_k))
        * (2.0 / (gamma + 1.0)) ** ((gamma + 1.0) / (2.0 * (gamma - 1.0)))
    )


def release_temperature_k(p_pa: float, t_k: float) -> float:
    """Isenthalpic expansion to 1 atm, clamped at the sublimation point."""
    h = PropsSI("HMASS", "P", p_pa, "T", t_k, "CO2")
    t_exit = PropsSI("T", "P", ATM_PA, "HMASS", h, "CO2")
    return max(t_exit, CO2_SUBLIMATION_K)


def segment_inventory_kg(p_pa: float, t_k: float, bore_m: float, length_m: float) -> float:
    return co2_density(p_pa, t_k) * (pi / 4.0) * bore_m * bore_m * length_m


@dataclass
class SourceBin:
    t_start: float
    t_end: float
    rate_kgs: float


def blowdown_series(
    p_pa: float,
    t_k: float,
    bore_m: float,
    segment_length_m: float,
    hole_diameter_m: float | None = None,
    cd: float = 0.62,
    feed_rate_kgs: float = 95.0,
    valve_closure_s: float = 930.0,
    bin_s: float = 30.0,
    t_end_s: float = 3600.0,
):
    """Transient release rate binned for the TWODEE source file.

    hole_diameter_m None means full-bore rupture: both cut ends vent
    (exit area = 2x bore area) and the upstream network feeds the break
    at the design flow rate until valve closure. A puncture is
    capacity-limited: constant peak rate until closure, exponential
    decay of the isolated inventory afterwards.
    """
    bore_area = (pi / 4.0) * bore_m * bore_m
    inventory = segment_inventory_kg(p_pa, t_k, bore_m, segment_length_m)
    flux = choked_mass_flux(p_pa, t_k)

    if hole_diameter_m is None:
        mode = "fbr"
        q_peak = cd * 2.0 * bore_area * flux
    else:
        mode = "puncture"
        q_peak = cd * (pi / 4.0) * hole_diameter_m * hole_diameter_m * flux

    tau = inventory / q_peak

    def mass_between(t1: float, t2: float) -> float:
        if mode == "fbr":
            decay = inventory * (exp(-t1 / tau) - exp(-t2 / tau))
            feed = feed_rate_kgs * max(0.0, min(t2, valve_closure_s) - min(t1, valve_closure_s))
            return decay + feed
        # puncture: constant until closure, decaying afterwards
        flat = q_peak * max(0.0, min(t2, valve_closure_s) - min(t1, valve_closure_s))
        d1 = max(t1, valve_closure_s) - valve_closure_s
        d2 = max(t2, valve_closure_s) - valve_closure_s
        decay = inventory * (exp(-d1 / tau) - exp(-d2 / tau)) if t2 > valve_closure_s else 0.0
        return flat + decay

    bins: list[SourceBin] = []
    total = 0.0
    t = 0.0
    while t < t_end_s:
        t2 = min(t + bin_s, t_end_s)
        mass = mass_between(t, t2)
        rate = mass / (t2 - t)
        if rate >= 0.5:
            bins.append(SourceBin(t, t2, rate))
            total += mass
        t = t2

    meta = {
        "mode": mode,
        "q_peak_kgs": q_peak,
        "tau_s": tau,
        "inventory_kg": inventory,
        "total_released_kg": total,
        "release_temp_k": release_temperature_k(p_pa, t_k),
    }
    return bins, meta
```

- [x] **Step 6: Run tests to verify they pass**

Run: `python -m pytest tests/test_blowdown.py -v`
Expected: 7 passed. If `test_fbr_mass_conservation` fails by a whisker, the cause is the 0.5 kg/s cutoff dropping tail bins; the expected value in the test integrates to infinity of feed but only to `t_end` of decay, and dropped bins are below 0.1% of total for these parameters, so investigate before touching tolerances.

- [x] **Step 7: Commit**

```bash
git add scripts/rupture_lib tests scripts/requirements.txt
git commit -m "Add gas-phase blowdown source term model"
```

---

### Task 2: TWODEE input file writers

**Files:**
- Create: `scripts/rupture_lib/twodee_io.py`
- Test: `tests/test_twodee_io.py`

**Interfaces:**
- Consumes: `SourceBin` from Task 1.
- Produces: `write_grd(path, array, x0, y0, dx)` (array shape (ny, nx), row 0 = south), `read_grd(path) -> (array, x0, y0, dx)`, `write_wind_uniform(path, u_ms, v_ms, t_ground_c, t_ref_c, duration_s)`, `write_source(path, x_bng, y_bng, bins, patch_m=20.0)`, `write_inp(path, cfg)` where `cfg` is a dict with keys `name, x0, y0, nx, ny, dx, sim_s, out_s, gas_temp_c, station_x, station_y`.

File formats (verified against the TWODEE-2.3 manual and bundled example1):

- GRD is Surfer ASCII: line 1 `DSAA`; line 2 `nx ny`; line 3 `xmin xmax` with `xmax = xmin + (nx-1)*dx` (node registration); line 4 `ymin ymax`; line 5 `zmin zmax`; then ny rows of nx values, bottom row first.
- `wind.dat` (CUP): header `iyr imo idy ihr imi CUP`, then per time slice `t1 t2 wx wy T_z0 T_zref p_hpa`. Stability is inferred from the ground/reference temperature difference at `Z_REFERENCE_(M)`; equal temperatures give neutral, warmer at reference height gives stable.
- `source.dat`: one line per (patch, time bin): `x y rate dx dy KG_SEC t1 t2`.

- [x] **Step 1: Write the failing tests**

`tests/test_twodee_io.py`:

```python
import numpy as np
import pytest

from scripts.rupture_lib.blowdown import SourceBin
from scripts.rupture_lib.twodee_io import (
    read_grd,
    write_grd,
    write_inp,
    write_source,
    write_wind_uniform,
)


def test_grd_round_trip(tmp_path):
    arr = np.arange(12, dtype=float).reshape(3, 4)  # ny=3, nx=4
    p = tmp_path / "t.grd"
    write_grd(p, arr, x0=1000.0, y0=2000.0, dx=10.0)
    lines = p.read_text().splitlines()
    assert lines[0] == "DSAA"
    assert lines[1].split() == ["4", "3"]
    assert [float(v) for v in lines[2].split()] == [1000.0, 1030.0]
    assert [float(v) for v in lines[3].split()] == [2000.0, 2020.0]
    back, x0, y0, dx = read_grd(p)
    np.testing.assert_allclose(back, arr)
    assert (x0, y0, dx) == (1000.0, 2000.0, 10.0)


def test_wind_file_format(tmp_path):
    p = tmp_path / "wind.dat"
    write_wind_uniform(p, u_ms=5.0, v_ms=0.0, t_ground_c=10.0, t_ref_c=10.0, duration_s=1800)
    lines = p.read_text().splitlines()
    assert lines[0].split()[-1] == "CUP"
    t1, t2, wx, wy, tz0, tzr, pr = lines[1].split()
    assert (float(t1), float(t2)) == (0.0, 1800.0)
    assert float(wx) == 5.0 and float(wy) == 0.0
    assert float(pr) == 1013.0


def test_source_mass_preserved(tmp_path):
    bins = [SourceBin(0, 30, 100.0), SourceBin(30, 60, 50.0)]
    p = tmp_path / "source.dat"
    write_source(p, x_bng=326520.0, y_bng=385951.0, bins=bins, patch_m=20.0)
    total = 0.0
    for line in p.read_text().splitlines():
        x, y, rate, dx, dy, units, t1, t2 = line.split()
        assert units == "KG_SEC"
        assert (float(dx), float(dy)) == (20.0, 20.0)
        total += float(rate) * (float(t2) - float(t1))
    assert total == pytest.approx(100.0 * 30 + 50.0 * 30)


def test_inp_contains_required_records(tmp_path):
    p = tmp_path / "twodee.inp"
    write_inp(p, {
        "name": "unit", "x0": 324520.0, "y0": 383951.0, "nx": 400, "ny": 400,
        "dx": 10.0, "sim_s": 1800, "out_s": 60, "gas_temp_c": -49.4,
        "station_x": 326520.0, "station_y": 385951.0,
    })
    text = p.read_text()
    for needle in [
        "PROBLEM_NAME = unit",
        "SIMULATION_INTERVAL_(SEC) = 1800",
        "UTM_DATUM = OSGB_36",
        "DENSE_GAS_DENSITY_20C_(KG/M3)   = 1.839",
        "DOSE_GAS_TOXIC_EXPONENT         = 8.0",
        "WIND_MODEL        = UNIFORM",
        "OUTPUT_NC_FILE_FORMAT  = yes",
        "HEIGHTS_(M)          = 1.5",
        "CRITICAL_C_(%)       = 4 7 10",
    ]:
        assert needle in text, needle
```

- [x] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_twodee_io.py -v`
Expected: FAIL with `ModuleNotFoundError` for `twodee_io`.

- [x] **Step 3: Implement the module**

`scripts/rupture_lib/twodee_io.py`:

```python
"""Writers for TWODEE-2.3 input files. Formats follow the user manual
tables 4 and 5 and the bundled example1."""
from pathlib import Path

import numpy as np


def write_grd(path, array, x0: float, y0: float, dx: float) -> None:
    arr = np.asarray(array, dtype=float)
    ny, nx = arr.shape
    with open(path, "w") as f:
        f.write("DSAA\n")
        f.write(f"{nx} {ny}\n")
        f.write(f"{x0:g} {x0 + (nx - 1) * dx:g}\n")
        f.write(f"{y0:g} {y0 + (ny - 1) * dx:g}\n")
        f.write(f"{arr.min():g} {arr.max():g}\n")
        for row in arr:  # row 0 is the southern edge, as GRD expects
            f.write(" ".join(f"{v:.4f}" for v in row) + "\n")


def read_grd(path):
    lines = Path(path).read_text().split("\n")
    nx, ny = (int(v) for v in lines[1].split())
    xmin, xmax = (float(v) for v in lines[2].split())
    ymin, _ = (float(v) for v in lines[3].split())
    values = " ".join(lines[5:]).split()
    arr = np.array(values, dtype=float).reshape(ny, nx)
    dx = (xmax - xmin) / (nx - 1)
    return arr, xmin, ymin, dx


def write_wind_uniform(path, u_ms, v_ms, t_ground_c, t_ref_c, duration_s,
                       pressure_hpa=1013.0) -> None:
    # Date must match the TIME block written by write_inp.
    with open(path, "w") as f:
        f.write("2026 1 15 6 0 CUP\n")
        f.write(
            f"0 {duration_s:g} {u_ms:g} {v_ms:g} "
            f"{t_ground_c:g} {t_ref_c:g} {pressure_hpa:g}\n"
        )


def write_source(path, x_bng, y_bng, bins, patch_m=20.0) -> None:
    with open(path, "w") as f:
        for b in bins:
            f.write(
                f"{x_bng:.1f} {y_bng:.1f} {b.rate_kgs:.4f} "
                f"{patch_m:.1f} {patch_m:.1f} KG_SEC {b.t_start:g} {b.t_end:g}\n"
            )


INP_TEMPLATE = """ VERSION
   VERSION = 2.3
   PROBLEM_NAME = {name}
   !
 TIME
   YEAR = 2026
   MONTH = 1
   DAY = 15
   HOUR = 6
   MINUTE = 0
   SIMULATION_INTERVAL_(SEC) = {sim_s}
   RESTART_RUN = NO
   !
 GRID
   UTM_ZONE  = 30U
   UTM_DATUM = OSGB_36
   X_ORIGIN_(UTM_M) = {x0}
   Y_ORIGIN_(UTM_M) = {y0}
   NX     = {nx}
   NY     = {ny}
   DX_(M) = {dx}
   DY_(M) = {dx}
   !
 PROPERTIES
   AMBIENT_GAS_DENSITY_20C_(KG/M3) = 1.204
   DENSE_GAS_DENSITY_20C_(KG/M3)   = 1.839
   AVERAGED_TEMPERATURE_(C)        = {gas_temp_c}
   DOSE_GAS_TOXIC_EXPONENT         = 8.0
   !
 METEO
   WIND_MODEL        = UNIFORM
   Z_REFERENCE_(M)   = 10.0
   X_STATION_(UTM_M) = {station_x}
   Y_STATION_(UTM_M) = {station_y}
   !
 FILES
   OUTPUT_DIRECTORY        = outfiles
   TOPOGRAPHY_FILE         = topography.grd
   TOPOGRAPHY_FILE_FORMAT  = GRD
   ROUGHNESS_FILE          = roughness.grd
   ROUGHNESS_FILE_FORMAT   = GRD
   RESTART_FILE            = restart.dat
   SOURCE_FILE             = source.dat
   WIND_FILE               = wind.dat
   TRACK_POINTS            = NO
   TRACK_POINTS_FILE       = points.pts
   TRACK_BOXES             = NO
   TRACK_BOXES_FILE        = boxes.dat
   !
 OUTPUT
   OUTPUT_INTERVAL_(SEC)  = {out_s}
   OUTPUT_GRD_FILE_FORMAT = no
   OUTPUT_NC_FILE_FORMAT  = yes
   OUTPUT_DOMAIN          = yes
   OUTPUT_Z0              = yes
   OUTPUT_SOURCE          = yes
   OUTPUT_METEO           = yes
   OUTPUT_VELOCITY        = yes
   OUTPUT_H               = yes
   OUTPUT_RHO             = yes
   OUTPUT_DOSE            = yes
   OUTPUT_CONCENTRATION   = yes
     HEIGHTS_(M)          = 1.5
     CONCENTRATION_BG     = 420.
   OUTPUT_Z_CRITICAL      = yes
     CRITICAL_C_(%)       = 4 7 10
   OUTPUT_IMPACT          = no
   !
 NUMERIC
   FRONT_FROUDE_NUMBER     = 1.0
   OPTIMAL_COURANT_NUMBER  = 0.25
   EDGE_ENTRAINMENT_COEFF  = 0.0
   DIFFUSION_COEFFICIENT   = 0.20
   SHAPE_PARAMETER         = 0.5
   ZETA_PARAMETER          = 0.0
   ALPHA_2                 = 0.7
   ALPHA_3                 = 1.3
   ALPHA_7                 = 0.45
   VON_KARMAN_CONSTANT     = 0.4
   BRITTER_B_CONSTANT      = 0.11
"""


def write_inp(path, cfg: dict) -> None:
    Path(path).write_text(INP_TEMPLATE.format(**cfg))
```

- [x] **Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_twodee_io.py -v`
Expected: 4 passed.

- [x] **Step 5: Commit**

```bash
git add scripts/rupture_lib/twodee_io.py tests/test_twodee_io.py
git commit -m "Add TWODEE input file writers"
```

---

### Task 3: DEM extraction to GRD

**Files:**
- Create: `scripts/rupture_lib/dem.py`
- Test: `tests/test_dem.py`

**Interfaces:**
- Consumes: `write_grd` from Task 2, `find_tif_files`, `LIDAR_DIR` from `scripts/utils.py`.
- Produces: `dem_to_grd(bounds_bng, res_m, out_path, tif_dir=None) -> np.ndarray` where `bounds_bng` is `(west, south, east, north)`. Returns the bottom-row-first array it wrote. Nodata (sea, gaps) becomes 0.0. GRD node coordinates sit at pixel centres, so `x0 = west + res/2`.

- [x] **Step 1: Write the failing test**

`tests/test_dem.py` (builds a synthetic LIDAR tile so no real data is needed):

```python
import numpy as np
import rasterio
from rasterio.transform import from_origin

from scripts.rupture_lib.dem import dem_to_grd
from scripts.rupture_lib.twodee_io import read_grd


def make_tile(path, west, north, size, res, value):
    data = np.full((size, size), value, dtype=np.float32)
    data[0, 0] = -9999.0  # a nodata hole
    with rasterio.open(
        path, "w", driver="GTiff", height=size, width=size, count=1,
        dtype="float32", crs="EPSG:27700", nodata=-9999.0,
        transform=from_origin(west, north, res, res),
    ) as dst:
        dst.write(data, 1)


def test_dem_to_grd(tmp_path):
    make_tile(tmp_path / "a.tif", west=1000, north=2000, size=100, res=1, value=5.0)
    out = tmp_path / "topo.grd"
    arr = dem_to_grd((1000, 1900, 1100, 2000), res_m=10, out_path=out, tif_dir=tmp_path)
    assert arr.shape == (10, 10)
    assert arr.max() == 5.0
    assert arr.min() == 0.0  # nodata hole filled with 0
    back, x0, y0, dx = read_grd(out)
    np.testing.assert_allclose(back, arr)
    assert x0 == 1005.0 and y0 == 1905.0 and dx == 10.0
```

- [x] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_dem.py -v`
Expected: FAIL with `ModuleNotFoundError` for `dem`.

- [x] **Step 3: Implement the module**

`scripts/rupture_lib/dem.py`:

```python
"""Merge LIDAR tiles for a scenario domain into a TWODEE GRD file."""
import sys
from pathlib import Path

import numpy as np
import rasterio
from rasterio.merge import merge
from shapely.geometry import box

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from scripts.rupture_lib.twodee_io import write_grd
from scripts.utils import LIDAR_DIR, find_tif_files

NODATA = -9999.0


def dem_to_grd(bounds_bng, res_m, out_path, tif_dir=None):
    west, south, east, north = bounds_bng
    domain = box(west, south, east, north)

    tifs = find_tif_files(tif_dir if tif_dir is not None else LIDAR_DIR)
    relevant = []
    for tif in tifs:
        with rasterio.open(tif) as src:
            b = src.bounds
            if box(b.left, b.bottom, b.right, b.top).intersects(domain):
                relevant.append(tif)
    if not relevant:
        raise FileNotFoundError(f"No LIDAR tiles intersect domain {bounds_bng}")

    datasets = [rasterio.open(t) for t in relevant]
    mosaic, _ = merge(
        datasets, bounds=(west, south, east, north),
        res=(res_m, res_m), nodata=NODATA,
    )
    for ds in datasets:
        ds.close()

    dem = mosaic[0].astype(float)
    dem[dem <= NODATA + 1000] = 0.0  # sea and voids sit at sea level
    dem = np.flipud(dem)  # rasterio row 0 is north; GRD wants south first

    write_grd(out_path, dem, x0=west + res_m / 2.0, y0=south + res_m / 2.0, dx=float(res_m))
    return dem
```

- [x] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_dem.py -v`
Expected: 1 passed.

- [x] **Step 5: Commit**

```bash
git add scripts/rupture_lib/dem.py tests/test_dem.py
git commit -m "Add DEM extraction to TWODEE GRD format"
```

---

### Task 4: Scenario definitions and source-term CLI

**Files:**
- Create: `scripts/rupture_lib/scenarios.py`
- Create: `scripts/10_rupture_source.py`
- Test: `tests/test_scenarios.py`

**Interfaces:**
- Consumes: `blowdown_series` from Task 1.
- Produces: `SCENARIOS: dict`, `WEATHER: dict`, `load_pipeline_parameters() -> dict` returning `{"p_pa", "t_k", "bore_m", "segment_length_m", "feed_rate_kgs", "valve_closure_s"}`. CLI writes `data/processed/rupture_sources.json` with one entry per failure mode containing the bins and metadata.

Rupture points are the corridor centreline points nearest each receptor, converted to BNG (EPSG:27700) from `data/manual/corridor_aligned.geojson`:

- Arrowe Park: corridor point 53.3653 N, 3.1057 W = E 326520, N 385951 (hospital at E 326595, N 386061, 130 m away)
- Greasby: corridor point 53.3719 N, 3.1303 W = E 324895, N 386711 (village edge at E 325002, N 386743, 110 m away)

- [x] **Step 1: Write the failing test**

`tests/test_scenarios.py`:

```python
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
```

- [x] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_scenarios.py -v`
Expected: FAIL with `ModuleNotFoundError` for `scenarios`.

- [x] **Step 3: Implement scenarios module**

`scripts/rupture_lib/scenarios.py`:

```python
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
```

- [x] **Step 4: Implement the CLI**

`scripts/10_rupture_source.py`:

```python
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
```

- [x] **Step 5: Run tests to verify they pass**

Run: `python -m pytest tests/test_scenarios.py -v`
Expected: 4 passed.

- [x] **Step 6: Commit**

```bash
git add scripts/rupture_lib/scenarios.py scripts/10_rupture_source.py tests/test_scenarios.py
git commit -m "Add scenario definitions and rupture source CLI"
```

---

### Task 5: NetCDF post-processing to GeoJSON

**Files:**
- Create: `scripts/rupture_lib/postprocess.py`
- Test: `tests/test_postprocess.py`

**Interfaces:**
- Consumes: TWODEE NetCDF output. Variable names (verified against a real run): `x(x)`, `y(y)` in metres BNG; `CM_0150CM(time, y, x)` running-maximum concentration at 1.5 m in vol%; `C_0150CM(time, y, x)` instantaneous concentration in ppm; `DOSE(time, y, x)`.
- Produces: `extract(nc_path, rupture_e, rupture_n, receptor_e, receptor_n, thresholds_pct=(4.0, 7.0, 10.0)) -> (geojson_dict, report_dict)`. GeoJSON features are polygons in WGS84 with properties `threshold_pct` and `kind="max_footprint"`. Report has `footprint_area_km2` per threshold, `max_extent_m` (farthest 4% cell from the rupture point), and `receptor_arrival_s` (first time 4% is reached at the receptor cell, `null` if never).

- [x] **Step 1: Write the failing test**

`tests/test_postprocess.py` builds a tiny synthetic NetCDF mimicking TWODEE's layout:

```python
import numpy as np
from netCDF4 import Dataset

from scripts.rupture_lib.postprocess import extract


def make_nc(path):
    nx, ny, nt = 20, 20, 3
    ds = Dataset(path, "w")
    ds.createDimension("x", nx)
    ds.createDimension("y", ny)
    ds.createDimension("time", nt)
    x = ds.createVariable("x", "f4", ("x",))
    y = ds.createVariable("y", "f4", ("y",))
    x[:] = 1000.0 + 10.0 * np.arange(nx)
    y[:] = 2000.0 + 10.0 * np.arange(ny)
    cm = ds.createVariable("CM_0150CM", "f4", ("time", "y", "x"))
    c = ds.createVariable("C_0150CM", "f4", ("time", "y", "x"))
    cm[:] = 0.0
    c[:] = 0.0
    # a 5x5 block above 4% appearing at the second timestep
    cm[1:, 8:13, 8:13] = 6.0
    cm[1:, 10, 10] = 12.0
    c[1, 8:13, 8:13] = 60000.0
    c[2, 8:13, 8:13] = 60000.0
    ds.close()


def test_extract_polygons_and_arrival(tmp_path):
    p = tmp_path / "run.xy.nc"
    make_nc(p)
    gj, report = extract(
        p, rupture_e=1100.0, rupture_n=2100.0,
        receptor_e=1100.0, receptor_n=2100.0,
        output_interval_s=60,
    )
    kinds = {(f["properties"]["threshold_pct"]) for f in gj["features"]}
    assert 4.0 in kinds and 10.0 in kinds and 7.0 in kinds
    # 5x5 cells of 10 m = 2500 m2 footprint at 4%
    assert report["footprint_area_km2"]["4.0"] == 0.0025
    assert report["footprint_area_km2"]["10.0"] == 0.0001
    # receptor is inside the block; 4% first exceeded at t index 1
    assert report["receptor_arrival_s"] == 60
    # geometry must be WGS84 (values near lon -7.5, lat 49.8 for these
    # fake BNG coords near the false origin)
    lon, lat = gj["features"][0]["geometry"]["coordinates"][0][0]
    assert -10 < lon < 0 and 49 < lat < 51


def test_no_exceedance_gives_empty(tmp_path):
    p = tmp_path / "quiet.xy.nc"
    nxy = 5
    ds = Dataset(p, "w")
    ds.createDimension("x", nxy)
    ds.createDimension("y", nxy)
    ds.createDimension("time", 2)
    for nm, dims in (("x", ("x",)), ("y", ("y",))):
        v = ds.createVariable(nm, "f4", dims)
        v[:] = 10.0 * np.arange(nxy)
    for nm in ("CM_0150CM", "C_0150CM"):
        v = ds.createVariable(nm, "f4", ("time", "y", "x"))
        v[:] = 0.0
    ds.close()
    gj, report = extract(p, 20, 20, 20, 20, output_interval_s=60)
    assert gj["features"] == []
    assert report["receptor_arrival_s"] is None
```

- [x] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_postprocess.py -v`
Expected: FAIL with `ModuleNotFoundError` for `postprocess`.

- [x] **Step 3: Implement the module**

`scripts/rupture_lib/postprocess.py`:

```python
"""Convert TWODEE NetCDF output into WGS84 GeoJSON contours and a
run report."""
import json

import numpy as np
from affine import Affine
from netCDF4 import Dataset
from rasterio import features
from shapely.geometry import mapping, shape
from shapely.ops import transform as shp_transform
from pyproj import Transformer

_TO_WGS84 = Transformer.from_crs("EPSG:27700", "EPSG:4326", always_xy=True).transform


def _mask_polygons(mask, x, y):
    """Polygonize a boolean mask on TWODEE's node grid (y ascending)."""
    dx = float(x[1] - x[0])
    dy = float(y[1] - y[0])
    flipped = np.flipud(mask).astype(np.uint8)
    transform = Affine(dx, 0.0, float(x[0]) - dx / 2.0,
                       0.0, -dy, float(y[-1]) + dy / 2.0)
    polys = []
    for geom, value in features.shapes(flipped, transform=transform):
        if value == 1:
            polys.append(shape(geom))
    return polys


def extract(nc_path, rupture_e, rupture_n, receptor_e, receptor_n,
            output_interval_s, thresholds_pct=(4.0, 7.0, 10.0)):
    ds = Dataset(nc_path)
    x = np.array(ds.variables["x"][:], dtype=float)
    y = np.array(ds.variables["y"][:], dtype=float)
    cm_final = np.array(ds.variables["CM_0150CM"][-1, :, :], dtype=float)  # vol%
    c_ts = np.array(ds.variables["C_0150CM"][:, :, :], dtype=float)        # ppm
    ds.close()

    cell_km2 = (x[1] - x[0]) * (y[1] - y[0]) / 1e6
    feats = []
    areas = {}
    for th in thresholds_pct:
        mask = cm_final >= th
        areas[str(th)] = round(float(mask.sum()) * cell_km2, 4)
        for poly in _mask_polygons(mask, x, y):
            feats.append({
                "type": "Feature",
                "geometry": mapping(shp_transform(_TO_WGS84, poly)),
                "properties": {"kind": "max_footprint", "threshold_pct": th},
            })

    # farthest cell above 4% from the rupture point
    mask4 = cm_final >= thresholds_pct[0]
    if mask4.any():
        yy, xx = np.nonzero(mask4)
        d = np.hypot(x[xx] - rupture_e, y[yy] - rupture_n)
        max_extent = float(d.max())
    else:
        max_extent = 0.0

    # arrival of 4% (40,000 ppm) at the receptor cell
    ix = int(np.argmin(np.abs(x - receptor_e)))
    iy = int(np.argmin(np.abs(y - receptor_n)))
    exceed = np.nonzero(c_ts[:, iy, ix] >= 40000.0)[0]
    arrival = int(exceed[0]) * output_interval_s if exceed.size else None

    geojson = {"type": "FeatureCollection", "features": feats}
    report = {
        "footprint_area_km2": areas,
        "max_extent_m": max_extent,
        "receptor_arrival_s": arrival,
    }
    return geojson, report
```

Note: `affine` is a rasterio dependency, already installed.

- [x] **Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_postprocess.py -v`
Expected: 2 passed.

- [x] **Step 5: Commit**

```bash
git add scripts/rupture_lib/postprocess.py tests/test_postprocess.py
git commit -m "Add NetCDF to GeoJSON post-processing"
```

---

### Task 6: TWODEE build script, run driver, and physics acceptance tests

**Files:**
- Create: `scripts/setup_twodee.sh`
- Create: `scripts/11_rupture_dispersion.py`
- Test: `tests/test_twodee_integration.py`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: everything from Tasks 1 to 5.
- Produces: CLI `python scripts/11_rupture_dispersion.py --scenario arrowe_park_test --mode fbr --weather d5` which assembles `data/processed/rupture_runs/<scenario>_<mode>_<weather>/`, runs the binary at `$TWODEE_BIN` (default `third_party/twodee-2.3/src/twodee`), and writes `data/processed/rupture_scenarios/<scenario>_<mode>_<weather>.geojson` plus `..._report.json`. Also `run_twodee(run_dir, twodee_bin) -> str` (returns stdout, raises on failure or missing "NORMAL TERMINATION").

- [x] **Step 1: Add gitignore entries**

Append to `.gitignore`:

```text
# TWODEE build and run directories (large binaries and NetCDF)
third_party/
data/processed/rupture_runs/
```

- [x] **Step 2: Write the build script**

`scripts/setup_twodee.sh`:

```bash
#!/usr/bin/env bash
# Download and build TWODEE-2.3 into third_party/.
# Requires: gfortran, libnetcdff-dev (Debian/Ubuntu: sudo apt-get install gfortran libnetcdff-dev)
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p third_party
cd third_party
if [ ! -d twodee-2.3 ]; then
  curl -sL -o twodee-2.3.zip "https://digital.csic.es/bitstream/10261/241390/1/twodee-2.3.zip"
  unzip -q twodee-2.3.zip
  rm twodee-2.3.zip
fi
cd twodee-2.3
chmod +x configure autoconf/*
NETCDF_INC="$(nf-config --includedir)" NETCDF_LIB="$(nf-config --prefix)/lib" ./configure -q
make -s
echo "TWODEE binary: $(pwd)/src/twodee"
```

Run: `bash scripts/setup_twodee.sh`
Expected: last line prints the binary path. Then `export TWODEE_BIN=$PWD/third_party/twodee-2.3/src/twodee`.

- [x] **Step 3: Write the failing integration tests**

`tests/test_twodee_integration.py`. These run the real binary on synthetic terrain and assert physical invariants. They are the core non-expert validation and must stay green forever.

```python
import os
import subprocess
from pathlib import Path

import numpy as np
import pytest
from netCDF4 import Dataset

from scripts.rupture_lib.blowdown import SourceBin
from scripts.rupture_lib.twodee_io import write_grd, write_inp, write_source, write_wind_uniform

TWODEE_BIN = os.environ.get("TWODEE_BIN")
pytestmark = pytest.mark.skipif(not TWODEE_BIN, reason="TWODEE_BIN not set")

NX = NY = 100
DX = 10.0
X0 = Y0 = 0.0
CX = X0 + NX * DX / 2.0  # source at domain centre
CY = Y0 + NY * DX / 2.0


def build_run(run_dir, topo, u_ms, v_ms):
    run_dir.mkdir(parents=True)
    (run_dir / "outfiles").mkdir()
    write_grd(run_dir / "topography.grd", topo, X0 + DX / 2, Y0 + DX / 2, DX)
    write_grd(run_dir / "roughness.grd", np.full((NY, NX), 0.1), X0 + DX / 2, Y0 + DX / 2, DX)
    write_wind_uniform(run_dir / "wind.dat", u_ms, v_ms, 10.0, 10.0, 900)
    write_source(run_dir / "source.dat", CX, CY, [SourceBin(0, 600, 200.0)])
    write_inp(run_dir / "twodee.inp", {
        "name": "itest", "x0": X0, "y0": Y0, "nx": NX, "ny": NY, "dx": DX,
        "sim_s": 900, "out_s": 300, "gas_temp_c": -49.0,
        "station_x": CX, "station_y": CY,
    })
    out = subprocess.run(
        [TWODEE_BIN, "twodee.inp"], cwd=run_dir,
        capture_output=True, text=True, timeout=1200,
    )
    assert out.returncode == 0, out.stdout + out.stderr
    assert "NORMAL TERMINATION" in out.stdout
    ds = Dataset(run_dir / "outfiles" / "itest.xy.nc")
    cm = np.array(ds.variables["CM_0150CM"][-1, :, :])
    x = np.array(ds.variables["x"][:])
    y = np.array(ds.variables["y"][:])
    ds.close()
    return cm, x, y


def centroid(cm, x, y, floor=0.5):
    mask = cm >= floor
    assert mask.any(), "no cloud above floor concentration"
    yy, xx = np.nonzero(mask)
    w = cm[yy, xx]
    return float((x[xx] * w).sum() / w.sum()), float((y[yy] * w).sum() / w.sum())


def test_flat_terrain_plume_travels_downwind(tmp_path):
    cm, x, y = build_run(tmp_path / "flat", np.zeros((NY, NX)), u_ms=3.0, v_ms=0.0)
    cx, cy = centroid(cm, x, y)
    assert cx > CX + 50.0, "cloud centroid should sit downwind (+x) of the source"
    mask = cm >= 0.5
    downwind = x[np.nonzero(mask)[1]].max() - CX
    upwind = CX - x[np.nonzero(mask)[1]].min()
    assert downwind > upwind, "downwind extent must exceed upwind extent"


def test_sloped_terrain_cloud_flows_downhill(tmp_path):
    # 3% slope descending toward the south, near-zero wind
    rows = np.arange(NY, dtype=float) * DX * 0.03  # row 0 (south) lowest
    topo = np.tile(rows[:, None], (1, NX))
    cm, x, y = build_run(tmp_path / "slope", topo, u_ms=0.1, v_ms=0.0)
    _, cy = centroid(cm, x, y)
    assert cy < CY - 50.0, "cloud centroid should move downhill (-y)"
```

- [x] **Step 4: Run the integration tests**

Run: `export TWODEE_BIN=$PWD/third_party/twodee-2.3/src/twodee && python -m pytest tests/test_twodee_integration.py -v`
Expected: 2 passed, several minutes total. If `NORMAL TERMINATION` is missing, read the TWODEE stdout in the assertion message; the usual causes are a source point outside the grid or a mismatch between the wind.dat date header and the TIME block.

- [x] **Step 5: Write the run driver CLI**

`scripts/11_rupture_dispersion.py`:

```python
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

from scripts.rupture_lib.blowdown import SourceBin, blowdown_series
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
    if out.returncode != 0 or "NORMAL TERMINATION" not in out.stdout:
        raise RuntimeError(f"TWODEE failed:\n{out.stdout}\n{out.stderr}")
    return out.stdout


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scenario", required=True, choices=sorted(SCENARIOS))
    ap.add_argument("--mode", default="fbr", choices=["fbr", "puncture"])
    ap.add_argument("--weather", default="d5", choices=sorted(WEATHER))
    ap.add_argument("--twodee-bin", default=os.environ.get("TWODEE_BIN", str(DEFAULT_BIN)))
    args = ap.parse_args()

    s = SCENARIOS[args.scenario]
    w = WEATHER[args.weather]
    name = f"{args.scenario}_{args.mode}_{args.weather}"
    run_dir = PROCESSED_DIR / "rupture_runs" / name
    if run_dir.exists():
        shutil.rmtree(run_dir)
    (run_dir / "outfiles").mkdir(parents=True)

    west, south = s["x0"], s["y0"]
    east = west + s["nx"] * s["dx"]
    north = south + s["ny"] * s["dx"]
    dem_to_grd((west, south, east, north), s["dx"], run_dir / "topography.grd")
    write_grd(run_dir / "roughness.grd",
              np.full((s["ny"], s["nx"]), 0.1),
              west + s["dx"] / 2, south + s["dx"] / 2, s["dx"])

    p = load_pipeline_parameters()
    bins, meta = blowdown_series(
        p["p_pa"], p["t_k"], p["bore_m"], p["segment_length_m"],
        hole_diameter_m=None if args.mode == "fbr" else 0.05,
        feed_rate_kgs=p["feed_rate_kgs"], valve_closure_s=p["valve_closure_s"],
        t_end_s=float(s["sim_s"]),
    )
    write_source(run_dir / "source.dat", s["rupture_e"], s["rupture_n"], bins)
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

    out_dir = PROCESSED_DIR / "rupture_scenarios"
    out_dir.mkdir(exist_ok=True)
    (out_dir / f"{name}.geojson").write_text(json.dumps(geojson))
    (out_dir / f"{name}_report.json").write_text(json.dumps(report, indent=1))
    print(f"Footprint km2 by threshold: {report['footprint_area_km2']}")
    print(f"Receptor arrival of 4% cloud: {report['receptor_arrival_s']} s")
    print(f"Wrote {out_dir / name}.geojson")


if __name__ == "__main__":
    main()
```

- [x] **Step 6: Commit**

```bash
git add scripts/setup_twodee.sh scripts/11_rupture_dispersion.py tests/test_twodee_integration.py .gitignore
git commit -m "Add TWODEE build script, run driver, and physics acceptance tests"
```

---

### Task 7: Arrowe Park test scenario end to end

Requires LIDAR tiles and the built binary. Run on the maintainer's machine or an environment with `data/raw/dem/lidar_composite_1m/` populated.

- [x] **Step 1: Generate source terms**

Run: `python scripts/10_rupture_source.py`
Expected: prints fbr peak near 10,000 kg/s and roughly 950 t released; puncture near 17 kg/s. Writes `data/processed/rupture_sources.json`.

- [x] **Step 2: Run the four test-case combinations**

```bash
python scripts/11_rupture_dispersion.py --scenario arrowe_park_test --mode fbr --weather d5
python scripts/11_rupture_dispersion.py --scenario arrowe_park_test --mode fbr --weather f2
python scripts/11_rupture_dispersion.py --scenario arrowe_park_test --mode fbr --weather sw4
python scripts/11_rupture_dispersion.py --scenario arrowe_park_test --mode puncture --weather d5
```

Expected: each prints footprint areas and receptor arrival, and writes GeoJSON plus report to `data/processed/rupture_scenarios/`.

- [x] **Step 3: Eyeball checklist (record answers in the commit message)**

Load each GeoJSON over the corridor layer (drag onto geojson.io or the app map) and confirm:

1. Contours are centred on the rupture point, not offset by hundreds of metres (would indicate a coordinate or registration bug).
2. The f2 (stable, low wind) footprint is larger than d5. Dense gas spreads farther when mixing is weak; if d5 is larger, something is wrong.
3. The footprint hugs low ground and drains along the valleys visible in `topo_sinks.geojson`, and does not climb ridges.
4. The puncture footprint is far smaller than any FBR footprint.
5. The 10% contour sits inside the 7% contour, which sits inside the 4% contour.

- [x] **Step 4: Commit the artifacts**

```bash
git add data/processed/rupture_scenarios/
git commit -m "Add Arrowe Park test scenario results"
```

---

### Task 8: Greasby scenario

- [x] **Step 1: Run the matrix**

```bash
python scripts/11_rupture_dispersion.py --scenario greasby --mode fbr --weather d5
python scripts/11_rupture_dispersion.py --scenario greasby --mode fbr --weather f2
python scripts/11_rupture_dispersion.py --scenario greasby --mode fbr --weather sw4
python scripts/11_rupture_dispersion.py --scenario greasby --mode puncture --weather d5
```

Expected: four GeoJSON and report pairs. The 8 x 8 km domain at 20 m runs longer than the test case; expect tens of minutes per run.

- [x] **Step 2: Repeat the Task 7 eyeball checklist for Greasby.**

- [x] **Step 3: Sensitivity runs**

Use `--pressure-barg` with `--tag` rather than editing the cited parameters file, so the base case and the sensitivity runs coexist and every report records the pressure it used:

```bash
python scripts/11_rupture_dispersion.py --scenario greasby --mode fbr --weather f2 --pressure-barg 20 --tag p20
python scripts/11_rupture_dispersion.py --scenario greasby --mode fbr --weather f2 --pressure-barg 43 --tag p43
```

The plan originally specified 45 barg for the upper bound. That is not a
valid gas-phase state: CO2 saturates at 44.01 barg at the assumed 10 C
ground temperature, so 45 barg would be liquid at 863 kg/m3 against 92
kg/m3 at the base case. `blowdown_series` raises `GasPhaseError` for it.
The upper bound is 43 barg, just inside the gas-phase envelope.

Result: 0.59 km2 at 20 barg, 2.10 km2 at 35 barg, 2.66 km2 at 43 barg.
The published material must state results as this range, not the base case alone.

- [x] **Step 4: Commit**

```bash
git add data/processed/rupture_scenarios/
git commit -m "Add Greasby scenario results with pressure sensitivity"
```

---

## Explicitly deferred

- Frontend scenario picker and animated cloud layer: separate plan once these artifacts exist.
- Britter-McQuaid workbook cross-check: needs the published correlation constants (Britter & McQuaid 1988, HSE CRR; also reproduced in the TNO Yellow Book). Do not implement from memory.
- Thorney Island quantitative benchmark and Satartia qualitative comparison: validation work after the pipeline produces output.
- Meteorology from MIDAS/NOAA for site-specific wind roses: the three design weather cases stand in until then.
- Spatially varying roughness from UKCEH land cover.

## Self-review notes

- Interfaces checked: `SourceBin` fields (`t_start`, `t_end`, `rate_kgs`) match between Tasks 1, 2, 5, 6. `write_inp` cfg keys match between Tasks 2 and 6. `extract` signature matches between Tasks 5 and 6 (including `output_interval_s`).
- The GRD writer places node coordinates at pixel centres and `dem_to_grd` passes `west + res/2`; the postprocess transform reverses the same half-cell convention.
- TWODEE reads sources and terrain independently of the computational grid and interpolates conservatively, so small registration differences do not lose mass.
- Known simplifications are documented in module docstrings and surface in every report JSON via `assumptions`.
