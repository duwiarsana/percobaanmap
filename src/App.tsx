import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import L, { Map } from 'leaflet';

// Import loader functions and types from separate files
import {
  loadBadungSubdistrictData,
  loadBangliSubdistrictData,
  loadKlungkungSubdistrictData,
  loadBulelengSubdistrictData,
  loadJembranaSubdistrictData,
  loadTabananSubdistrictData
} from './loaders';
import { GeoJSONData, GeoJSONFeature, SetSubdistrictDataFunction } from './loaders/types';

// Extend Window interface to include our app instance
declare global {
  interface Window {
    appInstance: any;
  }
}

// Type definitions are now imported from './loaders/types'

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
  
  // This effect is no longer needed as loadSubdistrictData is now in the App component
  useEffect(() => {
    // No need to expose loadSubdistrictData from here anymore
    console.log('MapController component mounted');
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
    }
  }, [selectedProvince]);

  // Then, load district data when province ID is available
  useEffect(() => {
    if (selectedProvinceId) {
      const loadDistrictData = async () => {
        try {
          console.log(`Loading district data for province ID: ${selectedProvinceId}`);
          
          // Try to load from the fixed file first
          let response;
          try {
            response = await fetch(`/data/kab 37.geojson`);
            if (!response.ok) throw new Error('Fixed file not found');
          } catch (e) {
            // Try alternate file name
            response = await fetch(`/data/kab_37.geojson`);
            if (!response.ok) throw new Error('Failed to fetch district data');
          }
          
          const data = await response.json();
          
          // Filter to only show districts in the selected province
          const filteredData = {
            ...data,
            features: data.features.filter((feature: any) => {
              const provId = feature.properties.prov_id || 
                            feature.properties.provinsi_id || 
                            feature.properties.PROV_ID;
              return provId && provId.toString() === selectedProvinceId.toString();
            })
          };
          
          setDistrictData(filteredData);
          console.log(`Loaded ${filteredData.features.length} districts for province ID: ${selectedProvinceId}`);
        } catch (error) {
          console.error("Error loading district data:", error);
          setDistrictData(null);
        }
      };
      
      loadDistrictData();
    } else {
      setDistrictData(null);
    }
  }, [selectedProvinceId]);

  // Load subdistrict data when a district is selected
  useEffect(() => {
    if (!selectedDistrictId || isZooming) return;
    
    console.log(`Selected district ID changed to: ${selectedDistrictId}, loading subdistrict data...`);
    
    // Add a small delay to prevent rapid loading during interactions
    const loadingTimeout = setTimeout(() => {
      // Set a flag to prevent multiple loads during zooming
      setIsZooming(true);
      
      // Use the App component's loadSubdistrictData function via window.appInstance
      if (window.appInstance && window.appInstance.loadSubdistrictData) {
        console.log(`Calling loadSubdistrictData via appInstance for district ID: ${selectedDistrictId}`);
        window.appInstance.loadSubdistrictData(selectedDistrictId)
          .then(() => {
            console.log(`Successfully loaded subdistrict data for district ID: ${selectedDistrictId}`);
            
            // Reset zooming state after a short delay to prevent rapid reloading
            const resetTimeout = setTimeout(() => {
              setIsZooming(false);
            }, 500);
            
            return () => clearTimeout(resetTimeout);
          })
          .catch((error: any) => {
            console.error("Error loading subdistrict data:", error);
            setIsZooming(false);
          });
      } else {
        console.error("appInstance or loadSubdistrictData function not available");
        setIsZooming(false);
      }
    }, 300);
    
    // Cleanup function to clear timeout if component unmounts or effect re-runs
    return () => clearTimeout(loadingTimeout);
  }, [selectedDistrictId, isZooming]);

  // loadSubdistrictData has been moved to the App component
  
  return null;
};

