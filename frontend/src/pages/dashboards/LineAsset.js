import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../../services/api';

const LineAsset = () => {
  const [voltageDistribution, setVoltageDistribution] = useState([]);
  const [assetAge, setAssetAge] = useState([]);
  const [officeDistribution, setOfficeDistribution] = useState([]);

  useEffect(() => {
    fetchAssetData();
  }, []);

  const fetchAssetData = async () => {
    try {
      const stats = await api.getDashboardStats();
      
      // Voltage distribution - map correctly
      const voltageData = stats.voltage_breakdown.map(item => ({
        name: item.voltage,
        value: item.count,
        km: item.km || 0  // Now this will have the km value
      }));
      setVoltageDistribution(voltageData);
      
      // Asset age (simulated - would need commission_date calculation)
      const lines = await api.getTransmissionLines({});
      const ageGroups = { '<30': 0, '30-35': 0, '>35': 0 };
      lines.forEach(line => {
        const age = new Date().getFullYear() - new Date(line.commission_date).getFullYear();
        if (age < 30) ageGroups['<30']++;
        else if (age <= 35) ageGroups['30-35']++;
        else ageGroups['>35']++;
      });
      
      setAssetAge([
        { name: '< 30 Years', value: ageGroups['<30'] },
        { name: '30-35 Years', value: ageGroups['30-35'] },
        { name: '> 35 Years', value: ageGroups['>35'] }
      ]);

      // Office distribution
      const offices = await api.getMaintenanceOffices();
      const officeMap = {};
      lines.forEach(line => {
        officeMap[line.maintenance_office_name] = (officeMap[line.maintenance_office_name] || 0) + 1;
      });
      
      const officeData = Object.entries(officeMap).map(([name, count]) => ({
        office: name,
        lines: count
      })).sort((a, b) => b.lines - a.lines).slice(0, 10);
      
      setOfficeDistribution(officeData);
    } catch (err) {
      console.error('Failed to fetch asset data:', err);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold">LINE ASSET OVERVIEW</h1>
        <p className="text-sm opacity-90">Comprehensive analysis of transmission line assets</p>
      </div>

      {/* Voltage Level Distribution */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Number of Lines in NER: Voltage Distribution</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={voltageDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {voltageDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-3">
            {voltageDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded mr-3"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-700">{item.value} lines</div>
                  <div className="text-sm text-gray-500">{(item.km || 0).toFixed(2)} km</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Asset Age Distribution */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">NER Asset Age Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={assetAge}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#10B981" name="Number of Lines" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Office Distribution */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Number of Lines in Each Maintenance Office</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={officeDistribution} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="office" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="lines" fill="#3B82F6" name="Number of Lines" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LineAsset;
