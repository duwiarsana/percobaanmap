import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import L from 'leaflet';

interface GeoJSONFeature {
  type: string;
  properties: {
    ID: number;
    Propinsi: string;
    [key: string]: any;
  };
  geometry: any;
}

interface GeoJSONData {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

// Component to handle map interactions and district layer
const MapController: React.FC<{
  selectedProvince: string | null;
  setSelectedProvince: (province: string | null) => void;
}> = ({ selectedProvince, setSelectedProvince }) => {
  const map = useMap();
  const [districtData, setDistrictData] = useState<GeoJSONData | null>(null);
  const [districtLoading, setDistrictLoading] = useState<boolean>(false);
  const [districtError, setDistrictError] = useState<string | null>(null);
  
  // Add click handler to map to reset province selection when clicking outside
  useEffect(() => {
    if (!map) return;
    
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      // Check if the click was on a district or province
      const clickedOnFeature = e.originalEvent.target && 
                              (e.originalEvent.target as HTMLElement).classList.contains('leaflet-interactive');
      
      // If not clicked on a feature, reset the selected province
      if (!clickedOnFeature) {
        setSelectedProvince(null);
      }
    };
    
    map.on('click', handleMapClick);
    
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, setSelectedProvince]);
  
  // Load district data when a province is selected
  useEffect(() => {
    if (!selectedProvince) return;
    
    const fetchDistrictData = async () => {
      try {
        setDistrictLoading(true);
        const response = await fetch('/data/kab 37.geojson');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Read the response as text first
        const text = await response.text();
        
        // Try to parse the text as JSON, handling potential format issues
        let data;
        try {
          // Check if the file starts with 'f{' and remove the 'f' if it does
          const cleanedText = text.startsWith('f{') ? text.substring(1) : text;
          data = JSON.parse(cleanedText);
          
          // Filter districts by selected province
          if (data.features && data.features.length > 0) {
            console.log('Filtering districts for province:', selectedProvince);
            data.features = data.features.filter((feature: any) => {
              const provinceName = feature.properties.prov_name || 
                                  feature.properties.Propinsi || 
                                  feature.properties.NAME || 
                                  feature.properties.name || 
                                  feature.properties.NAMA;
              return provinceName === selectedProvince;
            });
            console.log(`Found ${data.features.length} districts in ${selectedProvince}`);
          }
          
          setDistrictData(data);
        } catch (parseError) {
          console.error('Error parsing district JSON:', parseError);
          throw new Error('Failed to parse district GeoJSON data.');
        }
      } catch (err: any) {
        console.error('Error fetching district GeoJSON:', err);
        setDistrictError(err.message || 'Failed to load district data');
      } finally {
        setDistrictLoading(false);
      }
    };
    
    fetchDistrictData();
  }, [selectedProvince]);
  
  // Style for district features
  const styleDistrict = (feature: any) => {
    return {
      fillColor: '#4a4a4a', // Darker gray color
      weight: 0.8, // Slightly thicker lines
      opacity: 1,
      color: 'white',
      dashArray: '', // Solid lines, not dashed
      fillOpacity: 0.7,
      zIndex: 1000 // Ensure districts are always on top
    };
  };
  
  // Handle district feature interactions
  const onEachDistrict = (feature: any, layer: any) => {
    const districtName = feature.properties.kab_name || 
                        feature.properties.KAB_NAME || 
                        feature.properties.name || 
                        feature.properties.NAME || 
                        'Unknown District';
    
    // Add tooltip with district name - follow cursor and appear above it
    layer.bindTooltip(districtName, {
      permanent: false,
      direction: 'top',
      className: 'district-tooltip',
      sticky: true, // Makes tooltip follow the mouse
      offset: [0, -10] // Offset to position above cursor
    });
    
    // Add hover effect
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 1.2, // Slightly thicker hover line
          color: 'white',
          dashArray: '',
          fillOpacity: 0.9,
          zIndex: 1500 // Even higher z-index on hover
        });
        
        // Force this layer to the front
        if (!layer._map) return;
        layer.bringToFront();
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 0.8, // Slightly thicker lines
          color: 'white',
          dashArray: '', // Solid lines, not dashed
          fillOpacity: 0.7
        });
      }
    });
  };
  
  return (
    <>
      {districtData && selectedProvince && (
        <GeoJSON 
          key={`districts-${selectedProvince}`}
          data={districtData} 
          style={styleDistrict}
          onEachFeature={onEachDistrict}
          // zIndex handled in style function
          eventHandlers={{
            add: (e) => {
              // Force district layer to front when added to map
              const layer = e.target;
              if (layer && layer.bringToFront) {
                setTimeout(() => {
                  layer.bringToFront();
                }, 100);
              }
            }
          }}
        />
      )}
      {districtLoading && (
        <div className="district-loading">Loading district data...</div>
      )}
      {districtError && (
        <div className="district-error">Error loading districts: {districtError}</div>
      )}
    </>
  );
};

