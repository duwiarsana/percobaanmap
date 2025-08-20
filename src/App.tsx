import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import L, { Map } from 'leaflet';

// Extend Window interface to include our app instance
declare global {
  interface Window {
    appInstance: any;
  }
}

// Type definitions
interface GeoJSONFeature {
  type: "Feature";
  properties: {
    ID: number;
    prov_name: string;
    kab_name?: string;
    kec_name?: string;
    [key: string]: any;
  };
  geometry: any;
}

interface GeoJSONData {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

// MapController Props
// This interface is used for the MapController component
// Interface for MapController component props (currently unused but kept for future use)
interface MapControllerProps {
  map: L.Map;
  selectedProvince: string | null;
  selectedDistrict: string | null;
  onProvinceSelect: (province: string | null) => void;
  onDistrictSelect: (district: string | null) => void;
}

const MapController: React.FC<{
  selectedProvince: string | null;
  setSelectedProvince: Dispatch<SetStateAction<string | null>>;
  selectedDistrict: string | null;
  setSelectedDistrict: Dispatch<SetStateAction<string | null>>;
  selectedDistrictId: string | number | null;
  setSelectedDistrictId: Dispatch<SetStateAction<string | number | null>>;
  isZooming: boolean;
  setIsZooming: Dispatch<SetStateAction<boolean>>;
}> = ({ 
  selectedProvince, 
  setSelectedProvince, 
  selectedDistrict, 
  setSelectedDistrict,
  selectedDistrictId,
  setSelectedDistrictId,
  isZooming,
  setIsZooming
}) => {
  // Map reference used for zooming and panning
  // Currently not used but kept for future functionality
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const map = useMap();
  const [districtData, setDistrictData] = useState<GeoJSONData | null>(null);
  const [subdistrictData, setSubdistrictData] = useState<GeoJSONData | null>(null);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | number | null>(null);
  
  // Make loadSubdistrictData accessible to the component instance
  useEffect(() => {
    // Expose the loadSubdistrictData function to the App component
    if (window.appInstance) {
      window.appInstance.loadSubdistrictData = loadSubdistrictData;
    }
  }, []);

  // First, determine the province ID when a province is selected
  useEffect(() => {
    if (selectedProvince) {
      // Fetch province data to get the ID of the selected province
      const fetchProvinceId = async () => {
        try {
          let response;
          try {
            response = await fetch('/data/prov 37.geojson');
            if (!response.ok) throw new Error('Fixed file not found');
          } catch (e) {
            response = await fetch('/data/prov_37.geojson');
            if (!response.ok) throw new Error('Failed to fetch province data');
          }
          
          const data = await response.json();
          
          // Find the selected province to get its ID
          const selectedProvinceFeature = data.features.find((feature: any) => {
            const name = feature.properties.prov_name || 
                        feature.properties.Propinsi || 
                        feature.properties.PROVINSI || 
                        feature.properties.provinsi || 
                        feature.properties.NAMA;
            return name === selectedProvince;
          });
          
          if (selectedProvinceFeature) {
            const provId = selectedProvinceFeature.properties.prov_id || 
                          selectedProvinceFeature.properties.provinsi_id || 
                          selectedProvinceFeature.properties.ID || 
                          selectedProvinceFeature.properties.KODE;
                          
            if (provId) {
              setSelectedProvinceId(provId);
              console.log(`Found province ID: ${provId} for province: ${selectedProvince}`);
            }
          }
        } catch (error) {
          console.error("Error fetching province ID:", error);
        }
      };
      
      fetchProvinceId();
    } else {
      setSelectedProvinceId(null);
      setDistrictData(null);
      setSubdistrictData(null);
    }
  }, [selectedProvince]);
  
  // Load district data when province ID is determined
  useEffect(() => {
    if (selectedProvinceId) {
      const fetchDistrictData = async () => {
        setSubdistrictData(null);
        
        if (!isZooming) {
          try {
            // Try to load the fixed district data with actual boundaries
            let response;
            try {
              // Try the fixed file first
              response = await fetch('/data/kab 37.geojson');
              if (!response.ok) throw new Error('Fixed file not found');
            } catch (e) {
              // Fall back to the simplified file
              console.log('Falling back to simplified district data');
              response = await fetch('/data/kab_37.geojson');
              if (!response.ok) throw new Error('Failed to fetch district data');
            }
            
            const data = await response.json();
            
            // Filter districts by province ID
            const filteredData: GeoJSONData = {
              type: "FeatureCollection",
              features: data.features.filter((feature: any) => {
                const provinceId = feature.properties.prov_id || 
                                  feature.properties.provinsi_id || 
                                  feature.properties.ID_PROV || 
                                  feature.properties.PROVINSI;
                return provinceId?.toString() === selectedProvinceId.toString(); // Use string comparison
              })
            };
            
            setDistrictData(filteredData);
            console.log(`Successfully loaded ${filteredData.features.length} district features for province ID: ${selectedProvinceId}`);
          } catch (error) {
            console.error("Error loading district data:", error);
            setDistrictData(null);
          }
        }
      };
      
      fetchDistrictData();
    } else {
      // If no province ID is determined, don't show any districts
      setDistrictData(null);
      setSubdistrictData(null);
    }
  }, [selectedProvinceId, isZooming]);

  // Use a ref to track if we've already filtered for this district ID
  const filteredForDistrictRef = useRef<string | number | null>(null);
  
  useEffect(() => {
    // Only filter if we have a district ID, district data, and haven't filtered for this ID yet
    if (selectedDistrictId && districtData && filteredForDistrictRef.current !== selectedDistrictId) {
      console.log(`Filtering districts to show only ID: ${selectedDistrictId}`);
      
      // Update ref to prevent re-filtering for the same ID
      filteredForDistrictRef.current = selectedDistrictId;
      
      // Filter to only show the selected district by ID
      const filteredData: GeoJSONData = {
        type: "FeatureCollection",
        features: districtData.features.filter((feature: any) => {
          const props = feature.properties;
          
          // Get district ID from various possible property names - match the same logic as click handler
          let districtId = props.id_kabupaten || 
                           props.ID || 
                           props.KODE || 
                           props.kab_id || 
                           props.kabupaten_id ||
                           props.id || 
                           props.gid || 
                           props.uuid || 
                           props.code ||
                           props.regency_code;
          
          // Get district name from various possible property names
          const districtName = props.kab_name || 
                            props.kabupaten || 
                            props.KABUPATEN || 
                            props.nama || 
                            props.NAMA || 
                            props.name || 
                            props.NAME || 
                            props.Nama;
                            
          // Special case for Karangasem
          if (districtName && districtName.toLowerCase().includes('karangasem') && props.regency_code === "id5107") {
            districtId = "5107";
          }
          
          const isSelected = districtId && districtId.toString() === selectedDistrictId.toString();
          
          if (isSelected) {
            console.log(`Found matching district for ID ${selectedDistrictId}: ${districtName}`);
          }
          
          return isSelected;
        })
      };
      
      // Only update if we actually filtered something and have at least one feature
      if (filteredData.features.length > 0) {
        console.log(`Filtered from ${districtData.features.length} districts to only show district ID: ${selectedDistrictId}`);
        setDistrictData(filteredData);
      } else {
        console.warn(`No districts found with ID: ${selectedDistrictId}`);
      }
    }
  }, [selectedDistrictId, districtData]);

  // Effect to load subdistrict data when a district is selected - using ref to prevent loops
  const prevDistrictIdRef = useRef<string | number | null>(null);
  const isLoadingRef = useRef(false);
  
  useEffect(() => {
    // Skip loading if we're in the middle of a zoom animation
    if (isZooming || !selectedDistrictId) {
      console.log(`Skipping subdistrict load - isZooming: ${isZooming}, selectedDistrictId: ${selectedDistrictId}`);
      return;
    }
    
    // Skip if the district ID hasn't changed
    if (prevDistrictIdRef.current === selectedDistrictId) {
      console.log(`District ID ${selectedDistrictId} hasn't changed, skipping load`);
      return;
    }
    
    // Skip if we're already loading
    if (isLoadingRef.current) {
      console.log('Already loading subdistrict data, skipping');
      return;
    }
    
    // Update previous district ID
    prevDistrictIdRef.current = selectedDistrictId;
    
    // Set loading flag
    isLoadingRef.current = true;
    
    console.log(`Loading subdistrict data for district ID: ${selectedDistrictId}`);
    
    // Add a small delay to prevent race conditions with other state updates
    const loadingTimeout = setTimeout(() => {
      loadSubdistrictData(selectedDistrictId)
        .then(() => {
          console.log(`Successfully loaded subdistrict data for district ID: ${selectedDistrictId}`);
        })
        .catch((error) => {
          console.error(`Failed to load subdistrict data for district ID: ${selectedDistrictId}`, error);
        })
        .finally(() => {
          // Reset loading flag after data is loaded with a delay
          const resetTimeout = setTimeout(() => {
            isLoadingRef.current = false;
            console.log('Reset loading flag, ready for next load');
          }, 500); // Add delay to prevent immediate re-triggering
          
          return () => clearTimeout(resetTimeout);
        });
    }, 300);
    
    // Cleanup function to clear timeout if component unmounts or effect re-runs
    return () => clearTimeout(loadingTimeout);
  }, [selectedDistrictId, isZooming]);

  // Fungsi khusus untuk memuat data kecamatan Jembrana
  const loadJembranaSubdistrictData = async (districtId: string | number) => {
    console.log(`Loading Jembrana subdistrict data with ID: ${districtId}`);
    try {
      // Define the kecamatan files for Jembrana
      const kecamatanFiles = [
        "id5101010_melaya",
        "id5101020_negara",
        "id5101021_jembrana",
        "id5101030_mendoyo",
        "id5101040_pekutatan"
      ];
      
      // Create a combined GeoJSON with all kecamatan
      const combinedFeatures: any[] = [];
      let loadedCount = 0;
      
      // Try to load each kecamatan file
      for (const kecamatan of kecamatanFiles) {
        try {
          console.log(`Loading kecamatan: ${kecamatan}`);
          // Coba beberapa path yang mungkin untuk file kecamatan
          let url = `/data/bali/jembrana/${kecamatan}.geojson`;
          console.log(`[${new Date().toISOString()}] First attempt to fetch: ${url}`);
          let response = await fetch(url);
          console.log(`First attempt status: ${response.status} ${response.statusText}`);
          
          // Jika tidak berhasil, coba path alternatif
          if (!response.ok) {
            url = `/indonesia-district-master 3/id51_bali/id5101_jembrana/${kecamatan}.geojson`;
            console.log(`[${new Date().toISOString()}] Second attempt to fetch: ${url}`);
            response = await fetch(url);
            console.log(`Second attempt status: ${response.status} ${response.statusText}`);
          }
          
          // Jika masih tidak berhasil, coba path alternatif lain
          if (!response.ok) {
            url = `/id51_bali/id5101_jembrana/${kecamatan}.geojson`;
            console.log(`[${new Date().toISOString()}] Third attempt to fetch: ${url}`);
            response = await fetch(url);
            console.log(`Third attempt status: ${response.status} ${response.statusText}`);
          }
          
          // Jika masih tidak berhasil, coba path alternatif dengan folder geojsonKecamatan
          if (!response.ok) {
            url = `/geojsonKecamatan/id51_bali/id5101_jembrana/${kecamatan}.geojson`;
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
            
            // Add district code for filtering
            feature.properties.district_code = "5101";
            feature.properties.kab_id = "5101";
            feature.properties.kabupaten_id = "5101";
            feature.properties.KABUPATEN_ID = "5101";
            feature.properties.ID_KABUPATEN = "5101";
            
            return feature;
          });
          
          // Add the features to our combined collection
          combinedFeatures.push(...enhancedFeatures);
          loadedCount++;
        } catch (error) {
          console.error(`Error processing ${kecamatan}:`, error);
        }
      }
      
      // If we loaded at least one kecamatan file, use the combined data
      if (combinedFeatures.length > 0) {
        const combinedData: GeoJSONData = {
          type: "FeatureCollection",
          features: combinedFeatures
        };
        setSubdistrictData(combinedData);
        console.log(`Successfully loaded ${combinedFeatures.length} kecamatan features for Jembrana from ${loadedCount} files`);
        return Promise.resolve();
      }
      
      // If no kecamatan files were loaded, fall back to the district file
      console.log('No kecamatan files loaded for Jembrana, falling back to district file');
      
      // Coba beberapa path yang mungkin untuk file district
      let url = '/data/bali/jembrana/id5101_jembrana.geojson';
      console.log(`[${new Date().toISOString()}] First attempt to fetch district file: ${url}`);
      let response = await fetch(url);
      console.log(`First district attempt status: ${response.status} ${response.statusText}`);
      
      // Jika tidak berhasil, coba path alternatif
      if (!response.ok) {
        url = '/indonesia-district-master 3/id51_bali/id5101_jembrana/id5101_jembrana.geojson';
        console.log(`[${new Date().toISOString()}] Second attempt to fetch district file: ${url}`);
        response = await fetch(url);
        console.log(`Second district attempt status: ${response.status} ${response.statusText}`);
      }
      
      // Jika masih tidak berhasil, coba path alternatif lain
      if (!response.ok) {
        url = '/id51_bali/id5101_jembrana/id5101_jembrana.geojson';
        console.log(`[${new Date().toISOString()}] Third attempt to fetch district file: ${url}`);
        response = await fetch(url);
        console.log(`Third district attempt status: ${response.status} ${response.statusText}`);
      }
      
      // Jika masih tidak berhasil, coba path alternatif dengan folder geojsonKecamatan
      if (!response.ok) {
        url = '/geojsonKecamatan/id51_bali/id5101_jembrana/id5101_jembrana.geojson';
        console.log(`[${new Date().toISOString()}] Fourth attempt to fetch district file: ${url}`);
        response = await fetch(url);
        console.log(`Fourth district attempt status: ${response.status} ${response.statusText}`);
      }
      
      if (!response.ok) throw new Error('Jembrana district file not found');
      const text = await response.text();
      
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        throw new Error('Received HTML instead of JSON');
      }
      
      const data = JSON.parse(text);
      setSubdistrictData(data);
      console.log('Successfully loaded Jembrana district data');
      return Promise.resolve();
    } catch (error) {
      console.error("Error loading Jembrana subdistrict data:", error);
      // Set empty GeoJSON to avoid crashes
      setSubdistrictData({
        type: "FeatureCollection",
        features: []
      });
      return Promise.reject(error);
    }
  };
  
  // Fungsi khusus untuk memuat data kecamatan Buleleng
  const loadBulelengSubdistrictData = async (districtId: string | number) => {
    console.log(`Loading Buleleng subdistrict data with ID: ${districtId}`);
    try {
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
          // Coba beberapa path yang mungkin untuk file kecamatan
          let url = `/data/bali/buleleng/${kecamatan}.geojson`;
          console.log(`[${new Date().toISOString()}] First attempt to fetch: ${url}`);
          let response = await fetch(url);
          console.log(`First attempt status: ${response.status} ${response.statusText}`);
          
          // Jika tidak berhasil, coba path alternatif
          if (!response.ok) {
            url = `/indonesia-district-master 3/id51_bali/id5108_buleleng/${kecamatan}.geojson`;
            console.log(`[${new Date().toISOString()}] Second attempt to fetch: ${url}`);
            response = await fetch(url);
            console.log(`Second attempt status: ${response.status} ${response.statusText}`);
          }
          
          // Jika masih tidak berhasil, coba path alternatif lain
          if (!response.ok) {
            url = `/id51_bali/id5108_buleleng/${kecamatan}.geojson`;
            console.log(`[${new Date().toISOString()}] Third attempt to fetch: ${url}`);
            response = await fetch(url);
            console.log(`Third attempt status: ${response.status} ${response.statusText}`);
          }
          
          // Jika masih tidak berhasil, coba path alternatif dengan folder geojsonKecamatan
          if (!response.ok) {
            url = `/geojsonKecamatan/id51_bali/id5108_buleleng/${kecamatan}.geojson`;
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
            
            // Add district code for filtering
            feature.properties.district_code = "5108";
            feature.properties.kab_id = "5108";
            feature.properties.kabupaten_id = "5108";
            feature.properties.KABUPATEN_ID = "5108";
            feature.properties.ID_KABUPATEN = "5108";
            
            return feature;
          });
          
          // Add the features to our combined collection
          combinedFeatures.push(...enhancedFeatures);
          loadedCount++;
        } catch (error) {
          console.error(`Error processing ${kecamatan}:`, error);
        }
      }
      
      // If we loaded at least one kecamatan file, use the combined data
      if (combinedFeatures.length > 0) {
        const combinedData: GeoJSONData = {
          type: "FeatureCollection",
          features: combinedFeatures
        };
        setSubdistrictData(combinedData);
        console.log(`Successfully loaded ${combinedFeatures.length} kecamatan features for Buleleng from ${loadedCount} files`);
        return Promise.resolve();
      }
      
      // If no kecamatan files were loaded, fall back to the district file
      console.log('No kecamatan files loaded for Buleleng, falling back to district file');
      
      // Coba beberapa path yang mungkin untuk file district
      let url = '/data/bali/buleleng/id5108_buleleng.geojson';
      console.log(`[${new Date().toISOString()}] First attempt to fetch district file: ${url}`);
      let response = await fetch(url);
      console.log(`First district attempt status: ${response.status} ${response.statusText}`);
      
      // Jika tidak berhasil, coba path alternatif
      if (!response.ok) {
        url = '/indonesia-district-master 3/id51_bali/id5108_buleleng/id5108_buleleng.geojson';
        console.log(`[${new Date().toISOString()}] Second attempt to fetch district file: ${url}`);
        response = await fetch(url);
        console.log(`Second district attempt status: ${response.status} ${response.statusText}`);
      }
      
      // Jika masih tidak berhasil, coba path alternatif lain
      if (!response.ok) {
        url = '/id51_bali/id5108_buleleng/id5108_buleleng.geojson';
        console.log(`[${new Date().toISOString()}] Third attempt to fetch district file: ${url}`);
        response = await fetch(url);
        console.log(`Third district attempt status: ${response.status} ${response.statusText}`);
      }
      
      // Jika masih tidak berhasil, coba path alternatif dengan folder geojsonKecamatan
      if (!response.ok) {
        url = '/geojsonKecamatan/id51_bali/id5108_buleleng/id5108_buleleng.geojson';
        console.log(`[${new Date().toISOString()}] Fourth attempt to fetch district file: ${url}`);
        response = await fetch(url);
        console.log(`Fourth district attempt status: ${response.status} ${response.statusText}`);
      }
      
      if (!response.ok) throw new Error('Buleleng district file not found');
      const text = await response.text();
      
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        throw new Error('Received HTML instead of JSON');
      }
      
      const data = JSON.parse(text);
      setSubdistrictData(data);
      console.log('Successfully loaded Buleleng district data');
      return Promise.resolve();
    } catch (error) {
      console.error("Error loading Buleleng subdistrict data:", error);
      // Set empty GeoJSON to avoid crashes
      setSubdistrictData({
        type: "FeatureCollection",
        features: []
      });
      return Promise.reject(error);
    }
  };
  
  // Fungsi khusus untuk memuat data kecamatan Klungkung
  const loadKlungkungSubdistrictData = async (districtId: string | number) => {
    console.log(`Loading Klungkung subdistrict data with ID: ${districtId}`);
    try {
      // Define the kecamatan files for Klungkung
      const kecamatanFiles = [
        "id5105010_nusapenida",
        "id5105020_banjarangkan",
        "id5105030_klungkung",
        "id5105040_dawan"
      ];
      
      // Create a combined GeoJSON with all kecamatan
      const combinedFeatures: any[] = [];
      let loadedCount = 0;
      
      // Try to load each kecamatan file
      for (const kecamatan of kecamatanFiles) {
        try {
          console.log(`Loading kecamatan: ${kecamatan}`);
          // Coba beberapa path yang mungkin untuk file kecamatan
          let url = `/data/bali/klungkung/${kecamatan}.geojson`;
          console.log(`[${new Date().toISOString()}] First attempt to fetch: ${url}`);
          let response = await fetch(url);
          console.log(`First attempt status: ${response.status} ${response.statusText}`);
          
          // Jika tidak berhasil, coba path alternatif
          if (!response.ok) {
            url = `/indonesia-district-master 3/id51_bali/id5105_klungkung/${kecamatan}.geojson`;
            console.log(`[${new Date().toISOString()}] Second attempt to fetch: ${url}`);
            response = await fetch(url);
            console.log(`Second attempt status: ${response.status} ${response.statusText}`);
          }
          
          // Jika masih tidak berhasil, coba path alternatif lain
          if (!response.ok) {
            url = `/id51_bali/id5105_klungkung/${kecamatan}.geojson`;
            console.log(`[${new Date().toISOString()}] Third attempt to fetch: ${url}`);
            response = await fetch(url);
            console.log(`Third attempt status: ${response.status} ${response.statusText}`);
          }
          
          // Jika masih tidak berhasil, coba path alternatif dengan folder geojsonKecamatan
          if (!response.ok) {
            url = `/geojsonKecamatan/id51_bali/id5105_klungkung/${kecamatan}.geojson`;
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
            
            // Add district code for filtering
            feature.properties.district_code = "5105";
            feature.properties.kab_id = "5105";
            feature.properties.kabupaten_id = "5105";
            feature.properties.KABUPATEN_ID = "5105";
            feature.properties.ID_KABUPATEN = "5105";
            
            return feature;
          });
          
          // Add the features to our combined collection
          combinedFeatures.push(...enhancedFeatures);
          loadedCount++;
        } catch (error) {
          console.error(`Error processing ${kecamatan}:`, error);
        }
      }
      
      // If we loaded at least one kecamatan file, use the combined data
      if (combinedFeatures.length > 0) {
        const combinedData: GeoJSONData = {
          type: "FeatureCollection",
          features: combinedFeatures
        };
        setSubdistrictData(combinedData);
        console.log(`Successfully loaded ${combinedFeatures.length} kecamatan features for Klungkung from ${loadedCount} files`);
        return Promise.resolve();
      }
      
      // If no kecamatan files were loaded, fall back to the district file
      console.log('No kecamatan files loaded for Klungkung, falling back to district file');
      
      // Coba beberapa path yang mungkin untuk file district
      let url = '/data/bali/klungkung/id5105_klungkung.geojson';
      console.log(`[${new Date().toISOString()}] First attempt to fetch district file: ${url}`);
      let response = await fetch(url);
      console.log(`First district attempt status: ${response.status} ${response.statusText}`);
      
      // Jika tidak berhasil, coba path alternatif
      if (!response.ok) {
        url = '/indonesia-district-master 3/id51_bali/id5105_klungkung/id5105_klungkung.geojson';
        console.log(`[${new Date().toISOString()}] Second attempt to fetch district file: ${url}`);
        response = await fetch(url);
        console.log(`Second district attempt status: ${response.status} ${response.statusText}`);
      }
      
      // Jika masih tidak berhasil, coba path alternatif lain
      if (!response.ok) {
        url = '/id51_bali/id5105_klungkung/id5105_klungkung.geojson';
        console.log(`[${new Date().toISOString()}] Third attempt to fetch district file: ${url}`);
        response = await fetch(url);
        console.log(`Third district attempt status: ${response.status} ${response.statusText}`);
      }
      
      // Jika masih tidak berhasil, coba path alternatif dengan folder geojsonKecamatan
      if (!response.ok) {
        url = '/geojsonKecamatan/id51_bali/id5105_klungkung/id5105_klungkung.geojson';
        console.log(`[${new Date().toISOString()}] Fourth attempt to fetch district file: ${url}`);
        response = await fetch(url);
        console.log(`Fourth district attempt status: ${response.status} ${response.statusText}`);
      }
      
      if (!response.ok) throw new Error('Klungkung district file not found');
      const text = await response.text();
      
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        throw new Error('Received HTML instead of JSON');
      }
      
      const data = JSON.parse(text);
      setSubdistrictData(data);
      console.log('Successfully loaded Klungkung district data');
      return Promise.resolve();
    } catch (error) {
      console.error("Error loading Klungkung subdistrict data:", error);
      // Set empty GeoJSON to avoid crashes
      setSubdistrictData({
        type: "FeatureCollection",
        features: []
      });
      return Promise.reject(error);
    }
  };
  
  // Fungsi khusus untuk memuat data kecamatan Bangli
  const loadBangliSubdistrictData = async (districtId: string | number) => {
    console.log(`Loading Bangli subdistrict data with ID: ${districtId}`);
    try {
      // Define the kecamatan files for Bangli
      const kecamatanFiles = [
        "id5106010_susut",
        "id5106020_bangli",
        "id5106030_tembuku",
        "id5106040_kintamani"
      ];
      
      // Create a combined GeoJSON with all kecamatan
      const combinedFeatures: any[] = [];
      let loadedCount = 0;
      
      // Try to load each kecamatan file
      for (const kecamatan of kecamatanFiles) {
        try {
          console.log(`Loading kecamatan: ${kecamatan}`);
          // Coba beberapa path yang mungkin untuk file kecamatan
          let url = `/data/bali/bangli/${kecamatan}.geojson`;
          console.log(`[${new Date().toISOString()}] First attempt to fetch: ${url}`);
          let response = await fetch(url);
          console.log(`First attempt status: ${response.status} ${response.statusText}`);
          
          // Jika tidak berhasil, coba path alternatif
          if (!response.ok) {
            url = `/indonesia-district-master 3/id51_bali/id5106_bangli/${kecamatan}.geojson`;
            console.log(`[${new Date().toISOString()}] Second attempt to fetch: ${url}`);
            response = await fetch(url);
            console.log(`Second attempt status: ${response.status} ${response.statusText}`);
          }
          
          // Jika masih tidak berhasil, coba path alternatif lain
          if (!response.ok) {
            url = `/id51_bali/id5106_bangli/${kecamatan}.geojson`;
            console.log(`[${new Date().toISOString()}] Third attempt to fetch: ${url}`);
            response = await fetch(url);
            console.log(`Third attempt status: ${response.status} ${response.statusText}`);
          }
          
          // Jika masih tidak berhasil, coba path alternatif dengan folder geojsonKecamatan
          if (!response.ok) {
            url = `/geojsonKecamatan/id51_bali/id5106_bangli/${kecamatan}.geojson`;
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
            
            // Add district code for filtering
            feature.properties.district_code = "5106";
            feature.properties.kab_id = "5106";
            feature.properties.kabupaten_id = "5106";
            feature.properties.KABUPATEN_ID = "5106";
            feature.properties.ID_KABUPATEN = "5106";
            
            return feature;
          });
          
          // Add the features to our combined collection
          combinedFeatures.push(...enhancedFeatures);
          loadedCount++;
        } catch (error) {
          console.error(`Error processing ${kecamatan}:`, error);
        }
      }
      
      // If we loaded at least one kecamatan file, use the combined data
      if (combinedFeatures.length > 0) {
        const combinedData: GeoJSONData = {
          type: "FeatureCollection",
          features: combinedFeatures
        };
        setSubdistrictData(combinedData);
        console.log(`Successfully loaded ${combinedFeatures.length} kecamatan features for Bangli from ${loadedCount} files`);
        return Promise.resolve();
      }
      
      // If no kecamatan files were loaded, fall back to the district file
      console.log('No kecamatan files loaded for Bangli, falling back to district file');
      
      // Coba beberapa path yang mungkin untuk file district
      let url = '/data/bali/bangli/id5106_bangli.geojson';
      console.log(`[${new Date().toISOString()}] First attempt to fetch district file: ${url}`);
      let response = await fetch(url);
      console.log(`First district attempt status: ${response.status} ${response.statusText}`);
      
      // Jika tidak berhasil, coba path alternatif
      if (!response.ok) {
        url = '/indonesia-district-master 3/id51_bali/id5106_bangli/id5106_bangli.geojson';
        console.log(`[${new Date().toISOString()}] Second attempt to fetch district file: ${url}`);
        response = await fetch(url);
        console.log(`Second district attempt status: ${response.status} ${response.statusText}`);
      }
      
      // Jika masih tidak berhasil, coba path alternatif lain
      if (!response.ok) {
        url = '/id51_bali/id5106_bangli/id5106_bangli.geojson';
        console.log(`[${new Date().toISOString()}] Third attempt to fetch district file: ${url}`);
        response = await fetch(url);
        console.log(`Third district attempt status: ${response.status} ${response.statusText}`);
      }
      
      // Jika masih tidak berhasil, coba path alternatif dengan folder geojsonKecamatan
      if (!response.ok) {
        url = '/geojsonKecamatan/id51_bali/id5106_bangli/id5106_bangli.geojson';
        console.log(`[${new Date().toISOString()}] Fourth attempt to fetch district file: ${url}`);
        response = await fetch(url);
        console.log(`Fourth district attempt status: ${response.status} ${response.statusText}`);
      }
      
      if (!response.ok) throw new Error('Bangli district file not found');
      const text = await response.text();
      
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        throw new Error('Received HTML instead of JSON');
      }
      
      const data = JSON.parse(text);
      setSubdistrictData(data);
      console.log('Successfully loaded Bangli district data');
      return Promise.resolve();
    } catch (error) {
      console.error("Error loading Bangli subdistrict data:", error);
      // Set empty GeoJSON to avoid crashes
      setSubdistrictData({
        type: "FeatureCollection",
        features: []
      });
      return Promise.reject(error);
    }
  };
  
  // Fungsi khusus untuk memuat data kecamatan Badung
  const loadBadungSubdistrictData = async (districtId: string | number) => {
    console.log(`Loading Badung subdistrict data with ID: ${districtId}`);
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
          let url = `/data/bali/badung/${kecamatan}.geojson`;
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
            url = `/id51_bali/id5103_badung/${kecamatan}.geojson`;
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
            
            // Add district code for filtering
            feature.properties.district_code = "5103";
            feature.properties.kab_id = "5103";
            feature.properties.kabupaten_id = "5103";
            feature.properties.KABUPATEN_ID = "5103";
            feature.properties.ID_KABUPATEN = "5103";
            
            return feature;
          });
          
          // Add the features to our combined collection
          combinedFeatures.push(...enhancedFeatures);
          loadedCount++;
        } catch (error) {
          console.error(`Error processing ${kecamatan}:`, error);
        }
      }
      
      // If we loaded at least one kecamatan file, use the combined data
      if (combinedFeatures.length > 0) {
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
      let url = '/data/bali/badung/id5103_badung.geojson';
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
        url = '/id51_bali/id5103_badung/id5103_badung.geojson';
        console.log(`[${new Date().toISOString()}] Third attempt to fetch district file: ${url}`);
        response = await fetch(url);
        console.log(`Third district attempt status: ${response.status} ${response.statusText}`);
      }
      
      // Jika masih tidak berhasil, coba path alternatif dengan folder geojsonKecamatan
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
      setSubdistrictData(data);
      console.log('Successfully loaded Badung district data');
      return Promise.resolve();
    } catch (error) {
      console.error("Error loading Badung subdistrict data:", error);
      // Set empty GeoJSON to avoid crashes
      setSubdistrictData({
        type: "FeatureCollection",
        features: []
      });
      return Promise.reject(error);
    }
  };
  
  // Load subdistrict data for any selected district
  const loadSubdistrictData = async (districtId: string | number) => {
    if (!districtId) return Promise.resolve();
    
    // Log the district ID for debugging
    console.log(`loadSubdistrictData called with districtId: ${districtId} (type: ${typeof districtId})`);
    
    // Check if this is the new Badung UUID
    if (districtId.toString() === "46b426f4-ef81-486e-bfc6-d5e2fc09bc41") {
      console.log("Detected new Badung UUID, redirecting to Badung handler");
      return loadBadungSubdistrictData(districtId);
    }
    
    // Check if this is the Bangli UUID
    if (districtId.toString() === "218556bd-88ea-4c69-81f6-8bfd4249faf2") {
      console.log("Detected Bangli UUID, redirecting to Bangli handler");
      return loadBangliSubdistrictData(districtId);
    }
    
    // Check if this is the Klungkung UUID
    if (districtId.toString() === "4cd14b20-1d06-4de3-8d86-2046967aee26") {
      console.log("Detected Klungkung UUID, redirecting to Klungkung handler");
      return loadKlungkungSubdistrictData(districtId);
    }
    
    // Check if this is the Buleleng UUID
    if (districtId.toString() === "1738b7a8-fc72-4c53-a745-be655256cb3d") {
      console.log("Detected Buleleng UUID, redirecting to Buleleng handler");
      return loadBulelengSubdistrictData(districtId);
    }
    
    // Check if this is the Jembrana UUID
    if (districtId.toString() === "0ef10160-a253-471d-92b6-8d256e6f034f") {
      console.log("Detected Jembrana UUID, redirecting to Jembrana handler");
      return loadJembranaSubdistrictData(districtId);
    }
    
    try {
      console.log(`Loading subdistrict data for district ID: ${districtId}`);
      
      // Special case for Bali districts
      // Karangasem (ID 5107)
      if (districtId.toString() === "5107" || 
          (typeof districtId === 'string' && districtId.toLowerCase().includes('karangasem')) ||
          districtId.toString() === "46950146-2da7-4f8d-a7b2-829eca5d55eb") {
        console.log("Processing Karangasem district ID: " + districtId);
        try {
          // Load individual kecamatan files for Karangasem
          console.log("Loading individual kecamatan files for Karangasem");
          
          // Define all 8 kecamatan files for Karangasem
          const kecamatanFiles = [
            "id5107010_rendang",
            "id5107020_sidemen",
            "id5107030_manggis",
            "id5107040_karangasem",
            "id5107050_abang",
            "id5107060_bebandem",
            "id5107070_selat",
            "id5107080_kubu"
          ];
          
          // Create a combined GeoJSON with all kecamatan
          const combinedFeatures: any[] = [];
          let loadedCount = 0;
          
          // Load each kecamatan file
          for (const kecamatan of kecamatanFiles) {
            try {
              console.log(`Loading kecamatan: ${kecamatan}`);
              // Ensure we're using the correct path with proper encoding
              const url = `/data/bali/${kecamatan}.geojson`;
              console.log(`Attempting to fetch: ${url}`);
              const response = await fetch(`/data/bali/${kecamatan}.geojson`);
              
              if (!response.ok) {
                console.error(`HTTP error ${response.status} for ${kecamatan}: ${response.statusText}`);
                // Log the response content for debugging
                const text = await response.text();
                console.error(`Response content (first 100 chars): ${text.substring(0, 100)}...`);
                continue;
              }
              
              let data;
              try {
                const text = await response.text();
                // Check if the response is HTML instead of JSON
                if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                  console.error(`Received HTML instead of JSON for ${kecamatan}`);
                  console.error(`Response content (first 100 chars): ${text.substring(0, 100)}...`);
                  continue;
                }
                
                data = JSON.parse(text);
              } catch (parseError) {
                console.error(`JSON parse error for ${kecamatan}:`, parseError);
                continue;
              }
              
              if (data.features && data.features.length > 0) {
                // Add debugging information to each feature
                const enhancedFeatures = data.features.map((feature: any) => {
                  // Make sure properties exists
                  if (!feature.properties) {
                    feature.properties = {};
                  }
                  
                  // Add kecamatan name if not present
                  if (!feature.properties.kecamatan && !feature.properties.KECAMATAN && 
                      !feature.properties.nama && !feature.properties.NAMA) {
                    // Extract kecamatan name from filename
                    const kecamatanName = kecamatan.split('_').pop() || kecamatan;
                    feature.properties.kecamatan = kecamatanName.charAt(0).toUpperCase() + kecamatanName.slice(1);
                  }
                  
                  // Ensure we have a district_code for filtering
                  if (!feature.properties.district_code) {
                    feature.properties.district_code = kecamatan;
                  }
                  
                  return feature;
                });
                
                combinedFeatures.push(...enhancedFeatures);
                loadedCount++;
                console.log(`Added ${enhancedFeatures.length} features from ${kecamatan}`);
              } else {
                console.warn(`No features found in ${kecamatan}`);
              }
            } catch (e) {
              console.error(`Failed to load kecamatan: ${kecamatan}`, e);
            }
          }
          
          if (combinedFeatures.length > 0) {
            console.log(`Successfully loaded ${loadedCount} of 8 kecamatan files with ${combinedFeatures.length} total features`);
            
            const combinedData: GeoJSONData = {
              type: "FeatureCollection",
              features: combinedFeatures
            };
            
            // Set data directly without the null step which might cause re-renders
            setSubdistrictData(combinedData);
            console.log(`Successfully loaded ${combinedFeatures.length} kecamatan features for Karangasem from ${loadedCount} files`);
            return Promise.resolve();
          }
        } catch (error) {
          console.error("Error loading Karangasem subdistrict data:", error);
          throw error;
        }
      }
      // Denpasar (Kota Denpasar, UUID af24d240-4608-4e2e-a313-146d4eb2998b)
      else if (districtId.toString() === "af24d240-4608-4e2e-a313-146d4eb2998b" || 
          (typeof districtId === 'string' && districtId.toLowerCase().includes('denpasar'))) {
        try {
          console.log('Loading Denpasar kecamatan data from actual files');
          
          // Define the kecamatan files for Denpasar
          const kecamatanFiles = [
            "id5171010_denpasar_selatan",
            "id5171020_denpasar_timur",
            "id5171030_denpasar_barat",
            "id5171031_denpasar_utara"
          ];
          
          // Create a combined GeoJSON with all kecamatan
          const combinedFeatures: any[] = [];
          let loadedCount = 0;
          
          // Load each kecamatan file
          for (const kecamatan of kecamatanFiles) {
            try {
              console.log(`Loading kecamatan: ${kecamatan}`);
              const url = `/data/bali/denpasar/${kecamatan}.geojson`;
              console.log(`Attempting to fetch: ${url}`);
              const response = await fetch(url);
              
              if (!response.ok) {
                console.error(`HTTP error ${response.status} for ${kecamatan}: ${response.statusText}`);
                continue;
              }
              
              let data;
              try {
                const text = await response.text();
                // Check if the response is HTML instead of JSON
                if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                  console.error(`Received HTML instead of JSON for ${kecamatan}`);
                  continue;
                }
                
                data = JSON.parse(text);
              } catch (parseError) {
                console.error(`JSON parse error for ${kecamatan}:`, parseError);
                continue;
              }
              
              // Check if it's a valid GeoJSON
              if (!data || !data.features) {
                console.error(`Invalid GeoJSON for ${kecamatan}`);
                continue;
              }
              
              // Add district_code to each feature for consistency
              const enhancedFeatures = data.features.map((feature: any) => {
                if (!feature.properties) {
                  feature.properties = {};
                }
                
                // Add district_code for filtering if not present
                if (!feature.properties.district_code) {
                  feature.properties.district_code = "af24d240-4608-4e2e-a313-146d4eb2998b";
                }
                
                // Add kecamatan name based on the filename if not present
                if (!feature.properties.kecamatan) {
                  // Extract kecamatan name from filename (e.g., id5171010_denpasar_selatan -> Denpasar Selatan)
                  const nameParts = kecamatan.split('_');
                  if (nameParts.length >= 2) {
                    const kecName = nameParts.slice(1).join(' ');
                    feature.properties.kecamatan = kecName.charAt(0).toUpperCase() + kecName.slice(1);
                  }
                }
                
                return feature;
              });
              
              // Add the features to the combined collection
              combinedFeatures.push(...enhancedFeatures);
              loadedCount++;
              console.log(`Successfully loaded ${enhancedFeatures.length} features for ${kecamatan}`);
            } catch (error) {
              console.error(`Error loading ${kecamatan}:`, error);
            }
          }
          
          if (combinedFeatures.length > 0) {
            const combinedData: GeoJSONData = {
              type: "FeatureCollection",
              features: combinedFeatures
            };
            
            setSubdistrictData(combinedData);
            console.log(`Successfully loaded ${combinedFeatures.length} kecamatan features for Denpasar from ${loadedCount} files`);
            return Promise.resolve();
          } else {
            console.warn('No kecamatan features loaded for Denpasar, falling back to default');
            
            // Fall back to loading the district data and creating simulated kecamatan
            try {
              console.log('Falling back to district data for Denpasar');
              const response = await fetch('/data/bali/denpasar/id5171_kota_denpasar.geojson');
              
              if (!response.ok) throw new Error('District file not found');
              const text = await response.text();
              
              if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                throw new Error('Received HTML instead of JSON');
              }
              
              const data = JSON.parse(text);
              
              if (!data || !data.features || data.features.length === 0) {
                throw new Error('Invalid GeoJSON or no features');
              }
              
              // Use the district geometry for simulated kecamatan
              const districtFeature = data.features[0];
              
              // Create simulated kecamatan names
              const kecamatanNames = [
                { id: "5171010", name: "Denpasar Selatan" },
                { id: "5171020", name: "Denpasar Timur" },
                { id: "5171030", name: "Denpasar Barat" },
                { id: "5171031", name: "Denpasar Utara" }
              ];
              
              const simulatedFeatures = kecamatanNames.map(kec => ({
                type: "Feature" as const,
                properties: {
                  ID: parseInt(kec.id),
                  prov_name: "BALI",
                  kab_name: "KOTA DENPASAR",
                  kec_name: kec.name,
                  kecamatan: kec.name,
                  district_code: "af24d240-4608-4e2e-a313-146d4eb2998b",
                  kec_id: kec.id
                },
                geometry: districtFeature.geometry
              }));
              
              const simulatedData: GeoJSONData = {
                type: "FeatureCollection",
                features: simulatedFeatures
              };
              
              setSubdistrictData(simulatedData);
              console.log(`Created ${simulatedFeatures.length} simulated kecamatan features using district boundary`);
              return Promise.resolve();
            } catch (fallbackError) {
              console.error('Fallback error:', fallbackError);
              throw fallbackError;
            }
          }
        } catch (error) {
          console.error("Error loading Denpasar subdistrict data:", error);
          throw error;
        }
      }
      // Badung (ID 5103 or UUID 2d9c7e67-c5aa-4f74-906b-ad0e9a8ceefd or 46b426f4-ef81-486e-bfc6-d5e2fc09bc41)
      else if (districtId.toString() === "5103" || 
          districtId.toString() === "2d9c7e67-c5aa-4f74-906b-ad0e9a8ceefd" ||
          districtId.toString() === "46b426f4-ef81-486e-bfc6-d5e2fc09bc41" ||
          (typeof districtId === 'string' && districtId.toLowerCase().includes('badung'))) {
        console.log(`Matched Badung district with ID: ${districtId} (type: ${typeof districtId})`);
        try {
          console.log('Loading Badung kecamatan data from individual files');
          
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
              let url = `/data/bali/badung/${kecamatan}.geojson`;
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
                url = `/id51_bali/id5103_badung/${kecamatan}.geojson`;
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
          let url = '/data/bali/badung/id5103_badung.geojson';
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
            url = '/id51_bali/id5103_badung/id5103_badung.geojson';
            console.log(`[${new Date().toISOString()}] Third attempt to fetch district file: ${url}`);
            response = await fetch(url);
            console.log(`Third district attempt status: ${response.status} ${response.statusText}`);
          }
          
          // Jika masih tidak berhasil, coba path alternatif dengan folder geojsonKecamatan
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
      }
      // Gianyar (ID 5104 or UUID eca01c29-8731-4072-8202-7be5b0f62d3b)
      else if (districtId.toString() === "5104" || 
          districtId.toString() === "eca01c29-8731-4072-8202-7be5b0f62d3b" ||
          (typeof districtId === 'string' && districtId.toLowerCase().includes('gianyar'))) {
        console.log(`Matched Gianyar district with ID: ${districtId}`);
        console.log(`ID type: ${typeof districtId}, value: ${districtId.toString()}`);
        try {
          console.log('Loading Gianyar kecamatan data from actual files');
          
          // Define the kecamatan files for Gianyar
          const kecamatanFiles = [
            "id5104010_sukawati",
            "id5104020_blahbatuh",
            "id5104030_gianyar",
            "id5104040_tampaksiring",
            "id5104050_ubud",
            "id5104060_tegallalang",
            "id5104070_payangan"
          ];
          
          // Create a combined GeoJSON with all kecamatan
          const combinedFeatures: any[] = [];
          let loadedCount = 0;
          
          // Load each kecamatan file
          for (const kecamatan of kecamatanFiles) {
            try {
              console.log(`Loading kecamatan: ${kecamatan}`);
              const url = `/data/bali/gianyar/${kecamatan}.geojson`;
              console.log(`Attempting to fetch: ${url}`);
              const response = await fetch(url);
              
              if (!response.ok) {
                console.error(`HTTP error ${response.status} for ${kecamatan}: ${response.statusText}`);
                continue;
              }
              
              let data;
              try {
                const text = await response.text();
                // Check if the response is HTML instead of JSON
                if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                  console.error(`Received HTML instead of JSON for ${kecamatan}`);
                  console.error(`Response content (first 100 chars): ${text.substring(0, 100)}...`);
                  continue;
                }
                
                data = JSON.parse(text);
              } catch (parseError) {
                console.error(`JSON parse error for ${kecamatan}:`, parseError);
                continue;
              }
              
              if (data.features && data.features.length > 0) {
                // Add debugging information to each feature
                const enhancedFeatures = data.features.map((feature: any) => {
                  // Make sure properties exists
                  if (!feature.properties) {
                    feature.properties = {};
                  }
                  
                  // Add kecamatan name if not present
                  if (!feature.properties.kecamatan && !feature.properties.KECAMATAN && 
                      !feature.properties.nama && !feature.properties.NAMA) {
                    // Extract kecamatan name from filename
                    const kecamatanName = kecamatan.split('_').pop() || kecamatan;
                    feature.properties.kecamatan = kecamatanName.charAt(0).toUpperCase() + kecamatanName.slice(1);
                  }
                  
                  // Ensure we have a district_code for filtering
                  if (!feature.properties.district_code) {
                    feature.properties.district_code = "5104";
                  }
                  
                  return feature;
                });
                
                combinedFeatures.push(...enhancedFeatures);
                loadedCount++;
                console.log(`Added ${enhancedFeatures.length} features from ${kecamatan}`);
              } else {
                console.warn(`No features found in ${kecamatan}`);
              }
            } catch (e) {
              console.error(`Failed to load kecamatan: ${kecamatan}`, e);
            }
          }
          
          if (combinedFeatures.length > 0) {
            console.log(`Successfully loaded ${loadedCount} of ${kecamatanFiles.length} kecamatan files with ${combinedFeatures.length} total features`);
            
            const combinedData: GeoJSONData = {
              type: "FeatureCollection",
              features: combinedFeatures
            };
            
            setSubdistrictData(combinedData);
            console.log(`Successfully loaded ${combinedFeatures.length} kecamatan features for Gianyar from ${loadedCount} files`);
            return Promise.resolve();
          } else {
            console.warn('No kecamatan features loaded for Gianyar, falling back to district file');
            
            // Fall back to loading the district data
            try {
              console.log('Falling back to district data for Gianyar');
              const response = await fetch('/data/bali/gianyar/id5104_gianyar.geojson');
              
              if (!response.ok) throw new Error('District file not found');
              const text = await response.text();
              
              if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                throw new Error('Received HTML instead of JSON');
              }
              
              const data = JSON.parse(text);
              
              if (!data || !data.features || data.features.length === 0) {
                throw new Error('Invalid GeoJSON or no features');
              }
              
              // Add district_code for filtering if not present
              const enhancedFeatures = data.features.map((feature: any) => {
                if (!feature.properties) {
                  feature.properties = {};
                }
                
                if (!feature.properties.district_code) {
                  feature.properties.district_code = "5104";
                }
                
                return feature;
              });
              
              const enhancedData: GeoJSONData = {
                type: "FeatureCollection",
                features: enhancedFeatures
              };
              
              setSubdistrictData(enhancedData);
              console.log(`Successfully loaded ${enhancedData.features.length} features from Gianyar district file`);
              return Promise.resolve();
            } catch (fallbackError) {
              console.error('Fallback error:', fallbackError);
              throw fallbackError;
            }
          }
        } catch (error) {
          console.error("Error loading Gianyar subdistrict data:", error);
          throw error;
        }
      }
      // Tabanan (ID 5102 or UUID 9e5b3d4a-c62d-4d2e-a1c6-3c7e0da93c2a)
      else if (districtId.toString() === "5102" || 
          districtId.toString() === "9e5b3d4a-c62d-4d2e-a1c6-3c7e0da93c2a" ||
          (typeof districtId === 'string' && districtId.toLowerCase().includes('tabanan'))) {
        console.log(`Matched Tabanan district with ID: ${districtId}`);
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
      }
      // Jembrana (ID 5101 or UUID 1a6d7e6c-8f5b-4d3a-9b2e-7c8d9f6a5b4c)
      else if (districtId.toString() === "5101" || 
          districtId.toString() === "1a6d7e6c-8f5b-4d3a-9b2e-7c8d9f6a5b4c" ||
          (typeof districtId === 'string' && districtId.toLowerCase().includes('jembrana'))) {
        console.log(`Matched Jembrana district with ID: ${districtId}`);
        try {
          console.log('Loading Jembrana kecamatan data from actual files');
          
          // Define the kecamatan files for Jembrana
          const kecamatanFiles = [
            "id5101010_melaya",
            "id5101020_negara",
            "id5101030_jembrana",
            "id5101040_mendoyo",
            "id5101050_pekutatan"
          ];
          
          // Create a combined GeoJSON with all kecamatan
          const combinedFeatures: any[] = [];
          let loadedCount = 0;
          
          // Try to load each kecamatan file
          for (const kecamatan of kecamatanFiles) {
            try {
              console.log(`Loading kecamatan: ${kecamatan}`);
              const url = `/data/bali/jembrana/${kecamatan}.geojson`;
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
                feature.properties.district_code = "5101"; // Jembrana district code
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
            console.log(`Successfully loaded ${combinedFeatures.length} kecamatan features for Jembrana from ${loadedCount} files`);
            return Promise.resolve();
          }
          
          // If no kecamatan files were loaded, fall back to BALI.geojson
          console.log('No kecamatan files loaded for Jembrana, falling back to BALI.geojson');
          const response = await fetch('/data/kabupaten_by_prov/BALI.geojson');
          
          if (!response.ok) throw new Error('BALI.geojson file not found');
          const responseText = await response.text();
          
          if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
            throw new Error('Received HTML instead of JSON');
          }
          
          const data = JSON.parse(responseText);
          
          // Filter by Jembrana district ID
          const filteredData: GeoJSONData = {
            type: "FeatureCollection",
            features: data.features.filter((feature: any) => {
              const distId = feature.properties.kab_id || 
                            feature.properties.kabupaten_id || 
                            feature.properties.KABUPATEN_ID || 
                            feature.properties.ID_KABUPATEN ||
                            feature.properties.regency_code;
              
              // Handle both formats: "5101" and "id5101"
              return distId?.toString() === "5101" || distId?.toString() === "id5101";
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
              feature.properties.district_code = "5101"; // Jembrana district code
              return feature;
            });
          }
          
          setSubdistrictData(filteredData);
          console.log(`Successfully loaded ${filteredData.features.length} subdistrict features for Jembrana from BALI.geojson`);
          return Promise.resolve();
        } catch (error) {
          console.error("Error loading Jembrana subdistrict data:", error);
          throw error;
        }
      }
      // Klungkung (ID 5105 or UUID 4d4d9d4b-2a9a-4b5c-8e4d-4c4d4e4f5051)
      else if (districtId.toString() === "5105" || 
          districtId.toString() === "4d4d9d4b-2a9a-4b5c-8e4d-4c4d4e4f5051" ||
          (typeof districtId === 'string' && districtId.toLowerCase().includes('klungkung'))) {
        console.log(`Matched Klungkung district with ID: ${districtId}`);
        try {
          console.log('Loading Klungkung kecamatan data from actual files');
          
          // Define the kecamatan files for Klungkung
          const kecamatanFiles = [
            "id5105010_nusa_penida",
            "id5105020_banjarangkan",
            "id5105030_klungkung",
            "id5105040_dawan"
          ];
          
          // Create a combined GeoJSON with all kecamatan
          const combinedFeatures: any[] = [];
          let loadedCount = 0;
          
          // Try to load each kecamatan file
          for (const kecamatan of kecamatanFiles) {
            try {
              console.log(`Loading kecamatan: ${kecamatan}`);
              const url = `/data/bali/klungkung/${kecamatan}.geojson`;
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
                feature.properties.district_code = "5105"; // Klungkung district code
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
            console.log(`Successfully loaded ${combinedFeatures.length} kecamatan features for Klungkung from ${loadedCount} files`);
            return Promise.resolve();
          }
          
          // If no kecamatan files were loaded, fall back to BALI.geojson
          console.log('No kecamatan files loaded for Klungkung, falling back to BALI.geojson');
          const response = await fetch('/data/kabupaten_by_prov/BALI.geojson');
          
          if (!response.ok) throw new Error('BALI.geojson file not found');
          const responseText = await response.text();
          
          if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
            throw new Error('Received HTML instead of JSON');
          }
          
          const data = JSON.parse(responseText);
          
          // Filter by Klungkung district ID
          const filteredData: GeoJSONData = {
            type: "FeatureCollection",
            features: data.features.filter((feature: any) => {
              const distId = feature.properties.kab_id || 
                            feature.properties.kabupaten_id || 
                            feature.properties.KABUPATEN_ID || 
                            feature.properties.ID_KABUPATEN ||
                            feature.properties.regency_code;
              
              // Handle both formats: "5105" and "id5105"
              return distId?.toString() === "5105" || distId?.toString() === "id5105";
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
              feature.properties.district_code = "5105"; // Klungkung district code
              return feature;
            });
          }
          
          setSubdistrictData(filteredData);
          console.log(`Successfully loaded ${filteredData.features.length} subdistrict features for Klungkung from BALI.geojson`);
          return Promise.resolve();
        } catch (error) {
          console.error("Error loading Klungkung subdistrict data:", error);
          throw error;
        }
        
      // Bangli (ID 5106 or UUID 5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f)
      } else if (districtId.toString() === "5106" || 
          districtId.toString() === "5f5f5f5f-5f5f-5f5f-5f5f-5f5f5f5f5f5f" ||
          (typeof districtId === 'string' && districtId.toLowerCase().includes('bangli'))) {
        console.log(`Matched Bangli district with ID: ${districtId}`);
        
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
      }
      // Buleleng (ID 5108 or UUID 6f6f6f6f-6f6f-6f6f-6f6f-6f6f6f6f6f6f)
      else if (districtId.toString() === "5108" || 
          districtId.toString() === "6f6f6f6f-6f6f-6f6f-6f6f-6f6f6f6f6f6f" ||
          (typeof districtId === 'string' && districtId.toLowerCase().includes('buleleng'))) {
        console.log(`Matched Buleleng district with ID: ${districtId}`);
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
      } else {
      // Default loading method if special case didn't work
        try {
          let response;
          let responseText;
          try {
            // Try to load from kabupaten_by_prov/BALI.geojson for Bali districts
            console.log('Attempting to fetch: /data/kabupaten_by_prov/BALI.geojson');
            response = await fetch('/data/kabupaten_by_prov/BALI.geojson');
            if (!response.ok) throw new Error('BALI.geojson file not found');
            responseText = await response.text();
          } catch (e) {
            // Fall back to the district file
            console.log('Falling back to district data');
            console.log('Attempting to fetch: /data/kab_37.geojson');
            response = await fetch('/data/kab_37.geojson');
            if (!response.ok) throw new Error('Failed to fetch district data');
            responseText = await response.text();
          }
          
          // Check if the response is HTML instead of JSON
          if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
            console.error('Received HTML instead of JSON for subdistrict data');
            console.error(`Response content (first 100 chars): ${responseText.substring(0, 100)}...`);
            throw new Error('Received HTML instead of JSON');
          }
          
          // Parse JSON
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error('JSON parse error for subdistrict data:', parseError);
            throw parseError;
          }
          
          // Filter subdistricts by the selected district ID
          const filteredData: GeoJSONData = {
            type: "FeatureCollection",
            features: data.features.filter((feature: any) => {
              // Look for district ID in different possible property names
              const distId = feature.properties.kab_id || 
                            feature.properties.kabupaten_id || 
                            feature.properties.KABUPATEN_ID || 
                            feature.properties.ID_KABUPATEN;
              
              // Convert both to string for comparison to handle both string and number types
              return distId?.toString() === districtId.toString();
            })
          };
          
          setSubdistrictData(filteredData);
          console.log(`Successfully loaded ${filteredData.features.length} subdistrict features for district ID: ${districtId}`);
          return Promise.resolve();
        } catch (error) {
          console.error("Error in default loading method:", error);
          throw error;
        }
      }
    } catch (error) {
      console.error("Error loading subdistrict data:", error);
      setSubdistrictData(null);
      return Promise.reject(error);
    }
  };

  // Filter district data to show only the selected district when a district is selected
  useEffect(() => {
    if (selectedDistrict && districtData && districtData.features.length > 1) {
      // Filter to only show the selected district
      const filteredData = {
        ...districtData,
        features: districtData.features.filter((feature: any) => {
          const props = feature.properties;
          const districtName = props.kab_name || 
                            props.kabupaten || 
                            props.KABUPATEN || 
                            props.nama || 
                            props.NAMA || 
                            props.name || 
                            props.NAME || 
                            props.Nama;
          return districtName === selectedDistrict;
        })
      };
      
      // Only update if we actually filtered something
      if (filteredData.features.length < districtData.features.length) {
        setDistrictData(filteredData);
        console.log(`Filtered to show only district: ${selectedDistrict}`);
      }
    }
  }, [selectedDistrict, districtData]);

  // Helper function to darken a gray color
  const darkenGray = (value: number) => {
    const newValue = Math.max(0, Math.min(255, 128 - value));
    const hexValue = newValue.toString(16).padStart(2, '0');
    return `#${hexValue}${hexValue}${hexValue}`;
  };

  // Style for districts (kabupaten)
  const styleDistrict = (feature: any) => {
    // Extract all possible property values to find the district name
    const props = feature.properties;
    
    // Try all possible property names for district name
    const districtName = props.kab_name || 
                        props.kabupaten || 
                        props.KABUPATEN || 
                        props.nama || 
                        props.NAMA || 
                        props.name || 
                        props.NAME || 
                        props.Nama;
                        
    const isSelected = selectedDistrict === districtName;
    
    // Generate a color based on the district name for visual variety
    const hash = districtName ? districtName.charCodeAt(0) % 5 : 0;
    const colors = ['#7c7c7c', '#6c8fb3', '#8a7ca8', '#7ca88a', '#a87c7c'];
    
    return {
      fillColor: isSelected ? '#3388ff' : colors[hash],
      weight: isSelected ? 2.5 : 1.5,
      opacity: 1,
      color: 'white',
      fillOpacity: isSelected ? 0.7 : 0.5,
      interactive: true,
      className: 'district-path',
    };
  };

  // Event handler for districts (kabupaten)
  const onEachDistrict = (feature: any, layer: any) => {
    // Extract all possible property values to find the district name
    const props = feature.properties;
    
    // Try all possible property names for district name
    const districtName = props.kab_name || 
                        props.kabupaten || 
                        props.KABUPATEN || 
                        props.nama || 
                        props.NAMA || 
                        props.name || 
                        props.NAME || 
                        props.Nama;
                        
    if (!districtName) {
      // If no name is found, log all properties to help debug
      console.warn('No district name found in properties:', props);
      console.warn('Available keys:', Object.keys(props));
      return;
    }
    
    // Debug the properties
    console.log(`District found: ${districtName}`, props);

    // Force enable interactivity on the layer
    if (layer.options) {
      layer.options.interactive = true;
    }
    
    // Make sure the layer is clickable
    if (layer._path) {
      layer._path.setAttribute('class', 'leaflet-interactive');
    }
    
    // Bind tooltip with district name that follows the cursor - same style as province tooltips
    layer.bindTooltip(districtName, {
      sticky: true, // Makes tooltip follow the cursor
      opacity: 0.9,
      className: 'custom-tooltip'
    });
    
    // Ensure tooltips show on mouseover
    layer.on('mouseover', function(e: L.LeafletMouseEvent) {
      console.log(`Mouseover on district: ${districtName}`);
      layer.openTooltip();
    });
    
    // Add a mouseout handler to close tooltip
    layer.on('mouseout', function(e: L.LeafletMouseEvent) {
      layer.closeTooltip();
    });

    layer.on({
      click: (e: any) => {
        // Get the district ID from properties - check all possible property names
        const props = feature.properties;
        
        // Log all properties to see what's available
        console.log('District properties:', props);
        
        // Try to get district ID from various possible property names
        let districtId = props.id_kabupaten || 
                       props.ID || 
                       props.KODE || 
                       props.kab_id || 
                       props.kabupaten_id || 
                       props.id || 
                       props.gid || 
                       props.uuid || 
                       props.code || 
                       props.regency_code;
        
        // Special case for Karangasem to ensure ID 5107 is detected
        if (districtName === "KARANG ASEM" || districtName === "KARANGASEM" || 
            districtName === "Karang Asem" || districtName === "Karangasem") {
            if (props.regency_code === "id5107") {
                districtId = "5107";
            }
        }
        
        // Log which property provided the ID
        if (props.id_kabupaten) console.log(`Found ID in id_kabupaten: ${props.id_kabupaten}`);
        if (props.ID) console.log(`Found ID in ID: ${props.ID}`);
        if (props.KODE) console.log(`Found ID in KODE: ${props.KODE}`);
        if (props.kab_id) console.log(`Found ID in kab_id: ${props.kab_id}`);
        if (props.kabupaten_id) console.log(`Found ID in kabupaten_id: ${props.kabupaten_id}`);
        if (props.id) console.log(`Found ID in id: ${props.id}`);
        if (props.gid) console.log(`Found ID in gid: ${props.gid}`);
        if (props.uuid) console.log(`Found ID in uuid: ${props.uuid}`);
        if (props.code) console.log(`Found ID in code: ${props.code}`);
        
        // If still no ID found, use the name as ID (as fallback)
        if (!districtId && districtName) {
          districtId = `name:${districtName}`;
          console.log(`No explicit ID found for ${districtName}, using name as ID`);
        }
        
        console.log(`Final district ID for ${districtName}: ${districtId}`);
        
        if (districtId) {
          console.log(`Clicked district: ${districtName}, ID: ${districtId}`);
          
          // Access App component's state setters through window.appInstance
          if (window.appInstance) {
            // Set zooming state first to prevent data loading during zoom
            window.appInstance.setIsZooming(true);
            
            // Clear any existing selections after setting zooming state
            window.appInstance.setSelectedDistrict(null);
            window.appInstance.setSelectedDistrictId(null);
          } else {
            console.error('App instance not found in window object');
            return;
          }
          
          // Zoom to the clicked district with animation
          const map = e.target._map;
          if (map) {
            // Get bounds of the clicked district
            const bounds = e.target.getBounds();
            
            // Add padding to make the district more centered and visible
            map.flyToBounds(bounds, { 
              padding: [50, 50], 
              duration: 0.8,
              easeLinearity: 0.5 
            });
            
            // Set the selected district and district ID after the zoom animation completes
            setTimeout(() => {
              if (window.appInstance) {
                // Set the selected district and district ID first
                window.appInstance.setSelectedDistrict(districtName);
                window.appInstance.setSelectedDistrictId(districtId);
                
                // Add a longer delay before turning off zooming state to ensure data loads properly
                setTimeout(() => {
                  // Turn off zooming state last
                  window.appInstance.setIsZooming(false);
                  console.log(`Map focused on district: ${districtName} (ID: ${districtId}), zooming complete`);
                }, 300);
              }
            }, 1000); // Wait slightly longer than the zoom duration
          }
        } else {
          console.error(`No district ID found for ${districtName}`);
        }
      },
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2,
          fillColor: darkenGray(30),
          fillOpacity: 0.85
        });
        layer.bringToFront();
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle(styleDistrict(feature));
      }
    });
  };

  // Style for subdistricts (kecamatan)
  const styleSubdistrict = (feature: any) => {
    // Get kecamatan name for color variation
    const props = feature.properties;
    const kecamatanName = props.kec_name || 
                        props.kecamatan || 
                        props.KECAMATAN || 
                        props.NAMA ||
                        props.nama ||
                        props.district ||
                        props.name ||
                        props.NAME;
    
    console.log("Styling kecamatan:", kecamatanName, props);
    
    // Generate a color based on the kecamatan name for visual variety
    // Use a more deterministic approach for consistent colors
    let hash = 0;
    if (kecamatanName) {
      for (let i = 0; i < kecamatanName.length; i++) {
        hash = ((hash << 5) - hash) + kecamatanName.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
      }
      hash = Math.abs(hash) % 8;
    }
    
    // Brighter, more distinct colors
    const colors = [
      '#FF5733', // Bright red-orange
      '#33FF57', // Bright green
      '#3357FF', // Bright blue
      '#F033FF', // Bright purple
      '#FF33A8', // Bright pink
      '#33FFF0', // Bright cyan
      '#F3FF33', // Bright yellow
      '#FF9933'  // Bright orange
    ];
    
    return {
      weight: 5, // Increased border thickness for better visibility
      opacity: 1.0,
      color: '#000000', // Black border for better visibility
      fillColor: colors[hash],
      fillOpacity: 0.8, // Increased opacity for better visibility
      dashArray: '' // Solid line instead of dashed
    };
  };

  // Event handler for subdistricts (kecamatan)
  const onEachSubdistrict = (feature: any, layer: any) => {
    // Extract kecamatan name from properties - try all possible property names
    const props = feature.properties;
    const kecamatanName = props.kec_name || 
                        props.kecamatan || 
                        props.KECAMATAN || 
                        props.NAMA ||
                        props.nama ||
                        props.district ||
                        props.name ||
                        props.NAME ||
                        props.village;
    
    if (!kecamatanName) {
      console.warn('No kecamatan name found in properties:', props);
      return;
    }
    
    // Remove any existing tooltips
    if (layer.getTooltip()) {
      layer.unbindTooltip();
    }
    
    // Bind popup for click action
    layer.bindPopup(kecamatanName, { className: 'custom-tooltip' });
    
    // Bind tooltip with kecamatan name that follows the cursor - enhanced style
    layer.bindTooltip(`<div class="enhanced-tooltip"><strong>${kecamatanName}</strong></div>`, {
      sticky: true, // Makes tooltip follow the cursor
      opacity: 0.95,
      direction: 'top',
      offset: [0, -10],
      className: 'custom-tooltip kecamatan-tooltip'
    });
    
    layer.on({
      click: (e: any) => {
        // Zoom to the clicked subdistrict
        const map = e.target._map;
        if (map) {
          const bounds = e.target.getBounds();
          map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 13, duration: 0.5 });
        }
      },
      mouseover: (e: any) => {
        const layer = e.target;
        
        // Create a brighter highlight effect
        layer.setStyle({
          weight: 6,
          color: '#FFFFFF',
          dashArray: '',
          fillOpacity: 0.9
        });
        layer.bringToFront();
        
        // Open the tooltip
        layer.openTooltip();
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle(styleSubdistrict(feature));
        
        // Close the tooltip
        layer.closeTooltip();
      }
    });
  };

  return (
    <>
      {/* Render districts if a province is selected */}
      {selectedProvince && districtData && (
        <GeoJSON 
          key={`districts-${selectedProvince}`}
          data={districtData} 
          style={styleDistrict}
          onEachFeature={onEachDistrict}
          interactive={true}
          bubblingMouseEvents={false}
          eventHandlers={{
            add: (e) => {
              // Force enable interactivity on the entire layer
              const layer = e.target;
              if (layer.options) {
                layer.options.interactive = true;
              }
              console.log('District layer added to map with', districtData.features.length, 'features');
              
              // Force update all paths to be interactive
              setTimeout(() => {
                const paths = document.querySelectorAll('.leaflet-overlay-pane path');
                paths.forEach(path => {
                  path.classList.add('leaflet-interactive');
                });
              }, 100);
            }
          }}
        />
      )}
      
      {/* Render subdistricts if a district is selected */}
      {selectedDistrict && subdistrictData && (
        <GeoJSON 
          data={subdistrictData} 
          style={styleSubdistrict}
          onEachFeature={onEachSubdistrict}
          interactive={true}
          bubblingMouseEvents={false}
          pathOptions={{ interactive: true }}
        />
      )}
    </>
  );
};

