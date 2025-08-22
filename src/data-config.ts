// Data configuration for Indonesian administrative divisions
// Structured approach using province-specific metadata files

import type { DistrictConfig, ProvinceConfig } from './types/data-config';
import PROV_51 from './data/prov-51-bali';
import PROV_35 from './data/prov-35-jawa-timur';

export type { SubdistrictFile, DistrictConfig, ProvinceConfig } from './types/data-config';

// Main data configuration (assembled from per-province modules)
export const DATA_CONFIG: Record<string, ProvinceConfig> = {
  '51': PROV_51,
  '35': PROV_35,
};

// Helper functions for district lookup
export function findDistrictConfig(districtId: string | number): DistrictConfig | null {
  const idStr = districtId.toString();

  const normalize = (s: string) => s
    .toLowerCase()
    .replace(/[_\-\s]+/g, '') // remove spaces/underscores/hyphens
    .normalize('NFKD')
    .replace(/[^a-z0-9]/g, '');

  const normQuery = normalize(idStr);
  
  // Search through all provinces and districts
  for (const province of Object.values(DATA_CONFIG)) {
    for (const district of Object.values(province.districts)) {
      // Check main ID
      if (district.id === idStr) {
        return district;
      }
      
      // Check UUID
      if (district.uuid === idStr) {
        return district;
      }
      
      // Check alternative IDs
      if (district.alternativeIds?.includes(idStr)) {
        return district;
      }
      
      // Name-based checks
      const normName = normalize(district.name);
      if (normName && normName === normQuery) {
        return district;
      }
      // Partial in either direction
      if (normName && (normQuery.includes(normName) || normName.includes(normQuery))) {
        return district;
      }
    }
  }
  
  return null;
}

export function getProvinceByDistrictId(districtId: string | number): ProvinceConfig | null {
  const idStr = districtId.toString();
  
  // Extract province ID from district ID (first 2 digits)
  if (idStr.match(/^\d{4}$/)) {
    const provinceId = idStr.substring(0, 2);
    return DATA_CONFIG[provinceId] || null;
  }
  
  // Search through all provinces for UUID or name matches
  for (const province of Object.values(DATA_CONFIG)) {
    for (const district of Object.values(province.districts)) {
      if (district.id === idStr || district.uuid === idStr || 
          district.alternativeIds?.includes(idStr)) {
        return province;
      }
    }
  }
  
  return null;
}
