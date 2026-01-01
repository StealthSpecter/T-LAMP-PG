import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../../services/api';

const OfficeLines = () => {
  const [officeData, setOfficeData] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [states, setStates] = useState([]);

  useEffect(() => {
    fetchStates();
    fetchOfficeData();
  }, []);

  const fetchStates = async () => {
    try {
      const data = await api.getStates();
      setStates(data);
    } catch (err) {
      console.error('Failed to fetch states:', err);
    }
  };

  const fetchOfficeData = async () => {
    try {
      const offices = await api.getMaintenanceOffices();
      const lines = await api.getTransmissionLines({});
      
      const officeMap = {};
      offices.forEach(office => {
        officeMap[office.name] = {
          office: office.name,
          location: office.location,
          lineCount: 0,
          totalKm: 0,
          lines: []
        };
      });

      lines.forEach(line => {
        const officeName = line.maintenance_office_name;
        if (officeMap[officeName]) {
          officeMap[officeName].lineCount++;
          officeMap[officeName].totalKm += line.total_length_km || 0;
          officeMap[officeName].lines.push(line);
        }
      });

      const data = Object.values(officeMap).sort((a, b) => b.lineCount - a.lineCount);
      setOfficeData(data);
    } catch (err) {
      console.error('Failed to fetch office data:', err);
    }
  };

  const filteredData = selectedState
    ? officeData.filter(office => office.location === selectedState)
    : officeData;

  const totalLines = filteredData.reduce((sum, office) => sum + office.lineCount, 0);
  const totalKm = filteredData.reduce((sum, office) => sum + office.totalKm, 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold">TL OFFICE LINE KM JURISDICTION</h1>
        <p className="text-sm opacity-90">Lines under each maintenance office</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Maintenance Offices</div>
          <div className="text-3xl font-bold text-teal-600">{filteredData.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Lines</div>
          <div className="text-3xl font-bold text-blue-600">{totalLines}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Line KM</div>
          <div className="text-3xl font-bold text-green-600">{totalKm.toFixed(2)} km</div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by State</label>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="w-full md:w-64 p-2 border border-gray-300 rounded"
        >
          <option value="">-- Select State --</option>
          {states.map((state) => (
            <option key={state.id} value={state.name}>
              {state.name}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Lines per Office</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="office" angle={-45} textAnchor="end" height={150} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="lineCount" fill="#14B8A6" name="Number of Lines" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Detailed Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>SI</th>
                <th>Maintenance Office</th>
                <th>Location</th>
                <th>Number of Lines</th>
                <th>Total KM</th>
                <th>Avg KM per Line</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((office, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className="font-semibold">{office.office}</td>
                  <td>{office.location}</td>
                  <td className="text-center font-bold text-blue-600">{office.lineCount}</td>
                  <td className="text-right">{office.totalKm.toFixed(2)} km</td>
                  <td className="text-right">{(office.totalKm / office.lineCount).toFixed(2)} km</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td colSpan="3">Grand Total:</td>
                <td className="text-center text-blue-600">{totalLines}</td>
                <td className="text-right text-green-600">{totalKm.toFixed(2)} km</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OfficeLines;
