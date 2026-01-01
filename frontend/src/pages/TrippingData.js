import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TrippingData = () => {
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [filters, setFilters] = useState({
    line_id: '',
    fault_type: '',
    voltage_level: '',
    attributed_to_powergrid: ''
  });

  const [formData, setFormData] = useState({
    line_id: '',
    fault_date: '',
    fault_time: '',
    fault_type: '',
    fault_location: '',
    affected_phases: '',
    restoration_time: '',
    downtime_minutes: '',
    attributed_to_powergrid: 'YES',
    root_cause: '',
    corrective_action: '',
    remarks: ''
  });

  const [lines, setLines] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, incidents]);

  const fetchData = async () => {
    try {
      const [incidentsData, linesData] = await Promise.all([
        api.getTrippingIncidents({}),
        api.getTransmissionLineIds()
      ]);
      setIncidents(incidentsData);
      setFilteredIncidents(incidentsData);
      setLines(linesData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...incidents];

    if (filters.line_id) {
      filtered = filtered.filter(incident => incident.line_id === parseInt(filters.line_id));
    }

    if (filters.fault_type) {
      filtered = filtered.filter(incident => incident.fault_type === filters.fault_type);
    }

    if (filters.voltage_level) {
      filtered = filtered.filter(incident => incident.voltage_level === filters.voltage_level);
    }

    if (filters.attributed_to_powergrid) {
      filtered = filtered.filter(incident => incident.attributed_to_powergrid === filters.attributed_to_powergrid);
    }

    setFilteredIncidents(filtered);
  };

  const handleAdd = () => {
    if (!isAdmin) {
      alert('Only administrators can add new tripping incidents.');
      return;
    }
    setEditMode(false);
    setSelectedIncident(null);
    setFormData({
      line_id: '',
      fault_date: '',
      fault_time: '',
      fault_type: '',
      fault_location: '',
      affected_phases: '',
      restoration_time: '',
      downtime_minutes: '',
      attributed_to_powergrid: 'YES',
      root_cause: '',
      corrective_action: '',
      remarks: ''
    });
    setShowModal(true);
  };

  const handleEdit = (incident) => {
    if (!isAdmin) {
      alert('Only administrators can edit tripping incidents.');
      return;
    }
    setEditMode(true);
    setSelectedIncident(incident);
    setFormData({
      line_id: incident.line_id,
      fault_date: incident.fault_date,
      fault_time: incident.fault_time,
      fault_type: incident.fault_type,
      fault_location: incident.fault_location,
      affected_phases: incident.affected_phases,
      restoration_time: incident.restoration_time,
      downtime_minutes: incident.downtime_minutes,
      attributed_to_powergrid: incident.attributed_to_powergrid,
      root_cause: incident.root_cause || '',
      corrective_action: incident.corrective_action || '',
      remarks: incident.remarks || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (incidentId) => {
    if (!isAdmin) {
      alert('Only administrators can delete tripping incidents.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this tripping incident? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteTrippingIncident(incidentId);
      alert('Tripping incident deleted successfully!');
      fetchData();
    } catch (err) {
      alert('Failed to delete tripping incident: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      alert('Only administrators can modify tripping incidents.');
      return;
    }

    try {
      if (editMode) {
        await api.updateTrippingIncident(selectedIncident.id, formData);
        alert('Tripping incident updated successfully!');
      } else {
        await api.createTrippingIncident(formData);
        alert('Tripping incident created successfully!');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert('Failed to save tripping incident: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Line Name',
      'Fault Date',
      'Fault Time',
      'Fault Type',
      'Fault Location',
      'Affected Phases',
      'Restoration Time',
      'Downtime (min)',
      'Attributed to PowerGrid',
      'Root Cause',
      'Corrective Action',
      'Remarks'
    ];

    const csvData = filteredIncidents.map(incident => [
      incident.line_name,
      incident.fault_date,
      incident.fault_time,
      incident.fault_type,
      incident.fault_location,
      incident.affected_phases,
      incident.restoration_time || '',
      incident.downtime_minutes,
      incident.attributed_to_powergrid,
      incident.root_cause || '',
      incident.corrective_action || '',
      incident.remarks || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `tripping_incidents_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import from CSV
  const handleImportCSV = () => {
    if (!isAdmin) {
      alert('Only administrators can import tripping incidents.');
      return;
    }
    setShowImportModal(true);
  };

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const processCSVImport = async () => {
    if (!csvFile) {
      alert('Please select a CSV file first.');
      return;
    }

    if (!isAdmin) {
      alert('Only administrators can import tripping incidents.');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const rows = text.split('\n').map(row => row.split(',').map(cell => cell.replace(/"/g, '').trim()));
        
        // Skip header row
        const dataRows = rows.slice(1).filter(row => row.length > 1 && row[0]);

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          
          // Find line_id
          const line = lines.find(l => l.name === row[0]);

          if (!line) {
            errors.push(`Row ${i + 2}: Invalid line name "${row[0]}"`);
            errorCount++;
            continue;
          }

          const incidentData = {
            line_id: line.id,
            fault_date: row[1],
            fault_time: row[2],
            fault_type: row[3],
            fault_location: row[4],
            affected_phases: row[5],
            restoration_time: row[6] || null,
            downtime_minutes: parseInt(row[7]),
            attributed_to_powergrid: row[8] || 'PENDING',
            root_cause: row[9] || '',
            corrective_action: row[10] || '',
            remarks: row[11] || ''
          };

          try {
            await api.createTrippingIncident(incidentData);
            successCount++;
          } catch (err) {
            errors.push(`Row ${i + 2}: ${err.response?.data?.detail || 'Failed to import'}`);
            errorCount++;
          }
        }

        setShowImportModal(false);
        setCsvFile(null);
        
        let message = `Import completed!\n\nSuccess: ${successCount}\nFailed: ${errorCount}`;
        if (errors.length > 0 && errors.length <= 5) {
          message += '\n\nErrors:\n' + errors.join('\n');
        }
        
        alert(message);
        fetchData();
      } catch (err) {
        alert('Failed to process CSV file: ' + err.message);
      }
    };

    reader.readAsText(csvFile);
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['Line Name', 'Fault Date', 'Fault Time', 'Fault Type', 'Fault Location', 'Affected Phases', 'Restoration Time', 'Downtime (min)', 'Attributed to PowerGrid', 'Root Cause', 'Corrective Action', 'Remarks'],
      ['400 KV SILCHAR-IMPHAL', '2024-11-20', '14:30:00', 'LIGHTNING', 'Tower #T125', 'R-Y-B', '16:45:00', '135', 'YES', 'Lightning strike during thunderstorm', 'Increased lightning arrestor capacity', 'Weather related'],
      ['220 KV MISA-DIMAPUR', '2024-11-15', '09:15:00', 'VEGETATION', 'Tower #T050', 'R-Y', '10:30:00', '75', 'YES', 'Tree branch contact', 'Vegetation clearing conducted', 'Monsoon season growth']
    ];

    const csvContent = sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'tripping_incidents_sample.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="text-center p-8">Loading tripping data...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg shadow-xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">TRIPPING DATA</h1>
            <p className="text-sm opacity-90">ट्रिपिंग डेटा - Transmission Line Tripping Incidents</p>
          </div>
          <div className="flex space-x-3">
            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all flex items-center space-x-2 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export CSV</span>
            </button>

            {/* Import Button */}
            {isAdmin && (
              <button
                onClick={handleImportCSV}
                className="bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-600 transition-all flex items-center space-x-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Import CSV</span>
              </button>
            )}

            {/* Add Button */}
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-all flex items-center space-x-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add New Incident</span>
              </button>
            )}
          </div>
        </div>
        {!isAdmin && (
          <div className="mt-4 bg-yellow-400 bg-opacity-20 border border-yellow-300 rounded p-3">
            <p className="text-sm">
              ⚠️ You are viewing in read-only mode. Contact an administrator to add or modify tripping incidents.
            </p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Filters / फ़िल्टर</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transmission Line</label>
            <select
              value={filters.line_id}
              onChange={(e) => setFilters({ ...filters, line_id: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All Lines</option>
              {lines.map(line => (
                <option key={line.id} value={line.id}>{line.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fault Type</label>
            <select
              value={filters.fault_type}
              onChange={(e) => setFilters({ ...filters, fault_type: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All Fault Types</option>
              <option value="LIGHTNING">Lightning</option>
              <option value="VEGETATION">Vegetation</option>
              <option value="HARDWARE FAULT">Hardware Fault</option>
              <option value="FOREST FIRE">Forest Fire</option>
              <option value="BIRD NEST">Bird Nest</option>
              <option value="OTHER UTILITIES">Other Utilities</option>
              <option value="OTHERS">Others</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Voltage Level</label>
            <select
              value={filters.voltage_level}
              onChange={(e) => setFilters({ ...filters, voltage_level: e.target.value })}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Attributed to PowerGrid</label>
            <select
              value={filters.attributed_to_powergrid}
              onChange={(e) => setFilters({ ...filters, attributed_to_powergrid: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All</option>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => setFilters({ line_id: '', fault_type: '', voltage_level: '', attributed_to_powergrid: '' })}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Incidents</div>
          <div className="text-3xl font-bold text-green-600">{filteredIncidents.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">PowerGrid Attributed</div>
          <div className="text-3xl font-bold text-red-600">
            {filteredIncidents.filter(i => i.attributed_to_powergrid === 'YES').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Non-PowerGrid</div>
          <div className="text-3xl font-bold text-blue-600">
            {filteredIncidents.filter(i => i.attributed_to_powergrid === 'NO').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Avg Downtime</div>
          <div className="text-3xl font-bold text-yellow-600">
            {(filteredIncidents.reduce((sum, i) => sum + (i.downtime_minutes || 0), 0) / filteredIncidents.length || 0).toFixed(0)} min
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">This Month</div>
          <div className="text-3xl font-bold text-purple-600">
            {filteredIncidents.filter(i => {
              const date = new Date(i.fault_date);
              const now = new Date();
              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }).length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>SI</th>
                <th>Date</th>
                <th>Time</th>
                <th>Line Name</th>
                <th>Voltage</th>
                <th>Fault Type</th>
                <th>Location</th>
                <th>Downtime</th>
                <th>Attributed to PG</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((incident, index) => (
                <tr key={incident.id}>
                  <td>{index + 1}</td>
                  <td>{new Date(incident.fault_date).toLocaleDateString('en-IN')}</td>
                  <td className="font-mono">{incident.fault_time}</td>
                  <td className="font-semibold">{incident.line_name}</td>
                  <td className="text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      incident.voltage_level === '800 KV' ? 'bg-purple-100 text-purple-800' :
                      incident.voltage_level === '400 KV' ? 'bg-red-100 text-red-800' :
                      incident.voltage_level === '220 KV' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {incident.voltage_level}
                    </span>
                  </td>
                  <td>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      incident.fault_type === 'LIGHTNING' ? 'bg-yellow-100 text-yellow-800' :
                      incident.fault_type === 'VEGETATION' ? 'bg-green-100 text-green-800' :
                      incident.fault_type === 'HARDWARE FAULT' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {incident.fault_type}
                    </span>
                  </td>
                  <td>{incident.fault_location}</td>
                  <td className="text-right">{incident.downtime_minutes} min</td>
                  <td className="text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      incident.attributed_to_powergrid === 'YES' ? 'bg-red-100 text-red-800' :
                      incident.attributed_to_powergrid === 'NO' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {incident.attributed_to_powergrid}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(incident)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(incident.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold">
                {editMode ? 'Edit Tripping Incident' : 'Add New Tripping Incident'}
              </h2>
              <p className="text-sm opacity-90">
                {editMode ? 'ट्रिपिंग घटना संपादित करें' : 'नई ट्रिपिंग घटना जोड़ें'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Transmission Line / ट्रांसमिशन लाइन *
                  </label>
                  <select
                    required
                    value={formData.line_id}
                    onChange={(e) => setFormData({ ...formData, line_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Line</option>
                    {lines.map(line => (
                      <option key={line.id} value={line.id}>{line.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fault Date / फॉल्ट तिथि *
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={formData.fault_date}
                    onChange={(e) => setFormData({ ...formData, fault_date: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fault Time / फॉल्ट समय *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.fault_time}
                    onChange={(e) => setFormData({ ...formData, fault_time: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fault Type / फॉल्ट प्रकार *
                  </label>
                  <select
                    required
                    value={formData.fault_type}
                    onChange={(e) => setFormData({ ...formData, fault_type: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Fault Type</option>
                    <option value="LIGHTNING">Lightning</option>
                    <option value="VEGETATION">Vegetation</option>
                    <option value="HARDWARE FAULT">Hardware Fault</option>
                    <option value="FOREST FIRE">Forest Fire</option>
                    <option value="BIRD NEST">Bird Nest</option>
                    <option value="OTHER UTILITIES">Other Utilities</option>
                    <option value="OTHERS">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fault Location / फॉल्ट स्थान *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fault_location}
                    onChange={(e) => setFormData({ ...formData, fault_location: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Tower #T125"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Affected Phases / प्रभावित फेज *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.affected_phases}
                    onChange={(e) => setFormData({ ...formData, affected_phases: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., R-Y-B or R-Y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Restoration Time / पुनर्स्थापना समय
                  </label>
                  <input
                    type="time"
                    value={formData.restoration_time}
                    onChange={(e) => setFormData({ ...formData, restoration_time: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Downtime (minutes) / डाउनटाइम *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.downtime_minutes}
                    onChange={(e) => setFormData({ ...formData, downtime_minutes: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., 120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Attributed to PowerGrid / पावरग्रिड को जिम्मेदार *
                  </label>
                  <select
                    required
                    value={formData.attributed_to_powergrid}
                    onChange={(e) => setFormData({ ...formData, attributed_to_powergrid: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                  >
                    <option value="YES">Yes</option>
                    <option value="NO">No</option>
                    <option value="PENDING">Pending Investigation</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Root Cause / मूल कारण
                  </label>
                  <textarea
                    value={formData.root_cause}
                    onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    rows="2"
                    placeholder="Detailed analysis of the fault cause..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Corrective Action / सुधारात्मक कार्रवाई
                  </label>
                  <textarea
                    value={formData.corrective_action}
                    onChange={(e) => setFormData({ ...formData, corrective_action: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    rows="2"
                    placeholder="Actions taken to prevent recurrence..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Remarks / टिप्पणी
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    rows="2"
                    placeholder="Additional information..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editMode ? 'Update Incident' : 'Add Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold">Import Tripping Incidents from CSV</h2>
              <p className="text-sm opacity-90">CSV से ट्रिपिंग घटनाएं आयात करें</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Instructions */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <h3 className="font-bold text-blue-900 mb-2">📋 CSV Format Instructions:</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>CSV must have headers: Line Name, Fault Date, Fault Time, Fault Type, Fault Location, Affected Phases, Restoration Time, Downtime (min), Attributed to PowerGrid, Root Cause, Corrective Action, Remarks</li>
                  <li>Line Name must match exactly with existing transmission lines</li>
                  <li>Date format: YYYY-MM-DD (e.g., 2024-11-20)</li>
                  <li>Time format: HH:MM:SS (e.g., 14:30:00)</li>
                  <li>Fault Type: LIGHTNING, VEGETATION, HARDWARE FAULT, FOREST FIRE, BIRD NEST, OTHER UTILITIES, OTHERS</li>
                  <li>Attributed to PowerGrid: YES, NO, or PENDING</li>
                </ul>
              </div>

              {/* Download Sample */}
              <div className="flex justify-center">
                <button
                  onClick={downloadSampleCSV}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select CSV File / CSV फ़ाइल चुनें
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                />
                {csvFile && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Selected: {csvFile.name}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvFile(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={processCSVImport}
                  disabled={!csvFile}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrippingData;