const App: React.FC = () => {
  const mapRef = useRef<Map | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONData | null>(null);
  const [districtData, setDistrictData] = useState<GeoJSONData | null>(null);
  const [subdistrictData, setSubdistrictData] = useState<GeoJSONData | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | number | null>(null);
  const [isZooming, setIsZooming] = useState<boolean>(false);
  
  // Store reference to state setters in window object for access from event handlers
  useEffect(() => {
    window.appInstance = {
      setSelectedProvince,
      setSelectedDistrict,
      setSelectedDistrictId,
      setIsZooming,
      loadSubdistrictData: (districtId: string | number) => {
        // Find the MapController component and call its loadSubdistrictData method
        if (districtId) {
          console.log(`App requesting to load subdistrict data for district ID: ${districtId}`);
        }
      }
    };
    
    return () => {
      window.appInstance = undefined;
    };
  }, []);

  // Handle breadcrumb navigation clicks
  const handleBreadcrumbClick = (level: string) => {
    if (level === 'indonesia') {
      // Reset to Indonesia view (national level)
      setIsZooming(true);
      setSelectedProvince(null);
      setSelectedDistrict(null);
      setSelectedDistrictId(null);
      
      // Reset map view to Indonesia
      if (mapRef.current) {
        mapRef.current.setView([-2.5, 118], 5, {
          animate: true,
          duration: 0.8
        });
        
        // Reset zooming state after animation completes
        setTimeout(() => {
          setIsZooming(false);
        }, 900);
      }
    } else if (level === 'province') {
      // Keep province selection but reset district
      setSelectedDistrict(null);
      setSelectedDistrictId(null);
      
      // Zoom to province if available
      if (geoJsonData && mapRef.current) {
        const provinceFeature = geoJsonData.features.find((f: any) => {
          const name = f.properties.prov_name || f.properties.Propinsi || f.properties.PROVINSI || f.properties.provinsi || f.properties.NAMA;
          return name === selectedProvince;
        });
        
        if (provinceFeature) {
          const bounds = L.geoJSON(provinceFeature).getBounds();
          mapRef.current.flyToBounds(bounds, { padding: [50, 50], duration: 0.5 });
        }
      }
    }
  };

  // Style for provinces
  const styleFeature = (feature: any) => {
    // Check for different property name formats
    const provinceName = feature.properties.prov_name || feature.properties.Propinsi || feature.properties.PROVINSI || feature.properties.provinsi || feature.properties.NAMA;
    const isSelected = selectedProvince === provinceName;
    return {
      fillColor: isSelected ? '#3388ff' : '#a3c9f7',
      weight: 1,
      opacity: 1,
      color: 'white',
      fillOpacity: isSelected ? 0.7 : 0.5,
    };
  };

  // Event handler for provinces
  const onEachFeature = (feature: GeoJSONFeature, layer: L.Layer) => {
    // Check for different property name formats
    const provinceName = feature.properties.prov_name || feature.properties.Propinsi || feature.properties.PROVINSI || feature.properties.provinsi || feature.properties.NAMA;
    const provinceId = feature.properties.prov_id || feature.properties.provinsi_id || feature.properties.ID || feature.properties.KODE;
    
    if (provinceName) {
      // Debug the properties
      console.log('Province properties:', feature.properties);
      
      layer.bindTooltip(provinceName, {
        sticky: true, // Makes tooltip follow the cursor
        opacity: 0.9,
        className: 'custom-tooltip'
      });
      layer.on({
        click: (e) => {
          console.log(`Clicked province: ${provinceName}, ID: ${provinceId}`);
          
          // First just zoom to the clicked province with animation
          if (mapRef.current) {
            const bounds = e.target.getBounds();
            
            // Clear any existing districts first and set zooming state
            setSelectedProvince(null);
            setIsZooming(true);
            
            // Start the zoom animation
            mapRef.current.flyToBounds(bounds, {
              padding: [50, 50],
              duration: 0.8,
              easeLinearity: 0.5
            });
            
            // Set the selected province after the zoom animation completes
            setTimeout(() => {
              setSelectedProvince(provinceName);
              setIsZooming(false);
              console.log(`Setting province after zoom: ${provinceName}`);
            }, 900); // Wait slightly longer than the zoom duration
          }
        },
        mouseover: (e) => e.target.setStyle({ weight: 2, fillOpacity: 0.7 }),
        mouseout: (e) => e.target.setStyle(styleFeature(feature)),
      });
    }
  };

  // Load province data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to load the fixed province data with actual boundaries
        let response;
        try {
          // Try the fixed file first
          response = await fetch('/data/prov 37.geojson');
          if (!response.ok) throw new Error('Fixed file not found');
        } catch (e) {
          // Fall back to the simplified file
          console.log('Falling back to simplified province data');
          response = await fetch('/data/prov_37.geojson');
          if (!response.ok) throw new Error('Failed to fetch province data');
        }
        
        const data = await response.json();
        setGeoJsonData(data);
        console.log('Successfully loaded province data');
        
        // Center the map on Indonesia
        if (mapRef.current) {
          mapRef.current.setView([-2.5, 118], 5); // Center on Indonesia
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="App">
      <div className="app-header">
        <div className="header-content">
          <div className="logo-container">
            <div className="logo-icon">🗺️</div>
            <h1>Indonesia Map Explorer</h1>
          </div>
          
          {/* Breadcrumb Navigation */}
          <div className="breadcrumb">
            <span 
              className={`breadcrumb-item ${!selectedProvince ? 'current' : ''}`}
              onClick={() => handleBreadcrumbClick('indonesia')}
            >
              Indonesia
            </span>
            
            {selectedProvince && (
              <>
                <span className="breadcrumb-separator">&gt;</span>
                <span 
                  className={`breadcrumb-item ${!selectedDistrict ? 'current' : ''}`}
                  onClick={() => handleBreadcrumbClick('province')}
                >
                  {selectedProvince}
                </span>
              </>
            )}
            
            {selectedDistrict && (
              <>
                <span className="breadcrumb-separator">&gt;</span>
                <span className="breadcrumb-item current">{selectedDistrict}</span>
              </>
            )}
          </div>
          
          {/* Info Panel */}
          <div className="info-panel">
            <div className="info-title">Current Selection</div>
            <div>
              {isZooming ? (
                <span className="loading-text">Loading...</span>
              ) : (
                selectedDistrict || selectedProvince || 'Indonesia'
              )}
            </div>
          </div>
        </div>
      </div>
      
      <MapContainer 
        center={[-2.5, 118]} 
        zoom={5}
        style={{ height: 'calc(100vh - 70px)', width: '100%' }}
        className="map-container"
        ref={(map) => {
          if (map) mapRef.current = map;
        }}
      >
        {isZooming && (
          <div className="map-loading-overlay">
            <div className="map-loading-indicator">Loading boundaries...</div>
          </div>
        )}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render all provinces when none is selected */}
        {geoJsonData && !selectedProvince && (
          <GeoJSON 
            data={geoJsonData} 
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
        
        {/* Render only the selected province when one is clicked */}
        {geoJsonData && selectedProvince && (
          <GeoJSON 
            data={{
              type: "FeatureCollection",
              features: geoJsonData.features.filter((feature: GeoJSONFeature) => {
                const name = feature.properties.prov_name || 
                            feature.properties.Propinsi || 
                            feature.properties.PROVINSI || 
                            feature.properties.provinsi || 
                            feature.properties.NAMA;
                return name === selectedProvince;
              })
            } as GeoJSONData} 
            style={(feature) => ({
              fillColor: '#3388ff',
              weight: 2,
              opacity: 1,
              color: 'white',
              fillOpacity: 0.3,
            })}
            onEachFeature={(feature, layer) => {
              // Only add tooltip, no click handler needed since we're already focused on this province
              const provinceName = feature.properties.prov_name || feature.properties.Propinsi || 
                                 feature.properties.PROVINSI || feature.properties.provinsi || 
                                 feature.properties.NAMA;
              if (provinceName) {
                layer.bindTooltip(provinceName, {
                  sticky: true,
                  opacity: 0.9,
                  className: 'custom-tooltip'
                });
              }
            }}
          />
        )}
        
        {/* MapController handles district and subdistrict layers */}
        <MapController 
          selectedProvince={selectedProvince}
          setSelectedProvince={setSelectedProvince}
          selectedDistrict={selectedDistrict}
          setSelectedDistrict={setSelectedDistrict}
          selectedDistrictId={selectedDistrictId}
          setSelectedDistrictId={setSelectedDistrictId}
          isZooming={isZooming}
          setIsZooming={setIsZooming}
        />
      </MapContainer>
    </div>
  );
};

export default App;
