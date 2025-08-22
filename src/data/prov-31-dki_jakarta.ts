import { ProvinceConfig } from '../types/data-config';

const PROV: ProvinceConfig = {
  id: '31',
  name: 'Dki Jakarta',
  path: '/data/id31_dki_jakarta',
  districtsFile: '/data/kab_31.geojson',
  districts: {
    '3101': {
      id: '3101',
      name: 'Kepulauan Seribu',
      path: '/data/id31_dki_jakarta/id3101_kepulauan_seribu',
      subdistricts: [
        { id: 'id3101010_kepulauan_seribu_selatan' },
        { id: 'id3101020_kepulauan_seribu_utara' },
      ],
      fallbackFile: 'id3101_kepulauan_seribu.geojson'
    },
    '3171': {
      id: '3171',
      name: 'Kota Jakarta Selatan',
      path: '/data/id31_dki_jakarta/id3171_kota_jakarta_selatan',
      subdistricts: [
        { id: 'id3171010_jagakarsa' },
        { id: 'id3171020_pasar_minggu' },
        { id: 'id3171030_cilandak' },
        { id: 'id3171040_pesanggrahan' },
        { id: 'id3171050_kebayoran_lama' },
        { id: 'id3171060_kebayoran_baru' },
        { id: 'id3171070_mampang_prapatan' },
        { id: 'id3171080_pancoran' },
        { id: 'id3171090_tebet' },
        { id: 'id3171100_setia_budi' },
      ],
      fallbackFile: 'id3171_kota_jakarta_selatan.geojson'
    },
    '3172': {
      id: '3172',
      name: 'Kota Jakarta Timur',
      path: '/data/id31_dki_jakarta/id3172_kota_jakarta_timur',
      subdistricts: [
        { id: 'id3172010_pasar_rebo' },
        { id: 'id3172020_ciracas' },
        { id: 'id3172030_cipayung' },
        { id: 'id3172040_makasar' },
        { id: 'id3172050_kramat_jati' },
        { id: 'id3172060_jatinegara' },
        { id: 'id3172070_duren_sawit' },
        { id: 'id3172080_cakung' },
        { id: 'id3172090_pulo_gadung' },
        { id: 'id3172100_matraman' },
      ],
      fallbackFile: 'id3172_kota_jakarta_timur.geojson'
    },
    '3173': {
      id: '3173',
      name: 'Kota Jakarta Pusat',
      path: '/data/id31_dki_jakarta/id3173_kota_jakarta_pusat',
      subdistricts: [
        { id: 'id3173010_tanah_abang' },
        { id: 'id3173020_menteng' },
        { id: 'id3173030_senen' },
        { id: 'id3173040_johar_baru' },
        { id: 'id3173050_cempaka_putih' },
        { id: 'id3173060_kemayoran' },
        { id: 'id3173070_sawah_besar' },
        { id: 'id3173080_gambir' },
      ],
      fallbackFile: 'id3173_kota_jakarta_pusat.geojson'
    },
    '3174': {
      id: '3174',
      name: 'Kota Jakarta Barat',
      path: '/data/id31_dki_jakarta/id3174_kota_jakarta_barat',
      subdistricts: [
        { id: 'id3174010_kembangan' },
        { id: 'id3174020_kebon_jeruk' },
        { id: 'id3174030_palmerah' },
        { id: 'id3174040_grogol_petamburan' },
        { id: 'id3174050_tambora' },
        { id: 'id3174060_taman_sari' },
        { id: 'id3174070_cengkareng' },
        { id: 'id3174080_kali_deres' },
      ],
      fallbackFile: 'id3174_kota_jakarta_barat.geojson'
    },
    '3175': {
      id: '3175',
      name: 'Kota Jakarta Utara',
      path: '/data/id31_dki_jakarta/id3175_kota_jakarta_utara',
      subdistricts: [
        { id: 'id3175010_penjaringan' },
        { id: 'id3175020_pademangan' },
        { id: 'id3175030_tanjung_priok' },
        { id: 'id3175040_koja' },
        { id: 'id3175050_kelapa_gading' },
        { id: 'id3175060_cilincing' },
        { id: 'id3175555_danau_sunter_dll' },
        { id: 'id3175888_danau_sunter' },
      ],
      fallbackFile: 'id3175_kota_jakarta_utara.geojson'
    },
  }
};

export default PROV;
