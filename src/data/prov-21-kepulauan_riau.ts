import { ProvinceConfig } from '../types/data-config';

const PROV: ProvinceConfig = {
  id: '21',
  name: 'Kepulauan Riau',
  path: '/data/id21_kepulauan_riau',
  districtsFile: '/data/kab_21.geojson',
  districts: {
    '2101': {
      id: '2101',
      name: 'Karimun',
      path: '/data/id21_kepulauan_riau/id2101_karimun',
      subdistricts: [
        { id: 'id2101010_moro' },
        { id: 'id2101011_durai' },
        { id: 'id2101020_kundur' },
        { id: 'id2101021_kundur_utara' },
        { id: 'id2101022_kundur_barat' },
        { id: 'id2101023_ungar' },
        { id: 'id2101024_belat' },
        { id: 'id2101030_karimun' },
        { id: 'id2101031_buru' },
        { id: 'id2101032_meral' },
        { id: 'id2101033_tebing' },
        { id: 'id2101034_meral_barat' },
      ],
      fallbackFile: 'id2101_karimun.geojson'
    },
    '2102': {
      id: '2102',
      name: 'Bintan',
      path: '/data/id21_kepulauan_riau/id2102_bintan',
      subdistricts: [
        { id: 'id2102040_teluk_bintan' },
        { id: 'id2102050_bintan_utara' },
        { id: 'id2102051_teluk_sebong' },
        { id: 'id2102052_seri_kuala_lobam' },
        { id: 'id2102060_bintan_timur' },
        { id: 'id2102061_gunung_kijang' },
        { id: 'id2102062_mantang' },
        { id: 'id2102063_bintan_pesisir' },
        { id: 'id2102064_toapaya' },
        { id: 'id2102070_tambelan' },
      ],
      fallbackFile: 'id2102_bintan.geojson'
    },
    '2103': {
      id: '2103',
      name: 'Natuna',
      path: '/data/id21_kepulauan_riau/id2103_natuna',
      subdistricts: [
        { id: 'id2103030_midai' },
        { id: 'id2103031_suak_midai' },
        { id: 'id2103040_bunguran_barat' },
        { id: 'id2103041_bunguran_utara' },
        { id: 'id2103042_pulau_laut' },
        { id: 'id2103043_pulau_tiga' },
        { id: 'id2103044_bunguran_batubi' },
        { id: 'id2103045_pulau_tiga_barat' },
        { id: 'id2103050_bunguran_timur' },
        { id: 'id2103051_bunguran_timur_laut' },
        { id: 'id2103052_bunguran_tengah' },
        { id: 'id2103053_bunguran_selatan' },
        { id: 'id2103060_serasan' },
        { id: 'id2103061_subi' },
        { id: 'id2103062_serasan_timur' },
      ],
      fallbackFile: 'id2103_natuna.geojson'
    },
    '2104': {
      id: '2104',
      name: 'Lingga',
      path: '/data/id21_kepulauan_riau/id2104_lingga',
      subdistricts: [
        { id: 'id2104010_singkep_barat' },
        { id: 'id2104011_kepulauan_posek' },
        { id: 'id2104020_singkep' },
        { id: 'id2104021_singkep_selatan' },
        { id: 'id2104022_singkep_pesisir' },
        { id: 'id2104030_lingga' },
        { id: 'id2104031_selayar' },
        { id: 'id2104032_lingga_timur' },
        { id: 'id2104040_lingga_utara' },
        { id: 'id2104050_senayang' },
      ],
      fallbackFile: 'id2104_lingga.geojson'
    },
    '2105': {
      id: '2105',
      name: 'Kepulauan Anambas',
      path: '/data/id21_kepulauan_riau/id2105_kepulauan_anambas',
      subdistricts: [
        { id: 'id2105010_jemaja' },
        { id: 'id2105020_jemaja_timur' },
        { id: 'id2105030_siantan_selatan' },
        { id: 'id2105040_siantan' },
        { id: 'id2105050_siantan_timur' },
        { id: 'id2105060_siantan_tengah' },
        { id: 'id2105070_palmatak' },
      ],
      fallbackFile: 'id2105_kepulauan_anambas.geojson'
    },
    '2171': {
      id: '2171',
      name: 'Kota Batam',
      path: '/data/id21_kepulauan_riau/id2171_kota_batam',
      subdistricts: [
        { id: 'id2171010_belakang_padang' },
        { id: 'id2171020_bulang' },
        { id: 'id2171030_galang' },
        { id: 'id2171040_sei_beduk' },
        { id: 'id2171041_sagulung' },
        { id: 'id2171050_nongsa' },
        { id: 'id2171051_batam_kota' },
        { id: 'id2171060_sekupang' },
        { id: 'id2171061_batu_aji' },
        { id: 'id2171070_lubuk_baja' },
        { id: 'id2171080_batu_ampar' },
        { id: 'id2171081_bengkong' },
      ],
      fallbackFile: 'id2171_kota_batam.geojson'
    },
    '2172': {
      id: '2172',
      name: 'Kota Tanjung Pinang',
      path: '/data/id21_kepulauan_riau/id2172_kota_tanjung_pinang',
      subdistricts: [
        { id: 'id2172010_bukit_bestari' },
        { id: 'id2172020_tanjungpinang_timur' },
        { id: 'id2172030_tanjungpinang_kota' },
        { id: 'id2172040_tanjungpinang_barat' },
      ],
      fallbackFile: 'id2172_kota_tanjung_pinang.geojson'
    },
  }
};

export default PROV;
