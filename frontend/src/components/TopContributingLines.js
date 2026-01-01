import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const TopContributingLines = () => {
  const [topLines, setTopLines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [linesData, incidentsData] = await Promise.all([
        api.getTransmissionLines({}),
        api.getTrippingIncidents({})
      ]);

      // Count incidents per line
      const lineCounts = {};
      const lineFaultTypes = {};

      incidentsData.forEach(inc => {
        const lineId = inc.transmission_line_id;
        if (!lineCounts[lineId]) {
          lineCounts[lineId] = 0;
          lineFaultTypes[lineId] = {
            Lightning: 0,
            'Tree Contact': 0,
            'Forest Fire': 0,
            'Equipment Failure': 0,
            Other: 0
          };
        }
        lineCounts[lineId]++;

        // Categorize fault type
        const faultType = inc.fault_type;
        if (faultType === 'Lightning') {
          lineFaultTypes[lineId].Lightning++;
        } else if (faultType === 'Tree Contact') {
          lineFaultTypes[lineId]['Tree Contact']++;
        } else if (faultType === 'Forest Fire') {
          lineFaultTypes[lineId]['Forest Fire']++;
        } else if (faultType === 'Equipment Failure') {
          lineFaultTypes[lineId]['Equipment Failure']++;
        } else {
          lineFaultTypes[lineId].Other++;
        }
      });

      // Combine with line data
      const linesWithCounts = linesData.map(line => ({
        ...line,
        incidentCount: lineCounts[line.id] || 0,
        faultTypes: lineFaultTypes[line.id] || {
          Lightning: 0,
          'Tree Contact': 0,
          'Forest Fire': 0,
          'Equipment Failure': 0,
          Other: 0
        }
      }));

      // Sort and get top 10
      const sorted = linesWithCounts
        .filter(line => line.incidentCount > 0)
        .sort((a, b) => b.incidentCount - a.incidentCount)
        .slice(0, 10);

      setTopLines(sorted);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (topLines.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-red-600 mb-2">
          TOP 10 LINES CONTRIBUTING IN LAST 3 FIN YEARS
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          पिछले 3 वित्तीय वर्षों में योगदान देने वाली शीर्ष 10 लाइनें
        </p>
        <p className="text-gray-500">No incident data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <h2 className="text-xl font-bold text-red-600 mb-2">
        TOP 10 LINES CONTRIBUTING IN LAST 3 FIN YEARS
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        पिछले 3 वित्तीय वर्षों में योगदान देने वाली शीर्ष 10 लाइनें
      </p>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded">
        <div className="flex items-center space-x-2">
          <div className="text-2xl">⚡</div>
          <div>
            <div className="font-semibold text-sm">LIGHTNING</div>
            <div className="text-xs text-gray-600">बिजली</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-2xl">🌳</div>
          <div>
            <div className="font-semibold text-sm">VEGETATION</div>
            <div className="text-xs text-gray-600">वनस्पति</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-2xl">🔥</div>
          <div>
            <div className="font-semibold text-sm">FOREST FIRE</div>
            <div className="text-xs text-gray-600">जंगल की आग</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-2xl">⚙️</div>
          <div>
            <div className="font-semibold text-sm">HARDWARE FAULT</div>
            <div className="text-xs text-gray-600">हार्डवेयर खराबी</div>
          </div>
        </div>
      </div>

      {/* Lines Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Transmission Line
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                Total
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                ⚡
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                🌳
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                🔥
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                ⚙️
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {topLines.map((line, index) => (
              <tr key={line.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' :
                      'bg-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-semibold text-gray-900">
                    {line.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {line.voltage_level} • {line.state_name}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-800 font-bold">
                    {line.incidentCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${line.faultTypes.Lightning > 0 ? 'text-yellow-600' : 'text-gray-300'}`}>
                    {line.faultTypes.Lightning}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${line.faultTypes['Tree Contact'] > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                    {line.faultTypes['Tree Contact']}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${line.faultTypes['Forest Fire'] > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                    {line.faultTypes['Forest Fire']}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${line.faultTypes['Equipment Failure'] > 0 ? 'text-gray-700' : 'text-gray-300'}`}>
                    {line.faultTypes['Equipment Failure']}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopContributingLines;
