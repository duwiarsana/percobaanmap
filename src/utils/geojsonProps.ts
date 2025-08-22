// Centralized helpers for resolving common GeoJSON property naming variants
// Behavior-preserving: only consolidates fallback chains used throughout the app

export const getProvinceName = (p: any): string | undefined =>
  p?.prov_name ?? p?.Propinsi ?? p?.PROVINSI ?? p?.provinsi ?? p?.NAMA;

export const getProvinceId = (p: any): string | number | undefined =>
  p?.prov_id ?? p?.provinsi_id ?? p?.ID ?? p?.KODE;

export const getDistrictName = (p: any): string | undefined =>
  p?.kab_name ?? p?.kabupaten ?? p?.KABUPATEN ?? p?.regency ?? p?.REGION ?? p?.nama ?? p?.NAMA ?? p?.name ?? p?.NAME ?? p?.Nama;

export const getDistrictId = (p: any): string | number | undefined => {
  // Prefer explicit regency (district) code first (e.g., 'id5105')
  const rawReg = p?.regency_code ?? p?.kabupaten_kode ?? p?.kode_kabupaten ?? p?.kab_kode;
  if (rawReg) {
    const d = rawReg.toString().match(/\d+/)?.join('');
    if (d && d.length >= 4) return d.slice(0, 4);
  }

  // Derive regency (first 4 digits) from district_code or village_code if present
  const rawDistrict = p?.district_code;
  if (rawDistrict) {
    const digits = rawDistrict.toString().match(/\d+/)?.join('');
    if (digits && digits.length >= 4) return digits.slice(0, 4);
  }
  const rawVillage = p?.village_code;
  if (rawVillage) {
    const digits = rawVillage.toString().match(/\d+/)?.join('');
    if (digits && digits.length >= 4) return digits.slice(0, 4);
  }

  // Then kabupaten-specific fields
  const kabCandidates = [p?.id_kabupaten, p?.kab_id, p?.kabupaten_id, p?.KODE, p?.code];
  for (const c of kabCandidates) {
    if (!c) continue;
    const d = c.toString().match(/\d+/)?.join('');
    if (d && d.length >= 4) return d.slice(0, 4);
  }

  // Lastly, generic ids (may represent other levels in some datasets)
  const generic = [p?.ID, p?.id, p?.gid]; // intentionally exclude uuid to avoid false matches
  for (const g of generic) {
    if (!g) continue;
    if (typeof g === 'string' && g.includes('-')) continue; // skip UUID-like
    const d = g.toString().match(/\d+/)?.join('');
    if (d && d.length >= 4) return d.slice(0, 4);
  }
  return undefined;
};

export const getSubdistrictName = (p: any): string | undefined =>
  p?.kec_name ?? p?.kecamatan ?? p?.KECAMATAN ?? p?.NAMA ?? p?.nama ?? p?.district ?? p?.name ?? p?.NAME ?? p?.village;
