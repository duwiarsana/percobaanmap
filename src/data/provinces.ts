import type { ProvinceConfig } from '../types/data-config';
import PROV_51 from './prov-51-bali';
import PROV_35 from './prov-35-jawa-timur';

// Central registry of all province metadata modules
// Add new provinces here without touching higher-level config/logic
const PROVINCES: Record<string, ProvinceConfig> = {
  '51': PROV_51,
  '35': PROV_35,
};

export default PROVINCES;
