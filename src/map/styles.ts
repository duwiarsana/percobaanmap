import { getDistrictName, getSubdistrictName } from '../utils/geojsonProps';
import type { PathOptions } from 'leaflet';

// Factory to create a district style function bound to the current selectedDistrict
export const createDistrictStyle = (selectedDistrict: string | null) => {
  return (feature: any) => {
    const props = feature.properties;
    const districtName = getDistrictName(props);
    const isSelected = selectedDistrict === districtName;
    return {
      // Softer teal palette for districts; highlight selected slightly warmer
      fillColor: isSelected ? '#f5b867' : '#9ad3c9',
      weight: 0.8,
      opacity: 1,
      color: '#f7f7f7',
      fillOpacity: isSelected ? 0.72 : 0.55,
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
  // Pastel palette for gentler visual tone
  const colors = ['#A3E4D7', '#F9E79F', '#F5CBA7', '#D7BDE2', '#AED6F1', '#FADBD8', '#ABEBC6', '#FDEBD0'];
  return {
    weight: 0.6,
    opacity: 0.9,
    color: '#ffffff',
    fillColor: colors[Math.abs(hash) % colors.length],
    fillOpacity: 0.5,
  } as PathOptions;
};
