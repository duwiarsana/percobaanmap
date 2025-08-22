#!/usr/bin/env python3
import json
import os
import sys
from pathlib import Path

def fix_geojson(input_file, output_file):
    """
    Try to fix a broken GeoJSON file by reading it as text and fixing common issues.
    
    Args:
        input_file: Path to the input GeoJSON file
        output_file: Path to save the fixed GeoJSON file
    """
    print(f"Attempting to fix GeoJSON file: {input_file}")
    
    try:
        # Read the file as binary first to check for encoding issues
        with open(input_file, 'rb') as f:
            content_bytes = f.read()
        
        # Try different encodings
        encodings = ['utf-8', 'latin-1', 'cp1252']
        content = None
        
        for encoding in encodings:
            try:
                content = content_bytes.decode(encoding)
                print(f"Successfully decoded with {encoding} encoding")
                break
            except UnicodeDecodeError:
                continue
        
        if content is None:
            print("Error: Could not decode the file with any known encoding")
            return False
        
        # Try to fix common JSON issues
        # 1. Remove any BOM characters at the start
        if content.startswith('\ufeff'):
            content = content[1:]
        
        # 2. Replace any single quotes with double quotes
        content = content.replace("'", '"')
        
        # 3. Look for the start of actual JSON content
        json_start = content.find('{')
        if json_start > 0:
            print(f"Found JSON start at position {json_start}, trimming prefix")
            content = content[json_start:]
        
        # 4. Try to parse the JSON to validate it
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

def process_file(input_file, output_dir):
    """
    Process a single GeoJSON file.
    
    Args:
        input_file: Path to the input GeoJSON file
        output_dir: Directory to save fixed file
    """
    input_path = Path(input_file)
    output_path = Path(output_dir)
    
    # Create output directory if it doesn't exist
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Create output file path
    output_file = output_path / input_path.name
    
    print(f"\nProcessing: {input_file}")
    
    # Try to fix the GeoJSON
    if fix_geojson(input_file, output_file):
        print(f"Successfully fixed and saved to {output_file}")
    else:
        print(f"Failed to fix {input_file}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python fix_geojson.py <input_file> <output_directory>")
        print("Example: python fix_geojson.py ./raw_geojson/file.geojson ./fixed_geojson")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    
    process_file(input_file, output_dir)
