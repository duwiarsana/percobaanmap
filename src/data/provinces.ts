import type { ProvinceConfig } from '../types/data-config';
import PROV_11 from './prov-11-aceh';
import PROV_12 from './prov-12-sumatera_utara';
import PROV_13 from './prov-13-sumatera_barat';
import PROV_14 from './prov-14-riau';
import PROV_15 from './prov-15-jambi';
import PROV_16 from './prov-16-sumatera_selatan';
import PROV_17 from './prov-17-bengkulu';
import PROV_18 from './prov-18-lampung';
import PROV_19 from './prov-19-kepulauan_bangka_belitung';
import PROV_21 from './prov-21-kepulauan_riau';
import PROV_31 from './prov-31-dki_jakarta';
import PROV_32 from './prov-32-jawa_barat';
import PROV_33 from './prov-33-jawa_tengah';
import PROV_34 from './prov-34-daerah_istimewa_yogyakarta';
import PROV_35 from './prov-35-jawa_timur';
import PROV_36 from './prov-36-banten';
import PROV_51 from './prov-51-bali';
import PROV_52 from './prov-52-nusa_tenggara_barat';
import PROV_53 from './prov-53-nusa_tenggara_timur';
import PROV_61 from './prov-61-kalimantan_barat';
import PROV_62 from './prov-62-kalimantan_tengah';
import PROV_63 from './prov-63-kalimantan_selatan';
import PROV_64 from './prov-64-kalimantan_timur';
import PROV_65 from './prov-65-kalimantan_utara';
import PROV_71 from './prov-71-sulawesi_utara';
import PROV_72 from './prov-72-sulawesi_tengah';
import PROV_73 from './prov-73-sulawesi_selatan';
import PROV_74 from './prov-74-sulawesi_tenggara';
import PROV_75 from './prov-75-gorontalo';
import PROV_76 from './prov-76-sulawesi_barat';
import PROV_81 from './prov-81-maluku';
import PROV_82 from './prov-82-maluku_utara';
import PROV_91 from './prov-91-papua_barat';
import PROV_94 from './prov-94-papua';

// Central registry of all province metadata modules
// Add new provinces here without touching higher-level config/logic
const PROVINCES: Record<string, ProvinceConfig> = {
  '11': PROV_11,
  '12': PROV_12,
  '13': PROV_13,
  '14': PROV_14,
  '15': PROV_15,
  '16': PROV_16,
  '17': PROV_17,
  '18': PROV_18,
  '19': PROV_19,
  '21': PROV_21,
  '31': PROV_31,
  '32': PROV_32,
  '33': PROV_33,
  '34': PROV_34,
  '35': PROV_35,
  '36': PROV_36,
  '51': PROV_51,
  '52': PROV_52,
  '53': PROV_53,
  '61': PROV_61,
  '62': PROV_62,
  '63': PROV_63,
  '64': PROV_64,
  '65': PROV_65,
  '71': PROV_71,
  '72': PROV_72,
  '73': PROV_73,
  '74': PROV_74,
  '75': PROV_75,
  '76': PROV_76,
  '81': PROV_81,
  '82': PROV_82,
  '91': PROV_91,
  '94': PROV_94,
};

export default PROVINCES;
