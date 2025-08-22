import { ProvinceConfig } from '../types/data-config';

const PROV: ProvinceConfig = {
  id: '76',
  name: 'Sulawesi Barat',
  path: '/data/id76_sulawesi_barat',
  districtsFile: '/data/kab_76.geojson',
  districts: {
    '7601': {
      id: '7601',
      name: 'Majene',
      path: '/data/id76_sulawesi_barat/id7601_majene',
      subdistricts: [
        { id: 'id7601010_banggae' },
        { id: 'id7601011_banggae_timur' },
        { id: 'id7601020_pamboang' },
        { id: 'id7601030_sendana' },
        { id: 'id7601031_tammerodo' },
        { id: 'id7601033_tubo_sendana' },
        { id: 'id7601040_malunda' },
        { id: 'id7601041_ulumanda' },
      ],
      fallbackFile: 'id7601_majene.geojson'
    },
    '7602': {
      id: '7602',
      name: 'Polewali Mandar',
      path: '/data/id76_sulawesi_barat/id7602_polewali_mandar',
      subdistricts: [
        { id: 'id7602010_tinambung' },
        { id: 'id7602011_balanipa' },
        { id: 'id7602012_limboro' },
        { id: 'id7602020_tubbi_taramanu' },
        { id: 'id7602021_alu' },
        { id: 'id7602030_campalagian' },
        { id: 'id7602031_luyo' },
        { id: 'id7602040_wonomulyo' },
        { id: 'id7602041_mapilli' },
        { id: 'id7602042_tapango' },
        { id: 'id7602043_matakali' },
        { id: 'id7602044_bulo' },
        { id: 'id7602050_polewali' },
        { id: 'id7602051_binuang' },
        { id: 'id7602052_anreapi' },
        { id: 'id7602061_matangnga' },
      ],
      fallbackFile: 'id7602_polewali_mandar.geojson'
    },
    '7603': {
      id: '7603',
      name: 'Mamasa',
      path: '/data/id76_sulawesi_barat/id7603_mamasa',
      subdistricts: [
        { id: 'id7603010_sumarorong' },
        { id: 'id7603020_messawa' },
        { id: 'id7603030_pana' },
        { id: 'id7603031_nosu' },
        { id: 'id7603040_tabang' },
        { id: 'id7603050_mamasa' },
        { id: 'id7603060_tanduk_kalua' },
        { id: 'id7603061_balla' },
        { id: 'id7603070_sesenapadang' },
        { id: 'id7603071_tawalian' },
        { id: 'id7603080_mambi' },
        { id: 'id7603081_bambang' },
        { id: 'id7603082_rantebulahan_timur' },
        { id: 'id7603083_mehalaan' },
        { id: 'id7603090_aralle' },
        { id: 'id7603091_buntu_malangka' },
        { id: 'id7603100_tabulahan' },
      ],
      fallbackFile: 'id7603_mamasa.geojson'
    },
    '7604': {
      id: '7604',
      name: 'Mamuju',
      path: '/data/id76_sulawesi_barat/id7604_mamuju',
      subdistricts: [
        { id: 'id7604010_tapalang' },
        { id: 'id7604011_tapalang_barat' },
        { id: 'id7604020_mamuju' },
        { id: 'id7604022_simboro' },
        { id: 'id7604023_balabalakang' },
        { id: 'id7604030_kalukku' },
        { id: 'id7604031_papalang' },
        { id: 'id7604032_sampaga' },
        { id: 'id7604033_tommo' },
        { id: 'id7604040_kalumpang' },
        { id: 'id7604041_bonehau' },
      ],
      fallbackFile: 'id7604_mamuju.geojson'
    },
    '7605': {
      id: '7605',
      name: 'Mamuju Utara',
      path: '/data/id76_sulawesi_barat/id7605_mamuju_utara',
      subdistricts: [
        { id: 'id7605010_sarudu' },
        { id: 'id7605011_dapurang' },
        { id: 'id7605012_duripoku' },
        { id: 'id7605020_baras' },
        { id: 'id7605021_bulu_taba' },
        { id: 'id7605022_lariang' },
        { id: 'id7605030_pasangkayu' },
        { id: 'id7605031_tikke_raya' },
        { id: 'id7605032_pedongga' },
        { id: 'id7605040_bambalamotu' },
        { id: 'id7605041_bambaira' },
        { id: 'id7605042_sarjo' },
      ],
      fallbackFile: 'id7605_mamuju_utara.geojson'
    },
    '7606': {
      id: '7606',
      name: 'Mamuju Tengah',
      path: '/data/id76_sulawesi_barat/id7606_mamuju_tengah',
      subdistricts: [
        { id: 'id7606010_pangale' },
        { id: 'id7606020_budong_budong' },
        { id: 'id7606030_tobadak' },
        { id: 'id7606040_topoyo' },
        { id: 'id7606050_karossa' },
      ],
      fallbackFile: 'id7606_mamuju_tengah.geojson'
    },
  }
};

export default PROV;
