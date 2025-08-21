import { GeoJSONData, SetSubdistrictDataFunction } from './types';

export const loadBadungSubdistrictData = async (
  setSubdistrictData: SetSubdistrictDataFunction
): Promise<void> => {
  console.log('Loading Badung kecamatan data from individual files');
  
  try {
    // Define the kecamatan files for Badung
    const kecamatanFiles = [
      "id5103010_kuta_selatan",
      "id5103020_kuta",
      "id5103030_kuta_utara",
      "id5103040_mengwi",
      "id5103050_abiansemal",
      "id5103060_petang"
    ];
    
    // Create a combined GeoJSON with all kecamatan
    const combinedFeatures: any[] = [];
    let loadedCount = 0;
    
    // Try to load each kecamatan file
    for (const kecamatan of kecamatanFiles) {
      try {
        console.log(`Loading kecamatan: ${kecamatan}`);
        // Coba beberapa path yang mungkin untuk file kecamatan
        let url = `/geojsonKecamatan/id51_bali/id5103_badung/${kecamatan}.geojson`;
        console.log(`[${new Date().toISOString()}] First attempt to fetch: ${url}`);
        let response = await fetch(url);
        console.log(`First attempt status: ${response.status} ${response.statusText}`);
        
        // Jika tidak berhasil, coba path alternatif
        if (!response.ok) {
          url = `/indonesia-district-master 3/id51_bali/id5103_badung/${kecamatan}.geojson`;
          console.log(`[${new Date().toISOString()}] Second attempt to fetch: ${url}`);
          response = await fetch(url);
          console.log(`Second attempt status: ${response.status} ${response.statusText}`);
        }
        
        // Jika masih tidak berhasil, coba path alternatif lain
        if (!response.ok) {
          url = `/data/bali/badung/${kecamatan}.geojson`;
          console.log(`[${new Date().toISOString()}] Third attempt to fetch: ${url}`);
          response = await fetch(url);
          console.log(`Third attempt status: ${response.status} ${response.statusText}`);
        }
        
        // Jika masih tidak berhasil, coba path alternatif dengan folder geojsonKecamatan
        if (!response.ok) {
          url = `/geojsonKecamatan/id51_bali/id5103_badung/${kecamatan}.geojson`;
          console.log(`[${new Date().toISOString()}] Fourth attempt to fetch: ${url}`);
          response = await fetch(url);
          console.log(`Fourth attempt status: ${response.status} ${response.statusText}`);
        }
        
        if (!response.ok) {
          console.error(`[${new Date().toISOString()}] All attempts failed for ${kecamatan}. HTTP error ${response.status}: ${response.statusText}`);
          console.error(`URL attempted: ${url}`);
          continue;
        } else {
          console.log(`[${new Date().toISOString()}] Successfully loaded ${kecamatan} from ${url}`);
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
          
          // Extract kecamatan name from filename and format it nicely
          const kecamatanName = kecamatan.split('_').slice(1).join(' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          // Set all possible property names for maximum compatibility
          feature.properties.kecamatan = kecamatanName;
          feature.properties.kec_name = kecamatanName;
          feature.properties.KECAMATAN = kecamatanName;
          feature.properties.NAMA = kecamatanName;
          feature.properties.nama = kecamatanName;
          feature.properties.name = kecamatanName;
          feature.properties.NAME = kecamatanName;
          
          feature.properties.district_code = "5103"; // Badung district code
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
      console.log(`Successfully loaded ${combinedFeatures.length} kecamatan features for Badung from ${loadedCount} files`);
      return Promise.resolve();
    }
    
    // If no kecamatan files were loaded, fall back to the district file
    console.log('No kecamatan files loaded for Badung, falling back to district file');
    
    // Coba beberapa path yang mungkin untuk file district
    let url = `/geojsonKecamatan/id51_bali/id5103_badung/id5103_badung.geojson`;
    console.log(`[${new Date().toISOString()}] First attempt to fetch district file: ${url}`);
    let response = await fetch(url);
    console.log(`First district attempt status: ${response.status} ${response.statusText}`);
    
    // Jika tidak berhasil, coba path alternatif
    if (!response.ok) {
      url = '/indonesia-district-master 3/id51_bali/id5103_badung/id5103_badung.geojson';
      console.log(`[${new Date().toISOString()}] Second attempt to fetch district file: ${url}`);
      response = await fetch(url);
      console.log(`Second district attempt status: ${response.status} ${response.statusText}`);
    }
    
    // Jika masih tidak berhasil, coba path alternatif lain
    if (!response.ok) {
      url = `/data/bali/badung/id5103_badung.geojson`;
      console.log(`[${new Date().toISOString()}] Third attempt to fetch district file: ${url}`);
      response = await fetch(url);
      console.log(`Third district attempt status: ${response.status} ${response.statusText}`);
    }
    
    if (!response.ok) {
      url = '/geojsonKecamatan/id51_bali/id5103_badung/id5103_badung.geojson';
      console.log(`[${new Date().toISOString()}] Fourth attempt to fetch district file: ${url}`);
      response = await fetch(url);
      console.log(`Fourth district attempt status: ${response.status} ${response.statusText}`);
    }
    
    if (!response.ok) throw new Error('Badung district file not found');
    const text = await response.text();
    
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error('Received HTML instead of JSON');
    }
    
    const data = JSON.parse(text);
    
    if (!data || !data.features || data.features.length === 0) {
      throw new Error('Invalid GeoJSON or no features');
    }
    
    // Add district_code to each feature for consistency
    const enhancedFeatures = data.features.map((feature: any) => {
      if (!feature.properties) {
        feature.properties = {};
      }
      
      // Add district_code for filtering if not present
      if (!feature.properties.district_code) {
        feature.properties.district_code = "5103";
      }
      
      return feature;
    });
    
    const enhancedData: GeoJSONData = {
      type: "FeatureCollection",
      features: enhancedFeatures
    };
    
    setSubdistrictData(enhancedData);
    console.log(`Successfully loaded ${enhancedData.features.length} features from Badung district file`);
    return Promise.resolve();
  } catch (e) {
    console.error("Failed to load Badung kecamatan files", e);
    
    // Tampilkan pesan error yang lebih informatif
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error(`Error detail: ${errorMessage}`);
    
    // Coba set data kosong untuk menghindari crash aplikasi
    try {
      const emptyData: GeoJSONData = {
        type: "FeatureCollection",
        features: []
      };
      setSubdistrictData(emptyData);
      console.warn("Set empty subdistrict data to prevent app crash");
      return Promise.resolve();
    } catch (innerError) {
      console.error("Failed to set empty subdistrict data", innerError);
      return Promise.reject(e);
    }
  }
};
