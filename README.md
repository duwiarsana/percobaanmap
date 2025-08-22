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

