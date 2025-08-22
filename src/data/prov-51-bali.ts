import { ProvinceConfig } from '../types/data-config';

const PROV: ProvinceConfig = {
  id: '51',
  name: 'Bali',
  path: '/data/id51_bali',
  districtsFile: '/data/kab_51.geojson',
  districts: {
    '5101': {
      id: '5101',
      name: 'Jembrana',
      path: '/data/id51_bali/id5101_jembrana',
      subdistricts: [
        { id: 'id5101010_melaya' },
        { id: 'id5101020_negara' },
        { id: 'id5101021_jembrana' },
        { id: 'id5101030_mendoyo' },
        { id: 'id5101040_pekutatan' },
      ],
      fallbackFile: 'id5101_jembrana.geojson'
    },
    '5102': {
      id: '5102',
      name: 'Tabanan',
      path: '/data/id51_bali/id5102_tabanan',
      subdistricts: [
        { id: 'id5102010_selemadeg' },
        { id: 'id5102011_selemadeg_timur' },
        { id: 'id5102012_selemadeg_barat' },
        { id: 'id5102020_kerambitan' },
        { id: 'id5102030_tabanan' },
        { id: 'id5102040_kediri' },
        { id: 'id5102050_marga' },
        { id: 'id5102060_baturiti' },
        { id: 'id5102070_penebel' },
        { id: 'id5102080_pupuan' },
      ],
      fallbackFile: 'id5102_tabanan.geojson'
    },
    '5103': {
      id: '5103',
      name: 'Badung',
      path: '/data/id51_bali/id5103_badung',
      subdistricts: [
        { id: 'id5103010_kuta_selatan' },
        { id: 'id5103020_kuta' },
        { id: 'id5103030_kuta_utara' },
        { id: 'id5103040_mengwi' },
        { id: 'id5103050_abiansemal' },
        { id: 'id5103060_petang' },
      ],
      fallbackFile: 'id5103_badung.geojson'
    },
    '5104': {
      id: '5104',
      name: 'Gianyar',
      path: '/data/id51_bali/id5104_gianyar',
      subdistricts: [
        { id: 'id5104010_sukawati' },
        { id: 'id5104020_blahbatuh' },
        { id: 'id5104030_gianyar' },
        { id: 'id5104040_tampaksiring' },
        { id: 'id5104050_ubud' },
        { id: 'id5104060_tegallalang' },
        { id: 'id5104070_payangan' },
      ],
      fallbackFile: 'id5104_gianyar.geojson'
    },
    '5105': {
      id: '5105',
      name: 'Klungkung',
      path: '/data/id51_bali/id5105_klungkung',
      subdistricts: [
        { id: 'id5105010_nusapenida' },
        { id: 'id5105020_banjarangkan' },
        { id: 'id5105030_klungkung' },
        { id: 'id5105040_dawan' },
      ],
      fallbackFile: 'id5105_klungkung.geojson'
    },
    '5106': {
      id: '5106',
      name: 'Bangli',
      path: '/data/id51_bali/id5106_bangli',
      subdistricts: [
        { id: 'id5106010_susut' },
        { id: 'id5106020_bangli' },
        { id: 'id5106030_tembuku' },
        { id: 'id5106040_kintamani' },
      ],
      fallbackFile: 'id5106_bangli.geojson'
    },
    '5107': {
      id: '5107',
      name: 'Karang Asem',
      path: '/data/id51_bali/id5107_karang_asem',
      subdistricts: [
        { id: 'id5107010_rendang' },
        { id: 'id5107020_sidemen' },
        { id: 'id5107030_manggis' },
        { id: 'id5107040_karangasem' },
        { id: 'id5107050_abang' },
        { id: 'id5107060_bebandem' },
        { id: 'id5107070_selat' },
        { id: 'id5107080_kubu' },
      ],
      fallbackFile: 'id5107_karang_asem.geojson'
    },
    '5108': {
      id: '5108',
      name: 'Buleleng',
      path: '/data/id51_bali/id5108_buleleng',
      subdistricts: [
        { id: 'id5108010_gerokgak' },
        { id: 'id5108020_seririt' },
        { id: 'id5108030_busungbiu' },
        { id: 'id5108040_banjar' },
        { id: 'id5108050_sukasada' },
        { id: 'id5108060_buleleng' },
        { id: 'id5108070_sawan' },
        { id: 'id5108080_kubutambahan' },
        { id: 'id5108090_tejakula' },
      ],
      fallbackFile: 'id5108_buleleng.geojson'
    },
    '5171': {
      id: '5171',
      name: 'Kota Denpasar',
      path: '/data/id51_bali/id5171_kota_denpasar',
      subdistricts: [
        { id: 'id5171010_denpasar_selatan' },
        { id: 'id5171020_denpasar_timur' },
        { id: 'id5171030_denpasar_barat' },
        { id: 'id5171031_denpasar_utara' },
      ],
      fallbackFile: 'id5171_kota_denpasar.geojson'
    },
  }
};

export default PROV;
