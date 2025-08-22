#!/usr/bin/env python3
"""
Generate src/data/prov-35-jawa-timur.ts by scanning public/data/id35_jawa_timur/
for district directories and their subdistrict files.

- Derives district id and name from directory names like `id3510_banyuwangi`
- Lists subdistrict files excluding the combined fallback file
- Adds a fallbackFile if present: `id3510_banyuwangi.geojson`
- Keeps province-level districtsFile as '/data/jawa_timu_kab.geojson'

Usage:
  python3 scripts/gen_prov35_config.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / 'public' / 'data' / 'id35_jawa_timur'
OUT_FILE = ROOT / 'src' / 'data' / 'prov-35-jawa-timur.ts'

DIST_DIR_PATTERN = re.compile(r'^id(\d{4})_(.+)$')


def to_title(name: str) -> str:
    # Replace underscores with spaces and title-case, handle common tokens
    s = name.replace('_', ' ').strip()
    # Preserve acronyms like "KOTA" into "Kota"
    return ' '.join([w.capitalize() for w in s.split()])


def main() -> None:
    if not DATA_DIR.exists():
        raise SystemExit(f"Missing data directory: {DATA_DIR}")

    districts_entries = []

    # Iterate directories sorted by id
    for entry in sorted(DATA_DIR.iterdir()):
        if not entry.is_dir():
            continue
        m = DIST_DIR_PATTERN.match(entry.name)
        if not m:
            continue
        did, slug = m.groups()
        name = to_title(slug)

        # Collect subdistrict files
        subdistricts = []
        fallback_file = None
        for f in sorted(entry.iterdir()):
            if not f.is_file() or not f.name.endswith('.geojson'):
                continue
            base = f.stem  # filename without extension
            # Combined fallback file has same basename as folder
            if base == f"id{did}_{slug}":
                fallback_file = f.name
                continue
            subdistricts.append(base)

        # Build TS snippet
        ts = []
        ts.append(f"    '{did}': {{")
        ts.append(f"      id: '{did}',")
        ts.append(f"      name: '{name}',")
        ts.append(f"      path: '/data/id35_jawa_timur/{entry.name}',")
        ts.append("      subdistricts: [")
        for s in subdistricts:
            ts.append(f"        {{ id: '{s}' }},")
        ts.append("      ],")
        if fallback_file:
            ts.append(f"      fallbackFile: '{fallback_file}'")
        else:
            # Remove trailing comma on subdistricts if no fallback
            if ts[-1].endswith(','):
                ts[-1] = ts[-1][:-1]
        ts.append("    },")
        districts_entries.append('\n'.join(ts))

    # Compose full TS file
    header = "import { ProvinceConfig } from '../types/data-config';\n\n"
    start = (
        "const PROV_35: ProvinceConfig = {\n"
        "  id: '35',\n"
        "  name: 'Jawa Timur',\n"
        "  // Province-level data base (not used directly for subdistricts but kept consistent)\n"
        "  path: '/data/id35_jawa_timur',\n"
        "  districtsFile: '/data/jawa_timu_kab.geojson',\n"
        "  districts: {\n"
    )
    body = '\n'.join(districts_entries)
    end = (
        "  }\n"
        "};\n\n"
        "export default PROV_35;\n"
    )

    content = header + start + body + "\n" + end
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(content, encoding='utf-8')
    print(f"Wrote {OUT_FILE}")


if __name__ == '__main__':
    main()
