export interface GeoJSONData {
  type: 'FeatureCollection';
  features: GeoJSON.Feature[];
}

export interface FeatureProperties {
  [key: string]: any;
  kec_name?: string;
  kecamatan?: string;
  district_code?: string;
  kec_id?: string;
  ID?: number;
  prov_name?: string;
  kab_name?: string;
}

export interface GeoJSONFeature extends GeoJSON.Feature {
  properties: FeatureProperties;
}

export interface GeoJSONFeatureCollection extends GeoJSON.FeatureCollection {
  features: GeoJSONFeature[];
}
