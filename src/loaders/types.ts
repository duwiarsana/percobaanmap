// Common types for loader functions
export interface GeoJSONFeature {
  type: "Feature";
  properties: {
    ID?: number;
    prov_name?: string;
    kab_name?: string;
    kec_name?: string;
    [key: string]: any;
  };
  geometry: any;
}

export interface GeoJSONData {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export type SetSubdistrictDataFunction = (data: GeoJSONData | null) => void;
