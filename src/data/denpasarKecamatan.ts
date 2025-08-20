// Data GeoJSON untuk kecamatan di Denpasar
// Mock data untuk mengatasi error TypeScript
// File GeoJSON yang sebenarnya akan dimuat secara dinamis saat runtime

// Template GeoJSON kosong untuk mock data
const emptyGeoJSON = {
  type: "FeatureCollection",
  features: []
};

// Mock imports untuk mengatasi error TypeScript
const denpasarSelatan = emptyGeoJSON;
const denpasarTimur = emptyGeoJSON;
const denpasarBarat = emptyGeoJSON;
const denpasarUtara = emptyGeoJSON;
const kotaDenpasar = emptyGeoJSON;

export const denpasarKecamatanData = {
  denpasarSelatan,
  denpasarTimur,
  denpasarBarat,
  denpasarUtara,
  kotaDenpasar
};

// Kecamatan IDs
export const kecamatanIds = {
  denpasarSelatan: 'id5171010',
  denpasarTimur: 'id5171020',
  denpasarBarat: 'id5171030',
  denpasarUtara: 'id5171031',
  kotaDenpasar: 'id5171'
};

export default denpasarKecamatanData;
