"""
Extract the red corridor boundary from Figure 1.2A (Scoping Boundary map)
and convert to a georeferenced GeoJSON.

Approach: extract the red corridor as a polygon (not just centerline),
georeference it, and let the pipeline scripts compute the centerline.
"""

import cv2
import numpy as np
from pathlib import Path
import json

IMG_PATH = Path(__file__).parent.parent / "data/raw/corridor_map_fig1_2A.png"
OUT_DIR = Path(__file__).parent.parent / "data/manual"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# --- Step 1: Load and isolate red ---
img = cv2.imread(str(IMG_PATH))
h, w = img.shape[:2]
print(f"Image: {w}x{h}")

hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

mask1 = cv2.inRange(hsv, np.array([0, 40, 100]), np.array([12, 255, 255]))
mask2 = cv2.inRange(hsv, np.array([168, 40, 100]), np.array([180, 255, 255]))
red_mask = mask1 | mask2

# Mask out legend, borders
red_mask[:, 2080:] = 0
red_mask[:50, :] = 0
red_mask[1790:, :] = 0

# Close gaps and clean
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
red_mask = cv2.morphologyEx(red_mask, cv2.MORPH_CLOSE, kernel, iterations=3)

# Keep only the main corridor blob
num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(red_mask, connectivity=8)
largest_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
cleaned = np.zeros_like(red_mask)
cleaned[labels == largest_label] = 255
red_mask = cleaned

print(f"Corridor blob area: {stats[largest_label, cv2.CC_STAT_AREA]} pixels")
cv2.imwrite(str(OUT_DIR / "debug_red_cleaned.png"), red_mask)

# --- Step 2: Extract corridor outline as polygon ---
contours, _ = cv2.findContours(red_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
# Take the largest contour
contour = max(contours, key=cv2.contourArea)
print(f"Corridor contour: {len(contour)} points")

# Simplify to reduce point count (epsilon in pixels)
epsilon = 3.0
simplified = cv2.approxPolyDP(contour, epsilon, True)
print(f"Simplified to {len(simplified)} points")

# --- Step 3: Georeference ---
# Control points: (pixel_x, pixel_y) → (longitude, latitude)
# Carefully picked from identifiable town labels on the map.
# The map is oriented north-up, 1:400,000 scale.
#
# Strategy: use towns at the edges and center of the map for good coverage.
# I'm reading pixel positions from the 2614x1826 image.

CONTROL_POINTS = [
    # Wirral / Liverpool area
    (175, 555, -3.183, 53.399),      # West Kirby
    (237, 475, -3.063, 53.428),      # Wallasey
    (175, 625, -3.154, 53.353),      # Heswall
    (150, 355, -3.210, 53.533),      # Formby
    (287, 492, -2.990, 53.420),      # Bebington
    (106, 445, -3.267, 53.476),      # Holywell (approx)

    # Chester / Ellesmere Port
    (395, 600, -2.830, 53.359),      # Ellesmere Port
    (455, 680, -2.733, 53.305),      # Chester
    (300, 640, -2.978, 53.341),      # Neston

    # Liverpool / North
    (355, 370, -2.863, 53.540),      # Kirkby
    (525, 380, -2.625, 53.534),      # Warrington (approx)
    (490, 330, -2.672, 53.570),      # St Helens area

    # Mid Cheshire
    (640, 560, -2.490, 53.395),      # Frodsham
    (740, 620, -2.350, 53.370),      # Northwich
    (830, 650, -2.225, 53.350),      # Middlewich
    (890, 640, -2.140, 53.354),      # Sandbach
    (855, 730, -2.190, 53.300),      # Crewe
    (640, 815, -2.506, 53.248),      # Nantwich

    # East Cheshire
    (1000, 555, -1.978, 53.405),     # Knutsford area
    (1100, 520, -1.838, 53.420),     # Wilmslow
    (1145, 540, -1.770, 53.413),     # Macclesfield
    (1075, 618, -1.863, 53.370),     # Congleton

    # Peak District
    (1290, 475, -1.555, 53.448),     # New Mills
    (1390, 475, -1.412, 53.448),     # Whaley Bridge
    (1475, 500, -1.290, 53.435),     # Buxton
    (1530, 535, -1.215, 53.412),     # Bakewell

    # South references
    (830, 870, -2.220, 53.210),      # Stoke-on-Trent
    (1025, 870, -1.940, 53.210),     # Leek
    (1490, 730, -1.300, 53.288),     # Matlock
]

n = len(CONTROL_POINTS)
print(f"\n{n} control points")

# Least-squares affine: 6 params
A = np.zeros((2 * n, 6))
b_vec = np.zeros(2 * n)
for i, (px, py, lon, lat) in enumerate(CONTROL_POINTS):
    A[2*i, 0:3] = [px, py, 1]
    b_vec[2*i] = lon
    A[2*i+1, 3:6] = [px, py, 1]
    b_vec[2*i+1] = lat

params, _, _, _ = np.linalg.lstsq(A, b_vec, rcond=None)
ta, tb, tc, td, te, tf = params

# Validate
errors = []
for px, py, lon, lat in CONTROL_POINTS:
    pred_lon = ta * px + tb * py + tc
    pred_lat = td * px + te * py + tf
    err_km = (((pred_lon - lon) * 75)**2 + ((pred_lat - lat) * 111)**2)**0.5
    errors.append(err_km)

print(f"Georef error — mean: {np.mean(errors):.2f}km, max: {np.max(errors):.2f}km, median: {np.median(errors):.2f}km")

for i, (px, py, lon, lat) in enumerate(CONTROL_POINTS):
    if errors[i] > 2.0:
        pred_lon = ta * px + tb * py + tc
        pred_lat = td * px + te * py + tf
        print(f"  BAD: pixel ({px},{py}) → ({pred_lon:.3f},{pred_lat:.3f}), expected ({lon:.3f},{lat:.3f}), err={errors[i]:.1f}km")

def px_to_geo(x, y):
    return (round(ta * x + tb * y + tc, 6),
            round(td * x + te * y + tf, 6))

# --- Step 4: Convert contour to GeoJSON polygon ---
poly_coords = []
for pt in simplified:
    x, y = pt[0]
    lon, lat = px_to_geo(x, y)
    poly_coords.append([lon, lat])

# Close the polygon
if poly_coords[0] != poly_coords[-1]:
    poly_coords.append(poly_coords[0])

corridor_geojson = {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "properties": {
            "name": "Peak Cluster Pipeline Scoping Boundary",
            "source": "Extracted from EIA Scoping Report Figure 1.2A",
            "scale": "1:400,000",
            "accuracy_note": "Approximate — georeferenced from screenshot"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [poly_coords]
        }
    }]
}

