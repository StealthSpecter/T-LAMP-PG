import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../services/api';

// Fix Leaflet default marker icon issue
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to control map view
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

const GISMapping = () => {
  const [lines, setLines] = useState([]);
  const [towers, setTowers] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);
  const [mapCenter, setMapCenter] = useState([25.5, 92.5]);
  const [mapZoom, setMapZoom] = useState(7);
  const [loading, setLoading] = useState(true);

  // Unique colors for each transmission line
  const lineColors = [
    '#FF1744', // Bright Red
    '#00E5FF', // Cyan
    '#FFD600', // Bright Yellow
    '#00E676', // Bright Green
    '#FF6D00', // Deep Orange
    '#D500F9', // Purple
    '#2979FF', // Blue
    '#FF4081', // Pink
    '#00BFA5', // Teal
    '#FFC400', // Amber
    '#FF3D00', // Red-Orange
    '#1DE9B6', // Turquoise
    '#E91E63', // Magenta
    '#76FF03', // Lime
    '#00B0FF', // Light Blue
  ];
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [linesData, towersData] = await Promise.all([
        api.getTransmissionLines({}),
        api.getTowerLocations({})
      ]);
      
      console.log('Lines fetched:', linesData);
      console.log('Towers fetched:', towersData);
      
      setLines(linesData);
      setTowers(towersData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      alert('Failed to load GIS data. Please check if transmission lines and towers have coordinates.');
    } finally {
      setLoading(false);
    }
  };

  // Group towers by transmission line
  const getLineWithTowers = (line) => {
    const lineTowers = towers
      .filter(tower => tower.transmission_line_id === line.id)
      .filter(tower => tower.latitude && tower.longitude) // Only towers with coordinates
      .sort((a, b) => a.tower_number - b.tower_number); // Sort by tower number
    
    return {
      ...line,
      towers: lineTowers
    };
  };

  const zoomToLine = (line) => {
    const lineWithTowers = getLineWithTowers(line);
    
    if (lineWithTowers.towers.length === 0) {
      alert('This line has no towers with coordinates yet. Please add towers in Tower Locations.');
      return;
    }

    const lats = lineWithTowers.towers.map(t => t.latitude);
    const lngs = lineWithTowers.towers.map(t => t.longitude);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    
    setMapCenter([centerLat, centerLng]);
    setMapZoom(10);
    setSelectedLine(line);
  };

  const getTowerColor = (condition) => {
    switch (condition) {
      case 'Good': return '#10B981';
      case 'Needs Inspection': return '#F59E0B';
      case 'Under Repair': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getVoltageColor = (voltage) => {
    switch (voltage) {
      case '800 KV': return '#9333EA'; // Purple
      case '400 KV': return '#EF4444'; // Red
      case '220 KV': return '#3B82F6'; // Blue
      case '132 KV': return '#10B981'; // Green
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading GIS Map...</p>
        </div>
      </div>
    );
  }

  // Filter lines that have at least 2 towers with coordinates
  const displayableLines = lines
    .map(line => getLineWithTowers(line))
    .filter(line => line.towers.length >= 2);

  if (displayableLines.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg shadow-xl p-6">
          <h1 className="text-3xl font-bold flex items-center">
            <span className="mr-3">🗺️</span>
            GIS TRANSMISSION NETWORK MAP
          </h1>
          <p className="text-sm opacity-90">
            Geographic visualization of NER transmission infrastructure
          </p>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-yellow-800">No GIS Data Available</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p className="mb-2">To display the GIS map, you need to:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Add transmission lines in <strong>Line Details</strong> section</li>
                  <li>Add tower locations with <strong>latitude and longitude coordinates</strong> in <strong>Tower Locations</strong> section</li>
                  <li>Each transmission line needs at least 2 towers to display on the map</li>
                </ol>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.href = '/tower-locations'}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded font-semibold transition-all"
                >
                  Go to Tower Locations →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg shadow-xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <span className="mr-3">🗺️</span>
              GIS TRANSMISSION NETWORK MAP
            </h1>
            <p className="text-sm opacity-90">
              Geographic visualization of NER transmission infrastructure
            </p>
          </div>
          <button
            onClick={fetchData}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Lines</div>
          <div className="text-3xl font-bold text-blue-600">{displayableLines.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Towers</div>
          <div className="text-3xl font-bold text-green-600">
            {displayableLines.reduce((sum, line) => sum + line.towers.length, 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Length</div>
          <div className="text-3xl font-bold text-purple-600">
            {displayableLines.reduce((sum, line) => sum + (line.total_length_km || 0), 0).toFixed(2)} km
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">States Covered</div>
          <div className="text-3xl font-bold text-orange-600">
            {new Set(displayableLines.map(line => line.state_name)).size}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-bold text-gray-800 mb-3">Transmission Line Routes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {displayableLines.map((line, index) => (
            <div key={line.id} className="flex items-center space-x-2">
              <div 
                className="w-8 h-2 rounded" 
                style={{ backgroundColor: lineColors[index % lineColors.length] }}
              ></div>
              <span className="text-xs font-medium">{line.name} ({line.voltage})</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-3">
          💡 <strong>Tip:</strong> Each transmission line has a unique color. Zoom in to see tower locations as dots.
        </p>
      </div>

      {/* Line List */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-bold text-gray-800 mb-3">Quick Navigation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayableLines.map((line, index) => (
            <button
              key={line.id}
              onClick={() => zoomToLine(line)}
              className={`text-left p-3 rounded border-2 transition-all hover:shadow-md ${
                selectedLine?.id === line.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-2">
                <div
                  className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: lineColors[index % lineColors.length] }}
                ></div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{line.name}</div>
                  <div className="text-xs text-gray-600">
                    {line.state_name} • {line.voltage}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {line.towers.length} towers • {(line.total_length_km || 0).toFixed(2)} km
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <MapContainer 
  center={mapCenter} 
  zoom={mapZoom} 
  style={{ height: '700px', width: '100%' }}
  scrollWheelZoom={true}
>
  <ChangeView center={mapCenter} zoom={mapZoom} />
          
           {/* HYBRID: Satellite with street labels */}
<TileLayer
  attribution='Tiles &copy; Esri'
  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  maxZoom={19}
/>
<TileLayer
  attribution='&copy; OpenStreetMap contributors'
  url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
/>
          

  {/* Draw transmission lines and towers */}
  {displayableLines.map((line, index) => {
    const color = lineColors[index % lineColors.length];
    const positions = line.towers.map(t => [t.latitude, t.longitude]);

    return (
      <React.Fragment key={line.id}>
        {/* BLACK BORDER */}
        <Polyline
          positions={positions}
          pathOptions={{
            color: '#000000',
            weight: 10,
            opacity: 0.8,
          }}
        />
        
        {/* COLORED LINE */}
        <Polyline
          positions={positions}
          pathOptions={{
            color: color,
            weight: 6,
            opacity: 1,
          }}
        >
          <Popup>
            <div className="p-3">
              <h3 className="font-bold text-lg mb-3" style={{ color: color }}>
                {line.name}
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Voltage:</strong> {line.voltage_level}</p>
                <p><strong>State:</strong> {line.state_name}</p>
                <p><strong>Length:</strong> {(line.total_length_km || 0).toFixed(2)} km</p>
                <p><strong>Towers:</strong> {line.towers.length}</p>
              </div>
            </div>
          </Popup>
        </Polyline>

        {/* Tower Dots */}
        {line.towers.map((towerItem, towerIndex) => (
          <CircleMarker
            key={`${line.id}-tower-${towerIndex}`}
            center={[towerItem.latitude, towerItem.longitude]}
            radius={8}
            pathOptions={{
              color: color,
              weight: 2,
              fillColor: color,
              fillOpacity: 0.9
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-base mb-2">🗼 Tower #{towerItem.tower_number}</h3>
                
                <div className="space-y-1 text-sm">
                  <p><strong>Line:</strong> {towerItem.line_name || line.name}</p>
                  
                  <p><strong>Voltage:</strong>{' '}
                    <span className={`ml-1 px-2 py-0.5 rounded text-xs font-bold ${
                      towerItem.voltage_level === '800 KV' ? 'bg-purple-100 text-purple-800' :
                      towerItem.voltage_level === '400 KV' ? 'bg-red-100 text-red-800' :
                      towerItem.voltage_level === '220 KV' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {towerItem.voltage_level}
                    </span>
                  </p>
                  
                  <p><strong>Type:</strong> {towerItem.tower_type || 'N/A'}</p>
                  <p><strong>Height:</strong> {towerItem.height_meters ? `${towerItem.height_meters} m` : 'N/A'}</p>
                  <p><strong>Condition:</strong>{' '}
                    <span style={{ 
                      backgroundColor: getTowerColor(towerItem.condition) + '20',
                      color: getTowerColor(towerItem.condition),
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      {towerItem.condition}
                    </span>
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    <strong>GPS:</strong> {towerItem.latitude.toFixed(6)}°N, {towerItem.longitude.toFixed(6)}°E
                  </p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </React.Fragment>
    );
  })}
</MapContainer>

      {/* Instructions */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h4 className="font-bold text-blue-900 mb-2">🎯 How to Use the Map</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li><strong>Each colored thick line</strong> represents a transmission line from your database</li>
          <li><strong>Zoom in</strong> (scroll or use +/- buttons) to see individual tower locations</li>
          <li><strong>Click on lines or towers</strong> for detailed information</li>
          <li><strong>Click navigation buttons</strong> above to zoom to specific routes</li>
          <li><strong>Add new lines</strong> in Line Details and towers in Tower Locations - they'll appear here automatically!</li>
          <li><strong>Click Refresh Data</strong> button to update the map after adding new data</li>
        </ul>
      </div>
    </div>
  );
};

export default GISMapping;

          
         
          