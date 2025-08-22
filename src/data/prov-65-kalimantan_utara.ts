import { ProvinceConfig } from '../types/data-config';

const PROV: ProvinceConfig = {
  id: '65',
  name: 'Kalimantan Utara',
  path: '/data/id65_kalimantan_utara',
  districtsFile: '/data/kab_65.geojson',
  districts: {
    '6501': {
      id: '6501',
      name: 'Malinau',
      path: '/data/id65_kalimantan_utara/id6501_malinau',
      subdistricts: [
        { id: 'id6501010_sungai_boh' },
        { id: 'id6501020_kayan_selatan' },
        { id: 'id6501030_kayan_hulu' },
        { id: 'id6501040_kayan_hilir' },
        { id: 'id6501050_pujungan' },
        { id: 'id6501060_bahau_hulu' },
        { id: 'id6501070_sungai_tubu' },
        { id: 'id6501080_malinau_selatan_hulu' },
        { id: 'id6501090_malinau_selatan' },
        { id: 'id6501100_malinau_selatan_hilir' },
        { id: 'id6501110_mentarang' },
        { id: 'id6501120_mentarang_hulu' },
        { id: 'id6501130_malinau_utara' },
        { id: 'id6501140_malinau_barat' },
        { id: 'id6501150_malinau_kota' },
      ],
      fallbackFile: 'id6501_malinau.geojson'
    },
    '6502': {
      id: '6502',
      name: 'Bulungan',
      path: '/data/id65_kalimantan_utara/id6502_bulungan',
      subdistricts: [
        { id: 'id6502010_peso' },
        { id: 'id6502020_peso_hilir' },
        { id: 'id6502030_tanjung_palas_barat' },
        { id: 'id6502040_tanjung_palas' },
        { id: 'id6502050_tanjung_selor' },
        { id: 'id6502060_tanjung_palas_timur' },
        { id: 'id6502070_tanjung_palas_tengah' },
        { id: 'id6502080_tanjung_palas_utara' },
        { id: 'id6502090_sekatak' },
        { id: 'id6502100_bunyu' },
      ],
      fallbackFile: 'id6502_bulungan.geojson'
    },
    '6503': {
      id: '6503',
      name: 'Tana Tidung',
      path: '/data/id65_kalimantan_utara/id6503_tana_tidung',
      subdistricts: [
        { id: 'id6503010_muruk_rian' },
        { id: 'id6503020_sesayap' },
        { id: 'id6503030_betayau' },
        { id: 'id6503040_sesayap_hilir' },
        { id: 'id6503050_tana_lia' },
      ],
      fallbackFile: 'id6503_tana_tidung.geojson'
    },
    '6504': {
      id: '6504',
      name: 'Nunukan',
      path: '/data/id65_kalimantan_utara/id6504_nunukan',
      subdistricts: [
        { id: 'id6504010_krayan_selatan' },
        { id: 'id6504011_krayan_tengah' },
        { id: 'id6504020_krayan' },
        { id: 'id6504021_krayan_timur' },
        { id: 'id6504022_krayan_barat' },
        { id: 'id6504030_lumbis_ogong' },
        { id: 'id6504040_lumbis' },
        { id: 'id6504050_sembakung_atulai' },
        { id: 'id6504060_sembakung' },
        { id: 'id6504070_sebuku' },
        { id: 'id6504080_tulin_onsoi' },
        { id: 'id6504090_sei_menggaris' },
        { id: 'id6504100_nunukan' },
        { id: 'id6504110_nunukan_selatan' },
        { id: 'id6504120_sebatik_barat' },
        { id: 'id6504130_sebatik' },
        { id: 'id6504140_sebatik_timur' },
        { id: 'id6504150_sebatik_tengah' },
        { id: 'id6504160_sebatik_utara' },
      ],
      fallbackFile: 'id6504_nunukan.geojson'
    },
    '6571': {
      id: '6571',
      name: 'Kota Tarakan',
      path: '/data/id65_kalimantan_utara/id6571_kota_tarakan',
      subdistricts: [
        { id: 'id6571010_tarakan_timur' },
        { id: 'id6571020_tarakan_tengah' },
        { id: 'id6571030_tarakan_barat' },
        { id: 'id6571040_tarakan_utara' },
      ],
      fallbackFile: 'id6571_kota_tarakan.geojson'
    },
  }
};

export default PROV;
