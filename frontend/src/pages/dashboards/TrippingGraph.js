import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../../services/api';

const TrippingGraph = () => {
  const [yearlyData, setYearlyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [filters, setFilters] = useState({
    voltage_level: '',
    fault_type: ''
  });

  useEffect(() => {
    fetchTrippingData();
  }, [filters]);

  const fetchTrippingData = async () => {
    try {
      const incidents = await api.getTrippingIncidents(filters);
      processYearlyData(incidents);
      processMonthlyData(incidents);
    } catch (err) {
      console.error('Failed to fetch tripping data:', err);
    }
  };

  const processYearlyData = (incidents) => {
    const yearMap = {};
    incidents.forEach(incident => {
      const year = new Date(incident.fault_date).getFullYear();
      if (!yearMap[year]) {
        yearMap[year] = 0;
      }
      yearMap[year]++;
    });

    const data = Object.keys(yearMap).map(year => ({
      year: `FY ${year}-${parseInt(year) + 1}`,
      trippings: yearMap[year]
    })).sort((a, b) => a.year.localeCompare(b.year));

    setYearlyData(data);
  };

  const processMonthlyData = (incidents) => {
    const monthMap = {};
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    incidents.forEach(incident => {
      const date = new Date(incident.fault_date);
      const month = monthNames[date.getMonth()];
      if (!monthMap[month]) {
        monthMap[month] = 0;
      }
      monthMap[month]++;
    });

    const data = monthNames.map(month => ({
      month,
      trippings: monthMap[month] || 0
    }));

    setMonthlyData(data);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold">CUMULATIVE NERTS Tripping Graph</h1>
        <p className="text-sm opacity-90">Year-wise and Month-wise Analysis</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Voltage Level</label>
            <select
              value={filters.voltage_level}
              onChange={(e) => setFilters({...filters, voltage_level: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All Voltage Levels</option>
              <option value="132 KV">132 kV</option>
              <option value="220 KV">220 kV</option>
              <option value="400 KV">400 kV</option>
              <option value="800 KV">800 kV</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fault Type</label>
            <select
              value={filters.fault_type}
              onChange={(e) => setFilters({...filters, fault_type: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All Fault Types</option>
              <option value="LIGHTNING">Lightning</option>
              <option value="VEGETATION">Vegetation</option>
              <option value="HARDWARE FAULT">Hardware Fault</option>
              <option value="OTHER UTILITIES">Other Utilities</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ voltage_level: '', fault_type: '' })}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Yearly Data Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">YEARLY DATA</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={yearlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis label={{ value: 'NUMBER OF FAULTS', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="trippings" fill="#3B82F6" name="Trippings" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Data Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">MONTHLY DATA</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} />
            <YAxis label={{ value: 'NUMBER OF FAULTS', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="trippings" fill="#10B981" name="Trippings" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrippingGraph;
