#!/usr/bin/env python3
"""
Generate dissolved district (kabupaten/kota) boundaries per province.

Usage:
  python3 scripts/make_kab_dissolved.py --province 33 [--force]
  python3 scripts/make_kab_dissolved.py --all [--force]

Logic:
- For each province directory under public/data named id<prov>_<slug>/, e.g. id33_jawa_tengah/
- For each district directory inside, e.g. id3301_cilacap/
  - Prefer fallback file named exactly as folder: id3301_cilacap.geojson
  - If not present, union all .geojson files inside the district directory
- Dissolve all geometries per district using shapely.ops.unary_union into a single polygon/multipolygon
- Write FeatureCollection to public/data/kab_<prov>.geojson with features containing
  properties: regency_code, province_code, kab_name

Requires: shapely
"""
import argparse
import json
import re
from pathlib import Path
from typing import List
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DATA = ROOT / 'public' / 'data'

PROV_DIR_RE = re.compile(r'^id(\d{2})_.+$')
DIST_DIR_RE = re.compile(r'^id(\d{4})_(.+)$')


def list_province_codes() -> List[str]:
    codes = []
    for d in PUBLIC_DATA.iterdir():
        if d.is_dir():
            m = PROV_DIR_RE.match(d.name)
            if m:
                codes.append(m.group(1))
    return sorted(set(codes))


def read_all_geoms(fp: Path):
    try:
        with fp.open('r', encoding='utf-8') as fh:
            data = json.load(fh)
    except Exception as e:
        print(f'[WARN] Failed to read {fp}: {e}')
        return []
    geoms = []
    if isinstance(data, dict):
        if data.get('type') == 'FeatureCollection':
            for feat in (data.get('features') or []):
                if isinstance(feat, dict) and feat.get('geometry'):
                    try:
                        geoms.append(shape(feat['geometry']))
                    except Exception as e:
                        print(f'[WARN] Bad geometry in {fp}: {e}')
        elif data.get('type') == 'Feature' and data.get('geometry'):
            try:
                geoms.append(shape(data['geometry']))
            except Exception as e:
                print(f'[WARN] Bad geometry in {fp}: {e}')
    return geoms


def build_province(prov_code: str, force: bool = False) -> bool:
    prov_dir = next((d for d in PUBLIC_DATA.glob(f'id{prov_code}_*') if d.is_dir()), None)
    if not prov_dir:
        print(f'[WARN] Province {prov_code}: directory not found under {PUBLIC_DATA}')
        return False

    out_path = PUBLIC_DATA / f'kab_{prov_code}.geojson'
    if out_path.exists() and not force:
        print(f'[SKIP] {out_path} exists (use --force to overwrite)')
        return True

    features = []
    for dist_dir in sorted(p for p in prov_dir.iterdir() if p.is_dir() and DIST_DIR_RE.match(p.name)):
        mdir = DIST_DIR_RE.match(dist_dir.name)
        regency_code, slug = mdir.group(1), mdir.group(2)
        kab_name = slug.replace('_', ' ').title()

        fallback = dist_dir / f'{dist_dir.name}.geojson'
        geoms = read_all_geoms(fallback) if fallback.exists() else []
        if not geoms:
            # Union all subdistrict files
            for f in sorted(dist_dir.glob('*.geojson')):
                geoms.extend(read_all_geoms(f))

        if not geoms:
            print(f'[WARN] Province {prov_code}: no geometries found for {dist_dir}')
            continue

        try:
            merged = unary_union(geoms)
        except Exception as e:
            print(f'[WARN] Province {prov_code}: union failed for {dist_dir}: {e}')
            continue

        feature = {
            'type': 'Feature',
            'properties': {
                'regency_code': regency_code,
                'province_code': prov_code,
                'kab_name': kab_name,
            },
            'geometry': mapping(merged)
        }
        features.append(feature)

    if not features:
        print(f'[WARN] Province {prov_code}: no features produced')
        return False

    with out_path.open('w', encoding='utf-8') as f:
        json.dump({'type': 'FeatureCollection', 'features': features}, f, ensure_ascii=False)
    print(f'[OK] Wrote {out_path} with {len(features)} dissolved district boundaries')
    return True


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--province', help='2-digit province code (e.g., 33)')
    g.add_argument('--all', action='store_true', help='Process all provinces found under public/data')
    ap.add_argument('--force', action='store_true', help='Overwrite existing kab_<prov>.geojson')
    args = ap.parse_args()

    if args.province:
        ok = build_province(args.province.zfill(2), force=args.force)
        raise SystemExit(0 if ok else 1)

    # --all
    codes = list_province_codes()
    ok_total = 0
    for code in codes:
        if build_province(code, force=args.force):
            ok_total += 1
    print(f'[SUMMARY] Succeeded: {ok_total}/{len(codes)} provinces')

if __name__ == '__main__':
    main()
