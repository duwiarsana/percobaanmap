import json
import sys
import os

def filter_geojson_by_regency(regency_id, input_file, output_dir):
    """
    Filters a GeoJSON file to include only features for a specific regency.

    Args:
        regency_id (str): The ID of the regency to filter by (e.g., '5104' for Gianyar).
        input_file (str): Path to the large input GeoJSON file.
        output_dir (str): Directory to save the filtered GeoJSON file.
    """
    try:
        with open(input_file, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Input file not found at {input_file}")
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {input_file}. Is it a valid GeoJSON?")
        return

    if data.get('type') != 'FeatureCollection':
        print("Error: Input file is not a GeoJSON FeatureCollection.")
        return

    filtered_features = []
    for feature in data.get('features', []):
        # Assuming the district ID is in properties and starts with the regency ID.
        properties = feature.get('properties', {})
        # The correct key for the regency ID is 'kab_id'.
        kabupaten_id = properties.get('kab_id')
        
        # We compare the integer value of the regency ID.
        if kabupaten_id and int(kabupaten_id) == int(regency_id):
            filtered_features.append(feature)

    if not filtered_features:
        print(f"Warning: No features found for regency ID '{regency_id}'. Please check the ID and the property key in the GeoJSON.")
        return

    output_geojson = {
        'type': 'FeatureCollection',
        'features': filtered_features
    }

    output_filename = os.path.join(output_dir, f"{regency_id}_kecamatan.geojson")
    
    try:
        os.makedirs(output_dir, exist_ok=True)
        with open(output_filename, 'w') as f:
            json.dump(output_geojson, f)
        print(f"Successfully created {output_filename} with {len(filtered_features)} features.")
    except IOError as e:
        print(f"Error writing to file {output_filename}: {e}")

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python process_geojson.py <regency_id>")
        print("Example: python process_geojson.py 5104")
        sys.exit(1)

    regency_id_to_filter = sys.argv[1]
    large_geojson_file = 'kec.geojson'
    # The output will be placed where the React app can find it.
    output_directory = 'indonesia-map-viewer/public/data'

    filter_geojson_by_regency(regency_id_to_filter, large_geojson_file, output_directory)
