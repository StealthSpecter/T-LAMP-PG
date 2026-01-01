import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../../services/api';

const AvailabilityGraph = () => {
  const [availabilityData, setAvailabilityData] = useState([]);
  const [selectedVoltage, setSelectedVoltage] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  useEffect(() => {
    fetchAvailabilityData();
  }, [selectedVoltage, selectedPeriod]);

  const fetchAvailabilityData = async () => {
    try {
      const params = {};
      if (selectedVoltage) params.voltage_level = selectedVoltage;

      const incidents = await api.getTrippingIncidents(params);
      const lines = await api.getTransmissionLines(params);

      // Calculate availability based on downtime
      // Availability = (Total Time - Downtime) / Total Time * 100
      // Assuming each fault causes 2 hours downtime on average
      
      if (selectedPeriod === 'monthly') {
        calculateMonthlyAvailability(incidents, lines);
      } else {
        calculateYearlyAvailability(incidents, lines);
      }
    } catch (err) {
      console.error('Failed to fetch availability data:', err);
    }
  };

  const calculateMonthlyAvailability = (incidents, lines) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const monthlyFaults = {};
    monthNames.forEach(month => monthlyFaults[month] = 0);

    incidents.forEach(incident => {
      const month = monthNames[new Date(incident.fault_date).getMonth()];
      monthlyFaults[month]++;
    });

    const data = monthNames.map(month => {
      const faults = monthlyFaults[month];
      // Assuming 2 hours downtime per fault, 730 hours in a month
      const availability = ((730 - (faults * 2)) / 730 * 100).toFixed(2);
      return {
        month,
        availability: parseFloat(availability),
        faults
      };
    });

    setAvailabilityData(data);
  };

  const calculateYearlyAvailability = (incidents, lines) => {
    const yearMap = {};
    incidents.forEach(incident => {
      const year = new Date(incident.fault_date).getFullYear();
      yearMap[year] = (yearMap[year] || 0) + 1;
    });

    const data = Object.keys(yearMap).sort().map(year => {
      const faults = yearMap[year];
      // Assuming 2 hours downtime per fault, 8760 hours in a year
      const availability = ((8760 - (faults * 2)) / 8760 * 100).toFixed(2);
      return {
        year: `FY ${year}`,
        availability: parseFloat(availability),
        faults
      };
    });

    setAvailabilityData(data);
  };

  const avgAvailability = availabilityData.length > 0
    ? (availabilityData.reduce((sum, d) => sum + d.availability, 0) / availabilityData.length).toFixed(2)
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold">AVAILABILITY GRAPH</h1>
        <p className="text-sm opacity-90">Transmission line availability and uptime analysis</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Voltage Level</label>
            <select
              value={selectedVoltage}
              onChange={(e) => setSelectedVoltage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All Voltage Levels</option>
              <option value="132 KV">132 kV</option>
              <option value="220 KV">220 kV</option>
              <option value="400 KV">400 kV</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Average Availability</div>
          <div className="text-3xl font-bold text-green-600">{avgAvailability}%</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Target Availability</div>
          <div className="text-3xl font-bold text-blue-600">99.5%</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Periods</div>
          <div className="text-3xl font-bold text-indigo-600">{availabilityData.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Status</div>
          <div className={`text-3xl font-bold ${avgAvailability >= 99.5 ? 'text-green-600' : 'text-yellow-600'}`}>
            {avgAvailability >= 99.5 ? '✓ On Track' : '⚠ Below Target'}
          </div>
        </div>
      </div>

      {/* Availability Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {selectedPeriod === 'monthly' ? 'Monthly' : 'Yearly'} Availability Trend
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={availabilityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={selectedPeriod === 'monthly' ? 'month' : 'year'} />
            <YAxis 
              domain={[95, 100]} 
              label={{ value: 'Availability (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="availability" 
              stroke="#10B981" 
              strokeWidth={3}
              name="Availability %"
              dot={{ r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey={() => 99.5} 
              stroke="#EF4444" 
              strokeDasharray="5 5"
              name="Target (99.5%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Availability Table */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Detailed Availability Data</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Availability (%)</th>
                <th>Total Faults</th>
                <th>Estimated Downtime (hrs)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {availabilityData.map((data, index) => (
                <tr key={index}>
                  <td className="font-semibold">
                    {selectedPeriod === 'monthly' ? data.month : data.year}
                  </td>
                  <td className="text-center">
                    <span className={`font-bold ${
                      data.availability >= 99.5 ? 'text-green-600' :
                      data.availability >= 98 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {data.availability}%
                    </span>
                  </td>
                  <td className="text-center">{data.faults}</td>
                  <td className="text-center">{data.faults * 2} hrs</td>
                  <td className="text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      data.availability >= 99.5 ? 'bg-green-100 text-green-800' :
                      data.availability >= 98 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {data.availability >= 99.5 ? 'Excellent' :
                       data.availability >= 98 ? 'Good' : 'Needs Attention'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Availability is calculated based on estimated downtime of 2 hours per fault. 
              Target availability for transmission lines is 99.5% as per NERTS standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityGraph;
