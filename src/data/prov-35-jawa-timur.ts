import { ProvinceConfig } from '../types/data-config';

const PROV_35: ProvinceConfig = {
  id: '35',
  name: 'Jawa Timur',
  // Province-level data base (not used directly for subdistricts but kept consistent)
  path: '/data/id35_jawa_timur',
  districts: {
    '3510': {
      id: '3510',
      name: 'Banyuwangi',
      uuid: '5ae5b33d-9074-49ea-9d7a-7ceb6738cce5',
      // Match actual folder under public/data
      path: '/data/id35_jawa_timur/id3510_banyuwangi',
      subdistricts: [
        { id: 'id3510010_pesanggaran' },
        { id: 'id3510011_siliragung' },
        { id: 'id3510020_bangorejo' },
        { id: 'id3510030_purwoharjo' },
        { id: 'id3510040_tegaldlimo' },
        { id: 'id3510050_muncar' },
        { id: 'id3510060_cluring' },
        { id: 'id3510070_gambiran' },
        { id: 'id3510071_tegalsari' },
        { id: 'id3510080_glenmore' },
        { id: 'id3510090_kalibaru' },
        { id: 'id3510100_genteng' },
        { id: 'id3510110_srono' },
        { id: 'id3510120_rogojampi' },
        { id: 'id3510121_blimbingsari' },
        { id: 'id3510130_kabat' },
        { id: 'id3510140_singojuruh' },
        { id: 'id3510150_sempu' },
        { id: 'id3510160_songgon' },
        { id: 'id3510170_glagah' },
        { id: 'id3510171_licin' },
        { id: 'id3510180_banyuwangi' },
        { id: 'id3510190_giri' },
        { id: 'id3510200_kalipuro' },
        { id: 'id3510210_wongsorejo' }
      ],
      fallbackFile: 'id3510_banyuwangi.geojson'
    }
  }
};

export default PROV_35;
