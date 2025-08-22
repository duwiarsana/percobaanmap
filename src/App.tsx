import React, { useState, useEffect, useRef, Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import L, { Map } from 'leaflet';
import { loadSubdistrictData as loadSubdistrictDataGeneric, createEmptyGeoJSON, LoadResult } from './data-loader';
import { findDistrictConfig } from './data-config';
import { createDistrictStyle, subdistrictStyle } from './map/styles';
import { getDistrictId, getDistrictName } from './utils/geojsonProps';
import { createOnEachDistrict, createOnEachSubdistrict } from './map/handlers';
import { setAppBridge, getAppBridge } from './appBridge';

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
  
  // Attach loadSubdistrictData into the appBridge for handlers to call
  useEffect(() => {
    const current = getAppBridge() || {};
    setAppBridge({ ...current, loadSubdistrictData });
    return () => {
      const b = getAppBridge() || {};
      // remove only loadSubdistrictData while keeping others
      const { loadSubdistrictData: _omit, ...rest } = b as any;
      setAppBridge(rest);
    };
  }, []);

  // First, determine the province ID when a province is selected
  useEffect(() => {
    if (selectedProvince) {
      // Clear any previously selected district context to avoid showing subdistricts from prior province
      setSelectedDistrict(null);
      setSelectedDistrictId(null);
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
            // Choose dataset by province (Bali = 51). Use unified districts file to avoid including subdistrict geometries.
            const selProvDigits = selectedProvinceId?.toString().match(/\d+/)?.[0];
            const districtUrl = '/data/kab_37.geojson';

            const response = await fetch(districtUrl);
            if (!response.ok) throw new Error(`Failed to fetch district data from ${districtUrl}`);

            const data = await response.json();
            
            // Filter districts by province ID. For Bali (51), derive province via regency 4-digit code.
            let filteredData: GeoJSONData;
            if (selProvDigits === '51') {
              const features = (data.features as any[])
                .filter((feature: any) => {
                  const props = feature.properties || {};
                  const code = getDistrictId(props); // e.g., '5103'
                  const codeStr = typeof code === 'number' ? code.toString() : (code || '');
                  if (codeStr.startsWith('51')) return true;
                  // Fallback: match by district name via config
                  const name = getDistrictName(props);
                  const cfg = name ? findDistrictConfig(name) : undefined;
                  return !!cfg?.id && cfg.id.toString().startsWith('51');
                })
                .map((feature: any) => {
                  const props = feature.properties || {};
                  const name = getDistrictName(props);
                  const cfg = name ? findDistrictConfig(name) : undefined;
                  const code = cfg?.id ?? getDistrictId(props);
                  const regencyCode = typeof code === 'number' ? code.toString() : (code || undefined);
                  return regencyCode ? {
                    ...feature,
                    properties: {
                      ...props,
                      regency_code: regencyCode,
                      province_code: '51',
                    }
                  } : feature;
                });
              filteredData = { type: 'FeatureCollection', features } as GeoJSONData;
            } else {
              filteredData = {
                type: 'FeatureCollection',
                features: data.features.filter((feature: any) => {
                  const provinceId = feature.properties.prov_id || 
                                    feature.properties.provinsi_id || 
                                    feature.properties.ID_PROV || 
                                    feature.properties.PROVINSI ||
                                    feature.properties.province_code; // e.g., 'idXX'
                  const featProvDigits = provinceId?.toString().match(/\d+/)?.[0];
                  const selProvDigitsInner = selectedProvinceId?.toString().match(/\d+/)?.[0];
                  return featProvDigits && selProvDigitsInner && featProvDigits === selProvDigitsInner;
                })
              };
            }
            
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
      
      // Filter to only show the selected district by ID (normalize with same logic as handlers)
      const filteredData: GeoJSONData = {
        type: "FeatureCollection",
        features: districtData.features.filter((feature: any) => {
          const props = feature.properties;
          // Normalize to 4-digit regency code
          const extracted = getDistrictId(props);
          const normId = typeof extracted === 'number' ? extracted.toString() : (extracted?.toString().match(/\d+/)?.join('') || '');
          const isSelected = !!normId && normId === selectedDistrictId.toString();
          
          if (isSelected) {
            console.log(`Found matching district for ID ${selectedDistrictId}`);
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
  
    // Prefer a stable 4-digit ID from config by selectedDistrict name
    let preferredId: string | number | undefined;
    try {
      if (selectedDistrict) {
        const cfgByName = findDistrictConfig(selectedDistrict);
        if (cfgByName?.id) preferredId = cfgByName.id; // e.g., '5103'
      }
    } catch {}

    // Fallback: normalize from the provided districtId
    const fallbackNormalized: string | number = typeof districtId === 'number'
      ? districtId
      : (districtId.toString().match(/\d+/)?.join('') || districtId);

    const normalizedId: string | number = preferredId ?? fallbackNormalized;
    
    try {
      // Use the generic data loader with normalized ID
      const result: LoadResult = await loadSubdistrictDataGeneric(normalizedId);

      if (result.success && result.data) {
        setSubdistrictData(result.data);

        // Log success with meaningful information
        const districtConfig = findDistrictConfig(normalizedId);
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

  // Use extracted style/handler factories to keep logic identical and improve structure
  const styleDistrict = useMemo(() => createDistrictStyle(selectedDistrict), [selectedDistrict]);
  const styleSubdistrict = useCallback(subdistrictStyle, []);
  const onEachDistrict = useMemo(() => createOnEachDistrict(styleDistrict), [styleDistrict]);
  const onEachSubdistrict = useMemo(() => createOnEachSubdistrict(styleSubdistrict), [styleSubdistrict]);

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
          key={`subdistricts-${selectedDistrictId}`}
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
  
  // Expose state setters through appBridge for handlers to access
  useEffect(() => {
    setAppBridge({
      setIsZooming: (value: boolean) => setIsZooming(value),
      setSelectedDistrict: (value: string | null) => setSelectedDistrict(value),
      setSelectedDistrictId: (value: string | number | null) => setSelectedDistrictId(value),
    });
    return () => {
      // Clear the bridge on unmount
      setAppBridge({});
    };
  }, [setIsZooming, setSelectedDistrict, setSelectedDistrictId]);

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
        const response = await fetch('/data/prov_37.geojson');
        if (!response.ok) throw new Error('Failed to fetch province data');

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

  // Memoize the selected province FeatureCollection to avoid recomputation on rerenders
  const selectedProvinceCollection = useMemo(() => {
    if (!geoJsonData || !selectedProvince) return null;
    return {
      type: "FeatureCollection",
      features: geoJsonData.features.filter((feature: GeoJSONFeature) => {
        const name = feature.properties.prov_name || 
                    feature.properties.Propinsi || 
                    feature.properties.PROVINSI || 
                    feature.properties.provinsi || 
                    feature.properties.NAMA;
        return name === selectedProvince;
      })
    } as GeoJSONData;
  }, [geoJsonData, selectedProvince]);

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
        {selectedProvinceCollection && (
          <GeoJSON 
            data={selectedProvinceCollection}
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