function App() {
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const fetchGeoJson = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/prov 37.geojson');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Read the response as text first
        const text = await response.text();
        
        // Try to parse the text as JSON, handling potential format issues
        let data;
        try {
          // Check if the file starts with 'f{' and remove the 'f' if it does
          const cleanedText = text.startsWith('f{') ? text.substring(1) : text;
          data = JSON.parse(cleanedText);
          
          // Debug: Log the first feature to see available properties
          if (data.features && data.features.length > 0) {
            console.log('First feature properties:', data.features[0].properties);
            
            // Check for province name property
            const firstFeature = data.features[0];
            const availableProps = Object.keys(firstFeature.properties);
            console.log('Available property names:', availableProps);
            
            // Log potential province name properties
            console.log('Province name candidates:',
              firstFeature.properties.prov_name,
              firstFeature.properties.Propinsi,
              firstFeature.properties.NAME,
              firstFeature.properties.name,
              firstFeature.properties.NAMA
            );
          }
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          throw new Error('Failed to parse GeoJSON data. The file may be corrupted or in an invalid format.');
        }
        
        setGeoJsonData(data);
      } catch (err: any) {
        console.error('Error fetching GeoJSON:', err);
        setError(err.message || 'Failed to load map data');
      } finally {
        setLoading(false);
      }
    };

    fetchGeoJson();
  }, []);

  // Function to get color based on province ID - using darker gray shades
  const getColor = (id: number) => {
    const colors = [
      '#9e9e9e', '#8d8d8d', '#7c7c7c', '#6b6b6b', '#5a5a5a', 
      '#494949', '#383838', '#4f4f4f', '#606060', '#717171', 
      '#828282', '#939393', '#a4a4a4', '#777777', '#666666',
      '#555555', '#444444', '#333333', '#525252', '#636363',
      '#747474', '#858585', '#969696', '#575757', '#686868',
      '#797979', '#8a8a8a', '#9b9b9b', '#6f6f6f', '#808080'
    ];
    return colors[id % colors.length];
  };

  // Style function for GeoJSON features
  const styleFeature = (feature: any) => {
    return {
      fillColor: getColor(feature.properties.ID || 0),
      weight: 0.8, // Slightly thicker lines
      opacity: 1,
      color: 'white',
      dashArray: '', // Solid lines, not dashed
      fillOpacity: 0.7,
      zIndex: 500 // Lower z-index than districts
    };
  };

  // Function to handle each feature
  const onEachFeature = (feature: any, layer: any) => {
    const provinceName = feature.properties.prov_name || 
                        feature.properties.Propinsi || 
                        feature.properties.NAME || 
                        feature.properties.name || 
                        feature.properties.NAMA || 
                        'Unknown Province';
    
    // Add tooltip with province name - only show on hover and follow cursor
    layer.bindTooltip(provinceName, {
      permanent: false,
      direction: 'top',
      className: 'province-tooltip',
      sticky: true, // Makes tooltip follow the mouse
      offset: [0, -10] // Offset to position above cursor
    });
    
    // No popup needed
    
    // Add hover effect and click behavior
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 1.2, // Slightly thicker hover line
          color: 'white',
          dashArray: '',
          fillOpacity: 0.9,
          zIndex: 600 // Higher than normal province but lower than districts
        });
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 0.8, // Slightly thicker lines
          color: 'white',
          dashArray: '', // Solid lines, not dashed
          fillOpacity: 0.7,
          zIndex: 500 // Lower z-index than districts
        });
        
        // Make sure districts stay on top if they exist
        if (selectedProvince) {
          const map = layer._map;
          if (map) {
            // Force all district layers to front
            map.eachLayer((mapLayer: any) => {
              if (mapLayer.feature && 
                  mapLayer.feature.properties && 
                  (mapLayer.feature.properties.kab_name || 
                   mapLayer.feature.properties.KAB_NAME)) {
                mapLayer.bringToFront();
              }
            });
          }
        }
      },
      click: (e: any) => {
        // Set the selected province and zoom to it
        setSelectedProvince(provinceName);
        const map = e.target._map;
        map.fitBounds(e.target.getBounds());
      }
    });
  };

  return (
    <div className="App">
      <div className="header">
        <h1>
          {selectedProvince ? 
            `Kabupaten di ${selectedProvince}` : 
            'Peta Provinsi Indonesia'}
        </h1>
      </div>
      
      <div className="map-container">
        {loading && <div className="loading">Loading map data...</div>}
        {error && <div className="error">Error: {error}</div>}
        
        {!loading && !error && (
          <MapContainer 
            center={[-2.5, 118]} 
            zoom={5} 
            style={{ height: '100%', width: '100%' }}
            ref={(map) => { mapRef.current = map; }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Only show all provinces when no province is selected */}
            {geoJsonData && !selectedProvince && (
              <GeoJSON 
                data={geoJsonData} 
                style={styleFeature}
                onEachFeature={onEachFeature}
              />
            )}
            
            {/* When a province is selected, only show that province */}
            {geoJsonData && selectedProvince && (
              <GeoJSON 
                key={`selected-${selectedProvince}`}
                data={{
                  type: "FeatureCollection",
                  features: geoJsonData.features.filter(feature => {
                    const provinceName = feature.properties.prov_name || 
                                        feature.properties.Propinsi || 
                                        feature.properties.NAME || 
                                        feature.properties.name || 
                                        feature.properties.NAMA || 
                                        '';
                    return provinceName === selectedProvince;
                  })
                } as GeoJSONData}
                style={styleFeature}
                onEachFeature={onEachFeature}
              />
            )}
            
            {/* Add the MapController component to handle districts */}
            {selectedProvince && (
              <MapController 
                selectedProvince={selectedProvince} 
                setSelectedProvince={setSelectedProvince} 
              />
            )}
          </MapContainer>
        )}
      </div>
      
      <div className="footer">
        <p>
          {selectedProvince ? 
            `Menampilkan kabupaten di ${selectedProvince}. Klik di luar untuk kembali ke peta Indonesia.` : 
            'Klik pada provinsi untuk melihat kabupaten. Arahkan kursor untuk melihat nama.'}
        </p>
      </div>
    </div>
  );
}

export default App;
