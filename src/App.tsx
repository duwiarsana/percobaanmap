import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import L, { Map } from 'leaflet';
import { getProvinceId, getProvinceName } from './utils/geojsonProps';
import { setAppBridge } from './appBridge';
import { GeoJSONData, GeoJSONFeature } from './types/geojson';
import MapController from './map/MapController';

// Centralized data file references
const PROVINCES_FILE = '/data/prov_37.geojson';

// Extend Window interface to include our app instance
declare global {
  interface Window {
    appInstance: any;
  }
}

// (Using GeoJSON types from existing modules; no local re-definitions here)

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
        const provinceFeature = geoJsonData.features.find((f: any) => getProvinceName(f.properties) === selectedProvince);
        
        if (provinceFeature) {
          const bounds = L.geoJSON(provinceFeature).getBounds();
          mapRef.current.flyToBounds(bounds, { padding: [50, 50], duration: 0.5 });
        }
      }
    }
  };

  // Style for provinces
  const styleFeature = (feature: any) => {
    const provinceName = getProvinceName(feature.properties);
    const isSelected = selectedProvince === provinceName;
    return {
      // Softer green palette for provinces
      fillColor: isSelected ? '#74c69d' : '#b7e4c7',
      weight: 0.8,
      opacity: 1,
      color: 'white',
      fillOpacity: isSelected ? 0.65 : 0.5,
    };
  };

  // Event handler for provinces
  const onEachFeature = (feature: GeoJSONFeature, layer: L.Layer) => {
    const provinceName = getProvinceName(feature.properties);
    const provinceId = getProvinceId(feature.properties);
    
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
        mouseover: (e) => e.target.setStyle({ weight: 1.2, fillOpacity: 0.7 }),
        mouseout: (e) => e.target.setStyle(styleFeature(feature)),
      });
    }
  };

  // Load province data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(PROVINCES_FILE);
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
      features: geoJsonData.features.filter((feature: any) => getProvinceName(feature.properties) === selectedProvince)
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
              // Match province selection palette but lighter and thinner
              fillColor: '#95d5b2',
              weight: 0.9,
              opacity: 1,
              color: 'white',
              fillOpacity: 0.35,
            })}
            onEachFeature={(feature, layer) => {
              // Only add tooltip, no click handler needed since we're already focused on this province
              const provinceName = getProvinceName(feature.properties);
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
          geoJsonData={geoJsonData}
        />
      </MapContainer>
    </div>
  );
};

export default App;
