#!/usr/bin/env python3
"""
Validate public/data layout for provinces/districts.

Checks for each district folder (id<prov><regency>_<district-slug>):
- Has at least one subdistrict .geojson (excluding the combined fallback file)
- Has a combined fallback file named exactly like the district folder + .geojson

Exits with code 1 if any issues are found; prints a concise report.

Examples:
  python3 scripts/validate_data.py                 # scan all provinces
  python3 scripts/validate_data.py --province 35   # scan only province 35
  python3 scripts/validate_data.py --province 51 --slug bali  # scan Bali only
"""
import argparse
import re
from pathlib import Path
from typing import List, Tuple

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DATA = ROOT / 'public' / 'data'

PROV_DIR_PATTERN = re.compile(r'^id(\d{2})_([a-z0-9_]+)$')
DIST_DIR_PATTERN = re.compile(r'^id(\d{4})_([a-z0-9_]+)$')


def find_province_dirs(prov: str | None, slug: str | None) -> List[Path]:
    dirs: List[Path] = []
    if prov:
        pname = f'id{prov.zfill(2)}'
        for d in PUBLIC_DATA.iterdir():
            if not d.is_dir():
                continue
            if not d.name.startswith(pname + '_'):
                continue
            if slug and not d.name.endswith('_' + slug):
                continue
            if PROV_DIR_PATTERN.match(d.name):
                dirs.append(d)
        return dirs
    # else: auto-detect all province dirs
    for d in PUBLIC_DATA.iterdir():
        if d.is_dir() and PROV_DIR_PATTERN.match(d.name):
            dirs.append(d)
    return sorted(dirs)


def validate_district_dir(d: Path) -> Tuple[bool, List[str]]:
    """Return (ok, issues) for a district folder."""
    issues: List[str] = []
    # Expected fallback filename equals folder basename + .geojson
    expected_fallback = d.name + '.geojson'
    subdistrict_count = 0
    has_fallback = False

    for f in d.iterdir():
        if not f.is_file() or not f.name.endswith('.geojson'):
            continue
        if f.name == expected_fallback:
            has_fallback = True
            continue
        subdistrict_count += 1

    if subdistrict_count == 0:
        issues.append('no subdistrict .geojson files')
    if not has_fallback:
        issues.append('missing fallback file: ' + expected_fallback)

    return (len(issues) == 0, issues)


def main() -> None:
    ap = argparse.ArgumentParser(description='Validate public/data province/district layout')
    ap.add_argument('--province', help='Province numeric code (e.g., 35, 51)')
    ap.add_argument('--slug', help='Province slug (e.g., bali, jawa_timur)')
    args = ap.parse_args()

    prov = args.province.zfill(2) if args.province else None
    prov_dirs = find_province_dirs(prov, args.slug)

    if not prov_dirs:
        print('No matching province directories found under public/data')
        raise SystemExit(1)

    total_districts = 0
    bad_districts = 0

    for pdir in prov_dirs:
        print(f'Province: {pdir.name}')
        for d in sorted(pdir.iterdir()):
            if not d.is_dir():
                continue
            if not DIST_DIR_PATTERN.match(d.name):
                continue
            total_districts += 1
            ok, issues = validate_district_dir(d)
            if not ok:
                bad_districts += 1
                print(f'  - {d.name}: ' + '; '.join(issues))
        print()

    if bad_districts:
        print(f'Validation completed with issues: {bad_districts}/{total_districts} districts affected')
        raise SystemExit(1)
    else:
        print(f'Validation passed: {total_districts} districts checked, no issues found')


if __name__ == '__main__':
    main()
