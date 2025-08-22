#!/usr/bin/env python3
"""
Generic province config generator.

Scans public/data/id<province>_<slug>/ for district directories named
  id<province><regency>_<district-slug>
collects subdistrict .geojson basenames, detects a combined fallback file, and
writes a ProvinceConfig module at:
  src/data/prov-<province>-<slug>.ts

Examples:
  python3 scripts/gen_province_config.py --province 51 --slug bali --name "Bali"
  python3 scripts/gen_province_config.py --province 35 --slug jawa_timur --name "Jawa Timur" \
    --districts-file /data/jawa_timu_kab.geojson

By default, districtsFile is set to /data/kab_37.geojson (shared all-province file).
Override via --districts-file if you have a province-specific districts collection.
"""
import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DATA = ROOT / 'public' / 'data'
OUT_DIR = ROOT / 'src' / 'data'

# id<prov><regency>_<slug>
DIST_DIR_PATTERN = re.compile(r"^id(\d{2}\d{2})_(.+)$")  # captures 4-digit regency code after province


def to_title(name: str) -> str:
    s = name.replace('_', ' ').strip()
    return ' '.join(w.capitalize() for w in s.split())


def gen_province_ts(prov: str, slug: str, name: str, districts_file: str) -> str:
    prov_dir_name = f"id{prov}_{slug}"
    base_dir = PUBLIC_DATA / prov_dir_name
    if not base_dir.exists():
        raise SystemExit(f"Missing data directory: {base_dir}")

    entries = []
    for entry in sorted(base_dir.iterdir()):
        if not entry.is_dir():
            continue
        m = DIST_DIR_PATTERN.match(entry.name)
        if not m:
            # not a district folder, skip
            continue
        regency4, dist_slug = m.groups()
        # Ensure the captured 4 digits start with province
        if not regency4.startswith(prov):
            # safety: skip mismatched
            continue
        dist_name = to_title(dist_slug)

        subdistricts = []
        fallback_file = None
        for f in sorted(entry.iterdir()):
            if not f.is_file() or not f.name.endswith('.geojson'):
                continue
            stem = f.stem
            # Fallback named exactly like folder + .geojson
            if stem == entry.name:
                fallback_file = f.name
                continue
            subdistricts.append(stem)

        ts = []
        ts.append(f"    '{regency4}': {{")
        ts.append(f"      id: '{regency4}',")
        ts.append(f"      name: '{dist_name}',")
        ts.append(f"      path: '/data/{prov_dir_name}/{entry.name}',")
        ts.append("      subdistricts: [")
        for s in subdistricts:
            ts.append(f"        {{ id: '{s}' }},")
        ts.append("      ],")
        if fallback_file:
            ts.append(f"      fallbackFile: '{fallback_file}'")
        else:
            if ts[-1].endswith(','):
                ts[-1] = ts[-1][:-1]
        ts.append("    },")
        entries.append('\n'.join(ts))

    header = "import { ProvinceConfig } from '../types/data-config';\n\n"
    start = (
        "const PROV: ProvinceConfig = {\n"
        f"  id: '{prov}',\n"
        f"  name: '{name}',\n"
        f"  path: '/data/id{prov}_{slug}',\n"
        f"  districtsFile: '{districts_file}',\n"
        "  districts: {\n"
    )
    body = '\n'.join(entries)
    end = (
        "  }\n"
        "};\n\n"
        "export default PROV;\n"
    )
    return header + start + body + "\n" + end


def main() -> None:
    p = argparse.ArgumentParser(description='Generate ProvinceConfig by scanning public data folders')
    p.add_argument('--province', required=True, help='Province numeric code (e.g., 35, 51)')
    p.add_argument('--slug', required=True, help='Province slug (e.g., bali, jawa_timur)')
    p.add_argument('--name', required=False, help='Province display name (e.g., Bali)')
    p.add_argument('--districts-file', default='/data/kab_37.geojson', help='URL for the districts collection file')
    p.add_argument('--out', help='Override output TS path (default: src/data/prov-<prov>-<slug>.ts)')

    args = p.parse_args()
    prov = str(args.province).zfill(2)  # normalize to 2-digit province code
    slug = args.slug
    name = args.name or to_title(slug)
    districts_file = args.districts_file

    ts_content = gen_province_ts(prov, slug, name, districts_file)
    out_path = Path(args.out) if args.out else (OUT_DIR / f"prov-{prov}-{slug}.ts")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(ts_content, encoding='utf-8')
    print(f"Wrote {out_path}")


if __name__ == '__main__':
    main()
