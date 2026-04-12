"""
extract_all_sheets.py — Georeference corridor from all 6 EIA detail sheets.

For each sheet (1.2B through 1.2G):
  1. Load image, extract ALL red features via HSV thresholding
  2. Compute overdetermined least-squares affine transform from 8-12 control points
  3. Transform pixel polygons to WGS84 coordinates
  4. Output combined corridor_aligned.geojson

No manual alignment needed. Control points are hardcoded town positions
identified from the map images.

Usage:
    python scripts/extract_all_sheets.py
"""

import cv2
import numpy as np
import json
from pathlib import Path

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
OUT_DIR = Path(__file__).parent.parent / "data" / "manual"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ── HSV thresholds for red corridor boundary ──────────────────────────────
HSV_LOW1 = np.array([0, 30, 70])
HSV_HIGH1 = np.array([14, 255, 255])
HSV_LOW2 = np.array([166, 30, 70])
HSV_HIGH2 = np.array([180, 255, 255])

# Minimum contour area in pixels — small enough to catch coastal features
MIN_CONTOUR_AREA = 800
# Polygon simplification epsilon (pixels)
SIMPLIFY_EPSILON = 2.5

# ── Sheet definitions ─────────────────────────────────────────────────────
# Each sheet has:
#   file: source image filename
#   name: human-readable name for the GeoJSON feature
#   legend_frac: fraction of image width where legend starts (mask out)
#   border: (top, bottom, left) pixel margins to mask
#   control_points: [(px_x, px_y, longitude, latitude), ...]
#     Pixel positions are approximate — identified from town labels in images.
#     Geographic coordinates are known WGS84 positions.

SHEETS = [
    {
        "id": "1.2G",
        "file": "fig1_2G_wirral.png",
        "name": "Scoping Boundary — Figure 1.2G — Wirral",
        "legend_frac": 0.80,
        "border": (30, 30, 0),
        "control_points": [
            # (px_x, px_y, longitude, latitude)
            # Wirral peninsula — 2634x1862 image
            (340, 540, -3.179, 53.393),   # Hoylake
            (370, 720, -3.183, 53.373),   # West Kirby
            (500, 980, -3.098, 53.329),   # Heswall
            (730, 1530, -3.063, 53.290),  # Neston
            (1050, 300, -3.023, 53.424),  # Wallasey
            (1250, 580, -3.023, 53.393),  # Birkenhead
            (1380, 830, -3.003, 53.354),  # Bebington
            (1430, 260, -2.990, 53.456),  # Bootle
            (890, 620, -3.110, 53.407),   # Moreton
        ],
    },
    {
        "id": "1.2F",
        "file": "fig1_2F_chester.png",
        "name": "Scoping Boundary — Figure 1.2F — Chester",
        "legend_frac": 0.80,
        "border": (30, 30, 0),
        "control_points": [
            # Chester area — 2634x1862 image
            (146, 200, -2.960, 53.310),   # Hooton
            (800, 600, -2.780, 53.240),   # Waverton area
            (1895, 1500, -2.540, 53.140), # Tiverton
            (350, 350, -2.900, 53.280),   # Ellesmere Port
            (600, 300, -2.790, 53.270),   # Helsby
            (900, 350, -2.720, 53.275),   # Frodsham
            (500, 750, -2.870, 53.195),   # Chester (south side)
            (1300, 1050, -2.620, 53.180), # Tarporley area
        ],
    },
    {
        "id": "1.2E",
        "file": "fig1_2E.png",
        "name": "Scoping Boundary — Figure 1.2E — Middlewich",
        "legend_frac": 0.82,
        "border": (30, 30, 0),
        "control_points": [
            # Mid-Cheshire south — 2788x1940 image
            (750, 380, -2.518, 53.258),   # Northwich
            (600, 500, -2.527, 53.192),   # Winsford
            (900, 700, -2.444, 53.191),   # Middlewich
            (1400, 800, -2.369, 53.155),  # Sandbach
            (1700, 600, -2.350, 53.200),  # Holmes Chapel
            (600, 1300, -2.441, 53.099),  # Crewe
            (400, 1200, -2.519, 53.066),  # Nantwich
            (300, 700, -2.600, 53.195),   # Winsford west
        ],
    },
    {
        "id": "1.2C",
        "file": "fig1_2C.png",
        "name": "Scoping Boundary — Figure 1.2C — Macclesfield",
        "legend_frac": 0.82,
        "border": (30, 30, 0),
        "control_points": [
            # East Cheshire — 2788x1940 image
            (500, 100, -2.152, 53.377),   # Cheadle Hulme
            (350, 180, -2.163, 53.359),   # Bramhall
            (600, 350, -2.234, 53.327),   # Wilmslow
            (800, 350, -2.125, 53.361),   # Poynton
            (1000, 650, -2.098, 53.296),  # Bollington
            (1050, 1050, -2.125, 53.260), # Macclesfield
            (700, 1500, -2.213, 53.163),  # Congleton
            (1800, 500, -1.900, 53.340),  # NE area (Whaley Bridge approach)
        ],
    },
    {
        "id": "1.2B",
        "file": "fig1_2B.png",
        "name": "Scoping Boundary — Figure 1.2B — Peak District",
        "legend_frac": 0.82,
        "border": (30, 30, 0),
        "control_points": [
            # Peak District — 2788x1940 image
            (130, 440, -2.000, 53.367),   # New Mills
            (350, 550, -1.988, 53.331),   # Whaley Bridge
            (420, 660, -1.917, 53.327),   # Chapel-en-le-Frith
            (850, 1350, -1.911, 53.259),  # Buxton
            (1500, 700, -1.730, 53.348),  # Hope
            (1300, 750, -1.777, 53.343),  # Castleton
            (700, 900, -1.870, 53.310),   # Peak Forest area
            (1700, 700, -1.680, 53.345),  # Hathersage area
        ],
    },
    {
        "id": "1.2D",
        "file": "fig1_2D.png",
        "name": "Scoping Boundary — Figure 1.2D — Leek / Cauldon",
        "legend_frac": 0.82,
        "border": (30, 30, 0),
        "control_points": [
            # Staffordshire — 2788x1940 image
            (100, 200, -2.000, 53.150),   # NW route entry (Rushton area)
            (600, 500, -2.017, 53.140),   # Rudyard
            (1100, 850, -1.983, 53.108),  # Leek
            (900, 1000, -1.980, 53.088),  # Cheddleton
            (1400, 1200, -1.915, 53.065), # Ipstones area
            (1800, 1650, -1.850, 53.055), # Cauldon
            (350, 600, -1.990, 53.120),   # Tittesworth area
            (1600, 1400, -1.880, 53.060), # Waterhouses area
        ],
    },
]


