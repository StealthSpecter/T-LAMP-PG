import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../../services/api';

const FaultTypes = () => {
  const [faultData, setFaultData] = useState([]);
  const [voltageData, setVoltageData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  useEffect(() => {
    fetchFaultData();
  }, [selectedPeriod]);

  const fetchFaultData = async () => {
    try {
      const incidents = await api.getTrippingIncidents({});
      processFaultTypes(incidents);
      processByVoltage(incidents);
    } catch (err) {
      console.error('Failed to fetch fault data:', err);
    }
  };

  const processFaultTypes = (incidents) => {
    const faultMap = {};
    incidents.forEach(incident => {
      const type = incident.fault_type || 'UNKNOWN';
      faultMap[type] = (faultMap[type] || 0) + 1;
    });

    const data = Object.keys(faultMap).map(type => ({
      name: type,
      value: faultMap[type]
    })).sort((a, b) => b.value - a.value);

    setFaultData(data);
  };

  const processByVoltage = (incidents) => {
    const voltageMap = {};
    incidents.forEach(incident => {
      const voltage = incident.voltage_level || 'UNKNOWN';
      if (!voltageMap[voltage]) {
        voltageMap[voltage] = {};
      }
      const faultType = incident.fault_type || 'UNKNOWN';
      voltageMap[voltage][faultType] = (voltageMap[voltage][faultType] || 0) + 1;
    });

    const data = Object.keys(voltageMap).map(voltage => {
      const obj = { voltage };
      Object.keys(voltageMap[voltage]).forEach(fault => {
        obj[fault] = voltageMap[voltage][fault];
      });
      return obj;
    });

    setVoltageData(data);
  };

  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6'];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold">TYPE OF FAULT ANALYSIS</h1>
        <p className="text-sm opacity-90">Detailed breakdown of fault types across transmission lines</p>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Time Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="all">All Time</option>
            <option value="year">Last Year</option>
            <option value="month">Last Month</option>
            <option value="week">Last Week</option>
          </select>
        </div>
      </div>

      {/* Fault Type Distribution - Pie Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Fault Type Distribution</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={faultData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {faultData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2">
            <h3 className="font-bold text-lg mb-4">Fault Type Summary</h3>
            {faultData.map((fault, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded mr-3"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="font-medium">{fault.name}</span>
                </div>
                <span className="text-lg font-bold text-gray-700">{fault.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fault by Voltage Level - Stacked Bar */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Faults by Voltage Level</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={voltageData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="voltage" />
            <YAxis />
            <Tooltip />
            <Legend />
            {faultData.map((fault, index) => (
              <Bar key={fault.name} dataKey={fault.name} stackId="a" fill={COLORS[index % COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics Table */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Detailed Statistics</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fault Type</th>
                <th>Count</th>
                <th>Percentage</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {faultData.map((fault, index) => {
                const total = faultData.reduce((sum, f) => sum + f.value, 0);
                const percentage = ((fault.value / total) * 100).toFixed(1);
                return (
                  <tr key={index}>
                    <td className="font-semibold">{fault.name}</td>
                    <td className="text-center">{fault.value}</td>
                    <td className="text-center">{percentage}%</td>
                    <td className="text-center">
                      {index === 0 ? '↑ High' : index < 3 ? '→ Medium' : '↓ Low'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FaultTypes;
