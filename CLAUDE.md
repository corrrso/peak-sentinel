@app/CLAUDE.md

## Writing style

All prose written for this project (README, comments, UI copy, commit messages) must follow these rules:

- No "phrase 1 — phrase 2" as a heading or tagline pattern. Use real punctuation and complete sentences.
- No "it's not X, it's Y" constructions.
- No excessive verbosity. Be precise and get to the point.
- No gratuitous triplets ("XXX, YYY, and ZZZ") unless three items genuinely need listing.
- Write like a human who cares about the subject, not like a press release.

## Data pipeline

The Python pipeline in `scripts/` transforms raw geospatial data into GeoJSON + JSON files for the frontend. Scripts are numbered and must run in order.

### Current geographic scope

The **full corridor** is sourced directly from Peak Cluster's ArcGIS FeatureServer (`Peak_Cluster_AGOL`). The scoping boundary (DEF1 v1.2 draft) covers the entire route from Leasowe (Wirral coast) through the Peak District to Cauldon (Staffordshire). Ten official project sections, nine AGI/facility search area polygons.

The corridor lives in `data/manual/corridor_aligned.geojson` (1 MultiPolygon feature). Official route sections are in `data/manual/route_sections_official.geojson`. All downstream scripts derive their extent from the corridor file.

### Pipeline steps

1. **`01_corridor.py`** — Dissolves corridor polygons, creates 500m/1km buffers, emits 9 AGI sites (coordinates from official ArcGIS facility centroids) and estimated BVS positions at ~16km intervals. Uses official route sections from ArcGIS.
2. **`02_dem_sinks.py`** — Priority-flood sink filling on LIDAR DEM (downsampled to ~10m). Identifies depressions >1.5m deep and >500m² where CO2 could pool. Requires LIDAR tiles in `data/raw/dem/lidar_composite_1m/`.
3. **`03_viewshed.py`** — Line-of-sight from Coastal AGI 50m vent stack within 10km radius. Currently only analyses the Coastal AGI.
4. **`05_constraints.py`** — Downloads SSSI, SAC, Ancient Woodland, National Park polygons from Natural England ArcGIS REST API. Clips to 5km of corridor, identifies direct intersections. Caches raw responses in `data/raw/natural_england/`.
5. **`06_social.py`** — Schools from GOV.UK edubase CSV (clipped to 2km). Postcode centroids via postcodes.io API (grid search at ~500m spacing within corridor bounds).
6. **`07_economic.py`** — HM Land Registry median prices per outcode, three depreciation scenarios (low -2%, central -8%, high -9% at 0m, decaying linearly to 0% at 2-3km). Outcodes: CH, L, CW, WA, SK, DE, ST. Caches per-outcode in `data/raw/economic/`.
7. **`08_postcode_index.py`** — Aggregates all layers into a per-postcode JSON lookup (`postcode_index.json`) used by the frontend for instant risk cards.
8. **`09_objections.py`** — Generates objection letter templates and Planning Inspectorate scoping paragraph references.

### Corridor data source

The corridor polygon was downloaded from Peak Cluster's own ArcGIS service, discovered via their consultation site (`peakcluster-consultation.co.uk`). The service URL is:

    https://services-eu1.arcgis.com/vvroVTbi2vf6btcj/arcgis/rest/services/Peak_Cluster_AGOL/FeatureServer

Key layers: 0 (Scoping Boundary), 8 (Project Sections), 1-7,9 (Facilities/AGIs).

### LIDAR coverage

Current tiles cover BNG grid squares SJ18–SJ57 (Wirral through east Cheshire). The Peak District (SK grid squares around Buxton, Hope, Tunstead, Cauldon) is not covered. DEM-dependent scripts (02, 03) only produce results where LIDAR exists.

### Key data directories

- `data/manual/` — Official corridor GeoJSON and route sections (pipeline input)
- `data/raw/` — Cached API responses, LIDAR tiles, schools CSV (gitignored)
- `data/processed/` — Pipeline output GeoJSON/JSON (committed)
- `app/public/data/` — Frontend copies of processed data (committed)
