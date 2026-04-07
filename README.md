# Peak Sentinel

An interactive map showing how the proposed Peak Cluster CO2 pipeline affects residents across Wirral, Cheshire, and the Peak District (currently limited to Wirral and part of Cheshire). Enter a postcode to see distance from the pipeline, estimated property impact, nearby environmental designations, and schools in the area.

Imspired by [Action Against CCS](https://actionagainstccs.com).

## What's in the app

- **Interactive map** with toggleable layers: pipeline corridor, buffer zones, protected sites (SSSI/SAC/Ancient Woodland), viewshed from the proposed 50m Coastal AGI vent stack, topographic sinks where CO2 would pool, schools, and per-postcode property impact.
- **Postcode lookup** that shows a risk card with distance to pipeline, nearest AGI, depreciation estimates (with methodology and academic sources), and nearby sensitive sites.
- **Evidence page** documenting CO2 pipeline physics, the Planning Inspectorate's 29 disagreements with the applicant's scoping approach, webinar transcripts, the global CCS track record (10 of 13 flagship projects failed or underperformed), and real incidents (Satartia 2020, Sulphur LA 2024).
- **Objection letter generator** that produces a personalised letter based on the risks to a given postcode.

## Project structure

```
app/                  Next.js frontend (static export)
scripts/              Python pipeline that processes raw data into GeoJSON
data/raw/             Raw source data (LIDAR DEMs, Land Registry, schools CSV, Natural England shapefiles)
docs/originalPdfs/    Official project documents from PINS and Peak Cluster
```

`data/raw/` and `docs/originalPdfs/` are gitignored because they're large. The processed GeoJSON files in `app/public/data/` are committed and are what the frontend reads.

## Running locally

### Frontend

```bash
cd app
npm install
npm run dev
```

Opens at `http://localhost:3000`.

### Data pipeline

The numbered scripts in `scripts/` regenerate the GeoJSON files from raw sources. You only need these if you're updating the underlying data.

```bash
cd scripts
pip install -r requirements.txt
python 01_corridor.py
python 02_dem_sinks.py
# ... etc
```

Scripts expect raw data in `data/raw/`. See each script's header for specific input files.

## Data sources

| Layer                        | Source                                                                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pipeline corridor, AGI sites | [Planning Inspectorate EIA Scoping Report (EN0710001)](https://national-infrastructure-consenting.planninginspectorate.gov.uk/projects/EN0710001/documents) |
| SSSI, SAC, Ancient Woodland  | [Natural England Open Data](https://naturalengland-defra.opendata.arcgis.com/)                                                                              |
| Schools                      | [DfE Get Information About Schools](https://get-information-schools.service.gov.uk/)                                                                        |
| Property prices              | [HM Land Registry Price Paid Data](https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads) (2023-2025 median by outcode)             |
| Topographic sinks, viewshed  | [Environment Agency LIDAR Composite DTM 1m](https://environment.data.gov.uk/survey)                                                                         |
| Basemap                      | [OpenStreetMap](https://www.openstreetmap.org/copyright) via [CARTO](https://carto.com/attributions)                                                        |

Depreciation estimates are illustrative. They're based on peer-reviewed studies of natural gas and fuel pipeline proximity effects on property values. No equivalent study exists for CO2 pipelines. Full methodology is shown in the app.

## Tech

Next.js 16 with static export, React 19, MapLibre GL, Tailwind CSS 4.

Data pipeline: Python with GeoPandas, Rasterio, and Shapely.
