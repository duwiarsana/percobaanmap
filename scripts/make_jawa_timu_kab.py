#!/usr/bin/env python3
"""
Extract Jawa Timur (province 35) district (kabupaten/kota) features from a nationwide
kabupaten GeoJSON and write them to public/data/jawa_timu_kab.geojson.

Usage (from repo root):
  python3 scripts/make_jawa_timu_kab.py \
    --source public/data/kab_37.geojson \
    --output public/data/jawa_timu_kab.geojson \
    --province 35

The script is defensive about schema differences and checks multiple common
property names to determine province and district codes.
"""
import argparse
import json
import os
import re
import sys
from typing import Any, Dict, Optional

PROVINCE_CODE = '35'

# Common property keys seen across datasets
PROV_KEYS = [
    'prov_id', 'ID_PROV', 'kode_prov', 'KODE_PROV', 'Kode_Prov', 'PROVNO'
]
DISTRICT_KEYS = [
    'kab_id', 'ID_KAB', 'id_kab', 'kab_kota', 'KABKOTNO', 'KAB_NO',
    'kode_kab', 'KODE_KAB', 'Kode_Kab', 'kode', 'KODE', 'REGC', 'WADMKK'
]

def normalize_digits(val: Any) -> Optional[str]:
    if val is None:
        return None
    s = str(val)
    m = re.search(r"\d+", s)
    return m.group(0) if m else None


def get_province_code(props: Dict[str, Any]) -> Optional[str]:
    # Direct province code fields
    for key in PROV_KEYS:
        if key in props:
            digits = normalize_digits(props.get(key))
            if digits:
                return digits
    # Derive from district code (first two digits of a 4-digit kab/kota code)
    for key in DISTRICT_KEYS:
        if key in props:
            digits = normalize_digits(props.get(key))
            if digits and re.fullmatch(r"\d{4}", digits):
                return digits[:2]
    # Some datasets may encode in a generic 'kode' or nested codes
    kode = normalize_digits(props.get('kode') or props.get('KODE'))
    if kode and re.fullmatch(r"\d{4}", kode):
        return kode[:2]
    return None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', default='public/data/kab_37.geojson', help='Path to nationwide kabupaten GeoJSON')
    parser.add_argument('--output', default='public/data/jawa_timu_kab.geojson', help='Output path for Jawa Timur districts')
    parser.add_argument('--province', default=PROVINCE_CODE, help='Province code to filter (e.g., 35 for Jawa Timur)')
    args = parser.parse_args()

    if not os.path.exists(args.source):
        print(f"Source not found: {args.source}", file=sys.stderr)
        sys.exit(1)

    with open(args.source, 'r', encoding='utf-8') as f:
        data = json.load(f)

    features = data.get('features') or []
    if not isinstance(features, list):
        print('Invalid GeoJSON: features is not a list', file=sys.stderr)
        sys.exit(1)

    kept = []
    for feat in features:
        props = feat.get('properties') or {}
        prov = get_province_code(props)
        if prov == str(args.province):
            kept.append(feat)

    out = {
        'type': 'FeatureCollection',
        'features': kept,
    }

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False)

    print(f"Wrote {len(kept)} features to {args.output}")


if __name__ == '__main__':
    main()
