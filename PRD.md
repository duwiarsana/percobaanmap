# PRD — GeoJSON Interactive Maps

## 1. Overview
Interactive web app to explore administrative boundaries and attributes via GeoJSON.

## 2. Goals
- Fast, reliable rendering for districts/kecamatan.
- Intuitive interactions: hover, select, filter, legend.
- Simple data onboarding via `public/data/` + `src/loaders/`.

## 3. Non-Goals
- Full GIS analysis.
- Real-time multi-user editing.

## 4. Users & Personas
- Analyst: accurate boundaries, property filters.
- Public user: explore areas, view key metrics.

## 5. Data Sources
- GeoJSON under `public/data/`.
- Types/schema in `src/types/`.

## 6. Architecture & Stack
- React 19 + React-Leaflet 5 + Leaflet 1.9.
- CRA with `react-app-rewired`; `config-overrides.js` adds `json-loader` for `.geojson`.
- Main map composition and interactions live in `src/App.tsx`.

## 7. Functional Requirements
- Load and validate GeoJSON layers.
- Choropleth with legend and tooltip.
- Feature selection/highlight + synced sidebar.
- Property filter updates map + legend.
- Persist layer/filter in URL query.
 - Province → district → subdistrict progressive loading, with lazy load of subdistricts only after a district is selected.
 - Resilient data fetching: try canonical path, then fallbacks (as in `src/App.tsx`), and guard against HTML responses.
 - Canonicalize properties for UI (see Schema section) regardless of source variants.

## 8. Data Requirements
- Stable feature IDs.
- Required: `id`, `name`, plus layer metrics.
- Valid (Multi)Polygon; WGS84.

## 9. Data Path Conventions
- Prefer: `public/data/<province>/<district>/<kecamatan>.geojson` for subdistricts.
- Summary files: `public/data/prov_37.geojson`, `public/data/kab_37.geojson` (or fixed variants with spaces where legacy demands).
- Aim to remove legacy/fallback paths once data is reorganized to canonical structure.

## 10. Schema & Canonical Properties
- Canonical keys exposed to UI: `id`, `name`, `prov_name`, `kab_name`, `kec_name`, `district_code`.
- Common variants mapped in loaders:
  - `ID|KODE|id|gid|uuid|code` → `id`
  - `NAMA|NAME|name|Nama|nama` → `name`
  - `prov_name|PROVINSI|Propinsi|provinsi` → `prov_name`
  - `kabupaten|KABUPATEN|kab_name` → `kab_name`
  - `kecamatan|KECAMATAN|kec_name` → `kec_name`
  - `kab_id|kabupaten_id|ID_KABUPATEN|KABUPATEN_ID` → `district_code`

## 11. Performance & Quality
- < 16ms/frame interactions; lazy load large layers.
- Type-safe loaders; no console errors/warnings.
 - Data load/parse < 500ms typical layer; stream or chunk for large.
 - Memoize style/feature functions; avoid recreating handlers per render.

## 12. Accessibility
- Keyboard navigation for controls.
- Colorblind-safe palettes.

## 13. Telemetry (optional)
- Events: layer load, filter change, selection, legend domain change.
- Error events: fetch fallback used, HTML-response guard triggered.

## 14. Milestones
- M1: Ingestion + validation.
- M2: Base map + tooltip + legend.
- M3: Filtering + URL state.
- M4: Polish + a11y + docs.
 - M5: Data reorg to canonical paths; remove fallbacks; loader tests.

## 15. Acceptance Criteria
- Two representative layers load without errors.
- Legend reflects domain and updates with filters.
- Tooltip shows key fields; selection persists in URL.
 - Subdistricts load only after district select; no console errors.
 - Fallbacks rarely used in production after M5; telemetry confirms canonical paths.

## 16. Current Implementation Notes (as of 2025-08-22)
- `src/App.tsx` performs multi-path fetch attempts for several regions (e.g., Tabanan, Jembrana, Banyuwangi) and enriches feature properties (adds `district_code`, sets multiple name variants).
- Loader contracts defined in `src/loaders/types.ts` and exported via `src/loaders/index.ts`.
- `config-overrides.js` enables importing `.geojson` via `json-loader` if needed.

## 17. Risks & Mitigations
- Inconsistent data paths → Define canonical structure and migrate; keep telemetry to find stragglers.
- Large GeoJSON size → Simplify/tiling; lazy load; possibly vector tiles in future.
- Property key variance → Centralize canonicalization in loaders; add validator tests.