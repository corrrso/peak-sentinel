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


def test_receptor_radius_catches_a_near_miss(tmp_path):
    """A receptor one cell outside the cloud edge is still a hit.

    Sampling a hospital or village as a single grid cell turns a steep
    cloud edge into a false negative. The receptor radius reports the
    worst concentration over the footprint of the place instead.
    """
    p = tmp_path / "nearmiss.xy.nc"
    make_nc(p)
    # Block spans x,y indices 8..12, so 1130/2130 is one cell clear of it.
    _, single_cell = extract(
        p, rupture_e=1100.0, rupture_n=2100.0,
        receptor_e=1130.0, receptor_n=2130.0,
        output_interval_s=60, receptor_radius_m=0.0,
    )
    assert single_cell["receptor_arrival_s"] is None
    assert single_cell["receptor_max_pct"] == 0.0

    _, with_radius = extract(
        p, rupture_e=1100.0, rupture_n=2100.0,
        receptor_e=1130.0, receptor_n=2130.0,
        output_interval_s=60, receptor_radius_m=50.0,
    )
    assert with_radius["receptor_arrival_s"] == 60
    # the 12% peak cell is 42 m away, inside the radius
    assert with_radius["receptor_max_pct"] == 12.0
    assert with_radius["receptor_radius_m"] == 50.0


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
