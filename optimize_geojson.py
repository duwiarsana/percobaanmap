#!/usr/bin/env python3
import json
import os
import sys
from pathlib import Path

def simplify_geojson(input_file, output_file, simplification_factor=0.01):
    """
    Simplify a GeoJSON file by reducing the number of points in polygons.
    This makes the file smaller and faster to load.
    
    Args:
        input_file: Path to the input GeoJSON file
        output_file: Path to save the optimized GeoJSON file
        simplification_factor: How much to simplify (0.01 = 1% of original points)
    """
    try:
        # Try to import shapely for polygon simplification
        from shapely.geometry import shape, mapping
        from shapely.geometry.polygon import Polygon
        from shapely.geometry.multipolygon import MultiPolygon
    except ImportError:
        print("Error: This script requires the shapely library.")
        print("Please install it with: pip install shapely")
        sys.exit(1)
    
    print(f"Reading GeoJSON from {input_file}...")
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: The file {input_file} contains invalid JSON.")
        print(f"JSON error: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file: {str(e)}")
        sys.exit(1)
    
    print("Simplifying geometries...")
    
    # Process each feature
    for feature in data['features']:
        geom = shape(feature['geometry'])
        
        # Simplify the geometry
        if isinstance(geom, (Polygon, MultiPolygon)):
            simplified = geom.simplify(simplification_factor, preserve_topology=True)
            feature['geometry'] = mapping(simplified)
    
    # Save the optimized GeoJSON
    print(f"Saving optimized GeoJSON to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f)
    
    original_size = os.path.getsize(input_file) / 1024
    optimized_size = os.path.getsize(output_file) / 1024
    reduction = (1 - (optimized_size / original_size)) * 100
    
    print(f"Optimization complete!")
    print(f"Original size: {original_size:.2f} KB")
    print(f"Optimized size: {optimized_size:.2f} KB")
    print(f"Size reduction: {reduction:.2f}%")

def fix_geojson(input_file, output_file):
    """
    Try to fix a broken GeoJSON file by reading it as text and fixing common issues.
    
    Args:
        input_file: Path to the input GeoJSON file
        output_file: Path to save the fixed GeoJSON file
    """
    print(f"Attempting to fix GeoJSON file: {input_file}")
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Try to fix common JSON issues
        # 1. Remove any BOM characters at the start
        if content.startswith('\ufeff'):
            content = content[1:]
        
        # 2. Replace any single quotes with double quotes
        content = content.replace("'", '"')
        
        # 3. Try to parse the JSON to validate it
        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            print(f"Error: Could not fix JSON. Error at position {e.pos}: {e.msg}")
            return False
        
        # Save the fixed JSON
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f)
        
        print(f"Fixed GeoJSON saved to {output_file}")
        return True
    
    except Exception as e:
        print(f"Error fixing GeoJSON: {str(e)}")
        return False

def process_directory(input_dir, output_dir, simplification_factor=0.01):
    """
    Process all GeoJSON files in a directory and its subdirectories.
    
    Args:
        input_dir: Directory containing GeoJSON files
        output_dir: Directory to save optimized files
        simplification_factor: How much to simplify geometries
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    
    # Create output directory if it doesn't exist
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Find all GeoJSON files
    geojson_files = list(input_path.glob('**/*.geojson'))
    print(f"Found {len(geojson_files)} GeoJSON files to process.")
    
    for input_file in geojson_files:
        # Create relative path structure in output directory
        rel_path = input_file.relative_to(input_path)
        output_file = output_path / rel_path
        
        # Create parent directories if needed
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        print(f"\nProcessing: {input_file}")
        
        # First try to fix the GeoJSON if needed
        fixed_file = output_file.with_name(f"{output_file.stem}_fixed.geojson")
        if fix_geojson(input_file, fixed_file):
            # If fixing succeeded, optimize the fixed file
            simplify_geojson(fixed_file, output_file, simplification_factor)
            # Remove the temporary fixed file
            os.remove(fixed_file)
        else:
            print(f"Skipping {input_file} due to JSON errors.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python optimize_geojson.py <input_directory> <output_directory> [simplification_factor]")
        print("Example: python optimize_geojson.py ./raw_geojson ./optimized_geojson 0.01")
        sys.exit(1)
    
    input_dir = sys.argv[1]
    output_dir = sys.argv[2]
    
    simplification_factor = 0.01  # Default value
    if len(sys.argv) > 3:
        try:
            simplification_factor = float(sys.argv[3])
        except ValueError:
            print("Error: simplification_factor must be a number.")
            sys.exit(1)
    
    process_directory(input_dir, output_dir, simplification_factor)
