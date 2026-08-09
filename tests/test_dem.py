import numpy as np
import rasterio
from rasterio.transform import from_origin

from scripts.rupture_lib.dem import dem_to_grd
from scripts.rupture_lib.twodee_io import read_grd


def make_tile(path, west, north, size, res, value):
    data = np.full((size, size), value, dtype=np.float32)
    data[0:20, 0:20] = -9999.0  # a nodata hole large enough to survive downsampling
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
    # domain padded by one cell on each side so the DEM overhangs it
    assert arr.shape == (12, 12)
    assert arr.max() == 5.0
    assert arr.min() == 0.0  # nodata hole and padding filled with 0
    back, x0, y0, dx = read_grd(out)
    np.testing.assert_allclose(back, arr)
    assert x0 == 995.0 and y0 == 1895.0 and dx == 10.0
    # DEM node extent covers the full domain
    assert x0 <= 1000.0 and x0 + (arr.shape[1] - 1) * dx >= 1100.0