const App: React.FC = () => {
  const mapRef = useRef<Map | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONData | null>(null);
  const [districtData, setDistrictData] = useState<GeoJSONData | null>(null);
  const [subdistrictData, setSubdistrictData] = useState<GeoJSONData | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  
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
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | number | null>(null);
  const [isZooming, setIsZooming] = useState<boolean>(false);
  
  // Helper function to darken a gray color
  const darkenGray = (value: number) => {
    const newValue = Math.max(0, Math.min(255, 128 - value));
    const hexValue = newValue.toString(16).padStart(2, '0');
    return `#${hexValue}${hexValue}${hexValue}`;
  };
  
  // Style for districts (kabupaten)
  const styleDistrict = (feature: any) => {
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
    
    // Check if this district is selected
    const isSelected = selectedDistrict === districtName;
    
    // Get a numeric value from the feature to use for color variation
    // This creates a different shade of gray for each district
    const idValue = props.ID || props.id || props.kab_id || props.kabupaten_id || 0;
    const numericValue = typeof idValue === 'string' ? parseInt(idValue, 10) % 40 : idValue % 40;
    
    // Generate a gray color based on the numeric value
    const baseColor = isSelected ? '#3388ff' : darkenGray(numericValue * 3);
    
    return {
      fillColor: baseColor,
      weight: isSelected ? 3 : 1,
      opacity: 1,
      color: isSelected ? '#0066cc' : '#666',
      dashArray: '',
      fillOpacity: isSelected ? 0.5 : 0.3
    };
  };

  // Load subdistrict data for any selected district
  const loadSubdistrictData = async (districtId: string | number) => {
    if (!districtId) return Promise.resolve();
    
    // Log the district ID for debugging
    console.log(`loadSubdistrictData called with districtId: ${districtId} (type: ${typeof districtId})`);
    
    // Create a wrapper function that matches the SetSubdistrictDataFunction type
    const setSubdistrictDataWrapper: SetSubdistrictDataFunction = (data) => {
      setSubdistrictData(data);
    };
    
    try {
      // Check if this is the new Badung UUID
      if (districtId.toString() === "46b426f4-ef81-486e-bfc6-d5e2fc09bc41" || 
          districtId.toString() === "5103" || 
          districtId.toString() === "2d9c7e67-c5aa-4f74-906b-ad0e9a8ceefd" ||
          (typeof districtId === 'string' && districtId.toLowerCase().includes('badung'))) {
        console.log("Detected Badung district, calling Badung loader");
        return loadBadungSubdistrictData(setSubdistrictDataWrapper);
      }
      
      // Check if this is the Bangli UUID
      if (districtId.toString() === "218556bd-88ea-4c69-81f6-8bfd4249faf2" ||
          districtId.toString() === "5106" ||
          (typeof districtId === 'string' && districtId.toLowerCase().includes('bangli'))) {
        console.log("Detected Bangli district, calling Bangli loader");
        return loadBangliSubdistrictData(setSubdistrictDataWrapper);
      }
      
      // Check if this is the Klungkung UUID
      if (districtId.toString() === "4cd14b20-1d06-4de3-8d86-2046967aee26" ||
          districtId.toString() === "5105" ||
          (typeof districtId === 'string' && districtId.toLowerCase().includes('klungkung'))) {
        console.log("Detected Klungkung district, calling Klungkung loader");
        return loadKlungkungSubdistrictData(setSubdistrictDataWrapper);
      }
      
      // Check if this is the Buleleng UUID
      if (districtId.toString() === "1738b7a8-fc72-4c53-a745-be655256cb3d" ||
          districtId.toString() === "5108" ||
          (typeof districtId === 'string' && districtId.toLowerCase().includes('buleleng'))) {
        console.log("Detected Buleleng district, calling Buleleng loader");
        return loadBulelengSubdistrictData(setSubdistrictDataWrapper);
      }
      
      // Check if this is the Jembrana UUID
      if (districtId.toString() === "0ef10160-a253-471d-92b6-8d256e6f034f" ||
          districtId.toString() === "5101" ||
          (typeof districtId === 'string' && districtId.toLowerCase().includes('jembrana'))) {
        console.log("Detected Jembrana district, calling Jembrana loader");
        return loadJembranaSubdistrictData(setSubdistrictDataWrapper);
      }
      
      // Check if this is the Tabanan UUID
      if (districtId.toString() === "f844eec7-5138-497c-a182-fff159c658d9" ||
          districtId.toString() === "5102" ||
          (typeof districtId === 'string' && districtId.toLowerCase().includes('tabanan'))) {
        console.log("Detected Tabanan district, calling Tabanan loader");
        return loadTabananSubdistrictData(setSubdistrictDataWrapper);
      }
      
      // For other districts, try to load from BALI.geojson
      console.log(`No specific loader for district ID: ${districtId}, falling back to BALI.geojson`);
      const response = await fetch('/data/BALI.geojson');
      
      if (!response.ok) throw new Error('BALI.geojson not found');
      const data = await response.json();
      
      // Filter by district ID if possible
      const filteredData: GeoJSONData = {
        type: "FeatureCollection",
        features: data.features.filter((feature: any) => {
          // Try to match by district ID or name
          return feature.properties && 
                 (feature.properties.district_id === districtId.toString() ||
                  feature.properties.kabupaten_id === districtId.toString());
        })
      };
      
      setSubdistrictData(filteredData);
      return Promise.resolve();
    } catch (error) {
      console.error("Error loading subdistrict data:", error);
      setSubdistrictData(null);
      return Promise.reject(error);
    }
  };

  // Make app instance available globally for external access
  useEffect(() => {
    // @ts-ignore - Add appInstance to window object
    window.appInstance = {
      setSelectedProvince,
      setSelectedDistrict,
      setSelectedDistrictId,
      setIsZooming,
      loadSubdistrictData
    };
    
    return () => {
      // @ts-ignore - Remove appInstance from window object on cleanup
      window.appInstance = undefined;
    };
  }, []);

  // Handle breadcrumb navigation clicks
  const handleBreadcrumbClick = (level: string) => {
    if (level === 'indonesia') {
      // Reset all selections
      setSelectedProvince(null);
      setSelectedDistrict(null);
      setSelectedDistrictId(null);
      setSubdistrictData(null);
      
      // Zoom out to show all of Indonesia
      if (mapRef.current) {
        setIsZooming(true);
        mapRef.current.setView([-2.5, 118], 5);
        
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
      console.log(`Province: ${provinceName}, ID: ${provinceId}`);
      
      // Add a popup with the province name
      layer.bindPopup(`<b>${provinceName}</b>`);
      
      // Add click handler
      layer.on({
        click: () => {
          console.log(`Clicked on province: ${provinceName}`);
          setSelectedProvince(provinceName);
          
          // Zoom to the bounds of the clicked province
          if (mapRef.current) {
            // Add type assertion to layer as L.GeoJSON
            const bounds = (layer as L.GeoJSON).getBounds();
            mapRef.current.flyToBounds(bounds, { padding: [50, 50], duration: 0.5 });
          }
        }
      });
    }
  };

  // Event handler for districts
  const onEachDistrict = (feature: GeoJSONFeature, layer: L.Layer) => {
    const props = feature.properties;
    
    // Try all possible property names for district name and ID
    const districtName = props.kab_name || props.kabupaten || props.KABUPATEN || props.nama || props.NAMA || props.name || props.NAME || props.Nama;
    const districtId = props.kab_id || props.kabupaten_id || props.ID || props.id || props.KODE || props.kode;
    
    if (districtName) {
      // Debug the properties
      console.log(`District: ${districtName}, ID: ${districtId}`);
      
      // Add a popup with the district name
      layer.bindPopup(`<b>${districtName}</b>`);
      
      // Add click handler
      layer.on({
        click: () => {
          console.log(`Clicked on district: ${districtName}, ID: ${districtId}`);
          setSelectedDistrict(districtName);
          setSelectedDistrictId(districtId);
          
          // Zoom to the bounds of the clicked district
          if (mapRef.current) {
            // Add type assertion to layer as L.GeoJSON
            const bounds = (layer as L.GeoJSON).getBounds();
            mapRef.current.flyToBounds(bounds, { padding: [50, 50], duration: 0.5 });
          }
        }
      });
    }
  };

  // Style for subdistricts (kecamatan)
  const styleSubdistrict = (feature: any) => {
    // Get a numeric value from the feature to use for color variation
    const idValue = feature.properties.ID || feature.properties.id || feature.properties.kec_id || feature.properties.kecamatan_id || 0;
    const numericValue = typeof idValue === 'string' ? parseInt(idValue, 10) % 40 : idValue % 40;
    
    // Generate a color based on the numeric value
    const hue = (numericValue * 30) % 360;
    
    return {
      fillColor: `hsl(${hue}, 70%, 70%)`,
      weight: 1,
      opacity: 1,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7
    };
  };

  // Event handler for subdistricts
  const onEachSubdistrict = (feature: GeoJSONFeature, layer: L.Layer) => {
    const props = feature.properties;
    
    // Try all possible property names for subdistrict name
    const subdistrictName = props.kec_name || props.kecamatan || props.KECAMATAN || props.nama || props.NAMA || props.name || props.NAME || props.Nama;
    
    if (subdistrictName) {
      // Add a popup with the subdistrict name
      layer.bindPopup(`<b>${subdistrictName}</b>`);
      
      // Add click handler (currently just shows the popup)
      layer.on({
        click: () => {
          console.log(`Clicked on subdistrict: ${subdistrictName}`);
          // We could add more functionality here if needed
        }
      });
    }
  };

  // Load Indonesia provinces data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to load from the fixed file first
        let response;
        try {
          response = await fetch('/data/prov 37.geojson');
          if (!response.ok) throw new Error('Fixed file not found');
        } catch (e) {
          // Try alternate file name
          response = await fetch('/data/prov_37.geojson');
          if (!response.ok) throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        setGeoJsonData(data);
        console.log('Successfully loaded province data');
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    
    fetchData();
  }, []);

  // Create a ref callback for the map
  const setMapRef = (map: Map | null) => {
    if (map) {
      mapRef.current = map;
      console.log('Map reference created');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Indonesia Map Viewer</h1>
        
        {/* Breadcrumb navigation */}
        <div className="breadcrumb">
          <span onClick={() => handleBreadcrumbClick('indonesia')} className="breadcrumb-item">Indonesia</span>
          {selectedProvince && (
            <>
              <span className="breadcrumb-separator">&gt;</span>
              <span onClick={() => handleBreadcrumbClick('province')} className="breadcrumb-item">{selectedProvince}</span>
            </>
          )}
          {selectedDistrict && (
            <>
              <span className="breadcrumb-separator">&gt;</span>
              <span className="breadcrumb-item active">{selectedDistrict}</span>
            </>
          )}
        </div>
      </header>
      
      <div className="map-container">
        <MapContainer
          center={[-2.5, 118]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          ref={setMapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Render Indonesia provinces */}
          {geoJsonData && (
            <GeoJSON
              data={geoJsonData}
              style={styleFeature}
              onEachFeature={onEachFeature}
            />
          )}
          
          {/* Render districts when a province is selected */}
          {districtData && (
            <GeoJSON
              data={districtData}
              style={styleDistrict}
              onEachFeature={onEachDistrict}
            />
          )}
          
          {/* Render subdistricts when a district is selected */}
          {subdistrictData && (
            <GeoJSON
              data={subdistrictData}
              style={styleSubdistrict}
              onEachFeature={onEachSubdistrict}
            />
          )}
          
          {/* Controller component to handle map interactions */}
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
    </div>
  );
};

export default App;
