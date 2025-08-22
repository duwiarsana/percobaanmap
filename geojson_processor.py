#!/usr/bin/env python3
"""
GeoJSON Large File Processor
----------------------------
This script efficiently processes large GeoJSON files using streaming techniques
and provides a simple web interface to visualize the data.
"""

import json
import os
import geopandas as gpd
import pandas as pd
import shapely
from flask import Flask, render_template, jsonify, request, send_from_directory
import ijson
import argparse
from pathlib import Path
import logging
import sys

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    handlers=[logging.StreamHandler()])
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='static')

class GeoJSONProcessor:
    """Class to handle large GeoJSON files efficiently"""
    
    def __init__(self, file_path):
        """Initialize with the path to the GeoJSON file"""
        self.file_path = file_path
        self.simplified_file = None
        self.properties = {}
        self.feature_count = 0
        
    def validate_file(self):
        """Check if the file exists and appears to be GeoJSON"""
        if not os.path.exists(self.file_path):
            return False, f"File not found: {self.file_path}"
        
        # Check first few bytes to see if it looks like JSON
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                start = f.read(50)
                if not (start.strip().startswith('{') or start.strip().startswith('[')):
                    # Try to fix common issues
                    if start.strip().startswith('f{'):
                        return False, "File appears to be in an invalid format (starts with 'f{'). Will attempt to fix."
                    return False, f"File doesn't appear to be valid JSON: {start}"
        except UnicodeDecodeError:
            return False, "File encoding issue - not valid UTF-8"
        
        return True, "File appears valid"
    
    def fix_geojson(self):
        """Attempt to fix common GeoJSON formatting issues"""
        fixed_path = self.file_path + ".fixed"
        try:
            with open(self.file_path, 'r', encoding='utf-8', errors='ignore') as infile:
                content = infile.read()
                
                # Fix common issues
                if content.startswith('f{'):
                    content = content[1:]  # Remove the 'f' prefix
                
                # Try to parse as JSON to validate
                try:
                    json.loads(content)
                    logger.info("Successfully fixed and validated JSON")
                except json.JSONDecodeError as e:
                    logger.error(f"Could not fix JSON: {e}")
                    return None
                
                with open(fixed_path, 'w', encoding='utf-8') as outfile:
                    outfile.write(content)
                
                return fixed_path
        except Exception as e:
            logger.error(f"Error fixing GeoJSON: {e}")
            return None
    
    def stream_properties(self):
        """Stream through the file to extract properties without loading the whole file"""
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                # Use ijson to stream through the file
                features = ijson.items(f, 'features.item')
                
                for i, feature in enumerate(features):
                    if i == 0:  # Just get the first feature's properties as a sample
                        if 'properties' in feature:
                            self.properties = feature['properties']
                            break
        except Exception as e:
            logger.error(f"Error streaming properties: {e}")
            return False
        
        return True
    
    def count_features(self):
        """Count the number of features in the GeoJSON file"""
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                # Use ijson to stream through the file
                features = ijson.items(f, 'features.item')
                self.feature_count = sum(1 for _ in features)
                logger.info(f"Found {self.feature_count} features in the file")
        except Exception as e:
            logger.error(f"Error counting features: {e}")
            return False
        
        return True
    
    def simplify_geojson(self, tolerance=0.01, output_file=None):
        """
        Simplify the GeoJSON to reduce file size
        
        Args:
            tolerance: The tolerance for the simplification (higher = more simplification)
            output_file: Path to save the simplified file (if None, uses original name + .simplified)
        """
        if output_file is None:
            output_file = self.file_path + ".simplified"
        
        try:
            # Use geopandas for efficient processing
            logger.info(f"Loading GeoJSON into GeoPandas (this may take a while for large files)...")
            gdf = gpd.read_file(self.file_path)
            
            # Simplify the geometries
            logger.info(f"Simplifying geometries with tolerance {tolerance}...")
            gdf['geometry'] = gdf['geometry'].simplify(tolerance)
            
            # Save to file
            logger.info(f"Saving simplified GeoJSON to {output_file}...")
            gdf.to_file(output_file, driver='GeoJSON')
            
            self.simplified_file = output_file
            logger.info(f"Simplification complete. Original size: {os.path.getsize(self.file_path) / (1024*1024):.2f} MB, " +
                       f"Simplified size: {os.path.getsize(output_file) / (1024*1024):.2f} MB")
            
            return True
        except Exception as e:
            logger.error(f"Error simplifying GeoJSON: {e}")
            return False
    
    def get_feature_sample(self, n=5):
        """Get a sample of n features from the file"""
        samples = []
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                features = ijson.items(f, 'features.item')
                for i, feature in enumerate(features):
                    if i < n:
                        samples.append(feature)
                    else:
                        break
        except Exception as e:
            logger.error(f"Error getting feature sample: {e}")
        
        return samples
    
    def get_bounds(self):
        """Get the bounding box of the GeoJSON file"""
        try:
            gdf = gpd.read_file(self.file_path)
            bounds = gdf.total_bounds
            return {
                'west': bounds[0],
                'south': bounds[1],
                'east': bounds[2],
                'north': bounds[3]
            }
        except Exception as e:
            logger.error(f"Error getting bounds: {e}")
            return None


