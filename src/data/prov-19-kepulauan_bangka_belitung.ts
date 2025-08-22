import { ProvinceConfig } from '../types/data-config';

const PROV: ProvinceConfig = {
  id: '19',
  name: 'Kepulauan Bangka Belitung',
  path: '/data/id19_kepulauan_bangka_belitung',
  districtsFile: '/data/kab_19.geojson',
  districts: {
    '1901': {
      id: '1901',
      name: 'Bangka',
      path: '/data/id19_kepulauan_bangka_belitung/id1901_bangka',
      subdistricts: [
        { id: 'id1901070_mendo_barat' },
        { id: 'id1901080_merawang' },
        { id: 'id1901081_puding_besar' },
        { id: 'id1901090_sungai_liat' },
        { id: 'id1901091_pemali' },
        { id: 'id1901092_bakam' },
        { id: 'id1901130_belinyu' },
        { id: 'id1901131_riau_silip' },
      ],
      fallbackFile: 'id1901_bangka.geojson'
    },
    '1902': {
      id: '1902',
      name: 'Belitung',
      path: '/data/id19_kepulauan_bangka_belitung/id1902_belitung',
      subdistricts: [
        { id: 'id1902010_membalong' },
        { id: 'id1902060_tanjung_pandan' },
        { id: 'id1902061_badau' },
        { id: 'id1902062_sijuk' },
        { id: 'id1902063_selat_nasik' },
      ],
      fallbackFile: 'id1902_belitung.geojson'
    },
    '1903': {
      id: '1903',
      name: 'Bangka Barat',
      path: '/data/id19_kepulauan_bangka_belitung/id1903_bangka_barat',
      subdistricts: [
        { id: 'id1903010_kelapa' },
        { id: 'id1903020_tempilang' },
        { id: 'id1903030_mentok' },
        { id: 'id1903040_simpang_teritip' },
        { id: 'id1903050_jebus' },
        { id: 'id1903051_parittiga' },
      ],
      fallbackFile: 'id1903_bangka_barat.geojson'
    },
    '1904': {
      id: '1904',
      name: 'Bangka Tengah',
      path: '/data/id19_kepulauan_bangka_belitung/id1904_bangka_tengah',
      subdistricts: [
        { id: 'id1904010_koba' },
        { id: 'id1904011_lubuk_besar' },
        { id: 'id1904020_pangkalan_baru' },
        { id: 'id1904021_namang' },
        { id: 'id1904030_sungai_selan' },
        { id: 'id1904040_simpang_katis' },
      ],
      fallbackFile: 'id1904_bangka_tengah.geojson'
    },
    '1905': {
      id: '1905',
      name: 'Bangka Selatan',
      path: '/data/id19_kepulauan_bangka_belitung/id1905_bangka_selatan',
      subdistricts: [
        { id: 'id1905010_payung' },
        { id: 'id1905011_pulau_besar' },
        { id: 'id1905020_simpang_rimba' },
        { id: 'id1905030_toboali' },
        { id: 'id1905031_tukak_sadai' },
        { id: 'id1905040_air_gegas' },
        { id: 'id1905050_lepar_pongok' },
        { id: 'id1905051_kepulauan_pongok' },
      ],
      fallbackFile: 'id1905_bangka_selatan.geojson'
    },
    '1906': {
      id: '1906',
      name: 'Belitung Timur',
      path: '/data/id19_kepulauan_bangka_belitung/id1906_belitung_timur',
      subdistricts: [
        { id: 'id1906010_dendang' },
        { id: 'id1906011_simpang_pesak' },
        { id: 'id1906020_gantung' },
        { id: 'id1906021_simpang_renggiang' },
        { id: 'id1906030_manggar' },
        { id: 'id1906031_damar' },
        { id: 'id1906040_kelapa_kampit' },
      ],
      fallbackFile: 'id1906_belitung_timur.geojson'
    },
    '1971': {
      id: '1971',
      name: 'Kota Pangkal Pinang',
      path: '/data/id19_kepulauan_bangka_belitung/id1971_kota_pangkal_pinang',
      subdistricts: [
        { id: 'id1971010_rangkui' },
        { id: 'id1971020_bukit_intan' },
        { id: 'id1971021_girimaya' },
        { id: 'id1971030_pangkal_balam' },
        { id: 'id1971031_gabek' },
        { id: 'id1971040_taman_sari' },
        { id: 'id1971041_gerunggang' },
      ],
      fallbackFile: 'id1971_kota_pangkal_pinang.geojson'
    },
  }
};

export default PROV;
