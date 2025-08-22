// Generic data loader for Indonesian administrative divisions
// This replaces the repetitive loading functions with a unified approach

import { DistrictConfig, findDistrictConfig, SubdistrictFile } from './data-config';

export interface GeoJSONFeature {
  type: "Feature";
  properties: { [key: string]: any };
  geometry: any;
}

export interface GeoJSONData {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export interface LoadResult {
  success: boolean;
  data?: GeoJSONData;
  error?: string;
  loadedCount?: number;
  totalCount?: number;
}

// Safely parse a Response as JSON with HTML guard
async function parseJsonSafely(response: Response, context: string): Promise<any> {
  const text = await response.text();
  const trimmed = text.trim();
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    throw new Error(`Received HTML instead of JSON for ${context}`);
  }
  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.error(`JSON parse error for ${context}:`, parseError);
    throw parseError;
  }
}

// Enhance features with consistent property names
function enhanceFeatures(features: GeoJSONFeature[], subdistrictId: string, districtCode: string): GeoJSONFeature[] {
  const subdistrictName = deriveSubdistrictName(subdistrictId);
  
  return features.map((feature: GeoJSONFeature) => {
    if (!feature.properties) {
      feature.properties = {};
    }
    
    // Add subdistrict name variants
    feature.properties.kecamatan = subdistrictName;
    feature.properties.kec_name = subdistrictName;
    feature.properties.KECAMATAN = subdistrictName;
    feature.properties.NAMA = subdistrictName;
    feature.properties.nama = subdistrictName;
    feature.properties.name = subdistrictName;
    feature.properties.NAME = subdistrictName;

    // Add district code variants
    feature.properties.district_code = districtCode;
    feature.properties.kab_id = districtCode;
    feature.properties.kabupaten_id = districtCode;
    feature.properties.KABUPATEN_ID = districtCode;
    feature.properties.ID_KABUPATEN = districtCode;
    
    return feature;
  });
}

// Derive human-readable name from file ID
function deriveSubdistrictName(fileId: string): string {
  return fileId
    .split('_')
    .slice(1) // Remove the ID part
    .join(' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Load a single subdistrict file
async function loadSubdistrictFile(
  basePath: string, 
  subdistrict: SubdistrictFile, 
  districtCode: string
): Promise<GeoJSONFeature[]> {
  const url = `${basePath}/${subdistrict.id}.geojson`;
  console.log(`Loading subdistrict: ${subdistrict.id} from ${url}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await parseJsonSafely(response, subdistrict.id);
    
    if (!data.features || data.features.length === 0) {
      console.warn(`No features found in ${subdistrict.id}`);
      return [];
    }
    
    const enhancedFeatures = enhanceFeatures(data.features, subdistrict.id, districtCode);
    console.log(`Successfully loaded ${enhancedFeatures.length} features from ${subdistrict.id}`);
    return enhancedFeatures;
    
  } catch (error) {
    console.error(`Failed to load ${subdistrict.id}:`, error);
    return [];
  }
}

// Load fallback district file
async function loadFallbackFile(basePath: string, fallbackFile: string): Promise<GeoJSONData | null> {
  const url = `${basePath}/${fallbackFile}`;
  console.log(`Loading fallback district file: ${url}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await parseJsonSafely(response, fallbackFile);
    console.log(`Successfully loaded fallback data with ${data.features?.length || 0} features`);
    return data;
    
  } catch (error) {
    console.error(`Failed to load fallback file ${fallbackFile}:`, error);
    return null;
  }
}

// Main function to load subdistrict data
export async function loadSubdistrictData(districtId: string | number): Promise<LoadResult> {
  if (!districtId) {
    return { success: false, error: "No district ID provided" };
  }
  
  console.log(`Loading subdistrict data for district ID: ${districtId} (type: ${typeof districtId})`);
  
  // Find district configuration
  const districtConfig = findDistrictConfig(districtId);
  if (!districtConfig) {
    const error = `No configuration found for district ID: ${districtId}`;
    console.error(error);
    return { success: false, error };
  }
  
  console.log(`Found district configuration: ${districtConfig.name} (${districtConfig.id})`);
  
  // Try to load individual subdistrict files
  const combinedFeatures: GeoJSONFeature[] = [];
  let loadedCount = 0;
  
  console.log(`Attempting to load ${districtConfig.subdistricts.length} subdistrict files...`);
  
  for (const subdistrict of districtConfig.subdistricts) {
    const features = await loadSubdistrictFile(districtConfig.path, subdistrict, districtConfig.id);
    if (features.length > 0) {
      combinedFeatures.push(...features);
      loadedCount++;
    }
  }
  
  // If we loaded some subdistrict files, return the combined data
  if (combinedFeatures.length > 0) {
    const result: GeoJSONData = {
      type: "FeatureCollection",
      features: combinedFeatures
    };
    
    console.log(`Successfully loaded ${loadedCount}/${districtConfig.subdistricts.length} subdistrict files with ${combinedFeatures.length} total features for ${districtConfig.name}`);
    
    return {
      success: true,
      data: result,
      loadedCount,
      totalCount: districtConfig.subdistricts.length
    };
  }
  
  // If no subdistrict files were loaded, try fallback
  if (districtConfig.fallbackFile) {
    console.log(`No subdistrict files loaded for ${districtConfig.name}, trying fallback: ${districtConfig.fallbackFile}`);
    
    const fallbackData = await loadFallbackFile(districtConfig.path, districtConfig.fallbackFile);
    if (fallbackData) {
      console.log(`Successfully loaded fallback data for ${districtConfig.name}`);
      return {
        success: true,
        data: fallbackData,
        loadedCount: 0,
        totalCount: districtConfig.subdistricts.length
      };
    }
  }
  
  // If everything failed
  const error = `Failed to load any data for district ${districtConfig.name} (${districtConfig.id}). Tried ${districtConfig.subdistricts.length} subdistrict files${districtConfig.fallbackFile ? ` and fallback file ${districtConfig.fallbackFile}` : ''}.`;
  console.error(error);
  
  return {
    success: false,
    error,
    loadedCount: 0,
    totalCount: districtConfig.subdistricts.length
  };
}

// Create empty GeoJSON for error cases
export function createEmptyGeoJSON(): GeoJSONData {
  return {
    type: "FeatureCollection",
    features: []
  };
}
