import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TowerLocations = () => {
  const [towers, setTowers] = useState([]);
  const [filteredTowers, setFilteredTowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedTower, setSelectedTower] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [filters, setFilters] = useState({
    line_id: '',
    voltage_level: '',
    foundation_type: ''
  });

  const [formData, setFormData] = useState({
    line_id: '',
    tower_number: '',
    latitude: '',
    longitude: '',
    foundation_type: '',
    tower_type: '',
    height_meters: '',
    installation_date: '',
    last_inspection_date: '',
    condition: 'Good',
    remarks: ''
  });

  const [lines, setLines] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, towers]);

  const fetchData = async () => {
    try {
      const [towersData, linesData] = await Promise.all([
        api.getTowerLocations({}),
        api.getTransmissionLineIds()
      ]);
      setTowers(towersData);
      setFilteredTowers(towersData);
      setLines(linesData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...towers];

    if (filters.line_id) {
      filtered = filtered.filter(tower => tower.line_id === parseInt(filters.line_id));
    }

    if (filters.voltage_level) {
      filtered = filtered.filter(tower => tower.voltage_level === filters.voltage_level);
    }

    if (filters.foundation_type) {
      filtered = filtered.filter(tower => tower.foundation_type === filters.foundation_type);
    }

    setFilteredTowers(filtered);
  };

  const handleAdd = () => {
    if (!isAdmin) {
      alert('Only administrators can add new tower locations.');
      return;
    }
    setEditMode(false);
    setSelectedTower(null);
    setFormData({
      line_id: '',
      tower_number: '',
      latitude: '',
      longitude: '',
      foundation_type: '',
      tower_type: '',
      height_meters: '',
      installation_date: '',
      last_inspection_date: '',
      condition: 'Good',
      remarks: ''
    });
    setShowModal(true);
  };

  const handleEdit = (tower) => {
    if (!isAdmin) {
      alert('Only administrators can edit tower locations.');
      return;
    }
    setEditMode(true);
    setSelectedTower(tower);
    setFormData({
      line_id: tower.line_id,
      tower_number: tower.tower_number,
      latitude: tower.latitude,
      longitude: tower.longitude,
      foundation_type: tower.foundation_type,
      tower_type: tower.tower_type,
      height_meters: tower.height_meters,
      installation_date: tower.installation_date,
      last_inspection_date: tower.last_inspection_date,
      condition: tower.condition,
      remarks: tower.remarks || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (towerId) => {
    if (!isAdmin) {
      alert('Only administrators can delete tower locations.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this tower location? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteTowerLocation(towerId);
      alert('Tower location deleted successfully!');
      fetchData();
    } catch (err) {
      alert('Failed to delete tower location: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      alert('Only administrators can modify tower locations.');
      return;
    }

    try {
      if (editMode) {
        await api.updateTowerLocation(selectedTower.id, formData);
        alert('Tower location updated successfully!');
      } else {
        await api.createTowerLocation(formData);
        alert('Tower location created successfully!');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert('Failed to save tower location: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleViewOnMap = (tower) => {
    window.open(`https://maps.google.com/?q=${tower.latitude},${tower.longitude}`, '_blank');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Line Name',
      'Tower Number',
      'Latitude',
      'Longitude',
      'Foundation Type',
      'Tower Type',
      'Height (m)',
      'Installation Date',
      'Last Inspection Date',
      'Condition',
      'Remarks'
    ];

    const csvData = filteredTowers.map(tower => [
      tower.line_name,
      tower.tower_number,
      tower.latitude,
      tower.longitude,
      tower.foundation_type,
      tower.tower_type,
      tower.height_meters,
      tower.installation_date,
      tower.last_inspection_date || '',
      tower.condition,
      tower.remarks || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `tower_locations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import from CSV
  const handleImportCSV = () => {
    if (!isAdmin) {
      alert('Only administrators can import tower locations.');
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
      alert('Only administrators can import tower locations.');
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

          const towerData = {
            line_id: line.id,
            tower_number: row[1],
            latitude: parseFloat(row[2]),
            longitude: parseFloat(row[3]),
            foundation_type: row[4],
            tower_type: row[5],
            height_meters: parseFloat(row[6]),
            installation_date: row[7],
            last_inspection_date: row[8] || null,
            condition: row[9] || 'Good',
            remarks: row[10] || ''
          };

          try {
            await api.createTowerLocation(towerData);
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
      ['Line Name', 'Tower Number', 'Latitude', 'Longitude', 'Foundation Type', 'Tower Type', 'Height (m)', 'Installation Date', 'Last Inspection Date', 'Condition', 'Remarks'],
      ['400 KV SILCHAR-IMPHAL', 'T001', '25.578827', '91.893276', 'Four Pile', 'Suspension', '45.5', '2020-01-15', '2024-11-20', 'Good', 'Sample tower'],
      ['220 KV MISA-DIMAPUR', 'T050', '25.904026', '93.719696', 'Single Pile', 'Tension', '38.2', '2019-06-20', '2024-10-15', 'Good', 'Test tower']
    ];

    const csvContent = sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'tower_locations_sample.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="text-center p-8">Loading tower locations...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-red-600 text-white rounded-lg shadow-xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">TOWER LOCATIONS</h1>
            <p className="text-sm opacity-90">टावर स्थान - Tower Location Management</p>
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
                className="bg-white text-pink-600 px-6 py-3 rounded-lg font-semibold hover:bg-pink-50 transition-all flex items-center space-x-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add New Tower</span>
              </button>
            )}
          </div>
        </div>
        {!isAdmin && (
          <div className="mt-4 bg-yellow-400 bg-opacity-20 border border-yellow-300 rounded p-3">
            <p className="text-sm">
              ⚠️ You are viewing in read-only mode. Contact an administrator to add or modify tower locations.
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Foundation Type</label>
            <select
              value={filters.foundation_type}
              onChange={(e) => setFilters({ ...filters, foundation_type: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All Foundation Types</option>
              <option value="Single Pile">Single Pile</option>
              <option value="Four Pile">Four Pile</option>
              <option value="RCC">RCC</option>
              <option value="Steel Lattice">Steel Lattice</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ line_id: '', voltage_level: '', foundation_type: '' })}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Towers</div>
          <div className="text-3xl font-bold text-pink-600">{filteredTowers.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Avg Height</div>
          <div className="text-3xl font-bold text-blue-600">
            {(filteredTowers.reduce((sum, tower) => sum + (tower.height_meters || 0), 0) / filteredTowers.length || 0).toFixed(2)} m
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Good Condition</div>
          <div className="text-3xl font-bold text-green-600">
            {filteredTowers.filter(tower => tower.condition === 'Good').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Needs Attention</div>
          <div className="text-3xl font-bold text-yellow-600">
            {filteredTowers.filter(tower => tower.condition === 'Needs Inspection').length}
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
                <th>Line Name</th>
                <th>Tower #</th>
                <th>Voltage Level</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Foundation Type</th>
                <th>Height (m)</th>
                <th>Condition</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTowers.map((tower, index) => (
                <tr key={tower.id}>
                  <td>{index + 1}</td>
                  <td className="font-semibold">{tower.line_name}</td>
                  <td className="text-center font-bold text-blue-600">{tower.tower_number}</td>
                  <td className="text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      tower.voltage_level === '800 KV' ? 'bg-purple-100 text-purple-800' :
                      tower.voltage_level === '400 KV' ? 'bg-red-100 text-red-800' :
                      tower.voltage_level === '220 KV' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {tower.voltage_level}
                    </span>
                  </td>
                  <td className="text-right font-mono text-sm">{tower.latitude.toFixed(6)}</td>
                  <td className="text-right font-mono text-sm">{tower.longitude.toFixed(6)}</td>
                  <td>{tower.foundation_type}</td>
                  <td className="text-right">{tower.height_meters?.toFixed(2)}</td>
                  <td className="text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      tower.condition === 'Good' ? 'bg-green-100 text-green-800' :
                      tower.condition === 'Needs Inspection' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {tower.condition}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewOnMap(tower)}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="View on Map"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleEdit(tower)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(tower.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-pink-600 to-red-600 text-white p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold">
                {editMode ? 'Edit Tower Location' : 'Add New Tower Location'}
              </h2>
              <p className="text-sm opacity-90">
                {editMode ? 'टावर स्थान संपादित करें' : 'नया टावर स्थान जोड़ें'}
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
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Select Line</option>
                    {lines.map(line => (
                      <option key={line.id} value={line.id}>{line.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tower Number / टावर नंबर *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tower_number}
                    onChange={(e) => setFormData({ ...formData, tower_number: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                    placeholder="e.g., T001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Latitude / अक्षांश *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                    placeholder="e.g., 25.578827"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Longitude / देशांतर *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                    placeholder="e.g., 91.893276"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Foundation Type / फाउंडेशन प्रकार *
                  </label>
                  <select
                    required
                    value={formData.foundation_type}
                    onChange={(e) => setFormData({ ...formData, foundation_type: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Select Foundation Type</option>
                    <option value="Single Pile">Single Pile</option>
                    <option value="Four Pile">Four Pile</option>
                    <option value="RCC">RCC</option>
                    <option value="Steel Lattice">Steel Lattice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tower Type / टावर प्रकार *
                  </label>
                  <select
                    required
                    value={formData.tower_type}
                    onChange={(e) => setFormData({ ...formData, tower_type: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Select Tower Type</option>
                    <option value="Suspension">Suspension</option>
                    <option value="Tension">Tension</option>
                    <option value="Angle">Angle</option>
                    <option value="Dead End">Dead End</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Height (meters) / ऊंचाई *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.height_meters}
                    onChange={(e) => setFormData({ ...formData, height_meters: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                    placeholder="e.g., 45.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Installation Date / स्थापना तिथि *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.installation_date}
                    onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Inspection Date / अंतिम निरीक्षण
                  </label>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={formData.last_inspection_date}
                    onChange={(e) => setFormData({ ...formData, last_inspection_date: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Condition / स्थिति *
                  </label>
                  <select
                    required
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="Good">Good</option>
                    <option value="Needs Inspection">Needs Inspection</option>
                    <option value="Under Repair">Under Repair</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Remarks / टिप्पणी
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
                    rows="3"
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
                  className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                >
                  {editMode ? 'Update Tower' : 'Add Tower'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold">Import Tower Locations from CSV</h2>
              <p className="text-sm opacity-90">CSV से टावर स्थान आयात करें</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Instructions */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <h3 className="font-bold text-blue-900 mb-2">📋 CSV Format Instructions:</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>CSV must have headers: Line Name, Tower Number, Latitude, Longitude, Foundation Type, Tower Type, Height (m), Installation Date, Last Inspection Date, Condition, Remarks</li>
                  <li>Line Name must match exactly with existing transmission lines</li>
                  <li>Date format: YYYY-MM-DD (e.g., 2020-01-15)</li>
                  <li>Foundation Type: Single Pile, Four Pile, RCC, or Steel Lattice</li>
                  <li>Tower Type: Suspension, Tension, Angle, or Dead End</li>
                  <li>Condition: Good, Needs Inspection, or Under Repair</li>
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

export default TowerLocations;
