import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { api } from '../../services/api';

const TLPerformance = () => {
  const [performanceData, setPerformanceData] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState('');
  const [selectedVoltage, setSelectedVoltage] = useState('');
  const [selectedFaultType, setSelectedFaultType] = useState('');
  const [offices, setOffices] = useState([]);

  useEffect(() => {
    fetchOffices();
    fetchPerformanceData();
  }, []);

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedOffice, selectedVoltage, selectedFaultType]);

  const fetchOffices = async () => {
    try {
      const data = await api.getMaintenanceOffices();
      setOffices(data);
    } catch (err) {
      console.error('Failed to fetch offices:', err);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const params = {};
      if (selectedVoltage) params.voltage_level = selectedVoltage;
      if (selectedFaultType) params.fault_type = selectedFaultType;

      const incidents = await api.getTrippingIncidents(params);
      const lines = await api.getTransmissionLines({});
      
      // Group incidents by line
      const linePerformance = {};
      incidents.forEach(incident => {
        const lineName = incident.line_name;
        if (!linePerformance[lineName]) {
          linePerformance[lineName] = {
            line: lineName,
            voltage: incident.voltage_level,
            totalFaults: 0,
            faultTypes: {}
          };
        }
        linePerformance[lineName].totalFaults++;
        linePerformance[lineName].faultTypes[incident.fault_type] = 
          (linePerformance[lineName].faultTypes[incident.fault_type] || 0) + 1;
      });

      const data = Object.values(linePerformance)
        .sort((a, b) => b.totalFaults - a.totalFaults)
        .slice(0, 15); // Top 15 lines

      setPerformanceData(data);
    } catch (err) {
      console.error('Failed to fetch performance data:', err);
    }
  };

  const faultTypeColors = {
    'LIGHTNING': '#F59E0B',
    'VEGETATION': '#10B981',
    'HARDWARE FAULT': '#EF4444',
    'OTHER UTILITIES': '#8B5CF6',
    'TLAM VERIFICATION PENDING': '#EC4899'
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold">TL OFFICE PERFORMANCE</h1>
        <p className="text-sm opacity-90">Performance analysis of transmission lines by office and fault type</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fault Period</label>
            <select className="w-full p-2 border border-gray-300 rounded">
              <option>Last 3 FY Years</option>
              <option>Last 5 FY Years</option>
              <option>Current FY</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">TL Office</label>
            <select
              value={selectedOffice}
              onChange={(e) => setSelectedOffice(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">-- Select TL Office --</option>
              {offices.map((office) => (
                <option key={office.id} value={office.name}>
                  {office.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Voltage Level</label>
            <select
              value={selectedVoltage}
              onChange={(e) => setSelectedVoltage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">-- Select Voltage Level --</option>
              <option value="132 KV">132 kV</option>
              <option value="220 KV">220 kV</option>
              <option value="400 KV">400 kV</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type of Fault</label>
            <select
              value={selectedFaultType}
              onChange={(e) => setSelectedFaultType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">-- Select Type of Fault --</option>
              <option value="LIGHTNING">Lightning</option>
              <option value="VEGETATION">Vegetation</option>
              <option value="HARDWARE FAULT">Hardware Fault</option>
              <option value="OTHER UTILITIES">Other Utilities</option>
            </select>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Line Performance - Fault Count</h2>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart data={performanceData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="line" type="category" width={200} />
            <Tooltip />
            <Legend />
            {Object.keys(faultTypeColors).map(faultType => (
              <Bar 
                key={faultType}
                dataKey={`faultTypes.${faultType}`}
                stackId="a"
                fill={faultTypeColors[faultType]}
                name={faultType}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Performers Table */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Top 10 Lines by Fault Count</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Line Name</th>
                <th>Voltage Level</th>
                <th>Total Faults</th>
                <th>Most Common Fault</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.slice(0, 10).map((line, index) => {
                const mostCommonFault = Object.entries(line.faultTypes)
                  .sort((a, b) => b[1] - a[1])[0];
                
                return (
                  <tr key={index}>
                    <td className="text-center font-bold">{index + 1}</td>
                    <td className="font-semibold">{line.line}</td>
                    <td className="text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        line.voltage === '400 KV' ? 'bg-red-100 text-red-800' :
                        line.voltage === '220 KV' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {line.voltage}
                      </span>
                    </td>
                    <td className="text-center font-bold text-red-600">{line.totalFaults}</td>
                    <td className="text-center">{mostCommonFault ? mostCommonFault[0] : '-'}</td>
                    <td className="text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        line.totalFaults > 15 ? 'bg-red-100 text-red-800' :
                        line.totalFaults > 10 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {line.totalFaults > 15 ? 'Critical' : line.totalFaults > 10 ? 'Warning' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Lines Analyzed</div>
          <div className="text-3xl font-bold text-indigo-600">{performanceData.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Faults</div>
          <div className="text-3xl font-bold text-red-600">
            {performanceData.reduce((sum, line) => sum + line.totalFaults, 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Average Faults/Line</div>
          <div className="text-3xl font-bold text-yellow-600">
            {(performanceData.reduce((sum, line) => sum + line.totalFaults, 0) / (performanceData.length || 1)).toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TLPerformance;
