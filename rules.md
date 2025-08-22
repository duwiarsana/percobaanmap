# rules

## Codebase Conventions
- TypeScript (strict). Avoid `any`; prefer type guards.
- Structure:
  - GeoJSON in `public/data/`.
  - Loaders in `src/loaders/` (fetch, parse, validate, normalize).
  - Types in `src/types/` (e.g., `geojson.ts`, `district.ts`).
  - UI in `src/` components; styles in `App.css` or CSS modules.
- Imports: consistent absolute/aliased; avoid cycles.
- State: memoize heavy transforms; keep renders light.

## Stack specifics
- React 19 + React-Leaflet 5 + Leaflet 1.9.
- CRA with `react-app-rewired`; `config-overrides.js` adds `json-loader` for `.geojson`.
- Scripts: `start|build|test` via `react-app-rewired`.

## GeoJSON Standards
- CRS: WGS84 (EPSG:4326).
- Properties: stable keys; document in PRD; mapping for labels.
- Validation: valid (Multi)Polygon, no self-intersections.
- Normalization: strip unused props; stable IDs across releases.
- File size: target < 5MB per layer; otherwise simplify/tile.

## Directory & data path conventions
- Keep data under `public/data/<province>/<district>/<kecamatan>.geojson` where possible.
- Provinces/districts summary files live in `public/data/` (e.g., `prov_37.geojson`, `kab_37.geojson`).
- Temporary fallbacks (seen in `src/App.tsx`) attempt multiple URL patterns; migrate toward a single canonical path per region.

## Property canonicalization
- Canonical keys exposed to UI: `id`, `name`, `kec_name`, `kab_name`, `prov_name`, `district_code`.
- Map common variants to canonical keys in loaders:
  - `ID|KODE|id|gid|uuid|code` → `id`
  - `NAMA|NAME|name|Nama|nama` → `name`
  - `kabupaten|KABUPATEN|kab_name` → `kab_name`
  - `kecamatan|KECAMATAN|kec_name` → `kec_name`
  - `kab_id|kabupaten_id|ID_KABUPATEN|KABUPATEN_ID` → `district_code`

## Loader contract
- Implement types from `src/loaders/types.ts` and export from `src/loaders/index.ts`.
- Responsibilities:
  - Fetch with resilience (multiple paths if needed) and parse JSON safely (guard against HTML responses).
  - Canonicalize properties per above; ensure `FeatureCollection` shape.
  - Optionally enrich features (e.g., add `district_code`) consistently across regions.

## Performance Budgets
- TTI < 3s (local dev).
- Interaction < 16ms/frame.
- Data load/parse < 500ms typical; stream large sets.
- Use memoization for style/feature functions; avoid recreating handlers per render.
- Prefer lazy loading subdistricts only after district selection.

## Git & PR Process
- Branches: `feature/*`, `fix/*`, `chore/*`, `data/*`.
- Commits: Conventional Commits (e.g., `feat: add Badung choropleth`, `data: update kabupaten boundaries 2024`).
- PRs: small, with before/after images or GIF.
- Reviews: ≥1 reviewer; CI typecheck/lint pass.

## Testing
- Type checks: `tsc --noEmit` passes.
- Data checks: loader-level validator per dataset.
- UI checks: tooltips, legend, selection basics.
- Add smoke tests for fetch fallbacks returning JSON, not HTML.

## Accessibility & UX
- Keyboard navigable controls; visible focus.
- Color ramps with contrast; descriptive legend.
- Readable, dismissible tooltips.

## Security & Privacy
- No secrets in repo; document data licensing in `README.md`.

## Decision Log
- Format: YYYY-MM-DD | decision | context | owner
- Example: 2025-08-22 | Use EPSG:4326 only | Keep loaders simple | TL

## QA checklist (summary)
- Feature counts per region match source of truth.
- Tooltip fields exist across features; no undefined values.
- Legend domain matches data; updates on filter.
- URL state (when implemented) restores selection/filter.