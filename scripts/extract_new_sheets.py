"""
extract_new_sheets.py — Extract red corridor polygons from Figures 1.2B-E.

Reads each screenshot, isolates the red scoping boundary via HSV thresholding,
extracts contour pixel coordinates, and outputs JSON ready for align_tool.html.

Usage:
    python scripts/extract_new_sheets.py
"""

import cv2
import numpy as np
import json
from pathlib import Path

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
OUT_DIR = Path(__file__).parent.parent / "data" / "manual"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# All 4 new sheets to process
SHEETS = [
    {"id": "1.2E", "file": "fig1_2E.png", "name": "Figure 1.2E — Middlewich"},
    {"id": "1.2D", "file": "fig1_2D.png", "name": "Figure 1.2D — Leek/Cauldon"},
    {"id": "1.2C", "file": "fig1_2C.png", "name": "Figure 1.2C — Macclesfield"},
    {"id": "1.2B", "file": "fig1_2B.png", "name": "Figure 1.2B — Peak District"},
]

# Legend occupies roughly the right 18% of each image
LEGEND_CUTOFF_FRAC = 0.82
# Top/bottom border margins to mask
BORDER_TOP = 30
BORDER_BOTTOM = 30

# Minimum contour area in pixels to keep (filters noise)
MIN_CONTOUR_AREA = 2000
# Polygon simplification epsilon (pixels)
SIMPLIFY_EPSILON = 3.0


def extract_red_mask(img, legend_cutoff_x):
    """Extract red pixels via HSV thresholding."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # Red wraps around H=0, so two ranges
    mask1 = cv2.inRange(hsv, np.array([0, 35, 80]), np.array([12, 255, 255]))
    mask2 = cv2.inRange(hsv, np.array([168, 35, 80]), np.array([180, 255, 255]))
    red_mask = mask1 | mask2

    # Mask out legend area and borders
    red_mask[:, legend_cutoff_x:] = 0
    red_mask[:BORDER_TOP, :] = 0
    red_mask[-BORDER_BOTTOM:, :] = 0

    # Also mask out the left border where dashed sheet-extent lines appear
    # These are typically thin and within the first ~40px
    # (don't mask too much — some corridors touch the left edge)

    # Morphological closing to fill gaps in the corridor boundary
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    red_mask = cv2.morphologyEx(red_mask, cv2.MORPH_CLOSE, kernel, iterations=3)

    return red_mask


def extract_contours(red_mask, min_area=MIN_CONTOUR_AREA):
    """Find and simplify contours above minimum area."""
    contours, _ = cv2.findContours(
        red_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    results = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area:
            continue

        simplified = cv2.approxPolyDP(cnt, SIMPLIFY_EPSILON, True)
        pts = [[int(p[0][0]), int(p[0][1])] for p in simplified]
        results.append({"points": pts, "area": area})

    # Sort by area descending
    results.sort(key=lambda x: x["area"], reverse=True)
    return results


def process_sheet(sheet):
    """Process a single sheet image and return contour data."""
    img_path = RAW_DIR / sheet["file"]
    img = cv2.imread(str(img_path))
    if img is None:
        print(f"  ERROR: Cannot read {img_path}")
        return None

    h, w = img.shape[:2]
    legend_cutoff_x = int(w * LEGEND_CUTOFF_FRAC)

    print(f"\n--- {sheet['name']} ({w}x{h}) ---")
    print(f"  Legend cutoff at x={legend_cutoff_x}")

    red_mask = extract_red_mask(img, legend_cutoff_x)

    # Count red pixels
    n_red = np.sum(red_mask > 0)
    print(f"  Red pixels: {n_red}")

    # Save debug image
    debug_name = f"debug_{sheet['id'].replace('.', '_')}_red.png"
    cv2.imwrite(str(OUT_DIR / debug_name), red_mask)

    contours = extract_contours(red_mask)
    print(f"  Contours found: {len(contours)}")

    for i, c in enumerate(contours):
        print(f"    #{i}: {len(c['points'])} points, area={c['area']:.0f}px²")

    # Save debug overlay
    debug_overlay = img.copy()
    for i, c in enumerate(contours):
        pts = np.array(c["points"], dtype=np.int32)
        color = [(0, 255, 0), (255, 0, 0), (0, 0, 255), (255, 255, 0)][i % 4]
        cv2.polylines(debug_overlay, [pts], True, color, 2)
        # Label
        cx = int(np.mean([p[0] for p in c["points"]]))
        cy = int(np.mean([p[1] for p in c["points"]]))
        cv2.putText(debug_overlay, f"#{i}", (cx, cy),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 2)

    overlay_name = f"debug_{sheet['id'].replace('.', '_')}_overlay.png"
    cv2.imwrite(str(OUT_DIR / overlay_name), debug_overlay)

    return {
        "id": sheet["id"],
        "name": sheet["name"],
        "width": w,
        "height": h,
        "contours": contours,
    }


def main():
    print("=== extract_new_sheets.py ===")
    print("Extracting red corridor polygons from Figures 1.2B-E\n")

    all_results = {}

    for sheet in SHEETS:
        result = process_sheet(sheet)
        if result:
            all_results[sheet["id"]] = result

    # Output summary JSON for align_tool.html integration
    print("\n\n=== ALIGN TOOL DATA ===")
    print("Copy the following into align_tool.html sheetData.sheets array:\n")

    for sheet_id, data in all_results.items():
        # Use the largest contour as the main polygon
        if data["contours"]:
            main_poly = data["contours"][0]["points"]
            extra_polys = [c["points"] for c in data["contours"][1:]]
        else:
            main_poly = []
            extra_polys = []

        print(f"// {data['name']}")
        print(f"// Main polygon: {len(main_poly)} points")
        if extra_polys:
            print(f"// Additional polygons: {len(extra_polys)}")
            for i, ep in enumerate(extra_polys):
                print(f"//   Extra #{i+1}: {len(ep)} points, will be stored in extra_polygons")

        print(json.dumps(main_poly))
        if extra_polys:
            print(f"// Extra polygons:")
            print(json.dumps(extra_polys))
        print()

    # Save full results as JSON for reference
    output_path = OUT_DIR / "extracted_sheets_B_E.json"
    # Convert to serializable format
    out_data = {}
    for k, v in all_results.items():
        out_data[k] = {
            "name": v["name"],
            "width": v["width"],
            "height": v["height"],
            "contours": [
                {"points": c["points"], "area": c["area"]}
                for c in v["contours"]
            ],
        }

    with open(output_path, "w") as f:
        json.dump(out_data, f, indent=2)
    print(f"\nFull results saved to {output_path}")

    print("\n=== Done! ===")


if __name__ == "__main__":
    main()
