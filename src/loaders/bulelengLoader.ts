import { GeoJSONData, SetSubdistrictDataFunction } from './types';

export const loadBulelengSubdistrictData = async (
  setSubdistrictData: SetSubdistrictDataFunction
): Promise<void> => {
  console.log(`Matched Buleleng district`);
  try {
    console.log('Loading Buleleng kecamatan data from actual files');
    
    // Define the kecamatan files for Buleleng
    const kecamatanFiles = [
      "id5108010_gerokgak",
      "id5108020_seririt",
      "id5108030_busungbiu",
      "id5108040_banjar",
      "id5108050_sukasada",
      "id5108060_buleleng",
      "id5108070_sawan",
      "id5108080_kubutambahan",
      "id5108090_tejakula"
    ];
    
    // Create a combined GeoJSON with all kecamatan
    const combinedFeatures: any[] = [];
    let loadedCount = 0;
    
    // Try to load each kecamatan file
    for (const kecamatan of kecamatanFiles) {
      try {
        console.log(`Loading kecamatan: ${kecamatan}`);
        const url = `/data/bali/buleleng/${kecamatan}.geojson`;
        console.log(`Attempting to fetch: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`HTTP error ${response.status} for ${kecamatan}: ${response.statusText}`);
          continue;
        }
        
        let data;
        try {
          const text = await response.text();
          if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            console.error(`Received HTML instead of JSON for ${kecamatan}`);
            continue;
          }
          data = JSON.parse(text);
        } catch (parseError) {
          console.error(`JSON parse error for ${kecamatan}:`, parseError);
          continue;
        }
        
        if (!data || !data.features || data.features.length === 0) {
          console.error(`No features found in ${kecamatan} file`);
          continue;
        }
        
        // Add kecamatan name and district_code to each feature for consistency
        const enhancedFeatures = data.features.map((feature: any) => {
          if (!feature.properties) {
            feature.properties = {};
          }
          feature.properties.kecamatan = kecamatan.split('_')[1]; // Extract name from file name
          feature.properties.district_code = "5108"; // Buleleng district code
          return feature;
        });
        
        combinedFeatures.push(...enhancedFeatures);
        loadedCount++;
        console.log(`Successfully loaded ${enhancedFeatures.length} features from ${kecamatan}`);
      } catch (error) {
        console.error(`Error loading ${kecamatan}:`, error);
        // Continue to next file
      }
    }
    
    // If we loaded any kecamatan files, use them
    if (combinedFeatures.length > 0) {
      console.log(`Successfully loaded ${loadedCount} of ${kecamatanFiles.length} kecamatan files with ${combinedFeatures.length} total features`);
      
      const combinedData: GeoJSONData = {
        type: "FeatureCollection",
        features: combinedFeatures
      };
      
      setSubdistrictData(combinedData);
      console.log(`Successfully loaded ${combinedFeatures.length} kecamatan features for Buleleng from ${loadedCount} files`);
      return Promise.resolve();
    }
    
    // If no kecamatan files were loaded, fall back to BALI.geojson
    console.log('No kecamatan files loaded for Buleleng, falling back to BALI.geojson');
    const response = await fetch('/data/kabupaten_by_prov/BALI.geojson');
    
    if (!response.ok) throw new Error('BALI.geojson file not found');
    const responseText = await response.text();
    
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      throw new Error('Received HTML instead of JSON');
    }
    
    const data = JSON.parse(responseText);
    
    // Filter by Buleleng district ID
    const filteredData: GeoJSONData = {
      type: "FeatureCollection",
      features: data.features.filter((feature: any) => {
        const distId = feature.properties.kab_id || 
                      feature.properties.kabupaten_id || 
                      feature.properties.KABUPATEN_ID || 
                      feature.properties.ID_KABUPATEN ||
                      feature.properties.regency_code;
        
        // Handle both formats: "5108" and "id5108"
        return distId?.toString() === "5108" || distId?.toString() === "id5108";
      })
    };
    
    // Add kecamatan name and district_code to each feature for consistency
    if (filteredData.features.length > 0) {
      filteredData.features = filteredData.features.map((feature: any) => {
        if (!feature.properties) {
          feature.properties = {};
        }
        // If kecamatan name is not already set, use a default
        if (!feature.properties.kecamatan) {
          feature.properties.kecamatan = "unknown";
        }
        feature.properties.district_code = "5108"; // Buleleng district code
        return feature;
      });
    }
    
    setSubdistrictData(filteredData);
    console.log(`Successfully loaded ${filteredData.features.length} subdistrict features for Buleleng from BALI.geojson`);
    return Promise.resolve();
  } catch (error) {
    console.error("Error loading Buleleng subdistrict data:", error);
    throw error;
  }
};