# Set up the Flask routes
@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/api/file-info')
def file_info():
    """Return information about the loaded GeoJSON file"""
    global processor
    
    if not processor:
        return jsonify({'error': 'No file loaded'})
    
    return jsonify({
        'file_path': processor.file_path,
        'feature_count': processor.feature_count,
        'properties_sample': processor.properties,
        'simplified_file': processor.simplified_file,
        'bounds': processor.get_bounds()
    })

@app.route('/api/features-sample')
def features_sample():
    """Return a sample of features from the file"""
    global processor
    
    if not processor:
        return jsonify({'error': 'No file loaded'})
    
    count = request.args.get('count', 5, type=int)
    samples = processor.get_feature_sample(count)
    
    return jsonify({
        'count': len(samples),
        'features': samples
    })

@app.route('/geojson/<path:filename>')
def serve_geojson(filename):
    """Serve the GeoJSON file"""
    directory = os.path.dirname(os.path.abspath(processor.file_path))
    return send_from_directory(directory, filename)

def create_html_template():
    """Create the HTML template for the web interface"""
    templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
    os.makedirs(templates_dir, exist_ok=True)
    
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GeoJSON Viewer</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
        }
        #container {
            display: flex;
            height: 100vh;
        }
        #sidebar {
            width: 300px;
            padding: 15px;
            overflow-y: auto;
            background-color: #f5f5f5;
            border-right: 1px solid #ddd;
        }
        #map {
            flex-grow: 1;
            height: 100%;
        }
        .info {
            padding: 6px 8px;
            font: 14px/16px Arial, Helvetica, sans-serif;
            background: white;
            background: rgba(255, 255, 255, 0.8);
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
            border-radius: 5px;
        }
        .info h4 {
            margin: 0 0 5px;
            color: #777;
        }
        .property-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .property-table th, .property-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .property-table th {
            background-color: #f2f2f2;
        }
    </style>
