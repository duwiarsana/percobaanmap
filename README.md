# GeoJSON Large File Processor

A system for efficiently reading, processing, and visualizing large GeoJSON files.

## Features

- Efficiently processes large GeoJSON files using streaming techniques
- Automatically fixes common GeoJSON formatting issues
- Simplifies geometries to reduce file size while preserving shape
- Provides a web interface to visualize and explore the data
- Shows tooltips with feature names and properties
- Interactive map with zoom and pan functionality

## Installation

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

### Basic Usage

```bash
python3 geojson_processor.py "prov 37.geojson"
```

This will:
1. Load and analyze the GeoJSON file
2. Start a web server on port 5000
3. Open a web interface where you can view the map

### Advanced Options

```bash
python3 geojson_processor.py "prov 37.geojson" --simplify 0.005 --port 8080 --fix
```

Parameters:
- `--simplify`: Simplification tolerance (higher = more simplification, default: 0.01)
- `--port`: Port for the web server (default: 5000)
- `--fix`: Attempt to fix common GeoJSON issues (like removing 'f' prefix)

## How It Works

1. **Streaming Processing**: Uses `ijson` to process the GeoJSON file without loading it entirely into memory
2. **Geometry Simplification**: Uses `geopandas` and `shapely` to simplify geometries while preserving shape
3. **Web Visualization**: Uses Flask to serve a web interface with Leaflet.js for map visualization

## Troubleshooting

If you encounter issues with the GeoJSON file format (like it starting with 'f{' instead of '{'), use the `--fix` option to attempt automatic repairs.

## System Requirements

- Python 3.6+
- Sufficient memory to process the simplified geometries (though much less than loading the entire file)

---

## Frontend (React) Map Viewer

An interactive web app is included to visualize administrative boundaries from GeoJSON files.

### Stack

- React 19
- React-Leaflet 5 + Leaflet 1.9
- CRA with react-app-rewired (see `config-overrides.js`) to allow importing `.geojson` if needed

### Run (local)

```bash
npm install
npm start
```

This serves the app at http://localhost:3000. Data is loaded from `public/data/` by default.

### Data Layout

- Canonical path: `public/data/<province>/<district>/<kecamatan>.geojson`
- Province/district summaries may also exist at `public/data/prov_37.geojson`, `public/data/kab_37.geojson` (or legacy spaced names).

### Current Implementation Notes

- Main map composition and interactions: `src/App.tsx`.
- Loaders and helpers for resilient data handling live inline today; these will migrate to `src/loaders/` over time.
- Some regions still rely on multiple fallback URL patterns for robustness during data reorganization.

### Behavior-Preserving Refactor (2025-08-22)

To reduce duplication and improve maintainability without changing runtime behavior, we introduced small shared helpers in `src/App.tsx` and refactored regional subdistrict loaders to use them:

- `parseJsonSafely(response, context)`
  - Reads the response as text, guards against HTML responses, logs the same errors, and parses JSON.
- `deriveKecamatanNameFromFileId(fileId)`
  - Derives a display name (Title Case) from a kecamatan file id (e.g., `id5102010_selemadeg_timur`).
- `enhanceKecamatanFeatures(features, kecamatanId, districtCode)`
  - Canonicalizes feature properties consistently (sets name variants and district code variants) matching the existing behavior.

Refactored functions now using the helpers (logic, logging order, and fallbacks unchanged):

- `loadTabananSubdistrictData()` → uses helpers with district code `5102`.
- `loadJembranaSubdistrictData()` → `5101`.
- `loadBanyuwangiSubdistrictData()` → `3510`.
- `loadBulelengSubdistrictData()` → `5108`.

Planned follow-up (no behavior change): introduce a tiny `fetchWithFallback(urls: string[])` to centralize multi-URL attempts while preserving log order and messages.


## Data Submodule and Git LFS Workflow

If this project relies on large geospatial files under `public/data/`, those files are managed in a separate Git repository using Git submodules and Git LFS.

### Clone with submodule and LFS

```bash
git clone --recurse-submodules <this-repo-url>
cd indonesia-map-viewer
git submodule update --init --recursive
git lfs install
```

### Update data

```bash
# From project root
git submodule update --remote --merge public/data || true

# Or within the submodule
cd public/data
git fetch
git switch main || true
git pull
git lfs pull
cd -
```

### Contribute data changes

```bash
cd public/data
git lfs track "**/*.geojson"
git add .gitattributes
git add path/to/files
git commit -m "Update geospatial data"
git push origin main
cd -

# Record updated submodule commit in this repo
git add public/data
git commit -m "chore(data): bump data submodule"
git push
```

### Tips

- If you see tiny text files instead of GeoJSON, run `git lfs pull` inside `public/data`.
- After branch changes, run `git submodule update --init --recursive`.
- Remotes may use SSH; ensure SSH keys are configured.


## Changelog

### 2025-08-22

Behavior-preserving fixes and refactors to stabilize Bali subdistrict loading and reduce ID mismatches:

- __Normalize district IDs to 4 digits__
  - Added `src/utils/geojsonProps.ts` with `getDistrictId()` that prefers explicit `regency_code`, derives from `district_code`/`village_code`, ignores UUID-like values, and returns a normalized 4-digit code when possible.

- __Click handling hardened__
  - Updated `src/map/handlers.ts` to prefer config-based IDs via `findDistrictConfig(name)` and only set `selectedDistrictId` when a valid 4-digit code is available. Otherwise, it logs and skips to prevent bad loads.

- __Filtering and subdistrict loading aligned__
  - `src/App.tsx` now uses `getDistrictId()` when filtering districts after selection to match the click logic.
  - In subdistrict loading, it prefers the config-based 4-digit ID from `selectedDistrict` name before falling back to numeric normalization.

- __Data pathing__
  - Maintains per-district Bali paths under `public/data/id51_bali/id510x_<district>/...` with fallbacks to `/data/districts/kab_37.geojson` where appropriate.

These changes fix cases where IDs like `01`, `24`, or feature `gid`/`uuid` values caused subdistricts not to load.
