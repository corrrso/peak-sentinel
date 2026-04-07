"""Shared utilities for Peak Cluster data pipeline scripts."""

import geopandas as gpd
from pathlib import Path

CRS_WGS84 = "EPSG:4326"
CRS_BNG = "EPSG:27700"  # British National Grid — meters

DATA_DIR = Path(__file__).parent.parent / "data"
MANUAL_DIR = DATA_DIR / "manual"
PROCESSED_DIR = DATA_DIR / "processed"
RAW_DIR = DATA_DIR / "raw"
LIDAR_DIR = RAW_DIR / "dem" / "lidar_composite_1m"


def load_geojson(path):
    """Load a GeoJSON file as a GeoDataFrame."""
    return gpd.read_file(path)


def save_geojson(gdf, path):
    """Save a GeoDataFrame as WGS84 GeoJSON."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    out = gdf.to_crs(CRS_WGS84) if gdf.crs and gdf.crs != CRS_WGS84 else gdf
    out.to_file(path, driver="GeoJSON")
    print(f"  Saved {path.name}: {len(out)} features")


def to_bng(gdf):
    """Reproject to British National Grid (EPSG:27700) for metric operations."""
    return gdf.to_crs(CRS_BNG)


def to_wgs84(gdf):
    """Reproject to WGS84 (EPSG:4326) for frontend consumption."""
    return gdf.to_crs(CRS_WGS84)


def buffer_meters(gdf, distance):
    """Buffer geometries by distance in meters (via BNG projection)."""
    bng = to_bng(gdf)
    bng["geometry"] = bng.geometry.buffer(distance)
    return bng


def clip_to_corridor(gdf, corridor_gdf, buffer_km=2.0):
    """Clip features to within buffer_km of the corridor polygon."""
    corridor_bng = to_bng(corridor_gdf)
    buffered = corridor_bng.copy()
    buffered["geometry"] = buffered.geometry.buffer(buffer_km * 1000)
    clip_area = buffered.union_all()

    gdf_bng = to_bng(gdf)
    mask = gdf_bng.intersects(clip_area)
    return gdf[mask].copy()


def load_corridor():
    """Load the aligned corridor polygon(s) from data/manual/."""
    path = MANUAL_DIR / "corridor_aligned.geojson"
    if not path.exists():
        raise FileNotFoundError(
            f"Missing {path}. Run the alignment tool first."
        )
    return load_geojson(path)


def find_tif_files(dem_dir=None):
    """Find all .tif DEM files recursively, filtering out auxiliary files."""
    if dem_dir is None:
        dem_dir = LIDAR_DIR
    tifs = sorted(dem_dir.glob("**/*.tif"))
    return [t for t in tifs if not t.name.endswith((".aux.xml", ".tif.xml"))]


def find_column(df, *patterns):
    """Find a DataFrame column whose lowercased name matches any pattern.

    Returns the first matching column name, or None if no match is found.
    """
    for col in df.columns:
        col_lower = col.lower()
        for pattern in patterns:
            if pattern in col_lower or col_lower == pattern:
                return col
    return None
