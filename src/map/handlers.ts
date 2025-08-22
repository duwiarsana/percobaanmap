import { getDistrictName, getDistrictId, getSubdistrictName } from '../utils/geojsonProps';
import { findDistrictConfig } from '../data-config';
import type { PathOptions, Layer, LeafletMouseEvent } from 'leaflet';
import { getAppBridge } from '../appBridge';

// Creates an onEachFeature handler for districts (kabupaten)
export const createOnEachDistrict = (
  styleDistrict: (feature: any) => PathOptions
) => {
  return (feature: any, layer: Layer) => {
    const props = feature.properties;
    const districtName = getDistrictName(props);
    const districtId = getDistrictId(props);

    if (districtName) {
      layer.bindTooltip(districtName, { sticky: true, className: 'custom-tooltip' });
      layer.on({
        click: (e: LeafletMouseEvent) => {
          const bridge = getAppBridge();
          if (bridge && districtName) {
            // Prefer config-based ID by district name (ensures 4-digit regency code like 5103)
            const cfg = findDistrictConfig(districtName);
            const preferredId = cfg?.id ?? districtId;
            // Normalize ID like 'id5103_badung' or 'id5103' -> '5103'
            const normId = typeof preferredId === 'number' ? preferredId : (preferredId?.toString().match(/\d+/)?.join('') || preferredId);
            // Debug: show which props were used to derive ID
            try {
              const keys = Object.keys(props || {});
              console.log('[DistrictClick] name=', districtName, 'rawId=', districtId, 'cfgId=', cfg?.id, 'normId=', normId, 'keys=', keys);
              console.log('[DistrictClick] sample codes:', {
                regency_code: (props as any)?.regency_code,
                district_code: (props as any)?.district_code,
                village_code: (props as any)?.village_code,
                kabupaten: (props as any)?.kabupaten,
                kab_name: (props as any)?.kab_name,
                KODE: (props as any)?.KODE,
                ID: (props as any)?.ID,
                id: (props as any)?.id,
              });
            } catch {}
            bridge.setIsZooming?.(true);
            bridge.setSelectedDistrict?.(districtName);
            bridge.setSelectedDistrictId?.(normId as any);
            const map = (e as any).target._map;
            if (map) {
              const bounds = (e as any).target.getBounds();
              map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 11, duration: 0.8 });
              setTimeout(() => {
                bridge.setIsZooming?.(false);
              }, 900);
            }
          }
        },
        mouseover: (e: LeafletMouseEvent) => (e as any).target.setStyle({ weight: 3, fillOpacity: 0.9 }),
        mouseout: (e: LeafletMouseEvent) => (e as any).target.setStyle(styleDistrict(feature)),
      });
    }
  };
};

// Creates an onEachFeature handler for subdistricts (kecamatan)
export const createOnEachSubdistrict = (
  styleSubdistrict: (feature: any) => PathOptions
) => {
  return (feature: any, layer: Layer) => {
    const props = feature.properties;
    const kecamatanName = getSubdistrictName(props);
    if (kecamatanName) {
      layer.bindTooltip(kecamatanName, { sticky: true, className: 'custom-tooltip kecamatan-tooltip' });
      layer.on({
        click: (e: LeafletMouseEvent) => {
          const map = (e as any).target._map;
          if (map) {
            const bounds = (e as any).target.getBounds();
            map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 13, duration: 0.5 });
          }
        },
        mouseover: (e: LeafletMouseEvent) => (e as any).target.setStyle({ weight: 4, color: '#FFFFFF', fillOpacity: 0.9 }),
        mouseout: (e: LeafletMouseEvent) => (e as any).target.setStyle(styleSubdistrict(feature)),
      });
    }
  };
};
