import { getDistrictName, getSubdistrictName } from '../utils/geojsonProps';
import type { PathOptions } from 'leaflet';

// Factory to create a district style function bound to the current selectedDistrict
export const createDistrictStyle = (selectedDistrict: string | null) => {
  return (feature: any) => {
    const props = feature.properties;
    const districtName = getDistrictName(props);
    const isSelected = selectedDistrict === districtName;
    return {
      fillColor: isSelected ? '#f5a623' : '#4a90e2',
      weight: 1.5,
      opacity: 1,
      color: 'white',
      fillOpacity: isSelected ? 0.8 : 0.6,
    } as PathOptions;
  };
};

// Static subdistrict style function (no external dependency)
export const subdistrictStyle = (feature: any) => {
  const props = feature.properties;
  const kecamatanName = getSubdistrictName(props);
  let hash = 0;
  if (kecamatanName) {
    for (let i = 0; i < kecamatanName.length; i++) {
      hash = ((hash << 5) - hash) + kecamatanName.charCodeAt(i);
      hash |= 0;
    }
  }
  const colors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A8', '#33FFF0', '#F3FF33', '#FF9933'];
  return {
    weight: 2,
    opacity: 1.0,
    color: '#000000',
    fillColor: colors[Math.abs(hash) % colors.length],
    fillOpacity: 0.7,
  } as PathOptions;
};
