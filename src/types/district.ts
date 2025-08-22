export interface DistrictData {
  id: string;
  name: string;
  code: string;
  kecamatan: Kecamatan[];
}

export interface Kecamatan {
  id: string;
  name: string;
  file?: string; // Nama file GeoJSON tanpa ekstensi
}