</head>
<body>
    <div id="container">
        <div id="sidebar">
            <h2>GeoJSON Viewer</h2>
            <div id="file-info">
                <h3>File Information</h3>
                <p id="file-path"></p>
                <p id="feature-count"></p>
                <p id="simplified-status"></p>
            </div>
            <div id="feature-info">
                <h3>Feature Information</h3>
                <div id="selected-feature"></div>
            </div>
        </div>
        <div id="map"></div>
    </div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        // Initialize the map
        const map = L.map('map').setView([-2.5, 118], 5);

        // Add OpenStreetMap base layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Control that shows info on hover
        let info = L.control();

        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info');
            this.update();
            return this._div;
        };

        info.update = function (props) {
            this._div.innerHTML = '<h4>Feature Information</h4>' +  
                (props ? Object.keys(props).map(key => `<b>${key}:</b> ${props[key]}`).join('<br>') : 'Hover over a feature');
        };

        info.addTo(map);

        // Function to get color based on feature ID
        function getColor(id) {
            const colors = [
                '#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', 
                '#ffd92f', '#e5c494', '#b3b3b3', '#8dd3c7', '#bebada', 
                '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', 
                '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f', '#ffffb3',
                '#1f78b4', '#33a02c', '#e31a1c', '#ff7f00', '#6a3d9a',
                '#b15928', '#a6cee3', '#b2df8a', '#fb9a99', '#fdbf6f',
                '#cab2d6', '#ffff99'
            ];
            return colors[id % colors.length];
        }

        // Load file information
        fetch('/api/file-info')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error(data.error);
                    return;
                }
                
                document.getElementById('file-path').textContent = `File: ${data.file_path.split('/').pop()}`;
                document.getElementById('feature-count').textContent = `Features: ${data.feature_count}`;
                
                if (data.simplified_file) {
                    document.getElementById('simplified-status').textContent = `Simplified version available`;
                }
                
                // Set map bounds if available
                if (data.bounds) {
                    map.fitBounds([
                        [data.bounds.south, data.bounds.west],
                        [data.bounds.north, data.bounds.east]
                    ]);
                }
                
                // Get the filename from the path
                const filename = data.file_path.split('/').pop();
                
                // Load the GeoJSON data (use simplified if available)
                const geoJsonUrl = data.simplified_file ? 
                    `/geojson/${data.simplified_file.split('/').pop()}` : 
                    `/geojson/${filename}`;
                
                // Load the GeoJSON data
                fetch(geoJsonUrl)
                    .then(response => response.json())
                    .then(geoData => {
                        // Add GeoJSON layer
                        const geoJsonLayer = L.geoJSON(geoData, {
                            style: function(feature) {
                                return {
                                    weight: 2,
                                    opacity: 1,
                                    color: 'white',
                                    dashArray: '3',
                                    fillOpacity: 0.7,
                                    fillColor: getColor(feature.properties.ID || Math.floor(Math.random() * 30))
                                };
                            },
                            onEachFeature: function(feature, layer) {
                                layer.on({
                                    mouseover: function(e) {
                                        const layer = e.target;
                                        layer.setStyle({
                                            weight: 3,
                                            color: '#666',
                                            dashArray: '',
                                            fillOpacity: 0.9
                                        });
                                        layer.bringToFront();
                                        info.update(feature.properties);
                                    },
                                    mouseout: function(e) {
                                        geoJsonLayer.resetStyle(e.target);
                                        info.update();
                                    },
                                    click: function(e) {
                                        map.fitBounds(e.target.getBounds());
                                        
                                        // Display feature properties in sidebar
                                        const props = feature.properties;
                                        let tableHtml = '<table class="property-table"><tr><th>Property</th><th>Value</th></tr>';
                                        
                                        for (const key in props) {
                                            tableHtml += `<tr><td>${key}</td><td>${props[key]}</td></tr>`;
                                        }
                                        
                                        tableHtml += '</table>';
                                        document.getElementById('selected-feature').innerHTML = tableHtml;
                                    }
                                });
                                
                                // Add tooltip with name if available
                                if (feature.properties) {
                                    const nameField = feature.properties.Propinsi || 
                                                     feature.properties.NAME || 
                                                     feature.properties.name ||
                                                     feature.properties.NAMA;
                                    
                                    if (nameField) {
                                        layer.bindTooltip(nameField, {
                                            permanent: false,
                                            direction: 'center',
                                            className: 'feature-tooltip'
                                        });
                                    }
                                }
                            }
                        }).addTo(map);
                    })
                    .catch(error => {
                        console.error('Error loading GeoJSON:', error);
                        alert('Failed to load GeoJSON data. See console for details.');
                    });
            })
            .catch(error => {
                console.error('Error loading file info:', error);
            });
    </script>
</body>
</html>
"""
    
    with open(os.path.join(templates_dir, 'index.html'), 'w') as f:
        f.write(html_content)

def main():
    """Main function to run the processor"""
    parser = argparse.ArgumentParser(description='Process large GeoJSON files')
    parser.add_argument('file', help='Path to the GeoJSON file')
    parser.add_argument('--simplify', type=float, default=0.01, 
                        help='Simplification tolerance (higher = more simplification)')
    parser.add_argument('--port', type=int, default=5000, help='Port for the web server')
    parser.add_argument('--fix', action='store_true', help='Attempt to fix common GeoJSON issues')
    
    args = parser.parse_args()
    
    global processor
    processor = GeoJSONProcessor(args.file)
    
    # Validate the file
    valid, message = processor.validate_file()
    if not valid:
        logger.warning(message)
        if args.fix or 'Will attempt to fix' in message:
            logger.info("Attempting to fix GeoJSON file...")
            fixed_file = processor.fix_geojson()
            if fixed_file:
                logger.info(f"Fixed file saved to: {fixed_file}")
                processor = GeoJSONProcessor(fixed_file)
            else:
                logger.error("Could not fix the file. Exiting.")
                sys.exit(1)
    
    # Stream through to get properties and count features
    logger.info("Analyzing GeoJSON file...")
    processor.stream_properties()
    processor.count_features()
    
    # Simplify if requested
    if args.simplify > 0:
        logger.info(f"Simplifying GeoJSON with tolerance {args.simplify}...")
        processor.simplify_geojson(args.simplify)
    
    # Create the HTML template
    create_html_template()
    
    # Start the web server
    logger.info(f"Starting web server on port {args.port}...")
    app.run(host='0.0.0.0', port=args.port, debug=False)

if __name__ == '__main__':
    processor = None
    main()
