import { GeoJSONData, SetSubdistrictDataFunction } from './types';

export const loadTabananSubdistrictData = async (
  setSubdistrictData: SetSubdistrictDataFunction
): Promise<void> => {
  console.log(`Matched Tabanan district`);
  try {
    console.log('Loading Tabanan kecamatan data from actual files');
    
    // Define the kecamatan files for Tabanan
    const kecamatanFiles = [
      "id5102010_selemadeg",
      "id5102011_selemadeg_timur",
      "id5102012_selemadeg_barat",
      "id5102020_kerambitan",
      "id5102030_tabanan",
      "id5102040_kediri",
      "id5102050_marga",
      "id5102060_baturiti",
      "id5102070_penebel",
      "id5102080_pupuan"
    ];
    
    // Create a combined GeoJSON with all kecamatan
    const combinedFeatures: any[] = [];
    let loadedCount = 0;
    
    // Try to load each kecamatan file
    for (const kecamatan of kecamatanFiles) {
      try {
        console.log(`Loading kecamatan: ${kecamatan}`);
        const url = `/data/bali/tabanan/${kecamatan}.geojson`;
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
          feature.properties.kecamatan = kecamatan.split('_').slice(1).join('_'); // Extract name from file name
          feature.properties.district_code = "5102"; // Tabanan district code
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
      console.log(`Successfully loaded ${combinedFeatures.length} kecamatan features for Tabanan from ${loadedCount} files`);
      return Promise.resolve();
    }
    
    // If no kecamatan files were loaded, fall back to BALI.geojson
    console.log('No kecamatan files loaded for Tabanan, falling back to BALI.geojson');
    const response = await fetch('/data/kabupaten_by_prov/BALI.geojson');
    
    if (!response.ok) throw new Error('BALI.geojson file not found');
    const responseText = await response.text();
    
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      throw new Error('Received HTML instead of JSON');
    }
    
    const data = JSON.parse(responseText);
    
    // Filter by Tabanan district ID
    const filteredData: GeoJSONData = {
      type: "FeatureCollection",
      features: data.features.filter((feature: any) => {
        const distId = feature.properties.kab_id || 
                      feature.properties.kabupaten_id || 
                      feature.properties.KABUPATEN_ID || 
                      feature.properties.ID_KABUPATEN ||
                      feature.properties.regency_code;
        
        // Handle both formats: "5102" and "id5102"
        return distId?.toString() === "5102" || distId?.toString() === "id5102";
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
        feature.properties.district_code = "5102"; // Tabanan district code
        return feature;
      });
    }
    
    setSubdistrictData(filteredData);
    console.log(`Successfully loaded ${filteredData.features.length} subdistrict features for Tabanan from BALI.geojson`);
    return Promise.resolve();
  } catch (error) {
    console.error("Error loading Tabanan subdistrict data:", error);
    throw error;
  }
};
