import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import L, { Map } from 'leaflet';
import { loadSubdistrictData as loadSubdistrictDataGeneric, createEmptyGeoJSON, LoadResult } from './data-loader';
import { findDistrictConfig } from './data-config';

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
    [key: string]: any;
  };
  geometry: any;
}

interface GeoJSONData {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
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
            response = await fetch('/data/prov_37.geojson');
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
              response = await fetch('/data/kab_37.geojson');
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


  // Load subdistrict data for any selected district - Refactored to use data-driven approach
  const loadSubdistrictData = async (districtId: string | number) => {
    if (!districtId) return Promise.resolve();
    
    try {
      // Use the generic data loader
      const result: LoadResult = await loadSubdistrictDataGeneric(districtId);

      if (result.success && result.data) {
        setSubdistrictData(result.data);

        // Log success with meaningful information
        const districtConfig = findDistrictConfig(districtId);
        const districtName = districtConfig?.name || 'Unknown';

        if (result.loadedCount && result.loadedCount > 0) {
          console.log(`✅ Successfully loaded ${result.loadedCount}/${result.totalCount} subdistrict files for ${districtName} with ${result.data.features.length} total features`);
        } else {
          console.log(`✅ Successfully loaded fallback data for ${districtName} with ${result.data.features.length} features`);
        }

        return Promise.resolve();
      } else {
        // Handle failure with meaningful error message
        console.error(`❌ Failed to load subdistrict data: ${result.error}`);

        // Set empty data to prevent crashes
        setSubdistrictData(createEmptyGeoJSON());

        return Promise.reject(new Error(result.error));
      }
    } catch (error) {
      setSubdistrictData(createEmptyGeoJSON());
      return Promise.reject(error);
    }
  };

  // Style for districts (kabupaten)
  const styleDistrict = (feature: any) => {
    const props = feature.properties;
    const districtName = props.kab_name || props.kabupaten || props.KABUPATEN || props.nama || props.NAMA || props.name || props.NAME || props.Nama;
    const isSelected = selectedDistrict === districtName;
    return {
      fillColor: isSelected ? '#f5a623' : '#4a90e2',
      weight: 1.5,
      opacity: 1,
      color: 'white',
      fillOpacity: isSelected ? 0.8 : 0.6,
    };
  };

  // Event handler for districts (kabupaten)
  const onEachDistrict = (feature: any, layer: any) => {
    const props = feature.properties;
    const districtName = props.kab_name || props.kabupaten || props.KABUPATEN || props.nama || props.NAMA || props.name || props.NAME || props.Nama;
    let districtId = props.id_kabupaten || props.ID || props.KODE || props.kab_id || props.kabupaten_id || props.id || props.gid || props.uuid || props.code || props.regency_code;

    if (districtName) {
      layer.bindTooltip(districtName, { sticky: true, className: 'custom-tooltip' });
      layer.on({
        click: (e: any) => {
          if (window.appInstance) {
            window.appInstance.setIsZooming(true);
            window.appInstance.setSelectedDistrict(districtName);
            window.appInstance.setSelectedDistrictId(districtId);
            const map = e.target._map;
            if (map) {
              const bounds = e.target.getBounds();
              map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 11, duration: 0.8 });
              setTimeout(() => {
                window.appInstance.setIsZooming(false);
              }, 900);
            }
          }
        },
        mouseover: (e: any) => e.target.setStyle({ weight: 3, fillOpacity: 0.9 }),
        mouseout: (e: any) => e.target.setStyle(styleDistrict(feature)),
      });
    }
  };

  // Style for subdistricts (kecamatan)
  const styleSubdistrict = (feature: any) => {
    const props = feature.properties;
    const kecamatanName = props.kec_name || props.kecamatan || props.KECAMATAN || props.NAMA || props.nama || props.district || props.name || props.NAME;
    let hash = 0;
    if (kecamatanName) {
      for (let i = 0; i < kecamatanName.length; i++) {
        hash = ((hash << 5) - hash) + kecamatanName.charCodeAt(i);
        hash |= 0;
      }
    }
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A8', '#33FFF0', '#F3FF33', '#FF9933'];
    return {
      weight: 2,
      opacity: 1.0,
      color: '#000000',
      fillColor: colors[Math.abs(hash) % colors.length],
      fillOpacity: 0.7,
    };
  };

  // Event handler for subdistricts (kecamatan)
  const onEachSubdistrict = (feature: any, layer: any) => {
    const props = feature.properties;
    const kecamatanName = props.kec_name || props.kecamatan || props.KECAMATAN || props.NAMA || props.nama || props.district || props.name || props.NAME || props.village;
    if (kecamatanName) {
      layer.bindTooltip(kecamatanName, { sticky: true, className: 'custom-tooltip kecamatan-tooltip' });
      layer.on({
        click: (e: any) => {
          const map = e.target._map;
          if (map) {
            const bounds = e.target.getBounds();
            map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 13, duration: 0.5 });
          }
        },
        mouseover: (e: any) => e.target.setStyle({ weight: 4, color: '#FFFFFF', fillOpacity: 0.9 }),
        mouseout: (e: any) => e.target.setStyle(styleSubdistrict(feature)),
      });
    }
  };

  return (
    <>
      {selectedProvince && districtData && (
        <GeoJSON
          key={`districts-${selectedProvince}`}
          data={districtData}
          style={styleDistrict}
          onEachFeature={onEachDistrict}
        />
      )}
      {selectedDistrict && subdistrictData && (
        <GeoJSON
          key={`subdistricts-${selectedDistrict}`}
          data={subdistrictData}
          style={styleSubdistrict}
          onEachFeature={onEachSubdistrict}
        />
      )}
    </>
  );
};

const App: React.FC = () => {
  const mapRef = useRef<Map | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONData | null>(null);
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
          response = await fetch('/data/prov_37.geojson');
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
