// Shared types for data configuration (provinces → districts → subdistricts)

export interface SubdistrictFile {
  id: string;
  name?: string;
}

export interface DistrictConfig {
  id: string;
  name: string;
  uuid?: string;
  alternativeIds?: string[];
  path: string;
  subdistricts: SubdistrictFile[];
  fallbackFile?: string;
}

export interface ProvinceConfig {
  id: string;
  name: string;
  path: string;
  // Path to the districts (kabupaten/kota) GeoJSON collection used for filtering
  districtsFile?: string;
  districts: Record<string, DistrictConfig>;
}