def extract_red_mask(img, legend_x, border_top, border_bottom, border_left):
    """Extract red pixels via HSV thresholding."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    mask1 = cv2.inRange(hsv, HSV_LOW1, HSV_HIGH1)
    mask2 = cv2.inRange(hsv, HSV_LOW2, HSV_HIGH2)
    red_mask = mask1 | mask2

    # Mask out legend and borders
    red_mask[:, legend_x:] = 0
    red_mask[:border_top, :] = 0
    if border_bottom > 0:
        red_mask[-border_bottom:, :] = 0
    if border_left > 0:
        red_mask[:, :border_left] = 0

    # Morphological closing to connect broken boundary pixels
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    red_mask = cv2.morphologyEx(red_mask, cv2.MORPH_CLOSE, kernel, iterations=3)

    return red_mask


def extract_contours(red_mask):
    """Find and simplify all contours above minimum area."""
    contours, _ = cv2.findContours(
        red_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    results = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < MIN_CONTOUR_AREA:
            continue
        simplified = cv2.approxPolyDP(cnt, SIMPLIFY_EPSILON, True)
        pts = [(int(p[0][0]), int(p[0][1])) for p in simplified]
        results.append({"points": pts, "area": area})

    results.sort(key=lambda x: x["area"], reverse=True)
    return results


def fit_affine(control_points):
    """
    Least-squares affine transform from pixel to geographic coordinates.

    Solves: lon = a*px + b*py + c
            lat = d*px + e*py + f

    Returns (params, residuals_km) where params = [a,b,c,d,e,f]
    and residuals_km is per-point error in km.
    """
    n = len(control_points)
    A = np.zeros((2 * n, 6))
    b_vec = np.zeros(2 * n)

    for i, (px, py, lon, lat) in enumerate(control_points):
        A[2 * i, 0:3] = [px, py, 1]
        b_vec[2 * i] = lon
        A[2 * i + 1, 3:6] = [px, py, 1]
        b_vec[2 * i + 1] = lat

    params, _, _, _ = np.linalg.lstsq(A, b_vec, rcond=None)

    # Compute residuals
    residuals_km = []
    for px, py, lon, lat in control_points:
        pred_lon = params[0] * px + params[1] * py + params[2]
        pred_lat = params[3] * px + params[4] * py + params[5]
        err_km = (
            ((pred_lon - lon) * 70) ** 2 + ((pred_lat - lat) * 111) ** 2
        ) ** 0.5
        residuals_km.append(err_km)

    return params, residuals_km


def px_to_geo(params, x, y):
    """Transform pixel coordinates to WGS84 (lon, lat)."""
    lon = params[0] * x + params[1] * y + params[2]
    lat = params[3] * x + params[4] * y + params[5]
    return round(lon, 6), round(lat, 6)


def process_sheet(sheet):
    """Process one sheet: extract red, georeference, return GeoJSON features."""
    img_path = RAW_DIR / sheet["file"]
    img = cv2.imread(str(img_path))
    if img is None:
        print(f"  ERROR: Cannot read {img_path}")
        return []

    h, w = img.shape[:2]
    legend_x = int(w * sheet["legend_frac"])
    bt, bb, bl = sheet["border"]

    print(f"\n{'='*60}")
    print(f"  {sheet['name']}  ({w}x{h})")
    print(f"{'='*60}")

    # ── 1. Fit affine transform ───────────────────────────────────────
    cps = sheet["control_points"]
    params, residuals = fit_affine(cps)

    print(f"\n  Affine fit from {len(cps)} control points:")
    print(f"  {'Point':<35} {'Error (m)':>10}")
    print(f"  {'-'*35} {'-'*10}")
    max_err = 0
    for i, (px, py, lon, lat) in enumerate(cps):
        err_m = residuals[i] * 1000
        marker = " *** BAD" if err_m > 2000 else ""
        # Try to identify point name from coordinates
        print(f"  ({px:>5},{py:>5}) → ({lon:.3f},{lat:.3f})  {err_m:>8.0f}m{marker}")
        max_err = max(max_err, err_m)

    mean_err = np.mean(residuals) * 1000
    print(f"\n  Mean error: {mean_err:.0f}m  |  Max error: {max_err:.0f}m")

    if max_err > 3000:
        print(f"  WARNING: Max error > 3km — some control points may be wrong")

    # ── 2. Extract red corridor ───────────────────────────────────────
    red_mask = extract_red_mask(img, legend_x, bt, bb, bl)
    n_red = np.sum(red_mask > 0)
    print(f"\n  Red pixels: {n_red}")

    contours = extract_contours(red_mask)
    print(f"  Contours: {len(contours)}")
    for i, c in enumerate(contours[:5]):
        print(f"    #{i}: {len(c['points'])} pts, {c['area']:.0f} px²")

    # Save debug images
    debug_id = sheet["id"].replace(".", "_")

    # Red mask
    cv2.imwrite(str(OUT_DIR / f"debug_{debug_id}_red.png"), red_mask)

    # Overlay: contours + control points
    debug = img.copy()
    colors = [(0, 255, 0), (255, 100, 0), (0, 200, 255), (255, 0, 255)]
    for i, c in enumerate(contours):
        pts = np.array(c["points"], dtype=np.int32)
        cv2.polylines(debug, [pts], True, colors[i % len(colors)], 2)
    for px, py, lon, lat in cps:
        cv2.circle(debug, (int(px), int(py)), 8, (0, 0, 255), -1)
        cv2.circle(debug, (int(px), int(py)), 10, (255, 255, 255), 2)
    cv2.imwrite(str(OUT_DIR / f"debug_{debug_id}_overlay.png"), debug)

    # ── 3. Transform contours to geographic coordinates ───────────────
    features = []
    for i, contour in enumerate(contours):
        geo_coords = []
        for px, py in contour["points"]:
            lon, lat = px_to_geo(params, px, py)
            geo_coords.append([lon, lat])
        # Close polygon
        if geo_coords and geo_coords[0] != geo_coords[-1]:
            geo_coords.append(geo_coords[0])

        feature = {
            "type": "Feature",
            "properties": {
                "name": sheet["name"],
                "sheet": sheet["id"],
                "contour_index": i,
                "area_px": contour["area"],
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [geo_coords],
            },
        }
        features.append(feature)

    print(f"  Output: {len(features)} polygon features")
    return features


def main():
    print("=" * 60)
    print("  extract_all_sheets.py")
    print("  Automated corridor georeferencing for all 6 sheets")
    print("=" * 60)

    all_features = []

    for sheet in SHEETS:
        features = process_sheet(sheet)
        all_features.extend(features)

    # ── Combine into single GeoJSON ───────────────────────────────────
    geojson = {
        "type": "FeatureCollection",
        "features": all_features,
    }

    out_path = OUT_DIR / "corridor_aligned.geojson"
    with open(out_path, "w") as f:
        json.dump(geojson, f, indent=2)

    print(f"\n{'='*60}")
    print(f"  DONE: {len(all_features)} features → {out_path.name}")
    print(f"{'='*60}")

    # Summary
    for sheet in SHEETS:
        count = sum(1 for f in all_features if f["properties"]["sheet"] == sheet["id"])
        print(f"  {sheet['id']}: {count} polygons")


if __name__ == "__main__":
    main()
