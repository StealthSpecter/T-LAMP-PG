import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LineDetails = () => {
  const [lines, setLines] = useState([]);
  const [filteredLines, setFilteredLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [filters, setFilters] = useState({
    voltage_level: '',
    state: '',
    status: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    voltage_level: '',
    total_length_km: '',
    commission_date: '',
    state_id: '',
    maintenance_office_id: '',
    status: 'Active',
    remarks: ''
  });

  const [states, setStates] = useState([]);
  const [offices, setOffices] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, lines]);

  const fetchData = async () => {
    try {
      const [linesData, statesData, officesData] = await Promise.all([
        api.getTransmissionLines({}),
        api.getStates(),
        api.getMaintenanceOffices()
      ]);
      setLines(linesData);
      setFilteredLines(linesData);
      setStates(statesData);
      setOffices(officesData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...lines];

    if (filters.voltage_level) {
      filtered = filtered.filter(line => line.voltage_level === filters.voltage_level);
    }

    if (filters.state) {
      filtered = filtered.filter(line => line.state_name === filters.state);
    }

    if (filters.status) {
      filtered = filtered.filter(line => line.status === filters.status);
    }

    setFilteredLines(filtered);
  };

  const handleAdd = () => {
    if (!isAdmin) {
      alert('Only administrators can add new transmission lines.');
      return;
    }
    setEditMode(false);
    setSelectedLine(null);
    setFormData({
      name: '',
      voltage_level: '',
      total_length_km: '',
      commission_date: '',
      state_id: '',
      maintenance_office_id: '',
      status: 'Active',
      remarks: ''
    });
    setShowModal(true);
  };

  const handleEdit = (line) => {
    if (!isAdmin) {
      alert('Only administrators can edit transmission lines.');
      return;
    }
    setEditMode(true);
    setSelectedLine(line);
    setFormData({
      name: line.name,
      voltage_level: line.voltage_level,
      total_length_km: line.total_length_km,
      commission_date: line.commission_date,
      state_id: line.state_id,
      maintenance_office_id: line.maintenance_office_id,
      status: line.status,
      remarks: line.remarks || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (lineId) => {
    if (!isAdmin) {
      alert('Only administrators can delete transmission lines.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this transmission line? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteTransmissionLine(lineId);
      alert('Transmission line deleted successfully!');
      fetchData();
    } catch (err) {
      alert('Failed to delete transmission line: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      alert('Only administrators can modify transmission lines.');
      return;
    }

    try {
      if (editMode) {
        await api.updateTransmissionLine(selectedLine.id, formData);
        alert('Transmission line updated successfully!');
      } else {
        await api.createTransmissionLine(formData);
        alert('Transmission line created successfully!');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert('Failed to save transmission line: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Line Name',
      'Voltage Level',
      'Length (km)',
      'State',
      'Maintenance Office',
      'Commission Date',
      'Status',
      'Remarks'
    ];

    const csvData = filteredLines.map(line => [
      line.name,
      line.voltage_level,
      line.total_length_km,
      line.state_name,
      line.maintenance_office_name,
      line.commission_date,
      line.status,
      line.remarks || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `transmission_lines_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import from CSV
  const handleImportCSV = () => {
    if (!isAdmin) {
      alert('Only administrators can import transmission lines.');
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
      alert('Only administrators can import transmission lines.');
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
          
          // Find state_id
          const state = states.find(s => s.name === row[3]);
          const office = offices.find(o => o.name === row[4]);

          if (!state || !office) {
            errors.push(`Row ${i + 2}: Invalid state or office name`);
            errorCount++;
            continue;
          }

          const lineData = {
            name: row[0],
            voltage_level: row[1],
            total_length_km: parseFloat(row[2]),
            state_id: state.id,
            maintenance_office_id: office.id,
            commission_date: row[5],
            status: row[6] || 'Active',
            remarks: row[7] || ''
          };

          try {
            await api.createTransmissionLine(lineData);
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
      ['Line Name', 'Voltage Level', 'Length (km)', 'State', 'Maintenance Office', 'Commission Date', 'Status', 'Remarks'],
      ['400 KV SAMPLE-LINE', '400 KV', '125.50', 'Assam', 'DIMAPUR', '2020-01-15', 'Active', 'Sample transmission line'],
      ['220 KV TEST-LINE', '220 KV', '85.30', 'Meghalaya', 'SHILLONG', '2019-06-20', 'Active', 'Test line for import']
    ];

    const csvContent = sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'transmission_lines_sample.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="text-center p-8">Loading line details...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">LINE DETAILS</h1>
            <p className="text-sm opacity-90">लाइन विवरण - Transmission Line Information</p>
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
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center space-x-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add New Line</span>
              </button>
            )}
          </div>
        </div>
        {!isAdmin && (
          <div className="mt-4 bg-yellow-400 bg-opacity-20 border border-yellow-300 rounded p-3">
            <p className="text-sm">
              ⚠️ You are viewing in read-only mode. Contact an administrator to add or modify transmission lines.
            </p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Filters / फ़िल्टर</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <select
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All States</option>
              {states.map(state => (
                <option key={state.id} value={state.name}>{state.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ voltage_level: '', state: '', status: '' })}
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
          <div className="text-sm text-gray-600 mb-1">Total Lines</div>
          <div className="text-3xl font-bold text-blue-600">{filteredLines.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total KM</div>
          <div className="text-3xl font-bold text-green-600">
            {filteredLines.reduce((sum, line) => sum + (line.total_length_km || 0), 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Active Lines</div>
          <div className="text-3xl font-bold text-teal-600">
            {filteredLines.filter(line => line.status === 'Active').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Avg Length</div>
          <div className="text-3xl font-bold text-purple-600">
            {filteredLines.length > 0
              ? (filteredLines.reduce((sum, line) => sum + (line.total_length_km || 0), 0) / filteredLines.length).toFixed(2)
              : '0.00'
            } km
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
                <th>Voltage Level</th>
                <th>Length (km)</th>
                <th>State</th>
                <th>Maintenance Office</th>
                <th>Commission Date</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredLines.map((line, index) => (
                <tr key={line.id}>
                  <td>{index + 1}</td>
                  <td className="font-semibold">{line.name}</td>
                  <td className="text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      line.voltage_level === '800 KV' ? 'bg-purple-100 text-purple-800' :
                      line.voltage_level === '400 KV' ? 'bg-red-100 text-red-800' :
                      line.voltage_level === '220 KV' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {line.voltage_level}
                    </span>
                  </td>
                  <td className="text-right">{(line.total_length_km || 0).toFixed(2)}</td>
                  <td>{line.state_name}</td>
                  <td>{line.maintenance_office_name}</td>
                  <td className="text-center">{new Date(line.commission_date).toLocaleDateString('en-IN')}</td>
                  <td className="text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      line.status === 'Active' ? 'bg-green-100 text-green-800' :
                      line.status === 'Under Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {line.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(line)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(line.id)}
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
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold">
                {editMode ? 'Edit Transmission Line' : 'Add New Transmission Line'}
              </h2>
              <p className="text-sm opacity-90">
                {editMode ? 'ट्रांसमिशन लाइन संपादित करें' : 'नई ट्रांसमिशन लाइन जोड़ें'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Line Name / लाइन का नाम *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 400 KV SILCHAR-IMPHAL"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Voltage Level / वोल्टेज स्तर *
                  </label>
                  <select
                    required
                    value={formData.voltage_level}
                    onChange={(e) => setFormData({ ...formData, voltage_level: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Voltage Level</option>
                    <option value="132 KV">132 kV</option>
                    <option value="220 KV">220 kV</option>
                    <option value="400 KV">400 kV</option>
                    <option value="800 KV">800 kV</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Total Length (km) / कुल लंबाई *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.total_length_km}
                    onChange={(e) => setFormData({ ...formData, total_length_km: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 125.50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Commission Date / कमीशन तिथि *
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={formData.commission_date}
                    onChange={(e) => setFormData({ ...formData, commission_date: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    State / राज्य *
                  </label>
                  <select
                    required
                    value={formData.state_id}
                    onChange={(e) => setFormData({ ...formData, state_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state.id} value={state.id}>{state.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Maintenance Office / रखरखाव कार्यालय *
                  </label>
                  <select
                    required
                    value={formData.maintenance_office_id}
                    onChange={(e) => setFormData({ ...formData, maintenance_office_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Office</option>
                    {offices.map(office => (
                      <option key={office.id} value={office.id}>{office.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status / स्थिति *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Remarks / टिप्पणी
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editMode ? 'Update Line' : 'Add Line'}
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
              <h2 className="text-2xl font-bold">Import Transmission Lines from CSV</h2>
              <p className="text-sm opacity-90">CSV से ट्रांसमिशन लाइनें आयात करें</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Instructions */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <h3 className="font-bold text-blue-900 mb-2">📋 CSV Format Instructions:</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>CSV must have headers: Line Name, Voltage Level, Length (km), State, Maintenance Office, Commission Date, Status, Remarks</li>
                  <li>State and Maintenance Office names must match exactly with existing records</li>
                  <li>Date format: YYYY-MM-DD (e.g., 2020-01-15)</li>
                  <li>Voltage Level: 132 KV, 220 KV, 400 KV, or 800 KV</li>
                  <li>Status: Active, Under Maintenance, or Inactive</li>
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

export default LineDetails;
