# Agents

## Purpose
Define roles and operating procedures for human + AI collaborators in this GeoJSON interactive maps project.

## Roles
- Product Owner (PO): Vision, priorities, PRD, acceptance criteria.
- Tech Lead (TL): Architecture, data model, reviews.
- Frontend Engineer (FE): Map UI, interactions, state.
- Data Engineer (DE): GeoJSON curation, loaders in `src/loaders/`.
- Data Steward (DS): Owns `public/data/` structure and conventions; ensures hierarchical naming and IDs remain consistent across drops.
- QA: Test plan, data and interaction verification.
- AI Assistant (Cascade): Draft code/docs, validate data, propose refactors, keep TODOs in sync; enforce data‑driven principles.

## Operating Cadence
- Daily: Short async status + blockers.
- Weekly: Planning, data drops, perf checks.
- PRs: Small scope, include demo screenshots/GIFs.

## Communication
- Decisions → `rules.md` (Decision Log).
- Specs → `PRD.md`.
- Issues: tag `data`, `map-ui`, `perf`, `infra`.
- Data changes must reference exact paths under `public/data/` and affected IDs (e.g., `5107`).

## AI Collaboration Prompts
- “Create loader + type guards for new GeoJSON in `public/data/...`”
- “Add choropleth with legend by property X; target <16ms/frame.”
- “Validate geometries/properties; propose fixes.”

## Definition of Ready
- Sample data in `public/data/`.
- Property schema sketched in `src/types/`.
- UX behavior described in 1–2 flows.

## Definition of Done
- Demoable locally.
- Types sound; no console errors.
- Docs updated; data validated.

## Tech Stack Awareness
- React 19 + React-Leaflet 5 + Leaflet 1.9.
- CRA with `react-app-rewired` and `config-overrides.js` to load `.geojson` via `json-loader`.
- Data lives under `public/data/` (single source of truth). Loaders in `src/loaders/`; shared types in `src/types/`. Config in `src/data-config.ts`.

## Data‑Driven Operating Principles
- Hierarchical exploration is mandatory: Province → District (Kabupaten/Kota) → Subdistrict (Kecamatan).
- No region-specific if/else branches in UI logic. Extend by data only:
  - Add/modify GeoJSON files under `public/data/`.
  - Register districts/subdistricts in `src/data-config.ts`.
  - Keep extraction/canonicalization rules in shared utilities (`src/utils/geojsonProps.ts`).
- UI should resolve IDs/names via configuration and property normalization, not hardcoded strings.

## Guardrails (what PRs must not do)
- Do not hardcode province/district logic in `src/App.tsx` beyond generic mechanisms and fallbacks.
- Do not introduce new data paths outside `public/data/`.
- Do not bypass configuration lookups (`findDistrictConfig`) when deriving IDs.

## Definition of Done (augmented)
- Demoable locally.
- Types sound; no console errors.
- Docs updated; data validated.
- Data-driven: new regions/levels load purely by adding data + config, no bespoke code.
- README and `rules.md` updated if conventions changed.

## Responsibilities Mapped to Code
- FE: maintain `src/App.tsx` interactions, performance (hover/click <16ms), and URL state (planned).
- DE: ensure loaders (e.g., `src/loaders/*Loader.ts`) implement consistent contracts from `src/loaders/types.ts` and normalize property keys.
- TL: enforce data path conventions and fallback policy used in `App.tsx` (multiple URL attempts) until unified.
- QA: verify feature counts by region; validate GeoJSON shapes; cross-check tooltips/legend data.

## Decision Capture
- Architectural decisions recorded as ADR entries under `rules.md` → Decision Log.
- Examples: "Keep CRS to EPSG:4326", "Adopt canonical property mapping", "Introduce tiling/simplification threshold".

## Release Cadence
- Data updates are versioned by drop (e.g., `2025-08-22`); keep IDs stable.
- Each release must include: loader tests, visual QA screenshots, and updated Decision Log entries if behavior changed.

## Incident Response
- Broken data path: roll back to previous release; validate `public/data/` structure and `config-overrides.js`.
- Rendering regressions: profile `App.tsx` interactions; verify memoization and GeoJSON size budgets.

## Data Onboarding Checklist
- Place new files under `public/data/<province>/<district>/...`.
- Define or update a loader under `src/loaders/` and export from `src/loaders/index.ts`.
- Ensure property canonicalization (id, name, codes) and add minimal tests.
- Update `PRD.md` Functional Requirements and `rules.md` conventions if new patterns emerge.