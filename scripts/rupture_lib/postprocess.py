"""Convert TWODEE NetCDF output into WGS84 GeoJSON contours and a
run report."""
import numpy as np
from affine import Affine
from netCDF4 import Dataset
from pyproj import Transformer
from rasterio import features
from shapely.geometry import mapping, shape
from shapely.ops import transform as shp_transform

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
            output_interval_s, thresholds_pct=(4.0, 7.0, 10.0),
            receptor_radius_m=50.0):
    ds = Dataset(nc_path)
    x = np.array(ds.variables["x"][:], dtype=float)
    y = np.array(ds.variables["y"][:], dtype=float)
    cm_final = np.array(ds.variables["CM_0150CM"][-1, :, :], dtype=float)  # vol%
    c_ts = np.array(ds.variables["C_0150CM"][:, :, :], dtype=float)        # ppm
    ds.close()

    cell_km2 = float(x[1] - x[0]) * float(y[1] - y[0]) / 1e6
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

    # Arrival of 4% (40,000 ppm) at the receptor. A hospital or village
    # is not a point, and the cloud edge is steep enough that a single
    # cell can read background while cells tens of metres away are well
    # above 4%. Sample the worst cell within receptor_radius_m instead.
    # radius 0 falls back to the single nearest cell.
    ix = int(np.argmin(np.abs(x - receptor_e)))
    iy = int(np.argmin(np.abs(y - receptor_n)))
    if receptor_radius_m > 0:
        xx, yy = np.meshgrid(x, y)
        near = np.hypot(xx - receptor_e, yy - receptor_n) <= receptor_radius_m
        if not near.any():
            near[iy, ix] = True
    else:
        near = np.zeros(cm_final.shape, dtype=bool)
        near[iy, ix] = True

    # first output step where any cell in the receptor area reaches 4%
    over = (c_ts >= 40000.0) & near[None, :, :]
    exceed = np.nonzero(over.any(axis=(1, 2)))[0]
    arrival = int(exceed[0]) * output_interval_s if exceed.size else None

    geojson = {"type": "FeatureCollection", "features": feats}
    report = {
        "footprint_area_km2": areas,
        "max_extent_m": max_extent,
        "receptor_arrival_s": arrival,
        "receptor_max_pct": round(float(cm_final[near].max()), 3),
        "receptor_radius_m": float(receptor_radius_m),
    }
    return geojson, report
