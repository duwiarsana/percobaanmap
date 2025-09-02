import React, { useState, useEffect, useRef, Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import { GeoJSONData } from '../types/geojson';
import { loadSubdistrictData as loadSubdistrictDataGeneric, createEmptyGeoJSON, LoadResult } from '../data-loader';
import { findDistrictConfig, DATA_CONFIG } from '../data-config';
import { createDistrictStyle, subdistrictStyle } from './styles';
import { getDistrictId, getDistrictName, getProvinceId, getProvinceName } from '../utils/geojsonProps';
import { createOnEachDistrict, createOnEachSubdistrict } from './handlers';
import { setAppBridge, getAppBridge } from '../appBridge';

const MapController: React.FC<{
  selectedProvince: string | null;
  setSelectedProvince: Dispatch<SetStateAction<string | null>>;
  selectedDistrict: string | null;
  setSelectedDistrict: Dispatch<SetStateAction<string | null>>;
  selectedDistrictId: string | number | null;
  setSelectedDistrictId: Dispatch<SetStateAction<string | number | null>>;
  isZooming: boolean;
  setIsZooming: Dispatch<SetStateAction<boolean>>;
  geoJsonData: GeoJSONData | null;
}> = ({ 
  selectedProvince, 
  setSelectedProvince, 
  selectedDistrict, 
  setSelectedDistrict,
  selectedDistrictId,
  setSelectedDistrictId,
  isZooming,
  setIsZooming,
  geoJsonData,
}) => {
  // Map reference used for zooming and panning
  // Currently not used but kept for future functionality
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const map = useMap();
  const [districtData, setDistrictData] = useState<GeoJSONData | null>(null);
  const [subdistrictData, setSubdistrictData] = useState<GeoJSONData | null>(null);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | number | null>(null);

  // Determine the province ID when a province is selected using already-loaded geoJsonData
  useEffect(() => {
    if (selectedProvince) {
      // Clear any previously selected district context to avoid showing subdistricts from prior province
      setSelectedDistrict(null);
      setSelectedDistrictId(null);

      if (geoJsonData?.features?.length) {
        const selectedFeature = (geoJsonData.features as any[]).find((f) => getProvinceName(f.properties) === selectedProvince);
        const provId = selectedFeature ? getProvinceId(selectedFeature.properties) : null;
        if (provId) {
          setSelectedProvinceId(provId);
          console.log(`Found province ID: ${provId} for province: ${selectedProvince}`);
        }
      }
    } else {
      setSelectedProvinceId(null);
      setDistrictData(null);
      setSubdistrictData(null);
    }
  }, [selectedProvince, geoJsonData, setSelectedDistrict, setSelectedDistrictId]);

  // Load district data when province ID is determined
  useEffect(() => {
    if (selectedProvinceId) {
      const fetchDistrictData = async () => {
        setSubdistrictData(null);
        
        if (!isZooming) {
          try {
            // Choose dataset by province using unified districts file. We'll filter features by province digits.
            const selProvDigits = selectedProvinceId?.toString().match(/\d+/)?.[0];
            const provCfg = selProvDigits ? DATA_CONFIG[selProvDigits] : undefined;
            const districtUrl = provCfg?.districtsFile || '/data/kab_37.geojson';

            const response = await fetch(districtUrl);
            if (!response.ok) throw new Error(`Failed to fetch district data from ${districtUrl}`);

            const data = await response.json();
            
            // Filter districts by province: try to derive province from 4-digit regency code (first two digits)
            const features = (data.features as any[])
              .filter((feature: any) => {
                const props = feature.properties || {};
                const code = getDistrictId(props); // e.g., '3510'
                const codeStr = typeof code === 'number' ? code.toString() : (code || '');
                const codeProv = codeStr.match(/^(\d{2})/ )?.[1];
                if (codeProv && selProvDigits && codeProv === selProvDigits) return true;
                // Fallbacks:
                const name = getDistrictName(props);
                const cfg = name ? findDistrictConfig(name) : undefined;
                if (cfg?.id && selProvDigits && cfg.id.toString().startsWith(selProvDigits)) return true;
                const provinceId = props.prov_id || props.provinsi_id || props.ID_PROV || props.PROVINSI || props.province_code;
                const featProvDigits = provinceId?.toString().match(/\d+/)?.[0];
                return featProvDigits && selProvDigits && featProvDigits === selProvDigits;
              })
              .map((feature: any) => {
                const props = feature.properties || {};
                const name = getDistrictName(props);
                const cfg = name ? findDistrictConfig(name) : undefined;
                const code = cfg?.id ?? getDistrictId(props);
                const regencyCode = typeof code === 'number' ? code.toString() : (code || undefined);
                const provinceCode = regencyCode?.slice(0, 2);
                return regencyCode ? {
                  ...feature,
                  properties: {
                    ...props,
                    regency_code: regencyCode,
                    ...(provinceCode ? { province_code: provinceCode } : {}),
                  }
                } : feature;
              });
            const filteredData: GeoJSONData = { type: 'FeatureCollection', features } as GeoJSONData;
            
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
      setSelectedDistrict(null);
      setSelectedDistrictId(null);
      setDistrictData(null);
      setSubdistrictData(null);
    }
  }, [selectedProvinceId, isZooming, setSelectedDistrict, setSelectedDistrictId]);

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
  
  // Load subdistrict data for any selected district - Refactored to use data-driven approach
  const loadSubdistrictData = useCallback(async (districtId: string | number) => {
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
        setSubdistrictData(result.data as GeoJSONData);

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
  }, [selectedDistrict]);
  
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
  }, [selectedDistrictId, isZooming, loadSubdistrictData]);

  // Expose loadSubdistrictData via appBridge so handlers can call it
  useEffect(() => {
    const current = getAppBridge() || {};
    setAppBridge({ ...current, loadSubdistrictData });
    return () => {
      const b = getAppBridge() || {} as any;
      const { loadSubdistrictData: _omit, ...rest } = b;
      setAppBridge(rest);
    };
  }, [loadSubdistrictData]);

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

export default MapController;
