import os
import subprocess

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


def padded_grd(path, arr):
    """TWODEE needs the DEM and roughness node extents to overhang the
    computational domain, so pad one cell on each side."""
    p = np.pad(np.asarray(arr, dtype=float), 1, mode="edge")
    write_grd(path, p, X0 - DX / 2, Y0 - DX / 2, DX)


def build_run(run_dir, topo, u_ms, v_ms):
    run_dir.mkdir(parents=True)
    (run_dir / "outfiles").mkdir()
    padded_grd(run_dir / "topography.grd", topo)
    padded_grd(run_dir / "roughness.grd", np.full((NY, NX), 0.1))
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
    # TWODEE exits 0 and prints "ABNORMAL TERMINATION" on errors, and
    # that string contains "NORMAL TERMINATION", so check both ways.
    assert "ABNORMAL" not in out.stdout, out.stdout
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
