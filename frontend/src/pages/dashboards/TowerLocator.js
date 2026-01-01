import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const TowerLocator = () => {
  const [towers, setTowers] = useState([]);
  const [transmissionLines, setTransmissionLines] = useState([]);
  const [selectedLine, setSelectedLine] = useState('');
  const [searchTower, setSearchTower] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTransmissionLines();
  }, []);

  useEffect(() => {
    if (selectedLine) {
      fetchTowers();
    }
  }, [selectedLine]);

  const fetchTransmissionLines = async () => {
    try {
      const lines = await api.getTransmissionLineIds();
      setTransmissionLines(lines);
    } catch (err) {
      console.error('Failed to fetch lines:', err);
    }
  };

  const fetchTowers = async () => {
    try {
      setLoading(true);
      const data = await api.getTowerLocations({ line_id: selectedLine });
      setTowers(data);
    } catch (err) {
      console.error('Failed to fetch towers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTowers = towers.filter(tower =>
    searchTower ? tower.tower_number.toString().includes(searchTower) : true
  );

  const calculateDistance = (index) => {
    if (index === 0) return 0;
    // This is a simplified calculation - would need actual span data
    return index * 250; // Average 250m per span
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-pink-600 to-red-600 text-white rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold">TL DISTANCE TOWER LOCATOR</h1>
        <p className="text-sm opacity-90">Locate towers and calculate distances along transmission lines</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name of Line</label>
            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">-- Select Name of the Line --</option>
              {transmissionLines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Tower Number</label>
            <input
              type="text"
              value={searchTower}
              onChange={(e) => setSearchTower(e.target.value)}
              placeholder="Enter tower number..."
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Tower Data Table */}
      {loading ? (
        <div className="text-center p-8">Loading towers...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Tower Locations
            {selectedLine && ` - ${transmissionLines.find(l => l.id === parseInt(selectedLine))?.name}`}
          </h2>
          
          {filteredTowers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {selectedLine ? 'No towers found for this line' : 'Please select a transmission line'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SI</th>
                      <th>Name Of Line</th>
                      <th>Line Length (mtr)</th>
                      <th>Tower No</th>
                      <th>Voltage Level</th>
                      <th>Forward Span</th>
                      <th>Latitude</th>
                      <th>Longitude</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTowers.map((tower, index) => (
                      <tr key={tower.id}>
                        <td>{index + 1}</td>
                        <td className="font-semibold">{tower.line_name}</td>
                        <td className="text-right">{calculateDistance(index)}</td>
                        <td className="text-center font-bold text-blue-600">{tower.tower_number}</td>
                        <td className="text-center">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            tower.voltage_level === '400 KV' ? 'bg-red-100 text-red-800' :
                            tower.voltage_level === '220 KV' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {tower.voltage_level}
                          </span>
                        </td>
                        <td className="text-right">{index < filteredTowers.length - 1 ? '250' : '-'}</td>
                        <td className="text-right font-mono text-sm">{tower.latitude.toFixed(6)}</td>
                        <td className="text-right font-mono text-sm">{tower.longitude.toFixed(6)}</td>
                        <td>
                          <button
                            onClick={() => window.open(`https://maps.google.com/?q=${tower.latitude},${tower.longitude}`, '_blank')}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View on Map
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-4 p-4 bg-blue-50 rounded">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Towers:</span>
                    <span className="ml-2 font-bold text-blue-600">{filteredTowers.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Estimated Line Length:</span>
                    <span className="ml-2 font-bold text-blue-600">
                    {filteredTowers && filteredTowers.length > 0
                      ? ((filteredTowers.length - 1) * 250 / 1000).toFixed(2)
                      : '0.00'
                    } km
                  </span>

                  </div>
                  <div>
                    <span className="text-gray-600">Foundation Type:</span>
                    <span className="ml-2 font-bold text-blue-600">
                      {filteredTowers[0]?.foundation_type || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TowerLocator;
