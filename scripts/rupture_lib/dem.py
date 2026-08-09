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
    """Write a GRD covering bounds_bng padded by one cell on each side.

    TWODEE aborts if any computational node falls outside the DEM node
    extent, so the DEM must overhang the domain. Nodes sit at pixel
    centres; padding by one cell puts the first node half a cell
    outside the domain corner.
    """
    west, south, east, north = bounds_bng
    west, south, east, north = west - res_m, south - res_m, east + res_m, north + res_m
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