out_corridor = OUT_DIR / "corridor.geojson"
with open(out_corridor, "w") as f:
    json.dump(corridor_geojson, f, indent=2)

lons = [c[0] for c in poly_coords]
lats = [c[1] for c in poly_coords]
print(f"\nCorridor polygon: {len(poly_coords)} vertices")
print(f"Lon: {min(lons):.4f} to {max(lons):.4f}")
print(f"Lat: {min(lats):.4f} to {max(lats):.4f}")

# --- Step 5: Also extract approximate centerline ---
# Thin the mask more aggressively, then trace
from skimage.morphology import skeletonize as sk
thin = sk((red_mask > 0).astype(bool)).astype(np.uint8) * 255

# Get skeleton points
sk_yx = np.column_stack(np.where(thin > 0))
print(f"\nSkeleton: {len(sk_yx)} points")

# Nearest-neighbor ordering starting from the TOP-LEFT point (Wirral coast)
# The Wirral section goes roughly north-south at the western edge
# Find the point nearest to the known Coastal AGI area (~pixel 140, 475)
target = np.array([475, 140])  # y, x — near Hoylake
start_idx = np.argmin(np.sum((sk_yx - target)**2, axis=1))

ordered = [start_idx]
used = np.zeros(len(sk_yx), dtype=bool)
used[start_idx] = True
current = start_idx

while True:
    curr_pt = sk_yx[current]
    dists = np.sum((sk_yx - curr_pt)**2, axis=1)
    dists[used] = 999999999

    nearest = np.argmin(dists)
    if dists[nearest] > 900:  # >30px gap — stop main path
        break

    ordered.append(nearest)
    used[nearest] = True
    current = nearest

path_pts = sk_yx[ordered]  # (y, x)
print(f"Main path: {len(path_pts)} points")

# Subsample
step = max(1, len(path_pts) // 400)
sampled = path_pts[::step]

# Convert to geo
centerline_coords = []
for y, x in sampled:
    lon, lat = px_to_geo(int(x), int(y))
    centerline_coords.append([lon, lat])

# Smooth with moving average
if len(centerline_coords) > 20:
    win = 7
    lons_arr = np.array([c[0] for c in centerline_coords])
    lats_arr = np.array([c[1] for c in centerline_coords])
    lons_s = np.convolve(lons_arr, np.ones(win)/win, mode='valid')
    lats_s = np.convolve(lats_arr, np.ones(win)/win, mode='valid')
    centerline_coords = [[round(lo, 6), round(la, 6)] for lo, la in zip(lons_s, lats_s)]

centerline_geojson = {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "properties": {"name": "Peak Cluster Pipeline Centerline (approximate)"},
        "geometry": {
            "type": "LineString",
            "coordinates": centerline_coords
        }
    }]
}

out_center = OUT_DIR / "corridor_centerline.geojson"
with open(out_center, "w") as f:
    json.dump(centerline_geojson, f, indent=2)

print(f"Centerline: {len(centerline_coords)} points")
if centerline_coords:
    clons = [c[0] for c in centerline_coords]
    clats = [c[1] for c in centerline_coords]
    print(f"  Lon: {min(clons):.4f} to {max(clons):.4f}")
    print(f"  Lat: {min(clats):.4f} to {max(clats):.4f}")

# Debug overlay
debug = img.copy()
# Draw polygon outline in blue
for i in range(len(simplified) - 1):
    p1 = tuple(simplified[i][0])
    p2 = tuple(simplified[i+1][0])
    cv2.line(debug, p1, p2, (255, 100, 0), 2)
# Draw centerline in green
for y, x in sampled:
    cv2.circle(debug, (int(x), int(y)), 2, (0, 255, 0), -1)

cv2.imwrite(str(OUT_DIR / "debug_path_overlay.png"), debug)
print("\nSaved debug images to data/manual/")
print("Done! Files: corridor.geojson, corridor_centerline.geojson")
