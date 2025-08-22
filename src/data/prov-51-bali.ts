import { ProvinceConfig } from '../types/data-config';

const PROV_51: ProvinceConfig = {
  id: '51',
  name: 'Bali',
  path: '/data/id51_bali',
  districtsFile: '/data/kab_37.geojson',
  districts: {
    '5101': {
      id: '5101',
      name: 'Jembrana',
      uuid: '0ef10160-a253-471d-92b6-8d256e6f034f',
      path: '/data/id51_bali/id5101_jembrana',
      subdistricts: [
        { id: 'id5101010_melaya' },
        { id: 'id5101020_negara' },
        { id: 'id5101021_jembrana' },
        { id: 'id5101030_mendoyo' },
        { id: 'id5101040_pekutatan' }
      ],
      fallbackFile: 'id5101_jembrana.geojson'
    },
    '5102': {
      id: '5102',
      name: 'Tabanan',
      uuid: 'f844eec7-5138-497c-a182-fff159c658d9',
      alternativeIds: ['9e5b3d4a-c62d-4d2e-a1c6-3c7e0da93c2a'],
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
        { id: 'id5102080_pupuan' }
      ],
      fallbackFile: 'id5102_tabanan.geojson'
    },
    '5103': {
      id: '5103',
      name: 'Badung',
      uuid: '46b426f4-ef81-486e-bfc6-d5e2fc09bc41',
      path: '/data/id51_bali/id5103_badung',
      subdistricts: [
        { id: 'id5103010_kuta_selatan' },
        { id: 'id5103020_kuta' },
        { id: 'id5103030_kuta_utara' },
        { id: 'id5103040_mengwi' },
        { id: 'id5103050_abiansemal' },
        { id: 'id5103060_petang' }
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
        { id: 'id5104070_payangan' }
      ],
      fallbackFile: 'id5104_gianyar.geojson'
    },
    '5105': {
      id: '5105',
      name: 'Klungkung',
      uuid: '4cd14b20-1d06-4de3-8d86-2046967aee26',
      path: '/data/id51_bali/id5105_klungkung',
      subdistricts: [
        { id: 'id5105010_nusapenida' },
        { id: 'id5105020_banjarangkan' },
        { id: 'id5105030_klungkung' },
        { id: 'id5105040_dawan' }
      ],
      fallbackFile: 'id5105_klungkung.geojson'
    },
    '5106': {
      id: '5106',
      name: 'Bangli',
      uuid: '218556bd-88ea-4c69-81f6-8bfd4249faf2',
      path: '/data/id51_bali/id5106_bangli',
      subdistricts: [
        { id: 'id5106010_susut' },
        { id: 'id5106020_bangli' },
        { id: 'id5106030_tembuku' },
        { id: 'id5106040_kintamani' }
      ],
      fallbackFile: 'id5106_bangli.geojson'
    },
    '5107': {
      id: '5107',
      name: 'Karangasem',
      uuid: '46950146-2da7-4f8d-a7b2-829eca5d55eb',
      path: '/data/id51_bali/id5107_karang_asem',
      subdistricts: [
        { id: 'id5107010_rendang' },
        { id: 'id5107020_sidemen' },
        { id: 'id5107030_manggis' },
        { id: 'id5107040_karangasem' },
        { id: 'id5107050_abang' },
        { id: 'id5107060_bebandem' },
        { id: 'id5107070_selat' },
        { id: 'id5107080_kubu' }
      ],
      fallbackFile: 'id5107_karang_asem.geojson'
    },
    '5108': {
      id: '5108',
      name: 'Buleleng',
      uuid: '1738b7a8-fc72-4c53-a745-be655256cb3d',
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
        { id: 'id5108090_tejakula' }
      ],
      fallbackFile: 'id5108_buleleng.geojson'
    },
    '5171': {
      id: '5171',
      name: 'Denpasar',
      uuid: 'af24d240-4608-4e2e-a313-146d4eb2998b',
      path: '/data/id51_bali/id5171_kota_denpasar',
      subdistricts: [
        { id: 'id5171010_denpasar_selatan' },
        { id: 'id5171020_denpasar_timur' },
        { id: 'id5171030_denpasar_barat' },
        { id: 'id5171031_denpasar_utara' }
      ],
      fallbackFile: 'id5171_kota_denpasar.geojson'
    }
  }
};

export default PROV_51;
