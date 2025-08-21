import { GeoJSONData, SetSubdistrictDataFunction } from './types';

export const loadBangliSubdistrictData = async (
  setSubdistrictData: SetSubdistrictDataFunction
): Promise<void> => {
  console.log('Loading Bangli kecamatan data');
  
  try {
    console.log('Loading Bangli kecamatan data');
    
    // Load the BALI.geojson file which contains all districts
    const response = await fetch('/data/BALI.geojson');
    
    if (!response.ok) throw new Error('BALI.geojson not found');
    const responseText = await response.text();
    
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      throw new Error('Received HTML instead of JSON');
    }
    
    const data = JSON.parse(responseText);
    console.log(`DEBUG: BALI.geojson parsed successfully - ${new Date().toISOString()}`);
    console.log(`DEBUG: Total features in BALI.geojson: ${data.features.length}`);
    
    // Check if there are any features with regency="Bangli"
    const bangliFeaturesCount = data.features.filter((f: any) => 
      f.properties && f.properties.regency === "Bangli"
    ).length;
    console.log(`DEBUG: Features with regency='Bangli': ${bangliFeaturesCount}`);
    
    // Log a sample feature to see its structure
    if (data.features && data.features.length > 0) {
      console.log('DEBUG: Sample feature properties:', JSON.stringify(data.features[0].properties));
    }
    
    // Filter by Bangli district ID
    const filteredData: GeoJSONData = {
      type: "FeatureCollection",
      features: data.features.filter((feature: any) => {
        // Check if this feature is part of Bangli district
        // The BALI.geojson has a 'regency' property with the name of the district
        const regency = feature.properties && feature.properties.regency;
        
        // Check if regency equals "Bangli"
        return regency === "Bangli";
      })
    };
    
    console.log(`DEBUG: Filtered features count: ${filteredData.features.length}`);
    
    // If we still have no features, try different property names
    if (filteredData.features.length === 0 && data.features.length > 0) {
      console.log('DEBUG: Trying alternative property names for Bangli');
      // Log all property keys from the first feature to see what's available
      const firstFeature = data.features[0];
      if (firstFeature && firstFeature.properties) {
        console.log('DEBUG: Available property keys:', Object.keys(firstFeature.properties));
      }
    }
    
    // Add kecamatan name and district_code to each feature for consistency
    if (filteredData.features.length > 0) {
      filteredData.features = filteredData.features.map((feature: any) => {
        if (!feature.properties) {
          feature.properties = {};
        }
        
        // Log the original properties for debugging
        console.log('Original feature properties:', feature.properties);
        
        // Use the district property from BALI.geojson as the kecamatan name
        if (feature.properties.district) {
          // Set kecamatan name from district property
          feature.properties.kecamatan = feature.properties.district;
          console.log(`Using district property for kecamatan name: ${feature.properties.district}`);
          
          // Set all possible property names for maximum compatibility with onEachSubdistrict
          feature.properties.kec_name = feature.properties.district;
          feature.properties.KECAMATAN = feature.properties.district;
          feature.properties.NAMA = feature.properties.district;
          feature.properties.nama = feature.properties.district;
          feature.properties.name = feature.properties.district;
          feature.properties.NAME = feature.properties.district;
        } else {
          // If district property is not available, use a default
          feature.properties.kecamatan = "unknown";
          console.warn('No district property found for feature, using "unknown"');
        }
        
        feature.properties.district_code = "5106"; // Bangli district code
        return feature;
      });
    }
    
    setSubdistrictData(filteredData);
    // Log more details about the filtering process for debugging
    console.log(`Successfully loaded ${filteredData.features.length} subdistrict features for Bangli from BALI.geojson`);
    
    return Promise.resolve();
  } catch (error) {
    console.error("Error loading Bangli subdistrict data:", error);
    throw error;
  }
};
