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
